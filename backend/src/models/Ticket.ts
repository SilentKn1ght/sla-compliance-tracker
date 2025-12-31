import { Schema, model, Document } from 'mongoose';

export interface ITicket extends Document {
  _id: string;
  teamId: Schema.Types.ObjectId;
  ticketNumber: string;
  title: string;
  description: string;
  priority: 'P1' | 'P2' | 'P3';
  status: 'open' | 'assigned' | 'in_progress' | 'resolved' | 'closed';
  createdAt: Date;
  firstResponseAt?: Date;
  resolvedAt?: Date;
  assignedTo?: string;
  slaPolicyId: Schema.Types.ObjectId;
  slaResponseTarget: number; // hours
  slaResolutionTarget: number; // hours
  responseBreached: boolean;
  resolutionBreached: boolean;
  responseTime?: number; // minutes
  resolutionTime?: number; // minutes
  updatedAt: Date;
}

const ticketSchema = new Schema<ITicket>(
  {
    teamId: {
      type: Schema.Types.ObjectId,
      ref: 'Team',
      required: [true, 'Team ID is required'],
      index: true
    },
    ticketNumber: {
      type: String,
      required: true,
      unique: true
    },
    title: {
      type: String,
      required: [true, 'Ticket title is required'],
      trim: true,
      minlength: [5, 'Title must be at least 5 characters']
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      minlength: [10, 'Description must be at least 10 characters']
    },
    priority: {
      type: String,
      enum: {
        values: ['P1', 'P2', 'P3'],
        message: 'Priority must be P1, P2, or P3'
      },
      required: true
    },
    status: {
      type: String,
      enum: {
        values: ['open', 'assigned', 'in_progress', 'resolved', 'closed'],
        message: 'Invalid status'
      },
      default: 'open'
    },
    firstResponseAt: {
      type: Date
    },
    resolvedAt: {
      type: Date
    },
    assignedTo: {
      type: String
    },
    slaPolicyId: {
      type: Schema.Types.ObjectId,
      ref: 'SLAPolicy',
      required: true
    },
    slaResponseTarget: {
      type: Number,
      required: true // hours
    },
    slaResolutionTarget: {
      type: Number,
      required: true // hours
    },
    responseBreached: {
      type: Boolean,
      default: false
    },
    resolutionBreached: {
      type: Boolean,
      default: false
    },
    responseTime: {
      type: Number // minutes
    },
    resolutionTime: {
      type: Number // minutes
    }
  },
  {
    timestamps: true
  }
);

// Indexes for efficient queries
ticketSchema.index({ teamId: 1, status: 1 });
ticketSchema.index({ teamId: 1, priority: 1 });
ticketSchema.index({ teamId: 1, createdAt: -1 });
ticketSchema.index({ responseBreached: 1, resolutionBreached: 1 });

export const Ticket = model<ITicket>('Ticket', ticketSchema);
