import { useEffect, useState } from 'react';
import { getAllSponsors } from '../firebase/firestore';
import { Award, ShieldAlert, Star, ShieldCheck, Heart } from 'lucide-react';
import './Sponsors.css';

export default function Sponsors() {
  const [sponsors, setSponsors] = useState([]);

  useEffect(() => {
    const fetchSponsors = async () => {
      try {
        const list = await getAllSponsors();
        setSponsors(list);
      } catch (err) {
        console.log('Using default mock sponsors');
        // Fallback default list
        setSponsors([
          { id: 's1', name: 'Apex Sports Equipment', tier: 'Title Sponsor', bannerURL: '', website: 'https://apex.com', description: 'Apex provides professional match-grade bats, leather balls, and batting equipment for all matches.' },
          { id: 's2', name: 'Cricket Energy Drinks', tier: 'Co-Sponsor', bannerURL: '', website: 'https://energy.com', description: 'Keep hydrated and energized. Fueling the players of TRIVAB Tournaments.' },
          { id: 's3', name: 'Golden Bat Ltd', tier: 'Partner Sponsor', bannerURL: '', website: 'https://golden.com', description: 'Premier bat manufacturers specialized in English willow crafting.' },
          { id: 's4', name: 'Mumbai Sports Clinics', tier: 'Partner Sponsor', bannerURL: '', website: 'https://mumbaiclinic.com', description: 'Official medical support and physiotherapy provider.' }
        ]);
      }
    };
    fetchSponsors();
  }, []);

  const getTierIcon = (tier) => {
    if (tier === 'Title Sponsor') return <Award size={20} className="text-gold" />;
    if (tier === 'Co-Sponsor') return <Star size={20} className="text-gold" />;
    return <Heart size={20} className="text-gold" />;
  };

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
                    <span className="badge badge-gold">Title Partner</span>
                    <h3 className="text-lg font-bold mt-sm">{sponsor.name}</h3>
                    <p className="text-secondary text-sm mt-xs">{sponsor.description}</p>
                    <a href={sponsor.website} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm mt-md">
                      Visit Website
                    </a>
                  </div>
                  <div className="sponsor-logo-box text-gradient-gold">
                    {sponsor.name.split(' ').map(w => w[0]).join('')}
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
                    <span className="badge badge-blue">Co-Sponsor</span>
                    <h3 className="text-lg font-bold mt-sm">{sponsor.name}</h3>
                    <p className="text-secondary text-sm mt-xs">{sponsor.description}</p>
                    <a href={sponsor.website} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm mt-md">
                      Visit Website
                    </a>
                  </div>
                  <div className="sponsor-logo-box text-blue">
                    {sponsor.name.split(' ').map(w => w[0]).join('')}
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
                  <div className="sponsor-logo-box small text-muted">
                    {sponsor.name.split(' ').map(w => w[0]).join('')}
                  </div>
                  <div className="sponsor-meta mt-sm">
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
