import { CalendarDays, CheckCircle2, ChevronDown, Clock, Mail, Phone, User, UserCheck } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { createAppointment, getServices, getStylistAvailability, getStylists } from './api';
import { playSuccessNoticeSound } from './sounds';

const fallbackServices = [
  {
    id: 1,
    name: 'Classic Haircut',
    category: 'Hair',
    description: 'Personalized haircut with wash, styling, and finishing.',
    min_price: 299,
    max_price: 599,
    duration_minutes: 45
  },
  {
    id: 2,
    name: 'Beard Trim and Shape',
    category: 'Grooming',
    description: 'Clean beard trim, neckline shaping, and detailing.',
    min_price: 149,
    max_price: 349,
    duration_minutes: 25
  },
  {
    id: 3,
    name: 'Hair Spa',
    category: 'Hair Treatment',
    description: 'Deep conditioning treatment for dry or damaged hair.',
    min_price: 799,
    max_price: 1499,
    duration_minutes: 60
  },
  {
    id: 4,
    name: 'Facial Cleanup',
    category: 'Skin Care',
    description: 'Refreshing facial cleanup for brighter, cleaner skin.',
    min_price: 499,
    max_price: 999,
    duration_minutes: 45
  },
  {
    id: 5,
    name: 'Premium Facial',
    category: 'Skin Care',
    description: 'Advanced facial treatment based on skin type.',
    min_price: 1199,
    max_price: 2499,
    duration_minutes: 75
  },
  {
    id: 6,
    name: 'Hair Color',
    category: 'Hair',
    description: 'Professional hair coloring with consultation.',
    min_price: 999,
    max_price: 3999,
    duration_minutes: 120
  }
];

function currency(value) {
  return Number(value).toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  });
}

function toApiTime(timeLabel) {
  const [time, period] = timeLabel.split(' ');
  const [hourValue, minute] = time.split(':').map(Number);
  const hour = period === 'PM' && hourValue !== 12 ? hourValue + 12 : period === 'AM' && hourValue === 12 ? 0 : hourValue;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
}

function formatDisplayDate(dateValue) {
  if (!dateValue) {
    return '';
  }

  const [year, month, day] = dateValue.split('-');
  return `${day}-${month}-${year}`;
}

const fallbackStylists = ['Raghul', 'Chang Lee', 'Jason Makki', 'Vasanth', 'Aalim Hakim'];
const timeSlots = ['10:00 AM', '11:30 AM', '01:00 PM', '02:30 PM', '04:00 PM'];

