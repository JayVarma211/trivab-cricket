import { useEffect, useRef } from 'react';
import { ExternalLink, Star, Award, Handshake } from 'lucide-react';
import SEO from '../components/common/SEO';
import './Sponsors.css';

const BAPL_SPONSORS = [
  {
    id: 'origin',
    name: 'Origin',
    tier: 'Title Sponsor',
    tagline: 'Title Sponsor',
    logo: '/sponsors/Origin.png',
    website: 'https://www.origincorp.in/',
    description: 'The cornerstone of BAPL, Origin brings unparalleled commitment and energy to the forefront of cricket excellence in Mumbai.',
  },
  {
    id: 'shrreeji-sharan',
    name: 'Shrreeji Sharan',
    tier: 'Associate Sponsor',
    tagline: 'Associate Sponsor',
    logo: '/sponsors/Shrreeji sharan.png',
    website: 'https://www.shrreejisharan.com',
    description: "Proud associate partner of BAPL, standing alongside the league's vision to elevate the standard of amateur cricket.",
  },
  {
    id: 'apsara',
    name: 'Apsara Graphics LLP',
    tier: 'Printing Partner',
    tagline: 'Printing Partner',
    logo: '/sponsors/Apsara.jpg',
    website: null,
    description: 'Delivering world-class print quality for BAPL — from jerseys to hoardings, Apsara Graphics makes every detail count.',
  },
  {
    id: 'aum',
    name: 'AUM Advertising & Media Pvt. Ltd.',
    tier: 'Advertising Partner',
    tagline: 'Advertising Partner',
    logo: '/sponsors/Aum.jpg',
    website: null,
    description: 'Amplifying the BAPL brand across every platform with creative, impactful advertising strategies that reach millions.',
  },
  {
    id: 'bliez',
    name: 'Bliez',
    tier: 'Broadcasting Partner',
    tagline: 'Broadcasting Partner',
    logo: '/sponsors/Bliez.PNG',
    website: null,
    description: 'Bringing every boundary, wicket, and winning moment to fans across the globe with live, professional-grade broadcasting.',
  },
  {
    id: 'rio',
    name: 'RIO',
    tier: 'Gifting Partner',
    tagline: 'Gifting Partner',
    logo: '/sponsors/Rio.jpg',
    website: null,
    description: 'Celebrating champions with premium gifting solutions — because every match winner deserves to be honoured in style.',
  },
  {
    id: 'hifi-digital',
    name: 'HIFI Digital',
    tier: 'Digital Partner',
    tagline: 'Digital Partner',
    logo: '/sponsors/HIFI Digital.jpg',
    website: null,
    description: 'Powering the digital presence of BAPL with cutting-edge technology, social media management, and online engagement.',
  },
  {
    id: 'gllyphn',
    name: 'Gllyphn',
    tier: 'Pain Relief Partner',
    tagline: 'Pain Relief Partner',
    logo: '/sponsors/Gllphyn.PNG',
    website: null,
    description: 'Keeping athletes at peak performance — Gllyphn is the trusted pain relief and recovery partner of the BAPL league.',
  },
];

const TIER_CONFIG = {
  'Title Sponsor': {
    icon: <Award size={20} />,
    gradient: 'linear-gradient(135deg, #800000 0%, #9D1C1C 60%, #4A0202 100%)',
    badge: '#FFD700',
    badgeText: '#000',
    glow: '0 0 40px rgba(128,0,0,0.45), 0 0 80px rgba(212,175,55,0.15)',
    border: '2px solid rgba(212,175,55,0.5)',
  },
  'Associate Sponsor': {
    icon: <Star size={20} />,
    gradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    badge: '#C0C0C0',
    badgeText: '#000',
    glow: '0 0 32px rgba(128,0,0,0.2)',
    border: '1px solid rgba(192,192,192,0.3)',
  },
  default: {
    icon: <Handshake size={20} />,
    gradient: 'linear-gradient(135deg, #1F1111 0%, #160B0B 100%)',
    badge: '#9D1C1C',
    badgeText: '#fff',
    glow: '0 0 20px rgba(128,0,0,0.12)',
    border: '1px solid rgba(128,0,0,0.2)',
  },
};

function getTierConfig(tier) {
  return TIER_CONFIG[tier] || TIER_CONFIG.default;
}

