import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, MapPin, Clock, CreditCard, Phone, Mail, Sparkles } from 'lucide-react';
import BookingForm from '../components/bookings/BookingForm';

/* ─── Inline style block (injected once) ──────────────────────────────── */
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

    :root {
      --ink: #1a1a18;
      --parchment: #f5f0e8;
      --sage: #4a7c59;
      --sage-light: #6a9e79;
      --sage-muted: #d4e6da;
      --sand: #e8d5b0;
      --cream: #faf7f2;
      --rust: #c4622d;
      --stone: #8a8475;
      --white: #ffffff;
    }

    .nb-page {
      min-height: 100vh;
      overflow-x: hidden;
      background-color: var(--parchment);
      background-image:
        radial-gradient(ellipse 80% 60% at 10% 0%, rgba(74,124,89,0.07) 0%, transparent 60%),
        radial-gradient(ellipse 60% 80% at 90% 100%, rgba(196,98,45,0.05) 0%, transparent 60%);
      font-family: 'DM Sans', sans-serif;
      color: var(--ink);
    }

    /* ── HEADER ── */
    .nb-header {
      position: sticky;
      top: 0;
      z-index: 50;
      background: rgba(245,240,232,0.88);
      backdrop-filter: blur(16px);
      border-bottom: 1px solid rgba(26,26,24,0.08);
    }

    .nb-header-inner {
      max-width: 1100px;
      margin: 0 auto;
      padding: 1rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
    }

    .nb-eyebrow {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.65rem;
      font-weight: 600;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      color: var(--sage);
      margin-bottom: 0.3rem;
    }

    .nb-eyebrow-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--sage);
      animation: pulse 2.2s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.55; transform: scale(0.85); }
    }

    .nb-title {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: clamp(1.5rem, 3vw, 2rem);
      font-weight: 800;
      color: var(--ink);
      line-height: 1.15;
      letter-spacing: -0.02em;
    }

    .nb-back-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      padding: 0.55rem 1.1rem;
      border: 1.5px solid rgba(26,26,24,0.14);
      border-radius: 100px;
      background: var(--white);
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--ink);
      text-decoration: none;
      transition: border-color 0.2s, color 0.2s, box-shadow 0.2s;
      white-space: nowrap;
    }
    .nb-back-btn:hover {
      border-color: var(--sage);
      color: var(--sage);
      box-shadow: 0 0 0 3px rgba(74,124,89,0.08);
    }

    /* ── MAIN ── */
    .nb-main {
      max-width: 1100px;
      margin: 0 auto;
      width: 100%;
      padding: 1.25rem 1rem 3rem;
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: 1.25rem;
      align-items: start;
    }

    @media (min-width: 1024px) {
      .nb-main {
        padding: 2.5rem 1.5rem 4rem;
        grid-template-columns: minmax(0, 1fr) 340px;
        grid-template-rows: auto 1fr;
        gap: 1.75rem;
      }
      .nb-form-col,
      .nb-sidebar {
        grid-row: 2;
      }
    }

    @media (min-width: 640px) {
      .nb-header-inner {
        padding: 1.1rem 1.5rem;
      }
    }

    /* ── HERO BANNER ── */
    .nb-hero {
      grid-column: 1 / -1;
      position: relative;
      border-radius: 20px;
      overflow: hidden;
      background: var(--ink);
      padding: 1.25rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      flex-direction: column;
    }

    .nb-hero::before {
      content: '';
      position: absolute;
      inset: 0;
      background:
        radial-gradient(ellipse 60% 80% at 80% 50%, rgba(74,124,89,0.35) 0%, transparent 65%),
        radial-gradient(ellipse 40% 60% at 10% 20%, rgba(196,98,45,0.2) 0%, transparent 60%);
      pointer-events: none;
    }

    .nb-hero-text {
      position: relative;
      z-index: 1;
      width: 100%;
      min-width: 0;
    }

    .nb-hero-tag {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.15);
      border-radius: 100px;
      padding: 0.25rem 0.75rem;
      font-size: 0.68rem;
      font-weight: 600;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: rgba(255,255,255,0.75);
      margin-bottom: 1rem;
    }

    .nb-hero-headline {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: clamp(1.4rem, 3vw, 2.1rem);
      font-weight: 800;
      color: #fff;
      line-height: 1.2;
      letter-spacing: -0.02em;
      margin: 0 0 0.6rem;
    }

    .nb-hero-sub {
      font-size: 0.875rem;
      color: rgba(255,255,255,0.6);
      line-height: 1.65;
      max-width: 400px;
    }

    .nb-steps {
      position: relative;
      z-index: 1;
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: 0.75rem;
      width: 100%;
    }

    .nb-step {
      min-width: 0;
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 14px;
      padding: 1rem;
      transition: background 0.2s;
    }
    .nb-step:hover { background: rgba(255,255,255,0.1); }

    .nb-step-num {
      font-size: 0.6rem;
      font-weight: 700;
      letter-spacing: 0.25em;
      text-transform: uppercase;
      color: var(--sage-light);
      margin-bottom: 0.35rem;
    }

    .nb-step-icon {
      width: 28px;
      height: 28px;
      background: rgba(74,124,89,0.2);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 0.5rem;
    }

    .nb-step-label {
      font-size: 0.8rem;
      font-weight: 500;
      color: rgba(255,255,255,0.85);
    }

    /* ── FORM WRAPPER ── */
    .nb-form-col { min-width: 0; }

    /* ── SIDEBAR ── */
    .nb-sidebar {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      min-width: 0;
    }

    .nb-card {
      border-radius: 18px;
      border: 1px solid rgba(26,26,24,0.08);
      overflow: hidden;
    }

    /* WHY card */
    .nb-why {
      background: var(--white);
      padding: 1.5rem;
    }

    .nb-card-title {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--ink);
      margin: 0 0 1.1rem;
    }

    .nb-why-item {
      display: flex;
      gap: 0.75rem;
      align-items: flex-start;
      padding: 0.65rem 0;
      border-bottom: 1px solid rgba(26,26,24,0.05);
      font-size: 0.82rem;
      color: var(--stone);
      line-height: 1.5;
    }
    .nb-why-item:last-child { border-bottom: none; }

    .nb-why-check {
      color: var(--sage);
      flex-shrink: 0;
      margin-top: 2px;
    }

    /* TRUST badge */
    .nb-trust {
      background: linear-gradient(135deg, var(--sage) 0%, #3a6347 100%);
      padding: 1.5rem;
      color: #fff;
    }

    .nb-trust-stat {
      display: flex;
      align-items: baseline;
      gap: 0.35rem;
      margin-bottom: 0.25rem;
    }

    .nb-trust-num {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 2rem;
      font-weight: 800;
      line-height: 1;
    }

    .nb-trust-unit {
      font-size: 0.75rem;
      font-weight: 600;
      opacity: 0.75;
      letter-spacing: 0.08em;
    }

    .nb-trust-desc {
      font-size: 0.78rem;
      opacity: 0.75;
      margin-bottom: 1.25rem;
    }

    .nb-trust-divider {
      width: 100%;
      height: 1px;
      background: rgba(255,255,255,0.15);
      margin: 1.1rem 0;
    }

    /* CONTACT card */
    .nb-contact {
      background: var(--cream);
      border: 1px solid rgba(26,26,24,0.08);
      padding: 1.5rem;
      border-radius: 18px;
    }

    .nb-contact-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.7rem 0;
      border-bottom: 1px dashed rgba(26,26,24,0.1);
      font-size: 0.82rem;
    }
    .nb-contact-row:last-child { border-bottom: none; }

    .nb-contact-icon {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: var(--sage-muted);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .nb-contact-label {
      font-size: 0.65rem;
      font-weight: 600;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--stone);
      margin-bottom: 0.15rem;
    }

    .nb-contact-value {
      font-weight: 600;
      color: var(--ink);
      word-break: break-word;
    }

    @media (min-width: 560px) {
      .nb-steps {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
    }

    @media (min-width: 768px) {
      .nb-hero {
        padding: 2rem;
        flex-direction: row;
        gap: 1.5rem;
      }

      .nb-hero-text {
        flex: 1 1 260px;
      }

      .nb-steps {
        flex: 1 1 360px;
      }
    }

    @media (min-width: 1024px) {
      .nb-hero {
        padding: 2.5rem;
        gap: 2rem;
      }
    }
  `}</style>
);

const NewBooking = () => {
  const navigate = useNavigate();

  const handleSuccess = (bookingData) => {
    navigate(`/bookings/${bookingData.id}`);
  };

  return (
    <>
      <GlobalStyles />
      <div className="nb-page">

        {/* ── HEADER ── */}
        <header className="nb-header">
          <div className="nb-header-inner">
            <div>
              <div className="nb-eyebrow">
                <span className="nb-eyebrow-dot" />
                New Booking
              </div>
              <h1 className="nb-title">Schedule Exhauster Service</h1>
            </div>
            <Link to="/bookings" className="nb-back-btn">
              <ArrowLeft size={14} />
              Back
            </Link>
          </div>
        </header>

        {/* ── MAIN GRID ── */}
        <main className="nb-main">

          {/* ── HERO BANNER ── */}
          <section className="nb-hero">
            <div className="nb-hero-text">
              <div className="nb-hero-tag">
                <Sparkles size={10} />
                UsafiLink Platform
              </div>
              <h2 className="nb-hero-headline">
                Book waste removal<br />with confidence
              </h2>
              <p className="nb-hero-sub">
                Choose your location, pick a driver slot, and confirm with transparent pricing — all in under 3 minutes.
              </p>
            </div>

            <div className="nb-steps">
              {[
                { num: 'Step 01', icon: <MapPin size={13} color="#6a9e79" />, label: 'Choose location' },
                { num: 'Step 02', icon: <Clock size={13} color="#6a9e79" />, label: 'Pick a slot' },
                { num: 'Step 03', icon: <CreditCard size={13} color="#6a9e79" />, label: 'Confirm & pay' },
              ].map((s) => (
                <div key={s.num} className="nb-step">
                  <p className="nb-step-num">{s.num}</p>
                  <div className="nb-step-icon">{s.icon}</div>
                  <p className="nb-step-label">{s.label}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── BOOKING FORM ── */}
          <div className="nb-form-col">
            <BookingForm onSuccess={handleSuccess} />
          </div>

          {/* ── SIDEBAR ── */}
          <aside className="nb-sidebar">

            {/* Why UsafiLink */}
            <div className="nb-card nb-why">
              <h3 className="nb-card-title">Why UsafiLink?</h3>
              {[
                'Real-time slot availability — no double bookings.',
                'Transparent price estimates before you confirm.',
                'SMS + dashboard tracking from dispatch to completion.',
                'Vetted drivers operating in Kiambu County.',
              ].map((text) => (
                <div key={text} className="nb-why-item">
                  <CheckCircle2 size={15} className="nb-why-check" />
                  <span>{text}</span>
                </div>
              ))}
            </div>

            {/* Trust stats */}
            <div className="nb-card nb-trust">
              <div className="nb-trust-stat">
                <span className="nb-trust-num">98</span>
                <span className="nb-trust-unit">%</span>
              </div>
              <p className="nb-trust-desc">On-time arrival rate</p>
              <div className="nb-trust-divider" />
              <div className="nb-trust-stat">
                <span className="nb-trust-num">500+</span>
              </div>
              <p className="nb-trust-desc">Households served across Kiambu</p>
            </div>

            {/* Contact */}
            <div className="nb-contact">
              <h3 className="nb-card-title">Need help?</h3>
              <div className="nb-contact-row">
                <div className="nb-contact-icon">
                  <Phone size={14} color="#4a7c59" />
                </div>
                <div>
                  <p className="nb-contact-label">Phone</p>
                  <p className="nb-contact-value">+254 746 749 299</p>
                </div>
              </div>
              <div className="nb-contact-row">
                <div className="nb-contact-icon">
                  <Mail size={14} color="#4a7c59" />
                </div>
                <div>
                  <p className="nb-contact-label">Email</p>
                  <p className="nb-contact-value">support@usafilink.co.ke</p>
                </div>
              </div>
            </div>

          </aside>
        </main>
      </div>
    </>
  );
};

export default NewBooking;
