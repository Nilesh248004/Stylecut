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
import PrivacyPolicy, { DataDeletion } from './PrivacyPolicy';
import { useEffect, useState } from 'react';

const LOCAL_DEFAULT_PAGES = {
  '5174': 'barber-auth'
};
const APP_ROLE = import.meta.env.VITE_APP_ROLE || 'client';
const CLIENT_PAGES = new Set([
  'account',
  'bridals',
  'client-auth',
  'data-deletion',
  'home',
  'privacy',
  'product-checkout',
  'product-payment',
  'products',
  'service'
]);
const BARBER_PAGES = new Set(['barber', 'barber-auth']);

function getDefaultPage() {
  return import.meta.env.VITE_DEFAULT_PAGE || LOCAL_DEFAULT_PAGES[window.location.port] || 'client-auth';
}

function getRawPageFromHash() {
  return window.location.hash.replace('#/', '');
}

function isAllowedPage(page) {
  if (APP_ROLE === 'barber') {
    return BARBER_PAGES.has(page);
  }

  if (page.startsWith('book')) {
    return true;
  }

  return CLIENT_PAGES.has(page);
}

function normalizePage(page) {
  if (isAllowedPage(page)) {
    return page;
  }

  return getDefaultPage();
}

function getPageFromHash() {
  const page = getRawPageFromHash();
  if (page) {
    return normalizePage(page);
  }

  return getDefaultPage();
}

function App() {
  const [page, setPage] = useState(getPageFromHash);

  useEffect(() => {
    function handleHashChange() {
      const rawPage = getRawPageFromHash();
      const nextPage = rawPage ? normalizePage(rawPage) : getDefaultPage();

      if (rawPage && rawPage !== nextPage) {
        window.location.hash = `#/${nextPage}`;
        return;
      }

      setPage(nextPage);
    }

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (page.startsWith('book')) {
    if (APP_ROLE === 'barber') {
      return <BarberAuth />;
    }

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

  if (page === 'privacy') {
    return <PrivacyPolicy />;
  }

  if (page === 'data-deletion') {
    return <DataDeletion />;
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
