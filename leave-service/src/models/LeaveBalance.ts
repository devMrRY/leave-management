import mongoose, { Document, Schema } from 'mongoose';
import { LeaveType } from './constants';

export interface ILeaveBalance extends Document {
  employeeId: string;
  year: number;
  leaveType: LeaveType;
  allocated: number;
  carriedForward: number;
  used: number;
  remaining?: number; // Virtual field - calculated as allocated + carriedForward - used
  createdAt: Date;
  updatedAt: Date;
}

const LeaveBalanceSchema: Schema = new Schema(
  {
    employeeId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },

    year: {
      type: Number,
      required: true,
      min: 2000,
    },

    leaveType: {
      type: String,
      enum: Object.values(LeaveType),
      required: true,
    },

    allocated: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    carriedForward: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    used: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual field to calculate remaining leaves
LeaveBalanceSchema.virtual('remaining').get(function(this: ILeaveBalance) {
  return this.allocated + this.carriedForward - this.used;
});

// Ensure virtuals are included in JSON output
LeaveBalanceSchema.set('toJSON', { virtuals: true });
LeaveBalanceSchema.set('toObject', { virtuals: true });

LeaveBalanceSchema.index(
  {
    employeeId: 1,
    year: 1,
    leaveType: 1,
  },
  {
    unique: true,
  }
);

export default mongoose.model<ILeaveBalance>('LeaveBalance', LeaveBalanceSchema);
