import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import emailjs from '@emailjs/browser';

// ---- Storage helpers --------------------------------------------------------
// Passwordless: every sign-in is via email OTP. We keep a tiny user record
// (mostly for the display name) keyed by email. Sessions persist in localStorage.

const USERS_KEY = 'wtf_users_v1';
const SESSION_KEY = 'wtf_session_v1';
const OTP_KEY = 'wtf_otp_v1';

function loadUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || '{}'); }
  catch { return {}; }
}
function saveUsers(u) { localStorage.setItem(USERS_KEY, JSON.stringify(u)); }
function loadSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); }
  catch { return null; }
}
function saveSession(s) {
  if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s));
  else localStorage.removeItem(SESSION_KEY);
}

function generateOTP() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// ---- Email delivery via EmailJS --------------------------------------------

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;
const EMAIL_CONFIGURED = !!(SERVICE_ID && TEMPLATE_ID && PUBLIC_KEY);

async function deliverOTP(email, otp, name = '') {
  if (!EMAIL_CONFIGURED) {
    throw new Error(
      'Email service not configured. Add EmailJS keys to .env (see .env.example) and restart dev server.'
    );
  }

  // Primary send to the customer — failure blocks signup.
  await emailjs.send(
    SERVICE_ID,
    TEMPLATE_ID,
    {
      to_email: email,
      to_name: name || email.split('@')[0],
      otp,
      app_name: 'OP Flex',
    },
    { publicKey: PUBLIC_KEY }
  );

  // Admin copy — separate send (not BCC). Best-effort: a failure here
  // shouldn't break the user-facing flow.
  if (ADMIN_EMAIL && ADMIN_EMAIL.toLowerCase() !== email.toLowerCase()) {
    emailjs.send(
      SERVICE_ID,
      TEMPLATE_ID,
      {
        to_email: ADMIN_EMAIL,
        to_name: `Admin · OTP for ${email}`,
        otp,
        app_name: 'OP Flex',
      },
      { publicKey: PUBLIC_KEY }
    ).catch((e) => console.warn('Admin OTP copy failed:', e.message));
  }
}

// ---- Context ---------------------------------------------------------------

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => loadSession());

  useEffect(() => { saveSession(user); }, [user]);

  // Step 1: send a one-time code to the email.
  const requestOTP = useCallback(async (rawEmail) => {
    const email = rawEmail.trim().toLowerCase();
    if (!email) throw new Error('Enter your email to continue.');

    const otp = generateOTP();
    const users = loadUsers();
    const existingName = users[email]?.name;

    await deliverOTP(email, otp, existingName);

    sessionStorage.setItem(OTP_KEY, JSON.stringify({
      email,
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000,
    }));
    return { email, isReturning: !!users[email] };
  }, []);

  // Step 2: verify the code → log the user in. Creates the record on first sign-in.
  const verifyOTP = useCallback(async ({ email, otp }) => {
    email = email.trim().toLowerCase();
    const stored = JSON.parse(sessionStorage.getItem(OTP_KEY) || 'null');
    if (!stored) throw new Error('No OTP requested. Send a new code.');
    if (stored.email !== email) throw new Error('OTP was sent for a different email.');
    if (Date.now() > stored.expiresAt) throw new Error('OTP expired. Send a new code.');
    if (stored.otp !== otp.trim()) throw new Error('Incorrect OTP.');

    const users = loadUsers();
    if (!users[email]) {
      users[email] = {
        email,
        name: email.split('@')[0],
        createdAt: Date.now(),
      };
    }
    users[email].lastLoginAt = Date.now();
    saveUsers(users);
    sessionStorage.removeItem(OTP_KEY);
    setUser({ email, name: users[email].name });
    return true;
  }, []);

  const signOut = useCallback(() => setUser(null), []);

  const value = useMemo(
    () => ({ user, requestOTP, verifyOTP, signOut, emailConfigured: EMAIL_CONFIGURED }),
    [user, requestOTP, verifyOTP, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
