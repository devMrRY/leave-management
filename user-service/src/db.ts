import mongoose from 'mongoose';

const MONGO = process.env.MONGO_URI || 'mongodb://localhost:27017/leave-management';

export default function connectDB() {
  return mongoose.connect(MONGO).then(() => console.log('User DB connected'));
}
