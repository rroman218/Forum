const express = require('express');
const pool = require('../db');
const requireAuth = require('../middleware/auth');
const { moderateAndSave, aiLimiter } = require('../ai/moderation');

const router = express.Router();

router.post('/questions/:id/answers', requireAuth, aiLimiter, async (req, res) => {
  const { body } = req.body;
  if (!body || body.trim().length < 10) {
    return res.status(400).json({ error: 'Відповідь має бути не менше 10 символів' });
  }

  const q = await pool.query('SELECT id FROM questions WHERE id = $1', [req.params.id]);
  if (!q.rows[0]) return res.status(404).json({ error: 'Запитання не знайдено' });

  const result = await pool.query(
    `INSERT INTO answers (body, question_id, author_id, moderation_status)
     VALUES ($1, $2, $3, 'pending') RETURNING *`,
    [body.trim(), req.params.id, req.userId]
  );
  const answer = result.rows[0];

  const moderation = await moderateAndSave(req.userId, 'answer', answer.id, answer.body);

  if (moderation.verdict === 'rejected') {
    return res.status(422).json({ error: 'Відповідь не пройшла модерацію', reason: moderation.reason });
  }

  res.status(201).json({ ...answer, moderation_status: moderation.verdict, moderation });
});

router.put('/answers/:id', requireAuth, aiLimiter, async (req, res) => {
  const found = await pool.query('SELECT * FROM answers WHERE id = $1', [req.params.id]);
  const old = found.rows[0];

  if (!old) return res.status(404).json({ error: 'Відповідь не знайдено' });
  if (old.author_id !== req.userId) {
    return res.status(403).json({ error: 'Редагувати можна лише власні відповіді' });
  }

  const { body } = req.body;
  if (!body || body.trim().length < 10) {
    return res.status(400).json({ error: 'Відповідь має бути не менше 10 символів' });
  }

  const result = await pool.query(
    'UPDATE answers SET body = $1, updated_at = now() WHERE id = $2 RETURNING *',
    [body.trim(), old.id]
  );
  const answer = result.rows[0];

  const moderation = await moderateAndSave(req.userId, 'answer', answer.id, answer.body);

  if (moderation.verdict === 'rejected') {
    return res.status(422).json({ error: 'Відповідь не пройшла модерацію', reason: moderation.reason });
  }

  res.json({ ...answer, moderation_status: moderation.verdict, moderation });
});

router.delete('/answers/:id', requireAuth, async (req, res) => {
  const found = await pool.query('SELECT author_id FROM answers WHERE id = $1', [req.params.id]);
  const answer = found.rows[0];

  if (!answer) return res.status(404).json({ error: 'Відповідь не знайдено' });
  if (answer.author_id !== req.userId) {
    return res.status(403).json({ error: 'Видаляти можна лише власні відповіді' });
  }

  await pool.query('DELETE FROM answers WHERE id = $1', [req.params.id]);
  res.status(204).end();
});

router.post('/answers/:id/accept', requireAuth, async (req, res) => {
  const found = await pool.query(
    `SELECT a.id, a.question_id, a.is_accepted, q.author_id AS question_author
     FROM answers a
     JOIN questions q ON q.id = a.question_id
     WHERE a.id = $1`,
    [req.params.id]
  );
  const answer = found.rows[0];

  if (!answer) return res.status(404).json({ error: 'Відповідь не знайдено' });
  if (answer.question_author !== req.userId) {
    return res.status(403).json({ error: 'Позначати найкращу відповідь може лише автор запитання' });
  }

  if (answer.is_accepted) {
    const result = await pool.query(
      'UPDATE answers SET is_accepted = false WHERE id = $1 RETURNING *',
      [answer.id]
    );
    return res.json(result.rows[0]);
  }

  await pool.query('UPDATE answers SET is_accepted = false WHERE question_id = $1', [answer.question_id]);

  const result = await pool.query(
    'UPDATE answers SET is_accepted = true WHERE id = $1 RETURNING *',
    [answer.id]
  );
  res.json(result.rows[0]);
});

module.exports = router;