function Book({ serviceId }) {
  const [services, setServices] = useState([]);
  const [stylists, setStylists] = useState(fallbackStylists);
  const [bookedSlots, setBookedSlots] = useState({});
  const [selectedServiceId, setSelectedServiceId] = useState(serviceId || '');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState(timeSlots[0]);
  const [selectedBarber, setSelectedBarber] = useState(fallbackStylists[0]);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [confirmation, setConfirmation] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isStylistMenuOpen, setIsStylistMenuOpen] = useState(false);

  async function refreshStylistAvailability(date = selectedDate) {
    const availability = await getStylistAvailability(date);
    setBookedSlots(availability.booked || {});
    if (availability.stylists?.length) {
      setStylists(availability.stylists);
      setSelectedBarber((current) => availability.stylists.includes(current) ? current : availability.stylists[0]);
    }
  }

  useEffect(() => {
    async function loadServices() {
      try {
        const serviceData = await getServices();
        setServices(serviceData);
        setSelectedServiceId((current) => current || String(serviceData[0]?.id || ''));
      } catch {
        setServices(fallbackServices);
        setSelectedServiceId((current) => current || String(fallbackServices[0].id));
      }
    }

    loadServices();
  }, []);

  useEffect(() => {
    async function loadStylists() {
      try {
        const stylistData = await getStylists();
        const nextStylists = stylistData.length ? stylistData : fallbackStylists;
        setStylists(nextStylists);
        setSelectedBarber((current) => nextStylists.includes(current) ? current : nextStylists[0]);
      } catch {
        setStylists(fallbackStylists);
        setSelectedBarber((current) => fallbackStylists.includes(current) ? current : fallbackStylists[0]);
      }
    }

    loadStylists();
  }, []);

  useEffect(() => {
    let isActive = true;

    async function loadAvailability() {
      try {
        const availability = await getStylistAvailability(selectedDate);
        if (!isActive) {
          return;
        }

        setBookedSlots(availability.booked || {});
        if (availability.stylists?.length) {
          setStylists(availability.stylists);
          setSelectedBarber((current) => availability.stylists.includes(current) ? current : availability.stylists[0]);
        }
      } catch {
        if (isActive) {
          setBookedSlots({});
        }
      }
    }

    loadAvailability();

    return () => {
      isActive = false;
    };
  }, [selectedDate]);

  const service = useMemo(() => {
    return services.find((item) => item.id === Number(selectedServiceId));
  }, [services, selectedServiceId]);

  const stylistAvailability = useMemo(() => {
    return stylists.map((stylist) => {
      const isAvailable = !(bookedSlots[stylist] || []).includes(toApiTime(selectedTime).slice(0, 5));
      return {
        name: stylist,
        status: isAvailable ? 'available' : 'at-work',
        label: isAvailable ? 'Available' : 'At work'
      };
    });
  }, [bookedSlots, selectedTime, stylists]);

  const selectedStylistStatus = stylistAvailability.find((stylist) => stylist.name === selectedBarber);
  const isBookingConfirmed = confirmation?.status === 'confirmed';

  useEffect(() => {
    const selectedIsAvailable = selectedStylistStatus?.status === 'available';
    const firstAvailableStylist = stylistAvailability.find((stylist) => stylist.status === 'available');

    if (!selectedIsAvailable && firstAvailableStylist) {
      setSelectedBarber(firstAvailableStylist.name);
    }
  }, [selectedBarber, selectedStylistStatus, stylistAvailability]);

  const handleStylistSelect = (stylist) => {
    if (stylist.status !== 'available') {
      return;
    }

    setSelectedBarber(stylist.name);
    setIsStylistMenuOpen(false);
    setConfirmation(null);
  };

  const handleConfirmBooking = async () => {
    if (selectedStylistStatus?.status !== 'available') {
      setConfirmation({ status: 'error', message: 'Selected stylist is at work. Please choose an available stylist.' });
      return;
    }

    if (!customerName || !customerEmail || !customerPhone) {
      setConfirmation({ status: 'error', message: 'Please enter your name, email, and phone number.' });
      return;
    }

    setIsSubmitting(true);

    try {
      await createAppointment({
        customerName,
        customerEmail,
        customerPhone,
        serviceId: service.id,
        appointmentDate: selectedDate,
        appointmentTime: toApiTime(selectedTime),
        preferredBarber: selectedBarber
      });

      setConfirmation({
        status: 'confirmed',
        message: `Your booking for ${service.name} with ${selectedBarber} on ${selectedDate} at ${selectedTime} is confirmed.`
      });
      await refreshStylistAvailability(selectedDate);
      playSuccessNoticeSound();
    } catch (error) {
      await refreshStylistAvailability(selectedDate).catch(() => {});
      setConfirmation({
        status: 'error',
        message: error.message || 'Could not confirm this booking. Please try another stylist or time.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!service) {
    return (
      <main className="booking-page">
        <section className="booking-missing">
          <h1>Preparing booking</h1>
          <p>Please wait while we load available salon services.</p>
          <a href="#/service" className="back-home booking-back">
            Back
          </a>
        </section>
      </main>
    );
  }

  return (
    <main className="booking-page">
      <section className="booking-header">
        <div className="booking-topbar">
          <div>
            <p className="booking-kicker">Book your service</p>
            <h1>Reserve your salon slot</h1>
            <p className="booking-summary">Choose a service, share your details, and confirm a time that works for you.</p>
          </div>
          <div className="booking-nav-actions">
            <a href="#/service" className="back-home booking-back">
              Back to Service
            </a>
            <a href="#/home" className="back-home booking-back booking-home-back">
              Back to Home
            </a>
          </div>
        </div>

        <div className="booking-meta">
          <span>
            <Clock size={18} /> {service.duration_minutes} min
          </span>
          <span>
            <UserCheck size={18} /> Select time, stylist, and confirm availability
          </span>
          <span>
            <strong>{currency(service.min_price)}</strong> - {currency(service.max_price)}
          </span>
        </div>
      </section>

      <section className="booking-content">
        <div className="booking-detail-panel">
          <div className="booking-detail-card">
            <div className="booking-card-header">
              <h2>Appointment details</h2>
              <p>Select your service, date, time, preferred stylist, and contact details.</p>
            </div>

            <label className="booking-field">
              <span>Service</span>
              <select
                value={selectedServiceId}
                onChange={(event) => {
                  setSelectedServiceId(event.target.value);
                  setConfirmation(null);
                }}
              >
                {services.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="booking-field">
              <span>Date</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(event) => {
                  setSelectedDate(event.target.value);
                  setConfirmation(null);
                }}
                min={new Date().toISOString().split('T')[0]}
              />
            </label>

            <div className="booking-customer-grid">
              <label className="booking-field">
                <span>
                  <User size={16} /> Full name
                </span>
                <input
                  value={customerName}
                  onChange={(event) => setCustomerName(event.target.value)}
                  placeholder="Your name"
                />
              </label>

              <label className="booking-field">
                <span>
                  <Phone size={16} /> Phone
                </span>
                <input
                  value={customerPhone}
                  onChange={(event) => setCustomerPhone(event.target.value)}
                  placeholder="+91 98765 43210"
                />
              </label>
            </div>

            <label className="booking-field">
              <span>
                <Mail size={16} /> Email
              </span>
              <input
                type="email"
                value={customerEmail}
                onChange={(event) => setCustomerEmail(event.target.value)}
                placeholder="you@example.com"
              />
            </label>

            <div className="booking-schedule-grid">
              <label className="booking-field">
                <span>Time</span>
                <select
                  value={selectedTime}
                  onChange={(event) => {
                    setSelectedTime(event.target.value);
                    setIsStylistMenuOpen(false);
                    setConfirmation(null);
                  }}
                >
                  {timeSlots.map((time) => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </label>

              <div className="booking-field">
                <span>Stylist</span>
                <div className="stylist-dropdown">
                  <button
                    aria-expanded={isStylistMenuOpen}
                    className="stylist-select-button"
                    type="button"
                    onClick={() => setIsStylistMenuOpen((current) => !current)}
                  >
                    <span>{selectedBarber}</span>
                    <small className={selectedStylistStatus?.status === 'available' ? 'available' : 'at-work'}>
                      {selectedStylistStatus?.label || 'At work'}
                    </small>
                    <ChevronDown size={18} />
                  </button>

                  {isStylistMenuOpen && (
                    <div className="stylist-menu">
                      {stylistAvailability.map((stylist) => (
                        <button
                          className={selectedBarber === stylist.name ? 'selected' : ''}
                          disabled={stylist.status !== 'available'}
                          key={stylist.name}
                          type="button"
                          onClick={() => handleStylistSelect(stylist)}
                        >
                          <span>{stylist.name}</span>
                          <small className={stylist.status}>{stylist.label}</small>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="booking-actions">
              <button
                type="button"
                className={`confirm-booking-button ${isBookingConfirmed ? 'confirmed' : ''}`}
                onClick={handleConfirmBooking}
                disabled={isSubmitting || isBookingConfirmed}
              >
                {isBookingConfirmed ? (
                  <>
                    <CheckCircle2 size={18} /> Confirmed
                  </>
                ) : isSubmitting ? (
                  'Confirming...'
                ) : (
                  'Confirm Booking'
                )}
              </button>
            </div>

            <div className="booking-status-panel">
              <div className={`booking-status ${selectedStylistStatus?.status === 'available' ? 'available' : 'unavailable'}`}>
                <p>
                  {selectedStylistStatus?.status === 'available'
                    ? `${selectedBarber} is available at ${selectedTime}.`
                    : 'All stylists are at work for this slot. Choose another time.'}
                </p>
              </div>

              {confirmation && (
                <div className={`booking-confirmation ${confirmation.status}`}>
                  <p>{confirmation.message}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <aside className="booking-summary-panel">
          <div className="booking-summary-card">
            <h2>Service details</h2>
            <div className="booking-summary-row">
              <span>Service</span>
              <strong>{service.name}</strong>
            </div>
            <div className="booking-summary-row">
              <span>Date</span>
              <strong>{formatDisplayDate(selectedDate)}</strong>
            </div>
            <div className="booking-summary-row">
              <span>Time</span>
              <strong>{selectedTime}</strong>
            </div>
            <div className="booking-summary-row">
              <span>Preferred stylist</span>
              <strong>{selectedBarber}</strong>
            </div>
            <div className="booking-summary-row booking-summary-price">
              <span>Price estimate</span>
              <strong>{currency(service.min_price)} - {currency(service.max_price)}</strong>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}

export default Book;
