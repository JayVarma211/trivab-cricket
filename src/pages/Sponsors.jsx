import { useEffect, useRef } from 'react';
import { ExternalLink, Award, Star, Handshake } from 'lucide-react';
import SEO from '../components/common/SEO';
import './Sponsors.css';

const BAPL_SPONSORS = [
  {
    id: 'origin',
    name: 'Origin',
    tier: 'Title Sponsor',
    logo: '/sponsors/Origin.png',
    website: 'https://www.origincorp.in/',
    description: 'The cornerstone of BAPL — Origin powers the league with unparalleled commitment, bringing energy and excellence to Mumbai cricket.',
    badgeColor: '#FFD700',
    badgeTextColor: '#1a0000',
    icon: <Award size={16} />,
  },
  {
    id: 'shrreeji-sharan',
    name: 'Shrreeji Sharan',
    tier: 'Associate Sponsor',
    logo: '/sponsors/Shrreeji sharan.png',
    website: 'https://www.shrreejisharan.com',
    description: "Proud associate partner standing alongside BAPL's vision — elevating the standard of amateur cricket across Mumbai.",
    badgeColor: '#C0C0C0',
    badgeTextColor: '#1a0000',
    icon: <Star size={16} />,
  },
  {
    id: 'apsara',
    name: 'Apsara Graphics LLP',
    tier: 'Printing Partner',
    logo: '/sponsors/Apsara.jpg',
    website: null,
    description: 'World-class print quality for BAPL — from jerseys to hoardings, every detail is crafted to perfection.',
    badgeColor: '#9D1C1C',
    badgeTextColor: '#fff',
    icon: <Handshake size={16} />,
  },
  {
    id: 'aum',
    name: 'AUM Advertising & Media Pvt. Ltd.',
    tier: 'Advertising Partner',
    logo: '/sponsors/Aum.jpg',
    website: null,
    description: 'Amplifying the BAPL brand across every platform with creative, impactful advertising strategies that reach millions.',
    badgeColor: '#9D1C1C',
    badgeTextColor: '#fff',
    icon: <Handshake size={16} />,
  },
  {
    id: 'bliez',
    name: 'Bliez',
    tier: 'Broadcasting Partner',
    logo: '/sponsors/Bliez.PNG',
    website: null,
    description: 'Bringing every boundary, wicket, and winning moment to fans across the globe with live, professional-grade broadcasting.',
    badgeColor: '#9D1C1C',
    badgeTextColor: '#fff',
    icon: <Handshake size={16} />,
  },
  {
    id: 'rio',
    name: 'RIO',
    tier: 'Gifting Partner',
    logo: '/sponsors/Rio.jpg',
    website: null,
    description: 'Celebrating champions with premium gifting solutions — because every match winner deserves to be honoured in style.',
    badgeColor: '#9D1C1C',
    badgeTextColor: '#fff',
    icon: <Handshake size={16} />,
  },
  {
    id: 'hifi-digital',
    name: 'HIFI Digital',
    tier: 'Digital Partner',
    logo: '/sponsors/HIFI Digital.jpg',
    website: null,
    description: 'Powering the digital presence of BAPL with cutting-edge technology, social media management, and online engagement.',
    badgeColor: '#9D1C1C',
    badgeTextColor: '#fff',
    icon: <Handshake size={16} />,
  },
  {
    id: 'gllyphn',
    name: 'Gllyphn',
    tier: 'Pain Relief Partner',
    logo: '/sponsors/Gllphyn.PNG',
    website: null,
    description: "Keeping athletes at peak performance — Gllyphn is BAPL's trusted pain relief and recovery partner for every player.",
    badgeColor: '#9D1C1C',
    badgeTextColor: '#fff',
    icon: <Handshake size={16} />,
  },
];

function SponsorCard({ sponsor, index, flip = false }) {
  const cardRef = useRef(null);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          card.classList.add('sp-card-visible');
          observer.unobserve(card);
        }
      },
      { threshold: 0.08 }
    );
    observer.observe(card);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={cardRef}
      className={`sp-card ${flip ? 'sp-card--flip' : ''}`}
      style={{ '--delay': `${index * 0.07}s` }}
    >
      {/* ── BIG LOGO PANEL ── */}
      <div className="sp-card-logo-panel">
        <img
          src={sponsor.logo}
          alt={`${sponsor.name} logo`}
          className="sp-card-logo-img"
          loading="lazy"
        />
      </div>

      {/* ── INFO PANEL ── */}
      <div className="sp-card-info-panel">
        {/* Badge */}
        <span
          className="sp-badge"
          style={{ background: sponsor.badgeColor, color: sponsor.badgeTextColor }}
        >
          {sponsor.icon}
          {sponsor.tier}
        </span>

        {/* Name */}
        <h3 className="sp-name">{sponsor.name}</h3>

        {/* Divider */}
        <div className="sp-divider" />

        {/* Description */}
        <p className="sp-desc">{sponsor.description}</p>

        {/* Website */}
        {sponsor.website && (
          <a
            href={sponsor.website}
            target="_blank"
            rel="noopener noreferrer"
            className="sp-website-btn"
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
  return (
    <>
      <SEO
        title="Sponsors – BAPL | TRIVAB Sports"
        description="Meet the proud partners and sponsors powering BAPL — Mumbai's premier amateur cricket league by TRIVAB Sports & Events."
      />

      <div className="sp-page">

        {/* ── HERO ── */}
        <section className="sp-hero">
          <div className="sp-hero-glow" aria-hidden="true" />
          <div className="container sp-hero-inner">
            <span className="sp-hero-label">BAPL Partnerships</span>
            <h1 className="sp-hero-title">
              Introducing the{' '}
              <span className="text-gradient-gold">Sponsors</span>{' '}
              for&nbsp;BAPL
            </h1>
            <p className="sp-hero-sub">
              These elite organizations stand behind every boundary, every wicket,
              and every champion moment — powering Mumbai's most celebrated
              amateur cricket league.
            </p>
          </div>
        </section>

        {/* ── ALL SPONSORS — full-width horizontal cards ── */}
        <section className="sp-list container">
          {BAPL_SPONSORS.map((sponsor, i) => (
            <SponsorCard
              key={sponsor.id}
              sponsor={sponsor}
              index={i}
              flip={i % 2 !== 0}
            />
          ))}
        </section>

        {/* ── CTA ── */}
        <section className="sp-cta container">
          <div className="sp-cta-inner">
            <h2 className="sp-cta-title">
              Become a <span className="text-gradient-gold">BAPL Partner</span>
            </h2>
            <p className="sp-cta-desc">
              Join the fastest growing cricket league in Mumbai. Put your brand
              in front of thousands of passionate cricket fans.
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
