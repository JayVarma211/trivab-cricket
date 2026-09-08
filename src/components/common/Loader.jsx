import './Loader.css';

export default function Loader({ fullscreen = false, size = 40 }) {
  if (fullscreen) {
    return (
      <div className="loader-fullscreen">
        <div className="loader-content">
          <div className="loader-logo">
            <img src="/logos/trivabsports.jpg" className="loader-logo-img" alt="TRIVAB SPORTS" />
          </div>
          <div className="loader-spinner" />
          <p className="loader-text">Loading TRIVAB...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="loader-inline">
      <div className="spinner" style={{ width: size, height: size }} />
    </div>
  );
}
