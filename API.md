# StudentQ&A — API бекенду

**Базова адреса:** `http://localhost:4000/api`
**Формат:** JSON (`Content-Type: application/json`)
**CORS:** дозволено `http://localhost:3000`

## Запуск бекенду

```bash
cd server
npm install
psql studentqa -f schema.sql
npm run dev
```

Потрібен файл `server/.env`:

```
DATABASE_URL=postgresql://USER@localhost:5432/studentqa
JWT_SECRET=будь-який-довгий-рядок
GROQ_API_KEY=ключ_groq
GROQ_MODEL=openai/gpt-oss-120b
AI_DAILY_LIMIT=20
```

## Тестові акаунти

| Ім'я | Email | Пароль |
|---|---|---|
| Тарас | taras@test.com | password123 |
| Рома | roma@test.com | password123 |
| Христина | khrystyna@test.com | password123 |

## Авторизація

1. `POST /auth/login` повертає `token`.
2. Токен зберігаєш (наприклад, у `localStorage`).
3. До захищених запитів (🔒) додаєш заголовок:

```
Authorization: Bearer <token>
```

Токен діє 7 днів. Без токена або з простроченим сервер відповідає `401`.

## Помилки

Усі помилки мають однаковий формат:

```json
{ "error": "Текст помилки українською" }
```

| Код | Значення |
|---|---|
| 400 | Невалідні дані (короткий заголовок, некоректний email тощо) |
| 401 | Не увійшов або токен недійсний |
| 403 | Немає прав (чуже запитання/відповідь) |
| 404 | Не знайдено |
| 409 | Email уже зареєстрований |
| 422 | Текст не пройшов AI-модерацію (є поле `reason`) |
| 429 | Забагато запитів (більше 10 за хвилину) |
| 500 | Помилка сервера |

---

## Auth

### `POST /auth/register`
Реєстрація.

```json
{ "name": "Тарас", "email": "taras@test.com", "password": "password123" }
```
Правила: `name` ≥ 2 символи, коректний `email`, `password` ≥ 8 символів.

Відповідь `201`:
```json
{ "id": 4, "name": "Тарас", "email": "taras@test.com", "created_at": "..." }
```

### `POST /auth/login`
Вхід.

```json
{ "email": "taras@test.com", "password": "password123" }
```
Відповідь `200`:
```json
{
  "token": "eyJhbGciOi...",
  "user": { "id": 1, "name": "Тарас", "email": "taras@test.com" }
}
```

### `GET /auth/me` 🔒
Поточний користувач за токеном.

Відповідь: `{ "id", "name", "email", "created_at" }`

---

## Запитання

### `GET /questions`
Список запитань (новіші першими). Відхилені модерацією не показуються.

