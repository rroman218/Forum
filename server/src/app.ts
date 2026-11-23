import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import questionRoutes from './routes/questions';
import answerRoutes from './routes/answers';
import userRoutes from './routes/users';

const app = express();
const PORT = 4000;

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());
app.use(express.static('public'));

app.use('/api', authRoutes);
app.use('/api', questionRoutes);
app.use('/api', answerRoutes);
app.use('/api', userRoutes);

app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Маршрут не знайдено' });
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Помилка сервера' });
});

app.listen(PORT, () => {
  console.log(`Сервер працює: http://localhost:${PORT}`);
});