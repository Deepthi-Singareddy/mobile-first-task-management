const nodemailer = require('nodemailer');

/**
 * Create Nodemailer transporter using environment variables
 */
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

/**
 * Send task creation confirmation email
 * @param {string} toEmail - Recipient email address
 * @param {string} userName - User's name
 * @param {object} task - Task object
 */
const sendTaskCreatedEmail = async (toEmail, userName, task) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('Email credentials not configured. Skipping email notification.');
      return null;
    }

    const transporter = createTransporter();

    const mailOptions = {
      from: `"TaskFlow App" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: `✅ Task Created: ${task.title}`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">📋 TaskFlow</h1>
          </div>
          <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #1e293b; margin-top: 0;">Hi ${userName}! 👋</h2>
            <p style="color: #475569; font-size: 16px;">Your new task has been created successfully:</p>
            <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0;">
              <h3 style="color: #1e293b; margin: 0 0 8px 0;">${task.title}</h3>
              ${task.description ? `<p style="color: #64748b; margin: 0 0 8px 0;">${task.description}</p>` : ''}
              <div style="display: flex; gap: 12px; flex-wrap: wrap; margin-top: 12px;">
                <span style="background: #dbeafe; color: #1d4ed8; padding: 4px 12px; border-radius: 20px; font-size: 13px;">Status: ${task.status}</span>
                <span style="background: #fef3c7; color: #d97706; padding: 4px 12px; border-radius: 20px; font-size: 13px;">Priority: ${task.priority}</span>
                ${task.dueDate ? `<span style="background: #ede9fe; color: #7c3aed; padding: 4px 12px; border-radius: 20px; font-size: 13px;">Due: ${new Date(task.dueDate).toLocaleDateString()}</span>` : ''}
                ${task.location ? `<span style="background: #dcfce7; color: #16a34a; padding: 4px 12px; border-radius: 20px; font-size: 13px;">📍 ${task.location}</span>` : ''}
              </div>
            </div>
            <p style="color: #94a3b8; font-size: 13px; margin-top: 24px; text-align: center;">
              This is an automated notification from TaskFlow.
            </p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Task creation email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Failed to send task creation email:', error.message);
    return null;
  }
};

/**
 * Send task completion notification email
 * @param {string} toEmail - Recipient email address
 * @param {string} userName - User's name
 * @param {object} task - Task object
 */
const sendTaskCompletedEmail = async (toEmail, userName, task) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('Email credentials not configured. Skipping email notification.');
      return null;
    }

    const transporter = createTransporter();

    const mailOptions = {
      from: `"TaskFlow App" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: `🎉 Task Completed: ${task.title}`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; padding: 20px;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">🎉 Task Completed!</h1>
          </div>
          <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #1e293b; margin-top: 0;">Great job, ${userName}! 🏆</h2>
            <p style="color: #475569; font-size: 16px;">You've completed the following task:</p>
            <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981; margin: 20px 0;">
              <h3 style="color: #1e293b; margin: 0 0 8px 0;">✅ ${task.title}</h3>
              ${task.description ? `<p style="color: #64748b; margin: 0;">${task.description}</p>` : ''}
            </div>
            <p style="color: #475569; font-size: 14px; text-align: center;">
              Keep up the great work! 💪
            </p>
            <p style="color: #94a3b8; font-size: 13px; margin-top: 24px; text-align: center;">
              This is an automated notification from TaskFlow.
            </p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Task completion email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Failed to send task completion email:', error.message);
    return null;
  }
};

module.exports = { sendTaskCreatedEmail, sendTaskCompletedEmail };
