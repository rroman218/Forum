import { Router } from 'express';
import pool from '../db';
import requireAuth from '../middleware/auth';
import { moderateAndSave, aiLimiter } from '../ai/moderation';
import { AnswerRow } from '../types/models';

const router = Router();

router.post('/questions/:id/answers', requireAuth, aiLimiter, async (req, res) => {
  const { body } = req.body;
  if (!body || body.trim().length < 10) {
    res.status(400).json({ error: 'Відповідь має бути не менше 10 символів' });
    return;
  }

  const q = await pool.query('SELECT id FROM questions WHERE id = $1', [req.params.id]);
  if (!q.rows[0]) {
    res.status(404).json({ error: 'Запитання не знайдено' });
    return;
  }

  const result = await pool.query<AnswerRow>(
    `INSERT INTO answers (body, question_id, author_id, moderation_status)
     VALUES ($1, $2, $3, 'pending') RETURNING *`,
    [body.trim(), req.params.id, req.userId]
  );
  const answer = result.rows[0];

  const moderation = await moderateAndSave(req.userId!, 'answer', answer.id, answer.body);

  if (moderation.verdict === 'rejected') {
    res.status(422).json({ error: 'Відповідь не пройшла модерацію', reason: moderation.reason });
    return;
  }

  res.status(201).json({ ...answer, moderation_status: moderation.verdict, moderation });
});

router.put('/answers/:id', requireAuth, aiLimiter, async (req, res) => {
  const found = await pool.query<AnswerRow>('SELECT * FROM answers WHERE id = $1', [req.params.id]);
  const old = found.rows[0];

  if (!old) {
    res.status(404).json({ error: 'Відповідь не знайдено' });
    return;
  }
  if (old.author_id !== req.userId) {
    res.status(403).json({ error: 'Редагувати можна лише власні відповіді' });
    return;
  }

  const { body } = req.body;
  if (!body || body.trim().length < 10) {
    res.status(400).json({ error: 'Відповідь має бути не менше 10 символів' });
    return;
  }

  const result = await pool.query<AnswerRow>(
    'UPDATE answers SET body = $1, updated_at = now() WHERE id = $2 RETURNING *',
    [body.trim(), old.id]
  );
  const answer = result.rows[0];

  const moderation = await moderateAndSave(req.userId!, 'answer', answer.id, answer.body);

  if (moderation.verdict === 'rejected') {
    res.status(422).json({ error: 'Відповідь не пройшла модерацію', reason: moderation.reason });
    return;
  }

  res.json({ ...answer, moderation_status: moderation.verdict, moderation });
});

router.delete('/answers/:id', requireAuth, async (req, res) => {
  const found = await pool.query<AnswerRow>('SELECT author_id FROM answers WHERE id = $1', [req.params.id]);
  const answer = found.rows[0];

  if (!answer) {
    res.status(404).json({ error: 'Відповідь не знайдено' });
    return;
  }
  if (answer.author_id !== req.userId) {
    res.status(403).json({ error: 'Видаляти можна лише власні відповіді' });
    return;
  }

  await pool.query('DELETE FROM answers WHERE id = $1', [req.params.id]);
  res.status(204).end();
});

router.post('/answers/:id/accept', requireAuth, async (req, res) => {
  const found = await pool.query<{ id: number; question_id: number; is_accepted: boolean; question_author: number }>(
    `SELECT a.id, a.question_id, a.is_accepted, q.author_id AS question_author
     FROM answers a
     JOIN questions q ON q.id = a.question_id
     WHERE a.id = $1`,
    [req.params.id]
  );
  const answer = found.rows[0];

  if (!answer) {
    res.status(404).json({ error: 'Відповідь не знайдено' });
    return;
  }
  if (answer.question_author !== req.userId) {
    res.status(403).json({ error: 'Позначати найкращу відповідь може лише автор запитання' });
    return;
  }

  if (answer.is_accepted) {
    const result = await pool.query<AnswerRow>(
      'UPDATE answers SET is_accepted = false WHERE id = $1 RETURNING *',
      [answer.id]
    );
    res.json(result.rows[0]);
    return;
  }

  await pool.query('UPDATE answers SET is_accepted = false WHERE question_id = $1', [answer.question_id]);

  const result = await pool.query<AnswerRow>(
    'UPDATE answers SET is_accepted = true WHERE id = $1 RETURNING *',
    [answer.id]
  );
  res.json(result.rows[0]);
});

export default router;