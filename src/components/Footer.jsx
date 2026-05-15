import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import '../styles/Footer.css';

const CATEGORIES = [
  { label: 'Teknologi', path: '/category/teknologi' },
  { label: 'Lifestyle', path: '/category/lifestyle' },
  { label: 'Bisnis', path: '/category/bisnis' },
  { label: 'Novel', path: '/category/novel' },
  { label: 'Kesehatan', path: '/category/health' },
  { label: 'Otomotif', path: '/category/otomotif' },
  { label: 'Nasional', path: '/category/nasional' },
  { label: 'Internasional', path: '/category/internasional' },
  { label: 'Film', path: '/category/film' },
];

export default function Footer() {
  const year = new Date().getFullYear();

  const [time, setTime] = useState('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();

      const formatted = now.toLocaleTimeString('id-ID', {
        timeZone: 'Asia/Jakarta',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      setTime(formatted);
    };

    updateClock();

    const interval = setInterval(updateClock, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <footer className="ft">

      {/* ── decorative top accent ── */}
      <div className="ft__topbar" aria-hidden="true" />

      <div className="ft__inner">

        {/* ── GRID ── */}
        <div className="ft__grid">

          {/* BRAND */}
          <div className="ft__brand">
            <div className="ft__logo-wrap">
              <img src="/article-logo.png" alt="" className="ft__logo-img" aria-hidden="true" />
              <span className="ft__logo-text">Denscope</span>
            </div>

            <p className="ft__tagline">
              Digital News &bull; Scout &bull; Stories &bull; Peak.
            </p>

            {/* REALTIME CLOCK */}
           <div className="ft__clock-wrap">

              <div className="ft__clock-status">
                <span className="ft__live-dot"></span>
                LIVE
              </div>

              <div className="ft__clock-content">
                <div className="ft__clock-time">
                  {time}
                </div>

                <div className="ft__clock-zone">
                  Indonesia • WIB
                </div>
              </div>

            </div>

            <div className="ft__socials">
              <a
                href="https://denis-portofolio.netlify.app/"
                target="_blank"
                rel="noreferrer"
                className="ft__social-btn"
                aria-label="Portfolio Denis"
              >
                <img src="/denis-logo.png" alt="Denis" className="ft__social-custom-img" />
              </a>

              <a
                href="https://www.instagram.com/denscope_/"
                target="_blank"
                rel="noreferrer"
                className="ft__social-btn"
                aria-label="Instagram Denscope"
              >
                <i className="fab fa-instagram" aria-hidden="true" />
              </a>

              <a
                href="https://api.whatsapp.com/send/?phone=6282340987518"
                target="_blank"
                rel="noreferrer"
                className="ft__social-btn"
                aria-label="WhatsApp Denscope"
              >
                <i className="fab fa-whatsapp" aria-hidden="true" />
              </a>
            </div>
          </div>

          {/* KATEGORI */}
          <div className="ft__section">
            <h4 className="ft__heading">
              <span className="ft__heading-accent" aria-hidden="true" />
              Kategori
            </h4>

            <ul className="ft__cat-grid">
              {CATEGORIES.map(({ label, path }) => (
                <li key={path}>
                  <Link to={path} className="ft__cat-link">
                    <i className="fas fa-chevron-right ft__cat-arrow" aria-hidden="true" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* KONTAK */}
          <div className="ft__section">
            <h4 className="ft__heading">
              <span className="ft__heading-accent" aria-hidden="true" />
              Kontak
            </h4>

            <ul className="ft__contact-list">
              <li>
                <a href="mailto:denisryana2012@gmail.com" className="ft__contact-link">
                  <span className="ft__contact-icon">
                    <i className="fas fa-envelope" aria-hidden="true" />
                  </span>
                  <span>denisryana2012@gmail.com</span>
                </a>
              </li>

              <li>
                <a href="tel:+6282340987518" className="ft__contact-link">
                  <span className="ft__contact-icon">
                    <i className="fas fa-phone" aria-hidden="true" />
                  </span>
                  <span>+62-823-4098-7518</span>
                </a>
              </li>

              <li>
                <a
                  href="https://www.instagram.com/denscope_/"
                  target="_blank"
                  rel="noreferrer"
                  className="ft__contact-link"
                >
                  <span className="ft__contact-icon">
                    <i className="fab fa-instagram" aria-hidden="true" />
                  </span>
                  <span>@denscope_</span>
                </a>
              </li>
            </ul>

            <div className="ft__badge">
              <i className="fas fa-shield-alt" aria-hidden="true" />
              Artikel terpercaya &amp; terverifikasi
            </div>
          </div>
        </div>

        {/* ── DIVIDER ── */}
        <div className="ft__divider" aria-hidden="true" />

        {/* ── BOTTOM BAR ── */}
        <div className="ft__bottom">
          <div className="ft__bottom-logo">
            <img src="/article-logo.png" alt="" className="ft__bottom-logo-img" aria-hidden="true" />
            <span>Denscope</span>
          </div>

          <p className="ft__copy">
            © {year} Denscope — All Rights Reserved.
          </p>

          <p className="ft__made">
            Made by Denis
          </p>
        </div>
      </div>
    </footer>
  );
}