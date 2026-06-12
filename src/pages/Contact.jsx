import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Mail, Phone, MapPin, Send, CheckCircle2, AlertCircle, Instagram, Youtube, Facebook, MessageCircle } from 'lucide-react';
import { sendContactEmail } from '../services/email';
import { addDocument } from '../firebase/firestore';

export default function Contact() {
  const [searchParams] = useSearchParams();
  const initialSubject = searchParams.get('subject') || 'General Inquiry';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState(initialSubject);
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isMockEmail, setIsMockEmail] = useState(false);
  const [mailtoUrl, setMailtoUrl] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Always log the inquiry to Firestore for the admin console backup
      await addDocument('contact_inquiries', {
        name,
        email,
        subject,
        message,
        createdAt: new Date().toISOString()
      });

      const result = await sendContactEmail(name, email, subject, message);
      if (result && result.mock) {
        setIsMockEmail(true);
        const mailtoLink = `mailto:trivabsportsandevents@gmail.com?subject=${encodeURIComponent(
          `[TRIVAB Inquiry] - ${subject}`
        )}&body=${encodeURIComponent(
          `Sender Name: ${name}\nSender Email: ${email}\n\nMessage Details:\n${message}`
        )}`;
        setMailtoUrl(mailtoLink);
        window.location.href = mailtoLink;
      } else {
        setIsMockEmail(false);
      }
      
      setSubmitted(true);
      setName('');
      setEmail('');
      setMessage('');
    } catch (err) {
      console.error("Failed to send email, falling back to mailto:", err);
      setIsMockEmail(true);
      const mailtoLink = `mailto:trivabsportsandevents@gmail.com?subject=${encodeURIComponent(
        `[TRIVAB Inquiry] - ${subject}`
      )}&body=${encodeURIComponent(
        `Sender Name: ${name}\nSender Email: ${email}\n\nMessage Details:\n${message}`
      )}`;
      setMailtoUrl(mailtoLink);
      window.location.href = mailtoLink;
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contact-page page-enter container section-padding">
      <div className="section-header">
        <span className="section-label">Get in Touch</span>
        <h1 className="section-title">Contact <span className="text-gradient-gold">TRIVAB Sports</span></h1>
        <p className="section-subtitle">Reach out for cricket tournament hosting, sponsorships, or any other queries.</p>
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
                  <span className="text-sm text-secondary">B202, Raj Heights, MG Road Kandivali West,<br />Mumbai 400067, Maharashtra, India</span>
                </div>
              </li>
            </ul>

            {/* Social Media Links */}
            <div style={{ marginTop: 'var(--space-xl)', paddingTop: 'var(--space-lg)', borderTop: '1px solid var(--border-card)' }}>
              <h3 className="text-sm font-bold text-muted mb-md uppercase" style={{ letterSpacing: '0.08em' }}>Follow Us</h3>
              <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
                <a
                  href="https://www.instagram.com/baplcricket?igsh=NHQ2dWM0Y3Z5dnBj"
                  target="_blank"
                  rel="noreferrer"
                  className="contact-social-btn"
                  aria-label="Instagram"
                  title="Instagram"
                >
                  <Instagram size={20} />
                  <span>Instagram</span>
                </a>
                <a
                  href="https://www.youtube.com/@baplcricket?si=dVnUedGn8K7gAmtP"
                  target="_blank"
                  rel="noreferrer"
                  className="contact-social-btn"
                  aria-label="YouTube"
                  title="YouTube"
                >
                  <Youtube size={20} />
                  <span>YouTube</span>
                </a>
                <a
                  href="https://wa.me/919930344130"
                  target="_blank"
                  rel="noreferrer"
                  className="contact-social-btn whatsapp-btn"
                  aria-label="WhatsApp"
                  title="WhatsApp"
                >
                  <MessageCircle size={20} />
                  <span>WhatsApp</span>
                </a>
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noreferrer"
                  className="contact-social-btn facebook-btn"
                  aria-label="Facebook"
                  title="Facebook"
                >
                  <Facebook size={20} />
                  <span>Facebook</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="animate-fade-in-right">
          <div className="card card-gold">
            <h2 className="text-lg font-bold mb-md text-gradient-gold">Send Message</h2>

            {submitted && (
              <div className="alert alert-success mb-md" style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <p style={{ margin: 0, fontWeight: 600 }}>Thank you! Your inquiry has been saved in our system.</p>
                  {isMockEmail && (
                    <p style={{ margin: '6px 0 0 0', fontSize: '0.8rem', lineHeight: 1.4, color: 'var(--text-secondary)' }}>
                      We saved your details in our Admin Panel. Since direct email keys are not configured yet, you can also send a copy directly via email: 
                      <a href={mailtoUrl} className="text-gold" style={{ marginLeft: '4px', textDecoration: 'underline', fontWeight: 600 }}>Click here to send email copy</a>.
                    </p>
                  )}
                </div>
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
                  <option value="Bharat Army Membership">Bharat Army Membership</option>
                  <option value="Organize Cricket Tournament">Organize Cricket Tournament</option>
                  <option value="Sponsorship">Sponsorship Opportunity</option>
                  <option value="Careers">Careers / Job Application</option>
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

      <style>{`
        .contact-social-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          border-radius: var(--radius-md);
          font-size: 0.85rem;
          font-weight: 600;
          text-decoration: none;
          background: rgba(212, 175, 55, 0.08);
          color: var(--text-secondary);
          border: 1px solid var(--border-card);
          transition: all var(--transition-fast);
        }
        .contact-social-btn:hover {
          background: rgba(212, 175, 55, 0.15);
          color: var(--gold);
          border-color: var(--gold);
          transform: translateY(-2px);
        }
        .contact-social-btn.whatsapp-btn:hover {
          background: rgba(37, 211, 102, 0.12);
          color: #25d366;
          border-color: #25d366;
        }
        .contact-social-btn.facebook-btn:hover {
          background: rgba(24, 119, 242, 0.12);
          color: #1877f2;
          border-color: #1877f2;
        }
      `}</style>
    </div>
  );
}
