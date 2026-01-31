import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

class EmailService {
  constructor() {
    this.transporter = null;
    this.isInitialized = false;
    this.initPromise = this.initializeTransporter();
  }

  async initializeTransporter() {
    try {
      // For development, use ethereal email (test email service)
      if (process.env.NODE_ENV !== 'production') {
        // Using ethereal for testing - will show email URLs in console
        const account = await new Promise((resolve, reject) => {
          nodemailer.createTestAccount((err, account) => {
            if (err) {
              reject(err);
            } else {
              resolve(account);
            }
          });
        });

        this.transporter = nodemailer.createTransport({
          host: account.smtp.host,
          port: account.smtp.port,
          secure: account.smtp.secure,
          auth: {
            user: account.user,
            pass: account.pass,
          },
        });

        this.isInitialized = true;
        console.log('Email service initialized with test account');
        console.log('Test email credentials:', {
          user: account.user,
          pass: account.pass,
          web: 'https://ethereal.email/messages'
        });
      } else {
        // Production configuration - configure with real SMTP
        this.transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT || 587,
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });
        this.isInitialized = true;
        console.log('Email service initialized with production SMTP');
      }
    } catch (error) {
      console.error('Failed to initialize email service:', error);
      this.isInitialized = false;
    }
  }

  async waitForInitialization() {
    if (!this.isInitialized) {
      await this.initPromise;
    }
  }

  async sendInstitutionCreatedEmail(institutionData, createdByEmail) {
    await this.waitForInitialization();
    
    if (!this.isInitialized || !this.transporter) {
      console.warn('Email transporter not initialized, skipping institution created email');
      return false;
    }

    const { name, domain, admin } = institutionData;

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@yagnexor.com',
      to: createdByEmail,
      subject: `Institution Created: ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #4f46e5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">YAGNEXOR</h1>
            <p style="margin: 5px 0 0; opacity: 0.9;">Educational Management Platform</p>
          </div>
          
          <div style="background-color: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
            <h2 style="color: #1f2937; margin-top: 0;">Institution Successfully Created</h2>
            
            <p style="color: #6b7280; line-height: 1.6;">
              You have successfully created a new institution in the YAGNEXOR platform. Here are the details:
            </p>
            
            <div style="background-color: white; padding: 20px; border-radius: 6px; border: 1px solid #e5e7eb; margin: 20px 0;">
              <h3 style="color: #1f2937; margin-top: 0; font-size: 16px;">Institution Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Name:</td>
                  <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${name}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Domain:</td>
                  <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${domain}.yagnexor.com</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Admin Email:</td>
                  <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${admin.email}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Admin Name:</td>
                  <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${admin.first_name} ${admin.last_name}</td>
                </tr>
              </table>
            </div>
            
            <div style="background-color: #eff6ff; padding: 15px; border-radius: 6px; border-left: 4px solid #3b82f6; margin: 20px 0;">
              <p style="margin: 0; color: #1e40af; font-size: 14px;">
                <strong>Next Steps:</strong> The institution admin can now log in using their credentials to manage their institution.
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" 
                 style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
                Go to Dashboard
              </a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
              This is an automated message from YAGNEXOR Educational Management Platform.
            </p>
          </div>
        </div>
      `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      
      if (process.env.NODE_ENV !== 'production') {
        console.log('Institution created email sent successfully!');
        console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
      }
      
      return true;
    } catch (error) {
      console.error('Error sending institution created email:', error);
      return false;
    }
  }

  async sendAdminWelcomeEmail(institutionData) {
    await this.waitForInitialization();
    
    if (!this.isInitialized || !this.transporter) {
      console.warn('Email transporter not initialized, skipping admin welcome email');
      return false;
    }

    const { name, domain, admin } = institutionData;

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@yagnexor.com',
      to: admin.email,
      subject: `Welcome to YAGNEXOR - ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #4f46e5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">YAGNEXOR</h1>
            <p style="margin: 5px 0 0; opacity: 0.9;">Educational Management Platform</p>
          </div>
          
          <div style="background-color: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
            <h2 style="color: #1f2937; margin-top: 0;">Welcome to Your Institution Dashboard!</h2>
            
            <p style="color: #6b7280; line-height: 1.6;">
              Dear ${admin.first_name} ${admin.last_name},
            </p>
            
            <p style="color: #6b7280; line-height: 1.6;">
              Your institution <strong>${name}</strong> has been successfully set up on the YAGNEXOR platform. You are now the administrator and can start managing your educational institution.
            </p>
            
            <div style="background-color: white; padding: 20px; border-radius: 6px; border: 1px solid #e5e7eb; margin: 20px 0;">
              <h3 style="color: #1f2937; margin-top: 0; font-size: 16px;">Your Login Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Email:</td>
                  <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${admin.email}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Domain:</td>
                  <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${domain}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Role:</td>
                  <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">Administrator</td>
                </tr>
              </table>
            </div>
            
            <div style="background-color: #10b981; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p style="margin: 0; color: white; font-size: 14px;">
                <strong>🎉 Ready to get started?</strong> Log in to your dashboard to begin managing students, faculty, courses, and more!
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" 
                 style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
                Log In to Dashboard
              </a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
              This is an automated message from YAGNEXOR Educational Management Platform.
            </p>
          </div>
        </div>
      `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      
      if (process.env.NODE_ENV !== 'production') {
        console.log('Admin welcome email sent successfully!');
        console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
      }
      
      return true;
    } catch (error) {
      console.error('Error sending admin welcome email:', error);
      return false;
    }
  }
}

// Create singleton instance
const emailService = new EmailService();

export default emailService;
