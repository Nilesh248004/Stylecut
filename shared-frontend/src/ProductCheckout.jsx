import { ArrowLeft, Mail, MapPin, Phone, Scissors, ShoppingBag, User } from 'lucide-react';
import { useMemo, useState } from 'react';

function currency(value) {
  return Number(value).toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  });
}

function readPendingOrder() {
  try {
    const order = JSON.parse(window.localStorage.getItem('stylecut_pending_product_order')) || {};
    return Array.isArray(order.items) && order.items.length ? order : null;
  } catch {
    return null;
  }
}

function readClientProfile() {
  try {
    return JSON.parse(window.localStorage.getItem('stylecut_client_profile')) || {};
  } catch {
    return {};
  }
}

function ProductCheckout() {
  const [pendingOrder] = useState(readPendingOrder);
  const [profile] = useState(readClientProfile);
  const [form, setForm] = useState({
    customerName: profile.name || '',
    customerEmail: profile.email || '',
    customerPhone: profile.phone || '',
    address: '',
    city: '',
    pincode: '',
    landmark: '',
    notes: ''
  });
  const [status, setStatus] = useState(null);

  const totalAmount = useMemo(() => {
    if (!pendingOrder) {
      return 0;
    }

    return pendingOrder.items.reduce((total, item) => total + Number(item.price) * item.quantity, 0);
  }, [pendingOrder]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (!pendingOrder) {
      return;
    }

    if (!form.customerName.trim() || !form.customerPhone.trim() || !form.address.trim() || !form.city.trim() || !form.pincode.trim()) {
      setStatus({ type: 'error', message: 'Please enter name, phone number, address, city, and pincode.' });
      return;
    }

    const deliveryAddress = [
      form.address.trim(),
      form.landmark.trim() ? `Landmark: ${form.landmark.trim()}` : '',
      `${form.city.trim()} - ${form.pincode.trim()}`
    ].filter(Boolean).join(', ');

    setStatus(null);

    window.localStorage.setItem(
      'stylecut_pending_product_order',
      JSON.stringify({
        ...pendingOrder,
        customerName: form.customerName.trim(),
        customerEmail: form.customerEmail.trim(),
        customerPhone: form.customerPhone.trim(),
        deliveryAddress,
        orderNotes: form.notes.trim(),
        totalAmount
      })
    );
    window.location.hash = '#/product-payment';
  }

  if (!pendingOrder) {
    return (
      <main className="product-checkout-page">
        <section className="checkout-empty">
          <ShoppingBag size={36} />
          <h1>No product selected</h1>
          <p>Add a product or cart items before placing an order.</p>
          <a className="back-home" href="#/products">
            <ArrowLeft size={18} />
            Back to Products
          </a>
        </section>
      </main>
    );
  }

  return (
    <main className="product-checkout-page">
      <header className="checkout-header">
        <a className="brand checkout-brand" href="#/home" aria-label="StyleCut home">
          <span className="brand-mark">
            <Scissors size={22} />
          </span>
          <span className="brand-text">
            <strong>StyleCut</strong>
            <small>Product Checkout</small>
          </span>
        </a>

        <a className="back-home" href="#/products">
          <ArrowLeft size={18} />
          Products
        </a>
      </header>

      <section className="checkout-hero">
        <p>Product order</p>
        <h1>Enter delivery details</h1>
      </section>

      <section className="checkout-layout">
        <form className="checkout-form" onSubmit={handleSubmit}>
          <div className="checkout-form-heading">
            <h2>Client details</h2>
            <p>These details will be sent to the barber dashboard with your product order.</p>
          </div>

          <div className="booking-customer-grid">
            <label className="booking-field">
              <span>
                <User size={16} /> Full name
              </span>
              <input name="customerName" value={form.customerName} onChange={handleChange} placeholder="Your name" />
            </label>

            <label className="booking-field">
              <span>
                <Phone size={16} /> Phone
              </span>
              <input name="customerPhone" value={form.customerPhone} onChange={handleChange} placeholder="+91 98765 43210" />
            </label>
          </div>

          <label className="booking-field">
            <span>
              <Mail size={16} /> Email
            </span>
            <input
              name="customerEmail"
              type="email"
              value={form.customerEmail}
              onChange={handleChange}
              placeholder="you@example.com"
            />
          </label>

          <label className="booking-field">
            <span>
              <MapPin size={16} /> Delivery address
            </span>
            <textarea
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="House number, street, area"
              rows="4"
            />
          </label>

          <div className="booking-customer-grid">
            <label className="booking-field">
              <span>City</span>
              <input name="city" value={form.city} onChange={handleChange} placeholder="Bengaluru" />
            </label>

            <label className="booking-field">
              <span>Pincode</span>
              <input name="pincode" value={form.pincode} onChange={handleChange} placeholder="560001" />
            </label>
          </div>

          <label className="booking-field">
            <span>Landmark</span>
            <input name="landmark" value={form.landmark} onChange={handleChange} placeholder="Near metro station" />
          </label>

          <label className="booking-field">
            <span>Order notes</span>
            <textarea name="notes" value={form.notes} onChange={handleChange} placeholder="Any delivery instructions" rows="3" />
          </label>

          {status && (
            <div className={`checkout-status ${status.type}`}>
              <p>{status.message}</p>
            </div>
          )}

          <button className="confirm-booking-button" type="submit">
            Place Order
          </button>
        </form>

        <aside className="checkout-summary">
          <h2>Order summary</h2>
          <div className="checkout-items">
            {pendingOrder.items.map((item) => (
              <div className="checkout-item" key={item.id}>
                <div>
                  <strong>{item.name}</strong>
                  <span>Qty {item.quantity}</span>
                </div>
                <p>{currency(Number(item.price) * item.quantity)}</p>
              </div>
            ))}
          </div>

          <div className="checkout-total">
            <span>Total</span>
            <strong>{currency(totalAmount)}</strong>
          </div>
        </aside>
      </section>
    </main>
  );
}

export default ProductCheckout;
