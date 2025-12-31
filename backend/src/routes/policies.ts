import { Router, Response } from 'express';
import { SLAPolicy } from '../models/SLAPolicy';
import { AuthRequest } from '../middleware/auth';
import { Schema } from 'mongoose';

const router = Router();

interface UpdatePolicyRequest extends AuthRequest {
  params: {
    id: string;
  };
  body: {
    p1ResponseTime?: number;
    p2ResponseTime?: number;
    p3ResponseTime?: number;
    p1ResolutionTime?: number;
    p2ResolutionTime?: number;
    p3ResolutionTime?: number;
    businessHoursOnly?: boolean;
    businessHours?: {
      start?: number;
      end?: number;
    };
    holidays?: string[];
  };
}

/**
 * GET /api/policies
 * Get SLA policies for the team
 */
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.teamId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const policies = await SLAPolicy.find({
      teamId: new Schema.Types.ObjectId(req.teamId)
    });

    res.json(policies);
  } catch (error) {
    console.error('Get policies error:', error);
    res.status(500).json({ error: 'Failed to fetch policies' });
  }
});

/**
 * PATCH /api/policies/:id
 * Update SLA policy (Admin only)
 */
router.patch('/:id', async (req: UpdatePolicyRequest, res: Response) => {
  try {
    if (!req.teamId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const policy = await SLAPolicy.findById(req.params.id);
    if (!policy) {
      res.status(404).json({ error: 'Policy not found' });
      return;
    }

    // Check ownership
    if (policy.teamId.toString() !== req.teamId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    // Update fields with validation
    if (req.body.p1ResponseTime !== undefined) {
      if (req.body.p1ResponseTime < 0.25) {
        res.status(400).json({ error: 'Response time must be at least 15 minutes' });
        return;
      }
      policy.p1ResponseTime = req.body.p1ResponseTime;
    }

    if (req.body.p2ResponseTime !== undefined) {
      if (req.body.p2ResponseTime < 0.25) {
        res.status(400).json({ error: 'Response time must be at least 15 minutes' });
        return;
      }
      policy.p2ResponseTime = req.body.p2ResponseTime;
    }

    if (req.body.p3ResponseTime !== undefined) {
      if (req.body.p3ResponseTime < 0.25) {
        res.status(400).json({ error: 'Response time must be at least 15 minutes' });
        return;
      }
      policy.p3ResponseTime = req.body.p3ResponseTime;
    }

    if (req.body.p1ResolutionTime !== undefined) {
      if (req.body.p1ResolutionTime < 0.25) {
        res.status(400).json({ error: 'Resolution time must be at least 15 minutes' });
        return;
      }
      policy.p1ResolutionTime = req.body.p1ResolutionTime;
    }

    if (req.body.p2ResolutionTime !== undefined) {
      if (req.body.p2ResolutionTime < 0.25) {
        res.status(400).json({ error: 'Resolution time must be at least 15 minutes' });
        return;
      }
      policy.p2ResolutionTime = req.body.p2ResolutionTime;
    }

    if (req.body.p3ResolutionTime !== undefined) {
      if (req.body.p3ResolutionTime < 0.25) {
        res.status(400).json({ error: 'Resolution time must be at least 15 minutes' });
        return;
      }
      policy.p3ResolutionTime = req.body.p3ResolutionTime;
    }

    if (req.body.businessHoursOnly !== undefined) {
      policy.businessHoursOnly = req.body.businessHoursOnly;
    }

    if (req.body.businessHours) {
      if (req.body.businessHours.start !== undefined) {
        if (req.body.businessHours.start < 0 || req.body.businessHours.start > 23) {
          res.status(400).json({ error: 'Business hours start must be between 0 and 23' });
          return;
        }
        policy.businessHours.start = req.body.businessHours.start;
      }
      if (req.body.businessHours.end !== undefined) {
        if (req.body.businessHours.end < 0 || req.body.businessHours.end > 23) {
          res.status(400).json({ error: 'Business hours end must be between 0 and 23' });
          return;
        }
        policy.businessHours.end = req.body.businessHours.end;
      }
    }

    if (req.body.holidays && Array.isArray(req.body.holidays)) {
      policy.holidays = req.body.holidays.map(h => new Date(h));
    }

    await policy.save();

    res.json(policy);
  } catch (error) {
    console.error('Update policy error:', error);
    res.status(500).json({ error: 'Failed to update policy' });
  }
});

export default router;
