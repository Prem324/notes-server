const nodemailer = require("nodemailer");
const config = require("../config/env");

const transporter = nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: config.email.port === 465,
    auth: {
        user: config.email.user,
        pass: config.email.password,
    },
});

const testEmailConnection = async () => {
    try {
        await transporter.verify();
        console.log("✅ Email SMTP connection successful");
    } catch (error) {
        console.error("❌ Email SMTP connection failed:");
        console.error(error);
    }
};

testEmailConnection();

const sendPasswordResetEmail = async (email, resetToken) => {
    try {
        const resetUrl =
            `${config.clientUrl}/reset-password/${resetToken}`;

        console.log("📧 Sending password reset email...");
        console.log("To:", email);
        console.log("From:", config.email.from);

        const info = await transporter.sendMail({
            from: config.email.from,
            to: email,
            subject: "Password Reset Request",
            text: `
You requested a password reset.

Reset your password using this link:

${resetUrl}

This link will expire in 15 minutes.

If you did not request this password reset, you can safely ignore this email.
            `,
        });

        console.log("✅ Email actually sent");
        console.log("Message ID:", info.messageId);
        console.log("Response:", info.response);

        return info;
    } catch (error) {
        console.error("❌ sendMail failed:");
        console.error(error);

        throw error;
    }
};

const sendVerificationEmail = async (email, verificationToken) => {
    try {
        const verificationUrl =
            `${config.clientUrl}/verify-email/${verificationToken}`;

        console.log("📧 Sending verification email...");
        console.log("To:", email);
        console.log("From:", config.email.from);

        const info = await transporter.sendMail({
            from: config.email.from,
            to: email,
            subject: "Verify Your Email",
            text: `
Welcome!

Please verify your email address by clicking the link below:

${verificationUrl}

This link will expire in 15 minutes.

If you did not create this account, you can safely ignore this email.
            `,
        });

        console.log("✅ Verification email sent");
        console.log("Message ID:", info.messageId);
        console.log("Response:", info.response);

        return info;
    } catch (error) {
        console.error("❌ Verification email failed:");
        console.error(error);

        throw error;
    }
};

module.exports = {
    sendPasswordResetEmail,sendVerificationEmail
};