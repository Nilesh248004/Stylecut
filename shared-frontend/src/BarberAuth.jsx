import { ArrowRight, Lock, Scissors, ShieldCheck, UserRound } from 'lucide-react';
import { useState } from 'react';
import { loginBarber } from './api';

function BarberAuth() {
  const [form, setForm] = useState({
    staffId: '',
    accessCode: ''
  });
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.staffId.trim() || !form.accessCode.trim()) {
      setMessage('Please enter your staff ID and access code.');
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    try {
      const result = await loginBarber({
        staffId: form.staffId.trim(),
        accessCode: form.accessCode
      });

      window.localStorage.setItem('stylecut_barber_auth', 'true');
      window.localStorage.setItem('stylecut_barber_token', result.token);
      window.localStorage.setItem('stylecut_barber_profile', JSON.stringify(result.profile));
      window.location.hash = '#/barber';
    } catch (error) {
      setMessage(error.message || 'Barber login failed.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-page barber-auth-page">
      <section className="auth-shell">
        <a className="auth-brand" href="#/barber" aria-label="StyleCut barber home">
          <span className="brand-mark">
            <Scissors size={22} />
          </span>
          <span className="brand-text">
            <strong>StyleCut</strong>
            <small>Barber Access</small>
          </span>
        </a>

        <div className="auth-layout">
          <div className="auth-visual barber-auth-visual">
            <p>Manage bookings, accept home service requests, and send client confirmations.</p>
            <h1>Barber workspace for daily salon operations.</h1>
          </div>

          <form className="auth-card barber-auth-card" onSubmit={handleSubmit}>
            <div className="auth-card-header">
              <p className="auth-kicker">
                <ShieldCheck size={17} /> Barber authentication
              </p>
              <h2>Barber Login</h2>
            </div>

            <label className="auth-field">
              <span>
                <UserRound size={17} /> Staff ID
              </span>
              <input name="staffId" value={form.staffId} onChange={handleChange} placeholder="Enter staff ID" />
            </label>

            <label className="auth-field">
              <span>
                <Lock size={17} /> Access code
              </span>
              <input
                name="accessCode"
                type="password"
                value={form.accessCode}
                onChange={handleChange}
                placeholder="Enter access code"
              />
            </label>

            {message && <p className="auth-message">{message}</p>}

            <button className="auth-submit" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Checking access...' : 'Open Barber Dashboard'}
              <ArrowRight size={19} />
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

export default BarberAuth;
