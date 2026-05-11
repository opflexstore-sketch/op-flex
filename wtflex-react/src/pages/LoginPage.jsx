import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import OpLogo from '../components/OpLogo.jsx';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || '/';
  const { user, requestOTP, verifyOTP } = useAuth();

  const [stage, setStage] = useState('email'); // 'email' | 'otp'
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isReturning, setIsReturning] = useState(false);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (user) navigate(redirectTo, { replace: true });
  }, [user, navigate, redirectTo]);

  function startCooldown() {
    setResendCooldown(30);
    const id = setInterval(() => {
      setResendCooldown((s) => {
        if (s <= 1) { clearInterval(id); return 0; }
        return s - 1;
      });
    }, 1000);
  }

  const sendOtp = async (e) => {
    e?.preventDefault();
    setErr('');
    setLoading(true);
    try {
      const { isReturning } = await requestOTP(email);
      setIsReturning(isReturning);
      setStage('otp');
      startCooldown();
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  const verify = async (e) => {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      await verifyOTP({ email, otp });
      navigate(redirectTo, { replace: true });
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setErr('');
    setOtp('');
    try {
      await requestOTP(email);
      startCooldown();
    } catch (e) {
      setErr(e.message);
    }
  };

  return (
    <section className="auth-page">
      <div className="auth-card">
        <Link to="/" className="logo auth-logo">
          <OpLogo size={48} className="logo-svg" />
          <span className="logo-text">OP Flex</span>
        </Link>

        {stage === 'email' ? (
          <form className="auth-form" onSubmit={sendOtp}>
            <p className="kicker">SIGN IN</p>
            <h2>Drop your email.<br/>We'll send a code.</h2>
            <p className="muted">No passwords. Just a 6-digit code straight to your inbox.</p>

            <label>
              <span>Email</span>
              <input
                type="email"
                required
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </label>

            {err && <p className="auth-err">{err}</p>}

            <button className="btn btn-primary btn-block" disabled={loading}>
              {loading ? 'Sending code…' : 'SEND CODE →'}
            </button>

            <p className="muted small">By continuing, you agree to our terms & privacy policy.</p>
          </form>
        ) : (
          <form className="auth-form" onSubmit={verify}>
            <p className="kicker">{isReturning ? 'WELCOME BACK' : 'ALMOST IN'}</p>
            <h2>Check your inbox 📬</h2>
            <p className="muted">
              We sent a 6-digit code to <b>{email}</b>. Enter it below to {isReturning ? 'sign in' : 'create your account'}.
            </p>

            <label>
              <span>Verification code</span>
              <input
                type="text"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="otp-input"
                autoFocus
              />
            </label>

            {err && <p className="auth-err">{err}</p>}

            <button className="btn btn-primary btn-block" disabled={loading || otp.length !== 6}>
              {loading ? 'Verifying…' : 'VERIFY & CONTINUE →'}
            </button>

            <div className="auth-foot">
              <button
                type="button"
                className="link-btn"
                onClick={() => { setStage('email'); setOtp(''); setErr(''); }}
              >
                ← Use a different email
              </button>
              <button
                type="button"
                className="link-btn"
                disabled={resendCooldown > 0}
                onClick={resend}
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
