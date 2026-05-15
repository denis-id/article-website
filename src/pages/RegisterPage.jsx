import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isValidEmail } from '../utils/helpers';
import { supabase } from '../utils/supabase';
import Swal from 'sweetalert2';

function getPasswordStrength(pw) {
  if (!pw) return { score: 0, label: '', color: '' };
  let score = 0;
  if (pw.length >= 6)  score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { score, label: 'Sangat Lemah', color: '#ef4444' };
  if (score === 2) return { score, label: 'Lemah', color: '#f97316' };
  if (score === 3) return { score, label: 'Cukup', color: '#f59e0b' };
  if (score === 4) return { score, label: 'Kuat', color: '#22c55e' };
  return { score, label: 'Sangat Kuat', color: '#10b981' };
}

export default function RegisterPage() {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();

  const [name,        setName]        = useState('');
  const [email,       setEmail]       = useState('');
  const [password,    setPassword]    = useState('');
  const [confirm,     setConfirm]     = useState('');
  const [showPw,      setShowPw]      = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading,     setLoading]     = useState(false);

  useEffect(() => {
    if (isLoggedIn) navigate('/profile');
  }, [isLoggedIn]);

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !email || !password || !confirm) {
      Swal.fire({
        icon: 'warning',
        title: 'Form Belum Lengkap',
        text: 'Semua field harus diisi!',
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
    if (password.length < 6) {
      Swal.fire({
        icon: 'error',
        title: 'Password Terlalu Pendek',
        text: 'Password minimal 6 karakter!',
        confirmButtonColor: '#ef4444',
      });
      return;
    }
    if (strength.score < 2) {
      Swal.fire({
        icon: 'error',
        title: 'Password Terlalu Lemah',
        text: 'Tambahkan huruf besar, angka, atau simbol agar lebih kuat.',
        confirmButtonColor: '#ef4444',
      });
      return;
    }
    if (password !== confirm) {
      Swal.fire({
        icon: 'error',
        title: 'Password Tidak Cocok',
        text: 'Konfirmasi password tidak sesuai. Periksa kembali.',
        confirmButtonColor: '#ef4444',
      });
      return;
    }

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const demos = ['demo@denscope.com', 'admin@denscope.com'];
    if (demos.includes(email) || users.find(u => u.email === email)) {
      Swal.fire({
        icon: 'info',
        title: 'Email Sudah Terdaftar',
        text: 'Email ini sudah digunakan. Silakan login dengan akun Anda.',
        confirmButtonText: 'Ke Halaman Login',
        confirmButtonColor: '#0f2b3d',
      }).then(() => navigate('/login'));
      return;
    }

    setLoading(true);

    try {
      const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0f2b3d&color=fff&size=128`;
      const memberSince = new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
      const newUser = { name, email, password, avatar, memberSince };
      users.push(newUser);
      localStorage.setItem('users', JSON.stringify(users));

      await supabase.from('admin_users').insert({
        name,
        email,
        password,
        role: 'user',
        avatar,
        bio: '',
      });

      localStorage.setItem('justRegistered', '1');

      Swal.fire({
        icon: 'success',
        title: 'Selamat, Akun Berhasil Dibuat! 🎉',
        html: `Halo <strong>${name}</strong>! Akun Anda sudah siap.<br>Anda akan diarahkan ke halaman login.`,
        confirmButtonColor: '#0f2b3d',
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
      }).then(() => navigate('/login'));
    } catch (err) {
      localStorage.setItem('justRegistered', '1');
      Swal.fire({
        icon: 'success',
        title: 'Akun Berhasil Dibuat! 🎉',
        text: 'Anda akan diarahkan ke halaman login.',
        confirmButtonColor: '#0f2b3d',
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
      }).then(() => navigate('/login'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main>
      <div className="auth-container">
        <div className="auth-wrapper">
          <div className="auth-info">
            <h2>Bergabung dengan Denscope!</h2>
            <p>Buat akun gratis dan nikmati akses penuh ke semua konten eksklusif.</p>
            <ul className="auth-features">
              <li><i className="fas fa-infinity"></i> Akses artikel tanpa batas</li>
              <li><i className="fas fa-bookmark"></i> Simpan artikel favorit</li>
              <li><i className="fas fa-user-circle"></i> Profil personal</li>
              <li><i className="fas fa-shield-alt"></i> Keamanan data terjamin</li>
            </ul>
          </div>

          <div className="auth-form">
            <h2>Daftar</h2>
            <p className="auth-subtitle">Buat akun baru Anda</p>

            <form onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label htmlFor="regName">Nama Lengkap</label>
                <div className="input-wrapper">
                  <i className="fas fa-user"></i>
                  <input type="text" id="regName" placeholder="Nama lengkap Anda"
                    value={name} onChange={e => setName(e.target.value)} required />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="regEmail">Alamat Email</label>
                <div className="input-wrapper">
                  <i className="fas fa-envelope"></i>
                  <input type="email" id="regEmail" placeholder="contoh@email.com"
                    value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="regPassword">Password</label>
                <div className="input-wrapper">
                  <i className="fas fa-lock"></i>
                  <input type={showPw ? 'text' : 'password'} id="regPassword"
                    placeholder="Minimal 6 karakter"
                    value={password} onChange={e => setPassword(e.target.value)} required />
                  <i className={`fas ${showPw ? 'fa-eye' : 'fa-eye-slash'} toggle-password`}
                    style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: 'var(--text-muted)', zIndex: 2 }}
                    onClick={() => setShowPw(!showPw)} />
                </div>

                {/* Password Strength */}
                {password && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ display: 'flex', gap: 4, marginBottom: 5 }}>
                      {[1,2,3,4,5].map(i => (
                        <div key={i} style={{
                          flex: 1, height: 4, borderRadius: 2,
                          background: i <= strength.score ? strength.color : 'var(--border-light)',
                          transition: '0.3s',
                        }} />
                      ))}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                      <span style={{ color: strength.color, fontWeight: 600 }}>{strength.label}</span>
                      <span style={{ color: 'var(--text-muted)' }}>
                        {strength.score < 3 ? 'Tambahkan huruf besar, angka, atau simbol' : 'Password sudah cukup kuat ✓'}
                      </span>
                    </div>
                    <div style={{ marginTop: 6, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {[
                        { label: '6+ karakter', ok: password.length >= 6 },
                        { label: 'Huruf besar', ok: /[A-Z]/.test(password) },
                        { label: 'Angka', ok: /[0-9]/.test(password) },
                        { label: 'Simbol', ok: /[^A-Za-z0-9]/.test(password) },
                      ].map(({ label, ok }) => (
                        <span key={label} style={{
                          fontSize: '0.7rem', padding: '2px 8px', borderRadius: 10,
                          background: ok ? 'rgba(34,197,94,0.12)' : 'var(--bg-surface)',
                          color: ok ? '#22c55e' : 'var(--text-muted)',
                          border: `1px solid ${ok ? 'rgba(34,197,94,0.3)' : 'var(--border-light)'}`,
                          transition: '0.2s',
                        }}>
                          {ok ? '✓' : '○'} {label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="regConfirmPassword">Konfirmasi Password</label>
                <div className="input-wrapper">
                  <i className="fas fa-lock"></i>
                  <input type={showConfirm ? 'text' : 'password'} id="regConfirmPassword"
                    placeholder="Ulangi password Anda"
                    value={confirm} onChange={e => setConfirm(e.target.value)} required />
                  <i className={`fas ${showConfirm ? 'fa-eye' : 'fa-eye-slash'} toggle-password`}
                    style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: 'var(--text-muted)', zIndex: 2 }}
                    onClick={() => setShowConfirm(!showConfirm)} />
                </div>
                {confirm && (
                  <div style={{ marginTop: 6, fontSize: '0.75rem', color: password === confirm ? '#22c55e' : '#ef4444' }}>
                    {password === confirm ? '✓ Password cocok' : '✗ Password tidak cocok'}
                  </div>
                )}
              </div>

              <button type="submit" className="login-btn" disabled={loading}>
                {loading
                  ? <><i className="fas fa-spinner fa-spin"></i> Mendaftar...</>
                  : <><i className="fas fa-user-plus"></i> Daftar Sekarang</>
                }
              </button>
            </form>

            <div className="register-link">
              Sudah punya akun? <Link to="/login">Login sekarang</Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