function SponsorCard({ sponsor, index, size = 'normal' }) {
  const cardRef = useRef(null);
  const cfg = getTierConfig(sponsor.tier);
  const isTitle = sponsor.tier === 'Title Sponsor';
  const isAssociate = sponsor.tier === 'Associate Sponsor';

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          card.classList.add('sponsor-card-visible');
          observer.unobserve(card);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(card);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={cardRef}
      className={`bapl-sponsor-card bapl-sponsor-card--${size}`}
      style={{
        '--card-delay': `${index * 0.08}s`,
        border: cfg.border,
        boxShadow: cfg.glow,
      }}
    >
      {/* Tier badge ribbon */}
      <div
        className="bapl-tier-ribbon"
        style={{ background: cfg.badge, color: cfg.badgeText }}
      >
        {cfg.icon}
        <span>{sponsor.tagline}</span>
      </div>

      {/* Logo section */}
      <div className={`bapl-logo-wrap ${isTitle ? 'bapl-logo-wrap--title' : isAssociate ? 'bapl-logo-wrap--associate' : ''}`}>
        <img
          src={sponsor.logo}
          alt={`${sponsor.name} logo`}
          className="bapl-sponsor-logo"
          loading="lazy"
        />
      </div>

      {/* Info section */}
      <div className="bapl-sponsor-info">
        <h3 className="bapl-sponsor-name">{sponsor.name}</h3>
        <p className="bapl-sponsor-desc">{sponsor.description}</p>

        {sponsor.website && (
          <a
            href={sponsor.website}
            target="_blank"
            rel="noopener noreferrer"
            className="bapl-visit-btn"
          >
            <span>Visit Website</span>
            <ExternalLink size={14} />
          </a>
        )}
      </div>
    </div>
  );
}

export default function Sponsors() {
  const titleSponsor = BAPL_SPONSORS.filter((s) => s.tier === 'Title Sponsor');
  const associateSponsor = BAPL_SPONSORS.filter((s) => s.tier === 'Associate Sponsor');
  const partnerSponsors = BAPL_SPONSORS.filter(
    (s) => s.tier !== 'Title Sponsor' && s.tier !== 'Associate Sponsor'
  );

  return (
    <>
      <SEO
        title="Sponsors – BAPL | TRIVAB Sports"
        description="Meet the proud partners and sponsors powering BAPL — Mumbai's premier amateur cricket league by TRIVAB Sports & Events."
      />

      <div className="bapl-sponsors-page">

        {/* ── Hero header ── */}
        <section className="bapl-sponsors-hero">
          <div className="bapl-sponsors-hero-bg" aria-hidden="true" />
          <div className="bapl-sponsors-hero-content container">
            <span className="bapl-sponsors-hero-label">BAPL Partnerships</span>
            <h1 className="bapl-sponsors-hero-title">
              Introducing the{' '}
              <span className="text-gradient-gold">Sponsors</span>{' '}
              for&nbsp;BAPL
            </h1>
            <p className="bapl-sponsors-hero-sub">
              These elite organizations stand behind every boundary, every wicket,
              and every champion moment — powering Mumbai's most celebrated
              amateur cricket league.
            </p>

            {/* Floating logos strip */}
            <div className="bapl-logo-strip">
              {BAPL_SPONSORS.map((s) => (
                <div key={s.id} className="bapl-logo-strip-item" title={s.name}>
                  <img src={s.logo} alt={s.name} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Title Sponsor ── */}
        <section className="bapl-tier-section container">
          <div className="bapl-tier-header">
            <div className="bapl-tier-header-icon" style={{ background: 'linear-gradient(135deg,#800000,#9D1C1C)' }}>
              <Award size={22} />
            </div>
            <div>
              <h2 className="bapl-tier-title text-gradient-gold">Title Sponsor</h2>
              <p className="bapl-tier-sub">The cornerstone partner driving BAPL forward</p>
            </div>
          </div>

          <div className="bapl-title-grid">
            {titleSponsor.map((s, i) => (
              <SponsorCard key={s.id} sponsor={s} index={i} size="title" />
            ))}
          </div>
        </section>

        {/* ── Associate Sponsor ── */}
        <section className="bapl-tier-section container">
          <div className="bapl-tier-header">
            <div className="bapl-tier-header-icon" style={{ background: 'linear-gradient(135deg,#555,#888)' }}>
              <Star size={22} />
            </div>
            <div>
              <h2 className="bapl-tier-title text-gradient-gold">Associate Sponsor</h2>
              <p className="bapl-tier-sub">Standing alongside the league's vision</p>
            </div>
          </div>

          <div className="bapl-associate-grid">
            {associateSponsor.map((s, i) => (
              <SponsorCard key={s.id} sponsor={s} index={i} size="associate" />
            ))}
          </div>
        </section>

        {/* ── Official Partners ── */}
        <section className="bapl-tier-section container">
          <div className="bapl-tier-header">
            <div className="bapl-tier-header-icon" style={{ background: 'linear-gradient(135deg,#800000,#4A0202)' }}>
              <Handshake size={22} />
            </div>
            <div>
              <h2 className="bapl-tier-title text-gradient-gold">Official Partners</h2>
              <p className="bapl-tier-sub">Specialist partners across every dimension of the league</p>
            </div>
          </div>

          <div className="bapl-partners-grid">
            {partnerSponsors.map((s, i) => (
              <SponsorCard key={s.id} sponsor={s} index={i} size="partner" />
            ))}
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="bapl-sponsors-cta container">
          <div className="bapl-cta-card">
            <h2 className="bapl-cta-title">Become a <span className="text-gradient-gold">BAPL Partner</span></h2>
            <p className="bapl-cta-desc">
              Join the fastest growing cricket league in Mumbai. Partner with BAPL
              and put your brand in front of thousands of passionate cricket fans.
            </p>
            <a href="/contact" className="btn btn-gold">
              Get in Touch
            </a>
          </div>
        </section>

      </div>
    </>
  );
}
