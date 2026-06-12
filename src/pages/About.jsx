import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  Trophy, ShieldCheck, Mail, Users, ArrowRight, 
  Target, Eye, Award, Briefcase, GraduationCap, Building2, MapPin
} from 'lucide-react';
import './About.css';

const WHY_CHOOSE_ITEMS = [
  {
    title: 'Professional Tournament Experience',
    desc: 'Meticulously organized events with high standards of execution and match-day operations.'
  },
  {
    title: 'Structured & Disciplined Environment',
    desc: 'A well-managed ecosystem that promotes fair play, professionalism, and competitive excellence.'
  },
  {
    title: 'Premium Cricket Venues',
    desc: 'Access to top-quality cricket grounds that enhance the playing experience.'
  },
  {
    title: 'Exclusive Leadership Networking Events',
    desc: 'Pre-tournament gatherings for captains and team leaders to connect and engage.'
  },
  {
    title: 'Premium Player Kit & Merchandise',
    desc: 'High-quality apparel, gear, and tournament memorabilia for every participant.'
  },
  {
    title: 'HD Match Coverage & Broadcasting',
    desc: 'Professionally produced live streaming and match highlights.'
  },
  {
    title: 'Meaningful Recognition & Rewards',
    desc: 'Multiple awards and incentives that celebrate individual and team performances.'
  },
  {
    title: 'Diverse Playing Experiences',
    desc: 'Opportunities to compete across a variety of quality venues and conditions.'
  },
  {
    title: 'High-Calibre Competition',
    desc: 'Face well-matched, competitive teams that elevate the standard of play.'
  },
  {
    title: 'Built by Cricketers, for Cricketers',
    desc: 'Our founders actively play the game, bringing a player\'s perspective to every aspect of the tournament experience.'
  }
];

const TOURNAMENT_LOGOS = [
  { name: 'BAPL League', img: '/logos/bapllogo.jpg' },
  { name: 'BAPL T20 South', img: '/logos/baplt20south.jpg' },
  { name: 'BAPL T20 North', img: '/logos/baplt20north.jpg' },
  { name: 'BAPL XPRESS South', img: '/logos/baplxpresst20south.jpg' },
  { name: 'BAPL XPRESS North', img: '/logos/baplxpresst20north.jpg' },
  { name: 'BAPL Corporate Cup', img: '/logos/baplcorporate.jpg' },
  { name: 'Monsoon Championship', img: '/logos/trivabmonsoon.jpg' },
  { name: 'BAPL DADS T20', img: '/logos/bapldadst20.jpg' }
];

