import nodemailer from 'nodemailer';

export class EmailService {
  private static transporter: nodemailer.Transporter | null = null;

  private static getTransporter(): nodemailer.Transporter {
    if (EmailService.transporter) {
      return EmailService.transporter;
    }

    EmailService.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    return EmailService.transporter;
  }

  /**
   * Send email to recipient
   */
  static async sendEmail(
    to: string,
    subject: string,
    html: string,
    text?: string
  ): Promise<void> {
    try {
      const transporter = EmailService.getTransporter();

      const mailOptions = {
        from: process.env.SMTP_FROM || 'noreply@slatracker.com',
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, '')
      };

      const info = await transporter.sendMail(mailOptions);
      console.log(`📧 Email sent: ${info.messageId}`);
    } catch (error) {
      console.error('❌ Error sending email:', error);
      throw error;
    }
  }

  /**
   * Send welcome email to new team
   */
  static async sendWelcomeEmail(email: string, teamName: string): Promise<void> {
    const subject = `Welcome to SLA Compliance Tracker, ${teamName}!`;
    const html = `
      <h1>Welcome to SLA Compliance Tracker</h1>
      <p>Hi,</p>
      <p>Thank you for signing up! Your team <strong>${teamName}</strong> is now ready to track SLAs.</p>
      
      <h3>Next Steps:</h3>
      <ol>
        <li>Log in to your dashboard</li>
        <li>Configure your SLA policy</li>
        <li>Create your first ticket</li>
        <li>Start tracking compliance</li>
      </ol>
      
      <p>If you have any questions, feel free to contact our support team.</p>
      <p>Best regards,<br>SLA Compliance Tracker Team</p>
    `;

    await EmailService.sendEmail(email, subject, html);
  }

  /**
   * Send verification email (for future implementation)
   */
  static async sendVerificationEmail(email: string, verificationLink: string): Promise<void> {
    const subject = 'Verify your email address';
    const html = `
      <h2>Email Verification</h2>
      <p>Please click the link below to verify your email address:</p>
      <p><a href="${verificationLink}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Verify Email</a></p>
      <p>This link expires in 24 hours.</p>
    `;

    await EmailService.sendEmail(email, subject, html);
  }

  /**
   * Send password reset email (for future implementation)
   */
  static async sendPasswordResetEmail(
    email: string,
    resetLink: string
  ): Promise<void> {
    const subject = 'Reset your password';
    const html = `
      <h2>Password Reset Request</h2>
      <p>Click the link below to reset your password:</p>
      <p><a href="${resetLink}" style="background-color: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Reset Password</a></p>
      <p>This link expires in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `;

    await EmailService.sendEmail(email, subject, html);
  }
}
