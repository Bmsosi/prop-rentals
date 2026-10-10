import nodemailer from "nodemailer";

const createTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

export const sendPasswordResetEmail = async (email, resetToken) => {
  const transporter = createTransporter();

  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: `"Rental Management" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Password Reset Request",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #374151; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f9fafb; padding: 30px; }
            .button { 
              display: inline-block; 
              padding: 12px 24px; 
              background-color: #374151; 
              color: white; 
              text-decoration: none; 
              border-radius: 5px; 
              margin: 20px 0; 
            }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>We received a request to reset your password. Click the button below to create a new password:</p>
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </div>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #374151;">${resetUrl}</p>
              <p><strong>This link will expire in 30 minutes.</strong></p>
              <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Rental Management. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
      Password Reset Request
      
      We received a request to reset your password. 
      
      Click this link to reset your password: ${resetUrl}
      
      This link will expire in 30 minutes.
      
      If you didn't request a password reset, please ignore this email.
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${email}`);
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send password reset email");
  }
};

export const sendInsuranceExpiringEmail = async (insurance, recipientEmail, recipientName, daysUntilExpiry) => {
  const transporter = createTransporter();

  const propertyName = insurance.lease?.listing?.streetAddress || 
                       insurance.lease?.propertyAddress ||
                       insurance.customLease?.leaseName || 
                       "your property";

  const expiryDateFormatted = new Date(insurance.expiryDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const mailOptions = {
    from: `"Rental Management" <${process.env.EMAIL_USER}>`,
    to: recipientEmail,
    subject: "Renter's Insurance Expiring Soon",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #f59e0b; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f9fafb; padding: 30px; }
            .info-box { background-color: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Renter's Insurance Expiring Soon</h1>
            </div>
            <div class="content">
              <p>Hello ${recipientName},</p>
              <p>This is a reminder that your renter's insurance policy is expiring soon.</p>
              <div class="info-box">
                <strong>Insurance Details:</strong><br>
                Property: ${propertyName}<br>
                Provider: ${insurance.providerName}<br>
                Policy Number: ${insurance.policyNumber}<br>
                Expiry Date: ${expiryDateFormatted}<br>
                Days Until Expiry: <strong>${daysUntilExpiry} days</strong>
              </div>
              <p>Please renew your insurance policy and upload the updated documentation to avoid any issues with your lease.</p>
              <p>If you have already renewed your policy, please upload the new documentation at your earliest convenience.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Rental Management. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
      Renter's Insurance Expiring Soon
      
      Hello ${recipientName},
      
      This is a reminder that your renter's insurance policy is expiring soon.
      
      Insurance Details:
      Property: ${propertyName}
      Provider: ${insurance.providerName}
      Policy Number: ${insurance.policyNumber}
      Expiry Date: ${expiryDateFormatted}
      Days Until Expiry: ${daysUntilExpiry} days
      
      Please renew your insurance policy and upload the updated documentation to avoid any issues with your lease.
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Insurance expiring email sent to ${recipientEmail}`);
  } catch (error) {
    console.error("Error sending insurance expiring email:", error);
    throw new Error("Failed to send insurance expiring email");
  }
};

export const sendInsuranceExpiredEmail = async (insurance, recipientEmail, recipientName) => {
  const transporter = createTransporter();

  const propertyName = insurance.lease?.listing?.streetAddress || 
                       insurance.lease?.propertyAddress ||
                       insurance.customLease?.leaseName || 
                       "your property";

  const expiryDateFormatted = new Date(insurance.expiryDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const mailOptions = {
    from: `"Rental Management" <${process.env.EMAIL_USER}>`,
    to: recipientEmail,
    subject: "Renter's Insurance Expired - Action Required",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #dc2626; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f9fafb; padding: 30px; }
            .alert-box { background-color: #fee2e2; padding: 15px; border-left: 4px solid #dc2626; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Renter's Insurance Expired</h1>
            </div>
            <div class="content">
              <p>Hello ${recipientName},</p>
              <p>Your renter's insurance policy has expired and needs immediate attention.</p>
              <div class="alert-box">
                <strong>Insurance Details:</strong><br>
                Property: ${propertyName}<br>
                Provider: ${insurance.providerName}<br>
                Policy Number: ${insurance.policyNumber}<br>
                Expiry Date: ${expiryDateFormatted}<br>
                Status: <strong style="color: #dc2626;">EXPIRED</strong>
              </div>
              <p><strong>Action Required:</strong> Please renew your renter's insurance immediately and upload the new policy documentation. An active insurance policy may be required as part of your lease agreement.</p>
              <p>If you have already renewed your policy, please upload the updated documentation as soon as possible.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Rental Management. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
      Renter's Insurance Expired - Action Required
      
      Hello ${recipientName},
      
      Your renter's insurance policy has expired and needs immediate attention.
      
      Insurance Details:
      Property: ${propertyName}
      Provider: ${insurance.providerName}
      Policy Number: ${insurance.policyNumber}
      Expiry Date: ${expiryDateFormatted}
      Status: EXPIRED
      
      Action Required: Please renew your renter's insurance immediately and upload the new policy documentation.
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Insurance expired email sent to ${recipientEmail}`);
  } catch (error) {
    console.error("Error sending insurance expired email:", error);
    throw new Error("Failed to send insurance expired email");
  }
};

export const sendInsuranceVerifiedEmail = async (insurance, tenantEmail, tenantName) => {
  const transporter = createTransporter();

  const propertyName = insurance.lease?.listing?.streetAddress || 
                       insurance.lease?.propertyAddress ||
                       insurance.customLease?.leaseName || 
                       "your property";

  const mailOptions = {
    from: `"Rental Management" <${process.env.EMAIL_USER}>`,
    to: tenantEmail,
    subject: "Renter's Insurance Verified",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #10b981; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f9fafb; padding: 30px; }
            .success-box { background-color: #d1fae5; padding: 15px; border-left: 4px solid #10b981; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Insurance Verified</h1>
            </div>
            <div class="content">
              <p>Hello ${tenantName},</p>
              <p>Great news! Your renter's insurance policy has been verified by your landlord.</p>
              <div class="success-box">
                <strong>Insurance Details:</strong><br>
                Property: ${propertyName}<br>
                Provider: ${insurance.providerName}<br>
                Policy Number: ${insurance.policyNumber}<br>
                Status: <strong style="color: #10b981;">VERIFIED</strong>
              </div>
              <p>Your insurance documentation is now on file. Please remember to keep your policy active and update your documentation when you renew.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Rental Management. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
      Insurance Verified
      
      Hello ${tenantName},
      
      Great news! Your renter's insurance policy has been verified by your landlord.
      
      Insurance Details:
      Property: ${propertyName}
      Provider: ${insurance.providerName}
      Policy Number: ${insurance.policyNumber}
      Status: VERIFIED
      
      Your insurance documentation is now on file.
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Insurance verified email sent to ${tenantEmail}`);
  } catch (error) {
    console.error("Error sending insurance verified email:", error);
    throw new Error("Failed to send insurance verified email");
  }
};

export const sendInsuranceRejectedEmail = async (insurance, tenantEmail, tenantName) => {
  const transporter = createTransporter();

  const propertyName = insurance.lease?.listing?.streetAddress || 
                       insurance.lease?.propertyAddress ||
                       insurance.customLease?.leaseName || 
                       "your property";

  const mailOptions = {
    from: `"Rental Management" <${process.env.EMAIL_USER}>`,
    to: tenantEmail,
    subject: "Renter's Insurance Requires Attention",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #f59e0b; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f9fafb; padding: 30px; }
            .warning-box { background-color: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Insurance Requires Attention</h1>
            </div>
            <div class="content">
              <p>Hello ${tenantName},</p>
              <p>Your landlord has reviewed your renter's insurance documentation and it requires attention.</p>
              <div class="warning-box">
                <strong>Insurance Details:</strong><br>
                Property: ${propertyName}<br>
                Provider: ${insurance.providerName}<br>
                Policy Number: ${insurance.policyNumber}<br><br>
                <strong>Reason:</strong> ${insurance.rejectionReason || 'Please contact your landlord for details'}
              </div>
              <p>Please review the reason above and resubmit your insurance documentation with the necessary corrections or updates.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Rental Management. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
      Insurance Requires Attention
      
      Hello ${tenantName},
      
      Your landlord has reviewed your renter's insurance documentation and it requires attention.
      
      Insurance Details:
      Property: ${propertyName}
      Provider: ${insurance.providerName}
      Policy Number: ${insurance.policyNumber}
      
      Reason: ${insurance.rejectionReason || 'Please contact your landlord for details'}
      
      Please review the reason above and resubmit your insurance documentation with the necessary corrections or updates.
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Insurance rejected email sent to ${tenantEmail}`);
  } catch (error) {
    console.error("Error sending insurance rejected email:", error);
    throw new Error("Failed to send insurance rejected email");
  }
};
