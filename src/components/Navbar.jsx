import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useArticles } from '../context/ArticlesContext';
import { showToast, getArticleUrl } from '../utils/helpers';
import Swal from 'sweetalert2';

const CATEGORIES = [
  { label: 'Home', path: '/' },
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

export default function Navbar() {
  const { isDark, toggleTheme } = useTheme();
  const { isLoggedIn, userData, logout } = useAuth();
  const { allArticles } = useArticles();
  const navigate = useNavigate();

  const handleLogout = (closeFn) => {
    Swal.fire({
      icon: 'question',
      title: 'Yakin ingin Logout?',
      text: 'Anda akan keluar dari akun Denscope.',
      showCancelButton: true,
      confirmButtonText: 'Ya, Logout',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) {
        logout();
        navigate('/');
        if (closeFn) closeFn();
        Swal.fire({
          icon: 'success',
          title: 'Berhasil Logout',
          text: 'Sampai jumpa lagi! 👋',
          timer: 1500,
          timerProgressBar: true,
          showConfirmButton: false,
        });
      }
    });
  };

  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileDropdownOpen, setMobileDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileSearchQuery, setMobileSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef(null);
  const [spotlightOpen, setSpotlightOpen] = useState(false);
  const spotlightRef = useRef(null);

  // Trending tags
  const tagCount = {};
  (allArticles || []).forEach(a => {
    (a.tags || []).forEach(t => { tagCount[t] = (tagCount[t] || 0) + 1; });
  });
  const trendingTags = Object.entries(tagCount).sort((a, b) => b[1] - a[1]).slice(0, 9).map(e => e[0]);

  const getRecents = () => {
    try { return JSON.parse(localStorage.getItem('recentSearches') || '[]'); } catch { return []; }
  };
  const saveRecent = (q) => {
    let r = getRecents().filter(x => x.toLowerCase() !== q.toLowerCase());
    r.unshift(q); r = r.slice(0, 5);
    localStorage.setItem('recentSearches', JSON.stringify(r));
  };

  const queryArticles = (q) => {
    const low = q.toLowerCase();
    return (allArticles || [])
      .filter(a =>
        a.title?.toLowerCase().includes(low) ||
        a.category?.toLowerCase().includes(low) ||
        (a.tags || []).some(t => t.toLowerCase().includes(low))
      ).slice(0, 5);
  };

  const handleSearch = (q) => {
    if (!q || q.trim().length < 3) { showToast('Minimal 3 karakter untuk pencarian', 'info'); return; }
    saveRecent(q.trim());
    navigate(`/search?q=${encodeURIComponent(q.trim())}`);
    setShowSuggestions(false);
    setSearchQuery('');
    setMobileSearchQuery('');
  };

  const handleSearchKeyDown = (e, q) => {
    if (e.key === 'Enter') handleSearch(q);
    if (e.key === 'Escape') setShowSuggestions(false);
  };

  useEffect(() => {
  const handleKey = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      setSpotlightOpen(true);
    }

    if (e.key === '/') {
      e.preventDefault();
      setSpotlightOpen(true);
    }

    if (e.key === 'Escape') {
      setSpotlightOpen(false);
    }
  };

  window.addEventListener('keydown', handleKey);
  return () => window.removeEventListener('keydown', handleKey);
}, []);
useEffect(() => {
  if (spotlightOpen && spotlightRef.current) {
    spotlightRef.current.focus();
  }
}, [spotlightOpen]);


  useEffect(() => {
    const q = searchQuery || mobileSearchQuery;
    if (q.length > 0) {
      setSuggestions(queryArticles(q));
    }
  }, [searchQuery, mobileSearchQuery]);

  useEffect(() => {
    const handleClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
      setDropdownOpen(false);
      setMobileDropdownOpen(false);
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  return (
    <>
      <header className="navbar">
        <div className="container nav-inner">
          {/* Logo */}
          <div className="logo-wrapper">
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
              <img src="/article-logo.png" alt="Denscope" className="logo-img"
                onError={e => e.target.src = 'https://via.placeholder.com/34x34?text=DS'} />
              <div className="logo">Denscope</div>
            </Link>
          </div>

          {/* Mobile Search */}
         <div className="search-bar-mobile" ref={searchRef}>
  <i className="fas fa-search"></i>
  <input
    type="text"
    placeholder="Cari artikel..."
    value={mobileSearchQuery}
    onChange={e => setMobileSearchQuery(e.target.value)}
    onKeyDown={e => handleSearchKeyDown(e, mobileSearchQuery)}
    onFocus={() => setSpotlightOpen(true)}
    onClick={(e) => e.stopPropagation()}
  />

  {/* 🔥 MOBILE SUGGESTIONS */}
  {showSuggestions && (
     <>
    {/* 🔥 BLUR BACKGROUND */}
    <div
      className="search-overlay"
      onClick={() => setShowSuggestions(false)}
    ></div>

    <div className="search-suggestions mobile show">
      {!mobileSearchQuery.trim() ? (
        <>
          <div className="ss-header">Trending</div>
          <div className="ss-tags">
            {trendingTags.map(t => (
              <Link
                key={t}
                to={`/search?q=${encodeURIComponent(t)}`}
                className="ss-tag"
                onClick={() => setShowSuggestions(false)}
              >
                #{t}
              </Link>
            ))}
          </div>
        </>
      ) : suggestions.length === 0 ? (
        <div className="ss-empty">
          <i className="fas fa-magnifying-glass"></i>
          Tidak ada hasil untuk <strong>"{mobileSearchQuery}"</strong>
        </div>
      ) : (
        <>
          <div className="ss-header">Artikel</div>
          {suggestions.map(a => (
            <Link
              key={a.id}
              to={getArticleUrl(a)}
              className="ss-item"
              onClick={() => {
                saveRecent(mobileSearchQuery);
                setShowSuggestions(false);
              }}
            >
                 {/* 🔥 THUMBNAIL */}
              {a.image ? (
                <img className="ss-thumb" src={a.image} alt={a.title} />
              ) : (
                <div className="ss-icon">
                  <i className="fas fa-newspaper"></i>
                </div>
              )}

              <div className="ss-text">
                <div className="ss-title">{a.title}</div>
                <div className="ss-meta">{a.category}</div>
               </div>
            </Link>
          ))}

           {/* 🔥 LIHAT SEMUA */}
           <Link
            to={`/search?q=${encodeURIComponent(mobileSearchQuery)}`}
            className="ss-view-all"
            onClick={() => setShowSuggestions(false)}
          >
            Lihat semua hasil →
          </Link>
        </>
      )}
    </div>
   </>
)}
 </div>

          {/* Mobile Right Actions */}
          <div className="mobile-right-actions">
            <button className="theme-toggle" onClick={toggleTheme} title="Ganti tema">
              <i className={`fas ${isDark ? 'fa-sun' : 'fa-moon'}`}></i>
            </button>
            <button className="user-menu-mobile" onClick={(e) => { e.stopPropagation(); setMobileDropdownOpen(!mobileDropdownOpen); }} title="Akun">
              {isLoggedIn && userData.avatar
                ? <img src={userData.avatar} alt="avatar" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
                : <i className="fas fa-user-circle"></i>
              }
            </button>
            <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} title="Menu">
              <i className="fas fa-bars"></i>
            </button>
          </div>

          {/* Nav Links */}
          <nav className={`nav-links ${menuOpen ? 'active' : ''}`} id="navLinks">
            <button className="nav-drawer-close" onClick={() => setMenuOpen(false)}>
              <i className="fas fa-chevron-left"></i><span>Menu</span>
            </button>
            {CATEGORIES.map(cat => (
              <Link key={cat.path} to={cat.path} onClick={() => setMenuOpen(false)}>
                {cat.label}
              </Link>
            ))}
          </nav>

          {/* Nav Actions */}
          <div className="nav-actions" ref={searchRef}>
            <div className={`search-bar ${showSuggestions ? 'active' : ''}`}>
              <i className="fas fa-search"></i>
              <input
                type="text"
                placeholder="Cari artikel..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onFocus={() =>  setSpotlightOpen(true)}
                onKeyDown={e => handleSearchKeyDown(e, searchQuery)}
              />
              {/* Search Suggestions */}
              {showSuggestions && (
                <div className="search-suggestions show" style={{ position: 'absolute', top: '100%', zIndex: 9999, width: 420, marginTop: 8 }}>
                  {!searchQuery ? (
                    <>
                      {getRecents().length > 0 && (
                        <>
                          <div className="ss-header">Terakhir Dicari
                            <button className="ss-clear-btn" onClick={() => { localStorage.removeItem('recentSearches'); setShowSuggestions(false); }}>Hapus semua</button>
                          </div>
                          {getRecents().map(r => (
                            <div key={r} className="ss-item ss-recent" onClick={() => handleSearch(r)}>
                              <div className="ss-icon"><i className="fas fa-history"></i></div>
                              <div className="ss-text"><div className="ss-title">{r}</div></div>
                            </div>
                          ))}
                          <div className="ss-divider"></div>
                        </>
                      )}
                      <div className="ss-header">Trending</div>
                      <div className="ss-tags">
                        {trendingTags.map(t => (
                          <Link key={t} to={`/search?q=${encodeURIComponent(t)}`} className="ss-tag" onClick={() => setShowSuggestions(false)}>#{t}</Link>
                        ))}
                      </div>
                    </>
                  ) : suggestions.length === 0 ? (
                    <div className="ss-empty">
                      <i className="fas fa-magnifying-glass"></i>Tidak ada hasil untuk <strong>"{searchQuery}"</strong>
                    </div>
                  ) : (
                    <>
                      <div className="ss-header">Artikel</div>
                      {suggestions.map(a => (
                        <Link key={a.id} to={getArticleUrl(a)} className="ss-item" onClick={() => { saveRecent(searchQuery); setShowSuggestions(false); }}>
                          {a.image ? <img className="ss-thumb" src={a.image} alt="" /> : <div className="ss-icon"><i className="fas fa-newspaper"></i></div>}
                          <div className="ss-text">
                            <div className="ss-title">{a.title}</div>
                            <div className="ss-meta"><span style={{ textTransform: 'capitalize' }}>{a.category}</span> · {a.date}</div>
                          </div>
                        </Link>
                      ))}
                      <Link to={`/search?q=${encodeURIComponent(searchQuery)}`} className="ss-view-all" onClick={() => setShowSuggestions(false)}>
                        Lihat semua hasil &nbsp;<i className="fas fa-arrow-right" style={{ fontSize: '0.75rem' }}></i>
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>

            <button className="theme-toggle" onClick={toggleTheme} title="Ganti tema">
              <i className={`fas ${isDark ? 'fa-sun' : 'fa-moon'}`}></i>
            </button>

            {/* User Menu */}
            <div className="user-menu" id="userMenu" onClick={(e) => { e.stopPropagation(); setDropdownOpen(!dropdownOpen); }}>
              {isLoggedIn && userData.avatar
                ? <img src={userData.avatar} alt="avatar" id="navAvatarImg" style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent)', cursor: 'pointer', display: 'block' }} />
                : <i className="fas fa-user-circle" style={isLoggedIn ? { color: 'var(--accent)', fontSize: '1.8rem' } : {}}></i>
              }
              {dropdownOpen && (
                <div className="user-dropdown show" id="userDropdown" onClick={e => e.stopPropagation()}>
                  {isLoggedIn && userData.name && (
                    <div className="dropdown-greeting" style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--border-light)', marginBottom: 6 }}>
                      {userData.avatar
                        ? <img src={userData.avatar} alt="avatar" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid var(--border-light)' }} />
                        : <i className="fas fa-user-circle" style={{ fontSize: '1.8rem', color: 'var(--accent)', flexShrink: 0 }}></i>
                      }
                      <div style={{ overflow: 'hidden', minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-primary)' }}>{userData.name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{userData.email || ''}</div>
                      </div>
                    </div>
                  )}
                  {!isLoggedIn && <Link to="/login" onClick={() => setDropdownOpen(false)}><i className="fas fa-sign-in-alt"></i> Login</Link>}
                  {!isLoggedIn && <Link to="/register" onClick={() => setDropdownOpen(false)}><i className="fas fa-user-plus"></i> Daftar</Link>}
                  <Link to="/profile" onClick={() => setDropdownOpen(false)}><i className="fas fa-user"></i> Profil</Link>
                  <Link to="/profile" onClick={() => setDropdownOpen(false)}><i className="fas fa-bookmark"></i> Tersimpan</Link>
                  <Link to="/profile#liked" onClick={() => { setDropdownOpen(false); setTimeout(() => window.dispatchEvent(new HashChangeEvent('hashchange')), 100); }}><i className="fas fa-heart"></i> Disukai</Link>
                  <Link to="/profile" onClick={() => setDropdownOpen(false)}><i className="fas fa-history"></i> Riwayat</Link>
                  {isLoggedIn && (
                    <>
                      <div className="dropdown-divider"></div>
                      <a href="#" style={{ color: '#ef4444' }} onClick={e => { e.preventDefault(); handleLogout(() => setDropdownOpen(false)); }}>
                        <i className="fas fa-sign-out-alt"></i> Logout
                      </a>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Dropdown */}
      {mobileDropdownOpen && (
        <div className="user-dropdown-mobile show" onClick={e => e.stopPropagation()}>
          {isLoggedIn && userData.name && (
            <div className="dropdown-greeting" style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--border-light)', marginBottom: 6 }}>
              {userData.avatar
                ? <img src={userData.avatar} alt="avatar" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                : <i className="fas fa-user-circle" style={{ fontSize: '1.8rem', color: 'var(--accent)' }}></i>
              }
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{userData.name}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{userData.email}</div>
              </div>
            </div>
          )}
          {!isLoggedIn && <Link to="/login" onClick={() => setMobileDropdownOpen(false)}><i className="fas fa-sign-in-alt"></i> Login</Link>}
          {!isLoggedIn && <Link to="/register" onClick={() => setMobileDropdownOpen(false)}><i className="fas fa-user-plus"></i> Daftar</Link>}
          <Link to="/profile" onClick={() => setMobileDropdownOpen(false)}><i className="fas fa-user"></i> Profil</Link>
          <Link to="/profile" onClick={() => setMobileDropdownOpen(false)}><i className="fas fa-bookmark"></i> Tersimpan</Link>
          <Link to="/profile#liked" onClick={() => { setMobileDropdownOpen(false); setTimeout(() => window.dispatchEvent(new HashChangeEvent('hashchange')), 100); }}><i className="fas fa-heart"></i> Disukai</Link>
          <Link to="/profile" onClick={() => setMobileDropdownOpen(false)}><i className="fas fa-history"></i> Riwayat</Link>
          {isLoggedIn && (
            <>
              <div className="dropdown-divider"></div>
              <a href="#" style={{ color: '#ef4444' }} onClick={e => { e.preventDefault(); handleLogout(() => setMobileDropdownOpen(false)); }}>
                <i className="fas fa-sign-out-alt"></i> Logout
              </a>
            </>
          )}
        </div>
      )}

      {/* Mobile Nav Overlay */}
      {menuOpen && <div className="nav-overlay active" onClick={() => setMenuOpen(false)}></div>}
            {/* 🔥 GLOBAL SPOTLIGHT (WAJIB DI LUAR HEADER) */}
      {spotlightOpen && (
        <div
          className="spotlight-overlay"
          onClick={() => setSpotlightOpen(false)}
        >
          <div
            className="spotlight-box"
            onClick={(e) => e.stopPropagation()}
          >
            {/* INPUT */}
            <div className="spotlight-input">
              <i className="fas fa-search"></i>
              <input
                ref={spotlightRef}
                type="text"
                placeholder="Cari artikel, topik, atau tag..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => handleSearchKeyDown(e, searchQuery)}
              />
            </div>

            {/* CONTENT */}
            <div className="spotlight-content">
              {!searchQuery.trim() ? (
                <>
                  <div className="ss-header">Trending</div>
                  <div className="ss-tags">
                    {trendingTags.map(t => (
                      <div
                        key={t}
                        className="ss-tag"
                        onClick={() => {
                          handleSearch(t);
                          setSpotlightOpen(false);
                        }}
                      >
                        #{t}
                      </div>
                    ))}
                  </div>
                </>
              ) : suggestions.length === 0 ? (
                <div className="ss-empty">
                  Tidak ada hasil untuk <strong>"{searchQuery}"</strong>
                </div>
              ) : (
                <>
                  <div className="ss-header">Artikel</div>

                  {suggestions.map(a => (
                    <div
                      key={a.id}
                      className="spotlight-item"
                      onClick={() => {
                        navigate(getArticleUrl(a));
                        setSpotlightOpen(false);
                      }}
                    >
                      {a.image ? (
                        <img src={a.image} alt={a.title} />
                      ) : (
                        <div className="ss-icon">
                          <i className="fas fa-newspaper"></i>
                        </div>
                      )}

                      <div className="spotlight-text">
                        <div className="title">{a.title}</div>
                        <div className="meta">{a.category}</div>
                      </div>
                    </div>
                  ))}

                  <div
                    className="spotlight-view-all"
                    onClick={() => {
                      handleSearch(searchQuery);
                      setSpotlightOpen(false);
                    }}
                  >
                    Lihat semua hasil →
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}