import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Mail, Phone, MapPin, Send, AlertCircle, Instagram, Youtube, Facebook, MessageCircle } from 'lucide-react';
import { sendContactEmail } from '../services/email';
import { addDocument } from '../firebase/firestore';
import SEO from '../components/common/SEO';

export default function Contact() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialSubject = searchParams.get('subject') || 'General Inquiry';
  const tournamentName = searchParams.get('tournament') || '';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [subject, setSubject] = useState(initialSubject);
  const [corporateForm, setCorporateForm] = useState({
    companyName: '',
    companyRole: ''
  });
  const [topicForm, setTopicForm] = useState({
    organization: '',
    role: '',
    eventType: '',
    expectedTeams: '',
    proposedDate: '',
    venue: '',
    timeline: '',
    budget: '',
    sponsorshipType: '',
    audience: '',
    deliverables: '',
    jobRole: '',
    experience: '',
    availability: '',
    portfolioUrl: '',
    linkedinUrl: '',
    resumeName: '',
    issueType: '',
    pageUrl: '',
    device: '',
    urgency: ''
  });
  const [resumeFile, setResumeFile] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isMockEmail, setIsMockEmail] = useState(false);
  const [emailFailed, setEmailFailed] = useState(false);
  const [error, setError] = useState('');

  const handleCorporateChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCorporateForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleTopicChange = (e) => {
    const { name, value } = e.target;
    setTopicForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setEmailFailed(false);

    let dbSuccess = false;
    const corporateDetails = subject === 'Corporate Sports Tournament'
      ? `Company Name: ${corporateForm.companyName}\nRole: ${corporateForm.companyRole}\n`
      : '';
    const topicDetails = subject === 'Corporate Sports Tournament'
      ? corporateDetails
      : Object.entries(topicForm)
        .filter(([, value]) => value)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n');
    const tournamentDetails = tournamentName ? `Tournament: ${tournamentName}\n` : '';
    const emailMessage = `${tournamentDetails}${topicDetails}${topicDetails ? '\n\n' : ''}Message Details:\n${message}`;

    // 1. Try to save to Firestore
    try {
      await addDocument('contact_inquiries', {
        name,
        email,
        contactNumber,
        subject,
        tournamentName,
        ...(subject === 'Corporate Sports Tournament' ? corporateForm : {}),
        ...(subject !== 'Corporate Sports Tournament' ? topicForm : {}),
        message,
        read: false,
        createdAt: new Date().toISOString()
      });
      dbSuccess = true;
    } catch (dbErr) {
      console.error("Failed to save contact inquiry to database:", dbErr);
      setError("Failed to save your inquiry to the system database. Please ensure Firestore is initialized and rules allow writes.");
    }

    // 2. Try to send email
    try {
      const result = await sendContactEmail(name, email, contactNumber, subject, emailMessage);
      if (result && result.mock) {
        setIsMockEmail(true);
      } else {
        setIsMockEmail(false);
      }

      if (dbSuccess || (result && !result.mock)) {
        setError('');
        setName('');
        setEmail('');
        setContactNumber('');
        setMessage('');
        navigate('/thank-you');
      }
    } catch (err) {
      console.error("Failed to send email:", err);
      setIsMockEmail(false);

      if (dbSuccess) {
        setError('');
        setEmailFailed(true);
        setName('');
        setEmail('');
        setContactNumber('');
        setMessage('');
        navigate('/thank-you');
      } else {
        setError('Your inquiry could not be saved or emailed. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const contactSchema = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "name": "Contact TRIVAB Sports",
    "description": "Get in touch with TRIVAB Sports & Events for cricket tournament registrations, corporate inquiries, sponsorships, or support.",
    "url": "https://trivabsports.com/contact",
    "mainEntity": {
      "@type": "SportsOrganization",
      "name": "TRIVAB Sports",
      "email": "trivabsports@gmail.com",
      "telephone": ["+91-9930344130", "+91-9867423131", "+91-8779187691"],
      "contactPoint": {
        "@type": "ContactPoint",
        "email": "trivabsports@gmail.com",
        "telephone": ["+91-9930344130", "+91-9867423131", "+91-8779187691"],
        "contactType": "customer service",
        "areaServed": "IN"
      }
    }
  };

  return (
    <div className="contact-page page-enter container section-padding">
      <SEO 
        title="Contact Us"
        description="Contact TRIVAB Sports & Events for tournament participation, corporate cups, sponsorships, and technical support. We are here to help."
        keywords="Contact TRIVAB Sports, cricket registration support, corporate league contact, TRIVAB email, TRIVAB contact number"
        schema={contactSchema}
      />
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
                  <a href="mailto:trivabsports@gmail.com" className="text-sm font-semi text-gold">trivabsports@gmail.com</a>
                </div>
              </li>
              <li className="flex gap-md items-center" style={{ alignItems: 'flex-start' }}>
                <div className="stat-icon" style={{ marginBottom: 0, marginTop: '3px' }}><Phone size={20} /></div>
                <div className="flex flex-col gap-xs">
                  <span className="text-xs text-muted block">Phone Enquiries</span>
                  <a href="tel:+919930344130" className="text-sm font-semi text-gold">+91 99303 44130</a>
                  <a href="tel:+919867423131" className="text-sm font-semi text-gold">+91 98674 23131</a>
                  <a href="tel:+918779187691" className="text-sm font-semi text-gold">+91 87791 87691</a>
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

            {error && (
              <div className="alert alert-error mb-md" style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px', color: '#ef4444' }} />
                <div>
                  <p style={{ margin: 0, fontWeight: 600, color: '#ef4444' }}>{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-md">
              {subject !== 'Corporate Sports Tournament' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input type="text" className="form-input" placeholder="Rohan Sharma" required value={name} onChange={(e) => setName(e.target.value)} disabled={loading} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input type="email" className="form-input" placeholder="rohan@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Contact Number</label>
                    <input type="tel" className="form-input" placeholder="+91 98765 43210" required value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} disabled={loading} />
                  </div>
                </>
              )}

              <div className="form-group">
                <label className="form-label">Topic / Subject</label>
                <select
                  className="form-select"
                  value={subject}
                  onChange={(e) => {
                    setSubject(e.target.value);
                  }}
                  disabled={loading}
                >
                  <option value="General Inquiry">General Inquiry</option>
                  <option value="Corporate Sports Tournament">Corporate Sports Tournament</option>
                  <option value="Organize Cricket Tournament">Organize Cricket Tournament</option>
                  <option value="Sponsorship">Sponsorship Opportunity</option>
                  <option value="Careers">Careers / Job Application</option>
                  <option value="Bug / Tech Support">Bug Report / Technical Support</option>
                </select>
              </div>

              {tournamentName && (
                <div className="form-group">
                  <label className="form-label">Tournament</label>
                  <input className="form-input" value={tournamentName} readOnly aria-label="Selected tournament" />
                </div>
              )}

              {subject === 'Corporate Sports Tournament' ? (
                <>
                  <div className="corporate-interest-header">
                    <span className="corporate-interest-badge">Corporate Cricket</span>
                    <p className="corporate-interest-sub">Fill in your details and our team will reach out with tournament details, pricing and registration information.</p>
                  </div>

                  <div className="corporate-interest-grid">
                    <div className="form-group">
                      <label className="form-label">Full Name <span className="form-required">*</span></label>
                      <input type="text" className="form-input" placeholder="e.g. Rahul Sharma" required value={name} onChange={(e) => setName(e.target.value)} disabled={loading} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Company Name <span className="form-required">*</span></label>
                      <input name="companyName" className="form-input" placeholder="e.g. Infosys Ltd." required value={corporateForm.companyName} onChange={handleCorporateChange} disabled={loading} />
                    </div>
                  </div>

                  <div className="corporate-interest-grid">
                    <div className="form-group">
                      <label className="form-label">Work Email <span className="form-required">*</span></label>
                      <input type="email" className="form-input" placeholder="you@company.com" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Phone Number <span className="form-required">*</span></label>
                      <input type="tel" className="form-input" placeholder="+91 98765 43210" required value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} disabled={loading} />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Your Role <span className="form-required">*</span></label>
                    <select name="companyRole" className="form-select" value={corporateForm.companyRole} onChange={handleCorporateChange} required disabled={loading}>
                      <option value="">Select your role…</option>
                      <option value="HR">HR</option>
                      <option value="Admin">Admin</option>
                      <option value="Founder/Owner">Founder / Owner</option>
                      <option value="Team/Employee">Team / Employee</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </>
              ) : subject === 'Careers' ? (
                <>
                  <fieldset className="contact-form-section">
                    <legend>Career Profile</legend>
                    <div className="form-group">
                      <label className="form-label">Position You Are Applying For *</label>
                      <select name="jobRole" className="form-select" value={topicForm.jobRole} onChange={handleTopicChange} required disabled={loading}>
                        <option value="">Select a position</option>
                        <option value="Event Operations Coordinator">Event Operations Coordinator</option>
                        <option value="Cricket Operations Manager">Cricket Operations Manager</option>
                        <option value="Sales &amp; Partnerships Executive">Sales &amp; Partnerships Executive</option>
                        <option value="Marketing &amp; Social Media Executive">Marketing &amp; Social Media Executive</option>
                        <option value="Match Official / Scorer">Match Official / Scorer</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Years of Experience *</label>
                      <select name="experience" className="form-select" value={topicForm.experience} onChange={handleTopicChange} required disabled={loading}>
                        <option value="">Select experience</option>
                        <option value="Entry level">Entry level</option>
                        <option value="1-3 years">1-3 years</option>
                        <option value="4-7 years">4-7 years</option>
                        <option value="8+ years">8+ years</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Availability to Join *</label>
                      <select name="availability" className="form-select" value={topicForm.availability} onChange={handleTopicChange} required disabled={loading}>
                        <option value="">Select availability</option>
                        <option value="Immediately">Immediately</option>
                        <option value="Within 30 days">Within 30 days</option>
                        <option value="1-3 months">1-3 months</option>
                        <option value="Exploring opportunities">Exploring opportunities</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Resume / CV *</label>
                      <input type="file" className="form-input contact-file-input" accept=".pdf,.doc,.docx" required disabled={loading} onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setResumeFile(file);
                        setTopicForm(prev => ({ ...prev, resumeName: file?.name || '' }));
                      }} />
                      {resumeFile && <span className="contact-file-name">Selected: {resumeFile.name}</span>}
                    </div>
                    <div className="form-group">
                      <label className="form-label">LinkedIn / Portfolio URL</label>
                      <input name="linkedinUrl" type="url" className="form-input" placeholder="https://linkedin.com/in/your-name" value={topicForm.linkedinUrl} onChange={handleTopicChange} disabled={loading} />
                    </div>
                  </fieldset>
                  <div className="form-group">
                    <label className="form-label">Cover Note *</label>
                    <textarea className="form-textarea" placeholder="Tell us why you would be a strong fit for TRIVAB..." required value={message} onChange={(e) => setMessage(e.target.value)} disabled={loading} />
                  </div>
                </>
              ) : subject === 'Organize Cricket Tournament' ? (
                <>
                  <fieldset className="contact-form-section">
                    <legend>Event Brief</legend>
                    <div className="form-group">
                      <label className="form-label">Organization / Company *</label>
                      <input name="organization" className="form-input" placeholder="Company or organization name" value={topicForm.organization} onChange={handleTopicChange} required disabled={loading} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Your Role</label>
                      <input name="role" className="form-input" placeholder="HR, Admin, Captain, Event Lead..." value={topicForm.role} onChange={handleTopicChange} disabled={loading} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Event Type *</label>
                      <select name="eventType" className="form-select" value={topicForm.eventType} onChange={handleTopicChange} required disabled={loading}>
                        <option value="">Select event type</option>
                        <option value="Corporate Cup">Corporate Cup</option>
                        <option value="Turf Championship">Turf Championship</option>
                        <option value="T20 League">T20 League</option>
                        <option value="Box Cricket Tournament">Box Cricket Tournament</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Expected Teams *</label>
                      <input name="expectedTeams" className="form-input" placeholder="e.g., 8 teams" value={topicForm.expectedTeams} onChange={handleTopicChange} required disabled={loading} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Preferred Event Date</label>
                      <input name="proposedDate" type="date" className="form-input" value={topicForm.proposedDate} onChange={handleTopicChange} disabled={loading} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Venue / Location</label>
                      <input name="venue" className="form-input" placeholder="City or preferred ground" value={topicForm.venue} onChange={handleTopicChange} disabled={loading} />
                    </div>
                  </fieldset>
                  <div className="form-group">
                    <label className="form-label">Event Requirements *</label>
                    <textarea className="form-textarea" placeholder="Share your schedule, facilities, branding, catering, or media requirements..." required value={message} onChange={(e) => setMessage(e.target.value)} disabled={loading} />
                  </div>
                </>
              ) : subject === 'Sponsorship' ? (
                <>
                  <fieldset className="contact-form-section">
                    <legend>Partnership Profile</legend>
                    <div className="form-group">
                      <label className="form-label">Brand / Organization *</label>
                      <input name="organization" className="form-input" placeholder="Brand or organization name" value={topicForm.organization} onChange={handleTopicChange} required disabled={loading} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Sponsorship Interest *</label>
                      <select name="sponsorshipType" className="form-select" value={topicForm.sponsorshipType} onChange={handleTopicChange} required disabled={loading}>
                        <option value="">Select an opportunity</option>
                        <option value="Title Sponsorship">Title Sponsorship</option>
                        <option value="Team Sponsorship">Team Sponsorship</option>
                        <option value="Ground Branding">Ground Branding</option>
                        <option value="Digital & Media Partnership">Digital &amp; Media Partnership</option>
                        <option value="Custom Partnership">Custom Partnership</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Target Audience</label>
                      <input name="audience" className="form-input" placeholder="Who would you like to reach?" value={topicForm.audience} onChange={handleTopicChange} disabled={loading} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Approximate Budget</label>
                      <select name="budget" className="form-select" value={topicForm.budget} onChange={handleTopicChange} disabled={loading}>
                        <option value="">Select a range</option>
                        <option value="Under 1 Lakh">Under 1 Lakh</option>
                        <option value="1-5 Lakhs">1-5 Lakhs</option>
                        <option value="5-10 Lakhs">5-10 Lakhs</option>
                        <option value="10+ Lakhs">10+ Lakhs</option>
                        <option value="To be discussed">To be discussed</option>
                      </select>
                    </div>
                  </fieldset>
                  <div className="form-group">
                    <label className="form-label">Partnership Goals *</label>
                    <textarea className="form-textarea" placeholder="Tell us about your brand goals, deliverables, and campaign expectations..." required value={message} onChange={(e) => setMessage(e.target.value)} disabled={loading} />
                  </div>
                </>
              ) : subject === 'Bug / Tech Support' ? (
                <>
                  <fieldset className="contact-form-section">
                    <legend>Issue Details</legend>
                    <div className="form-group">
                      <label className="form-label">Issue Type *</label>
                      <select name="issueType" className="form-select" value={topicForm.issueType} onChange={handleTopicChange} required disabled={loading}>
                        <option value="">Select issue type</option>
                        <option value="Login or Account Access">Login or account access</option>
                        <option value="Registration or Payment">Registration or payment</option>
                        <option value="Match Schedule or Score">Match schedule or score</option>
                        <option value="Profile or Team Data">Profile or team data</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Affected Page or URL</label>
                      <input name="pageUrl" type="url" className="form-input" placeholder="https://trivabsports.com/..." value={topicForm.pageUrl} onChange={handleTopicChange} disabled={loading} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Device / Browser</label>
                      <input name="device" className="form-input" placeholder="e.g., Android Chrome, Windows Edge" value={topicForm.device} onChange={handleTopicChange} disabled={loading} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Urgency *</label>
                      <select name="urgency" className="form-select" value={topicForm.urgency} onChange={handleTopicChange} required disabled={loading}>
                        <option value="">Select urgency</option>
                        <option value="Low">Low</option>
                        <option value="Normal">Normal</option>
                        <option value="High">High</option>
                      </select>
                    </div>
                  </fieldset>
                  <div className="form-group">
                    <label className="form-label">What went wrong? *</label>
                    <textarea className="form-textarea" placeholder="Describe the steps, error message, and expected result..." required value={message} onChange={(e) => setMessage(e.target.value)} disabled={loading} />
                  </div>
                </>
              ) : (
                <div className="form-group">
                  <label className="form-label">Message Details *</label>
                  <textarea className="form-textarea" placeholder="Describe your inquiry..." required value={message} onChange={(e) => setMessage(e.target.value)} disabled={loading} />
                </div>
              )}

              <button type="submit" className="btn btn-gold btn-lg" disabled={loading}>
                {loading ? 'Sending...' : subject === 'Corporate Sports Tournament' ? <><Send size={18} /> Register Your Interest</> : <><Send size={18} /> Send Inquiry</>}
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
        .contact-form-section {
          margin: 8px 0;
          padding: 18px 16px 4px;
          border: 1px solid var(--border-card);
          border-radius: var(--radius-md);
        }
        .contact-form-section legend {
          padding: 0 8px;
          color: var(--text-primary);
          font-size: 0.95rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .contact-consent {
          display: flex;
          align-items: center;
          gap: 10px;
          color: var(--text-secondary);
          font-size: 0.9rem;
          cursor: pointer;
        }
        .contact-consent input {
          width: 18px;
          height: 18px;
          accent-color: var(--gold);
        }
        .contact-file-input {
          padding: 10px;
        }
        .contact-file-name {
          display: block;
          margin-top: 6px;
          color: var(--text-secondary);
          font-size: 0.78rem;
        }
        .corporate-interest-header {
          margin-bottom: 4px;
        }
        .corporate-interest-badge {
          display: inline-block;
          background: linear-gradient(90deg, #800000, #d4af37);
          color: #fff;
          font-size: 0.65rem;
          font-weight: 800;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 4px 12px;
          border-radius: 999px;
          margin-bottom: 8px;
        }
        .corporate-interest-sub {
          font-size: 0.85rem;
          color: var(--text-secondary);
          margin: 0 0 16px;
          line-height: 1.55;
        }
        .corporate-interest-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }
        @media (max-width: 560px) {
          .corporate-interest-grid {
            grid-template-columns: 1fr;
          }
        }
        .form-required {
          color: var(--gold);
          margin-left: 2px;
        }
      `}</style>
    </div>
  );
}
