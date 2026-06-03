import { Clock, IndianRupee, Search, Scissors } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { getServices } from './api';

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

const serviceImages = {
  'classic haircut':
    'https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=1000&q=80',
  'beard trim and shape':
    'https://images.unsplash.com/photo-1621607512022-6aecc4fed814?auto=format&fit=crop&w=1000&q=80',
  'hair spa':
  'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1000&q=80',
  'facial cleanup':
    'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=1000&q=80',
  'premium facial':
    'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1000&q=80',
  'hair color':
    'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1000&q=80'
};

function getServiceImage(service) {
  const name = service.name.toLowerCase();
  return serviceImages[name];
}

function currency(value) {
  return Number(value).toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  });
}

function Service() {
  const [services, setServices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function loadServices() {
      try {
        setServices(await getServices());
      } catch {
        setServices(fallbackServices);
      }
    }

    loadServices();
  }, []);

  const filteredServices = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) {
      return services;
    }

    return services.filter((service) =>
      [service.name, service.category, service.description].some((value) =>
        value.toLowerCase().includes(query)
      )
    );
  }, [searchTerm, services]);

  return (
    <main className="service-page">
      <header className="service-header">
        <nav className="service-nav" aria-label="Service navigation">
          <a className="brand service-brand" href="#/home" aria-label="StyleCut home">
            <span className="brand-mark">
              <Scissors size={22} />
            </span>
            <span className="brand-text">
              <strong>StyleCut</strong>
              <small>Salon Studio</small>
            </span>
          </a>

          <a className="back-home" href="#/home" aria-label="Go back to home">
            Back
          </a>
        </nav>

        <div className="service-hero">
          <p className="service-kicker">Our services...</p>
          <h1>Find the right service</h1>
          <p>Search haircuts, facials, grooming treatments, and salon care by name or category.</p>

          <label className="search-box">
            <Search size={22} />
            <input
              type="search"
              placeholder="Search for haircut, facial, beard, hair spa..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </label>
        </div>
      </header>

      <section className="service-results" aria-label="Service results">
        {filteredServices.map((service) => (
          <article className="service-list-card" key={service.id}>
            <img
              src={getServiceImage(service) || 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=1000&q=80'}
              alt={service.name}
            />

            <div className="service-card-body">
              <span className="service-category">{service.category}</span>
              <h2>{service.name}</h2>
              <p>{service.description}</p>

              <div className="service-meta">
                <span>
                  <IndianRupee size={18} />
                  {currency(service.min_price)} - {currency(service.max_price)}
                </span>
                <span>
                  <Clock size={18} />
                  {service.duration_minutes} min
                </span>
              </div>

              <a className="book-now-button" href={`#/book/${service.id}`}>
                Book Now
              </a>
            </div>
          </article>
        ))}

        {filteredServices.length === 0 && (
          <div className="empty-services">
            <h2>No service found</h2>
            <p>Try searching with a different service name or category.</p>
          </div>
        )}
      </section>
    </main>
  );
}

export default Service;
