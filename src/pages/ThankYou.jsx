import { Check, ArrowRight, Mail, Clock3, Headphones, Home, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import SEO from '../components/common/SEO';

const confetti = [
  { left: '8%', top: '12%', color: 'gold', rotate: '-18deg' },
  { left: '18%', top: '23%', color: 'red', rotate: '26deg' },
  { left: '29%', top: '10%', color: 'gold', rotate: '42deg' },
  { left: '74%', top: '13%', color: 'red', rotate: '-34deg' },
  { left: '84%', top: '25%', color: 'gold', rotate: '18deg' },
  { left: '92%', top: '10%', color: 'red', rotate: '50deg' },
  { left: '12%', top: '72%', color: 'red', rotate: '38deg' },
  { left: '24%', top: '84%', color: 'gold', rotate: '-25deg' },
  { left: '79%', top: '79%', color: 'gold', rotate: '32deg' },
  { left: '90%', top: '66%', color: 'red', rotate: '-42deg' }
];

const nextSteps = [
  { icon: Mail, title: "We've received your message", copy: 'Our team has received your inquiry.' },
  { icon: Clock3, title: "We'll review it", copy: 'We review all messages carefully.' },
  { icon: Headphones, title: "You'll hear from us", copy: 'Expect a response from our team soon.' }
];

export default function ThankYou() {
  return (
    <div className="thank-you-page page-enter">
      <SEO
        title="Thank You"
        description="Your inquiry has been successfully submitted to TRIVAB Sports."
      />
      <div className="thank-you-confetti" aria-hidden="true">
        {confetti.map((piece, index) => (
          <span
            key={index}
            className={`thank-you-confetti-piece ${piece.color}`}
            style={{ left: piece.left, top: piece.top, '--rotate': piece.rotate }}
          />
        ))}
      </div>
      <div className="thank-you-content">
        <div className="thank-you-check" aria-hidden="true">
          <Check size={50} strokeWidth={3} />
        </div>
        <p className="thank-you-eyebrow">Submission complete</p>
        <h1>Thank You!</h1>
        <p className="thank-you-message">Your message has been successfully submitted.</p>
        <p className="thank-you-message">We appreciate you reaching out to <strong>TRIVAB Sports.</strong></p>
        <p className="thank-you-note">Our team will get back to you as soon as possible.</p>
        <div className="thank-you-divider" aria-hidden="true" />
        <section className="thank-you-next" aria-labelledby="thank-you-next-title">
          <h2 id="thank-you-next-title">What happens next?</h2>
          <div className="thank-you-steps">
            {nextSteps.map(({ icon: Icon, title, copy }, index) => (
              <div className="thank-you-step" key={title}>
                <div className="thank-you-step-icon"><Icon size={22} /></div>
                <h3>{index + 1}. {title}</h3>
                <p>{copy}</p>
              </div>
            ))}
          </div>
        </section>
        <div className="thank-you-actions">
          <Link to="/" className="btn btn-gold thank-you-button">
            <Home size={17} /> Return to Home
          </Link>
          <Link to="/services" className="btn btn-outline thank-you-button">
            <Sparkles size={17} /> Explore Our Services <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}