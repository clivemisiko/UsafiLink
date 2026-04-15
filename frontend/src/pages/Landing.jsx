import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin, Clock, CheckCircle, Star, ArrowRight, Shield,
  Zap, CreditCard, ChevronDown, Phone, Mail, Menu, X,
  Droplets, Truck, Users, Award, ChevronRight
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import Chatbot from '../components/Chatbot';
import ServiceAnimation from '../components/ServiceAnimation';

/* ─── animated counter ─── */
const Counter = ({ end, suffix = '', duration = 2000 }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        const step = end / (duration / 16);
        let cur = 0;
        const t = setInterval(() => {
          cur += step;
          if (cur >= end) { setCount(end); clearInterval(t); }
          else setCount(Math.floor(cur));
        }, 16);
      }
    });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, duration]);
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
};

/* ─── data ─── */
const vehicles = [
  { id: '1000', name: 'Compact', capacity: '1,000L', desc: 'Bedsitter & single rooms', price: 2000, eta: '10-15 min', emoji: '🚛', popular: false },
  { id: '2000', name: 'Standard', capacity: '2,000L', desc: 'Most popular for family homes', price: 3500, eta: '10-20 min', emoji: '🚚', popular: true },
  { id: '3000', name: 'Plus', capacity: '3,000L', desc: 'Medium homes & guest houses', price: 5000, eta: '15-25 min', emoji: '🚜', popular: false },
  { id: '5000', name: 'Premium', capacity: '5,000L', desc: 'Large homes & small businesses', price: 7500, eta: '20-30 min', emoji: '🚛', popular: false },
  { id: '10000', name: 'XL', capacity: '10,000L', desc: 'Commercial & industrial', price: 12000, eta: '30-45 min', emoji: '🚚', popular: false },
];

const steps = [
  { num: '01', icon: <MapPin className="w-6 h-6" />, title: 'Enter Location', desc: 'Tell us where you are so we can match your request to available nearby drivers.' },
  { num: '02', icon: <Truck className="w-6 h-6" />, title: 'Choose Your Size', desc: 'Pick the tank size for your needs and see an upfront price estimate.' },
  { num: '03', icon: <CreditCard className="w-6 h-6" />, title: 'Book & Pay', desc: 'Confirm and pay via M-Pesa or cash in a quick booking flow.' },
  { num: '04', icon: <CheckCircle className="w-6 h-6" />, title: 'Done!', desc: 'Follow booking and driver status updates until your service is completed.' },
];

const faqs = [
  { q: 'How quickly can I get a truck?', a: 'Response times vary by location, traffic, and driver availability. You can track booking progress after confirmation.' },
  { q: 'What payment methods do you accept?', a: 'We accept M-Pesa (STK push) and cash on delivery. M-Pesa is the fastest and most convenient option.' },
  { q: 'Are your drivers certified?', a: 'Drivers are onboarded and managed through the platform, and customers can rate completed jobs.' },
  { q: 'What areas do you cover?', a: 'We serve Nairobi and nearby areas based on driver availability at the time of booking.' },
  { q: 'Can I schedule recurring service?', a: 'Recurring service options are planned for a future release.' },
];

