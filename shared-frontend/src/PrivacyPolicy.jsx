import { Mail, Scissors } from 'lucide-react';

function LegalHeader({ title, subtitle }) {
  return (
    <header className="legal-header">
      <a className="brand legal-brand" href="#/home" aria-label="StyleCut home">
        <span className="brand-mark">
          <Scissors size={22} />
        </span>
        <span className="brand-text">
          <strong>StyleCut</strong>
          <small>Salon Studio</small>
        </span>
      </a>

      <div className="legal-heading">
        <p>StyleCut Salon</p>
        <h1>{title}</h1>
        <span>{subtitle}</span>
      </div>
    </header>
  );
}

export function DataDeletion() {
  return (
    <main className="legal-page">
      <LegalHeader
        title="Data Deletion Instructions"
        subtitle="How customers can request removal of StyleCut account and booking data."
      />

      <section className="legal-content">
        <p>
          StyleCut users can request deletion of their personal data by emailing us with the subject line
          <strong> Delete My StyleCut Data</strong>.
        </p>

        <h2>How to Request Deletion</h2>
        <p>
          Send an email to <a href="mailto:stylecutofficial@gmail.com">stylecutofficial@gmail.com</a> and include your
          registered name, phone number, and email address so we can verify the request.
        </p>

        <h2>What We Delete</h2>
        <p>
          After verification, StyleCut will delete or anonymize associated account, booking, order, review, and
          notification data where legally permitted.
        </p>

        <h2>Contact</h2>
        <p>
          <Mail size={18} /> <a href="mailto:stylecutofficial@gmail.com">stylecutofficial@gmail.com</a>
        </p>
      </section>
    </main>
  );
}

function PrivacyPolicy() {
  return (
    <main className="legal-page">
      <LegalHeader
        title="Privacy Policy"
        subtitle="How StyleCut collects, uses, and protects customer information."
      />

      <section className="legal-content">
        <p>
          StyleCut collects customer information only to provide salon bookings, product ordering, appointment updates,
          customer support, and service notifications.
        </p>

        <h2>Information We Collect</h2>
        <p>
          We may collect name, phone number, email address, booking details, order details, delivery details, feedback,
          ratings, and communication preferences.
        </p>

        <h2>How We Use Information</h2>
        <p>
          Customer information is used to manage appointments, process product orders, send booking and order updates,
          provide support, improve our services, and send WhatsApp, email, or phone notifications related to StyleCut.
        </p>

        <h2>Data Sharing</h2>
        <p>
          We do not sell personal data. We share information only with service providers needed to operate StyleCut,
          such as hosting, database, payment, email, and WhatsApp notification providers.
        </p>

        <h2>Data Security</h2>
        <p>
          We use reasonable technical and organizational measures to protect customer information from unauthorized
          access, misuse, loss, or alteration.
        </p>

        <h2>Data Deletion</h2>
        <p>
          Customers can request deletion of their data at any time by visiting <a href="#/data-deletion">Data Deletion Instructions</a>
          or emailing us directly.
        </p>

        <h2>Contact</h2>
        <p>
          <Mail size={18} /> <a href="mailto:stylecutofficial@gmail.com">stylecutofficial@gmail.com</a>
        </p>

        <p className="legal-updated">Last updated: May 27, 2026</p>
      </section>
    </main>
  );
}

export default PrivacyPolicy;
