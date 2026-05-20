import { CalendarDays, Check, Gem, Home, Scissors, Sparkles } from 'lucide-react';
import { useMemo, useState } from 'react';
import { createBridalRequest } from './api';

const makeupPackages = [
  {
    id: 'classic',
    name: 'Classic Bridal Makeup',
    price: 8999,
    description: 'HD base, eye makeup, hairstyling, saree or dupatta draping, and final touch-up.'
  },
  {
    id: 'premium',
    name: 'Premium Bridal Makeup',
    price: 14999,
    description: 'Long-wear premium products, detailed hairstyling, lashes, draping, and touch-up kit.'
  },
  {
    id: 'luxury',
    name: 'Luxury Bridal Look',
    price: 22999,
    description: 'Luxury product finish, advanced skin prep, custom hairstyle, premium lashes, and full styling.'
  }
];

const groomingAddOns = [
  { id: 'facial', name: 'Pre-bridal facial', price: 2499 },
  { id: 'hairSpa', name: 'Hair spa treatment', price: 1499 },
  { id: 'manicure', name: 'Manicure and pedicure', price: 1799 },
  { id: 'waxing', name: 'Full body waxing', price: 2999 },
  { id: 'mehendi', name: 'Mehendi support', price: 3999 }
];

const bridalKitPrice = 3499;
const homeServicePerDay = 4500;

function currency(value) {
  return Number(value).toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  });
}

