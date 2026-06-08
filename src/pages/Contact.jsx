import { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2, AlertCircle } from 'lucide-react';

export default function Contact() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('General Inquiry');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Construct mailto link to provided address
    const mailtoLink = `mailto:trivabsportsandevents@gmail.com?subject=${encodeURIComponent(
      `[TRIVAB Inquiry] - ${subject}`
    )}&body=${encodeURIComponent(
      `Sender Name: ${name}\nSender Email: ${email}\n\nMessage Details:\n${message}`
    )}`;
    
    // Open mail client
    window.location.href = mailtoLink;
    
    setLoading(false);
    setSubmitted(true);
    setName('');
    setEmail('');
    setMessage('');
  };

  return (
    <div className="contact-page page-enter container section-padding">
      <div className="section-header">
        <span className="section-label">Get in Touch</span>
        <h1 className="section-title">Contact <span className="text-gradient-gold">TRIVAB Support</span></h1>
        <p className="section-subtitle">Reach out for league hosting setups, sponsorships, or account queries.</p>
      </div>

      <div className="grid grid-2 gap-xl">
        {/* Contact details */}
        <div className="flex flex-col gap-lg animate-fade-in-left">
          <div className="card">
            <h2 className="text-lg font-bold mb-md text-gradient-gold">Support Details</h2>
            <p className="text-secondary text-sm mb-lg">
              For immediate answers, check our FAQ guides. Or reach us through the official handles below.
            </p>

            <ul className="flex flex-col gap-lg">
              <li className="flex gap-md items-center">
                <div className="stat-icon" style={{ marginBottom: 0 }}><Mail size={20} /></div>
                <div>
                  <span className="text-xs text-muted block">Email Support</span>
                  <a href="mailto:trivabsportsandevents@gmail.com" className="text-sm font-semi text-gold">trivabsportsandevents@gmail.com</a>
                </div>
              </li>
              <li className="flex gap-md items-center">
                <div className="stat-icon" style={{ marginBottom: 0 }}><Phone size={20} /></div>
                <div>
                  <span className="text-xs text-muted block">Phone Enquiries</span>
                  <a href="tel:+919930344130" className="text-sm font-semi text-gold">+91 99303 44130</a>
                </div>
              </li>
              <li className="flex gap-md items-center">
                <div className="stat-icon" style={{ marginBottom: 0 }}><MapPin size={20} /></div>
                <div>
                  <span className="text-xs text-muted block">Headquarters</span>
                  <span className="text-sm text-secondary">Mumbai Sports Hub, Maharashtra, India</span>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Contact Form */}
        <div className="animate-fade-in-right">
          <div className="card card-gold">
            <h2 className="text-lg font-bold mb-md text-gradient-gold">Send Message</h2>

            {submitted && (
              <div className="alert alert-success mb-md">
                <CheckCircle2 size={18} />
                <span>Thank you! Your inquiry has been sent to our cricket support panel.</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-md">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Rohan Sharma"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="rohan@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Topic / Subject</label>
                <select
                  className="form-select"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  disabled={loading}
                >
                  <option value="General Inquiry">General Inquiry</option>
                  <option value="League Setup">League / Tournament Hosting</option>
                  <option value="Sponsorship">Sponsorship Opportunity</option>
                  <option value="Bug / Tech Support">Bug Report / Technical Support</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Message Details</label>
                <textarea
                  className="form-textarea"
                  placeholder="Describe your inquiry..."
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={loading}
                />
              </div>

              <button type="submit" className="btn btn-gold btn-lg" disabled={loading}>
                {loading ? 'Sending...' : <><Send size={18} /> Send Inquiry</>}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
