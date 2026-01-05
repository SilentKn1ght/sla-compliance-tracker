import { Schema, model, Document } from 'mongoose';

export interface ITeam extends Document {
  _id: Schema.Types.ObjectId;
  name: string;
  email: string;
  members: Array<{
    name: string;
    email: string;
    role: 'admin' | 'member' | 'viewer';
  }>;
  slaPolicy: Schema.Types.ObjectId;
  subscriptionPlan: 'free' | 'pro' | 'enterprise';
  ticketsUsed: number;
  ticketLimit: number;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

const teamSchema = new Schema<ITeam>(
  {
    name: {
      type: String,
      required: [true, 'Team name is required'],
      trim: true,
      minlength: [2, 'Team name must be at least 2 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
    },
    members: [{
      name: {
        type: String,
        required: true
      },
      email: {
        type: String,
        required: true,
        lowercase: true
      },
      role: {
        type: String,
        enum: ['admin', 'member', 'viewer'],
        default: 'member'
      }
    }],
    slaPolicy: {
      type: Schema.Types.ObjectId,
      ref: 'SLAPolicy'
    },
    subscriptionPlan: {
      type: String,
      enum: ['free', 'pro', 'enterprise'],
      default: 'free'
    },
    ticketsUsed: {
      type: Number,
      default: 0
    },
    ticketLimit: {
      type: Number,
      default: 100 // Free plan limit
    },
    passwordHash: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Index for efficient queries
teamSchema.index({ email: 1 });

export const Team = model<ITeam>('Team', teamSchema);
