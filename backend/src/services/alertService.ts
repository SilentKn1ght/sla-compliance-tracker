import { Ticket } from '../models/Ticket';
import { SLAPolicy } from '../models/SLAPolicy';
import { Team } from '../models/Team';
import { EmailService } from './emailService';
import { SLACalculator } from './slaCalculator';

export class AlertService {
  private static instance: AlertService;
  private riskCheckInterval: NodeJS.Timeout | null = null;

  private constructor() {}

  static getInstance(): AlertService {
    if (!AlertService.instance) {
      AlertService.instance = new AlertService();
    }
    return AlertService.instance;
  }

  /**
   * Start the risk check interval
   * Checks all tickets every 5 minutes for SLA breach risks
   */
  startRiskCheckInterval(): void {
    if (this.riskCheckInterval) {
      return; // Already running
    }

    const intervalMs =
      (parseInt(process.env.ALERT_CHECK_INTERVAL || '5') || 5) * 60 * 1000; // Convert minutes to ms

    console.log(`🔔 Alert service started - checking every ${intervalMs / 60000} minutes`);

    this.riskCheckInterval = setInterval(() => {
      this.checkAllTicketsForRisk();
    }, intervalMs);
  }

  /**
   * Stop the risk check interval
   */
  stopRiskCheckInterval(): void {
    if (this.riskCheckInterval) {
      clearInterval(this.riskCheckInterval);
      this.riskCheckInterval = null;
      console.log('🛑 Alert service stopped');
    }
  }

  /**
   * Check all tickets across all teams for SLA breach risk
   */
  async checkAllTicketsForRisk(): Promise<void> {
    try {
      console.log(`[${new Date().toISOString()}] Running SLA risk check...`);

      const teams = await Team.find({});

      for (const team of teams) {
        await this.checkTeamTicketsForRisk(team._id.toString());
      }
    } catch (error) {
      console.error('❌ Error in risk check:', error);
    }
  }

  /**
   * Check all tickets in a team for SLA breach risk
   */
  private async checkTeamTicketsForRisk(teamId: string): Promise<void> {
    try {
      const policy = await SLAPolicy.findOne({ teamId });
      if (!policy) {
        return; // No policy configured
      }

      const openTickets = await Ticket.find({
        teamId,
        status: { $nin: ['resolved', 'closed'] },
        responseBreached: false,
        resolutionBreached: false
      });

      for (const ticket of openTickets) {
        if (SLACalculator.isAtRisk(ticket, policy)) {
          await this.sendAtRiskAlert(ticket);
        }
      }
    } catch (error) {
      console.error(`❌ Error checking team ${teamId} for risk:`, error);
    }
  }

  /**
   * Send at-risk alert email for a ticket
   */
  async sendAtRiskAlert(ticket: any): Promise<void> {
    try {
      const team = await Team.findById(ticket.teamId);
      if (!team) {
        return;
      }

      const adminEmail = team.members.find(m => m.role === 'admin')?.email || team.email;

      const now = new Date();
      const targetTimeMs = ticket.slaResolutionTarget * 60 * 60 * 1000;
      const elapsedMs = now.getTime() - ticket.createdAt.getTime();
      const percentageElapsed = Math.round((elapsedMs / targetTimeMs) * 100);
      const timeRemaining = Math.round((targetTimeMs - elapsedMs) / 60000); // minutes

      const emailSubject = `⚠️ SLA At Risk - Ticket ${ticket.ticketNumber}`;
      const emailBody = `
        <h2>⚠️ SLA Breach Alert</h2>
        <p>Ticket <strong>${ticket.ticketNumber}</strong> is approaching SLA breach.</p>
        
        <table style="border-collapse: collapse; width: 100%;">
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px;"><strong>Ticket:</strong></td>
            <td style="border: 1px solid #ddd; padding: 8px;">${ticket.ticketNumber}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px;"><strong>Title:</strong></td>
            <td style="border: 1px solid #ddd; padding: 8px;">${ticket.title}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px;"><strong>Priority:</strong></td>
            <td style="border: 1px solid #ddd; padding: 8px;">${ticket.priority}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px;"><strong>Time Elapsed:</strong></td>
            <td style="border: 1px solid #ddd; padding: 8px;">${percentageElapsed}%</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px;"><strong>Time Remaining:</strong></td>
            <td style="border: 1px solid #ddd; padding: 8px;">${timeRemaining} minutes</td>
          </tr>
        </table>
        
        <p style="color: #d32f2f; font-weight: bold;">Please take immediate action to resolve this ticket.</p>
      `;

      // Skip email in development
      if (process.env.NODE_ENV === 'development' || !process.env.SMTP_HOST) {
        console.log(`📧 [DEV] Alert for ticket ${ticket.ticketNumber} (email skipped in dev mode)`);
        return;
      }

      await EmailService.sendEmail(adminEmail, emailSubject, emailBody);
      console.log(`✅ At-risk alert sent for ticket ${ticket.ticketNumber}`);
    } catch (error) {
      console.error(`❌ Error sending at-risk alert:`, error);
    }
  }

  /**
   * Send daily compliance report email
   */
  async sendDailyReport(email: string, teamId: string): Promise<void> {
    try {
      const metrics = await SLACalculator.getSummary(teamId);

      const emailSubject = '📊 Daily SLA Compliance Report';
      const emailBody = `
        <h2>📊 Daily SLA Compliance Report</h2>
        <p>Generated on ${new Date().toLocaleDateString()}</p>
        
        <table style="border-collapse: collapse; width: 100%;">
          <tr style="background-color: #f5f5f5;">
            <td style="border: 1px solid #ddd; padding: 10px;"><strong>Metric</strong></td>
            <td style="border: 1px solid #ddd; padding: 10px;"><strong>Value</strong></td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px;">Compliance %</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${metrics.compliancePercentage}%</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px;">Total Tickets</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${metrics.totalTickets}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px;">Resolved</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${metrics.resolvedTickets}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px;">Open</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${metrics.openTickets}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px;">Breached</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${metrics.breachedTickets}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px;">At Risk</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${metrics.atRiskCount}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px;">MTTR</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${metrics.mttr} minutes</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px;">MTTR (P1)</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${metrics.mttrByPriority.P1} minutes</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px;">MTTR (P2)</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${metrics.mttrByPriority.P2} minutes</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px;">MTTR (P3)</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${metrics.mttrByPriority.P3} minutes</td>
          </tr>
        </table>
      `;

      await EmailService.sendEmail(email, emailSubject, emailBody);
      console.log(`✅ Daily report sent to ${email}`);
    } catch (error) {
      console.error(`❌ Error sending daily report:`, error);
    }
  }
}
