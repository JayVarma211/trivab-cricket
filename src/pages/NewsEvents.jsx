import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Newspaper, Calendar, Tag, ArrowRight, Search, Sparkles, Share2, X } from 'lucide-react';
import { getCollection } from '../firebase/firestore';
import { motion } from 'framer-motion';
import SEO from '../components/common/SEO';

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } }
};
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
};

export default function NewsEvents() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState('All');
  const [selectedArticleModal, setSelectedArticleModal] = useState(null);

  const SAMPLE_NEWS = [
    {
      id: '1',
      title: 'BAPL Season 2026 — Registration Now Open!',
      content: 'We are thrilled to announce that registrations for the BAPL Season 2026 are now officially open. Teams from North and South Mumbai can register before the deadline. Limited slots available!',
      date: '2026-06-01',
      tag: 'Tournament',
      imageURL: '',
    },
    {
      id: '2',
      title: 'BAPL 40+ DADS T20 — Pune Edition Coming Soon',
      content: 'Exciting news for cricket enthusiasts in Pune! The BAPL 40+ DADS T20 is expanding to Pune with a dedicated edition. Stay tuned for registration dates and venue announcements.',
      date: '2026-06-05',
      tag: 'Announcement',
      imageURL: '',
    },
    {
      id: '3',
      title: 'Trivab Monsoon Championship — Key Dates Revealed',
      content: 'The highly anticipated Trivab Monsoon Championship dates have been finalized. Mark your calendars and prepare your squads for the most exciting monsoon cricket season yet.',
      date: '2026-06-08',
      tag: 'Tournament',
      imageURL: '',
    },
  ];

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const data = await getCollection('news_events');
        if (data && data.length > 0) {
          const sorted = data.sort((a, b) => new Date(b.date) - new Date(a.date));
          setArticles(sorted);
        } else {
          setArticles(SAMPLE_NEWS);
        }
      } catch {
        setArticles(SAMPLE_NEWS);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, []);

  const handleShare = (article) => {
    const text = `*${article.title}*\n\n${article.content ? article.content.substring(0, 120) + '...' : ''}\n\nRead more at TRIVAB Sports!`;
    const url = window.location.origin + '/news';
    
    if (navigator.share) {
      navigator.share({
        title: article.title,
        text: text,
        url: url
      }).catch(err => console.log("Share failed:", err));
    } else {
      const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text + '\n' + url)}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  const allTags = ['All', ...new Set(articles.map(a => a.tag).filter(Boolean))];

  const filtered = articles.filter(a => {
    const matchSearch = !search || a.title.toLowerCase().includes(search.toLowerCase()) || a.content?.toLowerCase().includes(search.toLowerCase());
    const matchTag = selectedTag === 'All' || a.tag === selectedTag;
    return matchSearch && matchTag;
  });

  const newsSchema = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "name": "TRIVAB Sports Cricket News & Announcements",
    "description": "Latest tournament updates, press releases, match day announcements, and league news from TRIVAB Sports.",
    "url": "https://trivabsports.com/news"
  };

  return (
    <div className="page-enter" style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <SEO 
        title="News & Events"
        description="Stay updated with the latest cricket announcements, match highlights, tournament schedules, and press reports from TRIVAB Sports."
        keywords="TRIVAB Sports news, cricket announcements, BAPL match reports, tournament updates, leather-ball league news"
        schema={newsSchema}
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
          <motion.span
            className="section-label"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Sparkles size={14} /> Latest from TRIVAB
          </motion.span>
          <motion.h1
            className="display-2xl"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            style={{ marginTop: 'var(--space-md)' }}
          >
            <span className="text-gradient-gold">TRIVAB Sports</span> News &amp; Events
          </motion.h1>
          <motion.p
            className="text-secondary"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            style={{ maxWidth: '600px', margin: 'var(--space-md) auto 0' }}
          >
            Stay updated with tournament announcements, match results, event highlights, and all things TRIVAB cricket.
          </motion.p>
        </div>
      </section>

      <div className="container section-padding">
        {/* Search & Filter Bar */}
        <div style={{
          display: 'flex',
          gap: 'var(--space-md)',
          marginBottom: 'var(--space-xl)',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}>
          {/* Search */}
          <div style={{
            flex: 1,
            minWidth: '240px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-card)',
            borderRadius: 'var(--radius-md)',
            padding: '10px 16px',
          }}>
            <Search size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search news & events..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                background: 'none',
                border: 'none',
                outline: 'none',
                color: 'var(--text-primary)',
                fontSize: '0.9rem',
                width: '100%',
              }}
            />
          </div>

          {/* Tag Filters */}
          <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-full)',
                  border: `1px solid ${selectedTag === tag ? 'var(--gold)' : 'var(--border-card)'}`,
                  background: selectedTag === tag ? 'rgba(212,175,55,0.12)' : 'var(--bg-card)',
                  color: selectedTag === tag ? 'var(--gold)' : 'var(--text-secondary)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Articles Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-4xl)', color: 'var(--text-muted)' }}>
            <Newspaper size={48} style={{ opacity: 0.3, marginBottom: 'var(--space-md)' }} />
            <p>Loading news...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-4xl)', color: 'var(--text-muted)' }}>
            <Newspaper size={48} style={{ opacity: 0.3, marginBottom: 'var(--space-md)' }} />
            <p>No articles found matching your search.</p>
          </div>
        ) : (
          <motion.div
            className="grid grid-3 gap-xl"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            {filtered.map(article => (
              <motion.article
                key={article.id}
                className="card"
                variants={fadeInUp}
                onClick={() => setSelectedArticleModal(article)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-md)',
                  transition: 'all 0.3s',
                  cursor: 'pointer',
                  overflow: 'hidden',
                }}
                whileHover={{ y: -5, borderColor: 'var(--gold)' }}
              >
                {/* Image / Gradient Header */}
                {article.imageURL ? (
                  <div style={{ height: '180px', overflow: 'hidden', margin: 'calc(-1 * var(--space-lg)) calc(-1 * var(--space-lg)) 0', borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0' }}>
                    <img src={article.imageURL} alt={article.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ) : (
                  <div style={{
                    height: '120px',
                    margin: 'calc(-1 * var(--space-lg)) calc(-1 * var(--space-lg)) 0',
                    borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
                    background: 'linear-gradient(135deg, rgba(128,0,0,0.3) 0%, rgba(212,175,55,0.15) 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Newspaper size={40} style={{ color: 'var(--gold)', opacity: 0.6 }} />
                  </div>
                )}

                {/* Meta */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  {article.tag && (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '3px 10px',
                      borderRadius: 'var(--radius-full)',
                      background: 'rgba(212,175,55,0.12)',
                      color: 'var(--gold)',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      border: '1px solid rgba(212,175,55,0.25)',
                    }}>
                      <Tag size={10} /> {article.tag}
                    </span>
                  )}
                  {article.date && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <Calendar size={12} />
                      {new Date(article.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  )}
                </div>

                <h2 className="text-md font-bold" style={{ color: 'var(--text-primary)', lineHeight: 1.4 }}>{article.title}</h2>
                <p className="text-sm text-secondary" style={{ flex: 1, lineHeight: 1.7, display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {article.content}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed var(--border-card)', paddingTop: '10px', marginTop: 'auto' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--gold)', fontWeight: 600 }}>
                    Read Full Story →
                  </span>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleShare(article);
                    }}
                    style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '6px', 
                      fontSize: '0.8rem', 
                      color: 'var(--text-muted)', 
                      fontWeight: 600,
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'opacity 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity = 0.8}
                    onMouseLeave={e => e.currentTarget.style.opacity = 1}
                  >
                    <Share2 size={13} /> Share
                  </button>
                </div>
              </motion.article>
            ))}
          </motion.div>
        )}
      </div>

      {/* Article Detail Modal */}
      {selectedArticleModal && createPortal(
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            zIndex: 999999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            boxSizing: 'border-box'
          }}
          onClick={() => setSelectedArticleModal(null)}
        >
          <div 
            style={{
              background: 'var(--bg-card, #ffffff)',
              color: 'var(--text-primary, #0f172a)',
              border: '1px solid var(--border-card, #e2e8f0)',
              borderRadius: '16px',
              maxWidth: '580px',
              width: '100%',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
              overflow: 'hidden'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              borderBottom: '1px solid var(--border-card, #e2e8f0)',
              background: 'var(--bg-secondary, #f8fafc)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="badge badge-gold" style={{ fontSize: '0.72rem', letterSpacing: '0.05em', padding: '4px 10px' }}>
                  {selectedArticleModal.tag || 'NEWS & EVENTS'}
                </span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted, #64748b)', fontWeight: 500 }}>
                  {selectedArticleModal.date ? new Date(selectedArticleModal.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                </span>
              </div>

              <button
                onClick={() => setSelectedArticleModal(null)}
                style={{
                  background: 'var(--border-card, #e2e8f0)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-primary, #1e293b)',
                  cursor: 'pointer'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Body */}
            <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
              {selectedArticleModal.imageURL && (
                <div style={{ width: '100%', borderRadius: '12px', overflow: 'hidden', marginBottom: '20px', border: '1px solid var(--border-card, #e2e8f0)', background: '#0f172a' }}>
                  <img
                    src={selectedArticleModal.imageURL}
                    alt={selectedArticleModal.title || ''}
                    style={{ width: '100%', maxHeight: '320px', objectFit: 'contain', display: 'block' }}
                  />
                </div>
              )}

              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary, #0f172a)', marginBottom: '14px', lineHeight: 1.35 }}>
                {selectedArticleModal.title}
              </h2>

              <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary, #334155)', lineHeight: 1.7, whiteSpace: 'pre-line', margin: 0 }}>
                {selectedArticleModal.content}
              </p>
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border-card, #e2e8f0)', background: 'var(--bg-secondary, #f8fafc)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button 
                onClick={() => handleShare(selectedArticleModal)}
                className="btn btn-outline btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Share2 size={14} /> Share Story
              </button>
              <button className="btn btn-gold btn-sm" onClick={() => setSelectedArticleModal(null)}>
                Close Window
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