/* ═══════════════════ COMPONENT ═══════════════════ */
export default function Landing() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);
  const [location, setLocation] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const scrollTo = id => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMenuOpen(false);
  };

  const handleBook = () => {
    if (!selected) { toast.error('Please select a service size'); return; }
    if (!location.trim()) { toast.error('Please enter your location'); return; }
    localStorage.setItem('pendingBooking', JSON.stringify({ tankSize: selected, location }));
    const token = localStorage.getItem('access_token');
    if (token) navigate('/bookings/new', { state: { tankSize: selected, location } });
    else { toast.success('Please login to complete your booking'); navigate('/login'); }
  };

  const selV = vehicles.find(v => v.id === selected);

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }} className="min-h-screen overflow-x-hidden">

      {/* ══════════════ NAV ══════════════ */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        backgroundColor: scrolled ? '#fff' : 'transparent',
        boxShadow: scrolled ? '0 2px 24px rgba(0,0,0,0.10)' : 'none',
        transition: 'all 0.3s',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 68 }}>
          {/* Logo */}
          <button onClick={() => scrollTo('hero')} style={{ display: 'flex', alignItems: 'center', gap: 10, border: 'none', background: 'none', cursor: 'pointer' }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg,#059669,#0d9488)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(5,150,105,0.35)' }}>
              <Droplets style={{ color: '#fff', width: 20, height: 20 }} />
            </div>
            <span style={{ fontSize: 20, fontWeight: 900, color: scrolled ? '#111' : '#fff', letterSpacing: '-0.5px' }}>
              Usafi<span style={{ color: scrolled ? '#059669' : '#6ee7b7' }}>Link</span>
            </span>
          </button>

          {/* Desktop nav links */}
          <nav style={{ display: 'flex', gap: 32, alignItems: 'center' }} className="hidden-mobile">
            {[['How It Works', 'how-it-works'], ['Services', 'services'], ['FAQ', 'faq']].map(([l, id]) => (
              <button key={id} onClick={() => scrollTo(id)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: scrolled ? '#4b5563' : 'rgba(255,255,255,0.85)', transition: 'color 0.2s' }}>
                {l}
              </button>
            ))}
          </nav>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }} className="hidden-mobile">
            <button onClick={() => navigate('/login')} style={{ padding: '9px 20px', borderRadius: 50, border: scrolled ? '1.5px solid #d1d5db' : '1.5px solid rgba(255,255,255,0.4)', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: scrolled ? '#374151' : '#fff', transition: 'all 0.2s' }}>
              Login
            </button>
            <button onClick={() => navigate('/register')} style={{ padding: '9px 22px', borderRadius: 50, border: 'none', background: 'linear-gradient(135deg,#059669,#0d9488)', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#fff', boxShadow: '0 4px 14px rgba(5,150,105,0.4)', transition: 'all 0.2s' }}>
              Get Started
            </button>
          </div>

          {/* Mobile hamburger */}
          <button onClick={() => setMenuOpen(!menuOpen)} style={{ display: 'none', border: 'none', background: 'none', cursor: 'pointer', padding: 6 }} className="show-mobile">
            {menuOpen ? <X style={{ color: scrolled ? '#111' : '#fff', width: 24, height: 24 }} /> : <Menu style={{ color: scrolled ? '#111' : '#fff', width: 24, height: 24 }} />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div style={{ background: '#fff', borderTop: '1px solid #f3f4f6', padding: '20px 24px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
            {[['How It Works', 'how-it-works'], ['Services', 'services'], ['FAQ', 'faq']].map(([l, id]) => (
              <button key={id} onClick={() => scrollTo(id)} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '12px 0', border: 'none', borderBottom: '1px solid #f9fafb', background: 'none', cursor: 'pointer', fontSize: 15, fontWeight: 600, color: '#374151' }}>
                {l}
              </button>
            ))}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
              <button onClick={() => navigate('/login')} style={{ padding: '12px', borderRadius: 12, border: '1.5px solid #d1d5db', background: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>Login</button>
              <button onClick={() => navigate('/register')} style={{ padding: '12px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#059669,#0d9488)', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>Sign Up Free</button>
            </div>
          </div>
        )}
      </header>

      {/* ══════════════ HERO ══════════════ */}
      <section id="hero" style={{ background: 'linear-gradient(135deg,#064e3b 0%,#065f46 40%,#0f766e 100%)', minHeight: '100vh', display: 'flex', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
        {/* Background patterns */}
        <div style={{ position: 'absolute', top: 60, left: -40, width: 400, height: 400, borderRadius: '50%', background: 'rgba(52,211,153,0.15)', filter: 'blur(60px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: 40, right: -60, width: 500, height: 500, borderRadius: '50%', background: 'rgba(251,191,36,0.12)', filter: 'blur(80px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, opacity: 0.07, backgroundImage: 'radial-gradient(circle,#fff 1px,transparent 1px)', backgroundSize: '36px 36px', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '100px 24px 60px', width: '100%' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }} className="hero-grid">

            {/* Left text */}
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 100, padding: '8px 18px', marginBottom: 28 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fbbf24', display: 'inline-block', animation: 'ping 1s infinite' }} />
                <span style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>Available across Nairobi</span>
              </div>

              <h1 style={{ fontSize: 64, fontWeight: 900, color: '#fff', lineHeight: 1.05, marginBottom: 24, letterSpacing: '-2px' }}>
                Exhauster<br />
                Services,<br />
                <span style={{ background: 'linear-gradient(90deg,#fbbf24,#f97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  On-Demand.
                </span>
              </h1>

              <p style={{ fontSize: 18, color: 'rgba(167,243,208,0.9)', marginBottom: 36, lineHeight: 1.7, maxWidth: 460 }}>
                Book an exhauster service online in minutes. Get upfront estimates, status updates, and flexible payment options.
              </p>

              {/* Booking bar */}
              <div style={{ background: '#fff', borderRadius: 20, padding: 12, boxShadow: '0 20px 60px rgba(0,0,0,0.25)', maxWidth: 480 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', borderBottom: '1px solid #f3f4f6', marginBottom: 10 }}>
                  <MapPin style={{ color: '#059669', width: 18, height: 18, flexShrink: 0 }} />
                  <input
                    type="text"
                    placeholder="Enter your location or address…"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, fontWeight: 500, color: '#111827', background: 'transparent' }}
                  />
                </div>
                <button onClick={() => scrollTo('services')} style={{ width: '100%', padding: '13px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#059669,#0d9488)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 14px rgba(5,150,105,0.4)' }}>
                  Find Available Trucks <ArrowRight style={{ width: 16, height: 16 }} />
                </button>
              </div>

              {/* Trust badges */}
              <div style={{ display: 'flex', gap: 32, marginTop: 32 }}>
                {[['Fast', 'Response Focus'], ['Online', 'Booking Flow'], ['Trusted', 'By Customers']].map(([v, l]) => (
                  <div key={l}>
                    <div style={{ fontSize: 24, fontWeight: 900, color: '#fff' }}>{v}</div>
                    <div style={{ fontSize: 11, color: '#6ee7b7', fontWeight: 600, marginTop: 2 }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Service Animation (desktop) */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="hero-right">
              <ServiceAnimation />
            </div>
          </div>
        </div>

        <button onClick={() => scrollTo('stats')} style={{ position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)', border: 'none', background: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, animation: 'bounce 1.5s infinite' }}>
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase' }}>Scroll</span>
          <ChevronDown style={{ width: 18, height: 18 }} />
        </button>
      </section>

      {/* ══════════════ STATS ══════════════ */}
      <section id="stats" style={{ background: 'linear-gradient(90deg,#f59e0b,#f97316)', padding: '48px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 24, textAlign: 'center' }} className="stats-grid">
          {[
            { icon: <Users style={{ width: 28, height: 28 }} />, val: 500, sfx: '+', label: 'Happy Customers' },
            { icon: <Truck style={{ width: 28, height: 28 }} />, val: 50, sfx: '+', label: 'Certified Drivers' },
            { icon: <Award style={{ width: 28, height: 28 }} />, val: 98, sfx: '%', label: 'Satisfaction Rate' },
            { icon: <Zap style={{ width: 28, height: 28 }} />, val: 15, sfx: 'min', label: 'Avg. Response' },
          ].map((s, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', marginBottom: 4 }}>{s.icon}</div>
              <div style={{ fontSize: 40, fontWeight: 900, color: '#fff', lineHeight: 1 }}><Counter end={s.val} suffix={s.sfx} /></div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(120,53,15,0.9)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════ HOW IT WORKS ══════════════ */}
      <section id="how-it-works" style={{ background: '#f0fdf4', padding: '72px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <span style={{ display: 'inline-block', padding: '6px 18px', background: '#d1fae5', color: '#065f46', fontSize: 11, fontWeight: 800, borderRadius: 100, marginBottom: 14, letterSpacing: 1, textTransform: 'uppercase' }}>Simple Process</span>
            <h2 style={{ fontSize: 42, fontWeight: 900, color: '#064e3b', marginBottom: 10, letterSpacing: '-1px' }}>Book in 4 Easy Steps</h2>
            <p style={{ fontSize: 16, color: '#6b7280', maxWidth: 480, margin: '0 auto' }}>Book online in minutes with easy steps and clear updates.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20 }} className="steps-grid">
            {steps.map((s, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: 24, padding: '32px 24px', border: '2px solid #d1fae5', position: 'relative', transition: 'all 0.3s' }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 12px 40px rgba(5,150,105,0.15)'; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = '#059669'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = '#d1fae5'; }}>
                <div style={{ position: 'absolute', top: 16, right: 20, fontSize: 48, fontWeight: 900, color: '#f0fdf4', lineHeight: 1, userSelect: 'none' }}>{s.num}</div>
                <div style={{ width: 52, height: 52, borderRadius: 16, background: 'linear-gradient(135deg,#059669,#0d9488)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', marginBottom: 18, boxShadow: '0 4px 14px rgba(5,150,105,0.35)' }}>
                  {s.icon}
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: '#064e3b', marginBottom: 8 }}>{s.title}</h3>
                <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ SERVICES ══════════════ */}
      <section id="services" style={{ background: '#065f46', padding: '72px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <span style={{ display: 'inline-block', padding: '6px 18px', background: 'rgba(251,191,36,0.2)', color: '#fbbf24', fontSize: 11, fontWeight: 800, borderRadius: 100, marginBottom: 14, letterSpacing: 1, textTransform: 'uppercase', border: '1px solid rgba(251,191,36,0.3)' }}>Pricing & Sizes</span>
            <h2 style={{ fontSize: 42, fontWeight: 900, color: '#fff', marginBottom: 10, letterSpacing: '-1px' }}>Choose Your Service Size</h2>
            <p style={{ fontSize: 15, color: '#6ee7b7', maxWidth: 480, margin: '0 auto' }}>Displayed prices are estimates; final pricing is confirmed per booking.</p>
          </div>

          {/* Location input */}
          <div style={{ maxWidth: 480, margin: '0 auto 36px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: location ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.08)', border: location ? '2px solid #34d399' : '2px solid rgba(255,255,255,0.15)', borderRadius: 16, padding: '12px 18px', transition: 'all 0.3s' }}>
              <MapPin style={{ width: 18, height: 18, color: location ? '#34d399' : '#9ca3af', flexShrink: 0 }} />
              <input type="text" placeholder="Enter your location to start booking…" value={location} onChange={e => setLocation(e.target.value)}
                style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, fontWeight: 500, color: '#fff', background: 'transparent' }} />
              {location && <CheckCircle style={{ width: 18, height: 18, color: '#34d399', flexShrink: 0 }} />}
            </div>
          </div>

          {/* Vehicle cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 16 }} className="vehicle-grid">
            {vehicles.map(v => (
              <button key={v.id} onClick={() => setSelected(v.id)} style={{
                position: 'relative', textAlign: 'center', borderRadius: 24, padding: '28px 16px', cursor: 'pointer',
                border: selected === v.id ? '3px solid #fbbf24' : '2px solid rgba(255,255,255,0.12)',
                background: selected === v.id ? 'rgba(251,191,36,0.15)' : 'rgba(255,255,255,0.07)',
                transform: selected === v.id ? 'scale(1.04)' : 'scale(1)',
                boxShadow: selected === v.id ? '0 0 0 6px rgba(251,191,36,0.2), 0 16px 40px rgba(0,0,0,0.3)' : 'none',
                transition: 'all 0.25s',
              }}>
                {v.popular && (
                  <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg,#f59e0b,#f97316)', color: '#fff', fontSize: 10, fontWeight: 800, padding: '4px 12px', borderRadius: 100, whiteSpace: 'nowrap', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
                    ⭐ MOST POPULAR
                  </div>
                )}
                {selected === v.id && (
                  <div style={{ position: 'absolute', top: 12, right: 12, width: 26, height: 26, borderRadius: '50%', background: '#fbbf24', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckCircle style={{ width: 15, height: 15, color: '#fff' }} />
                  </div>
                )}
                <div style={{ fontSize: 36, marginBottom: 12, display: 'block' }}>{v.emoji}</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', marginBottom: 4 }}>{v.name}</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: selected === v.id ? '#fbbf24' : '#6ee7b7', marginBottom: 6 }}>{v.capacity}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginBottom: 16, lineHeight: 1.5 }}>{v.desc}</div>
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1 }}>From</div>
                    <div style={{ fontSize: 13, fontWeight: 900, color: '#fff' }}>KES {v.price.toLocaleString()}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1 }}>ETA</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>{v.eta}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ FEATURES ══════════════ */}
      <section style={{ background: '#111827', padding: '72px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <span style={{ display: 'inline-block', padding: '6px 18px', background: 'rgba(5,150,105,0.2)', color: '#34d399', fontSize: 11, fontWeight: 800, borderRadius: 100, marginBottom: 14, letterSpacing: 1, textTransform: 'uppercase', border: '1px solid rgba(5,150,105,0.3)' }}>Why UsafiLink</span>
            <h2 style={{ fontSize: 42, fontWeight: 900, color: '#fff', marginBottom: 10, letterSpacing: '-1px' }}>Built for Your Peace of Mind</h2>
            <p style={{ fontSize: 15, color: '#9ca3af', maxWidth: 460, margin: '0 auto' }}>Everything you need for reliable, professional exhauster services.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }} className="features-grid">
            {[
              { emoji: '⚡', title: 'Quick Booking', desc: 'Book online quickly without phone calls using a guided flow.', bg: 'linear-gradient(135deg,#f59e0b,#f97316)' },
              { emoji: '📍', title: 'Status Tracking', desc: 'See booking and driver status updates from your dashboard.', bg: 'linear-gradient(135deg,#059669,#0d9488)' },
              { emoji: '🛡️', title: 'Managed Drivers', desc: 'Drivers are managed through the platform and rated after service.', bg: 'linear-gradient(135deg,#0ea5e9,#6366f1)' },
              { emoji: '💳', title: 'Flexible Payment', desc: 'Pay via M-Pesa STK push or cash, with payment records in your account.', bg: 'linear-gradient(135deg,#8b5cf6,#ec4899)' },
              { emoji: '💬', title: 'In-App Assistance', desc: 'Use our in-app assistant plus phone/email channels for support.', bg: 'linear-gradient(135deg,#f43f5e,#fb923c)' },
              { emoji: '📊', title: 'Full History', desc: 'Access past bookings and payment history from your dashboard.', bg: 'linear-gradient(135deg,#fbbf24,#f59e0b)' },
            ].map((f, i) => (
              <div key={i} style={{ background: '#1f2937', borderRadius: 24, padding: '32px 28px', border: '1px solid #374151', transition: 'all 0.3s', cursor: 'default' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = '#059669'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(5,150,105,0.15)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = '#374151'; e.currentTarget.style.boxShadow = 'none'; }}>
                <div style={{ width: 52, height: 52, borderRadius: 16, background: f.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginBottom: 18, boxShadow: '0 4px 14px rgba(0,0,0,0.3)' }}>{f.emoji}</div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 10 }}>{f.title}</h3>
                <p style={{ fontSize: 13, color: '#9ca3af', lineHeight: 1.7 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ FAQ ══════════════ */}
      <section id="faq" style={{ background: '#064e3b', padding: '72px 24px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <span style={{ display: 'inline-block', padding: '6px 18px', background: 'rgba(251,191,36,0.2)', color: '#fbbf24', fontSize: 11, fontWeight: 800, borderRadius: 100, marginBottom: 14, letterSpacing: 1, textTransform: 'uppercase', border: '1px solid rgba(251,191,36,0.3)' }}>FAQ</span>
            <h2 style={{ fontSize: 42, fontWeight: 900, color: '#fff', marginBottom: 8, letterSpacing: '-1px' }}>Common Questions</h2>
            <p style={{ fontSize: 15, color: '#6ee7b7' }}>Can't find what you need? Chat with our bot below 👇</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {faqs.map((f, i) => (
              <div key={i} style={{ borderRadius: 18, border: openFaq === i ? '2px solid #34d399' : '2px solid rgba(255,255,255,0.1)', background: openFaq === i ? 'rgba(52,211,153,0.08)' : 'rgba(255,255,255,0.05)', overflow: 'hidden', transition: 'all 0.3s' }}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{ width: '100%', padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left', gap: 16 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{f.q}</span>
                  <ChevronRight style={{ width: 18, height: 18, color: '#34d399', flexShrink: 0, transform: openFaq === i ? 'rotate(90deg)' : 'none', transition: 'transform 0.3s' }} />
                </button>
                {openFaq === i && (
                  <div style={{ padding: '0 24px 18px', fontSize: 13, color: '#a7f3d0', lineHeight: 1.7, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 14 }}>{f.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ CTA ══════════════ */}
      <section style={{ background: 'linear-gradient(135deg,#f59e0b 0%,#f97316 100%)', padding: '72px 24px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.08, backgroundImage: 'radial-gradient(circle,#fff 1px,transparent 1px)', backgroundSize: '32px 32px' }} />
        <div style={{ position: 'absolute', top: -60, right: -60, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', filter: 'blur(40px)' }} />
        <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>🚛</div>
          <h2 style={{ fontSize: 46, fontWeight: 900, color: '#fff', marginBottom: 16, letterSpacing: '-1px' }}>Ready for a Clean Home?</h2>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.85)', marginBottom: 36, maxWidth: 480, margin: '0 auto 36px' }}>
            Join Nairobi residents and businesses using UsafiLink for reliable exhauster services.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/register')} style={{ padding: '15px 36px', borderRadius: 16, border: 'none', background: '#fff', color: '#92400e', fontWeight: 900, fontSize: 15, cursor: 'pointer', boxShadow: '0 8px 32px rgba(0,0,0,0.2)', transition: 'all 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
              Create Free Account
            </button>
            <button onClick={() => navigate('/login')} style={{ padding: '15px 36px', borderRadius: 16, border: '2px solid rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}>
              Already have an account
            </button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 28, marginTop: 32, flexWrap: 'wrap' }}>
            {[['No setup fees', <Shield style={{ width: 15, height: 15 }} />], ['Platform-managed drivers', <CheckCircle style={{ width: 15, height: 15 }} />], ['Book online in minutes', <Zap style={{ width: 15, height: 15 }} />]].map(([l, icon]) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: 600 }}>{icon}{l}</div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ FOOTER ══════════════ */}
      <footer style={{ background: '#030712', padding: '56px 24px 28px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 40, paddingBottom: 40, borderBottom: '1px solid #1f2937' }} className="footer-grid">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg,#059669,#0d9488)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Droplets style={{ color: '#fff', width: 20, height: 20 }} />
                </div>
                <span style={{ fontSize: 20, fontWeight: 900, color: '#fff' }}>Usafi<span style={{ color: '#34d399' }}>Link</span></span>
              </div>
              <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.7, maxWidth: 300, marginBottom: 20 }}>Nairobi-based on-demand exhauster service platform. Fast and reliable booking.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <a href="tel:+254746749299" style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#6b7280', textDecoration: 'none', fontSize: 13 }}><Phone style={{ width: 14, height: 14 }} />+254 746 749 299</a>
                <a href="mailto:mutendeclive@gmail.com" style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#6b7280', textDecoration: 'none', fontSize: 13 }}><Mail style={{ width: 14, height: 14 }} />mutendeclive@gmail.com</a>
              </div>
            </div>
            <div>
              <h4 style={{ color: '#fff', fontWeight: 700, fontSize: 13, marginBottom: 18 }}>Services</h4>
              {['Residential Exhauster', 'Commercial Service', 'Industrial Tanker', 'Emergency Service', 'Scheduled Service'].map(s => (
                <div key={s} style={{ color: '#6b7280', fontSize: 13, marginBottom: 10, cursor: 'pointer' }}>{s}</div>
              ))}
            </div>
            <div>
              <h4 style={{ color: '#fff', fontWeight: 700, fontSize: 13, marginBottom: 18 }}>Company</h4>
              {['About Us', 'How It Works', 'Driver Registration', 'Privacy Policy', 'Terms of Service'].map(s => (
                <div key={s} style={{ color: '#6b7280', fontSize: 13, marginBottom: 10, cursor: 'pointer' }}>{s}</div>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 24, flexWrap: 'wrap', gap: 10 }}>
            <span style={{ color: '#4b5563', fontSize: 12 }}>&copy; 2026 UsafiLink. All rights reserved.</span>
            <span style={{ color: '#4b5563', fontSize: 12 }}>Made with ❤️ in Nairobi, Kenya 🇰🇪</span>
          </div>
        </div>
      </footer>

      {/* ══════════════ STICKY BOOK BAR ══════════════ */}
      {selected && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40, padding: '14px 24px', background: '#fff', borderTop: '3px solid #059669', boxShadow: '0 -8px 40px rgba(0,0,0,0.18)', animation: 'slideUp 0.3s ease-out' }}>
          <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{selV?.emoji}</div>
              <div>
                <div style={{ fontSize: 10, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1 }}>Selected</div>
                <div style={{ fontSize: 14, fontWeight: 900, color: '#111827' }}>{selV?.name} — {selV?.capacity}</div>
              </div>
            </div>
            <div style={{ textAlign: 'right', display: window.innerWidth > 480 ? 'block' : 'none' }}>
              <div style={{ fontSize: 10, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1 }}>From</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#111827' }}>KES {selV?.price.toLocaleString()}</div>
            </div>
            <button onClick={handleBook} style={{ padding: '13px 28px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg,#059669,#0d9488)', color: '#fff', fontWeight: 900, fontSize: 14, cursor: 'pointer', boxShadow: '0 4px 16px rgba(5,150,105,0.4)', display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap', transition: 'all 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
              Book Now <ArrowRight style={{ width: 16, height: 16 }} />
            </button>
          </div>
        </div>
      )}

      <Chatbot />

      {/* Responsive + animation styles */}
      <style>{`
        @keyframes ping { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.6;transform:scale(1.2)} }
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes slideUp { from{transform:translateY(100%);opacity:0} to{transform:translateY(0);opacity:1} }
        @media(max-width:768px){
          .hero-grid{grid-template-columns:1fr!important;}
          .hero-right{display:none!important;}
          .steps-grid{grid-template-columns:1fr 1fr!important;}
          .vehicle-grid{grid-template-columns:1fr 1fr!important;}
          .features-grid{grid-template-columns:1fr 1fr!important;}
          .testimonials-grid{grid-template-columns:1fr!important;}
          .stats-grid{grid-template-columns:1fr 1fr!important;}
          .footer-grid{grid-template-columns:1fr!important;}
          .hidden-mobile{display:none!important;}
          .show-mobile{display:flex!important;}
          h1{font-size:44px!important;}
          h2{font-size:30px!important;}
        }
        @media(max-width:480px){
          .steps-grid{grid-template-columns:1fr!important;}
          .vehicle-grid{grid-template-columns:1fr!important;}
          .features-grid{grid-template-columns:1fr!important;}
          .stats-grid{grid-template-columns:1fr 1fr!important;}
        }
        .hidden-mobile{display:flex;}
        .show-mobile{display:none;}
        button:hover{opacity:0.95;}
      `}</style>
    </div>
  );
}
