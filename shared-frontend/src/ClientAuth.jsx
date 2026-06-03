import { ArrowRight, Lock, Mail, Phone, Scissors, UserRound } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { loginClient, loginClientWithGoogle, registerClient } from './api';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function ClientAuth() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: ''
  });
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const googleButtonRef = useRef(null);

  function completeClientLogin(result) {
    window.localStorage.setItem('stylecut_client_auth', 'true');
    window.localStorage.setItem('stylecut_client_token', result.token);
    window.localStorage.setItem('stylecut_client_profile', JSON.stringify(result.profile));
    window.location.hash = '#/home';
  }

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      return undefined;
    }

    let isMounted = true;

    async function handleGoogleResponse(response) {
      if (!response?.credential) {
        setMessage('Google login did not return a credential.');
        return;
      }

      setIsSubmitting(true);
      setMessage('');

      try {
        const result = await loginClientWithGoogle({ credential: response.credential });
        completeClientLogin(result);
      } catch (error) {
        if (isMounted) {
          setMessage(error.message || 'Google login failed.');
        }
      } finally {
        if (isMounted) {
          setIsSubmitting(false);
        }
      }
    }

    function renderGoogleButton() {
      if (!isMounted || !window.google?.accounts?.id || !googleButtonRef.current) {
        return;
      }

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse
      });

      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: 'outline',
        size: 'large',
        shape: 'rectangular',
        text: mode === 'register' ? 'signup_with' : 'signin_with',
        width: googleButtonRef.current.offsetWidth || 360
      });
    }

    const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existingScript) {
      if (window.google?.accounts?.id) {
        renderGoogleButton();
      } else {
        existingScript.addEventListener('load', renderGoogleButton, { once: true });
      }
    } else {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = renderGoogleButton;
      script.onerror = () => {
        if (isMounted) {
          setMessage('Google login could not be loaded.');
        }
      };
      document.head.appendChild(script);
    }

    return () => {
      isMounted = false;
      existingScript?.removeEventListener('load', renderGoogleButton);
      if (googleButtonRef.current) {
        googleButtonRef.current.innerHTML = '';
      }
    };
  }, [mode]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.email.trim() || !form.password.trim()) {
      setMessage('Please enter your email and password.');
      return;
    }

    if (mode === 'register' && (!form.name.trim() || !form.phone.trim())) {
      setMessage('Please enter your name and phone number.');
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    try {
      const result = mode === 'register'
        ? await registerClient({
            name: form.name.trim(),
            email: form.email.trim(),
            phone: form.phone.trim(),
            password: form.password
          })
        : await loginClient({
            email: form.email.trim(),
            password: form.password
          });

      completeClientLogin(result);
    } catch (error) {
      setMessage(error.message || 'Authentication failed.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-page client-auth-page">
      <section className="auth-shell">
        <a className="auth-brand" href="#/home" aria-label="StyleCut home">
          <span className="brand-mark">
            <Scissors size={22} />
          </span>
          <span className="brand-text">
            <strong>StyleCut</strong>
            <small>Salon Studio</small>
          </span>
        </a>

        <div className="auth-layout">
          <div className="auth-visual client-auth-visual">
            <p>
              {mode === 'login'
                ? 'Book salon services, explore prices, and shop grooming products from one place.'
                : 'Create your client profile to book services, save contact details, and start your salon journey.'}
            </p>
            <h1>{mode === 'login' ? 'Welcome back to your salon studio.' : 'Start your StyleCut experience.'}</h1>
          </div>

          <form className="auth-card" onSubmit={handleSubmit}>
            <div className="auth-card-header">
              <p className="auth-kicker">Client authentication</p>
              <h2>{mode === 'login' ? 'Client Login' : 'Create Client Account'}</h2>
            </div>

            <div className="auth-tabs" aria-label="Client authentication mode">
              <button
                className={mode === 'login' ? 'active' : ''}
                type="button"
                onClick={() => {
                  setMode('login');
                  setMessage('');
                }}
              >
                Login
              </button>
              <button
                className={mode === 'register' ? 'active' : ''}
                type="button"
                onClick={() => {
                  setMode('register');
                  setMessage('');
                }}
              >
                Register
              </button>
            </div>

            {mode === 'register' && (
              <label className="auth-field">
                <span>
                  <UserRound size={17} /> Full name
                </span>
                <input name="name" value={form.name} onChange={handleChange} placeholder="Enter your name" />
              </label>
            )}

            <label className="auth-field">
              <span>
                <Mail size={17} /> Email address
              </span>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
              />
            </label>

            {mode === 'register' && (
              <label className="auth-field">
                <span>
                  <Phone size={17} /> Phone number
                </span>
                <input name="phone" value={form.phone} onChange={handleChange} placeholder="+91 98765 43210" />
              </label>
            )}

            <label className="auth-field">
              <span>
                <Lock size={17} /> Password
              </span>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter password"
              />
            </label>

            {message && <p className="auth-message">{message}</p>}

            <button className="auth-submit" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Please wait...' : mode === 'login' ? 'Login as Client' : 'Register Client'}
              <ArrowRight size={19} />
            </button>

            <div className="auth-divider">
              <span>or</span>
            </div>

            {GOOGLE_CLIENT_ID ? (
              <div className="google-login-shell" ref={googleButtonRef} aria-label="Google login" />
            ) : (
              <p className="auth-message">Add VITE_GOOGLE_CLIENT_ID to enable Google login.</p>
            )}
          </form>
        </div>
      </section>
    </main>
  );
}

export default ClientAuth;
