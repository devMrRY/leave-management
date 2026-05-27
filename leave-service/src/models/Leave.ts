import mongoose, { Document, Schema } from 'mongoose';

export interface ILeave extends Document {
  userId: mongoose.Types.ObjectId;
  type: string;
  startDate: Date;
  endDate: Date;
  status: string;
}

const LeaveSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, required: true },
  type: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: { type: String, default: 'pending' }
}, { timestamps: true });

export default mongoose.model<ILeave>('Leave', LeaveSchema);
