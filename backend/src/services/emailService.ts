// Basic email service structure
// In production, integrate with a service like SendGrid, AWS SES, or similar

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  // TODO: Implement actual email sending
  // For now, just log the email
  console.log('Email would be sent:', {
    to: options.to,
    subject: options.subject,
    html: options.html,
  });

  // In production, use a service like:
  // - SendGrid
  // - AWS SES
  // - Nodemailer with SMTP
  // - Resend
  // etc.
}

export async function sendOrderApprovalEmail(
  userEmail: string,
  userName: string,
  orderId: number
): Promise<void> {
  const subject = `Order #${orderId} Approved - EFX LED Shop`;
  const html = `
    <h2>Your Order Has Been Approved!</h2>
    <p>Hi ${userName},</p>
    <p>Great news! Your order #${orderId} has been approved and is now being processed.</p>
    <p>You can track your order status by logging into your account.</p>
    <p>Thank you for your business!</p>
    <p>Best regards,<br>The EFX LED Shop Team</p>
  `;

  await sendEmail({
    to: userEmail,
    subject,
    html,
    text: `Your order #${orderId} has been approved and is now being processed.`,
  });
}



