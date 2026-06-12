import emailjs from '@emailjs/browser';

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || '';
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || '';
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || '';

/**
 * Send an OTP code to a registering user's email.
 */
export const sendOTPEmail = async (email, fullName, otpCode) => {
  if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
    console.log(`%c[EmailJS Mock Mode] OTP email to ${email} (${fullName}): ${otpCode}`, "color: #d4af37; font-weight: bold; font-size: 1.1rem;");
    return { mock: true, otp: otpCode };
  }

  const templateParams = {
    to_email: email,
    user_name: fullName,
    otp_code: otpCode,
    subject: 'TRIVAB Sports Registration — Email Verification OTP',
    message: `Hello ${fullName},\n\nYour one-time verification code for registering on TRIVAB Sports is: ${otpCode}\n\nPlease enter this code on the registration page to complete your profile.\n\nBest regards,\nTRIVAB Sports Team`
  };

  return emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
};

/**
 * Send contact form submission to the admin email.
 */
export const sendContactEmail = async (name, email, subject, message) => {
  if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
    console.log(`%c[EmailJS Mock Mode] Contact form submitted by ${name} (${email}): Subject: ${subject}, Message: ${message}`, "color: #d4af37; font-weight: bold;");
    return { mock: true };
  }

  const templateParams = {
    from_name: name,
    from_email: email,
    subject: `[TRIVAB Inquiry] - ${subject}`,
    message: `Sender Name: ${name}\nSender Email: ${email}\n\nMessage Details:\n${message}`,
    to_email: 'trivabsportsandevents@gmail.com'
  };

  return emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
};

/**
 * Send notification to team captain when player registrations count reaches multiples of 10.
 */
export const sendCaptainRosterNotification = async (captainEmail, captainName, teamName, playerCount) => {
  if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
    console.log(`%c[EmailJS Mock Mode] Captain Notification to ${captainEmail} (${captainName}): Team "${teamName}" now has ${playerCount} registered players!`, "color: #3b82f6; font-weight: bold; font-size: 1.1rem;");
    return { mock: true };
  }

  const templateParams = {
    to_email: captainEmail,
    user_name: captainName,
    subject: `[TRIVAB Roster Update] Team ${teamName} reached ${playerCount} Players!`,
    message: `Hello ${captainName},\n\nCongratulations! Your team "${teamName}" has successfully registered ${playerCount} players on the TRIVAB platform.\n\nYou can view your squad roster by logging into your Captain Dashboard.\n\nBest regards,\nTRIVAB Sports Team`,
    from_name: 'TRIVAB Sports',
    from_email: 'trivabsportsandevents@gmail.com'
  };

  return emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
};

