const express = require('express');
const pool = require('../db');
const requireAuth = require('../middleware/auth');
const { QUESTION_SELECT } = require('../utils/questions');

const router = express.Router();

router.get('/users/:id', async (req, res) => {
  const result = await pool.query(
    `SELECT u.id, u.name, u.created_at,
            (SELECT COUNT(*)::int FROM questions q WHERE q.author_id = u.id) AS questions_count,
            (SELECT COUNT(*)::int FROM answers a WHERE a.author_id = u.id) AS answers_count,
            (SELECT COUNT(*)::int FROM answers a WHERE a.author_id = u.id AND a.is_accepted) AS accepted_count
     FROM users u
     WHERE u.id = $1`,
    [req.params.id]
  );
  const user = result.rows[0];
  if (!user) return res.status(404).json({ error: 'Користувача не знайдено' });

  const questions = await pool.query(
    QUESTION_SELECT + ' WHERE q.author_id = $1 ORDER BY q.created_at DESC',
    [user.id]
  );

  res.json({ ...user, questions: questions.rows });
});

router.put('/users/me', requireAuth, async (req, res) => {
  const { name } = req.body;
  if (!name || name.trim().length < 2) {
    return res.status(400).json({ error: "Ім'я має бути не менше 2 символів" });
  }

  const result = await pool.query(
    'UPDATE users SET name = $1 WHERE id = $2 RETURNING id, name, email, created_at',
    [name.trim(), req.userId]
  );
  res.json(result.rows[0]);
});

module.exports = router;