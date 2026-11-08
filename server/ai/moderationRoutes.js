const express = require('express');
const pool = require('../db');
const { TABLES } = require('./moderation');

module.exports = function (requireAuth) {
  const router = express.Router();

  async function requireModerator(req, res, next) {
    const { rows } = await pool.query('SELECT role FROM users WHERE id = $1', [req.userId]);
    if (!rows[0] || !['moderator', 'admin'].includes(rows[0].role)) {
      return res.status(403).json({ error: 'Доступ лише для модераторів' });
    }
    next();
  }

  // результат модерації для сторінки запитання (бейдж + причина)
  router.get('/questions/:id/moderation', async (req, res) => {
    const { rows } = await pool.query(
      `SELECT verdict, reason, confidence, manual_verdict, created_at
       FROM ai_requests WHERE target_type = 'question' AND target_id = $1
       ORDER BY created_at DESC LIMIT 1`,
      [req.params.id]
    );
    res.json(rows[0] || null);
  });

  // черга на ручну перевірку
  router.get('/moderation/pending', requireAuth, requireModerator, async (req, res) => {
    const { rows } = await pool.query(
      `SELECT r.id, r.target_type, r.target_id, r.verdict, r.reason, r.confidence,
              q.title, q.body
       FROM ai_requests r
       JOIN questions q ON r.target_type = 'question' AND q.id = r.target_id
       WHERE r.verdict = 'needs_review' AND r.manual_verdict IS NULL
       ORDER BY r.created_at`
    );
    res.json(rows);
  });

  // ручне коригування
  router.patch('/moderation/:id', requireAuth, requireModerator, async (req, res) => {
    const { verdict } = req.body;
    if (!['approved', 'rejected'].includes(verdict)) {
      return res.status(400).json({ error: 'verdict має бути approved або rejected' });
    }
    const { rows } = await pool.query(
      `UPDATE ai_requests SET manual_verdict = $1, reviewed_by = $2
       WHERE id = $3 RETURNING target_type, target_id`,
      [verdict, req.userId, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Запис не знайдено' });

    await pool.query(
      `UPDATE ${TABLES[rows[0].target_type]} SET moderation_status = $1 WHERE id = $2`,
      [verdict, rows[0].target_id]
    );
    res.json({ ok: true });
  });

  return router;
};
