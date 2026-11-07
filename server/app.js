require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const pool = require('./db');

const app = express();
const PORT = 4000;

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());
app.use(express.static('public'));

// ---------- ПЕРЕВІРКА ТОКЕНА ----------

function requireAuth(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Потрібно увійти в систему' });
  }

  try {
    const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET);
    req.userId = payload.userId;
    next();
  } catch {
    return res.status(401).json({ error: 'Токен недійсний або прострочений' });
  }
}

// ---------- ЗАПИТАННЯ ----------

const QUESTION_SELECT = `
  SELECT q.*, u.name AS author_name
  FROM questions q
  JOIN users u ON u.id = q.author_id
`;

app.get('/api/questions', async (req, res) => {
  const result = await pool.query(QUESTION_SELECT + ' ORDER BY q.created_at DESC');
  res.json(result.rows);
});

app.get('/api/questions/:id', async (req, res) => {
  const result = await pool.query(QUESTION_SELECT + ' WHERE q.id = $1', [req.params.id]);
  const question = result.rows[0];
  if (!question) return res.status(404).json({ error: 'Запитання не знайдено' });
  res.json(question);
});

function validateQuestion({ title, body, discipline }) {
  if (!title || title.trim().length < 10) return 'Заголовок має бути не менше 10 символів';
  if (!body || body.trim().length < 20) return 'Текст запитання має бути не менше 20 символів';
  if (!discipline || discipline.trim() === '') return 'Вкажіть дисципліну';
  return null;
}

function parseTags(tags) {
  if (Array.isArray(tags)) return tags.map(t => String(t).trim()).filter(t => t);
  if (typeof tags === 'string') return tags.split(',').map(t => t.trim()).filter(t => t);
  return [];
}

app.post('/api/questions', requireAuth, async (req, res) => {
  const error = validateQuestion(req.body);
  if (error) return res.status(400).json({ error });

  const { title, body, discipline, tags } = req.body;

  const result = await pool.query(
    `INSERT INTO questions (title, body, discipline, author_id, tags)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [title.trim(), body.trim(), discipline.trim(), req.userId, parseTags(tags)]
  );
  res.status(201).json(result.rows[0]);
});

app.put('/api/questions/:id', requireAuth, async (req, res) => {
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
  res.json(result.rows[0]);
});

app.delete('/api/questions/:id', requireAuth, async (req, res) => {
  const found = await pool.query('SELECT author_id FROM questions WHERE id = $1', [req.params.id]);
  const question = found.rows[0];

  if (!question) return res.status(404).json({ error: 'Запитання не знайдено' });
  if (question.author_id !== req.userId) {
    return res.status(403).json({ error: 'Видаляти можна лише власні запитання' });
  }

  await pool.query('DELETE FROM questions WHERE id = $1', [req.params.id]);
  res.status(204).end();
});

// ---------- РЕЄСТРАЦІЯ ----------

app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || name.trim().length < 2) {
    return res.status(400).json({ error: "Ім'я має бути не менше 2 символів" });
  }
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ error: 'Некоректний email' });
  }
  if (!password || password.length < 8) {
    return res.status(400).json({ error: 'Пароль має бути не менше 8 символів' });
  }

  const cleanEmail = email.trim().toLowerCase();

  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [cleanEmail]);
  if (existing.rows.length > 0) {
    return res.status(409).json({ error: 'Користувач з таким email уже існує' });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const result = await pool.query(
    'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email, created_at',
    [name.trim(), cleanEmail, passwordHash]
  );

  res.status(201).json(result.rows[0]);
});

// ---------- ВХІД ----------

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Введіть email і пароль' });
  }

  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.trim().toLowerCase()]);
  const user = result.rows[0];

  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ error: 'Невірний email або пароль' });
  }

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email },
  });
});

app.get('/api/auth/me', requireAuth, async (req, res) => {
  const result = await pool.query('SELECT id, name, email, created_at FROM users WHERE id = $1', [req.userId]);
  res.json(result.rows[0]);
});

app.listen(PORT, () => {
  console.log(`Сервер працює: http://localhost:${PORT}`);
});