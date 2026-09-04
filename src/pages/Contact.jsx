import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Mail, Phone, MapPin, Send, CheckCircle2, AlertCircle, Instagram, Youtube, Facebook, MessageCircle } from 'lucide-react';
import { sendContactEmail } from '../services/email';
import { addDocument } from '../firebase/firestore';
import SEO from '../components/common/SEO';

export default function Contact() {
  const [searchParams] = useSearchParams();
  const initialSubject = searchParams.get('subject') || 'General Inquiry';
  const tournamentName = searchParams.get('tournament') || '';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [subject, setSubject] = useState(initialSubject);
  const [corporateForm, setCorporateForm] = useState({
    companyName: '',
    companyRole: '',
    companySize: '',
    eventType: '',
    teamName: '',
    playersInterested: '',
    cricketExperience: '',
    playedInBapl: '',
    preferredTiming: '',
    budgetApproved: '',
    heardAboutUs: '',
    consent: false
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
  const [submitted, setSubmitted] = useState(false);
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
    setSubmitted(false);
    setEmailFailed(false);

    let dbSuccess = false;
    const corporateDetails = subject === 'Corporate Sports Tournament'
      ? `Company Name: ${corporateForm.companyName}\nCompany Role: ${corporateForm.companyRole}\nCompany Size: ${corporateForm.companySize}\nEvent Type: ${corporateForm.eventType}\n${corporateForm.eventType === 'Cricket Event' ? `Team Name: ${corporateForm.teamName}\nPlayers Interested: ${corporateForm.playersInterested}\nCricket Experience: ${corporateForm.cricketExperience}\nPlayed in BAPL Before: ${corporateForm.playedInBapl}\n` : ''}Preferred Timing: ${corporateForm.preferredTiming}\nBudget Approved: ${corporateForm.budgetApproved}\nHow They Heard About Us: ${corporateForm.heardAboutUs}\nUpdates Consent: ${corporateForm.consent ? 'Yes' : 'No'}\n\n`
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
        setSubmitted(true);
        setName('');
        setEmail('');
        setContactNumber('');
        setMessage('');
      }
    } catch (err) {
      console.error("Failed to send email:", err);
      setIsMockEmail(false);

      if (dbSuccess) {
        setSubmitted(true);
        setEmailFailed(true);
        setName('');
        setEmail('');
        setContactNumber('');
        setMessage('');
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

            {submitted && (
              <div className="alert alert-success mb-md" style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <p style={{ margin: 0, fontWeight: 600 }}>Thank you! Your inquiry has been saved in our system.</p>
                  {emailFailed && (
                    <p style={{ margin: '6px 0 0 0', fontSize: '0.8rem', lineHeight: 1.4, color: '#9a3412' }}>
                      The email notification could not be delivered right now, but the admin can view your complete inquiry in the Admin Panel.
                    </p>
                  )}
                  {isMockEmail && (
                    <p style={{ margin: '6px 0 0 0', fontSize: '0.8rem', lineHeight: 1.4, color: 'var(--text-secondary)' }}>
                      We saved your details in our Admin Panel. EmailJS is not configured, so no email notification was sent.
                    </p>
                  )}
                </div>
              </div>
            )}

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
                  <fieldset className="contact-form-section">
                    <legend>Company Information</legend>
                    <div className="form-group">
                      <label className="form-label">Company Name *</label>
                      <input name="companyName" className="form-input" placeholder="e.g., Tech Solutions Private Ltd" value={corporateForm.companyName} onChange={handleCorporateChange} required disabled={loading} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Your Role in Company *</label>
                      <select name="companyRole" className="form-select" value={corporateForm.companyRole} onChange={handleCorporateChange} required disabled={loading}>
                        <option value="">Select your role</option>
                        <option value="HR/Admin">HR/Admin</option>
                        <option value="Finance/CFO">Finance/CFO</option>
                        <option value="Sports Committee Lead">Sports Committee Lead</option>
                        <option value="Cricket Captain">Cricket Captain</option>
                        <option value="CEO/Executive">CEO/Executive</option>
                        <option value="Employee">Employee</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Company Size *</label>
                      <select name="companySize" className="form-select" value={corporateForm.companySize} onChange={handleCorporateChange} required disabled={loading}>
                        <option value="">Select company size</option>
                        <option value="1-50">1-50 employees</option>
                        <option value="51-200">51-200 employees</option>
                        <option value="201-500">201-500 employees</option>
                        <option value="501-1000">501-1000 employees</option>
                        <option value="1000+">1000+ employees</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">What Type of Event Are You Planning? *</label>
                      <select name="eventType" className="form-select" value={corporateForm.eventType} onChange={handleCorporateChange} required disabled={loading}>
                        <option value="">Select event type</option>
                        <option value="Cricket Event">Cricket Event</option>
                        <option value="Corporate Event">Corporate Event</option>
                        <option value="Sports Event">Sports Event</option>
                        <option value="Annual Event">Annual Event</option>
                        <option value="Team Building Event">Team Building Event</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </fieldset>

                  <fieldset className="contact-form-section">
                    <legend>Contact Information</legend>
                    <div className="form-group">
                      <label className="form-label">Full Name *</label>
                      <input type="text" className="form-input" placeholder="Rohan Sharma" required value={name} onChange={(e) => setName(e.target.value)} disabled={loading} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Email Address *</label>
                      <input type="email" className="form-input" placeholder="rohan@company.com" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Contact Number *</label>
                      <input type="tel" className="form-input" placeholder="+91 98765 43210" required value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} disabled={loading} />
                    </div>
                  </fieldset>

                  {corporateForm.eventType === 'Cricket Event' && (
                  <fieldset className="contact-form-section">
                    <legend>Team Details</legend>
                    <div className="form-group">
                      <label className="form-label">Team Name *</label>
                      <input name="teamName" className="form-input" placeholder="e.g., Tech Titans or Code Warriors" value={corporateForm.teamName} onChange={handleCorporateChange} required disabled={loading} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Number of Players Interested *</label>
                      <input name="playersInterested" className="form-input" placeholder="11-50" value={corporateForm.playersInterested} onChange={handleCorporateChange} required disabled={loading} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Cricket Experience Level *</label>
                      <select name="cricketExperience" className="form-select" value={corporateForm.cricketExperience} onChange={handleCorporateChange} required disabled={loading}>
                        <option value="">Select experience level</option>
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                        <option value="Mixed">Mixed team</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Have You Played in BAPL Before? *</label>
                      <select name="playedInBapl" className="form-select" value={corporateForm.playedInBapl} onChange={handleCorporateChange} required disabled={loading}>
                        <option value="">Select</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>
                  </fieldset>
                  )}

                  <fieldset className="contact-form-section">
                    <legend>Event Planning</legend>
                    <div className="form-group">
                      <label className="form-label">Preferred Timing *</label>
                      <select name="preferredTiming" className="form-select" value={corporateForm.preferredTiming} onChange={handleCorporateChange} required disabled={loading}>
                        <option value="">Select timing</option>
                        <option value="Weekday">Weekday</option>
                        <option value="Weekend">Weekend</option>
                        <option value="Saturday">Saturday</option>
                        <option value="Sunday">Sunday</option>
                        <option value="Flexible">Flexible</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Budget Approved? *</label>
                      <select name="budgetApproved" className="form-select" value={corporateForm.budgetApproved} onChange={handleCorporateChange} required disabled={loading}>
                        <option value="">Select status</option>
                        <option value="Yes">Yes</option>
                        <option value="Under Discussion">Under discussion</option>
                        <option value="Not Yet">Not yet</option>
                      </select>
                    </div>
                  </fieldset>

                  <fieldset className="contact-form-section">
                    <legend>Additional Information</legend>
                    <div className="form-group">
                      <label className="form-label">How Did You Hear About Us? *</label>
                      <select name="heardAboutUs" className="form-select" value={corporateForm.heardAboutUs} onChange={handleCorporateChange} required disabled={loading}>
                        <option value="">Select</option>
                        <option value="Google Search">Google Search</option>
                        <option value="Social Media">Social Media</option>
                        <option value="Referral">Referral</option>
                        <option value="Existing BAPL Member">Existing BAPL member</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Message (Optional)</label>
                      <textarea className="form-textarea" placeholder="Any questions or special requirements?" value={message} onChange={(e) => setMessage(e.target.value)} disabled={loading} />
                    </div>
                  </fieldset>

                  <label className="contact-consent">
                    <input type="checkbox" name="consent" checked={corporateForm.consent} onChange={handleCorporateChange} disabled={loading} />
                    <span>I agree to receive updates via email &amp; WhatsApp</span>
                  </label>
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
      `}</style>
    </div>
  );
}
