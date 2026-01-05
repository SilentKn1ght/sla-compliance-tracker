import { Ticket, ITicket } from '../models/Ticket';
import { SLAPolicy, ISLAPolicy } from '../models/SLAPolicy';
import { Schema } from 'mongoose';

export interface MetricsSummary {
  totalTickets: number;
  resolvedTickets: number;
  openTickets: number;
  breachedTickets: number;
  compliancePercentage: number;
  atRiskCount: number;
  mttr: number; // minutes
  mttrByPriority: {
    P1: number;
    P2: number;
    P3: number;
  };
}

export interface DailyTrend {
  date: string;
  compliance: number;
  openTickets: number;
  mttr: number;
}

export class SLACalculator {
  /**
   * Calculate team compliance percentage for current month
   * Formula: (resolved - breached) / resolved * 100
   */
  static async calculateTeamCompliance(
    teamId: string,
    month?: Date
  ): Promise<number> {
    const now = month || new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const tickets = await Ticket.find({
      teamId: new Schema.Types.ObjectId(teamId),
      createdAt: { $gte: currentMonth, $lt: nextMonth }
    });

    const resolvedTickets = tickets.filter(t => t.status === 'resolved' || t.status === 'closed');
    
    if (resolvedTickets.length === 0) {
      return 100; // No resolved tickets = perfect compliance
    }

    const breachedTickets = resolvedTickets.filter(
      t => t.responseBreached || t.resolutionBreached
    );

    const compliance = ((resolvedTickets.length - breachedTickets.length) / resolvedTickets.length) * 100;
    
    return Math.round(compliance * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Calculate Mean Time To Resolution (MTTR) for team
   * Formula: sum(resolutionTime) / count(resolved)
   * Returns minutes
   */
  static async calculateMTTR(teamId: string, month?: Date): Promise<number> {
    const now = month || new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const resolvedTickets = await Ticket.find({
      teamId: new Schema.Types.ObjectId(teamId),
      status: { $in: ['resolved', 'closed'] },
      resolvedAt: { $gte: currentMonth, $lt: nextMonth }
    });

    if (resolvedTickets.length === 0) {
      return 0;
    }

    const totalResolutionTime = resolvedTickets.reduce((sum, ticket) => {
      return sum + (ticket.resolutionTime || 0);
    }, 0);

    const mttr = totalResolutionTime / resolvedTickets.length;
    return Math.round(mttr * 100) / 100;
  }

  /**
   * Calculate MTTR by priority level
   * Returns MTTR in minutes for each priority
   */
  static async calculateMTTRByPriority(
    teamId: string,
    month?: Date
  ): Promise<{ P1: number; P2: number; P3: number }> {
    const now = month || new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const calculateForPriority = async (priority: 'P1' | 'P2' | 'P3'): Promise<number> => {
      const tickets = await Ticket.find({
        teamId: new Schema.Types.ObjectId(teamId),
        priority,
        status: { $in: ['resolved', 'closed'] },
        resolvedAt: { $gte: currentMonth, $lt: nextMonth }
      });

      if (tickets.length === 0) {
        return 0;
      }

      const totalTime = tickets.reduce((sum, ticket) => {
        return sum + (ticket.resolutionTime || 0);
      }, 0);

      return Math.round((totalTime / tickets.length) * 100) / 100;
    };

    const [p1, p2, p3] = await Promise.all([
      calculateForPriority('P1'),
      calculateForPriority('P2'),
      calculateForPriority('P3')
    ]);

    return { P1: p1, P2: p2, P3: p3 };
  }

  /**
   * Check if a ticket is at risk (80%+ time elapsed towards breach)
   * Returns true if ticket is approaching SLA breach
   */
  static isAtRisk(ticket: ITicket, policy: ISLAPolicy): boolean {
    const now = new Date();

    // Check response time risk
    if (!ticket.firstResponseAt && ticket.status !== 'resolved' && ticket.status !== 'closed') {
      const targetTimeMs = ticket.slaResponseTarget * 60 * 60 * 1000; // Convert hours to ms
      const elapsedMs = now.getTime() - ticket.createdAt.getTime();
      const percentageElapsed = (elapsedMs / targetTimeMs) * 100;

      if (percentageElapsed >= 80 && !ticket.responseBreached) {
        return true;
      }
    }

    // Check resolution time risk
    if (ticket.status !== 'resolved' && ticket.status !== 'closed') {
      const targetTimeMs = ticket.slaResolutionTarget * 60 * 60 * 1000;
      const elapsedMs = now.getTime() - ticket.createdAt.getTime();
      const percentageElapsed = (elapsedMs / targetTimeMs) * 100;

      if (percentageElapsed >= 80 && !ticket.resolutionBreached) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get at-risk tickets sorted by percentage elapsed
   */
  static async getAtRiskTickets(teamId: string): Promise<Array<ITicket & { percentageElapsed: number }>> {
    const policy = await SLAPolicy.findOne({ teamId: new Schema.Types.ObjectId(teamId) });
    
    if (!policy) {
      return [];
    }

    const openTickets = await Ticket.find({
      teamId: new Schema.Types.ObjectId(teamId),
      status: { $nin: ['resolved', 'closed'] }
    });

    const now = new Date();
    const atRiskTickets = openTickets
      .filter(ticket => this.isAtRisk(ticket, policy))
      .map(ticket => {
        const targetTimeMs = ticket.slaResolutionTarget * 60 * 60 * 1000;
        const elapsedMs = now.getTime() - ticket.createdAt.getTime();
        const percentageElapsed = Math.round((elapsedMs / targetTimeMs) * 100);

        return {
          ...ticket.toObject(),
          percentageElapsed
        };
      })
      .sort((a, b) => b.percentageElapsed - a.percentageElapsed);

    return atRiskTickets as Array<ITicket & { percentageElapsed: number }>;
  }

  /**
   * Get complete metrics summary for a team
   * Combines all metrics into one object
   */
  static async getSummary(teamId: string): Promise<MetricsSummary> {
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    // Fetch all tickets for current month
    const allTickets = await Ticket.find({
      teamId: new Schema.Types.ObjectId(teamId),
      createdAt: { $gte: currentMonth, $lt: nextMonth }
    });

    const resolvedTickets = allTickets.filter(
      t => t.status === 'resolved' || t.status === 'closed'
    );
    const openTickets = allTickets.filter(
      t => t.status !== 'resolved' && t.status !== 'closed'
    );
    const breachedTickets = allTickets.filter(
      t => t.responseBreached || t.resolutionBreached
    );

    // Calculate compliance
    let compliance = 100;
    if (resolvedTickets.length > 0) {
      compliance =
        ((resolvedTickets.length - breachedTickets.length) / resolvedTickets.length) * 100;
      compliance = Math.round(compliance * 100) / 100;
    }

    // Calculate MTTR
    let mttr = 0;
    if (resolvedTickets.length > 0) {
      const totalTime = resolvedTickets.reduce((sum, ticket) => {
        return sum + (ticket.resolutionTime || 0);
      }, 0);
      mttr = Math.round((totalTime / resolvedTickets.length) * 100) / 100;
    }

    // Calculate MTTR by priority
    const mttrByPriority = await this.calculateMTTRByPriority(teamId);

    // Get at-risk count
    const policy = await SLAPolicy.findOne({ teamId: new Schema.Types.ObjectId(teamId) });
    let atRiskCount = 0;
    if (policy) {
      atRiskCount = openTickets.filter(ticket => this.isAtRisk(ticket, policy)).length;
    }

    return {
      totalTickets: allTickets.length,
      resolvedTickets: resolvedTickets.length,
      openTickets: openTickets.length,
      breachedTickets: breachedTickets.length,
      compliancePercentage: compliance,
      atRiskCount,
      mttr,
      mttrByPriority
    };
  }

  /**
   * Get daily trends for the last N days
   */
  static async getDailyTrend(teamId: string, days: number = 7): Promise<DailyTrend[]> {
    const trends: DailyTrend[] = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const dayStart = new Date(now);
      dayStart.setDate(dayStart.getDate() - i);
      dayStart.setHours(0, 0, 0, 0);

      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const dayTickets = await Ticket.find({
        teamId: new Schema.Types.ObjectId(teamId),
        createdAt: { $gte: dayStart, $lt: dayEnd }
      });

      const resolvedDayTickets = dayTickets.filter(
        t => t.status === 'resolved' || t.status === 'closed'
      );
      const breachedDayTickets = dayTickets.filter(
        t => t.responseBreached || t.resolutionBreached
      );
      const openDayTickets = dayTickets.filter(
        t => t.status !== 'resolved' && t.status !== 'closed'
      );

      // Calculate daily compliance
      let dailyCompliance = 100;
      if (resolvedDayTickets.length > 0) {
        dailyCompliance =
          ((resolvedDayTickets.length - breachedDayTickets.length) /
            resolvedDayTickets.length) * 100;
        dailyCompliance = Math.round(dailyCompliance * 100) / 100;
      }

      // Calculate daily MTTR
      let dailyMTTR = 0;
      if (resolvedDayTickets.length > 0) {
        const totalTime = resolvedDayTickets.reduce((sum, ticket) => {
          return sum + (ticket.resolutionTime || 0);
        }, 0);
        dailyMTTR = Math.round((totalTime / resolvedDayTickets.length) * 100) / 100;
      }

      trends.push({
        date: dayStart.toISOString().split('T')[0],
        compliance: dailyCompliance,
        openTickets: openDayTickets.length,
        mttr: dailyMTTR
      });
    }

    return trends;
  }
}
