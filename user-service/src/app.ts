import express from 'express';
import dotenv from 'dotenv';
import connectDB from './db.js';
import authRouter from './routes/auth.ts';

dotenv.config();

const app = express();
app.use(express.json());

connectDB();

app.get('/', (req, res) => {
  res.send('User service running');
});

// Auth routes
app.use(authRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`User service running on port ${PORT}`);
});
