import mongoose from 'mongoose';

export default async function connectDB() {
  const MONGO: string = process.env.MONGO_URI || 'mongodb://localhost:27017/leave-management';
  const maxRetries = 20;
  console.log(`🔗 Connecting to MongoDB at ${MONGO}...`);
  for (let i = 1; i <= maxRetries; i++) {
    try {
      await mongoose.connect(MONGO);
      console.log('✅ Leave DB connected');
      return;
    } catch (error) {
      console.error(
        `❌ Leave DB connection failed (attempt ${i}/${maxRetries})`
      );

      if (i === maxRetries) {
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }
}
