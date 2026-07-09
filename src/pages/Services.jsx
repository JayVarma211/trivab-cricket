import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Globe, Trophy, Building2, Users, ArrowRight, CheckCircle2, Star, Calendar, Pill, FlaskConical, Landmark, Cpu, CreditCard, Briefcase, TrendingUp, Activity, Calculator, Home, Plus, Settings, Sparkles, Camera, Smile, Coffee, Shield, Heart, Zap, Quote } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SEO from '../components/common/SEO';

export default function Services() {
  const [searchParams, setSearchParams] = useSearchParams();
  const typeParam = searchParams.get('type') || 'international';
  const [activeTab, setActiveTab] = useState(typeParam);

  useEffect(() => {
    if (typeParam) {
      setActiveTab(typeParam);
    }
  }, [typeParam]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ type: tab });
  };

  const servicesData = {
    corporate: {
      title: 'Corporate Sports Events',
      subtitle: 'Premium team building through executive cricket championships.',
      icon: <Building2 size={48} className="text-gold" />,
      tagline: 'Boost team spirit with professional league fixtures',
      description: 'We orchestrate end-to-end corporate cricket tournaments tailored for blue-chip companies, startups, and business consortiums. Improve employee engagement, promote wellness, and build brand visibility with a premium, fully-managed sports platform.',
      highlights: [
        'Fully managed tournaments with flexible match schedules',
        'Company-branded uniforms, banners, and digital marketing materials',
        'Exquisite prize ceremonies with custom corporate trophies',
        'Dedicated event coordinators, photographers, and video highlight reels',
        'Gourmet catering and hospitality options for employees and guests',
        'Safe, fully insured sports facilities with first-aid support'
      ],
      ctaText: 'Plan a Corporate Tournament',
      images: [
        '/logos/CORPORATE1.jpeg',
        '/logos/CORPORATE2.jpeg',
        '/logos/CORPORATE3.jpeg',
        '/logos/CORPORATE4.jpeg',
        '/logos/CORPORATE5.jpeg'
      ]
    },
    community: {
      title: 'Community Sports Events',
      subtitle: 'Fostering local cricket talent and active neighborhoods.',
      icon: <Users size={48} className="text-gold" />,
      tagline: 'Connecting neighborhoods through the spirit of the game',
      description: 'We organize youth coaching clinics, community tournaments, and friendly club matches that encourage participation, discover local talent, and bring families together around sports. We believe cricket belongs to everyone.',
      highlights: [
        'Neighborhood/society leagues and friendly weekend fixtures',
        'Discovering grassroots talent with academy sponsorships',
        'Family-friendly matches, women\'s cups, and kids cricket days',
        'High-quality coaching clinics by certified trainers',
        'Fostering health, discipline, and active lifestyles locally',
        'Inclusive tournaments welcoming players of all skill levels'
      ],
      ctaText: 'Get Involved in Community Sports',
      images: ['/images/Community.jpg', '/images/Community1.jpg']
    },
    international: {
      title: 'International Cricket Tour',
      subtitle: 'Experience cricket on global stages with world-class facilities.',
      icon: <Globe size={48} className="text-gold" />,
      tagline: 'Experience cricket on legendary international turf wickets',
      description: 'Our International Cricket Tour package offers amateur, corporate, and academy squads the chance to travel overseas, experience playing on historical international pitches, and compete against foreign cricket clubs. We coordinate all logistics from flights to turf stadiums.',
      highlights: [
        'Matches in cricket hubs like UK, UAE, Sri Lanka, and Australia',
        'Customized tour clothing & professional training sessions',
        'Accommodations at premium hotels with full meal plans',
        'Bilateral trophies and tournament organization',
        'Guided sightseeing and leisure excursions included',
        'Visa coordination, ground transport, and flight booking assistance'
      ],
      ctaText: 'Inquire About International Tour',
      images: ['/logos/INTERNATIONALTOUR.jpeg']
    },
    domestic: {
      title: 'Domestic Cricket Tour',
      subtitle: 'State-of-the-art turf tournaments across the major cities of India.',
      icon: <Trophy size={48} className="text-gold" />,
      tagline: 'Compete in India\'s finest cricket circuits',
      description: 'Our Domestic Cricket Tour packages bring professional-grade tournament structures to top cricketing cities like Mumbai, Pune, Goa, and Bangalore. Players compete on elite turf grounds with live ball-by-ball scoring, BCCI-certified umpires, custom colored apparel, and HD match broadcasting.',
      highlights: [
        'Access to standard turf grounds and stadium lights',
        'Live scoring updates on CricHeroes & video recordings',
        'Match analysis, MVP awards, and statistics tracking',
        'Professional BCCI-certified umpires and match referees',
        'Custom club jerseys and high-quality league cricket balls',
        'Local transport and catering during match days'
      ],
      ctaText: 'Enroll in Domestic Tour',
      images: ['/logos/DOMESTICTOUR.jpeg', '/logos/DOMESTICTOUR1.jpeg']
    }
  };

  const currentService = servicesData[activeTab];

  const servicesSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "TRIVAB Sports Cricket Services",
    "description": "Premium services offered by TRIVAB Sports, including international tours, domestic tournaments, corporate event hosting, and community clinics.",
    "url": "https://trivabsports.com/services"
  };

  return (
    <div className="services-page page-enter" style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <SEO 
        title="Services & Events"
        description="Explore premium cricket services by TRIVAB Sports: International and Domestic Cricket Tours, Corporate Sports Tournaments, and neighborhood Community Events."
        keywords="TRIVAB Sports services, international cricket tour, domestic cricket tour, corporate cricket tournament, youth coaching clinic"
        schema={servicesSchema}
      />
      {/* Hero Banner */}
      <section style={{
        background: 'var(--gradient-hero)',
        padding: 'var(--space-4xl) 0 var(--space-2xl)',
        borderBottom: '1px solid var(--border-card)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div className="orb orb-gold spline-float-1" style={{ top: '10%', right: '10%', width: '350px', height: '350px', opacity: 0.25 }} />
        <div className="orb orb-navy spline-float-2" style={{ bottom: '0%', left: '5%', width: '400px', height: '400px', opacity: 0.2 }} />
        <div className="container" style={{ position: 'relative', zIndex: 10, textAlign: 'center' }}>
          <span className="section-label">Our Offerings</span>
          <h1 className="display-2xl" style={{ marginTop: 'var(--space-md)' }}>
            <span className="text-gradient-gold">TRIVAB Sports</span> Services &amp; Events
          </h1>
          <p className="text-secondary" style={{ maxWidth: '600px', margin: 'var(--space-md) auto 0' }}>
            From international tours to local grassroots championships, TRIVAB designs and executes world-class cricket experiences.
          </p>
        </div>
      </section>

      <div className="container section-padding">
        {/* Navigation Tabs */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 'var(--space-sm)',
          marginBottom: 'var(--space-3xl)',
          flexWrap: 'wrap',
          background: 'var(--bg-secondary)',
          padding: '8px',
          borderRadius: 'var(--radius-full)',
          border: '1px solid var(--border-card)',
          maxWidth: '850px',
          margin: '0 auto var(--space-3xl)'
        }}>
          {Object.keys(servicesData).map((key) => (
            <button
              key={key}
              onClick={() => handleTabChange(key)}
              style={{
                padding: '10px 24px',
                borderRadius: 'var(--radius-full)',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                background: activeTab === key ? 'var(--gradient-gold)' : 'transparent',
                color: activeTab === key ? '#fff' : 'var(--text-secondary)',
                boxShadow: activeTab === key ? '0 4px 12px var(--gold-glow)' : 'none',
              }}
            >
              {servicesData[key].title.split(' ')[0]} {key === 'domestic' || key === 'international' ? 'Tour' : 'Events'}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'corporate' ? (
            <CorporateSportsView 
              images={currentService.images} 
              title={currentService.title} 
              icon={currentService.icon} 
            />
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="services-content-grid"
            >
              {/* Left Column: Media & Visuals */}
              <div className="card-gold services-image-card" style={{ padding: 0, overflow: 'hidden', position: 'relative' }}>
                <ServiceImageSlider images={currentService.images} title={currentService.title} />
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, rgba(9,9,11,0.9) 0%, rgba(9,9,11,0.2) 60%, transparent 100%)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  padding: 'var(--space-xl)',
                  pointerEvents: 'none'
                }}>
                  <h3 className="display-sm" style={{ margin: 0, color: '#ffffff', textShadow: '0 2px 8px rgba(0, 0, 0, 0.8)' }}>{currentService.tagline}</h3>
                </div>
              </div>

              {/* Right Column: Info & Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className="stat-icon" style={{ marginBottom: 0, width: '56px', height: '56px', borderRadius: '12px' }}>
                    {currentService.icon}
                  </div>
                  <div>
                    <h2 className="display-sm text-gradient-gold" style={{ margin: 0 }}>{currentService.title}</h2>
                    <span className="text-xs text-muted">Premium Offering</span>
                  </div>
                </div>

                <p className="text-secondary" style={{ fontSize: '1.05rem', lineHeight: 1.7, marginTop: '8px' }}>
                  {currentService.description}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
                  <h4 className="text-sm font-bold uppercase tracking-wider text-gold mb-xs">Key Deliverables:</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px 16px' }}>
                    {currentService.highlights.map((highlight, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CheckCircle2 size={16} className="text-gold" style={{ flexShrink: 0 }} />
                        <span className="text-sm text-secondary">{highlight}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ marginTop: 'var(--space-lg)', display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
                  <Link to="/contact" className="btn btn-gold" style={{ flex: '1 1 200px', justifyContent: 'center' }}>
                    {currentService.ctaText} <ArrowRight size={18} />
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function CorporateSportsView({ images, title, icon }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      style={{ display: 'flex', flexDirection: 'column', gap: '48px', width: '100%' }}
    >
      {/* 1. Introduction Segment */}
      <div className="services-content-grid" style={{ alignItems: 'flex-start' }}>
        <div className="card-gold services-image-card" style={{ padding: 0, overflow: 'hidden', position: 'relative' }}>
          <ServiceImageSlider images={images} title={title} />
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(9,9,11,0.9) 0%, rgba(9,9,11,0.2) 60%, transparent 100%)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            padding: 'var(--space-xl)',
            pointerEvents: 'none'
          }}>
            <h3 className="display-sm" style={{ margin: 0, color: '#ffffff', textShadow: '0 2px 8px rgba(0, 0, 0, 0.8)' }}>
              Complete Corporate Sports &amp; Event Management
            </h3>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="stat-icon" style={{ marginBottom: 0, width: '56px', height: '56px', borderRadius: '12px' }}>
              {icon}
            </div>
            <div>
              <h2 className="display-sm text-gradient-gold" style={{ margin: 0 }}>Corporate Sports &amp; Events</h2>
              <span className="text-xs text-muted">Premium Turnkey Management</span>
            </div>
          </div>

          <p className="text-secondary" style={{ fontSize: '1.08rem', lineHeight: 1.7, marginTop: '8px' }}>
            We provide a fully managed, turnkey solution for corporate sports tournaments, employee engagement programs, wellness initiatives, team-building activities, and large-scale corporate events. From concept and planning to flawless execution, our experienced team manages every operational detail, delivering professional experiences that align with your organization's culture and objectives.
          </p>

          <div style={{ marginTop: 'var(--space-md)' }}>
            <Link to="/contact?subject=Corporate Sports Tournament" className="btn btn-gold" style={{ alignSelf: 'flex-start' }}>
              Plan a Corporate Event <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Complete Tournament Management */}
      <div style={{ borderTop: '1px solid var(--border-card)', paddingTop: '48px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <span className="section-label">Turnkey Execution</span>
          <h3 className="display-sm text-gradient-gold" style={{ marginTop: '8px', fontSize: '1.8rem' }}>Complete Event Management</h3>
          <p className="text-secondary" style={{ maxWidth: '600px', margin: '8px auto 0', fontSize: '0.95rem' }}>
            We provide a fully managed, turnkey solution handling every operational detail from planning through execution.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          {/* Pre-Event Planning */}
          <div className="deliverable-card" style={{ padding: '36px 30px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div className="stat-icon" style={{ width: '40px', height: '40px' }}><Calendar size={18} /></div>
              <h4 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--gold-light)' }}>Pre-Event Planning</h4>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
              Every successful event begins with meticulous planning. Our team works closely with your HR, Administration, CSR, and Leadership teams.
            </p>
            <ul style={{ paddingLeft: '16px', margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                "Requirement analysis and event consultation",
                "Event concept development",
                "Sports and activity selection based on employee participation",
                "Budget planning and cost optimization",
                "Event timelines and execution roadmap",
                "Venue selection and booking",
                "Team and participant registration",
                "Digital registration platform",
                "Event branding and creative design",
                "Employee communication campaigns",
                "Scheduling and logistics planning",
                "Vendor coordination",
                "Equipment planning and procurement",
                "Risk assessment and contingency planning"
              ].map((li, i) => (
                <li key={i} style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>{li}</li>
              ))}
            </ul>
          </div>

          {/* Event Operations & Execution */}
          <div className="deliverable-card" style={{ padding: '36px 30px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div className="stat-icon" style={{ width: '40px', height: '40px' }}><Settings size={18} /></div>
              <h4 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--gold-light)' }}>Operations &amp; Execution</h4>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
              Our experienced operations team ensures every aspect of your event is managed professionally.
            </p>
            <ul style={{ paddingLeft: '16px', margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                "Premium indoor and outdoor venues",
                "Professional sports infrastructure and equipment",
                "Professional referees, umpires, and technical officials",
                "Event coordinators and ground management staff",
                "Registration and help desk management",
                "Live scorekeeping and tournament management systems",
                "Stage setup and event production",
                "Audio, lighting, and sound systems",
                "On-site troubleshooting and event supervision"
              ].map((li, i) => (
                <li key={i} style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>{li}</li>
              ))}
            </ul>
          </div>

          {/* Corporate Branding & Event Identity */}
          <div className="deliverable-card" style={{ padding: '36px 30px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div className="stat-icon" style={{ width: '40px', height: '40px' }}><Sparkles size={18} /></div>
              <h4 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--gold-light)' }}>Branding &amp; Event Identity</h4>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
              Every event becomes an extension of your organization's brand.
            </p>
            <ul style={{ paddingLeft: '16px', margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                "Customized employee uniforms and sports apparel",
                "Company-branded T-shirts, jerseys, caps, and accessories",
                "Event logo and theme development",
                "Entrance arch branding",
                "Stage branding",
                "Venue branding",
                "Backdrops and photo walls",
                "Digital invitations",
                "Social media creatives",
                "Event brochures",
                "Trophy and award branding",
                "Sponsor branding integration",
                "Promotional merchandise"
              ].map((li, i) => (
                <li key={i} style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>{li}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* 3. Types of Events We Organize */}
      <div style={{ borderTop: '1px solid var(--border-card)', paddingTop: '48px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <span className="section-label">Our Capabilities</span>
          <h3 className="display-sm text-gradient-gold" style={{ marginTop: '8px', fontSize: '1.8rem' }}>Types of Events We Organize</h3>
          <p className="text-secondary" style={{ maxWidth: '600px', margin: '8px auto 0', fontSize: '0.95rem' }}>
            Our expertise extends across a wide range of corporate events designed to engage, motivate, and inspire employees.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '28px' }}>
          {/* Sports Events */}
          <div className="deliverable-card" style={{ padding: '36px 30px' }}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '1.25rem', fontWeight: 800, color: 'var(--gold-light)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Trophy size={20} /> Sports Events
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px' }}>
              {[
                "Cricket", "Football", "Badminton", "Pickleball", "Indoor Games", "Multi-Sport Championships"
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: 'var(--gold-light)' }}>✦</span>
                  <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Corporate Events */}
          <div className="deliverable-card" style={{ padding: '36px 30px' }}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '1.25rem', fontWeight: 800, color: 'var(--gold-light)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Building2 size={20} /> Corporate Events
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px' }}>
              {[
                "Annual Sports Days", "Employee Engagement Programs", "Team Building Activities",
                "Family Day Events", "Corporate Picnics", "Wellness & Fitness Challenges",
                "Annual Celebrations", "Awards & Recognition Ceremonies", "Leadership Retreats",
                "CSR Events", "Product Launches", "Conferences & Gatherings",
                "Cultural Festivals", "Dealer & Partner Meets"
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: 'var(--gold-light)' }}>✦</span>
                  <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Experience Categories */}
      <div style={{ borderTop: '1px solid var(--border-card)', paddingTop: '48px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          {/* Column 1: Media Coverage */}
          <div className="deliverable-card" style={{ padding: '30px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div className="stat-icon" style={{ width: '40px', height: '40px' }}><Camera size={18} /></div>
              <h4 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>Professional Media Coverage</h4>
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>
              Capture every achievement and memorable moment through premium media coverage. These assets can be utilized for internal communication, recruitment, annual reports, employer branding, company websites, and social media marketing:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {[
                "Professional photography", "Cinematic videography", "Drone coverage (where permitted)",
                "Event highlight films", "Social media reels", "Live streaming", "Employee interviews",
                "Leadership messages", "Testimonials", "Event after-movie", "Award ceremony coverage",
                "Team photographs", "Promotional content", "Post-event content library"
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: 'var(--gold-light)', fontSize: '0.9rem' }}>✦</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Column 2: Employee Experience */}
          <div className="deliverable-card" style={{ padding: '30px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div className="stat-icon" style={{ width: '40px', height: '40px' }}><Smile size={18} /></div>
              <h4 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>Employee Experience</h4>
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>
              We believe every employee should enjoy a professional, engaging, and memorable event experience:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {[
                "Personalized welcome kits", "Branded event merchandise", "Official ID cards",
                "Event schedules", "Refreshments throughout", "Wellness & hydration stations",
                "Comfortable facilities", "Live event updates", "Performance tracking", "Recognition awards"
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: 'var(--gold-light)', fontSize: '0.9rem' }}>✦</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Column 3: Hospitality & Guest Experience */}
          <div className="deliverable-card" style={{ padding: '30px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div className="stat-icon" style={{ width: '40px', height: '40px' }}><Coffee size={18} /></div>
              <h4 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>Hospitality &amp; Guest Experience</h4>
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>
              Create an exceptional experience for employees, leadership teams, clients, business partners, and guests:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {[
                "Executive seating", "Premium catering", "Refreshment counters", "Entertainment during breaks",
                "Live announcements", "Background music & DJ", "Sponsor activation areas"
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: 'var(--gold-light)', fontSize: '0.9rem' }}>✦</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 5. Awards, Safety, Compliance, Add-ons */}
      <div style={{ borderTop: '1px solid var(--border-card)', paddingTop: '48px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          {/* Awards & Recognition */}
          <div className="deliverable-card" style={{ padding: '30px', borderLeft: '3px solid var(--gold-light)' }}>
            <h4 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--gold-light)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Trophy size={18} /> Awards &amp; Recognition
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
              Celebrate excellence with professionally managed award ceremonies recognizing performance, participation, teamwork, and leadership:
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {[
                "Championship Trophy", "Runner-up Trophy", "Team Excellence Awards",
                "Best Performer", "Employee Champion Award", "Department Excellence Award"
              ].map((award, i) => (
                <span key={i} style={{ fontSize: '0.78rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-card)', padding: '4px 8px', borderRadius: '4px', color: 'var(--text-secondary)' }}>
                  {award}
                </span>
              ))}
            </div>
          </div>

          {/* Safety & Compliance */}
          <div className="deliverable-card" style={{ padding: '30px', borderLeft: '3px solid #C44040' }}>
            <h4 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#C44040', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={18} /> Safety &amp; Compliance
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
              The safety and well-being of every participant remains our highest priority.
            </p>
            <ul style={{ paddingLeft: '16px', margin: 0, display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {[
                "First-aid support",
                "Ambulance support (optional)",
                "Certified venues",
                "Fire and safety compliance",
                "Hydration stations",
                "Weather contingency planning",
                "Risk management protocols"
              ].map((safe, i) => (
                <li key={i}>{safe}</li>
              ))}
            </ul>
          </div>

          {/* Optional Premium Experiences */}
          <div className="deliverable-card" style={{ padding: '30px', borderLeft: '3px solid #FF5A5A' }}>
            <h4 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#FF5A5A', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={18} /> Optional Premium Experiences
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
              Take your event to the next level with exclusive premium enhancements:
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {[
                "Professional hosts & emcees", "Live commentary", "Opening & closing ceremonies",
                "LED scoreboards", "Giant LED display screens", "Engagement zones",
                "Virtual & hybrid support", "Cultural performances", "Live music and DJs",
                "Networking sessions", "CSR engagement", "Wellness workshops", "Fitness sessions",
                "Sponsor exhibition booths", "Multi-location events", "Annual engagement programs"
              ].map((addon, i) => (
                <span key={i} style={{ fontSize: '0.78rem', background: 'rgba(196,64,64,0.05)', border: '1px solid rgba(196,64,64,0.1)', padding: '4px 8px', borderRadius: '4px', color: '#FF5A5A' }}>
                  {addon}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 6. HR Segment */}
      <div style={{ borderTop: '1px solid var(--border-card)', paddingTop: '48px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}>
          {/* Why HR Teams Choose Us */}
          <div className="card-gold" style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h4 className="display-sm text-gradient-gold" style={{ margin: 0, fontSize: '1.4rem' }}>Why HR Teams Choose Us ?</h4>
            <p className="text-secondary" style={{ fontSize: '0.95rem', lineHeight: 1.6, margin: 0 }}>
              We understand that successful corporate events are measured not only by flawless execution but by their lasting impact on employee engagement, organizational culture, and business relationships.
            </p>
            <p className="text-secondary" style={{ fontSize: '0.95rem', lineHeight: 1.6, margin: 0 }}>
              Our experienced team becomes an extension of your HR, Administration, and Corporate Communications departments, ensuring every event is professionally managed from planning through post-event reporting.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
              <h5 style={{ margin: '0 0 4px 0', fontSize: '0.95rem', color: 'var(--gold-light)', fontWeight: 700 }}>We Help You:</h5>
              {[
                "Increase employee engagement and participation",
                "Strengthen teamwork and workplace culture",
                "Support employee wellness initiatives",
                "Enhance employer branding",
                "Improve cross-functional collaboration",
                "Reduce planning workload through a single point of contact",
                "Deliver memorable employee experiences",
                "Receive detailed post-event reports, media assets, participation analytics, and feedback insights"
              ].map((pt, i) => (
                <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <span style={{ color: 'var(--gold-light)', fontWeight: 'bold' }}>✓</span>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{pt}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Message to HR Leaders */}
          <div className="deliverable-card" style={{ padding: '40px', background: 'rgba(128,0,0,0.02)', display: 'flex', flexDirection: 'column', gap: '20px', border: '1px solid rgba(196,64,64,0.1)' }}>
            <div style={{ display: 'flex', color: '#FF5A5A', opacity: 0.8 }}><Quote size={32} /></div>
            <h4 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#FF5A5A', fontFamily: 'var(--font-display)' }}>A Message to HR Leaders</h4>
            <p className="text-secondary" style={{ fontSize: '0.98rem', lineHeight: 1.6, margin: 0, fontStyle: 'italic' }}>
              "People build organizations, and meaningful experiences build stronger people."
            </p>
            <p className="text-secondary" style={{ fontSize: '0.92rem', lineHeight: 1.5, margin: 0 }}>
              Today's employees value workplaces that invest in their well-being, celebrate achievements, and create opportunities to connect beyond everyday responsibilities. A thoughtfully designed sports or corporate event is more than just an activity—it's a powerful tool for building trust, encouraging collaboration, improving morale, and strengthening company culture.
            </p>
            <p className="text-secondary" style={{ fontSize: '0.92rem', lineHeight: 1.5, margin: 0 }}>
              Our mission is to help organizations create unforgettable experiences that inspire employees, reinforce organizational values, and leave a lasting positive impact. From intimate team-building sessions to large-scale corporate festivals and sports championships, we deliver every event with creativity, professionalism, and precision.
            </p>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--gold-light)', fontWeight: 600 }}>
              Let's create experiences your employees will remember, your leadership will appreciate, and your organization will be proud of.
            </p>
          </div>
        </div>
      </div>

      {/* 7. Sectors We Serve Grid */}
      <div style={{ borderTop: '1px solid var(--border-card)', paddingTop: '48px', width: '100%' }}>
        <h3 className="display-sm text-gradient-gold" style={{ marginBottom: '12px', fontSize: '1.6rem' }}>Sectors We Serve</h3>
        <p className="text-secondary mb-lg" style={{ fontSize: '1.02rem', maxWidth: '850px', lineHeight: 1.6 }}>
          We plan, organize, and manage professional corporate events and sports tournaments for a wide spectrum of sectors, bringing the same level of stadium-grade prestige and operational excellence to every event:
        </p>
        
        <div className="sectors-grid">
          {[
            { name: 'Pharmaceutical', icon: <Pill size={20} />, num: '01' },
            { name: 'Chemicals', icon: <FlaskConical size={20} />, num: '02' },
            { name: 'Banking Sectors', icon: <Landmark size={20} />, num: '03' },
            { name: 'Fintechs', icon: <Cpu size={20} />, num: '04' },
            { name: 'NBFC', icon: <CreditCard size={20} />, num: '05' },
            { name: 'SMEs', icon: <Briefcase size={20} />, num: '06' },
            { name: 'MSMEs', icon: <TrendingUp size={20} />, num: '07' },
            { name: 'Hospitals', icon: <Activity size={20} />, num: '08' },
            { name: 'CA Firms', icon: <Calculator size={20} />, num: '09' },
            { name: 'Real Estate & Developers', icon: <Home size={20} />, num: '10' },
            { name: 'And Other Sectors...', icon: <Plus size={20} />, num: '11' }
          ].map((sector, index) => (
            <motion.div
              key={sector.name}
              className="sector-card"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.4 }}
            >
              <div className="sector-card-hover-bg" />
              <div className="sector-card-header">
                <div className="sector-icon-wrapper">
                  {sector.icon}
                </div>
                <span className="sector-card-num">[ {sector.num} ]</span>
              </div>
              <h4 className="sector-card-title">{sector.name}</h4>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function ServiceImageSlider({ images, title }) {
  if (!images || images.length === 0) return null;

  if (images.length === 1) {
    return (
      <img
        src={images[0]}
        alt={title}
        className="single-animated-image"
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
    );
  }

  const K = images.length;
  const trackWidth = `${2 * K * 100}%`;
  const imageWidth = `${100 / (2 * K)}%`;

  return (
    <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
      <div className="marquee-track" style={{ width: trackWidth }}>
        {images.map((img, i) => (
          <img
            key={i}
            src={img}
            alt={`${title} - ${i + 1}`}
            style={{ width: imageWidth, height: '100%', objectFit: 'cover', flexShrink: 0 }}
          />
        ))}
        {images.map((img, i) => (
          <img
            key={`dup-${i}`}
            src={img}
            alt={`${title} - ${i + 1} duplicate`}
            style={{ width: imageWidth, height: '100%', objectFit: 'cover', flexShrink: 0 }}
          />
        ))}
      </div>
    </div>
  );
}