function Bridals() {
  const [selectedPackageId, setSelectedPackageId] = useState(makeupPackages[1].id);
  const [selectedAddOns, setSelectedAddOns] = useState([]);
  const [includeBridalKit, setIncludeBridalKit] = useState(true);
  const [homeService, setHomeService] = useState(false);
  const [homeServiceDays, setHomeServiceDays] = useState(1);
  const [eventDate, setEventDate] = useState('');
  const [location, setLocation] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [requestStatus, setRequestStatus] = useState('');

  const selectedPackage = useMemo(
    () => makeupPackages.find((item) => item.id === selectedPackageId),
    [selectedPackageId]
  );

  const selectedAddOnTotal = useMemo(
    () =>
      groomingAddOns
        .filter((item) => selectedAddOns.includes(item.id))
        .reduce((total, item) => total + item.price, 0),
    [selectedAddOns]
  );

  const homeServiceTotal = homeService ? homeServiceDays * homeServicePerDay : 0;
  const kitTotal = includeBridalKit ? bridalKitPrice : 0;
  const total = selectedPackage.price + selectedAddOnTotal + kitTotal + homeServiceTotal;

  function toggleAddOn(addOnId) {
    setSelectedAddOns((current) =>
      current.includes(addOnId)
        ? current.filter((item) => item !== addOnId)
        : [...current, addOnId]
    );
  }

  async function handleRequestBooking() {
    if (!customerName || !customerPhone) {
      setRequestStatus('Please enter bride name and WhatsApp phone number.');
      return;
    }

    try {
      await createBridalRequest({
        customerName,
        customerPhone,
        eventDate,
        location,
        packageName: selectedPackage.name,
        addOns: groomingAddOns.filter((item) => selectedAddOns.includes(item.id)),
        includeBridalKit,
        homeService,
        homeServiceDays: homeService ? homeServiceDays : 0,
        totalAmount: total
      });

      setRequestStatus('Bridal request sent to barber dashboard.');
    } catch {
      setRequestStatus('Could not send request. Please make sure the backend and database are running.');
    }
  }

  return (
    <main className="bridal-page">
      <header className="bridal-header">
        <nav className="bridal-nav">
          <a className="brand bridal-brand" href="#/home" aria-label="StyleCut home">
            <span className="brand-mark">
              <Scissors size={22} />
            </span>
            <span className="brand-text">
              <strong>StyleCut</strong>
              <small>Bridal Studio</small>
            </span>
          </a>

          <a className="back-home bridal-back" href="#/home">
            Back
          </a>
        </nav>

        <div className="bridal-hero">
          <p className="bridal-kicker">
            <Gem size={18} />
            Bridal grooming calculator
          </p>
          <h1>Plan your complete bridal look</h1>
          <p>
            Select makeup type, bridal kit, extra grooming services, and home-service stylist days
            to calculate an estimated bridal package charge.
          </p>
        </div>
      </header>

      <section className="bridal-layout">
        <div className="bridal-config">
          <section className="bridal-card">
            <div className="bridal-card-heading">
              <Sparkles size={22} />
              <div>
                <h2>Makeup type</h2>
                <p>Choose the main bridal makeup package.</p>
              </div>
            </div>

            <div className="bridal-package-grid">
              {makeupPackages.map((item) => (
                <button
                  className={item.id === selectedPackageId ? 'bridal-package active' : 'bridal-package'}
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedPackageId(item.id)}
                >
                  <span>{item.name}</span>
                  <strong>{currency(item.price)}</strong>
                  <small>{item.description}</small>
                </button>
              ))}
            </div>
          </section>

          <section className="bridal-card">
            <div className="bridal-card-heading">
              <Check size={22} />
              <div>
                <h2>Extra grooming</h2>
                <p>Anything apart from the bridal kit is charged separately.</p>
              </div>
            </div>

            <div className="bridal-addon-grid">
              {groomingAddOns.map((item) => (
                <label className="bridal-addon" key={item.id}>
                  <input
                    type="checkbox"
                    checked={selectedAddOns.includes(item.id)}
                    onChange={() => toggleAddOn(item.id)}
                  />
                  <span>{item.name}</span>
                  <strong>{currency(item.price)}</strong>
                </label>
              ))}
            </div>
          </section>

          <section className="bridal-card bridal-home-card">
            <div className="bridal-card-heading">
              <Home size={22} />
              <div>
                <h2>Home service stylist</h2>
                <p>Book a stylist at home for the number of event days needed.</p>
              </div>
            </div>

            <div className="bridal-form-grid">
              <label className="bridal-field">
                <span>Bride name</span>
                <input
                  value={customerName}
                  onChange={(event) => setCustomerName(event.target.value)}
                  placeholder="Customer name"
                />
              </label>

              <label className="bridal-field">
                <span>WhatsApp phone</span>
                <input
                  value={customerPhone}
                  onChange={(event) => setCustomerPhone(event.target.value)}
                  placeholder="+91 98765 43210"
                />
              </label>

              <label className="bridal-toggle">
                <input
                  type="checkbox"
                  checked={homeService}
                  onChange={(event) => setHomeService(event.target.checked)}
                />
                <span>Need home service</span>
              </label>

              <label className="bridal-field">
                <span>Event date</span>
                <input
                  type="date"
                  value={eventDate}
                  onChange={(event) => setEventDate(event.target.value)}
                />
              </label>

              <label className="bridal-field">
                <span>Number of days</span>
                <input
                  min="1"
                  type="number"
                  value={homeServiceDays}
                  onChange={(event) => setHomeServiceDays(Math.max(1, Number(event.target.value)))}
                  disabled={!homeService}
                />
              </label>

              <label className="bridal-field bridal-location-field">
                <span>Home service location</span>
                <input
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  placeholder="Bride's home / venue address"
                  disabled={!homeService}
                />
              </label>
            </div>
          </section>
        </div>

        <aside className="bridal-summary">
          <div className="bridal-summary-card">
            <h2>Estimated charges</h2>

            <div className="bridal-summary-row">
              <span>{selectedPackage.name}</span>
              <strong>{currency(selectedPackage.price)}</strong>
            </div>

            <label className="bridal-kit-row">
              <input
                type="checkbox"
                checked={includeBridalKit}
                onChange={(event) => setIncludeBridalKit(event.target.checked)}
              />
              <span>Include bridal kit set</span>
              <strong>{currency(bridalKitPrice)}</strong>
            </label>

            <div className="bridal-summary-row">
              <span>Extra grooming</span>
              <strong>{currency(selectedAddOnTotal)}</strong>
            </div>

            <div className="bridal-summary-row">
              <span>Home service stylist</span>
              <strong>{currency(homeServiceTotal)}</strong>
            </div>

            <div className="bridal-total-row">
              <span>Total estimate</span>
              <strong>{currency(total)}</strong>
            </div>

            <button className="bridal-book-button" type="button" onClick={handleRequestBooking}>
              Request Bridal Booking
            </button>

            {requestStatus && <p className="bridal-request-status">{requestStatus}</p>}
          </div>
        </aside>
      </section>
    </main>
  );
}

export default Bridals;
