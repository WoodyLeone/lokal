const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    try {
      // For development, we'll use Gmail SMTP
      // In production, you should use a proper email service like SendGrid, Mailgun, etc.
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER || 'your-email@gmail.com',
          pass: process.env.EMAIL_PASSWORD || 'your-app-password'
        }
      });

      console.log('📧 Email service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error);
      this.transporter = null;
    }
  }

  async sendVerificationEmail(email, verificationToken) {
    try {
      if (!this.transporter) {
        console.warn('⚠️ Email service not available, logging verification token for manual testing');
        console.log(`📧 Verification email would be sent to: ${email}`);
        console.log(`🔗 Verification token: ${verificationToken}`);
        console.log(`🔗 Verification URL: ${process.env.FRONTEND_URL || 'https://lokal.app'}/verify?token=${verificationToken}`);
        return false;
      }

      const verificationUrl = `${process.env.FRONTEND_URL || 'https://lokal.app'}/verify?token=${verificationToken}`;
      
      const mailOptions = {
        from: process.env.EMAIL_USER || 'noreply@lokal.app',
        to: email,
        subject: 'Verify your Lokal account',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Welcome to Lokal! 🎉</h2>
            <p>Thanks for signing up. Please verify your email address to complete your registration.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Verify Email Address
              </a>
            </div>
            
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
            
            <p>This link will expire in 1 hour.</p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 12px;">
              If you didn't create a Lokal account, you can safely ignore this email.
            </p>
          </div>
        `
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Verification email sent successfully to:', email);
      return true;
    } catch (error) {
      console.error('❌ Failed to send verification email:', error);
      return false;
    }
  }

  async sendWelcomeEmail(email, username) {
    try {
      if (!this.transporter) {
        console.warn('⚠️ Email service not available, skipping welcome email');
        return false;
      }

      const mailOptions = {
        from: process.env.EMAIL_USER || 'noreply@lokal.app',
        to: email,
        subject: 'Welcome to Lokal! 🚀',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Welcome to Lokal, ${username}! 🎉</h2>
            <p>Your account has been successfully verified and you're ready to start creating amazing shoppable videos.</p>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin-top: 0;">What you can do now:</h3>
              <ul>
                <li>Upload videos and create shoppable content</li>
                <li>Add product links and hotspots</li>
                <li>Share your videos with your audience</li>
                <li>Track engagement and performance</li>
              </ul>
            </div>
            
            <p>Ready to get started? Open the Lokal app and start creating!</p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 12px;">
              Thanks for choosing Lokal for your shoppable video needs.
            </p>
          </div>
        `
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Welcome email sent successfully to:', email);
      return true;
    } catch (error) {
      console.error('❌ Failed to send welcome email:', error);
      return false;
    }
  }
}

module.exports = new EmailService(); 