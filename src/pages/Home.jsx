import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getCollection, limit } from '../firebase/firestore';
import { Trophy, Calendar, ShieldCheck, Sparkles, ArrowRight, Star, Zap, CheckCircle, Target, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SEO from '../components/common/SEO';
import './Home.css';

const HERO_SLIDES = [
  { src: '/images/background1.jpg', alt: 'TRIVAB Sports cricket tournament action' },
  { src: '/images/background2.jpg', alt: 'TRIVAB Sports professional match day' },
  { src: '/images/background3.jpg', alt: 'TRIVAB Sports event atmosphere' },
];

const ACTION_PHOTOS = [
  { src: '/images/trivab-action1.jpg', alt: 'TRIVAB cricket match in action', caption: 'Live Match Action' },
  { src: '/images/trivab-action2.jpg', alt: 'TRIVAB tournament moments', caption: 'Tournament Moments' },
  { src: '/images/trivab-action3.jpg', alt: 'TRIVAB sports event highlights', caption: 'Event Highlights' },
];

const TICKER_LOGOS = [
  { src: '/logos/baplt20north.png', alt: 'BAPL T20 North', imgClass: 'ticker-logo-silver', dark: false, link: '/tournaments/bapl-north' },
  { src: '/logos/baplxpresst20south.png', alt: 'BAPL Xpress South', imgClass: 'ticker-logo-silver', dark: false, link: '/tournaments/baplxpress-south' },
  { src: '/logos/baplcorporate.png', alt: 'BAPL Corporate Cup', imgClass: 'ticker-logo-silver', dark: false, link: '/tournaments/baplcorporate-south' },
  { src: '/logos/baplt20south.png', alt: 'BAPL T20 South', imgClass: 'ticker-logo-silver', dark: false, link: '/tournaments/bapl-south' },
  { src: '/logos/baplxpresst20north.png', alt: 'BAPL Xpress North', imgClass: 'ticker-logo-silver', dark: false, link: '/tournaments/baplxpress-north' },
  { src: '/logos/bapldadst20.png', alt: 'BAPL Dads T20', imgClass: 'ticker-logo-silver', dark: false, link: '/tournaments/bapldads-south' },
  { src: '/logos/baplpune.png', alt: 'BAPL T20 Pune', imgClass: 'ticker-logo-silver', dark: false, link: '/tournaments' },
  { src: '/logos/trivabmonsoon.jpg', alt: 'Trivab Monsoon', imgClass: 'ticker-logo-white', dark: false, link: '/tournaments/trivab-monsoon' },
  { src: '/logos/baplxpresst20puneedition.png', alt: 'BAPL Xpress Pune', imgClass: 'ticker-logo-silver', dark: false, link: '/tournaments' },
  { src: '/logos/baplcorporatepuneedition.png', alt: 'BAPL Corporate Pune', imgClass: 'ticker-logo-silver', dark: false, link: '/tournaments' },
  { src: '/logos/bapldadst20puneedition.png', alt: 'BAPL Dads Pune', imgClass: 'ticker-logo-silver', dark: false, link: '/tournaments' }
];

export default function Home() {
  const [recentTournaments, setRecentTournaments] = useState([]);
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [heroSlide, setHeroSlide] = useState(0);
  const [activePhoto, setActivePhoto] = useState(null);
  const slideTimerRef = useRef(null);

  // Auto-advance hero slideshow
  useEffect(() => {
    slideTimerRef.current = setInterval(() => {
      setHeroSlide(prev => (prev + 1) % HERO_SLIDES.length);
    }, 5000);
    return () => clearInterval(slideTimerRef.current);
  }, []);

  const goSlide = (dir) => {
    clearInterval(slideTimerRef.current);
    setHeroSlide(prev => (prev + dir + HERO_SLIDES.length) % HERO_SLIDES.length);
    slideTimerRef.current = setInterval(() => {
      setHeroSlide(prev => (prev + 1) % HERO_SLIDES.length);
    }, 5000);
  };

  // Parallax scroll for hero image (background only, no text fade)
  const heroImgY = 0; // disabled parallax fade

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const tourn = await getCollection('tournaments');
        const activeTourns = tourn || [];
        setRecentTournaments(diversifyTournaments(activeTourns).slice(0, 3));
        const matches = await getCollection('matches', [limit(3)]);
        setUpcomingMatches(matches);
      } catch (e) {
        console.log('Using default landing page items due to db config');
        setRecentTournaments([
          { id: 't1', name: 'Champions Cup 2026', status: 'Live', description: 'Elite T20 faceoff' },
          { id: 't2', name: 'Under-25 Premier League', status: 'Upcoming', description: 'Next-gen talent show' },
          { id: 't3', name: 'Corporate Shield Trophy', status: 'Completed', description: 'Corporate cricket showdown' },
        ]);
        setUpcomingMatches([
          { id: 'm1', teamA: 'Mumbai Knights', teamB: 'Delhi Dynamos', date: '31st May 2026', time: '18:30 IST', venue: 'Wankhede Stadium', status: 'Upcoming' },
          { id: 'm2', teamA: 'Chennai Super Kings', teamB: 'Kolkata Warriors', date: '1st June 2026', time: '16:00 IST', venue: 'Chepauk Stadium', status: 'Upcoming' }
        ]);
      }
    };
    fetchHomeData();
  }, []);

  // ── Framer Motion Variants ──

  // Hero: staggered spring bounce
  const heroContainerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.14, delayChildren: 0.3 } }
  };

  const heroSpring = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1, y: 0,
      transition: { type: 'spring', stiffness: 100, damping: 15 }
    }
  };

  // General stagger
  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.12 } }
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.85, ease: [0.16, 1, 0.3, 1] } }
  };

  const scaleUp = {
    hidden: { opacity: 0, scale: 0.92 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.7, ease: 'easeOut' } }
  };

  // Skew reveal for promise section
  const skewReveal = {
    hidden: { opacity: 0, x: -80, skewX: -4 },
    visible: {
      opacity: 1, x: 0, skewX: 0,
      transition: { duration: 1, ease: [0.16, 1, 0.3, 1] }
    }
  };

  // 3D tilt card hover
  const cardTilt = {
    scale: 1.03,
    rotateX: 4,
    rotateY: -4,
    transition: { type: 'spring', stiffness: 300, damping: 20 }
  };

  // Magnetic CTA
  const magneticHover = {
    scale: 1.06,
    transition: { type: 'spring', stiffness: 400, damping: 12 }
  };

  const homeSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SportsOrganization",
        "@id": "https://trivabsports.com/#organization",
        "name": "TRIVAB Sports",
        "alternateName": "TRIVAB Sports & Events",
        "url": "https://trivabsports.com",
        "logo": "https://trivabsports.com/logos/trivabsports.webp",
        "sameAs": [
          "https://www.instagram.com/baplcricket",
          "https://www.youtube.com/@baplcricket"
        ],
        "contactPoint": {
          "@type": "ContactPoint",
          "email": "trivabsports@gmail.com",
          "contactType": "customer service",
          "areaServed": "IN",
          "availableLanguage": ["en", "hi"]
        }
      },
      {
        "@type": "WebSite",
        "@id": "https://trivabsports.com/#website",
        "url": "https://trivabsports.com",
        "name": "TRIVAB Sports",
        "publisher": { "@id": "https://trivabsports.com/#organization" }
      }
    ]
  };

  return (
    <div className="home-page page-enter">
      <SEO
        title=""
        description="TRIVAB Sports is the ultimate leather-ball cricket tournament and match management platform. Explore match schedules, register player profiles, track stats, and experience elite cricket."
        keywords="TRIVAB Sports, cricket tournament, tournament management, team management, player registration, sports platform, leather-ball cricket, local cricket league"
        schema={homeSchema}
      />

      {/* ================================================================
          1. HERO — Cinematic Slideshow with parallax
          ================================================================ */}
      <section className="hero-section">
        {/* Slideshow background */}
        <div className="hero-slideshow" aria-hidden="true">
          <AnimatePresence mode="sync">
            <motion.div
              key={heroSlide}
              className="hero-slide-img"
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: 'easeInOut' }}
            >
              <img src={HERO_SLIDES[heroSlide].src} alt={HERO_SLIDES[heroSlide].alt} />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Layered overlays */}
        <div className="hero-overlay" aria-hidden="true" />
        <div className="hero-vignette" aria-hidden="true" />
        <div className="hero-light-leak" aria-hidden="true" />
        <div className="hero-light-leak-2" aria-hidden="true" />

        {/* Floating dust particles */}
        <div className="hero-particles" aria-hidden="true">
          <div className="dust" /><div className="dust" /><div className="dust" />
          <div className="dust" /><div className="dust" /><div className="dust" />
          <div className="dust" /><div className="dust" />
        </div>

        <div className="container hero-container centered">
          <motion.div
            className="hero-content"
            initial="hidden"
            animate="visible"
            variants={heroContainerVariants}
          >
            <motion.span className="hero-label-badge" variants={heroSpring}>
              <Sparkles size={13} /> TRIVAB Sports &amp; Events
            </motion.span>

            <motion.h1 className="hero-title" variants={heroSpring}>
              Sports &amp; Events,<br />
              <span className="text-gradient-crimson">Organized to Perfection.</span>
            </motion.h1>

            <motion.p className="hero-subtitle" variants={heroSpring}>
              We, TRIVAB Sports &amp; Events, plan, organize, and manage professional corporate events and sports tournaments. We offer a complete turnkey solution, seamlessly managing every detail from venue bookings and match scheduling to team registrations, live digital scoring, premium media coverage, custom apparel, trophies, and end-to-end event coordination.
            </motion.p>

            <motion.div className="hero-actions" variants={heroSpring} style={{ justifyContent: 'center' }}>
              <motion.div whileHover={magneticHover} whileTap={{ scale: 0.97 }}>
                <Link to="/services?type=corporate" className="btn-crimson">
                  Organize an Event For your Company <ArrowRight size={18} />
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>

        {/* Slideshow navigation arrows */}
        <button className="hero-slide-btn hero-slide-btn--prev" onClick={() => goSlide(-1)} aria-label="Previous slide">
          <ChevronLeft size={22} />
        </button>
        <button className="hero-slide-btn hero-slide-btn--next" onClick={() => goSlide(1)} aria-label="Next slide">
          <ChevronRight size={22} />
        </button>

        {/* Slide dots */}
        <div className="hero-slide-dots" aria-label="Slide indicators">
          {HERO_SLIDES.map((_, i) => (
            <button
              key={i}
              className={`hero-dot${heroSlide === i ? ' active' : ''}`}
              onClick={() => { clearInterval(slideTimerRef.current); setHeroSlide(i); }}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="hero-scroll-indicator"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2, duration: 1 }}
        >
          <span>Scroll</span>
          <div className="scroll-line" />
        </motion.div>
      </section>

      {/* ================================================================
          2. END-TO-END PROMISE — Transition Band
          ================================================================ */}
      <section className="promise-section">
        <div className="container">
          <motion.div
            className="promise-inner"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={skewReveal}
          >
            <div className="section-label-line">
              <span className="label-line" />
              <span className="label-text">What We Do</span>
              <span className="label-line" />
            </div>

            <h2 className="promise-title">
              Professional Event Management from Concept to Championship
            </h2>

            <p className="promise-body">
              We understand that orchestrating a successful corporate event or sports tournament demands meticulous attention to detail. Our team manages the complex logistics—securing premier venues, coordinating certified officials, facilitating real-time digital scoring, and designing custom branding materials—so your organization can focus entirely on engagement and performance.
            </p>
          </motion.div>
        </div>
      </section>



      {/* ================================================================
          4. CORE DELIVERABLES — 2x2 Grid, 3D Tilt, Glowing Borders
          ================================================================ */}
      <section className="deliverables-section container">
        <motion.div
          className="section-header"
          style={{ marginBottom: '64px' }}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <span className="section-label">What We Deliver</span>
          <h2 className="section-title">Core Deliverables</h2>
          <p className="section-subtitle">Every detail, meticulously executed.</p>
        </motion.div>

        <motion.div
          className="deliverables-grid"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          variants={containerVariants}
        >
          <motion.div
            className="deliverable-card"
            variants={fadeInUp}
            whileHover={cardTilt}
            style={{ transformStyle: 'preserve-3d' }}
          >
            <div className="deliverable-icon">🏟️</div>
            <h3>Corporate Venue &amp; Stadium Bookings</h3>
            <p>
              Our team handles complete ground recce and verification, booking premium sports grounds, corporate arenas, and professional-grade turfs that are fully prepared with boundary setups and match facilities for your organization.
            </p>
          </motion.div>

          <motion.div
            className="deliverable-card"
            variants={fadeInUp}
            whileHover={cardTilt}
            style={{ transformStyle: 'preserve-3d' }}
          >
            <div className="deliverable-icon">🎥</div>
            <h3>Media Production &amp; HD Live Broadcasts</h3>
            <p>
              Our team helps in capturing the best moments and creating lasting memories. We deliver high-definition live streaming, professional match photography, and corporate highlight reels, ensuring maximum brand visibility for your sports tournament.
            </p>
          </motion.div>

          <motion.div
            className="deliverable-card"
            variants={fadeInUp}
            whileHover={cardTilt}
            style={{ transformStyle: 'preserve-3d' }}
          >
            <div className="deliverable-icon">🏆</div>
            <h3>Corporate Trophies &amp; Bespoke Awards</h3>
            <p>
              We design customized trophies, corporate championship medals, and bespoke accolades, concluding your event with a professional award ceremony.
            </p>
          </motion.div>

          <motion.div
            className="deliverable-card"
            variants={fadeInUp}
            whileHover={cardTilt}
            style={{ transformStyle: 'preserve-3d' }}
          >
            <div className="deliverable-icon">⚙️</div>
            <h3>Match Day Umpires, Scorers &amp; Team Managers</h3>
            <p>
              We supply qualified match officials, certified umpires, professional digital scorers, and dedicated corporate team managers to oversee on-ground operations.
            </p>
          </motion.div>

          <motion.div
            className="deliverable-card"
            variants={fadeInUp}
            whileHover={cardTilt}
            style={{ transformStyle: 'preserve-3d' }}
          >
            <div className="deliverable-icon">👕</div>
            <h3>Custom High-Quality Jerseys &amp; Apparel</h3>
            <p>
              We design and manufacture premium custom jerseys using lightweight, breathable, high-performance fabrics. Our team guarantees top-notch sublimation printing and design services for your corporate squad.
            </p>
          </motion.div>

          <motion.div
            className="deliverable-card"
            variants={fadeInUp}
            whileHover={cardTilt}
            style={{ transformStyle: 'preserve-3d' }}
          >
            <div className="deliverable-icon">🍏</div>
            <h3>Gourmet Catering &amp; Refreshments</h3>
            <p>
              We provide high-quality catering services, active field refreshments, cold beverages, and energy-boosting desserts to keep players and corporate guests refreshed throughout the match day.
            </p>
          </motion.div>
        </motion.div>
      </section>

      {/* ================================================================
          5. SOCIAL PROOF & AUTHORITY
          ================================================================ */}
      <section className="authority-section">
        {/* Parallax background image */}
        <div className="authority-bg" aria-hidden="true">
          <img src="/images/cricket-ground.jpg" alt="" />
          <div className="authority-bg-overlay" />
        </div>

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <motion.div
            className="section-header"
            style={{ marginBottom: '56px' }}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <span className="section-label">Why TRIVAB</span>
            <h2 className="section-title">Why Teams Choose Us</h2>
            <p className="section-subtitle">55+ tournaments organized. 2,000+ players registered. Here's why.</p>
          </motion.div>

          <motion.div
            className="authority-grid"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={containerVariants}
          >
            <motion.div className="authority-strip" variants={fadeInUp} whileHover={{ y: -8, transition: { type: 'spring', stiffness: 300 } }}>
              <div className="authority-strip-icon"><Zap size={20} /></div>
              <h4>We Handle Everything</h4>
              <p>
                From ground booking to trophy distribution, you don't have to
                coordinate with 10 different vendors. We do it all under one roof.
              </p>
            </motion.div>

            <motion.div className="authority-strip" variants={fadeInUp} whileHover={{ y: -8, transition: { type: 'spring', stiffness: 300 } }}>
              <div className="authority-strip-icon"><Target size={20} /></div>
              <h4>Professional-Grade Experience</h4>
              <p>
                Custom jerseys, proper umpires, live scoring apps, photography —
                your tournament looks and feels like a premier league event.
              </p>
            </motion.div>

            <motion.div className="authority-strip" variants={fadeInUp} whileHover={{ y: -8, transition: { type: 'spring', stiffness: 300 } }}>
              <div className="authority-strip-icon"><CheckCircle size={20} /></div>
              <h4>Tech-Powered Management</h4>
              <p>
                Digital player registrations, QR-verified rosters, real-time scorecards,
                and an online dashboard to track everything in one place.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ================================================================
          ACTION PHOTOS GALLERY
          ================================================================ */}
      <section className="action-gallery-section">
        <div className="container">
          <motion.div
            className="section-header"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <span className="section-label">In Action</span>
            <h2 className="section-title">TRIVAB on the Field</h2>
            <p className="section-subtitle">Real moments from our tournaments &mdash; where passion meets the pitch.</p>
          </motion.div>

          <motion.div
            className="action-gallery-grid"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.15 }}
            variants={containerVariants}
          >
            {ACTION_PHOTOS.map((photo, idx) => (
              <motion.div
                key={idx}
                className="action-photo-card"
                variants={scaleUp}
                whileHover={{ scale: 1.03, y: -6 }}
                onClick={() => setActivePhoto(photo)}
              >
                <div className="action-photo-img-wrap">
                  <img src={photo.src} alt={photo.alt} loading="lazy" />
                  <div className="action-photo-overlay">
                    <span className="action-photo-caption">{photo.caption}</span>
                    <span className="action-photo-zoom">View ↗</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Lightbox */}
        <AnimatePresence>
          {activePhoto && (
            <motion.div
              className="photo-lightbox"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActivePhoto(null)}
            >
              <motion.div
                className="lightbox-img-wrap"
                initial={{ scale: 0.88, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.88, opacity: 0 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                onClick={e => e.stopPropagation()}
              >
                <img src={activePhoto.src} alt={activePhoto.alt} />
                <button className="lightbox-close" onClick={() => setActivePhoto(null)} aria-label="Close">✕</button>
                <span className="lightbox-caption">{activePhoto.caption}</span>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* ================================================================
          FEATURES — Preserved
          ================================================================ */}
      <section className="features-section container section-padding">
        <div className="section-header">
          <span className="section-label">Platform Features</span>
          <h2 className="section-title">Built-In Tools for Players &amp; Captains</h2>
          <p className="section-subtitle">Every registered player and captain gets access to these features.</p>
        </div>

        <motion.div
          className="grid grid-3 gap-xl"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          variants={containerVariants}
        >
          <motion.div className="card feature-box" variants={scaleUp} whileHover={{ y: -8, scale: 1.02 }}>
            <div className="feature-icon"><AwardIcon /></div>
            <h3 className="display-sm text-gradient-gold">Digital Player ID Card</h3>
            <p className="text-secondary text-sm">
              Every player gets a digital ID card with their photo, jersey number, team name, and a unique QR code — all generated automatically after registration.
            </p>
          </motion.div>
          <motion.div className="card feature-box" variants={scaleUp} whileHover={{ y: -8, scale: 1.02 }}>
            <div className="feature-icon"><QrIcon /></div>
            <h3 className="display-sm text-gradient-gold">QR Code Verification</h3>
            <p className="text-secondary text-sm">
              On match day, organizers scan a player's QR code to instantly verify their identity, team, and registration status. No paperwork needed.
            </p>
          </motion.div>
          <motion.div className="card feature-box" variants={scaleUp} whileHover={{ y: -8, scale: 1.02 }}>
            <div className="feature-icon"><TeamIcon /></div>
            <h3 className="display-sm text-gradient-gold">Team Roster Management</h3>
            <p className="text-secondary text-sm">
              Captains manage their squad through a dedicated dashboard. Add up to 40 players per team, and the system auto-blocks when the roster is full.
            </p>
          </motion.div>
        </motion.div>
      </section>

      {/* ================================================================
          TOURNAMENTS TICKER — Preserved
          ================================================================ */}
      <section className="tournaments-ticker section-padding-sm">
        <div className="container">
          <h4 className="text-center text-muted text-xs font-bold uppercase tracking-wider mb-sm" style={{ color: 'var(--gold-light)' }}>
            Our Tournaments
          </h4>
          <div className="ticker-wrap">
            <div className="ticker-content gap-xl flex items-center animate-marquee">
              {TICKER_LOGOS.map((logo, idx) => (
                <Link to={logo.link} key={`l1-${idx}`} style={{ cursor: 'pointer', display: 'inline-flex', textDecoration: 'none' }}>
                  <span className={`tournament-ticker-logo-wrap${logo.dark ? ' dark-frame' : ''}`}>
                    <img src={logo.src} alt={logo.alt} className={`ticker-logo-img-inner ${logo.imgClass}`} />
                  </span>
                </Link>
              ))}
              {TICKER_LOGOS.map((logo, idx) => (
                <Link to={logo.link} key={`l2-${idx}`} style={{ cursor: 'pointer', display: 'inline-flex', textDecoration: 'none' }}>
                  <span className={`tournament-ticker-logo-wrap${logo.dark ? ' dark-frame' : ''}`}>
                    <img src={logo.src} alt={logo.alt} className={`ticker-logo-img-inner ${logo.imgClass}`} />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================
          TOURNAMENTS GRID — Preserved
          ================================================================ */}
      <section className="recent-tournaments-section container section-padding">
        <div className="section-header">
          <span className="section-label">Tournaments</span>
          <h2 className="section-title">Active Tournaments</h2>
          <p className="section-subtitle">Stay updated with our ongoing and upcoming tournaments.</p>
        </div>

        <motion.div
          className="grid grid-3 gap-lg"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          variants={containerVariants}
        >
          {recentTournaments.map((t) => (
            <motion.div className="card tournament-summary-card" key={t.id} variants={fadeInUp} whileHover={{ y: -8 }}>
              <div className="flex justify-between items-start mb-sm">
                <span className={`badge ${t.status === 'Live' ? 'badge-red' : t.status === 'Upcoming' ? 'badge-gold' : 'badge-green'}`}>
                  {t.status}
                </span>
              </div>
              <h3 className="text-lg font-bold mb-xs">{t.name}</h3>
              <p className="text-muted text-sm mb-md">{t.description}</p>
              <Link to={`/tournaments/${t.id}`} className="btn btn-navy btn-sm" style={{ width: '100%' }}>
                Tournament Details
              </Link>
            </motion.div>
          ))}
        </motion.div>

        <div className="flex justify-center mt-xl">
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
            <Link to="/tournaments" className="btn btn-outline btn-lg" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              View All Tournaments <ArrowRight size={18} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ================================================================
          6. CONVERSION FOOTER
          ================================================================ */}
      <section className="conversion-block">
        <div className="container">
          <motion.div
            className="conversion-inner"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={containerVariants}
          >
            <motion.div variants={fadeInUp}>
              <hr className="section-divider" />
            </motion.div>

            <motion.h2 className="conversion-title" variants={fadeInUp}>
              Ready to Organize a Tournament?
            </motion.h2>

            <motion.p className="conversion-subtitle" variants={fadeInUp}>
              Get in touch with us to host a professional cricket tournament for your company, club, or community. We handle everything from booking to trophy ceremonies.
            </motion.p>

            <motion.div variants={fadeInUp}>
              <motion.div
                style={{ display: 'inline-block' }}
                whileHover={magneticHover}
                whileTap={{ scale: 0.96 }}
              >
                <Link to="/contact" className="btn-crimson">
                  Contact Us <ArrowRight size={18} />
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

    </div>
  );
}

// Inline Icons for aesthetic ease
function AwardIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

function QrIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  );
}

function TeamIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function diversifyTournaments(list) {
  if (!list || list.length <= 1) return list;
  
  const groups = { bapl: [], corporate: [], xpress: [], kids: [], other: [] };
  
  list.forEach(t => {
    const id = t.id.toLowerCase();
    if (id.includes('corporate')) groups.corporate.push(t);
    else if (id.includes('xpress')) groups.xpress.push(t);
    else if (id.includes('kids') || id.includes('dads')) groups.kids.push(t);
    else if (id.startsWith('bapl')) groups.bapl.push(t);
    else groups.other.push(t);
  });
  
  const result = [];
  const maxLen = Math.max(
    groups.bapl.length, groups.corporate.length,
    groups.xpress.length, groups.kids.length, groups.other.length
  );
  
  for (let i = 0; i < maxLen; i++) {
    if (groups.bapl[i]) result.push(groups.bapl[i]);
    if (groups.corporate[i]) result.push(groups.corporate[i]);
    if (groups.xpress[i]) result.push(groups.xpress[i]);
    if (groups.kids[i]) result.push(groups.kids[i]);
    if (groups.other[i]) result.push(groups.other[i]);
  }
  
  return result;
}
