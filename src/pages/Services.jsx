import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Globe, Trophy, Building2, Users, ArrowRight, CheckCircle2, Star, Calendar, Pill, FlaskConical, Landmark, Cpu, CreditCard, Briefcase, TrendingUp, Activity, Calculator, Home, Plus } from 'lucide-react';
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

          {activeTab === 'corporate' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              style={{
                marginTop: '48px',
                borderTop: '1px solid var(--border-card)',
                paddingTop: '48px',
                width: '100%'
              }}
            >
              <h3 className="display-sm text-gradient-gold" style={{ marginBottom: '12px', fontSize: '1.6rem' }}>Sectors We Serve</h3>
              <p className="text-secondary mb-lg" style={{ fontSize: '1.02rem', maxWidth: '850px', lineHeight: 1.6 }}>
                We plan, organize, and manage professional corporate events and sports tournaments for a wide spectrum of sectors, bringing the same level of stadium-grade prestige and operational excellence to every event:
              </p>
              
              <div className="sectors-grid">
                {[
                  {name: 'Pharmaceutical', icon: <Pill size={20} />, num: '01'},
                  {name: 'Chemicals', icon: <FlaskConical size={20} />, num: '02'},
                  {name: 'Banking Sectors', icon: <Landmark size={20} />, num: '03'},
                  {name: 'Fintechs', icon: <Cpu size={20} />, num: '04'},
                  {name: 'NBFC', icon: <CreditCard size={20} />, num: '05'},
                  {name: 'SMEs', icon: <Briefcase size={20} />, num: '06'},
                  {name: 'MSMEs', icon: <TrendingUp size={20} />, num: '07'},
                  {name: 'Hospitals', icon: <Activity size={20} />, num: '08'},
                  {name: 'CA Firms', icon: <Calculator size={20} />, num: '09'},
                  {name: 'Real Estate & Developers', icon: <Home size={20} />, num: '10'},
                  {name: 'And Other Sectors...', icon: <Plus size={20} />, num: '11'}
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
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
