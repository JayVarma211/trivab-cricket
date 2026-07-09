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
              Premium Corporate Cricket Experience
            </h3>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="stat-icon" style={{ marginBottom: 0, width: '56px', height: '56px', borderRadius: '12px' }}>
              {icon}
            </div>
            <div>
              <h2 className="display-sm text-gradient-gold" style={{ margin: 0 }}>Corporate Sports Events</h2>
              <span className="text-xs text-muted">Premium Turnkey Solutions</span>
            </div>
          </div>

          <p className="text-secondary" style={{ fontSize: '1.08rem', lineHeight: 1.7, marginTop: '8px' }}>
            Transform your workplace into a high-performing, connected, and motivated community through professionally managed corporate cricket tournaments. We deliver a seamless, end-to-end sporting experience that goes beyond competition—creating opportunities for employee engagement, leadership development, team collaboration, and organizational pride.
          </p>
          <p className="text-secondary" style={{ fontSize: '1.02rem', lineHeight: 1.6 }}>
            Whether you're planning an annual sports day, an inter-department championship, a client engagement event, or a multi-company corporate league, our experienced team handles every aspect with precision, allowing your HR and administration teams to focus on what matters most—your people.
          </p>
          <p className="text-secondary" style={{ fontSize: '1.02rem', lineHeight: 1.6 }}>
            Our tournaments are designed to strengthen workplace relationships, celebrate employee achievements, and create memorable experiences that positively impact company culture.
          </p>

          <div style={{ marginTop: 'var(--space-md)' }}>
            <Link to="/contact?subject=Corporate Sports Tournament" className="btn btn-gold" style={{ alignSelf: 'flex-start' }}>
              Plan a Corporate Tournament <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Why Corporate Sports Matter */}
      <div style={{ borderTop: '1px solid var(--border-card)', paddingTop: '48px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <span className="section-label">Strategic Value</span>
          <h3 className="display-sm text-gradient-gold" style={{ marginTop: '8px', fontSize: '1.8rem' }}>Why Corporate Sports Matter</h3>
          <p className="text-secondary" style={{ maxWidth: '600px', margin: '8px auto 0', fontSize: '0.95rem' }}>
            Modern organizations understand that engaged employees are more productive, collaborative, and committed.
          </p>
        </div>
        <div className="deliverables-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {[
            { title: "Strengthen Engagement", text: "Strengthen employee engagement and workplace culture across all levels." },
            { title: "Improve Collaboration", text: "Improve collaboration across departments, units, and leadership hierarchies." },
            { title: "Promote Well-being", text: "Promote physical and mental well-being to support overall employee health." },
            { title: "Recognition & Reward", text: "Recognize and reward active participation, effort, and team spirit." },
            { title: "Employer Branding", text: "Enhance external employer branding and boost internal employee satisfaction." },
            { title: "Foster Leadership", text: "Foster organic leadership development, communication skills, and synergy." },
            { title: "Increase Morale", text: "Increase employee morale, dedication, and daily workspace motivation." },
            { title: "Lasting Memories", text: "Create memorable experiences that bond teams beyond the workplace." },
            { title: "Encourage Sportsmanship", text: "Encourage healthy, constructive competition and corporate sportsmanship." },
            { title: "Support Retention", text: "Support talent retention through high-value engagement initiatives." }
          ].map((item, index) => (
            <div key={index} className="deliverable-card" style={{ padding: '24px', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle2 size={18} className="text-gold" />
                <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>{item.title}</h4>
              </div>
              <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{item.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Complete Tournament Management */}
      <div style={{ borderTop: '1px solid var(--border-card)', paddingTop: '48px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <span className="section-label">Turnkey Execution</span>
          <h3 className="display-sm text-gradient-gold" style={{ marginTop: '8px', fontSize: '1.8rem' }}>Complete Tournament Management</h3>
          <p className="text-secondary" style={{ maxWidth: '600px', margin: '8px auto 0', fontSize: '0.95rem' }}>
            We provide a fully managed, turnkey solution handling every operational detail from conception to execution.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          {/* Card A */}
          <div className="deliverable-card" style={{ padding: '36px 30px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div className="stat-icon" style={{ width: '40px', height: '40px' }}><Calendar size={18} /></div>
              <h4 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--gold-light)' }}>Pre-Event Planning</h4>
            </div>
            <ul style={{ paddingLeft: '16px', margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                "Consultation with HR and organizing committee",
                "Tournament format planning",
                "Budget planning and event timeline",
                "Team registration management",
                "Fixture creation and scheduling",
                "Player database management",
                "Digital invitations and participation campaigns",
                "Event branding and creative design",
                "Venue booking and logistics planning"
              ].map((li, i) => (
                <li key={i} style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{li}</li>
              ))}
            </ul>
          </div>

          {/* Card B */}
          <div className="deliverable-card" style={{ padding: '36px 30px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div className="stat-icon" style={{ width: '40px', height: '40px' }}><Settings size={18} /></div>
              <h4 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--gold-light)' }}>Tournament Operations</h4>
            </div>
            <ul style={{ paddingLeft: '16px', margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                "Premium cricket grounds and turfs",
                "Professional turf or matting wickets",
                "Certified umpires, scorers, and referees",
                "Live score management & digital portals",
                "Dedicated event managers and ground staff",
                "Technical support and sound announcements",
                "Team changing areas & drinking water stations"
              ].map((li, i) => (
                <li key={i} style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{li}</li>
              ))}
            </ul>
          </div>

          {/* Card C */}
          <div className="deliverable-card" style={{ padding: '36px 30px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div className="stat-icon" style={{ width: '40px', height: '40px' }}><Sparkles size={18} /></div>
              <h4 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--gold-light)' }}>Branding &amp; Identity</h4>
            </div>
            <ul style={{ paddingLeft: '16px', margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                "Customized team jerseys with company logos",
                "Branded caps & custom athletic apparel",
                "Boundary, pitch, and backdrop branding",
                "Entry arch, trophies, and digital award branding",
                "Social media posters, fixtures, & player cards",
                "Sponsor branding integration opportunities"
              ].map((li, i) => (
                <li key={i} style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{li}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* 4. Experience Categories */}
      <div style={{ borderTop: '1px solid var(--border-card)', paddingTop: '48px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          {/* Column 1 */}
          <div className="deliverable-card" style={{ padding: '30px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div className="stat-icon" style={{ width: '40px', height: '40px' }}><Camera size={18} /></div>
              <h4 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>Professional Media Coverage</h4>
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>
              Every memorable moment deserves to be captured. These assets can be used for your company's internal communications, recruitment campaigns, employer branding, and social media platforms:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {[
                "HD Photography", "Drone Videography", "Cinematic Films", "Match Reels",
                "Team Interviews", "Player Interviews", "Leadership messages", "Live Streaming",
                "After-movies", "Award ceremonies"
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: 'var(--gold-light)', fontSize: '0.9rem' }}>✦</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Column 2 */}
          <div className="deliverable-card" style={{ padding: '30px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div className="stat-icon" style={{ width: '40px', height: '40px' }}><Smile size={18} /></div>
              <h4 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>Employee Experience</h4>
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>
              We believe every participant should enjoy a premium sporting environment with professional standards:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {[
                "Custom jerseys", "Welcome kits", "Official ID cards", "Match schedules",
                "Certificates", "Refreshments", "Medical support", "Playing fields",
                "Live scoring", "Player stats", "MVP recognition", "Performances"
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: 'var(--gold-light)', fontSize: '0.9rem' }}>✦</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Column 3 */}
          <div className="deliverable-card" style={{ padding: '30px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div className="stat-icon" style={{ width: '40px', height: '40px' }}><Coffee size={18} /></div>
              <h4 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>Hospitality &amp; Guest Experience</h4>
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>
              Provide a world-class experience for employees, clients, and leadership teams during the tournament:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {[
                "VIP seating", "Hospitality lounge", "Refreshments", "Gourmet catering",
                "Tea & coffee bars", "Family seating", "Kids activity zone", "Live announcements",
                "Mid-break music", "Sponsor stalls"
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
          {/* Card A */}
          <div className="deliverable-card" style={{ padding: '30px', borderLeft: '3px solid var(--gold-light)' }}>
            <h4 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--gold-light)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Trophy size={18} /> Awards &amp; Recognition
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '14px' }}>Celebrate employee achievements with a memorable closing ceremony.</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {[
                "Championship Trophy", "Runner-up Trophy", "Best Player", "Best Batsman", "Best Bowler",
                "Player of the Tournament", "Emerging Player", "Fair Play Award", "Best Team Spirit Award",
                "Best Captain", "Outstanding Leadership Award", "Department Champions", "Corporate Mementos"
              ].map((award, i) => (
                <span key={i} style={{ fontSize: '0.78rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-card)', padding: '4px 8px', borderRadius: '4px', color: 'var(--text-secondary)' }}>
                  {award}
                </span>
              ))}
            </div>
          </div>

          {/* Card B */}
          <div className="deliverable-card" style={{ padding: '30px', borderLeft: '3px solid #C44040' }}>
            <h4 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#C44040', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={18} /> Safety &amp; Event Compliance
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '14px' }}>Employee safety is our highest priority.</p>
            <ul style={{ paddingLeft: '16px', margin: 0, display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {[
                "First-aid support & on-site medical assistance",
                "Ambulance on standby (optional)",
                "Comprehensive event insurance options",
                "Certified, secure sports facilities",
                "Emergency response planning & secure conditions",
                "Hydration stations & crowd management operations"
              ].map((safe, i) => (
                <li key={i}>{safe}</li>
              ))}
            </ul>
          </div>

          {/* Card C */}
          <div className="deliverable-card" style={{ padding: '30px', borderLeft: '3px solid #FF5A5A' }}>
            <h4 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#FF5A5A', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={18} /> Optional Premium Add-ons
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '14px' }}>Enhance your event with exclusive, stadium-grade upgrades.</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {[
                "Celebrity appearances", "Coaching clinics", "Keynote speakers", "Trophy unveiling",
                "Live commentary", "LED scoreboards", "Giant LED screens", "Opening ceremonies",
                "Fireworks displays", "Live DJ", "networking sessions", "Family carnivals",
                "Sponsor booths", "Multi-city leagues"
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
            <h4 className="display-sm text-gradient-gold" style={{ margin: 0, fontSize: '1.4rem' }}>Why HR Teams Choose Us</h4>
            <p className="text-secondary" style={{ fontSize: '0.95rem', lineHeight: 1.6, margin: 0 }}>
              We understand that HR professionals are measured not only by event execution but by the impact those events have on employee engagement, satisfaction, and organizational culture.
            </p>
            <p className="text-secondary" style={{ fontSize: '0.95rem', lineHeight: 1.6, margin: 0 }}>
              Our team becomes an extension of your HR department, managing every operational detail while ensuring a smooth, stress-free experience from planning through post-event reporting.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
              {[
                "Increase employee participation and engagement metrics",
                "Save valuable planning time through a single point of operational contact",
                "Receive comprehensive post-event reports, photo libraries, and participation insights"
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
              "Your employees are your greatest asset. Investing in experiences that bring people together is an investment in your organization's culture, collaboration, and long-term success."
            </p>
            <p className="text-secondary" style={{ fontSize: '0.92rem', lineHeight: 1.5, margin: 0 }}>
              Our Corporate Cricket Platform is more than a sporting event—it's a strategic employee engagement initiative that inspires teamwork, recognizes talent, encourages healthy lifestyles, and creates lasting memories. We manage every detail with professionalism, allowing your HR team to deliver an exceptional experience with confidence.
            </p>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--gold-light)', fontWeight: 600 }}>
              Let's create an event your employees will talk about long after the final match.
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
