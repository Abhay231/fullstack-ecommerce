const nodemailer = require("nodemailer");

const sendEmail = async ({ email, subject, message }) => {
  const transporter = nodemailer.createTransport({
    service: process.env.SMTP_SERVICE || "gmail",
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD
    }
  });

  const mailOptions = {
    from: process.env.SMTP_EMAIL,
    to: email,
    subject: subject,
    html: message
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
