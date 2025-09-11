import mongoose, { Schema, Document, Model } from 'mongoose';

// Define interface for User document
interface IUser extends Document {
  name: string;
  email: string;
}

// Define the User schema
const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true }
});

// Create the User model
const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;