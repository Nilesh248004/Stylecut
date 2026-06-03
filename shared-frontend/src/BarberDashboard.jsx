import {
  CalendarCheck,
  Check,
  Home,
  History,
  MessageCircle,
  MessageSquareText,
  Scissors,
  Search,
  ShoppingBag,
  Sparkles,
  Star
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getAppointments,
  getBridalRequests,
  getFeedback,
  getProductOrders,
  getRatings,
  updateAppointmentStatus,
  updateBridalRequestStatus,
  updateProductOrderStatus
} from './api';
import { playSuccessNoticeSound } from './sounds';

function whatsappLink(phone, message) {
  const digits = String(phone || '').replace(/\D/g, '');
  const cleanPhone = digits.length === 10 ? `91${digits}` : digits.replace(/^0+/, '');
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

const dashboardSections = [
  { id: 'services', label: 'Service bookings', icon: Scissors },
  { id: 'products', label: 'Product orders', icon: ShoppingBag },
  { id: 'bridal', label: 'Bridal bookings', icon: Sparkles },
  { id: 'home-service', label: 'Home service requests', icon: Home },
  { id: 'history', label: 'Accepted/completed history', icon: History },
  { id: 'feedback', label: 'Feedback received', icon: MessageSquareText },
  { id: 'ratings', label: 'Ratings received', icon: Star }
];
const DASHBOARD_REFRESH_MS = 4000;
const SERVICE_STATUS_PRIORITY = {
  pending: 0,
  accepted: 1,
  completed: 2
};

function isOpenStatus(item) {
  return !['accepted', 'completed'].includes(item.status);
}

function isActiveServiceStatus(item) {
  return ['pending', 'accepted', 'completed'].includes(item.status);
}

function isHistoryStatus(item) {
  return ['accepted', 'completed'].includes(item.status);
}

function formatDate(dateValue) {
  if (!dateValue) {
    return 'Estimate pending';
  }

  return new Date(dateValue).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
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

function preferredStylist(notes) {
  const match = String(notes || '').match(/Preferred (?:stylist|barber):\s*([^\n]+)/i);
  return match ? match[1].trim() : '';
}

function preferredStylistLabel(notes) {
  return preferredStylist(notes) || 'Not specified';
}

function serviceBookingSearchText(item) {
  return [
    item.id,
    item.service_name,
    item.customer_name,
    item.customer_phone,
    item.status,
    preferredStylistLabel(item.notes),
    formatAppointmentDate(item.appointment_date),
    formatAppointmentTime(item.appointment_time)
  ].join(' ').toLowerCase();
}

function serviceBookingSortKey(item) {
  const appointmentDate = String(item.appointment_date || '').split('T')[0];
  const appointmentTime = String(item.appointment_time || '00:00');
  const timestamp = new Date(`${appointmentDate}T${appointmentTime}`).getTime();
  return Number.isNaN(timestamp) ? Number.MAX_SAFE_INTEGER : timestamp;
}

function compareServiceBookings(first, second) {
  const firstPriority = SERVICE_STATUS_PRIORITY[first.status] ?? 3;
  const secondPriority = SERVICE_STATUS_PRIORITY[second.status] ?? 3;

  if (firstPriority !== secondPriority) {
    return firstPriority - secondPriority;
  }

  const firstTime = serviceBookingSortKey(first);
  const secondTime = serviceBookingSortKey(second);

  if (firstTime !== secondTime) {
    return firstTime - secondTime;
  }

  return Number(second.id || 0) - Number(first.id || 0);
}

function StatusLabel({ status, label }) {
  const displayLabel = label || status;

  if (status !== 'completed') {
    return <span>{displayLabel}</span>;
  }

  return (
    <span className="status-indicator completed">
      <span aria-hidden="true" className="status-dot" />
      {displayLabel}
    </span>
  );
}

function BarberDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [orders, setOrders] = useState([]);
  const [bridalRequests, setBridalRequests] = useState([]);
  const [feedbackItems, setFeedbackItems] = useState([]);
  const [ratingItems, setRatingItems] = useState([]);
  const [activeSection, setActiveSection] = useState('services');
  const [dashboardMessage, setDashboardMessage] = useState('');
  const [activeAction, setActiveAction] = useState('');
  const [serviceSearch, setServiceSearch] = useState('');

  const loadDashboard = useCallback(async () => {
    const [appointmentData, orderData, bridalData, feedbackData, ratingData] = await Promise.allSettled([
      getAppointments(),
      getProductOrders(),
      getBridalRequests(),
      getFeedback(),
      getRatings()
    ]);

    if (appointmentData.status === 'fulfilled') setAppointments(appointmentData.value);
    if (orderData.status === 'fulfilled') setOrders(orderData.value);
    if (bridalData.status === 'fulfilled') setBridalRequests(bridalData.value);
    if (feedbackData.status === 'fulfilled') setFeedbackItems(feedbackData.value);
    if (ratingData.status === 'fulfilled') setRatingItems(ratingData.value);
  }, []);

  useEffect(() => {
    let isMounted = true;
    let isRefreshing = false;

    async function refreshDashboard() {
      if (!isMounted || isRefreshing) {
        return;
      }

      isRefreshing = true;
      try {
        await loadDashboard();
      } finally {
        isRefreshing = false;
      }
    }

    refreshDashboard();
    const refreshTimer = window.setInterval(refreshDashboard, DASHBOARD_REFRESH_MS);
    window.addEventListener('focus', refreshDashboard);

    return () => {
      isMounted = false;
      window.clearInterval(refreshTimer);
      window.removeEventListener('focus', refreshDashboard);
    };
  }, [loadDashboard]);

  async function acceptAppointment(item) {
    setActiveAction(`service-${item.id}`);
    setDashboardMessage('');

    try {
      await updateAppointmentStatus(item.id, 'accepted');
      await loadDashboard();
      setActiveSection('services');
      setDashboardMessage(`Accepted ${item.service_name} booking for ${item.customer_name}. Mark it complete after the service is done.`);
      playSuccessNoticeSound();
    } catch (error) {
      setDashboardMessage(error.message || 'Could not accept this booking.');
    } finally {
      setActiveAction('');
    }
  }

  async function completeAppointment(item) {
    setActiveAction(`service-${item.id}`);
    setDashboardMessage('');

    try {
      await updateAppointmentStatus(item.id, 'completed');
      await loadDashboard();
      setActiveSection('services');
      setDashboardMessage(`Completed ${item.service_name} booking for ${item.customer_name}.`);
      playSuccessNoticeSound();
    } catch (error) {
      setDashboardMessage(error.message || 'Could not complete this booking.');
    } finally {
      setActiveAction('');
    }
  }

  async function acceptOrder(item) {
    setActiveAction(`order-${item.id}`);
    setDashboardMessage('');

    try {
      await updateProductOrderStatus(item.id, 'accepted');
      await loadDashboard();
      setDashboardMessage(`Accepted order #${item.id} for delivery. WhatsApp notification sent to ${item.customer_name}.`);
      playSuccessNoticeSound();
    } catch (error) {
      setDashboardMessage(error.message || 'Could not accept this order.');
    } finally {
      setActiveAction('');
    }
  }

  async function completeOrder(item) {
    setActiveAction(`order-${item.id}`);
    setDashboardMessage('');

    try {
      await updateProductOrderStatus(item.id, 'completed');
      await loadDashboard();
      setDashboardMessage(`Marked order #${item.id} as delivered. WhatsApp notification sent to ${item.customer_name}.`);
      playSuccessNoticeSound();
    } catch (error) {
      setDashboardMessage(error.message || 'Could not complete this order.');
    } finally {
      setActiveAction('');
    }
  }

  async function acceptBridal(item) {
    setActiveAction(`bridal-${item.id}`);
    setDashboardMessage('');

    try {
      await updateBridalRequestStatus(item.id, 'accepted');
      await loadDashboard();
      setActiveSection('history');
      setDashboardMessage(`Accepted ${item.package_name} request for ${item.customer_name}.`);
      playSuccessNoticeSound();
    } catch (error) {
      setDashboardMessage(error.message || 'Could not accept this bridal request.');
    } finally {
      setActiveAction('');
    }
  }

  async function completeBridal(item) {
    setActiveAction(`bridal-${item.id}`);
    setDashboardMessage('');

    try {
      await updateBridalRequestStatus(item.id, 'completed');
      await loadDashboard();
      setActiveSection('history');
      setDashboardMessage(`Completed ${item.package_name} request for ${item.customer_name}.`);
      playSuccessNoticeSound();
    } catch (error) {
      setDashboardMessage(error.message || 'Could not complete this bridal request.');
    } finally {
      setActiveAction('');
    }
  }

  const serviceSearchTerm = serviceSearch.trim().toLowerCase();
  const activeServiceAppointments = useMemo(() => {
    return appointments
      .filter(isActiveServiceStatus)
      .filter((item) => !serviceSearchTerm || serviceBookingSearchText(item).includes(serviceSearchTerm))
      .sort(compareServiceBookings);
  }, [appointments, serviceSearchTerm]);
  const serviceBookingsNeedingAction = activeServiceAppointments.filter((item) => item.status !== 'completed').length;
  const visibleProductOrders = [
    ...orders.filter((item) => item.status === 'pending'),
    ...orders.filter((item) => item.status === 'accepted'),
    ...orders.filter((item) => item.status === 'completed')
  ];
  const openBridalRequests = bridalRequests.filter((item) => isOpenStatus(item) && !item.home_service);
  const homeServiceRequests = bridalRequests.filter((item) => isOpenStatus(item) && item.home_service);
  const historyItems = [
    ...appointments.filter(isHistoryStatus).map((item) => ({ ...item, type: 'service' })),
    ...orders.filter(isHistoryStatus).map((item) => ({ ...item, type: 'product' })),
    ...bridalRequests.filter(isHistoryStatus).map((item) => ({ ...item, type: item.home_service ? 'home-service' : 'bridal' }))
  ];
  const acceptedHistoryItems = historyItems.filter((item) => item.status === 'accepted');
  const completedHistoryItems = historyItems.filter((item) => item.status === 'completed');
  function orderNames(item) {
    return (item.items || []).map((product) => `${product.name} x${product.quantity || 1}`).join(', ');
  }

  function bridalMessage(item) {
    return `StyleCut bridal confirmation: ${item.package_name}. Home service: ${item.home_service ? 'Accepted' : 'Not requested'}. Days: ${item.home_service_days}. Total: ₹${item.total_amount}. Status: ${item.status}.`;
  }

  function renderEmpty(message) {
    return <p className="barber-empty">{message}</p>;
  }

  function renderAppointmentCard(item) {
    const needsAction = item.status !== 'completed';
    const actionLabel = item.status === 'accepted' ? 'Needs completion' : 'Needs acceptance';

    return (
      <article className={`barber-card service-booking-card${needsAction ? ' needs-action' : ''}`} key={`service-${item.id}`}>
        <div className="service-booking-title">
          <strong>{item.service_name}</strong>
          {needsAction ? <span className="booking-action-badge">{actionLabel}</span> : <span className="booking-action-badge completed">Confirmed</span>}
        </div>
        <span>{item.customer_name} · {item.customer_phone}</span>
        <p>{formatAppointmentSlot(item)}</p>
        <small>Preferred stylist: {preferredStylistLabel(item.notes)}</small>
        <small className="status-line">Status: <StatusLabel status={item.status} /></small>
        <div className="barber-card-actions">
          {item.status === 'completed' ? (
            <button className="completed-action" type="button" disabled>
              <CalendarCheck size={17} /> Completed
            </button>
          ) : item.status === 'accepted' ? (
            <>
              <span className="accepted-action">
                <Check size={17} /> Accepted
              </span>
              <button className="complete-action" type="button" onClick={() => completeAppointment(item)} disabled={activeAction === `service-${item.id}`}>
                <CalendarCheck size={17} /> {activeAction === `service-${item.id}` ? 'Saving...' : 'Complete'}
              </button>
            </>
          ) : (
            <button className="accept-action" type="button" onClick={() => acceptAppointment(item)} disabled={activeAction === `service-${item.id}`}>
              <Check size={17} /> {activeAction === `service-${item.id}` ? 'Accepting...' : 'Accept'}
            </button>
          )}
        </div>
      </article>
    );
  }

  function renderOrderCard(item) {
    const itemNames = orderNames(item);
    const isDelivered = item.status === 'completed';
    const isAccepted = item.status === 'accepted';
    return (
      <article className="barber-card" key={`order-${item.id}`}>
        <strong>Order #{item.id}</strong>
        <span>{item.customer_name} · {item.customer_phone}</span>
        <p>{itemNames || 'Product order'}</p>
        {item.delivery_address && <p>{item.delivery_address}</p>}
        {isAccepted && (
          <div className="delivery-estimate">
            <strong>AI delivery estimate</strong>
            <span>{formatDate(item.estimated_delivery_date)}</span>
            {item.delivery_estimate_reason && <small>{item.delivery_estimate_reason}</small>}
          </div>
        )}
        {isDelivered && item.delivered_at && (
          <div className="delivery-estimate delivered">
            <strong>Delivered</strong>
            <span>{formatDate(item.delivered_at)}</span>
          </div>
        )}
        {item.order_notes && <small>Notes: {item.order_notes}</small>}
        <small className="status-line">Total: ₹{item.total_amount} · Status: <StatusLabel status={item.status} label={isAccepted ? 'out for delivery' : item.status} /></small>
        <div className="barber-card-actions product-order-actions">
          {isDelivered ? (
            <button className="completed-action" type="button" disabled>
              <CalendarCheck size={17} /> Delivered
            </button>
          ) : isAccepted ? (
            <button className="complete-action" type="button" onClick={() => completeOrder(item)} disabled={activeAction === `order-${item.id}`}>
              <CalendarCheck size={17} /> {activeAction === `order-${item.id}` ? 'Saving...' : 'Mark Delivered'}
            </button>
          ) : (
            <button className="accept-action" type="button" onClick={() => acceptOrder(item)} disabled={activeAction === `order-${item.id}`}>
              <Check size={17} /> {activeAction === `order-${item.id}` ? 'Accepting...' : 'Accept to Delivery'}
            </button>
          )}
        </div>
      </article>
    );
  }

  function renderBridalCard(item) {
    return (
      <article className="barber-card" key={`bridal-${item.id}`}>
        <strong>{item.package_name}</strong>
        <span>{item.customer_name} · {item.customer_phone}</span>
        <p>{item.location || 'Salon visit'} · {item.event_date || 'Date pending'}</p>
        <small className="status-line">Total: ₹{item.total_amount} · Status: <StatusLabel status={item.status} /></small>
        <div className="barber-card-actions">
          {item.status === 'completed' ? (
            <button className="completed-action" type="button" disabled>
              <CalendarCheck size={17} /> Completed
            </button>
          ) : item.status === 'accepted' ? (
            <button className="complete-action" type="button" onClick={() => completeBridal(item)} disabled={activeAction === `bridal-${item.id}`}>
              <CalendarCheck size={17} /> {activeAction === `bridal-${item.id}` ? 'Saving...' : 'Complete'}
            </button>
          ) : (
            <button className="accept-action" type="button" onClick={() => acceptBridal(item)} disabled={activeAction === `bridal-${item.id}`}>
              <Check size={17} /> {activeAction === `bridal-${item.id}` ? 'Accepting...' : 'Accept'}
            </button>
          )}
          <a href={whatsappLink(item.customer_phone, bridalMessage(item))} target="_blank" rel="noreferrer">
            <MessageCircle size={17} /> WhatsApp
          </a>
        </div>
      </article>
    );
  }

  function getItemTitle(item) {
    if (item.type === 'service') return item.service_name;
    if (item.type === 'product') return `Order #${item.id}`;
    return item.package_name;
  }

  function getItemSummary(item) {
    if (item.type === 'service') {
      return `${formatAppointmentSlot(item)} · Preferred stylist: ${preferredStylistLabel(item.notes)}`;
    }

    if (item.type === 'product') return orderNames(item) || 'Product order';
    return `${item.location || 'Salon visit'} · ${item.event_date || 'Date pending'}`;
  }

  function renderHistoryCard(item) {
    return (
      <article className={`barber-card history-card history-card-${item.status}`} key={`history-${item.type}-${item.id}`}>
        <span className="history-type">{item.type.replace('-', ' ')}</span>
        <strong>{getItemTitle(item)}</strong>
        <p>{getItemSummary(item)}</p>
        <small>{item.customer_name} · {item.customer_phone}</small>
        <div className="history-status-row">
          <span>Status</span>
          <strong>
            <StatusLabel status={item.status} label={item.status === 'completed' ? 'Completed' : 'Accepted'} />
          </strong>
        </div>
      </article>
    );
  }

  function renderFeedbackCard(item) {
    return (
      <article className="barber-card" key={`feedback-${item.id}`}>
        <strong>{item.client_name}</strong>
        <span>{item.client_phone || item.client_email || 'Client contact not available'}</span>
        <p>{item.feedback_text}</p>
        <small>{formatDate(item.created_at)}</small>
      </article>
    );
  }

  function renderRatingCard(item) {
    return (
      <article className="barber-card rating-received-card" key={`rating-${item.id}`}>
        <strong>{item.client_name}</strong>
        <span>{item.client_phone || item.client_email || 'Client contact not available'}</span>
        <div className="received-rating-stars" aria-label={`${item.rating} out of 5 rating`}>
          {[1, 2, 3, 4, 5].map((value) => (
            <Star className={value <= item.rating ? 'active' : ''} key={value} size={22} />
          ))}
        </div>
        <small>{item.rating}/5 · {formatDate(item.created_at)}</small>
      </article>
    );
  }

  return (
    <main className="barber-page">
      <header className="barber-header">
        <a className="brand barber-brand" href="#/barber" aria-label="StyleCut barber home">
          <span className="brand-mark">
            <Scissors size={22} />
          </span>
          <span className="brand-text">
            <strong>StyleCut</strong>
            <small>Barber Panel</small>
          </span>
        </a>

        <a className="back-home barber-back" href="#/home">
          Back
        </a>
      </header>

      <section className="barber-hero">
        <p>Barber dashboard</p>
        <h1>Accept bookings and send WhatsApp confirmations</h1>
      </section>

      <section className="barber-board">
        <aside className="barber-sidebar">
          {dashboardSections.map((section) => {
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
        </aside>

        <div className={`barber-panel barber-panel-${activeSection}`}>
          {dashboardMessage && <p className="barber-status-message">{dashboardMessage}</p>}

          {activeSection === 'services' && (
            <div className="barber-column service-bookings-column">
              <div className="barber-section-heading service-bookings-heading">
                <div className="service-bookings-title-row">
                  <div>
                    <h2><Scissors size={22} /> Service bookings</h2>
                    <p>{serviceBookingsNeedingAction} booking{serviceBookingsNeedingAction === 1 ? '' : 's'} need accept or complete action.</p>
                  </div>
                  <span>{activeServiceAppointments.length}</span>
                </div>
                <label className="service-booking-search">
                  <Search size={18} />
                  <input
                    type="search"
                    value={serviceSearch}
                    onChange={(event) => setServiceSearch(event.target.value)}
                    placeholder="Search name, phone, service, date, stylist, status..."
                    aria-label="Search service bookings"
                  />
                </label>
              </div>
              {activeServiceAppointments.length
                ? activeServiceAppointments.map(renderAppointmentCard)
                : renderEmpty(serviceSearchTerm ? 'No service bookings match this search.' : 'No pending or accepted service bookings.')}
            </div>
          )}

          {activeSection === 'products' && (
            <div className="barber-column product-orders-column">
              <div className="barber-section-heading product-heading">
                <h2><ShoppingBag size={22} /> Product orders</h2>
                <p>Manage delivery actions here. Accepting an order opens WhatsApp automatically with the estimated date.</p>
              </div>
              {visibleProductOrders.length ? visibleProductOrders.map(renderOrderCard) : renderEmpty('No product orders yet.')}
            </div>
          )}

          {activeSection === 'bridal' && (
            <div className="barber-column">
              <h2><Sparkles size={22} /> Bridal bookings</h2>
              {openBridalRequests.length ? openBridalRequests.map(renderBridalCard) : renderEmpty('No new bridal studio bookings.')}
            </div>
          )}

          {activeSection === 'home-service' && (
            <div className="barber-column">
              <h2><Home size={22} /> Home service requests</h2>
              {homeServiceRequests.length ? homeServiceRequests.map(renderBridalCard) : renderEmpty('No new home service requests.')}
            </div>
          )}

          {activeSection === 'history' && (
            <div className="barber-column history-column">
              <div className="barber-section-heading history-heading">
                <h2><History size={22} /> Work history</h2>
                <p>Accepted work and completed records are grouped separately for quick review.</p>
              </div>
              {historyItems.length ? (
                <div className="history-groups">
                  <section className="history-group">
                    <div className="history-group-heading">
                      <div>
                        <h3>Accepted</h3>
                        <p>Ready for service, delivery, or follow-up</p>
                      </div>
                      <span>{acceptedHistoryItems.length}</span>
                    </div>
                    {acceptedHistoryItems.length ? acceptedHistoryItems.map(renderHistoryCard) : renderEmpty('No accepted work right now.')}
                  </section>

                  <section className="history-group">
                    <div className="history-group-heading">
                      <div>
                        <h3>Completed</h3>
                        <p>Finished bookings, delivered orders, and closed requests</p>
                      </div>
                      <span>{completedHistoryItems.length}</span>
                    </div>
                    {completedHistoryItems.length ? completedHistoryItems.map(renderHistoryCard) : renderEmpty('No completed work yet.')}
                  </section>
                </div>
              ) : renderEmpty('No accepted or completed work yet.')}
            </div>
          )}

          {activeSection === 'feedback' && (
            <div className="barber-column feedback-column">
              <div className="barber-section-heading product-heading">
                <h2><MessageSquareText size={22} /> Feedback received</h2>
                <p>Read client feedback submitted from client account pages.</p>
              </div>
              {feedbackItems.length ? feedbackItems.map(renderFeedbackCard) : renderEmpty('No client feedback received yet.')}
            </div>
          )}

          {activeSection === 'ratings' && (
            <div className="barber-column ratings-column">
              <div className="barber-section-heading product-heading">
                <h2><Star size={22} /> Ratings received</h2>
                <p>Review ratings submitted by clients after their StyleCut experience.</p>
              </div>
              {ratingItems.length ? ratingItems.map(renderRatingCard) : renderEmpty('No client ratings received yet.')}
            </div>
          )}

        </div>
      </section>
    </main>
  );
}

export default BarberDashboard;
