import { useState, useEffect, useRef } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
} from 'react-router-dom';

import { AnimatePresence } from 'framer-motion';
import LoadingBar from 'react-top-loading-bar';

import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { ArticlesProvider } from './context/ArticlesContext';
import { CategoriesProvider } from './context/CategoriesContext';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import BackToTop from './components/BackToTop';
import IntroScreen from './components/IntroScreen';
import PageTransition from './components/PageTransition';

import HomePage from './pages/HomePage';
import ArticlePage from './pages/ArticlePage';
import CategoryPage from './pages/CategoryPage';
import SearchPage from './pages/SearchPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';

function TopLoader() {
  const ref = useRef(null);
  const location = useLocation();

  useEffect(() => {
    ref.current?.continuousStart();

    const timer = setTimeout(() => {
      ref.current?.complete();
    }, 500);

    return () => clearTimeout(timer);
  }, [location]);

  return (
    <LoadingBar
      color="#00b7ff"
      height={3}
      shadow={true}
      ref={ref}
    />
  );
}

function AppContent() {
  const location = useLocation();

  const [showIntro, setShowIntro] = useState(() => {
    return !sessionStorage.getItem('introShown');
  });

  const handleIntroClose = () => {
    sessionStorage.setItem('introShown', '1');
    setShowIntro(false);
  };

  return (
    <>
      {showIntro && <IntroScreen onClose={handleIntroClose} />}

      <TopLoader />

      <Navbar />

      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route
            path="/"
            element={
              <PageTransition>
                <HomePage />
              </PageTransition>
            }
          />

          {/* 
            Route artikel yang support:
            - /article/123 (ID)
            - /article/cara-membuat-website (slug)
            - /article/Cara%20Membuat%20Website (title/encoded)
          */}
          <Route
            path="/article/:id"
            element={
              <PageTransition>
                <ArticlePage />
              </PageTransition>
            }
          />

          <Route
            path="/category/:cat"
            element={
              <PageTransition>
                <CategoryPage />
              </PageTransition>
            }
          />

          <Route
            path="/category"
            element={
              <PageTransition>
                <CategoryPage />
              </PageTransition>
            }
          />

          <Route
            path="/search"
            element={
              <PageTransition>
                <SearchPage />
              </PageTransition>
            }
          />

          <Route
            path="/login"
            element={
              <PageTransition>
                <LoginPage />
              </PageTransition>
            }
          />

          <Route
            path="/register"
            element={
              <PageTransition>
                <RegisterPage />
              </PageTransition>
            }
          />

          <Route
            path="/profile"
            element={
              <PageTransition>
                <ProfilePage />
              </PageTransition>
            }
          />

          <Route
            path="*"
            element={
              <PageTransition>
                <NotFound />
              </PageTransition>
            }
          />
        </Routes>
      </AnimatePresence>

      <Footer />
      <BackToTop />
    </>
  );
}

function NotFound() {
  return (
    <main>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          gap: '1rem',
          textAlign: 'center',
          padding: '2rem',
        }}
      >
        <i
          className="fas fa-exclamation-triangle"
          style={{
            fontSize: '3rem',
            color: '#f59e0b',
          }}
        ></i>

        <h2>404 - Halaman Tidak Ditemukan</h2>

        <p
          style={{
            color: 'var(--text-muted)',
          }}
        >
          Halaman yang Anda cari tidak ada.
        </p>

        <a
          href="/"
          style={{
            padding: '0.7rem 1.5rem',
            background: 'var(--accent)',
            color: '#fff',
            borderRadius: '12px',
            textDecoration: 'none',
            fontWeight: 600,
            transition: '0.3s',
          }}
        >
          Kembali ke Beranda
        </a>
      </div>
    </main>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <ArticlesProvider>
            <CategoriesProvider>
              <AppContent />
            </CategoriesProvider>
          </ArticlesProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}