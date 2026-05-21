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
import {
  getClientAppointments,
  getClientFeedback,
  getClientProductOrders,
  getClientRating,
  submitClientFeedback,
  submitClientRating
} from './api';
import { playSuccessNoticeSound } from './sounds';

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

function formatAppointmentDate(dateValue) {
  if (!dateValue) {
    return 'Date pending';
  }

  const [year, month, day] = String(dateValue).split('T')[0].split('-');
  return year && month && day ? `${day}-${month}-${year}` : String(dateValue);
}

function formatAppointmentTime(timeValue) {
  const [hourText, minute = '00'] = String(timeValue || '').split(':');
  const hour = Number(hourText);

  if (!Number.isFinite(hour)) {
    return 'Time pending';
  }

  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${String(displayHour).padStart(2, '0')}:${minute.padStart(2, '0')} ${period}`;
}

function formatAppointmentSlot(item) {
  return `${formatAppointmentDate(item.appointment_date)} at ${formatAppointmentTime(item.appointment_time)}`;
}

function formatOrderDate(dateValue) {
  if (!dateValue) {
    return 'Date pending';
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return String(dateValue);
  }

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

function preferredStylist(notes) {
  const match = String(notes || '').match(/Preferred (?:stylist|barber):\s*([^\n]+)/i);
  return match ? match[1].trim() : 'Not specified';
}

function StatusLabel({ status }) {
  if (status !== 'completed') {
    return <span>{status}</span>;
  }

  return (
    <span className="status-indicator completed">
      <span aria-hidden="true" className="status-dot" />
      {status}
    </span>
  );
}

const productOrderStages = [
  'Order placed',
  'Dispatched',
  'Shipping',
  'Out for delivery',
  'Arrived at the location'
];

function productOrderStageIndex(status) {
  if (status === 'completed') {
    return 4;
  }

  if (status === 'accepted') {
    return 3;
  }

  return 0;
}

function productOrderStatusText(status) {
  if (status === 'completed') {
    return 'Arrived at the location';
  }

  if (status === 'accepted') {
    return 'Out for delivery';
  }

  if (status === 'cancelled') {
    return 'Cancelled';
  }

  return 'Order placed';
}

function ProductOrderTracker({ status }) {
  const activeStage = productOrderStageIndex(status);

  if (status === 'cancelled') {
    return <div className="product-order-cancelled">Order cancelled</div>;
  }

  return (
    <div className="product-order-tracker" aria-label={`Product order status: ${productOrderStatusText(status)}`}>
      {productOrderStages.map((stage, index) => {
        const isDone = index <= activeStage;
        const isCurrent = index === activeStage;
        return (
          <div className={isDone ? 'product-order-step active' : 'product-order-step'} key={stage}>
            <span className={isCurrent ? 'current' : ''} aria-hidden="true" />
            <small>{stage}</small>
          </div>
        );
      })}
    </div>
  );
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
  const [feedbackList, setFeedbackList] = useState([]);
  const [rating, setRating] = useState(0);
  const [accountMessage, setAccountMessage] = useState('');

  const clientEmail = normalize(profile.email);
  const clientPhone = normalizePhone(profile.phone);

  useEffect(() => {
    async function loadAccount() {
      const [appointmentData, orderData] = await Promise.allSettled([
        getClientAppointments(),
        getClientProductOrders()
      ]);

      setAppointments(appointmentData.status === 'fulfilled' ? appointmentData.value : []);
      setOrders(orderData.status === 'fulfilled' ? orderData.value : []);
    }

    loadAccount();
  }, []);

  useEffect(() => {
    async function loadReviews() {
      const [feedbackData, ratingData] = await Promise.allSettled([
        getClientFeedback(),
        getClientRating()
      ]);

      setFeedbackList(feedbackData.status === 'fulfilled' ? feedbackData.value : []);
      setRating(ratingData.status === 'fulfilled' && ratingData.value?.rating ? Number(ratingData.value.rating) : 0);
    }

    loadReviews();
  }, []);

  const clientAppointments = useMemo(() => {
    return appointments.filter((item) => {
      const emailMatches = clientEmail && normalize(item.customer_email) === clientEmail;
      const phoneMatches = clientPhone && normalizePhone(item.customer_phone) === clientPhone;
      return emailMatches || phoneMatches;
    });
  }, [appointments, clientEmail, clientPhone]);

  const clientOrders = useMemo(() => {
    return orders.filter((item) => {
      const emailMatches = clientEmail && normalize(item.customer_email) === clientEmail;
      const phoneMatches = clientPhone && normalizePhone(item.customer_phone) === clientPhone;
      return emailMatches || phoneMatches;
    });
  }, [orders, clientEmail, clientPhone]);

  function handleLogout() {
    window.localStorage.removeItem('stylecut_client_auth');
    window.localStorage.removeItem('stylecut_client_token');
    window.localStorage.removeItem('stylecut_client_profile');
    window.location.hash = '#/client-auth';
  }

  async function handleFeedbackSubmit(event) {
    event.preventDefault();

    if (!feedback.trim()) {
      return;
    }

    setAccountMessage('');

    try {
      const created = await submitClientFeedback(feedback.trim());
      setFeedbackList((current) => [created, ...current]);
      setFeedback('');
      setAccountMessage('Feedback sent to the barber dashboard.');
      playSuccessNoticeSound();
    } catch (error) {
      setAccountMessage(error.message || 'Could not submit feedback.');
    }
  }

  async function handleRatingChange(value) {
    setRating(value);
    setAccountMessage('');

    try {
      await submitClientRating(value);
      setAccountMessage('Rating sent to the barber dashboard.');
      playSuccessNoticeSound();
    } catch (error) {
      setAccountMessage(error.message || 'Could not submit rating.');
    }
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
          {accountMessage && <p className="auth-message">{accountMessage}</p>}

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
                      <span>{formatAppointmentSlot(item)}</span>
                      <span>Preferred stylist: {preferredStylist(item.notes)}</span>
                      <small className="status-line">Status: <StatusLabel status={item.status} /></small>
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
                      <article className="account-history-card product-order-history-card" key={item.id}>
                        <div className="account-order-heading">
                          <strong>Order #{item.id}</strong>
                          <span>{productOrderStatusText(item.status)}</span>
                        </div>
                        <span>{names || 'Product order'}</span>
                        {item.delivery_address && <span>{item.delivery_address}</span>}
                        <small>Placed on: {formatOrderDate(item.created_at)}</small>
                        {item.estimated_delivery_date && <small>Estimated delivery: {formatAppointmentDate(item.estimated_delivery_date)}</small>}
                        <ProductOrderTracker status={item.status} />
                        <small className="status-line">Total: ₹{item.total_amount} · Status: {productOrderStatusText(item.status)}</small>
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
                      <strong>{new Date(item.created_at).toLocaleDateString('en-IN')}</strong>
                      <span>{item.feedback_text}</span>
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
