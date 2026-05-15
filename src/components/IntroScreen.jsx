import { useEffect, useState } from 'react';

export default function IntroScreen({ onClose }) {
  const [closing, setClosing] = useState(false);
  const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);

  useEffect(() => {
    const closeIntro = () => {
      if (closing) return;
      setClosing(true);
      setTimeout(onClose, 650);
    };

    const timer = setTimeout(() => {
      window.addEventListener('keydown', closeIntro);
      window.addEventListener('click', closeIntro);
      window.addEventListener('touchend', closeIntro);
    }, 800);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', closeIntro);
      window.removeEventListener('click', closeIntro);
      window.removeEventListener('touchend', closeIntro);
    };
  }, [closing, onClose]);

  const handleClose = (e) => {
    e.stopPropagation();
    setClosing(true);
    setTimeout(onClose, 650);
  };

  const particles = Array.from({ length: 8 }, (_, i) => ({
    size: 24 + Math.random() * 40,
    left: 10 + i * 11 + Math.random() * 6,
    bottom: 5 + Math.random() * 20,
    duration: 3.5 + i * 0.6,
    delay: i * 0.4,
  }));

  return (
    <div id="introScreen" className={closing ? 'closing' : ''}>
      <div className="intro-particles" id="introParticles">
        {particles.map((p, i) => (
          <div
            key={i}
            className="intro-particle"
            style={{
              width: p.size,
              height: p.size,
              left: `${p.left}%`,
              bottom: `${p.bottom}%`,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}
      </div>

      <div className="intro-card" id="introCard">
        <img src="/article-logo-opening.png" alt="Denscope" className="intro-logo" id="introLogo" />
        <h1 className="intro-title">Denscope</h1>
        <p className="intro-sub">Digital News &bull; Scout &bull; Stories &bull; Peak</p>
        <button id="enterBtn" className="intro-btn" onClick={handleClose}>
          <span id="enterBtnLabel">{isMobile ? 'Tap anywhere to continue' : 'Press any key to continue'}</span>
        </button>
      </div>
    </div>
  );
}
