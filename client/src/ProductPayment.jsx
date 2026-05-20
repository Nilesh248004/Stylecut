import { ArrowLeft, Banknote, CheckCircle2, CreditCard, QrCode, Scissors, ShieldCheck, Smartphone } from 'lucide-react';
import { useMemo, useState } from 'react';
import { createProductOrder } from './api';

const paymentMethods = [
  { id: 'upi', label: 'UPI', description: 'Pay with Google Pay, PhonePe, Paytm, or any UPI app.', icon: QrCode },
  { id: 'card', label: 'Card', description: 'Use debit or credit card at checkout.', icon: CreditCard },
  { id: 'wallet', label: 'Wallet', description: 'Pay with a digital wallet.', icon: Smartphone },
  { id: 'cod', label: 'Cash on Delivery', description: 'Pay when your product is delivered.', icon: Banknote }
];

const upiApps = [
  {
    id: 'gpay',
    label: 'Google Pay',
    scheme: 'gpay://upi/pay',
    iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/f/f2/Google_Pay_Logo.svg'
  },
  {
    id: 'phonepe',
    label: 'PhonePe',
    scheme: 'phonepe://pay',
    iconUrl: 'https://cdn.simpleicons.org/phonepe/5f259f'
  },
  {
    id: 'razorpay',
    label: 'Razorpay',
    scheme: 'razorpay',
    iconUrl: 'https://cdn.simpleicons.org/razorpay/0b72e7'
  }
];

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

function playOrderSuccessSound() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;

  if (!AudioContext) {
    return;
  }

  const audioContext = new AudioContext();
  const gain = audioContext.createGain();

  gain.connect(audioContext.destination);
  gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.16, audioContext.currentTime + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.72);

  [
    { frequency: 523.25, delay: 0 },
    { frequency: 659.25, delay: 0.11 },
    { frequency: 783.99, delay: 0.22 }
  ].forEach((note) => {
    const oscillator = audioContext.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(note.frequency, audioContext.currentTime + note.delay);
    oscillator.connect(gain);
    oscillator.start(audioContext.currentTime + note.delay);
    oscillator.stop(audioContext.currentTime + note.delay + 0.22);
  });
}

const gstRate = 0.18;
const deliveryCharge = 60;
const merchantUpiId = 'stylecut@upi';
const merchantName = 'StyleCut Salon';
const razorpayPaymentLink = 'https://rzp.io/i/stylecut-payment';

