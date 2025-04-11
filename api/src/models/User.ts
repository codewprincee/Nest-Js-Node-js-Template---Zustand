import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUser } from '../types';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config';
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(v: string) {
        return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v);
      },
      message: (props: any) => `${props.value} is not a valid email address!`
    }
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters long'],
    select: false
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
 
  isActive: {
    type: Boolean,
    default: true
  },
  role: {
    type: String,
    enum: Object.values(UserRole),
    default: UserRole.USER
  },
  fcmTokens: {
    type: [String],
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Encrypt password before saving
UserSchema.pre('save', async function(next) {
  // Only run this function if password was modified
  if (!this.isModified('password')) return next();
  
  // Hash the password with a salt of 12
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Method to compare password
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};
UserSchema.methods.generateAuthToken = function() {
    const token = jwt.sign({ id: this._id }, JWT_SECRET, { expiresIn: '1 days' });
    return token;
};
UserSchema.methods.generateRefreshToken = function() {
    const token = jwt.sign({ id: this._id }, JWT_SECRET, { expiresIn: '7 days' });
    return token;
};

const User = mongoose.model<IUser>('User', UserSchema);

export default User; 