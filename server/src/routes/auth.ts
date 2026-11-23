import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import pool from '../db';
import requireAuth from '../middleware/auth';
import { UserRow } from '../types/models';

const router = Router();

router.post('/auth/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || name.trim().length < 2) {
    res.status(400).json({ error: "Ім'я має бути не менше 2 символів" });
    return;
  }
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    res.status(400).json({ error: 'Некоректний email' });
    return;
  }
  if (!password || password.length < 8) {
    res.status(400).json({ error: 'Пароль має бути не менше 8 символів' });
    return;
  }

  const cleanEmail: string = email.trim().toLowerCase();

  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [cleanEmail]);
  if (existing.rows.length > 0) {
    res.status(409).json({ error: 'Користувач з таким email уже існує' });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const result = await pool.query<Omit<UserRow, 'password_hash'>>(
    'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email, created_at',
    [name.trim(), cleanEmail, passwordHash]
  );

  res.status(201).json(result.rows[0]);
});

router.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Введіть email і пароль' });
    return;
  }

  const result = await pool.query<UserRow>('SELECT * FROM users WHERE email = $1', [email.trim().toLowerCase()]);
  const user = result.rows[0];

  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    res.status(401).json({ error: 'Невірний email або пароль' });
    return;
  }

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET as string, { expiresIn: '7d' });

  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email },
  });
});

router.get('/auth/me', requireAuth, async (req, res) => {
  const result = await pool.query<Omit<UserRow, 'password_hash'>>(
    'SELECT id, name, email, created_at FROM users WHERE id = $1',
    [req.userId]
  );
  res.json(result.rows[0]);
});

export default router;