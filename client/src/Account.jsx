import {
  CalendarCheck,
  Home,
  Mail,
  MessageSquareText,
  Phone,
  Scissors,
  ShoppingBag,
  Star,
  UserRound
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { getAppointments, getProductOrders } from './api';

function readClientProfile() {
  try {
    return JSON.parse(window.localStorage.getItem('stylecut_client_profile')) || {};
  } catch {
    return {};
  }
}

function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizePhone(value) {
  return String(value || '').replace(/\D/g, '');
}

function readFeedback() {
  try {
    return JSON.parse(window.localStorage.getItem('stylecut_client_feedback')) || [];
  } catch {
    return [];
  }
}

function readRating() {
  return Number(window.localStorage.getItem('stylecut_client_rating')) || 0;
}

const accountSections = [
  { id: 'services', label: 'Service Received', icon: CalendarCheck },
  { id: 'products', label: 'Products Ordered', icon: ShoppingBag },
  { id: 'feedback', label: 'Feedback', icon: MessageSquareText },
  { id: 'rating', label: 'Rating for Service', icon: Star }
];

function Account() {
  const [profile] = useState(readClientProfile);
  const [appointments, setAppointments] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activeSection, setActiveSection] = useState('services');
  const [feedback, setFeedback] = useState('');
  const [feedbackList, setFeedbackList] = useState(readFeedback);
  const [rating, setRating] = useState(readRating);

  const clientEmail = normalize(profile.email);
  const clientPhone = normalizePhone(profile.phone);

  useEffect(() => {
    async function loadAccount() {
      const [appointmentData, orderData] = await Promise.allSettled([
        getAppointments(),
        getProductOrders()
      ]);

      setAppointments(appointmentData.status === 'fulfilled' ? appointmentData.value : []);
      setOrders(orderData.status === 'fulfilled' ? orderData.value : []);
    }

    loadAccount();
  }, []);

  const clientAppointments = useMemo(() => {
    return appointments.filter((item) => {
      const emailMatches = clientEmail && normalize(item.customer_email) === clientEmail;
      const phoneMatches = clientPhone && normalizePhone(item.customer_phone) === clientPhone;
      return emailMatches || phoneMatches;
    });
  }, [appointments, clientEmail, clientPhone]);

  const clientOrders = useMemo(() => {
    return orders.filter((item) => clientPhone && normalizePhone(item.customer_phone) === clientPhone);
  }, [orders, clientPhone]);

  function handleLogout() {
    window.localStorage.removeItem('stylecut_client_auth');
    window.localStorage.removeItem('stylecut_client_token');
    window.localStorage.removeItem('stylecut_client_profile');
    window.location.hash = '#/client-auth';
  }

  function handleFeedbackSubmit(event) {
    event.preventDefault();

    if (!feedback.trim()) {
      return;
    }

    const nextFeedback = [
      {
        id: Date.now(),
        message: feedback.trim(),
        createdAt: new Date().toLocaleDateString('en-IN')
      },
      ...feedbackList
    ];

    setFeedbackList(nextFeedback);
    window.localStorage.setItem('stylecut_client_feedback', JSON.stringify(nextFeedback));
    setFeedback('');
  }

  function handleRatingChange(value) {
    setRating(value);
    window.localStorage.setItem('stylecut_client_rating', String(value));
  }

  return (
    <main className="account-page">
      <header className="account-header">
        <a className="brand account-brand" href="#/home" aria-label="StyleCut home">
          <span className="brand-mark">
            <Scissors size={22} />
          </span>
          <span className="brand-text">
            <strong>StyleCut</strong>
            <small>Client Account</small>
          </span>
        </a>

        <div className="account-header-actions">
          <a className="account-nav-button" href="#/home">
            <Home size={17} />
            Home
          </a>
          <button className="account-nav-button account-logout" type="button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <section className="account-hero">
        <p>Client profile</p>
        <h1>Account details, service history, products, and reviews</h1>
      </section>

      <section className="account-layout">
        <aside className="account-profile-card account-sidebar">
          <div className="account-profile-block">
            <span className="account-avatar">
              <UserRound size={34} />
            </span>
            <h2>{profile.name || 'StyleCut Client'}</h2>
            <div className="account-profile-details">
              <span>
                <Mail size={17} />
                {profile.email || 'Email not added'}
              </span>
              <span>
                <Phone size={17} />
                {profile.phone || 'Phone not added'}
              </span>
            </div>
          </div>

          <nav className="account-sidebar-menu" aria-label="Account sections">
            {accountSections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  className={activeSection === section.id ? 'active' : ''}
                  key={section.id}
                  type="button"
                  onClick={() => setActiveSection(section.id)}
                >
                  <Icon size={19} />
                  {section.label}
                </button>
              );
            })}
          </nav>
        </aside>

        <div className="account-main">
          {activeSection === 'services' && (
            <section className="account-section">
              <div className="account-section-title">
                <CalendarCheck size={22} />
                <h2>History of Services Received</h2>
              </div>

              <div className="account-list">
                {clientAppointments.length ? (
                  clientAppointments.map((item) => (
                    <article className="account-history-card" key={item.id}>
                      <strong>{item.service_name}</strong>
                      <span>{item.appointment_date} at {item.appointment_time}</span>
                      <small>Status: {item.status}</small>
                    </article>
                  ))
                ) : (
                  <p className="account-empty">No service history found for this account.</p>
                )}
              </div>
            </section>
          )}

          {activeSection === 'products' && (
            <section className="account-section">
              <div className="account-section-title">
                <ShoppingBag size={22} />
                <h2>Products Ordered</h2>
              </div>

              <div className="account-list">
                {clientOrders.length ? (
                  clientOrders.map((item) => {
                    const names = (item.items || []).map((product) => `${product.name} x${product.quantity || 1}`).join(', ');
                    return (
                      <article className="account-history-card" key={item.id}>
                        <strong>Order #{item.id}</strong>
                        <span>{names || 'Product order'}</span>
                        {item.delivery_address && <span>{item.delivery_address}</span>}
                        <small>Total: ₹{item.total_amount} · Status: {item.status}</small>
                      </article>
                    );
                  })
                ) : (
                  <p className="account-empty">No product orders found for this account.</p>
                )}
              </div>
            </section>
          )}

          {activeSection === 'feedback' && (
            <section className="account-section">
              <div className="account-section-title">
                <MessageSquareText size={22} />
                <h2>Feedback</h2>
              </div>

              <form className="feedback-form" onSubmit={handleFeedbackSubmit}>
                <textarea
                  value={feedback}
                  onChange={(event) => setFeedback(event.target.value)}
                  placeholder="Share your experience with StyleCut"
                />
                <button type="submit">Submit Feedback</button>
              </form>

              <div className="account-list">
                {feedbackList.length ? (
                  feedbackList.map((item) => (
                    <article className="account-history-card" key={item.id}>
                      <strong>{item.createdAt}</strong>
                      <span>{item.message}</span>
                    </article>
                  ))
                ) : (
                  <p className="account-empty">No feedback submitted yet.</p>
                )}
              </div>
            </section>
          )}

          {activeSection === 'rating' && (
            <section className="account-section">
              <div className="account-section-title">
                <Star size={22} />
                <h2>Rating for the Service</h2>
              </div>

              <div className="rating-panel">
                <p>Choose your overall StyleCut service rating.</p>
                <div className="rating-buttons" aria-label="Service rating">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      className={value <= rating ? 'active' : ''}
                      key={value}
                      type="button"
                      onClick={() => handleRatingChange(value)}
                    >
                      <Star size={26} />
                    </button>
                  ))}
                </div>
                <strong>{rating ? `${rating}/5 rating saved` : 'No rating added yet'}</strong>
              </div>
            </section>
          )}
        </div>
      </section>
    </main>
  );
}

export default Account;
