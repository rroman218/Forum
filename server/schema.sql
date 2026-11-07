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
  id          SERIAL PRIMARY KEY,
  title       VARCHAR(200) NOT NULL,
  body        TEXT         NOT NULL,
  discipline  VARCHAR(100) NOT NULL,
  author_id   INT          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tags        TEXT[]       DEFAULT '{}',
  score       INT          DEFAULT 0,
  created_at  TIMESTAMP    DEFAULT now(),
  updated_at  TIMESTAMP    DEFAULT now()
);

-- Тестові користувачі, пароль у всіх: password123
INSERT INTO users (name, email, password_hash) VALUES
  ('Тарас',    'taras@test.com',     '$2a$10$NTWGJ1./ecU3W.TMg9fGTuBa0YYVleKHLLXWeV76dVVPftqyVc5JG'),
  ('Рома',     'roma@test.com',      '$2a$10$NTWGJ1./ecU3W.TMg9fGTuBa0YYVleKHLLXWeV76dVVPftqyVc5JG'),
  ('Христина', 'khrystyna@test.com', '$2a$10$NTWGJ1./ecU3W.TMg9fGTuBa0YYVleKHLLXWeV76dVVPftqyVc5JG');

INSERT INTO questions (title, body, discipline, author_id, tags, score) VALUES
  ('Як працює рекурсія в Python?', 'Не можу зрозуміти, як функція викликає сама себе і коли зупиняється.', 'Програмування', 1, '{Python,Алгоритми}', 2),
  ('Чим LEFT JOIN відрізняється від INNER JOIN?', 'У лабі з баз даних отримую різну кількість рядків.', 'Бази даних', 2, '{SQL}', 1),
  ('Як знайти похідну sin(x^2)?', 'Яке правило застосувати для складної функції?', 'Математика', 3, '{Математика}', 0);