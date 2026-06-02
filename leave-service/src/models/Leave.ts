import mongoose, { Document, Schema } from 'mongoose';
import { LeaveStatus, LeaveType } from './constants';

export interface ILeave extends Document {
  employeeId: string;
  email: string;
  name?: string;
  type: LeaveType;
  startDate: Date;
  endDate: Date;
  numberOfDays: number;
  status: LeaveStatus;
  reason: string;
  reportingManager: string; // Manager ID who approves
  reviewedAt?: Date;
  reviewComment?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LeaveSchema: Schema = new Schema({
  employeeId: { 
    type: String, 
    required: true, 
    index: true 
  },
  email: {
    type: String,
    required: true,
    trim: true,
  },
  name: {
    type: String,
    trim: true,
  },
  type: { 
    type: String, 
    enum: Object.values(LeaveType), 
    required: true 
  },
  startDate: { 
    type: Date, 
    required: true,
    validate: {
      validator: function(v: Date) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return v >= today;
      },
      message: 'Start date cannot be in the past'
    }
  },
  endDate: { 
    type: Date, 
    required: true,
    validate: {
      validator: function(this: ILeave, v: Date) {
        return v >= this.startDate;
      },
      message: 'End date must be greater than or equal to start date'
    }
  },
  numberOfDays: { 
    type: Number, 
    required: true,
    min: 1
  },
  reason: {
    type: String,
    required: true,
    trim: true,
  },
  reportingManager: {
    type: String,
    default: null,
    index: true,
  },
  status: { 
    type: String, 
    enum: Object.values(LeaveStatus), 
    default: LeaveStatus.PENDING,
    index: true 
  },
  reviewedAt: {
    type: Date,
  },
  reviewComment: {
    type: String,
    trim: true,
  },
}, { timestamps: true });

LeaveSchema.index({ employeeId: 1 });
LeaveSchema.index({ status: 1 });
LeaveSchema.index({ employeeId: 1, status: 1 });
LeaveSchema.index({ startDate: 1, endDate: 1 });
LeaveSchema.index({ reportingManager: 1, status: 1 });

export default mongoose.model<ILeave>('Leave', LeaveSchema);
