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
export const sendContactEmail = async (name, email, contactNumber, subject, message) => {
  if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
    console.log(`%c[EmailJS Mock Mode] Contact form submitted by ${name} (${email}, Phone: ${contactNumber}): Subject: ${subject}, Message: ${message}`, "color: #d4af37; font-weight: bold;");
    return { mock: true };
  }

  const templateParams = {
    // Verified sender address (prevents DMARC/spam filter rejections)
    from_email: 'trivabsports@gmail.com',
    from_name: name || 'TRIVAB Contact Form',
    
    // Reply-To header allows admin to reply to the sender directly
    reply_to: email,
    
    // Recipient address
    to_email: 'trivabsports@gmail.com',
    
    // Subject line
    subject: `[TRIVAB Inquiry] - ${subject}`,
    
    // Message details
    message: `Sender Name: ${name}\nSender Email: ${email}\nSender Phone: ${contactNumber}\n\nMessage Details:\n${message}`,
    
    // Mapping variations to match template variable configurations in EmailJS dashboard
    user_name: name || 'TRIVAB Contact Form',
    user_email: email,
    sender_email: email,
    contact_number: contactNumber,
    phone: contactNumber,
    mobile: contactNumber,
    message_html: `Sender Name: ${name}<br>Sender Email: ${email}<br>Sender Phone: ${contactNumber}<br><br>Message Details:<br>${message.replace(/\n/g, '<br>')}`
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
    from_email: 'trivabsports@gmail.com'
  };

  return emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
};

