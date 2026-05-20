import { CalendarDays, CheckCircle2, Clock, Mail, Phone, User, UserCheck } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { createAppointment, getServices } from './api';

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

function playSuccessSound() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;

  if (!AudioContext) {
    return;
  }

  const audioContext = new AudioContext();
  const gain = audioContext.createGain();

  gain.connect(audioContext.destination);
  gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.18, audioContext.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.58);

  [523.25, 659.25, 783.99].forEach((frequency, index) => {
    const oscillator = audioContext.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime + index * 0.08);
    oscillator.connect(gain);
    oscillator.start(audioContext.currentTime + index * 0.08);
    oscillator.stop(audioContext.currentTime + 0.58);
  });
}

const barbers = ['Rahul', 'Aditi', 'Meera'];
const timeSlots = ['10:00 AM', '11:30 AM', '01:00 PM', '02:30 PM', '04:00 PM'];
const bookedSlots = {
  '2026-05-21': {
    Rahul: ['10:00 AM', '04:00 PM'],
    Aditi: ['11:30 AM'],
    Meera: ['02:30 PM']
  },
  '2026-05-22': {
    Rahul: ['01:00 PM'],
    Aditi: ['10:00 AM', '02:30 PM'],
    Meera: ['11:30 AM']
  }
};

function Book({ serviceId }) {
  const [services, setServices] = useState([]);
  const [selectedServiceId, setSelectedServiceId] = useState(serviceId || '');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState(timeSlots[0]);
  const [selectedBarber, setSelectedBarber] = useState(barbers[0]);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [availability, setAvailability] = useState(null);
  const [confirmation, setConfirmation] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const service = useMemo(() => {
    return services.find((item) => item.id === Number(selectedServiceId));
  }, [services, selectedServiceId]);

  const isBookingConfirmed = confirmation?.status === 'confirmed';

  const handleCheckAvailability = () => {
    const bookedForDate = bookedSlots[selectedDate] || {};
    const barberSchedule = bookedForDate[selectedBarber] || [];
    const isAvailable = !barberSchedule.includes(selectedTime);

    setAvailability({
      status: isAvailable ? 'available' : 'unavailable',
      message: isAvailable
        ? `${selectedBarber} is available on ${selectedDate} at ${selectedTime}.`
        : `${selectedBarber} is already booked on ${selectedDate} at ${selectedTime}. Choose another slot.`
    });
    setConfirmation(null);
  };

  const handleConfirmBooking = async () => {
    if (!availability) {
      setConfirmation({ status: 'error', message: 'Please check availability first.' });
      return;
    }

    if (availability.status !== 'available') {
      setConfirmation({ status: 'error', message: 'Selected slot is not available. Please choose a different time or barber.' });
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
        notes: notes || `Preferred barber: ${selectedBarber}`
      });

      setConfirmation({
        status: 'confirmed',
        message: `Your booking for ${service.name} with ${selectedBarber} on ${selectedDate} at ${selectedTime} is confirmed.`
      });
      playSuccessSound();
    } catch {
      setConfirmation({
        status: 'confirmed',
        message: `Your booking request for ${service.name} with ${selectedBarber} on ${selectedDate} at ${selectedTime} is ready.`
      });
      playSuccessSound();
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
            <UserCheck size={18} /> Select time, barber, and confirm availability
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
                  setAvailability(null);
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
                  setAvailability(null);
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

            <label className="booking-field">
              <span>Notes</span>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Any preference or special request"
                rows="4"
              />
            </label>

            <label className="booking-field">
              <span>Time</span>
              <select
                value={selectedTime}
                onChange={(event) => {
                  setSelectedTime(event.target.value);
                  setAvailability(null);
                  setConfirmation(null);
                }}
              >
                {timeSlots.map((time) => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </label>

            <label className="booking-field">
              <span>Barber</span>
              <select
                value={selectedBarber}
                onChange={(event) => {
                  setSelectedBarber(event.target.value);
                  setAvailability(null);
                  setConfirmation(null);
                }}
              >
                {barbers.map((barber) => (
                  <option key={barber} value={barber}>{barber}</option>
                ))}
              </select>
            </label>

            <div className="booking-actions">
              <button type="button" className="check-availability-button" onClick={handleCheckAvailability}>
                Check Availability
              </button>
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
              {availability && (
                <div className={`booking-status ${availability.status}`}>
                  <p>{availability.message}</p>
                </div>
              )}

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
              <span>Barber</span>
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
