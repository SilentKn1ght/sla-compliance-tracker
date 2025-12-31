import { Router, Response } from 'express';
import { Ticket } from '../models/Ticket';
import { SLACalculator } from '../services/slaCalculator';
import { AuthRequest } from '../middleware/auth';
import { Schema } from 'mongoose';
import PDFDocument from 'pdfkit';

const router = Router();

interface ReportsQuery extends AuthRequest {
  query: {
    month?: string;
  };
}

/**
 * GET /api/reports/monthly
 * Generate monthly compliance report as PDF
 * Query: month (YYYY-MM format)
 */
router.get('/monthly', async (req: ReportsQuery, res: Response) => {
  try {
    if (!req.teamId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Parse month parameter
    const monthStr = req.query.month;
    let startDate: Date;
    let endDate: Date;

    if (monthStr) {
      const [year, month] = monthStr.split('-');
      startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      endDate = new Date(parseInt(year), parseInt(month), 1);
    } else {
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    }

    // Fetch tickets for the month
    const tickets = await Ticket.find({
      teamId: new Schema.Types.ObjectId(req.teamId),
      createdAt: { $gte: startDate, $lt: endDate }
    });

    // Calculate metrics
    const compliance = await SLACalculator.calculateTeamCompliance(req.teamId, startDate);
    const mttr = await SLACalculator.calculateMTTR(req.teamId, startDate);
    const mttrByPriority = await SLACalculator.calculateMTTRByPriority(req.teamId, startDate);

    const resolvedTickets = tickets.filter(
      t => t.status === 'resolved' || t.status === 'closed'
    );
    const breachedTickets = tickets.filter(
      t => t.responseBreached || t.resolutionBreached
    );

    // Get worst performing tickets
    const worstTickets = tickets
      .filter(t => t.responseBreached || t.resolutionBreached)
      .sort((a, b) => (b.resolutionTime || 0) - (a.resolutionTime || 0))
      .slice(0, 10);

    // Create PDF
    const doc = new PDFDocument();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="sla-report-${startDate.toISOString().split('T')[0]}.pdf"`
    );

    doc.pipe(res);

    // Header
    doc.fontSize(24).font('Helvetica-Bold').text('SLA Compliance Report', 50, 50);
    doc.fontSize(12).font('Helvetica').text(
      `Report Period: ${startDate.toLocaleDateString()} - ${new Date(endDate.getTime() - 86400000).toLocaleDateString()}`,
      50,
      80
    );

    // Summary Section
    doc.fontSize(16).font('Helvetica-Bold').text('Summary', 50, 130);

    const summaryY = 160;
    const metrics = [
      { label: 'Compliance %', value: `${compliance}%`, color: compliance >= 95 ? 'green' : 'red' },
      { label: 'Total Tickets', value: tickets.length.toString(), color: 'black' },
      { label: 'Resolved', value: resolvedTickets.length.toString(), color: 'black' },
      { label: 'Breached', value: breachedTickets.length.toString(), color: 'red' },
      { label: 'MTTR', value: `${mttr} mins`, color: 'black' }
    ];

    let xPos = 50;
    metrics.forEach((metric, index) => {
      if (index > 0 && index % 3 === 0) {
        xPos = 50;
        doc.y += 80;
      }

      doc.rect(xPos, doc.y, 140, 70).stroke();
      doc.fontSize(10).font('Helvetica').text(metric.label, xPos + 10, doc.y + 10);
      doc.fontSize(14).font('Helvetica-Bold').fillColor(metric.color).text(metric.value, xPos + 10, doc.y + 30);
      doc.fillColor('black');

      xPos += 160;
    });

    doc.y += 100;

    // MTTR by Priority
    doc.fontSize(14).font('Helvetica-Bold').text('MTTR by Priority', 50, doc.y);
    doc.fontSize(10).font('Helvetica');
    doc.y += 30;
    doc.text(`P1 (Critical): ${mttrByPriority.P1} minutes`);
    doc.text(`P2 (High): ${mttrByPriority.P2} minutes`);
    doc.text(`P3 (Medium): ${mttrByPriority.P3} minutes`);

    // Worst Performing Tickets
    if (worstTickets.length > 0) {
      doc.y += 30;
      doc.fontSize(14).font('Helvetica-Bold').text('Worst Performing Tickets', 50, doc.y);
      doc.y += 20;

      const tableTop = doc.y;
      const columns = [
        { x: 50, width: 80 },
        { x: 140, width: 120 },
        { x: 270, width: 50 },
        { x: 330, width: 80 },
        { x: 420, width: 80 }
      ];

      // Table header
      doc.fontSize(9).font('Helvetica-Bold').fillColor('black');
      doc.text('Ticket', columns[0].x, tableTop);
      doc.text('Title', columns[1].x, tableTop);
      doc.text('Priority', columns[2].x, tableTop);
      doc.text('Response Time', columns[3].x, tableTop);
      doc.text('Resolution Time', columns[4].x, tableTop);

      // Table rows
      doc.fontSize(8).font('Helvetica');
      worstTickets.forEach((ticket, index) => {
        const y = tableTop + 20 + index * 15;
        doc.text(ticket.ticketNumber, columns[0].x, y);
        doc.text(ticket.title.substring(0, 15), columns[1].x, y);
        doc.text(ticket.priority, columns[2].x, y);
        doc.text(`${ticket.responseTime || 'N/A'} mins`, columns[3].x, y);
        doc.text(`${ticket.resolutionTime || 'N/A'} mins`, columns[4].x, y);
      });
    }

    doc.end();
  } catch (error) {
    console.error('Monthly report error:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

/**
 * GET /api/reports/csv
 * Export tickets as CSV
 */
router.get('/csv', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.teamId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const tickets = await Ticket.find({
      teamId: new Schema.Types.ObjectId(req.teamId)
    }).sort({ createdAt: -1 });

    // CSV headers
    const headers = [
      'Ticket #',
      'Title',
      'Priority',
      'Status',
      'Created',
      'First Response',
      'Resolved',
      'Response Time (mins)',
      'Resolution Time (mins)',
      'SLA Met'
    ];

    // CSV rows
    const rows = tickets.map(ticket => [
      ticket.ticketNumber,
      `"${ticket.title}"`,
      ticket.priority,
      ticket.status,
      ticket.createdAt.toISOString(),
      ticket.firstResponseAt?.toISOString() || '',
      ticket.resolvedAt?.toISOString() || '',
      ticket.responseTime || '',
      ticket.resolutionTime || '',
      !ticket.responseBreached && !ticket.resolutionBreached ? 'Yes' : 'No'
    ]);

    // Generate CSV content
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="sla-tickets-${new Date().toISOString().split('T')[0]}.csv"`
    );

    res.send(csvContent);
  } catch (error) {
    console.error('CSV export error:', error);
    res.status(500).json({ error: 'Failed to export CSV' });
  }
});

export default router;