export default function About() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'trivab';

  const handleTabChange = (tab) => {
    setSearchParams({ tab });
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

  return (
    <div className="about-page container section-padding page-enter">
      {/* Header */}
      <div className="section-header">
        <span className="section-label">Our Story</span>
        <h1 className="section-title">About <span className="text-gradient-gold">TRIVAB</span></h1>
        <p className="section-subtitle">Fostering professional standards in leather-ball cricket</p>
      </div>

      {/* Tabs Navigation */}
      <div className="about-tabs-container mb-xl">
        {['trivab', 'leadership', 'bharat-army', 'careers'].map((tab) => {
          const labels = {
            'trivab': 'TRIVAB Sports & Events',
            'leadership': 'Leadership Team',
            'bharat-army': 'Bharat Armyy Cricket Club',
            'careers': 'Careers'
          };
          return (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`about-tab-btn ${activeTab === tab ? 'active' : ''}`}
            >
              {labels[tab]}
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div className="about-tab-content">
        
        {/* 1) TRIVAB SPORTS & EVENTS */}
        {activeTab === 'trivab' && (
          <div className="animate-fade-in-up">
            <div className="grid grid-2 gap-xl items-start mb-2xl">
              <div>
                <h2 className="display-xs text-gradient-gold mb-md">Our Story &amp; Purpose</h2>
                <p className="text-secondary mb-md" style={{ lineHeight: 1.8 }}>
                  TRIVAB Sports &amp; Events was founded with a singular mission—to provide amateur cricketers with a professional platform to experience the true spirit of leather-ball cricket. We recognized that many passionate players had moved away from the game due to professional and personal commitments, with limited opportunities to return to competitive cricket.
                </p>
                <p className="text-secondary mb-md" style={{ lineHeight: 1.8 }}>
                  Through professionally managed tournaments, quality venues, certified officials, and a highly competitive environment, TRIVAB Sports &amp; Events brings serious amateur cricketers back to the game they love. Our events are designed to recreate the excitement, intensity, and prestige of competitive cricket while fostering a strong and thriving cricketing community. We don't just organize tournaments—we create unforgettable leather-ball cricket experiences.
                </p>
                <p className="font-bold text-gold mt-lg" style={{ fontSize: '1.1rem' }}>
                  TRIVAB Sports &amp; Events — Your Game, Our Stage. 🏏
                </p>
              </div>

              <div className="flex flex-col gap-lg">
                {/* Vision Card */}
                <div className="card card-gold">
                  <h3 className="text-md font-bold mb-sm text-gradient-gold flex items-center gap-xs">
                    <Eye size={20} /> Our Vision
                  </h3>
                  <strong className="text-sm text-primary block mb-xs">The Sports-Tech Vision &amp; Ecosystem</strong>
                  <p className="text-xs text-secondary" style={{ lineHeight: 1.6 }}>
                    At TRIVAB, we are building a connected cricket ecosystem powered by technology, transparency, and professionalism. Every player is required to register on the TRIVAB Cricket Management Platform and receive a unique digital profile with QR-verified identification.
                  </p>
                  <p className="text-xs text-secondary mt-xs" style={{ lineHeight: 1.6 }}>
                    This ensures seamless participation, verified player records, performance tracking, and eligibility across all TRIVAB tournaments and events. As our ecosystem grows, only registered players will be eligible to compete within the TRIVAB network.
                  </p>
                  <span className="text-xs text-gold font-bold block mt-sm">One Player. One Profile. One Ecosystem.</span>
                </div>

                {/* Mission Card */}
                <div className="card">
                  <h3 className="text-md font-bold mb-sm text-gradient-gold flex items-center gap-xs">
                    <Target size={20} /> Our Mission
                  </h3>
                  <p className="text-xs text-secondary" style={{ lineHeight: 1.6 }}>
                    To redefine the amateur cricket experience by creating a world-class ecosystem that combines innovative tournament formats, cutting-edge technology, and premium playing facilities. We are committed to delivering professionally managed, highly engaging cricket experiences that inspire competition, foster community, and elevate the standard of the game for players at every level.
                  </p>
                </div>
              </div>
            </div>

            {/* Why Choose TRIVAB Section */}
            <div className="mb-2xl">
              <h2 className="display-xs text-gradient-gold mb-sm text-center">Why Choose TRIVAB Sports &amp; Events?</h2>
              <p className="text-secondary text-sm mb-xl text-center max-width-600" style={{ margin: '0 auto var(--space-lg)' }}>
                At TRIVAB, we are committed to delivering a world-class amateur cricket experience that mirrors the professionalism of elite-level tournaments.
              </p>
              
              <div className="grid grid-2 gap-md">
                {WHY_CHOOSE_ITEMS.map((item, idx) => (
                  <div key={idx} className="why-choose-item p-sm card flex gap-sm items-start" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-card)' }}>
                    <div className="text-gold" style={{ marginTop: '2px' }}><ShieldCheck size={18} /></div>
                    <div style={{ textAlign: 'left' }}>
                      <h4 className="text-sm font-bold text-primary">{item.title}</h4>
                      <p className="text-xs text-muted mt-xxs" style={{ lineHeight: 1.5 }}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* TRIVAB SPORTS IPs Section */}
            <div className="about-ips-section">
              <h2 className="display-xs text-gradient-gold mb-sm text-center">TRIVAB SPORTS IPs</h2>
              <p className="text-secondary text-sm mb-xl text-center max-width-600" style={{ margin: '0 auto var(--space-xl)' }}>
                We proudly host and manage a series of elite league brands and cricket tournaments under the TRIVAB banner.
              </p>

              <div className="grid grid-4 gap-lg">
                {TOURNAMENT_LOGOS.map((logo, idx) => (
                  <div key={idx} className="logo-badge-card">
                    <img src={logo.img} alt={logo.name} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 2) LEADERSHIP TEAM */}
        {activeTab === 'leadership' && (
          <div className="animate-fade-in-up">
            <div className="text-center max-width-800 mb-2xl" style={{ margin: '0 auto var(--space-2xl)' }}>
              <h2 className="display-xs text-gradient-gold mb-md">Our Leadership Team</h2>
              <p className="text-secondary mb-md" style={{ lineHeight: 1.8 }}>
                TRIVAB was founded by cricketers who understand the game from the inside out. Built at the intersection of passion and professionalism, our team brings together expertise in cricket, event management, technology, and operations to deliver a truly world-class playing experience.
              </p>
              <p className="text-secondary mb-md" style={{ lineHeight: 1.8 }}>
                The purpose of TRIVAB is to bridge the gap created by demanding professional and family lives, and to bring people back to the field—to relive the joy, competitiveness, and spirit of the sport they once pursued with ambition. We exist to reignite that childlike passion for cricket in every player who steps onto the ground.
              </p>
              <p className="text-secondary" style={{ lineHeight: 1.8 }}>
                Through every tournament, we are committed to delivering a global-standard cricketing experience—bringing elite-level organization, professional presentation, and a stadium-like atmosphere to every TRIVAB registered member.
              </p>
            </div>

            <div className="divider" style={{ margin: 'var(--space-2xl) 0' }} />

            {/* Founders Meet Section */}
            <div className="mb-2xl">
              <div className="text-center mb-xl">
                <span className="text-xs text-gold font-bold uppercase tracking-wider block mb-xxs">Meet the Founders</span>
                <h3 className="display-xs text-gradient-gold">The Story Behind TRIVAB</h3>
                <p className="text-secondary text-sm max-width-600 mt-xs" style={{ margin: '8px auto 0' }}>
                  The name TRIVAB represents the coming together of three passionate cricket enthusiasts and entrepreneurs. <strong>Viral, Ankit, and Bhavesh</strong>.
                </p>
              </div>

              {/* Founders Cards */}
              <div className="founders-cards-stack">
                
                {/* ANKIT SHAH */}
                <div className="founder-card-layout">
                  <div className="founder-card-photo-col">
                    <div className="founder-card-photo-box">
                      <Users size={64} className="founder-silhouette" />
                    </div>
                    <div className="founder-card-title-box">
                      <h4 className="text-md font-bold text-gradient-gold">Ankit Shah</h4>
                      <p className="text-xs text-muted flex items-center justify-center gap-xxs">
                        <GraduationCap size={14} className="text-gold" /> University of Mumbai
                      </p>
                    </div>
                  </div>
                  <div className="founder-card-bio-col">
                    <h5 className="text-sm font-bold text-gold uppercase tracking-wider mb-xs">Chemical Engineering Postgraduate &amp; Entrepreneur</h5>
                    <p className="text-xs text-secondary" style={{ lineHeight: 1.7 }}>
                      A Chemical Engineering postgraduate from the University of Mumbai and a successful entrepreneur in the pharmaceutical, industrial, and cosmetic raw materials sector, Ankit brings over two decades of competitive leather-ball cricket experience. Having trained under renowned coaches and competed in Mumbai's cricket circuit, he combines his passion for the game with extensive expertise in organizing and executing large-scale cricket tournaments and sporting events.
                    </p>
                  </div>
                </div>

                {/* VIRAL SHAH */}
                <div className="founder-card-layout">
                  <div className="founder-card-photo-col">
                    <div className="founder-card-photo-box">
                      <Users size={64} className="founder-silhouette" />
                    </div>
                    <div className="founder-card-title-box">
                      <h4 className="text-md font-bold text-gradient-gold">Viral Shah</h4>
                      <p className="text-xs text-muted flex items-center justify-center gap-xxs">
                        <GraduationCap size={14} className="text-gold" /> MBA in Finance
                      </p>
                    </div>
                  </div>
                  <div className="founder-card-bio-col">
                    <h5 className="text-sm font-bold text-gold uppercase tracking-wider mb-xs">Former Maharashtra Ranji Trophy Cricketer</h5>
                    <p className="text-xs text-secondary" style={{ lineHeight: 1.7 }}>
                      An MBA in Finance and a former Maharashtra Ranji Trophy cricketer, Viral has represented Maharashtra at various levels, including U-19, U-23, West Zone, Vizzy Trophy, and the Maharashtra Premier League. With deep cricketing expertise and tournament management experience, he also mentors young aspiring cricketers through the TRIVAB Sports Academy, helping nurture the next generation of talent.
                    </p>
                  </div>
                </div>

                {/* BHAVESH SHAH */}
                <div className="founder-card-layout">
                  <div className="founder-card-photo-col">
                    <div className="founder-card-photo-box">
                      <Users size={64} className="founder-silhouette" />
                    </div>
                    <div className="founder-card-title-box">
                      <h4 className="text-md font-bold text-gradient-gold">Bhavesh Shah</h4>
                      <p className="text-xs text-muted flex items-center justify-center gap-xxs">
                        <GraduationCap size={14} className="text-gold" /> MBA in Finance
                      </p>
                    </div>
                  </div>
                  <div className="founder-card-bio-col">
                    <h5 className="text-sm font-bold text-gold uppercase tracking-wider mb-xs">Kanga League Player &amp; Chemical Sector Entrepreneur</h5>
                    <p className="text-xs text-secondary" style={{ lineHeight: 1.7 }}>
                      An MBA in Finance and a lifelong cricket enthusiast, Bhavesh has actively participated in Mumbai's competitive cricket circuit, including the prestigious Kanga League. As an entrepreneur in the biofuel and industrial chemicals sector, he brings strong business acumen and financial leadership to TRIVAB, ensuring a sustainable and growth-oriented foundation for the organization.
                    </p>
                  </div>
                </div>

              </div>

              <p className="text-center text-sm text-secondary italic mt-xl">
                Together, the founders combine their expertise in cricket, business, technology, and event management to deliver a truly world-class experience for amateur cricketers.
              </p>
            </div>
          </div>
        )}

        {/* 3) BHARAT ARMYY CRICKET CLUB */}
        {activeTab === 'bharat-army' && (
          <div className="animate-fade-in-up">
            <div className="grid grid-2 gap-xl items-center mb-2xl">
              <div>
                <h2 className="display-xs text-gradient-gold mb-md">Bharat Armyy Cricket Club</h2>
                <p className="text-secondary mb-md" style={{ lineHeight: 1.8 }}>
                  Bharat Armyy Cricket Club is the official cricket playing arm of the legendary Bharat Army, the global supporters' group for Indian cricket. Established to bring the spirit of the stands onto the pitch, the club provides cricket enthusiasts with the opportunity to represent the club in competitive leather-ball leagues and international tours.
                </p>
                <p className="text-secondary mb-lg" style={{ lineHeight: 1.8 }}>
                  Driven by the same passion, energy, and dedication that defines Indian cricket fans worldwide, Bharat Armyy Cricket Club is a community built on camaraderie, sporting spirit, and a love for the game.
                </p>
                <Link to="/contact" className="btn btn-gold">
                  Inquire For Membership <ArrowRight size={16} />
                </Link>
              </div>

              <div className="card card-gold">
                <h3 className="text-md font-bold mb-md text-gradient-gold">Club Pillars</h3>
                <ul className="flex flex-col gap-md">
                  <li className="flex gap-sm items-start">
                    <div className="text-gold" style={{ marginTop: '2px' }}><Award size={18} /></div>
                    <div>
                      <strong className="text-sm text-primary">Global Supporters Network</strong>
                      <p className="text-xs text-secondary">Connect with players and fans across continents who share the same heartbeat for Indian cricket.</p>
                    </div>
                  </li>
                  <li className="flex gap-sm items-start">
                    <div className="text-gold" style={{ marginTop: '2px' }}><Trophy size={18} /></div>
                    <div>
                      <strong className="text-sm text-primary">International Match Fixtures</strong>
                      <p className="text-xs text-secondary">Opportunities to play in bilateral tournaments, exchange tours, and league matches worldwide.</p>
                    </div>
                  </li>
                  <li className="flex gap-sm items-start">
                    <div className="text-gold" style={{ marginTop: '2px' }}><Users size={18} /></div>
                    <div>
                      <strong className="text-sm text-primary">Fan-to-Player Ecosystem</strong>
                      <p className="text-xs text-secondary">Take your support to the next level by wearing the colors and competing on the leather-ball pitch.</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* 4) CAREERS */}
        {activeTab === 'careers' && (
          <div className="animate-fade-in-up">
            <div className="text-center max-width-600 mb-2xl" style={{ margin: '0 auto var(--space-2xl)' }}>
              <h2 className="display-xs text-gradient-gold mb-md">Careers at TRIVAB</h2>
              <p className="text-secondary" style={{ lineHeight: 1.8 }}>
                Join us in shaping the future of amateur cricket. We are always looking for passionate, driven individuals who love the game and want to make a difference in sports management, tech, event coordination, and operations.
              </p>
            </div>

            <div className="grid grid-2 gap-lg mb-2xl">
              {/* Job 1 */}
              <div className="card card-gold flex flex-col justify-between">
                <div>
                  <span className="badge badge-gold mb-xxs" style={{ fontSize: '0.65rem' }}>Full-Time / Kandivali, Mumbai</span>
                  <h4 className="text-md font-bold text-primary mt-xxs">Tournament Operations &amp; Coordinator</h4>
                  <p className="text-xs text-secondary mt-sm" style={{ lineHeight: 1.6 }}>
                    Manage match-day scheduling, coordinate ground officials, inspect pitch conditions, and ensure high execution standards across all venues for TRIVAB tournaments.
                  </p>
                </div>
                <div className="mt-md">
                  <a href="mailto:trivabsportsandevents@gmail.com?subject=Application for Tournament Operations Role" className="btn btn-outline btn-sm w-full text-center">
                    Apply Now
                  </a>
                </div>
              </div>

              {/* Job 2 */}
              <div className="card card-gold flex flex-col justify-between">
                <div>
                  <span className="badge badge-gold mb-xxs" style={{ fontSize: '0.65rem' }}>Full-Time / Remote Option</span>
                  <h4 className="text-md font-bold text-primary mt-xxs">React Frontend Developer (Sports-Tech)</h4>
                  <p className="text-xs text-secondary mt-sm" style={{ lineHeight: 1.6 }}>
                    Maintain and implement new features on the TRIVAB Cricket Management platform, player digital ID cards, scanner integrations, and captain dashboards.
                  </p>
                </div>
                <div className="mt-md">
                  <a href="mailto:trivabsportsandevents@gmail.com?subject=Application for Frontend Developer Role" className="btn btn-outline btn-sm w-full text-center">
                    Apply Now
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
