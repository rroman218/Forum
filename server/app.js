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



app.get('/api/questions', async (req, res) => {
  const result = await pool.query('SELECT * FROM questions ORDER BY created_at DESC');
  res.json(result.rows);
});

app.get('/api/questions/:id', async (req, res) => {
  const result = await pool.query('SELECT * FROM questions WHERE id = $1', [req.params.id]);
  const question = result.rows[0];
  if (!question) return res.status(404).json({ error: 'Запитання не знайдено' });
  res.json(question);
});

app.post('/api/questions', async (req, res) => {
  const { title, author, tags } = req.body;

  if (!title || title.trim().length < 10) {
    return res.status(400).json({ error: 'Заголовок має бути не менше 10 символів' });
  }
  if (!author || author.trim() === '') {
    return res.status(400).json({ error: 'Вкажіть автора' });
  }

  const tagList = tags ? tags.split(',').map(t => t.trim()).filter(t => t) : [];

  const result = await pool.query(
    'INSERT INTO questions (title, author, tags) VALUES ($1, $2, $3) RETURNING *',
    [title.trim(), author.trim(), tagList]
  );
  res.status(201).json(result.rows[0]);
});



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



app.get('/api/auth/me', requireAuth, async (req, res) => {
  const result = await pool.query('SELECT id, name, email, created_at FROM users WHERE id = $1', [req.userId]);
  res.json(result.rows[0]);
});


app.listen(PORT, () => {
  console.log(`Сервер працює: http://localhost:${PORT}`);
});