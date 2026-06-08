import { useState, useEffect } from 'react';
import { addDocument } from '../../firebase/firestore';
import {
  Trophy, Calendar, Users, MapPin, Award, CheckCircle, ChevronLeft, ChevronRight, Mail, Phone, Building, ClipboardList, ShieldAlert
} from 'lucide-react';
import './Organize.css';

const SLIDE_IMAGES = [
  {
    url: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&q=80&w=1200',
    title: 'Turf Championships',
    description: 'High-energy box cricket and short-format turf tournaments with professional playing conditions.'
  },
  {
    url: 'https://images.unsplash.com/photo-1540747737956-37872404a8cc?auto=format&fit=crop&q=80&w=1200',
    title: 'Corporate Cups',
    description: 'Premium weekend corporate tournaments designed for employee engagement, networking, and team building.'
  },
  {
    url: 'https://images.unsplash.com/photo-1593766788311-285d55d21146?auto=format&fit=crop&q=80&w=1200',
    title: 'Professional Logistics & Management',
    description: 'Ball-by-ball digital live scoring, certified officiating, video coverage, and customized prize ceremonies.'
  }
];

export default function Organize() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    organization: '',
    tournamentType: 'Corporate Cup',
    expectedTeams: '8',
    proposedDate: '',
    message: ''
  });

  // Automatic slideshow transition every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % SLIDE_IMAGES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handlePrevSlide = () => {
    setActiveSlide(prev => (prev - 1 + SLIDE_IMAGES.length) % SLIDE_IMAGES.length);
  };

  const handleNextSlide = () => {
    setActiveSlide(prev => (prev + 1) % SLIDE_IMAGES.length);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate phone number format briefly
      if (formData.phone.length < 10) {
        throw new Error('Please enter a valid phone number (minimum 10 digits)');
      }

      const bookingData = {
        ...formData,
        status: 'Pending Inquiry',
        createdAt: new Date().toISOString()
      };

      await addDocument('bookings', bookingData);
      setSubmitted(true);
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        organization: '',
        tournamentType: 'Corporate Cup',
        expectedTeams: '8',
        proposedDate: '',
        message: ''
      });
    } catch (err) {
      console.error('Error submitting booking:', err);
      setError(err.message || 'Failed to submit inquiry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="organize-page page-enter container section-padding">
      {/* Hero Header */}
      <div className="organize-hero text-center mb-xl">
        <span className="badge badge-gold mb-xs">Professional Event Hosting</span>
        <h1 className="display-md text-gradient-gold">Organize Tournaments with TRIVAB</h1>
        <p className="text-secondary max-width-800 mx-auto mt-xs">
          From corporate weekend leagues to elite turf championships, TRIVAB handles all the logistics, scheduling, umpiring, and real-time live scoring. You play, we manage the rest.
        </p>
      </div>

      {/* Slide Carousel */}
      <div className="organize-carousel-container mb-xl">
        <div className="carousel-slide-wrapper">
          {SLIDE_IMAGES.map((slide, idx) => (
            <div 
              key={idx} 
              className={`carousel-slide ${idx === activeSlide ? 'active' : ''}`}
              style={{ backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(15,15,30,0.85) 90%), url(${slide.url})` }}
            >
              <div className="slide-content">
                <h3 className="text-xl font-bold text-gradient-gold">{slide.title}</h3>
                <p className="text-secondary mt-xs">{slide.description}</p>
              </div>
            </div>
          ))}
        </div>
        
        {/* Navigation Arrows */}
        <button className="carousel-arrow prev" onClick={handlePrevSlide} aria-label="Previous Slide">
          <ChevronLeft size={24} />
        </button>
        <button className="carousel-arrow next" onClick={handleNextSlide} aria-label="Next Slide">
          <ChevronRight size={24} />
        </button>

        {/* Indicators */}
        <div className="carousel-indicators">
          {SLIDE_IMAGES.map((_, idx) => (
            <button 
              key={idx} 
              className={`indicator-dot ${idx === activeSlide ? 'active' : ''}`}
              onClick={() => setActiveSlide(idx)}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Services Grid */}
      <div className="organize-services mb-xl">
        <h2 className="text-lg font-bold text-center text-gradient-gold mb-lg uppercase letter-spacing-04">Complete Management Inclusions</h2>
        <div className="grid grid-4 gap-lg">
          <div className="card service-card">
            <div className="service-icon-box">
              <MapPin size={24} className="text-gold" />
            </div>
            <h4 className="font-bold mt-md text-primary">Ground & Turf Bookings</h4>
            <p className="text-sm text-secondary mt-xs">Premium cricket turfs and grass outfields reserved specifically for your match schedule.</p>
          </div>

          <div className="card service-card">
            <div className="service-icon-box">
              <Calendar size={24} className="text-gold" />
            </div>
            <h4 className="font-bold mt-md text-primary">Live Ball Scoring</h4>
            <p className="text-sm text-secondary mt-xs">Ball-by-ball digital live updates on the TRIVAB app including detailed stats and MVP leaderboards.</p>
          </div>

          <div className="card service-card">
            <div className="service-icon-box">
              <Users size={24} className="text-gold" />
            </div>
            <h4 className="font-bold mt-md text-primary">Certified Officiating</h4>
            <p className="text-sm text-secondary mt-xs">Experienced, professional umpires and match scorers ensuring fair play and adherence to regulations.</p>
          </div>

          <div className="card service-card">
            <div className="service-icon-box">
              <Award size={24} className="text-gold" />
            </div>
            <h4 className="font-bold mt-md text-primary">Branding & Media</h4>
            <p className="text-sm text-secondary mt-xs">Custom tournament flyers, social media promotion, trophies, and premium custom jerseys.</p>
          </div>
        </div>
      </div>

      {/* Split Form & Inclusions Info */}
      <div className="grid grid-2 gap-xl items-start">
        {/* Left Column: Why Host Section */}
        <div className="organize-info-column">
          <h2 className="text-xl font-bold text-gradient-gold mb-md">Host Your Next Event With Us</h2>
          <p className="text-secondary mb-lg">
            Whether you want to organize a fun corporate box-cricket weekend for employees or host a competitive leather-ball league on professional fields, our team takes away all stress from organizing cricket events.
          </p>

          <div className="info-feature-row flex gap-md items-start mb-md">
            <CheckCircle className="text-gold mt-xs flex-shrink-0" size={18} />
            <div>
              <h5 className="font-semi text-primary">Custom Formats Available</h5>
              <p className="text-sm text-secondary">T20, T10, Turf 6-a-side, Box Cricket, or Knockout leagues tailored to fit your timing and count of teams.</p>
            </div>
          </div>

          <div className="info-feature-row flex gap-md items-start mb-md">
            <CheckCircle className="text-gold mt-xs flex-shrink-0" size={18} />
            <div>
              <h5 className="font-semi text-primary">Corporate Branding Panels</h5>
              <p className="text-sm text-secondary">Place banner advertisements, company logos on the live scores app, and distribute custom team sportswear.</p>
            </div>
          </div>

          <div className="info-feature-row flex gap-md items-start mb-md">
            <CheckCircle className="text-gold mt-xs flex-shrink-0" size={18} />
            <div>
              <h5 className="font-semi text-primary">Comprehensive Insurance & Safety</h5>
              <p className="text-sm text-secondary">First-aid medical kits on location, emergency standby services, and safety protocols maintained for all players.</p>
            </div>
          </div>

          <div className="card stats-callout p-lg mt-lg flex items-center justify-between border-top-gold">
            <div className="text-center">
              <span className="display-sm text-gradient-gold block font-bold">50+</span>
              <span className="text-xs text-muted font-bold block uppercase">Leagues Hosted</span>
            </div>
            <div className="text-center" style={{ borderLeft: '1px solid var(--border-card)', borderRight: '1px solid var(--border-card)', padding: '0 24px' }}>
              <span className="display-sm text-gradient-gold block font-bold">400+</span>
              <span className="text-xs text-muted font-bold block uppercase">Active Squads</span>
            </div>
            <div className="text-center">
              <span className="display-sm text-gradient-gold block font-bold">1200+</span>
              <span className="text-xs text-muted font-bold block uppercase">Matches Scored</span>
            </div>
          </div>
        </div>

        {/* Right Column: Inquiry Form / Book Now Form */}
        <div className="card booking-form-card p-xl border-top-gold" id="book-form">
          {submitted ? (
            <div className="booking-success-wrapper text-center py-xl page-enter">
              <div className="success-icon-box mx-auto mb-md animate-scale-in">
                <CheckCircle size={60} className="text-green" />
              </div>
              <h3 className="text-lg font-bold text-gradient-gold">Inquiry Submitted Successfully!</h3>
              <p className="text-secondary mt-sm">
                Thank you for contacting TRIVAB. Our tournament organizing team will review your requirements and reach out to you within 24 hours.
              </p>
              <button 
                onClick={() => setSubmitted(false)}
                className="btn btn-gold mt-lg"
              >
                Submit Another Inquiry
              </button>
            </div>
          ) : (
            <>
              <h3 className="text-lg font-bold text-gradient-gold mb-sm flex items-center gap-sm">
                <ClipboardList size={22} /> Booking & Inquiry Form
              </h3>
              <p className="text-sm text-secondary mb-md">Fill out details about your tournament plans and our representative will call you back with estimates.</p>
              
              {error && (
                <div className="alert alert-error mb-md">
                  <ShieldAlert size={18} className="flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-md">
                <div className="form-group">
                  <label className="form-label flex items-center gap-xs"><Users size={14} /> Contact Person Name *</label>
                  <input
                    type="text"
                    name="name"
                    className="form-input"
                    placeholder="e.g. John Doe"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="grid grid-2 gap-md">
                  <div className="form-group">
                    <label className="form-label flex items-center gap-xs"><Mail size={14} /> Business Email *</label>
                    <input
                      type="email"
                      name="email"
                      className="form-input"
                      placeholder="e.g. john@company.com"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label flex items-center gap-xs"><Phone size={14} /> Mobile Phone Number *</label>
                    <input
                      type="tel"
                      name="phone"
                      className="form-input"
                      placeholder="10 digit number"
                      required
                      value={formData.phone}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label flex items-center gap-xs"><Building size={14} /> Organization / Company Name</label>
                  <input
                    type="text"
                    name="organization"
                    className="form-input"
                    placeholder="e.g. Corporate Sports Club"
                    value={formData.organization}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="grid grid-2 gap-md">
                  <div className="form-group">
                    <label className="form-label">Tournament Type</label>
                    <select
                      name="tournamentType"
                      className="form-select"
                      value={formData.tournamentType}
                      onChange={handleInputChange}
                    >
                      <option value="Corporate Cup">Corporate Cup</option>
                      <option value="Turf Championship">Turf Championship</option>
                      <option value="T20 League">T20 Leather League</option>
                      <option value="Box Cricket Tournament">Box Cricket Tournament</option>
                      <option value="Monsoon Cup">Monsoon Cup</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Expected Teams</label>
                    <select
                      name="expectedTeams"
                      className="form-select"
                      value={formData.expectedTeams}
                      onChange={handleInputChange}
                    >
                      <option value="4-6">4 to 6 Teams</option>
                      <option value="8">8 Teams</option>
                      <option value="12">12 Teams</option>
                      <option value="16">16 Teams</option>
                      <option value="20+">20+ Teams</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Proposed Starting Date</label>
                  <input
                    type="date"
                    name="proposedDate"
                    className="form-input"
                    value={formData.proposedDate}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Special Requests / Requirements</label>
                  <textarea
                    name="message"
                    className="form-input"
                    rows="3"
                    placeholder="Describe turf choices, custom kit sizing, schedule times, or umpire details..."
                    value={formData.message}
                    onChange={handleInputChange}
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="btn btn-gold w-full mt-sm"
                >
                  {loading ? 'Submitting Inquiry...' : 'Submit Inquiry / Book Now'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
