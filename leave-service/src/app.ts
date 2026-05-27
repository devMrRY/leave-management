import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import leaveRouter from './routes/leave.js';

dotenv.config();
const app = express();
app.use(express.json());
app.use(cookieParser());

const MONGO = process.env.MONGO_URI || 'mongodb://localhost:27017/leave-service';
mongoose.connect(MONGO).then(()=> console.log('Leave-service DB connected'))
  .catch(err=> console.error('DB conn error', err));

app.get('/', (_req, res) => res.send('Leave service running'));
app.use('/leaves', leaveRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Leave service listening on ${PORT}`));
