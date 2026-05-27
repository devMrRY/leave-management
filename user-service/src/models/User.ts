import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  managerId?: mongoose.Types.ObjectId | null; // null for higher management
  updatedOn: number;
  createdOn: number;
  createdBy?: mongoose.Types.ObjectId | null;
  updatedBy?: mongoose.Types.ObjectId | null;
}


const UserSchema: Schema = new Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // will be stored as hash
  managerId: { type: Schema.Types.ObjectId, ref: 'User', default: null }, // null for higher management
  updatedOn: { type: Number, default: Date.now },
  createdOn: { type: Number, default: Date.now },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
});

// Add pre-save hook for password hashing (to be implemented in service/controller)
export default mongoose.model<IUser>('User', UserSchema);