Параметри (усі необов'язкові, можна комбінувати):

| Параметр | Приклад | Що робить |
|---|---|---|
| `search` | `?search=рекурсія` | Пошук у заголовку і тексті |
| `discipline` | `?discipline=Математика` | Тільки ця дисципліна |
| `tag` | `?tag=Python` | Тільки з цим тегом (з урахуванням регістру) |

Відповідь: масив
```json
[
  {
    "id": 1,
    "title": "Як працює рекурсія в Python?",
    "body": "...",
    "discipline": "Програмування",
    "tags": ["Python", "Алгоритми"],
    "score": 2,
    "author_id": 1,
    "author_name": "Тарас",
    "answers_count": 1,
    "moderation_status": "approved",
    "created_at": "...",
    "updated_at": "..."
  }
]
```

### `GET /questions/:id`
Одне запитання з відповідями. Найкраща відповідь іде першою.

Відповідь: об'єкт запитання + поле `answers`:
```json
{
  "id": 1,
  "title": "...",
  "answers": [
    {
      "id": 1,
      "body": "...",
      "author_id": 2,
      "author_name": "Рома",
      "is_accepted": true,
      "moderation_status": "approved",
      "created_at": "..."
    }
  ]
}
```

### `POST /questions` 🔒
Створити запитання. Текст проходить AI-модерацію (1–3 секунди).

```json
{
  "title": "Як знайти похідну складної функції?",
  "body": "Не розумію правило ланцюжка, поясніть на прикладі sin(x^2).",
  "discipline": "Математика",
  "tags": ["Математика", "Похідні"]
}
```
Правила: `title` ≥ 10 символів, `body` ≥ 20, `discipline` обов'язкова. `tags` — масив або рядок через кому (`"Математика, Похідні"`).

Відповідь `201`: запитання + результат модерації
```json
{
  "id": 5,
  "title": "...",
  "moderation_status": "approved",
  "moderation": { "verdict": "approved", "reason": "...", "confidence": 0.99 }
}
```

Якщо модерація відхилила — `422`:
```json
{ "error": "Запитання не пройшло модерацію", "reason": "Текст містить рекламу" }
```

### `PUT /questions/:id` 🔒 (тільки автор)
Редагувати. Можна передати лише поля, які змінюються. Після редагування — повторна модерація.

```json
{ "title": "Новий заголовок запитання" }
```
Відповідь — як у `POST /questions`. Чуже запитання → `403`.

### `DELETE /questions/:id` 🔒 (тільки автор)
Видалити запитання разом з відповідями. Відповідь `204` (без тіла).

### `GET /tags`
Усі теги з кількістю запитань:
```json
[{ "tag": "Python", "count": 2 }, { "tag": "SQL", "count": 1 }]
```

### `GET /disciplines`
Усі дисципліни з кількістю запитань:
```json
[{ "discipline": "Математика", "count": 3 }]
```

---

## Відповіді

### `POST /questions/:id/answers` 🔒
Додати відповідь. Проходить AI-модерацію.

```json
{ "body": "Застосуй правило ланцюжка: cos(x^2) * 2x." }
```
Правило: `body` ≥ 10 символів.

Відповідь `201`: відповідь + `moderation`. Відхилено → `422`.

### `PUT /answers/:id` 🔒 (тільки автор)
```json
{ "body": "Оновлений текст відповіді" }
```

### `DELETE /answers/:id` 🔒 (тільки автор)
Відповідь `204`.

### `POST /answers/:id/accept` 🔒 (тільки автор запитання)
Позначити відповідь найкращою. Повторний виклик знімає позначку. У запитання може бути лише одна найкраща відповідь.

Відповідь: оновлена відповідь з `"is_accepted": true` або `false`.

---

## Користувачі

### `GET /users/:id`
Публічний профіль (без email і пароля):
```json
{
  "id": 1,
  "name": "Тарас",
  "created_at": "...",
  "questions_count": 1,
  "answers_count": 2,
  "accepted_count": 0,
  "questions": [ /* запитання користувача */ ]
}
```

### `PUT /users/me` 🔒
Змінити своє ім'я:
```json
{ "name": "Тарас Довганик" }
```

---

## Модерація (статуси)

| `moderation_status` | Значення | Що показувати |
|---|---|---|
| `approved` | Перевірено AI, все добре | Звичайно |
| `needs_review` | AI сумнівається або недоступний | Можна показати з позначкою «на перевірці» |
| `rejected` | Відхилено | Не приходить у списках; при створенні — помилка `422` |

---

## Приклад для фронтенду (TypeScript)

```ts
const API = 'http://localhost:4000/api';

async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token');
  const res = await fetch(API + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (res.status === 204) return undefined as T;
  const data = await res.json();
  if (!res.ok) throw new Error(data.reason ? `${data.error}: ${data.reason}` : data.error);
  return data;
}

// вхід
const { token, user } = await api<{ token: string; user: User }>('/auth/login', {
  method: 'POST',
  body: JSON.stringify({ email, password }),
});
localStorage.setItem('token', token);

// список з пошуком
const questions = await api<Question[]>('/questions?search=' + encodeURIComponent(query));

// нове запитання
await api('/questions', {
  method: 'POST',
  body: JSON.stringify({ title, body, discipline, tags }),
});
```

### Типи

```ts
type ModerationStatus = 'approved' | 'rejected' | 'needs_review' | 'pending';

interface User {
  id: number;
  name: string;
  email?: string;
  created_at?: string;
}

interface Answer {
  id: number;
  body: string;
  question_id: number;
  author_id: number;
  author_name: string;
  is_accepted: boolean;
  moderation_status: ModerationStatus;
  created_at: string;
  updated_at: string;
}

interface Question {
  id: number;
  title: string;
  body: string;
  discipline: string;
  tags: string[];
  score: number;
  author_id: number;
  author_name: string;
  answers_count: number;
  moderation_status: ModerationStatus;
  created_at: string;
  updated_at: string;
  answers?: Answer[];
}
```
