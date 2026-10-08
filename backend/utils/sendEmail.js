const { Resend } = require('resend');

const sendEmail = async ({ email, subject, message }) => {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: `ShopNest Support <${process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'}>`,
      to: [email],
      subject: subject,
      html: message,
    });

    if (error) throw error;
    console.log(`Email successfully sent to ${email}`);
    return true;
  } catch (error) {
    console.error(`Failed to send email to ${email}:`, error);
    return false;
  }
};

module.exports = sendEmail;
