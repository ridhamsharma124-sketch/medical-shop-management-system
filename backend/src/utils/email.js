import nodemailer from 'nodemailer';

let transporter = null;

const getTransporter = () => {
  if (!transporter && process.env.MAIL_USER && process.env.MAIL_PASS) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });
  }
  return transporter;
};

export const sendOtpEmail = async (to, otp, minutes) => {
  const mailer = getTransporter();

  if (!mailer) {
    console.log(`\n[DEV MODE] OTP for ${to}: ${otp} (valid for ${minutes} min)\n`);
    return;
  }

  const fromName = process.env.MAIL_FROM || 'MedHeritage';

  await mailer.sendMail({
    from: `"${fromName}" <${process.env.MAIL_USER}>`,
    to,
    subject: 'MedHeritage — Your OTP Code',
    html: `
      <div style="font-family:Arial,sans-serif;background:#FBF3E7;padding:28px;border-radius:12px;max-width:460px;margin:auto;">
        <h2 style="color:#2B211B;margin:0 0 6px;">MedHeritage</h2>
        <p style="color:#5C5049;font-size:14px;">Use this OTP to complete your account registration.</p>
        <div style="background:#fff;border:1px solid #E7D8C4;border-radius:10px;padding:18px 20px;margin:18px 0;text-align:center;">
          <div style="font-size:11px;letter-spacing:2px;color:#8a7766;text-transform:uppercase;">Your OTP</div>
          <div style="font-size:34px;font-weight:700;letter-spacing:8px;color:#C1592E;margin:6px 0;">${otp}</div>
        </div>
        <p style="color:#5C5049;font-size:13px;margin:0;">This code is valid for <b>${minutes} minutes</b>. Do not share it with anyone.</p>
      </div>
    `,
  });
};