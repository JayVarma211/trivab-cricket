import { useState, useEffect } from 'react';
import { getCollection } from '../firebase/firestore';
import { safeFormatDate } from '../utils/dateFormatter';
import { Image, X, ZoomIn, Calendar, Sparkles, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SAMPLE_IMAGES = [
  {
    id: 's1',
    name: 'BAPL Season Kickoff Match',
    url: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&q=80&w=800',
    uploadedAt: '2026-06-01T12:00:00Z',
    size: '1.2'
  },
  {
    id: 's2',
    name: 'Monsoon Championship Turf Pitch',
    url: 'https://images.unsplash.com/photo-1540747737956-3787257478be?auto=format&fit=crop&q=80&w=800',
    uploadedAt: '2026-06-03T10:00:00Z',
    size: '0.85'
  },
  {
    id: 's3',
    name: 'Tournament Champions Cup',
    url: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=80&w=800',
    uploadedAt: '2026-06-05T14:30:00Z',
    size: '1.5'
  },
  {
    id: 's4',
    name: 'Evening Turf Training Session',
    url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=800',
    uploadedAt: '2026-06-07T18:00:00Z',
    size: '1.1'
  }
];

export default function Gallery() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(null);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const data = await getCollection('gallery');
        if (data && data.length > 0) {
          const sorted = data.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
          setImages(sorted);
        } else {
          setImages(SAMPLE_IMAGES);
        }
      } catch (err) {
        console.error("Error loading gallery:", err);
        setImages(SAMPLE_IMAGES);
      } finally {
        setLoading(false);
      }
    };
    fetchImages();
  }, []);

  return (
    <div className="gallery-page page-enter" style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
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
          <span className="section-label"><Sparkles size={14} /> Trivab Moments</span>
          <h1 className="display-2xl" style={{ marginTop: 'var(--space-md)' }}>
            Photo <span className="text-gradient-gold">Gallery</span>
          </h1>
          <p className="text-secondary" style={{ maxWidth: '600px', margin: 'var(--space-md) auto 0' }}>
            Visual highlights from our leagues, corporate championships, international tours, and matches.
          </p>
        </div>
      </section>

      {/* Gallery Grid */}
      <div className="container section-padding">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-4xl)', color: 'var(--text-muted)' }}>
            <div className="spinner" style={{ margin: '0 auto var(--space-md)' }} />
            <p>Loading media library...</p>
          </div>
        ) : images.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-4xl)', color: 'var(--text-muted)' }}>
            <Image size={48} style={{ opacity: 0.3, marginBottom: 'var(--space-md)' }} />
            <p>No gallery images uploaded yet.</p>
          </div>
        ) : (
          <motion.div
            className="grid grid-4 gap-lg"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.08 } }
            }}
          >
            {images.map((img) => (
              <motion.div
                key={img.id}
                className="card card-gold"
                variants={{
                  hidden: { opacity: 0, y: 25 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
                }}
                style={{
                  padding: 0,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  position: 'relative',
                  aspectRatio: '1/1',
                  borderRadius: '12px'
                }}
                whileHover={{ y: -5 }}
                onClick={() => setActiveImage(img)}
              >
                <img
                  src={img.url}
                  alt={img.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s' }}
                  className="gallery-image-hover"
                />
                
                {/* Hover overlay details */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, rgba(9, 9, 11, 0.95) 0%, rgba(9, 9, 11, 0.3) 70%, transparent 100%)',
                  opacity: 0,
                  transition: 'opacity 0.3s',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  padding: '14px',
                }}
                className="gallery-overlay-hover"
                >
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '0.9rem', color: '#fff', fontWeight: 700 }} className="truncate">{img.name}</h4>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={10} /> {safeFormatDate(img.uploadedAt || img.createdAt, { day: 'numeric', month: 'short' })}
                    </span>
                    <ZoomIn size={14} className="text-gold" />
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Zoom Lightbox Modal */}
      <AnimatePresence>
        {activeImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(9, 9, 11, 0.95)',
              zIndex: 99999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px'
            }}
            onClick={() => setActiveImage(null)}
          >
            {/* Close Button */}
            <button
              onClick={() => setActiveImage(null)}
              style={{
                position: 'absolute',
                top: '24px',
                right: '24px',
                background: 'rgba(255,255,255,0.08)',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                padding: '10px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.2s'
              }}
              onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.15)'}
              onMouseLeave={e => e.target.style.background = 'rgba(255,255,255,0.08)'}
            >
              <X size={20} />
            </button>

            {/* Modal Content Box */}
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: -15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              style={{
                maxWidth: '960px',
                width: '100%',
                maxHeight: '85vh',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                position: 'relative'
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* Image element */}
              <div style={{
                borderRadius: '16px',
                overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.1)',
                background: '#000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                maxHeight: '75vh'
              }}>
                <img
                  src={activeImage.url}
                  alt={activeImage.name}
                  style={{ maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain' }}
                />
              </div>

              {/* Bottom detail row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#fff', padding: '0 8px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#d4af37' }}>{activeImage.name}</h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>
                    Uploaded on {safeFormatDate(activeImage.uploadedAt || activeImage.createdAt, { day: 'numeric', month: 'long', year: 'numeric' })} • Size: {activeImage.size} MB
                  </p>
                </div>
                <a
                  href={activeImage.url}
                  target="_blank"
                  rel="noreferrer"
                  download={activeImage.name}
                  className="btn btn-gold btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <Download size={16} /> Open Original
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .gallery-image-hover:hover {
          transform: scale(1.08);
        }
        .card:hover .gallery-overlay-hover {
          opacity: 1 !important;
        }
      `}</style>
    </div>
  );
}
