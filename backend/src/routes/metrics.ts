import { Router, Response } from 'express';
import { SLACalculator, MetricsSummary, DailyTrend } from '../services/slaCalculator';
import { AuthRequest } from '../middleware/auth';

const router = Router();

interface MetricsRequest extends AuthRequest {
  query: {
    days?: string;
  };
}

/**
 * GET /api/metrics
 * Get team metrics summary for current month
 */
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.teamId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const summary: MetricsSummary = await SLACalculator.getSummary(req.teamId);

    res.json(summary);
  } catch (error) {
    console.error('Metrics error:', error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

/**
 * GET /api/metrics/daily-trend
 * Get daily compliance trend for last N days
 * Query: days (default 7, max 30)
 */
router.get('/daily-trend', async (req: MetricsRequest, res: Response) => {
  try {
    if (!req.teamId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    let days = parseInt(req.query.days || '7');
    
    // Validate days parameter
    if (isNaN(days) || days < 1) {
      days = 7;
    }
    if (days > 30) {
      days = 30;
    }

    const trends: DailyTrend[] = await SLACalculator.getDailyTrend(req.teamId, days);

    res.json({
      days,
      trends
    });
  } catch (error) {
    console.error('Daily trend error:', error);
    res.status(500).json({ error: 'Failed to fetch daily trends' });
  }
});

export default router;
