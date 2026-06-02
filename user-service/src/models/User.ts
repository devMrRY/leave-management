import mongoose, { Document, Schema } from 'mongoose';

export enum UserRole {
  EMPLOYEE = "EMPLOYEE",
  MANAGER = "MANAGER",
}

export interface IUser extends Document {
  employeeId: string;
  name: string;
  username: string;
  email: string;
  password: string;
  role: UserRole;
  managerId?: String | null; // null for higher management
}

const UserSchema: Schema = new Schema<IUser>({
  employeeId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // will be stored as hash
  role: { type: String, enum: Object.values(UserRole), default: UserRole.EMPLOYEE },
  managerId: { type: String, default: null }, // null for higher management
}, { timestamps: true });

UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ username: 1 }, { unique: true });
UserSchema.index({ employeeId: 1 }, { unique: true });
UserSchema.index({ managerId: 1 });

// Add pre-save hook for password hashing (to be implemented in service/controller)
export default mongoose.model<IUser>('User', UserSchema);