function ProductPayment() {
  const [pendingOrder] = useState(readPendingOrder);
  const [selectedMethod, setSelectedMethod] = useState('upi');
  const [selectedUpiApp, setSelectedUpiApp] = useState('gpay');
  const [paymentDetails, setPaymentDetails] = useState({
    cardNumber: '',
    cardName: '',
    expiry: '',
    cvv: '',
    walletPhone: ''
  });
  const [status, setStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderConfirmation, setOrderConfirmation] = useState(null);

  const subtotal = useMemo(() => {
    if (!pendingOrder) {
      return 0;
    }

    return pendingOrder.items.reduce((total, item) => total + Number(item.price) * item.quantity, 0);
  }, [pendingOrder]);
  const gstAmount = Math.round(subtotal * gstRate);
  const totalAmount = subtotal + gstAmount + deliveryCharge;

  function handlePaymentDetailChange(event) {
    const { name, value } = event.target;
    setPaymentDetails((current) => ({ ...current, [name]: value }));
  }

  function validatePaymentDetails(methodId) {
    if (methodId === 'upi' && !selectedUpiApp) {
      return 'Please choose a UPI payment app.';
    }

    if (methodId === 'card') {
      if (!paymentDetails.cardNumber.trim() || !paymentDetails.cardName.trim() || !paymentDetails.expiry.trim() || !paymentDetails.cvv.trim()) {
        return 'Please enter complete card details.';
      }
    }

    if (methodId === 'wallet' && !paymentDetails.walletPhone.trim()) {
      return 'Please enter your wallet mobile number.';
    }

    return '';
  }

  function getUpiPaymentUrl(orderReference) {
    const app = upiApps.find((item) => item.id === selectedUpiApp);
    const note = `StyleCut order ${orderReference}`;
    const params = new URLSearchParams({
      pa: merchantUpiId,
      pn: merchantName,
      am: totalAmount.toFixed(2),
      cu: 'INR',
      tn: note
    });

    if (app.id === 'razorpay') {
      return `${razorpayPaymentLink}?amount=${Math.round(totalAmount * 100)}&reference_id=${encodeURIComponent(orderReference)}`;
    }

    return `${app.scheme}?${params.toString()}`;
  }

  async function handleConfirmPayment() {
    if (!pendingOrder) {
      return;
    }

    const method = paymentMethods.find((item) => item.id === selectedMethod);
    const validationMessage = validatePaymentDetails(selectedMethod);

    if (validationMessage) {
      setStatus({ type: 'error', message: validationMessage });
      return;
    }

    setIsSubmitting(true);
    setStatus(null);

    try {
      const createdOrder = await createProductOrder({
        customerName: pendingOrder.customerName,
        customerEmail: pendingOrder.customerEmail,
        customerPhone: pendingOrder.customerPhone,
        deliveryAddress: pendingOrder.deliveryAddress,
        orderNotes: [
          pendingOrder.orderNotes,
          `Payment method: ${method.label}`,
          `Subtotal: ${currency(subtotal)}`,
          `GST: ${currency(gstAmount)}`,
          `Delivery: ${currency(deliveryCharge)}`
        ].filter(Boolean).join(' | '),
        items: pendingOrder.items,
        totalAmount
      });

      window.localStorage.removeItem('stylecut_pending_product_order');
      setOrderConfirmation({
        id: createdOrder.id,
        paymentMethod: method.label,
        totalAmount
      });
      playOrderSuccessSound();
      setStatus(null);

      if (selectedMethod === 'upi') {
        setTimeout(() => {
          window.location.href = getUpiPaymentUrl(createdOrder.id || Date.now());
        }, 1800);
      }
    } catch {
      setStatus({ type: 'error', message: 'Could not place order. Please make sure the backend and database are running.' });
    } finally {
      setIsSubmitting(false);
    }
  }

  function renderPaymentDetails(methodId) {
    if (methodId === 'upi') {
      return (
        <div className="payment-live-panel">
          <div className="upi-app-grid" aria-label="UPI app selection">
            {upiApps.map((app) => (
              <button
                className={selectedUpiApp === app.id ? 'upi-app-button active' : 'upi-app-button'}
                key={app.id}
                type="button"
                onClick={() => setSelectedUpiApp(app.id)}
              >
                <span className={`upi-app-icon ${app.id === 'gpay' ? 'gpay-icon' : ''}`}>
                  <img src={app.iconUrl} alt="" />
                </span>
                <span>{app.label}</span>
              </button>
            ))}
          </div>
          <div className="payment-live-note">
            {upiApps.find((item) => item.id === selectedUpiApp)?.label} will open with {currency(totalAmount)} filled in.
          </div>
        </div>
      );
    }

    if (methodId === 'card') {
      return (
        <div className="payment-live-panel">
          <label className="booking-field">
            <span>Card number</span>
            <input name="cardNumber" value={paymentDetails.cardNumber} onChange={handlePaymentDetailChange} placeholder="1234 5678 9012 3456" />
          </label>
          <label className="booking-field">
            <span>Name on card</span>
            <input name="cardName" value={paymentDetails.cardName} onChange={handlePaymentDetailChange} placeholder="Client name" />
          </label>
          <div className="payment-card-grid">
            <label className="booking-field">
              <span>Expiry</span>
              <input name="expiry" value={paymentDetails.expiry} onChange={handlePaymentDetailChange} placeholder="MM/YY" />
            </label>
            <label className="booking-field">
              <span>CVV</span>
              <input name="cvv" value={paymentDetails.cvv} onChange={handlePaymentDetailChange} placeholder="123" />
            </label>
          </div>
        </div>
      );
    }

    if (methodId === 'wallet') {
      return (
        <div className="payment-live-panel">
          <label className="booking-field">
            <span>Wallet mobile number</span>
            <input name="walletPhone" value={paymentDetails.walletPhone} onChange={handlePaymentDetailChange} placeholder="+91 98765 43210" />
          </label>
          <div className="payment-live-note">A wallet payment request will be sent to this number.</div>
        </div>
      );
    }

    if (methodId === 'cod') {
      return (
        <div className="cod-breakdown">
          <div className="cod-breakdown-title">
            <Banknote size={20} />
            <strong>Cash on Delivery price details</strong>
          </div>
          <div className="price-row">
            <span>Product subtotal</span>
            <strong>{currency(subtotal)}</strong>
          </div>
          <div className="price-row">
            <span>GST 18%</span>
            <strong>{currency(gstAmount)}</strong>
          </div>
          <div className="price-row">
            <span>Delivery charge</span>
            <strong>{currency(deliveryCharge)}</strong>
          </div>
          <div className="price-row total">
            <span>Amount to pay on delivery</span>
            <strong>{currency(totalAmount)}</strong>
          </div>
        </div>
      );
    }

    return null;
  }

  if (orderConfirmation) {
    return (
      <main className="product-checkout-page order-success-page">
        <section className="order-success-card">
          <div className="success-check-wrap" aria-hidden="true">
            <svg className="success-check" viewBox="0 0 80 80">
              <circle className="success-check-circle" cx="40" cy="40" r="34" />
              <path className="success-check-mark" d="M24 41.5 34.5 52 57 28" />
            </svg>
          </div>

          <p className="success-kicker">Order placed successfully</p>
          <h1>Thank you for shopping with StyleCut.</h1>
          <p className="success-copy">
            Your order #{orderConfirmation.id} has been sent to the barber dashboard. We will confirm the delivery shortly.
          </p>

          <div className="success-details">
            <span>
              <strong>Payment</strong>
              {orderConfirmation.paymentMethod}
            </span>
            <span>
              <strong>Total</strong>
              {currency(orderConfirmation.totalAmount)}
            </span>
          </div>

          <div className="success-actions">
            <a className="confirm-booking-button" href="#/products">
              Continue Shopping
            </a>
            <a className="success-secondary-action" href="#/account">
              View Account
            </a>
          </div>
        </section>
      </main>
    );
  }

  if (!pendingOrder?.customerName || !pendingOrder?.deliveryAddress) {
    return (
      <main className="product-checkout-page">
        <section className="checkout-empty">
          <ShieldCheck size={36} />
          <h1>Complete order details first</h1>
          <p>Enter your client and delivery details before choosing a payment method.</p>
          <a className="back-home" href="#/product-checkout">
            <ArrowLeft size={18} />
            Back to Checkout
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
            <small>Payment</small>
          </span>
        </a>

        <a className="back-home" href="#/product-checkout">
          <ArrowLeft size={18} />
          Checkout
        </a>
      </header>

      <section className="checkout-hero">
        <p>Payment section</p>
        <h1>Choose payment method</h1>
      </section>

      <section className="checkout-layout payment-layout">
        <div className="checkout-form payment-panel">
          <div className="checkout-form-heading">
            <h2>Payment methods</h2>
            <p>Select how you want to pay for this order.</p>
          </div>

          <div className="payment-method-list">
            {paymentMethods.map((method) => {
              const Icon = method.icon;
              return (
                <div className="payment-method-block" key={method.id}>
                  <button
                    className={selectedMethod === method.id ? 'payment-method active' : 'payment-method'}
                    type="button"
                    onClick={() => {
                      setSelectedMethod(method.id);
                      setStatus(null);
                    }}
                  >
                    <Icon size={22} />
                    <span>
                      <strong>{method.label}</strong>
                      <small>{method.description}</small>
                    </span>
                  </button>
                  {selectedMethod === method.id && renderPaymentDetails(method.id)}
                </div>
              );
            })}
          </div>

          {status && (
            <div className={`checkout-status ${status.type}`}>
              {status.type === 'confirmed' && <CheckCircle2 size={18} />}
              <p>{status.message}</p>
            </div>
          )}

          <button
            className="confirm-booking-button"
            type="button"
            onClick={handleConfirmPayment}
            disabled={isSubmitting || status?.type === 'confirmed'}
          >
            {isSubmitting ? 'Confirming...' : status?.type === 'confirmed' ? 'Order Placed' : 'Confirm Payment'}
          </button>
        </div>

        <aside className="checkout-summary">
          <h2>Payable amount</h2>
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

          <div className="checkout-charge-list">
            <div className="price-row">
              <span>Product subtotal</span>
              <strong>{currency(subtotal)}</strong>
            </div>
            <div className="price-row">
              <span>GST 18%</span>
              <strong>{currency(gstAmount)}</strong>
            </div>
            <div className="price-row">
              <span>Delivery charge</span>
              <strong>{currency(deliveryCharge)}</strong>
            </div>
          </div>

          <div className="checkout-total">
            <span>Total payable</span>
            <strong>{currency(totalAmount)}</strong>
          </div>
        </aside>
      </section>
    </main>
  );
}

export default ProductPayment;
