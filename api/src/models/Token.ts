import mongoose from 'mongoose';
import { IToken } from '../types';

const TokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  token: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['refresh', 'access', 'reset'],
    default: 'refresh'
  },
  expiresAt: {
    type: Date,
    required: true
  },
  isValid: {
    type: Boolean,
    default: true
  }
}, { 
  timestamps: true 
});

// Index for faster lookups and to ensure uniqueness
TokenSchema.index({ token: 1 }, { unique: true });
TokenSchema.index({ userId: 1, type: 1 });
TokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Token = mongoose.model<IToken>('Token', TokenSchema);

export default Token; 