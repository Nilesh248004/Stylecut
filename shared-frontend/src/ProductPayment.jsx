import { ArrowLeft, Banknote, CheckCircle2, Copy, CreditCard, QrCode, Scissors, ShieldCheck } from 'lucide-react';
import { useMemo, useState } from 'react';
import { createProductOrder } from './api';
import { playSuccessNoticeSound } from './sounds';

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

const gstRate = 0.18;
const deliveryCharge = 60;
const merchantUpiId = import.meta.env.VITE_MERCHANT_UPI_ID || '';
const merchantName = import.meta.env.VITE_MERCHANT_NAME || 'StyleCut Salon';
const paymentMethods = [
  { id: 'upi', label: 'UPI', description: 'Pay now using Google Pay, PhonePe, Paytm, or any UPI app.', icon: QrCode },
  { id: 'card', label: 'Credit / Debit Card', description: 'Pay by card on delivery or collection.', icon: CreditCard },
  { id: 'cod', label: 'Cash on Delivery', description: 'Pay in cash when the product reaches you.', icon: Banknote }
];

function ProductPayment() {
  const [pendingOrder] = useState(readPendingOrder);
  const [selectedMethod, setSelectedMethod] = useState('upi');
  const [paymentDetails, setPaymentDetails] = useState({
    upiReference: ''
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
  const appliedDeliveryCharge = selectedMethod === 'cod' ? deliveryCharge : 0;
  const totalAmount = subtotal + gstAmount + appliedDeliveryCharge;
  const isUpiConfigured = Boolean(merchantUpiId.trim());
  const upiPaymentUrl = new URLSearchParams({
    pa: merchantUpiId,
    pn: merchantName,
    am: totalAmount.toFixed(2),
    cu: 'INR',
    tn: 'StyleCut product order'
  });
  const qrImageUrl = isUpiConfigured
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(`upi://pay?${upiPaymentUrl.toString()}`)}`
    : '';

  function handlePaymentDetailChange(event) {
    const { name, value } = event.target;
    setPaymentDetails((current) => ({ ...current, [name]: value }));
  }

  function validatePaymentDetails() {
    if (selectedMethod === 'upi' && !isUpiConfigured) {
      return 'UPI payment is not configured. Please choose card or cash on delivery.';
    }

    if (selectedMethod === 'upi' && !paymentDetails.upiReference.trim()) {
      return 'Please enter the UPI transaction/reference ID after payment.';
    }

    return '';
  }

  async function copyUpiId() {
    if (!isUpiConfigured) {
      setStatus({ type: 'error', message: 'UPI payment is not configured.' });
      return;
    }

    await navigator.clipboard?.writeText(merchantUpiId);
    setStatus({ type: 'info', message: 'UPI ID copied.' });
  }

  async function handleConfirmPayment() {
    if (!pendingOrder) {
      return;
    }

    const validationMessage = validatePaymentDetails();

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
          `Payment method: ${paymentMethods.find((item) => item.id === selectedMethod)?.label}`,
          selectedMethod === 'upi' ? `UPI ID: ${merchantUpiId}` : '',
          selectedMethod === 'upi' ? `UPI reference: ${paymentDetails.upiReference.trim()}` : '',
          selectedMethod === 'card' ? 'Card payment to be collected on delivery or collection' : '',
          selectedMethod === 'cod' ? 'Cash to be collected on delivery' : '',
          `Subtotal: ${currency(subtotal)}`,
          `GST: ${currency(gstAmount)}`,
          `Delivery: ${appliedDeliveryCharge ? currency(appliedDeliveryCharge) : 'Free'}`
        ].filter(Boolean).join(' | '),
        items: pendingOrder.items,
        totalAmount
      });

      window.localStorage.removeItem('stylecut_pending_product_order');
      window.localStorage.removeItem('stylecut_product_cart');
      setOrderConfirmation({
        id: createdOrder.id,
        paymentMethod: paymentMethods.find((item) => item.id === selectedMethod)?.label,
        totalAmount
      });
      playSuccessNoticeSound();
      setStatus(null);
    } catch {
      setStatus({ type: 'error', message: 'Could not place order. Please make sure the backend and database are running.' });
    } finally {
      setIsSubmitting(false);
    }
  }

  function renderPaymentDetails(methodId) {
    if (methodId === 'upi') {
      if (!isUpiConfigured) {
        return (
          <div className="payment-method-details">
            <div className="payment-live-note">
              UPI payment is not configured yet. Add a real UPI ID in the client environment before accepting live UPI payments.
            </div>
          </div>
        );
      }

      return (
        <div className="payment-method-details">
          <div className="manual-upi-panel">
            <div className="manual-upi-qr-wrap">
              <div className="manual-upi-qr" aria-label={`Scan to pay ${merchantName} at UPI ID ${merchantUpiId}`}>
                <img src={qrImageUrl} alt={`UPI QR for ${currency(totalAmount)} payment to ${merchantName}`} />
              </div>
              <span>Scan to Pay</span>
            </div>

            <div className="manual-upi-details">
              <span>Payable amount</span>
              <strong>{currency(totalAmount)}</strong>
              <div className="manual-upi-id">
                <code>{merchantUpiId}</code>
                <button type="button" onClick={copyUpiId}>
                  <Copy size={16} /> Copy
                </button>
              </div>
              <small>Open Google Pay, PhonePe, Paytm, or any UPI app and pay to this UPI ID.</small>
            </div>
          </div>

          <label className="booking-field">
            <span>UPI transaction/reference ID</span>
            <input
              name="upiReference"
              value={paymentDetails.upiReference}
              onChange={handlePaymentDetailChange}
              placeholder="Example: 413456789012"
            />
          </label>

          <div className="payment-live-note">
            Orders paid by manual UPI are marked for verification in the barber dashboard.
          </div>
        </div>
      );
    }

    if (methodId === 'card') {
      return (
        <div className="payment-method-details">
          <div className="cod-breakdown-title">
            <CreditCard size={20} />
            <strong>Card payment details</strong>
          </div>
          <div className="payment-live-note">
            Card payment will be collected using the salon card machine during delivery or pickup. No card number or CVV is stored in this website.
          </div>
        </div>
      );
    }

    if (methodId === 'cod') {
      return (
        <div className="payment-method-details cod-breakdown">
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
            <span>Total amount</span>
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
        <h1>Payment</h1>
      </section>

      <section className="checkout-layout payment-layout">
        <div className="checkout-form payment-panel">
          <div className="checkout-form-heading">
            <h2>Choose payment option</h2>
            <p>Select UPI for manual verification, or choose card/cash collection on delivery.</p>
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
            {isSubmitting ? 'Confirming...' : selectedMethod === 'upi' ? 'Place Order for Verification' : 'Place Order'}
          </button>
        </div>

        <aside className="checkout-summary">
          <h2>Payable amount</h2>
          <div className="checkout-items">
            {pendingOrder.items.map((item) => (
              <div className="checkout-item" key={item.id}>
                <div>
                  <strong>{item.name}</strong>
                  <span>{currency(item.price)} x {item.quantity}</span>
                </div>
                <p>{currency(Number(item.price) * item.quantity)}</p>
              </div>
            ))}
          </div>

          <div className="checkout-charge-list">
            <strong className="checkout-charge-title">Price details</strong>
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
              <strong>{appliedDeliveryCharge ? currency(appliedDeliveryCharge) : 'Free'}</strong>
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
