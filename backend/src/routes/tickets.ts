import { Router, Response } from 'express';
import { Ticket } from '../models/Ticket';
import { SLAPolicy } from '../models/SLAPolicy';
import { Team } from '../models/Team';
import { SLACalculator } from '../services/slaCalculator';
import { AuthRequest } from '../middleware/auth';
import { Schema } from 'mongoose';

const router = Router();

interface CreateTicketRequest extends AuthRequest {
  body: {
    title: string;
    description: string;
    priority: 'P1' | 'P2' | 'P3';
    assignedTo?: string;
  };
}

interface UpdateTicketRequest extends AuthRequest {
  params: {
    id: string;
  };
  body: {
    status?: 'open' | 'assigned' | 'in_progress' | 'resolved' | 'closed';
    firstResponseAt?: string;
    resolvedAt?: string;
    assignedTo?: string;
  };
}

interface ListTicketsRequest extends AuthRequest {
  query: {
    status?: string;
    priority?: string;
    limit?: string;
    skip?: string;
  };
}

/**
 * GET /api/tickets
 * List tickets with optional filters
 */
router.get('/', async (req: ListTicketsRequest, res: Response) => {
  try {
    if (!req.teamId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const limit = Math.min(parseInt(req.query.limit || '50'), 100);
    const skip = parseInt(req.query.skip || '0');

    const query: any = { teamId: req.teamId };

    if (req.query.status) {
      query.status = req.query.status;
    }
    if (req.query.priority) {
      query.priority = req.query.priority;
    }

    const tickets = await Ticket.find(query)
      .limit(limit)
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await Ticket.countDocuments(query);

    res.json({
      tickets,
      pagination: {
        limit,
        skip,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('List tickets error:', error);
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

/**
 * POST /api/tickets
 * Create a new ticket
 */
router.post('/', async (req: CreateTicketRequest, res: Response) => {
  try {
    if (!req.teamId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { title, description, priority, assignedTo } = req.body;

    // Validation
    if (!title || !description || !priority) {
      res.status(400).json({ error: 'Title, description, and priority are required' });
      return;
    }

    if (!['P1', 'P2', 'P3'].includes(priority)) {
      res.status(400).json({ error: 'Priority must be P1, P2, or P3' });
      return;
    }

    // Get team and check ticket limit
    const team = await Team.findById(req.teamId);
    if (!team) {
      res.status(404).json({ error: 'Team not found' });
      return;
    }

    if (team.ticketsUsed >= team.ticketLimit) {
      res.status(429).json({
        error: `Ticket limit reached (${team.ticketLimit}). Please upgrade your plan.`
      });
      return;
    }

    // Get SLA policy
    const policy = await SLAPolicy.findById(team.slaPolicy);
    if (!policy) {
      res.status(500).json({ error: 'SLA policy not found' });
      return;
    }

    // Generate ticket number (format: TKT-{timestamp})
    const timestamp = Date.now();
    const ticketNumber = `TKT-${timestamp}`;

    // Get SLA targets based on priority
    let slaResponseTarget: number;
    let slaResolutionTarget: number;

    switch (priority) {
      case 'P1':
        slaResponseTarget = policy.p1ResponseTime;
        slaResolutionTarget = policy.p1ResolutionTime;
        break;
      case 'P2':
        slaResponseTarget = policy.p2ResponseTime;
        slaResolutionTarget = policy.p2ResolutionTime;
        break;
      case 'P3':
        slaResponseTarget = policy.p3ResponseTime;
        slaResolutionTarget = policy.p3ResolutionTime;
        break;
      default:
        slaResponseTarget = 24;
        slaResolutionTarget = 48;
    }

    // Create ticket
    const ticket = new Ticket({
      teamId: new Schema.Types.ObjectId(req.teamId),
      ticketNumber,
      title,
      description,
      priority,
      status: 'open',
      assignedTo,
      slaPolicyId: policy._id,
      slaResponseTarget,
      slaResolutionTarget,
      responseBreached: false,
      resolutionBreached: false
    });

    await ticket.save();

    // Update team ticket count
    team.ticketsUsed += 1;
    await team.save();

    res.status(201).json(ticket);
  } catch (error) {
    console.error('Create ticket error:', error);
    res.status(500).json({ error: 'Failed to create ticket' });
  }
});

/**
 * PATCH /api/tickets/:id
 * Update a ticket
 */
router.patch('/:id', async (req: UpdateTicketRequest, res: Response) => {
  try {
    if (!req.teamId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      res.status(404).json({ error: 'Ticket not found' });
      return;
    }

    if (ticket.teamId.toString() !== req.teamId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    // Update fields
    if (req.body.status) {
      ticket.status = req.body.status;
    }
    if (req.body.assignedTo) {
      ticket.assignedTo = req.body.assignedTo;
    }

    // Handle response time tracking
    if (req.body.firstResponseAt && !ticket.firstResponseAt) {
      ticket.firstResponseAt = new Date(req.body.firstResponseAt);

      // Calculate response time in minutes
      const responseTimeMs = ticket.firstResponseAt.getTime() - ticket.createdAt.getTime();
      ticket.responseTime = Math.round(responseTimeMs / 60000);

      // Check if response SLA breached
      const targetTimeMs = ticket.slaResponseTarget * 60 * 60 * 1000;
      if (responseTimeMs > targetTimeMs) {
        ticket.responseBreached = true;
      }
    }

    // Handle resolution time tracking
    if (req.body.resolvedAt && !ticket.resolvedAt) {
      ticket.resolvedAt = new Date(req.body.resolvedAt);

      // Calculate resolution time in minutes
      const resolutionTimeMs = ticket.resolvedAt.getTime() - ticket.createdAt.getTime();
      ticket.resolutionTime = Math.round(resolutionTimeMs / 60000);

      // Check if resolution SLA breached
      const targetTimeMs = ticket.slaResolutionTarget * 60 * 60 * 1000;
      if (resolutionTimeMs > targetTimeMs) {
        ticket.resolutionBreached = true;
      }
    }

    await ticket.save();

    res.json(ticket);
  } catch (error) {
    console.error('Update ticket error:', error);
    res.status(500).json({ error: 'Failed to update ticket' });
  }
});

/**
 * GET /api/tickets/at-risk
 * Get tickets approaching SLA breach (80%+ time elapsed)
 */
router.get('/at-risk', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.teamId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const atRiskTickets = await SLACalculator.getAtRiskTickets(req.teamId);

    res.json({
      count: atRiskTickets.length,
      tickets: atRiskTickets
    });
  } catch (error) {
    console.error('At-risk tickets error:', error);
    res.status(500).json({ error: 'Failed to fetch at-risk tickets' });
  }
});

export default router;
