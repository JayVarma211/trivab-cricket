import { useEffect, useState } from 'react';
import { getAllSponsors } from '../firebase/firestore';
import { Award, ShieldAlert, Star, ShieldCheck, Heart } from 'lucide-react';
import './Sponsors.css';

const FALLBACK_SPONSORS = [
  { 
    id: 's1', 
    name: 'Panchnaad Groups', 
    tier: 'Title Sponsor', 
    role: 'Title Sponsor',
    bannerURL: '/logos/panchnaad.jpg', 
    website: 'http://panchnaadgroup.com', 
    description: 'Title Sponsor of the premier BAPL League, building the future of Mumbai.' 
  },
  { 
    id: 's2', 
    name: 'Nexus Sports', 
    tier: 'Co-Sponsor', 
    role: 'Sports & Apparel Partner',
    bannerURL: '/logos/nexussports.jpg', 
    website: 'https://nexus.com', 
    description: 'Sports and apparel partner providing premium custom team kits.' 
  },
  { 
    id: 's3', 
    name: 'buffering', 
    tier: 'Co-Sponsor', 
    role: 'Media Partner',
    bannerURL: '/logos/buffering.jpg', 
    website: 'https://buffering.in', 
    description: 'Official media coverage and broadcasting partner.' 
  },
  { 
    id: 's4', 
    name: 'Regal interior studios', 
    tier: 'Co-Sponsor', 
    role: 'Design & Decor Partner',
    bannerURL: '/logos/regalinterior.jpg', 
    website: 'https://regalstudios.com', 
    description: 'Design and decor partner designing premium VIP enclosures.' 
  },
  { 
    id: 's5', 
    name: 'crickstore', 
    tier: 'Partner Sponsor', 
    role: 'Associate Partner',
    bannerURL: '/logos/crickstore.jpg', 
    website: 'https://www.crickstore.com', 
    description: 'Associate partner supplying professional cricket equipment.' 
  },
  { 
    id: 's6', 
    name: 'hub town', 
    tier: 'Partner Sponsor', 
    role: 'Real Estate Partner',
    bannerURL: '/logos/hubtown.jpg', 
    website: 'http://www.hubtown.co.in', 
    description: 'Real estate partner supporting community sports initiatives.' 
  },
  { 
    id: 's7', 
    name: 'physiorehability', 
    tier: 'Partner Sponsor', 
    role: 'Physio Partner',
    bannerURL: '/logos/physiorehability.jpg', 
    website: 'https://physiorehab.com', 
    description: 'Official physiotherapy and muscle recovery partner.' 
  },
  { 
    id: 's8', 
    name: 'upurFit', 
    tier: 'Partner Sponsor', 
    role: 'Pain & Relief Partner',
    bannerURL: '/logos/upurfit.jpg', 
    website: 'https://upurfit.com', 
    description: 'Pain relief and recovery partner keeping players fit.' 
  },
  { 
    id: 's9', 
    name: 'midday gujrati', 
    tier: 'Partner Sponsor', 
    role: 'News Partner',
    bannerURL: '/logos/midday.jpg', 
    website: 'https://www.gujaratimidday.com', 
    description: 'Official Gujarati news media and print coverage partner.' 
  }
];

export default function Sponsors() {
  const [sponsors, setSponsors] = useState(FALLBACK_SPONSORS);

  useEffect(() => {
    const fetchSponsors = async () => {
      try {
        const list = await getAllSponsors();
        if (list && list.length > 0) {
          setSponsors(list);
        }
      } catch (err) {
        console.log('Error fetching sponsors from Firestore, keeping fallback defaults:', err);
      }
    };
    fetchSponsors();
  }, []);

  return (
    <div className="sponsors-page page-enter container section-padding">
      <div className="section-header">
        <span className="section-label">Partnerships</span>
        <h1 className="section-title">Official Platform <span className="text-gradient-gold">Sponsors</span></h1>
        <p className="section-subtitle">We are proudly supported by elite organizations dedicated to supporting sports development.</p>
      </div>

      <div className="sponsors-layout">
        {/* Title Sponsors */}
        <div className="sponsor-tier-section">
          <h2 className="display-sm tier-header text-gradient-gold">
            <Award size={24} /> Title Sponsors
          </h2>
          <div className="grid grid-2 gap-xl">
            {sponsors
              .filter((s) => s.tier === 'Title Sponsor')
              .map((sponsor) => (
                <div className="card sponsor-card title-tier-card" key={sponsor.id}>
                  <div className="sponsor-meta">
                    <span className="badge badge-gold">{sponsor.role || 'Title Sponsor'}</span>
                    <h3 className="text-lg font-bold mt-sm">{sponsor.name}</h3>
                    <p className="text-secondary text-sm mt-xs">{sponsor.description}</p>
                    <a href={sponsor.website} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm mt-md">
                      Visit Website
                    </a>
                  </div>
                  <div className="sponsor-logo-box">
                    {sponsor.bannerURL ? (
                      <img src={sponsor.bannerURL} alt={`${sponsor.name} logo`} className="sponsor-logo-img" />
                    ) : (
                      <span className="text-gradient-gold">{sponsor.name.split(' ').map(w => w[0]).join('')}</span>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Co-Sponsors */}
        <div className="sponsor-tier-section mt-xl">
          <h2 className="display-sm tier-header text-gradient-gold">
            <Star size={24} /> Co-Sponsors
          </h2>
          <div className="grid grid-2 gap-xl">
            {sponsors
              .filter((s) => s.tier === 'Co-Sponsor')
              .map((sponsor) => (
                <div className="card sponsor-card" key={sponsor.id}>
                  <div className="sponsor-meta">
                    <span className="badge badge-blue">{sponsor.role || 'Co-Sponsor'}</span>
                    <h3 className="text-lg font-bold mt-sm">{sponsor.name}</h3>
                    <p className="text-secondary text-sm mt-xs">{sponsor.description}</p>
                    <a href={sponsor.website} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm mt-md">
                      Visit Website
                    </a>
                  </div>
                  <div className="sponsor-logo-box">
                    {sponsor.bannerURL ? (
                      <img src={sponsor.bannerURL} alt={`${sponsor.name} logo`} className="sponsor-logo-img" />
                    ) : (
                      <span className="text-blue">{sponsor.name.split(' ').map(w => w[0]).join('')}</span>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Partners */}
        <div className="sponsor-tier-section mt-xl">
          <h2 className="display-sm tier-header text-gradient-gold">
            <Heart size={24} /> Partner Sponsors
          </h2>
          <div className="grid grid-3 gap-lg">
            {sponsors
              .filter((s) => s.tier !== 'Title Sponsor' && s.tier !== 'Co-Sponsor')
              .map((sponsor) => (
                <div className="card sponsor-card partner-card" key={sponsor.id}>
                  <div className="sponsor-logo-box small">
                    {sponsor.bannerURL ? (
                      <img src={sponsor.bannerURL} alt={`${sponsor.name} logo`} className="sponsor-logo-img" />
                    ) : (
                      <span className="text-muted">{sponsor.name.split(' ').map(w => w[0]).join('')}</span>
                    )}
                  </div>
                  <div className="sponsor-meta mt-sm">
                    <span className="badge badge-orange text-xs mb-xs" style={{ display: 'inline-block' }}>
                      {sponsor.role || 'Partner Sponsor'}
                    </span>
                    <h3 className="text-sm font-bold">{sponsor.name}</h3>
                    <p className="text-muted text-xs mt-xs">{sponsor.description}</p>
                    <a href={sponsor.website} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm mt-sm">
                      Visit Website
                    </a>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
