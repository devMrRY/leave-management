import mongoose from 'mongoose';

export default function connectDB() {
  const MONGO: string = process.env.MONGO_URI || 'mongodb://localhost:27017/leave-management';
  return mongoose.connect(MONGO).then(() => console.log('User DB connected')).catch(err => console.error('DB conn error', err));
}
