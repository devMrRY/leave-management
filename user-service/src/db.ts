import mongoose from 'mongoose';
import { seedUsers } from './seed/initialUserSeed';

export default async function connectDB() {
  const MONGO: string = process.env.MONGO_URI || 'mongodb://localhost:27017/leave-service';
  const maxRetries = 20;
  console.log(`🔗 Connecting to MongoDB at ${MONGO}...`);
  for (let i = 1; i <= maxRetries; i++) {
    try {
      await mongoose.connect(MONGO);

      console.log('✅ User DB connected');
      seedUsers().then(() => {
        console.log('✅ User DB seeding complete');
      }).catch((err) => {
        console.error('❌ User DB seeding failed:', err);
      });
      return;
    } catch (error) {
      console.error(
        `❌ User DB connection failed (attempt ${i}/${maxRetries})`
      );

      if (i === maxRetries) {
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }
}
