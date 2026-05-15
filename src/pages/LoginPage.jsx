import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isValidEmail } from '../utils/helpers';
import Swal from 'sweetalert2';

export default function LoginPage() {
  const { isLoggedIn, login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  useEffect(() => {
    if (isLoggedIn) { navigate('/profile'); return; }
    const saved = localStorage.getItem('rememberedEmail');
    if (saved) { setEmail(saved); setRemember(true); }
    if (localStorage.getItem('justRegistered') === '1') {
      localStorage.removeItem('justRegistered');
      Swal.fire({
        icon: 'success',
        title: 'Registrasi Berhasil! 🎉',
        text: 'Akun Anda telah dibuat. Silakan login untuk melanjutkan.',
        confirmButtonText: 'Siap, Login!',
        confirmButtonColor: '#0f2b3d',
        timer: 4000,
        timerProgressBar: true,
      });
    }
  }, [isLoggedIn]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!email || !password) {
      Swal.fire({
        icon: 'warning',
        title: 'Form Belum Lengkap',
        text: 'Email dan password wajib diisi!',
        confirmButtonColor: '#f59e0b',
      });
      return;
    }
    if (!isValidEmail(email)) {
      Swal.fire({
        icon: 'error',
        title: 'Format Email Salah',
        text: 'Masukkan alamat email yang valid.',
        confirmButtonColor: '#ef4444',
      });
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const demoAccounts = [
        { email: 'demo@denscope.com', password: 'demo123', name: 'Demo User' },
        { email: 'admin@denscope.com', password: 'admin123', name: 'Admin' },
      ];
      const user = users.find(u => u.email === email && u.password === password);
      const demoUser = demoAccounts.find(u => u.email === email && u.password === password);

      if (user || demoUser) {
        const loggedUser = user || demoUser;
        if (remember) localStorage.setItem('rememberedEmail', email);
        else localStorage.removeItem('rememberedEmail');

        login({
          name: loggedUser.name || email.split('@')[0],
          email,
          avatar: loggedUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(loggedUser.name || email)}&background=0f2b3d&color=fff`,
          memberSince: loggedUser.memberSince || new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
        });

        Swal.fire({
          icon: 'success',
          title: `Selamat Datang, ${loggedUser.name || email.split('@')[0]}! 🚀`,
          text: 'Login berhasil. Anda akan dialihkan ke halaman utama.',
          confirmButtonColor: '#0f2b3d',
          timer: 1800,
          timerProgressBar: true,
          showConfirmButton: false,
        }).then(() => navigate('/'));
      } else {
        setLoading(false);
        Swal.fire({
          icon: 'error',
          title: 'Login Gagal',
          text: 'Email atau password yang Anda masukkan salah. Coba lagi.',
          confirmButtonText: 'Coba Lagi',
          confirmButtonColor: '#ef4444',
          footer: '<a href="#" id="swal-forgot-link">Lupa password?</a>',
          didOpen: () => {
            const link = document.getElementById('swal-forgot-link');
            if (link) link.addEventListener('click', (e) => {
              e.preventDefault();
              Swal.close();
              setShowForgot(true);
            });
          },
        });
      }
    }, 800);
  };

  const handleForgotSend = () => {
    if (!resetEmail || !isValidEmail(resetEmail)) {
      Swal.fire({
        icon: 'warning',
        title: 'Email Tidak Valid',
        text: 'Masukkan email yang valid untuk reset password.',
        confirmButtonColor: '#f59e0b',
      });
      return;
    }
    setShowForgot(false);
    Swal.fire({
      icon: 'success',
      title: 'Email Terkirim! 📧',
      html: `Link reset password telah dikirim ke<br><strong>${resetEmail}</strong><br><span style="font-size:0.85rem;color:#6b7280;">Cek kotak masuk atau folder spam Anda.</span>`,
      confirmButtonText: 'Oke',
      confirmButtonColor: '#0f2b3d',
    });
    setResetEmail('');
  };

  return (
    <main>
      <div className="auth-container">
        <div className="auth-wrapper">
          <div className="auth-info">
            <h2>Selamat Datang Kembali! 👋</h2>
            <p>Masuk ke akun Anda untuk mengakses artikel, menyimpan konten favorit, dan mendapatkan rekomendasi personalisasi.</p>
            <ul className="auth-features">
              <li><i className="fas fa-bookmark"></i> Simpan artikel favorit</li>
              <li><i className="fas fa-bell"></i> Notifikasi berita terbaru</li>
              <li><i className="fas fa-chart-line"></i> Rekomendasi personalisasi</li>
              <li><i className="fas fa-comments"></i> Berkomentar dan berdiskusi</li>
            </ul>
          </div>

          <div className="auth-form">
            <h2>Login</h2>
            <p className="auth-subtitle">Masukkan email dan password Anda</p>

            <form id="loginForm" onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label htmlFor="loginEmail">Alamat Email</label>
                <div className="input-wrapper">
                  <i className="fas fa-envelope"></i>
                  <input type="email" id="loginEmail" placeholder="contoh@email.com"
                    value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="loginPassword">Password</label>
                <div className="input-wrapper">
                  <i className="fas fa-lock"></i>
                  <input type={showPw ? 'text' : 'password'} id="loginPassword" placeholder="Masukkan password"
                    value={password} onChange={e => setPassword(e.target.value)} required />
                  <i className={`fas ${showPw ? 'fa-eye' : 'fa-eye-slash'}`} id="togglePassword"
                    style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: 'var(--text-muted)', zIndex: 2 }}
                    onClick={() => setShowPw(!showPw)} />
                </div>
              </div>

              <div className="form-options">
                <label className="checkbox-label">
                  <input type="checkbox" id="rememberMe" checked={remember} onChange={e => setRemember(e.target.checked)} /> Ingat saya
                </label>
                <a href="#" className="forgot-link" id="forgotPassword" onClick={e => { e.preventDefault(); setShowForgot(true); }}>Lupa password?</a>
              </div>

              <button type="submit" className="login-btn" id="loginBtn" disabled={loading}>
                {loading
                  ? <><i className="fas fa-spinner fa-spin"></i> Memproses...</>
                  : <><i className="fas fa-sign-in-alt"></i> Login</>
                }
              </button>
            </form>

            <div className="demo-hint" style={{ marginTop: 16, padding: '12px 16px', background: 'var(--accent-soft)', borderRadius: 12, fontSize: '0.82rem', color: 'var(--text-muted)', border: '1px solid var(--border-light)' }}>
              <i className="fas fa-info-circle" style={{ color: 'var(--accent)', marginRight: 6 }}></i>
              Demo: <strong>demo@denscope.com</strong> / <strong>demo123</strong>
            </div>

            <div className="register-link">
              Belum punya akun? <Link to="/register">Daftar sekarang</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgot && (
        <div id="forgotModal" className="modal-overlay" style={{ display: 'flex' }}>
          <div className="modal-content">
            <h3><i className="fas fa-key"></i> Reset Password</h3>
            <p>Masukkan email Anda dan kami akan mengirimkan link reset password.</p>
            <div className="form-group" style={{ marginTop: 16 }}>
              <label>Alamat Email</label>
              <div className="input-wrapper">
                <i className="fas fa-envelope"></i>
                <input type="email" id="resetEmail" placeholder="contoh@email.com"
                  value={resetEmail} onChange={e => setResetEmail(e.target.value)} />
              </div>
            </div>
            <div className="modal-buttons">
              <button type="button" onClick={() => setShowForgot(false)}>Batal</button>
              <button type="button" id="sendResetLink" onClick={handleForgotSend}>Kirim Link</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
