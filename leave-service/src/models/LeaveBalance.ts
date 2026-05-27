import mongoose, { Document, Schema } from 'mongoose';

export interface ILeaveBalance extends Document {
  userId: mongoose.Types.ObjectId;
  annual: number;
  sick: number;
}

const LeaveBalanceSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, required: true, unique: true },
  annual: { type: Number, default: 0 },
  sick: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model<ILeaveBalance>('LeaveBalance', LeaveBalanceSchema);
