import {
  CalendarCheck,
  Check,
  Home,
  History,
  MessageCircle,
  Scissors,
  ShoppingBag,
  Sparkles
} from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  getAppointments,
  getBridalRequests,
  getProductOrders,
  updateAppointmentStatus,
  updateBridalRequestStatus,
  updateProductOrderStatus
} from './api';

function whatsappLink(phone, message) {
  const cleanPhone = String(phone || '').replace(/\D/g, '');
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

const dashboardSections = [
  { id: 'services', label: 'Service bookings', icon: Scissors },
  { id: 'products', label: 'Product orders', icon: ShoppingBag },
  { id: 'bridal', label: 'Bridal bookings', icon: Sparkles },
  { id: 'home-service', label: 'Home service requests', icon: Home },
  { id: 'history', label: 'Accepted/completed history', icon: History },
  { id: 'whatsapp', label: 'WhatsApp confirmations', icon: MessageCircle }
];

function isOpenStatus(item) {
  return !['accepted', 'completed'].includes(item.status);
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

function BarberDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [orders, setOrders] = useState([]);
  const [bridalRequests, setBridalRequests] = useState([]);
  const [activeSection, setActiveSection] = useState('services');

  async function loadDashboard() {
    const [appointmentData, orderData, bridalData] = await Promise.allSettled([
      getAppointments(),
      getProductOrders(),
      getBridalRequests()
    ]);

    setAppointments(appointmentData.status === 'fulfilled' ? appointmentData.value : []);
    setOrders(orderData.status === 'fulfilled' ? orderData.value : []);
    setBridalRequests(bridalData.status === 'fulfilled' ? bridalData.value : []);
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  async function acceptAppointment(item) {
    await updateAppointmentStatus(item.id, 'accepted');
    await loadDashboard();
  }

  async function completeAppointment(item) {
    await updateAppointmentStatus(item.id, 'completed');
    await loadDashboard();
  }

  async function acceptOrder(item) {
    const updatedOrder = await updateProductOrderStatus(item.id, 'accepted');
    window.open(whatsappLink(updatedOrder.customer_phone, orderMessage(updatedOrder)), '_blank', 'noreferrer');
    await loadDashboard();
  }

  async function completeOrder(item) {
    const updatedOrder = await updateProductOrderStatus(item.id, 'completed');
    window.open(whatsappLink(updatedOrder.customer_phone, orderMessage(updatedOrder)), '_blank', 'noreferrer');
    await loadDashboard();
  }

  async function acceptBridal(item) {
    await updateBridalRequestStatus(item.id, 'accepted');
    await loadDashboard();
  }

  async function completeBridal(item) {
    await updateBridalRequestStatus(item.id, 'completed');
    await loadDashboard();
  }

  const openAppointments = appointments.filter(isOpenStatus);
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
  const whatsappItems = [
    ...appointments.filter(isHistoryStatus).map((item) => ({ ...item, type: 'service' })),
    ...orders.filter(isHistoryStatus).map((item) => ({ ...item, type: 'product' })),
    ...bridalRequests.filter(isHistoryStatus).map((item) => ({ ...item, type: item.home_service ? 'home-service' : 'bridal' }))
  ];

  function appointmentMessage(item) {
    return `StyleCut confirmation: Your ${item.service_name} booking is ${item.status}. Date: ${item.appointment_date}, Time: ${item.appointment_time}.`;
  }

  function orderNames(item) {
    return (item.items || []).map((product) => `${product.name} x${product.quantity || 1}`).join(', ');
  }

  function orderMessage(item) {
    if (item.status === 'completed') {
      return `StyleCut delivery confirmation: Your order ${orderNames(item)} has been delivered. Total: ₹${item.total_amount}. Thank you for shopping with StyleCut.`;
    }

    const estimate = item.estimated_delivery_date
      ? ` Estimated delivery: ${formatDate(item.estimated_delivery_date)}.`
      : '';
    const deliveryStatus = item.status === 'accepted' ? 'accepted and out for delivery' : item.status;
    return `StyleCut order update: ${orderNames(item)}. Address: ${item.delivery_address || 'Not provided'}. Total: ₹${item.total_amount}. Status: ${deliveryStatus}.${estimate}`;
  }

  function bridalMessage(item) {
    return `StyleCut bridal confirmation: ${item.package_name}. Home service: ${item.home_service ? 'Accepted' : 'Not requested'}. Days: ${item.home_service_days}. Total: ₹${item.total_amount}. Status: ${item.status}.`;
  }

  function renderEmpty(message) {
    return <p className="barber-empty">{message}</p>;
  }

  function renderAppointmentCard(item) {
    return (
      <article className="barber-card" key={`service-${item.id}`}>
        <strong>{item.service_name}</strong>
        <span>{item.customer_name} · {item.customer_phone}</span>
        <p>{item.appointment_date} at {item.appointment_time}</p>
        <small>Status: {item.status}</small>
        <div className="barber-card-actions">
          {item.status === 'completed' ? (
            <button type="button" disabled>
              <CalendarCheck size={17} /> Completed
            </button>
          ) : item.status === 'accepted' ? (
            <button type="button" onClick={() => completeAppointment(item)}>
              <CalendarCheck size={17} /> Complete
            </button>
          ) : (
            <button type="button" onClick={() => acceptAppointment(item)}>
              <Check size={17} /> Accept
            </button>
          )}
          <a href={whatsappLink(item.customer_phone, appointmentMessage(item))} target="_blank" rel="noreferrer">
            <MessageCircle size={17} /> WhatsApp
          </a>
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
        <small>Total: ₹{item.total_amount} · Status: {isAccepted ? 'out for delivery' : item.status}</small>
        <div className="barber-card-actions product-order-actions">
          {isDelivered ? (
            <button type="button" disabled>
              <CalendarCheck size={17} /> Delivered
            </button>
          ) : isAccepted ? (
            <button type="button" onClick={() => completeOrder(item)}>
              <CalendarCheck size={17} /> Mark Delivered
            </button>
          ) : (
            <button type="button" onClick={() => acceptOrder(item)}>
              <Check size={17} /> Accept to Delivery
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
        <small>Total: ₹{item.total_amount} · Status: {item.status}</small>
        <div className="barber-card-actions">
          {item.status === 'completed' ? (
            <button type="button" disabled>
              <CalendarCheck size={17} /> Completed
            </button>
          ) : item.status === 'accepted' ? (
            <button type="button" onClick={() => completeBridal(item)}>
              <CalendarCheck size={17} /> Complete
            </button>
          ) : (
            <button type="button" onClick={() => acceptBridal(item)}>
              <Check size={17} /> Accept
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

  function getItemMessage(item) {
    if (item.type === 'service') return appointmentMessage(item);
    if (item.type === 'product') return orderMessage(item);
    return bridalMessage(item);
  }

  function getItemSummary(item) {
    if (item.type === 'service') return `${item.appointment_date} at ${item.appointment_time}`;
    if (item.type === 'product') return orderNames(item) || 'Product order';
    return `${item.location || 'Salon visit'} · ${item.event_date || 'Date pending'}`;
  }

  function renderHistoryCard(item) {
    return (
      <article className="barber-card history-card" key={`history-${item.type}-${item.id}`}>
        <span className="history-type">{item.type.replace('-', ' ')}</span>
        <strong>{getItemTitle(item)}</strong>
        <p>{getItemSummary(item)}</p>
        <small>{item.customer_name} · {item.customer_phone}</small>
        <div className="history-status-row">
          <span>Status</span>
          <strong>{item.status === 'completed' ? 'Completed' : 'Accepted'}</strong>
        </div>
      </article>
    );
  }

  function renderWhatsAppCard(item) {
    return (
      <article className="barber-card whatsapp-card" key={`whatsapp-${item.type}-${item.id}`}>
        <span className="whatsapp-type">{item.type.replace('-', ' ')}</span>
        <strong>{getItemTitle(item)}</strong>
        <p>{getItemMessage(item)}</p>
        <a className="whatsapp-send-button" href={whatsappLink(item.customer_phone, getItemMessage(item))} target="_blank" rel="noreferrer">
          <MessageCircle size={17} /> Send WhatsApp Message
        </a>
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
          {activeSection === 'services' && (
            <div className="barber-column">
              <h2><Scissors size={22} /> Service bookings</h2>
              {openAppointments.length ? openAppointments.map(renderAppointmentCard) : renderEmpty('No new service bookings.')}
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
                <p>Read-only record of accepted and completed services, orders, and bridal requests.</p>
              </div>
              {historyItems.length ? historyItems.map(renderHistoryCard) : renderEmpty('No accepted or completed work yet.')}
            </div>
          )}

          {activeSection === 'whatsapp' && (
            <div className="barber-column whatsapp-column">
              <div className="barber-section-heading whatsapp-heading">
                <h2><MessageCircle size={22} /> WhatsApp center</h2>
                <p>Send customer-facing confirmation messages from one place.</p>
              </div>
              {whatsappItems.length ? whatsappItems.map(renderWhatsAppCard) : renderEmpty('Accept a booking or order to prepare WhatsApp confirmations.')}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

export default BarberDashboard;
