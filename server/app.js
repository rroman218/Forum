require('dotenv').config();
const express = require('express');
const cors = require('cors');
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

app.listen(PORT, () => {
  console.log(`Сервер працює: http://localhost:${PORT}`);
});