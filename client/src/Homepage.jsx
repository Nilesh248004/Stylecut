import { ArrowRight, Mail, MapPin, Phone, Scissors, UserRound } from 'lucide-react';

function Homepage() {
  return (
    <main className="landing-page">
      <section className="landing-hero">
        <header className="site-header">
          <nav className="nav" aria-label="Main navigation">
            <a className="brand" href="#/home" aria-label="StyleCut home">
              <span className="brand-mark">
                <Scissors size={22} />
              </span>
              <span className="brand-text">
                <strong>StyleCut</strong>
                <small>Salon Studio</small>
              </span>
            </a>

            <div className="nav-links">
              <a href="#/service">Service</a>
              <a href="#/products">Products</a>
              <a href="#/book">Bookings</a>
              <a href="#/bridals">Bridals</a>
              <a href="#/account">
                <UserRound size={18} />
                Account
              </a>
            </div>
          </nav>
        </header>

        <div className="landing-content">
          <div className="hero-copy">
            <p className="eyebrow">
              <MapPin size={16} />
              Premium salon and bridal grooming studio
            </p>
            <h1>StyleCut</h1>
            <p>
              Refresh your look with expert haircuts, facials, grooming care, bridal styling, and
              salon-approved products made for everyday confidence.
            </p>

            <div className="hero-actions">
              <a className="primary-action" href="#/service">
                Explore
                <ArrowRight size={20} />
              </a>
            </div>
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <strong>StyleCut</strong>
            <span>Professional salon and bridal grooming studio</span>
          </div>

          <address className="footer-details">
            <span>
              <MapPin size={18} />
              MG Road, Bengaluru, Karnataka
            </span>
            <a href="tel:+919876543210">
              <Phone size={18} />
              +91 98765 43210
            </a>
            <a href="mailto:contact@stylecut.com">
              <Mail size={18} />
              contact@stylecut.com
            </a>
          </address>
        </div>

        <p className="copyright">Copyright © 2026 StyleCut Salon. All rights reserved.</p>
      </footer>
    </main>
  );
}

export default Homepage;
