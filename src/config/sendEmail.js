const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: process.env.EMAIL_SEND,
        pass: process.env.EMAIL_SEND_PASSWORD
    }
});

async function sendMail(to, subject, text) {
    const mailOptions = {
        to,
        from: process.env.EMAIL_SEND,
        subject,
        text
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${to}`);
    } catch (error) {
        console.error(`Error sending email to ${to}:`, error);
    }
}

module.exports = sendMail;
