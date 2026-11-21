const express = require('express');
const pool = require('../db');
const requireAuth = require('../middleware/auth');
const { QUESTION_SELECT, validateQuestion, parseTags } = require('../utils/questions');
const { moderateAndSave, aiLimiter } = require('../ai/moderation');

const router = express.Router();

router.get('/questions', async (req, res) => {
  const { search, discipline, tag } = req.query;
  const conditions = [`q.moderation_status <> 'rejected'`];
  const params = [];

  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(q.title ILIKE $${params.length} OR q.body ILIKE $${params.length})`);
  }
  if (discipline) {
    params.push(discipline);
    conditions.push(`q.discipline = $${params.length}`);
  }
  if (tag) {
    params.push(tag);
    conditions.push(`$${params.length} = ANY(q.tags)`);
  }

  const where = ' WHERE ' + conditions.join(' AND ');
  const result = await pool.query(QUESTION_SELECT + where + ' ORDER BY q.created_at DESC', params);
  res.json(result.rows);
});

router.get('/tags', async (req, res) => {
  const result = await pool.query(
    `SELECT tag, COUNT(*)::int AS count
     FROM questions, unnest(tags) AS tag
     WHERE moderation_status <> 'rejected'
     GROUP BY tag
     ORDER BY count DESC, tag`
  );
  res.json(result.rows);
});

router.get('/disciplines', async (req, res) => {
  const result = await pool.query(
    `SELECT discipline, COUNT(*)::int AS count
     FROM questions
     WHERE moderation_status <> 'rejected'
     GROUP BY discipline
     ORDER BY discipline`
  );
  res.json(result.rows);
});

router.get('/questions/:id', async (req, res) => {
  const result = await pool.query(QUESTION_SELECT + ' WHERE q.id = $1', [req.params.id]);
  const question = result.rows[0];
  if (!question) return res.status(404).json({ error: 'Запитання не знайдено' });

  const answers = await pool.query(
    `SELECT a.*, u.name AS author_name
     FROM answers a
     JOIN users u ON u.id = a.author_id
     WHERE a.question_id = $1 AND a.moderation_status <> 'rejected'
     ORDER BY a.is_accepted DESC, a.created_at ASC`,
    [question.id]
  );

  res.json({ ...question, answers: answers.rows });
});

router.post('/questions', requireAuth, aiLimiter, async (req, res) => {
  const error = validateQuestion(req.body);
  if (error) return res.status(400).json({ error });

  const { title, body, discipline, tags } = req.body;

  const result = await pool.query(
    `INSERT INTO questions (title, body, discipline, author_id, tags, moderation_status)
     VALUES ($1, $2, $3, $4, $5, 'pending') RETURNING *`,
    [title.trim(), body.trim(), discipline.trim(), req.userId, parseTags(tags)]
  );
  const question = result.rows[0];

  const moderation = await moderateAndSave(req.userId, 'question', question.id, `${question.title}\n\n${question.body}`);

  if (moderation.verdict === 'rejected') {
    return res.status(422).json({ error: 'Запитання не пройшло модерацію', reason: moderation.reason });
  }

  res.status(201).json({ ...question, moderation_status: moderation.verdict, moderation });
});

router.put('/questions/:id', requireAuth, aiLimiter, async (req, res) => {
  const found = await pool.query('SELECT * FROM questions WHERE id = $1', [req.params.id]);
  const old = found.rows[0];

  if (!old) return res.status(404).json({ error: 'Запитання не знайдено' });
  if (old.author_id !== req.userId) {
    return res.status(403).json({ error: 'Редагувати можна лише власні запитання' });
  }

  const updated = {
    title: req.body.title ?? old.title,
    body: req.body.body ?? old.body,
    discipline: req.body.discipline ?? old.discipline,
  };
  const error = validateQuestion(updated);
  if (error) return res.status(400).json({ error });

  const tags = req.body.tags !== undefined ? parseTags(req.body.tags) : old.tags;

  const result = await pool.query(
    `UPDATE questions
     SET title = $1, body = $2, discipline = $3, tags = $4, updated_at = now()
     WHERE id = $5 RETURNING *`,
    [updated.title.trim(), updated.body.trim(), updated.discipline.trim(), tags, old.id]
  );
  const question = result.rows[0];

  const moderation = await moderateAndSave(req.userId, 'question', question.id, `${question.title}\n\n${question.body}`);

  if (moderation.verdict === 'rejected') {
    return res.status(422).json({ error: 'Запитання не пройшло модерацію', reason: moderation.reason });
  }

  res.json({ ...question, moderation_status: moderation.verdict, moderation });
});

router.delete('/questions/:id', requireAuth, async (req, res) => {
  const found = await pool.query('SELECT author_id FROM questions WHERE id = $1', [req.params.id]);
  const question = found.rows[0];

  if (!question) return res.status(404).json({ error: 'Запитання не знайдено' });
  if (question.author_id !== req.userId) {
    return res.status(403).json({ error: 'Видаляти можна лише власні запитання' });
  }

  await pool.query('DELETE FROM questions WHERE id = $1', [req.params.id]);
  res.status(204).end();
});

module.exports = router;