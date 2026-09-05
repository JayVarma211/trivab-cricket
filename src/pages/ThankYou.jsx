import { Check, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import SEO from '../components/common/SEO';

export default function ThankYou() {
  return (
    <div className="thank-you-page page-enter">
      <SEO
        title="Thank You"
        description="Your inquiry has been successfully submitted to TRIVAB Sports."
      />
      <div className="thank-you-content">
        <div className="thank-you-check" aria-hidden="true">
          <Check size={50} strokeWidth={3} />
        </div>
        <p className="thank-you-eyebrow">Submission complete</p>
        <h1>Thank You!</h1>
        <p className="thank-you-message">Your inquiry was successfully submitted.</p>
        <p className="thank-you-note">We have received your message and will contact you shortly.</p>
        <Link to="/" className="btn btn-gold thank-you-button">
          Go to website <ArrowRight size={18} />
        </Link>
      </div>
    </div>
  );
}