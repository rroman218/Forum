DROP TABLE IF EXISTS questions;
DROP TABLE IF EXISTS users;
CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(50)  NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at    TIMESTAMP    DEFAULT now()
);



CREATE TABLE questions (
  id         SERIAL PRIMARY KEY,
  title      VARCHAR(200) NOT NULL,
  author     VARCHAR(50)  NOT NULL,
  tags       TEXT[]       DEFAULT '{}',
  score      INT          DEFAULT 0,
  created_at TIMESTAMP    DEFAULT now()
);

INSERT INTO questions (title, author, tags, score) VALUES
 ('Як працює рекурсія в Python?', 'Тарас', '{Python,Алгоритми}', 2),
  ('Чим LEFT JOIN відрізняється від INNER JOIN?', 'Рома', '{SQL}', 1),
  ('Як знайти похідну sin(x^2)?', 'Христина', '{Математика}', 0);