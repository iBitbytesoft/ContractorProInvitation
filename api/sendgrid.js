// SendGrid email service integration
import sgMail from '@sendgrid/mail';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize SendGrid with your API key
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

if (!SENDGRID_API_KEY) {
  console.warn('SENDGRID_API_KEY is not set in environment variables. Email functionality will not work.');
} else {
  sgMail.setApiKey(SENDGRID_API_KEY);
  console.log('SendGrid initialized successfully');
}

/**
 * Send an email using SendGrid
 * @param {Object} emailData - The email data
 * @param {string} emailData.to - Recipient email address
 * @param {string} emailData.from - Sender email address (must be verified in SendGrid)
 * @param {string} emailData.subject - Email subject
 * @param {string} emailData.text - Plain text email content
 * @param {string} [emailData.html] - HTML email content (optional)
 * @returns {Promise} - SendGrid API response
 */
export const sendEmail = async (emailData) => {
  try {
    if (!SENDGRID_API_KEY) {
      throw new Error('SendGrid API key is not configured');
    }

    // Set default sender if not provided
    if (!emailData.from) {
      emailData.from = process.env.DEFAULT_FROM_EMAIL || 'noreply@contractorpro.com';
    }

    console.log('Sending email to:', emailData.to);
    console.log('Email subject:', emailData.subject);
    
    // Send the email using SendGrid
    const response = await sgMail.send(emailData);
    console.log('Email sent successfully:', response);
    return response;
  } catch (error) {
    console.error('Error sending email with SendGrid:', error);
    if (error.response) {
      console.error('SendGrid API error details:', error.response.body);
    }
    throw error;
  }
};

/**
 * Send an invitation email
 * @param {Object} invitationData - The invitation data
 * @param {string} invitationData.to - Recipient email address
 * @param {string} invitationData.inviterEmail - Email of the person who sent the invitation
 * @param {string} invitationData.invitationLink - The invitation link
 * @param {string} invitationData.role - The role the invitee is being invited to
 * @returns {Promise} - SendGrid API response
 */
export const sendInvitationEmail = async (invitationData) => {
  const { to, inviterEmail, invitationLink, role } = invitationData;
  
  // HTML template for the invitation email
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #333;">You've Been Invited to ContractorPro</h1>
      </div>
      
      <p style="font-size: 16px; line-height: 1.5; color: #555;">
        Hello,
      </p>
      
      <p style="font-size: 16px; line-height: 1.5; color: #555;">
        You have been invited by <strong>${inviterEmail}</strong> to join ContractorPro as a <strong>${role}</strong>.
      </p>
      
      <p style="font-size: 16px; line-height: 1.5; color: #555;">
        ContractorPro helps construction professionals manage their assets, vendors, and team all in one place.
      </p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${invitationLink}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
          Accept Invitation
        </a>
      </div>
      
      <p style="font-size: 16px; line-height: 1.5; color: #555;">
        Or copy and paste this link into your browser:
      </p>
      
      <p style="font-size: 14px; line-height: 1.5; color: #777; word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 3px;">
        ${invitationLink}
      </p>
      
      <p style="font-size: 16px; line-height: 1.5; color: #555;">
        This invitation will expire in 7 days.
      </p>
      
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 14px; color: #777; text-align: center;">
        <p>If you did not expect this invitation, you can safely ignore this email.</p>
      </div>
    </div>
  `;

  // Plain text version as a fallback
  const textContent = `
    You've Been Invited to ContractorPro
    
    Hello,
    
    You have been invited by ${inviterEmail} to join ContractorPro as a ${role}.
    
    ContractorPro helps construction professionals manage their assets, vendors, and team all in one place.
    
    To accept the invitation, please visit: ${invitationLink}
    
    This invitation will expire in 7 days.
    
    If you did not expect this invitation, you can safely ignore this email.
  `;

  // Prepare the email data
  const emailData = {
    to,
    subject: `Invitation to join ContractorPro as ${role}`,
    text: textContent,
    html: htmlContent,
  };

  // Send the email
  return sendEmail(emailData);
};