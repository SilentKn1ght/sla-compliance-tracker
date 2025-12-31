import { Schema, model, Document } from 'mongoose';

export interface ISLAPolicy extends Document {
  _id: string;
  teamId: Schema.Types.ObjectId;
  name: string;
  p1ResponseTime: number; // hours
  p2ResponseTime: number; // hours
  p3ResponseTime: number; // hours
  p1ResolutionTime: number; // hours
  p2ResolutionTime: number; // hours
  p3ResolutionTime: number; // hours
  businessHoursOnly: boolean;
  businessHours: {
    start: number; // 0-23
    end: number; // 0-23
  };
  holidays: Date[];
  createdAt: Date;
  updatedAt: Date;
}

const slaPolicySchema = new Schema<ISLAPolicy>(
  {
    teamId: {
      type: Schema.Types.ObjectId,
      ref: 'Team',
      required: [true, 'Team ID is required'],
      index: true
    },
    name: {
      type: String,
      required: [true, 'Policy name is required'],
      trim: true
    },
    p1ResponseTime: {
      type: Number,
      required: true,
      default: 1, // 1 hour
      min: [0.25, 'Response time must be at least 15 minutes']
    },
    p2ResponseTime: {
      type: Number,
      required: true,
      default: 4, // 4 hours
      min: [0.25, 'Response time must be at least 15 minutes']
    },
    p3ResponseTime: {
      type: Number,
      required: true,
      default: 24, // 24 hours
      min: [0.25, 'Response time must be at least 15 minutes']
    },
    p1ResolutionTime: {
      type: Number,
      required: true,
      default: 2, // 2 hours
      min: [0.25, 'Resolution time must be at least 15 minutes']
    },
    p2ResolutionTime: {
      type: Number,
      required: true,
      default: 8, // 8 hours
      min: [0.25, 'Resolution time must be at least 15 minutes']
    },
    p3ResolutionTime: {
      type: Number,
      required: true,
      default: 48, // 48 hours
      min: [0.25, 'Resolution time must be at least 15 minutes']
    },
    businessHoursOnly: {
      type: Boolean,
      default: false
    },
    businessHours: {
      start: {
        type: Number,
        default: 9, // 9 AM
        min: 0,
        max: 23
      },
      end: {
        type: Number,
        default: 17, // 5 PM
        min: 0,
        max: 23
      }
    },
    holidays: [{
      type: Date
    }]
  },
  {
    timestamps: true
  }
);

// Index for efficient queries
slaPolicySchema.index({ teamId: 1 });

export const SLAPolicy = model<ISLAPolicy>('SLAPolicy', slaPolicySchema);
