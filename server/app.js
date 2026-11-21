require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 4000;

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());
app.use(express.static('public'));

app.use('/api', require('./routes/auth'));
app.use('/api', require('./routes/questions'));
app.use('/api', require('./routes/answers'));
app.use('/api', require('./routes/users'));

app.use((req, res) => {
  res.status(404).json({ error: 'Маршрут не знайдено' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Помилка сервера' });
});

app.listen(PORT, () => {
  console.log(`Сервер працює: http://localhost:${PORT}`);
});