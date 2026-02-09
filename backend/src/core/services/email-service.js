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
      // Check if real SMTP settings are provided
      if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        // Use real SMTP settings
        this.transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT) || 587,
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        });
        console.log('Email service initialized with real SMTP:', {
          host: process.env.SMTP_HOST,
          user: process.env.SMTP_USER,
          port: process.env.SMTP_PORT
        });
      } else {
        // For development, use ethereal email (test email service)
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
            pass: account.pass
          }
        });
        console.log('Email service initialized with test account');
        console.log('Test email credentials:', {
          user: account.user,
          pass: account.pass,
        });
      }

      this.isInitialized = true;
      console.log('Email service initialized successfully');
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
                  <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${domain}</td>
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
      console.error('Email service not initialized');
      return false;
    }

    const emailHtml = `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px;">Welcome to YAGNEXOR</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Educational Management System</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 10px; margin-top: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-bottom: 20px;">Your Institution is Ready!</h2>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
            Dear <strong>${institutionData.admin_first_name} ${institutionData.admin_last_name}</strong>,
          </p>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
            Your institution <strong>${institutionData.tenant_name}</strong> has been successfully created and is ready to use.
          </p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Institution Details:</h3>
            <ul style="color: #666; line-height: 1.6;">
              <li><strong>Name:</strong> ${institutionData.tenant_name}</li>
              <li><strong>Domain:</strong> ${institutionData.tenant_domain}</li>
              <li><strong>Your Email:</strong> ${institutionData.admin_email}</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="http://localhost:5173/login" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                      color: white; 
                      padding: 15px 30px; 
                      text-decoration: none; 
                      border-radius: 5px; 
                      font-weight: bold;
                      display: inline-block;">
              Login to Your Dashboard
            </a>
          </div>
          
          <p style="color: #999; font-size: 14px; margin-top: 30px;">
            If you have any questions or need assistance, please contact our support team.
          </p>
        </div>
      </div>
    `;

    const mailOptions = {
      from: `"YAGNEXOR System" <${this.transporter.options.auth.user}>`,
      to: institutionData.admin_email,
      subject: 'Welcome to YAGNEXOR - Your Institution is Ready',
      html: emailHtml
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

  // Generic sendEmail method for custom emails
  async sendEmail({ to, subject, html, text }) {
    await this.waitForInitialization();
    
    if (!this.isInitialized || !this.transporter) {
      console.error('Email service not initialized');
      return false;
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM || `"YAGNEXOR System" <${this.transporter.options.auth.user}>`,
      to,
      subject,
      html,
      text
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      
      if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        console.log('Email sent successfully via real SMTP!');
        console.log('Message ID:', info.messageId);
      } else {
        console.log('Email sent successfully!');
        console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
      }
      
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }
}

// Create singleton instance
const emailService = new EmailService();

// Export the instance and the sendEmail method
export default emailService;
export const sendEmail = emailService.sendEmail.bind(emailService);
