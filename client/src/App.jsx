import Homepage from './Homepage';
import Products from './Products';
import Service from './Service';
import Book from './Book';
import Bridals from './Bridals';
import BarberDashboard from './BarberDashboard';
import BarberAuth from './BarberAuth';
import ClientAuth from './ClientAuth';
import Account from './Account';
import ProductCheckout from './ProductCheckout';
import ProductPayment from './ProductPayment';
import { useEffect, useState } from 'react';

function getPageFromHash() {
  const page = window.location.hash.replace('#/', '');
  if (page) {
    return page;
  }

  if (import.meta.env.VITE_DEFAULT_PAGE) {
    return import.meta.env.VITE_DEFAULT_PAGE;
  }

  return 'client-auth';
}

function App() {
  const [page, setPage] = useState(getPageFromHash);

  useEffect(() => {
    function handleHashChange() {
      setPage(getPageFromHash());
    }

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (page.startsWith('book')) {
    const [, serviceId] = page.split('/');
    return <Book serviceId={serviceId} />;
  }

  if (page === 'service') {
    return <Service />;
  }

  if (page === 'products') {
    return <Products />;
  }

  if (page === 'product-checkout') {
    return <ProductCheckout />;
  }

  if (page === 'product-payment') {
    return <ProductPayment />;
  }

  if (page === 'bridals') {
    return <Bridals />;
  }

  if (page === 'client-auth') {
    return <ClientAuth />;
  }

  if (page === 'home') {
    return <Homepage />;
  }

  if (page === 'account') {
    const isClientSignedIn = Boolean(window.localStorage.getItem('stylecut_client_token'));
    return isClientSignedIn ? <Account /> : <ClientAuth />;
  }

  if (page === 'barber-auth') {
    return <BarberAuth />;
  }

  if (page === 'barber') {
    const isBarberSignedIn = Boolean(window.localStorage.getItem('stylecut_barber_token'));
    return isBarberSignedIn ? <BarberDashboard /> : <BarberAuth />;
  }

  return <Homepage />;
}

export default App;
