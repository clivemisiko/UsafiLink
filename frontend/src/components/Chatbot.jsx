import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Bot, ChevronDown, Minimize2 } from 'lucide-react';

/* ─────────────────── knowledge base ─────────────────── */
const KB = [
  {
    patterns: ['hello', 'hi', 'hey', 'hii', 'good morning', 'good afternoon', 'good evening', 'jambo', 'habari'],
    reply: "👋 Hello! Welcome to **UsafiLink**! I'm your virtual assistant. I can help you with:\n• Booking an exhauster\n• Pricing & availability\n• How the service works\n• Payment options\n\nWhat can I help you with today?",
    suggestions: ['How do I book?', 'What are your prices?', 'How does it work?'],
  },
  {
    patterns: ['book', 'booking', 'order', 'schedule', 'hire', 'request'],
    reply: "📅 **Booking is super easy!** Here's how:\n\n1️⃣ Enter your location at the top of this page\n2️⃣ Choose your truck size\n3️⃣ Click **\"Book Now\"** — you'll be prompted to login/sign up\n4️⃣ Confirm your booking & pay via M-Pesa or cash\n\nYour driver will be assigned instantly! ⚡",
    suggestions: ['What sizes are available?', 'Do I need to sign up?', 'How fast is response?'],
  },
  {
    patterns: ['price', 'cost', 'how much', 'bei', 'charge', 'fee', 'pricing', 'rates'],
    reply: "💰 **Our pricing is transparent & all-inclusive:**\n\n🚛 **Compact (1,000L)** — KES 2,000\n🚚 **Standard (2,000L)** — KES 3,500 ⭐ Popular\n🚜 **Plus (3,000L)** — KES 5,000\n🚛 **Premium (5,000L)** — KES 7,500\n🚚 **XL (10,000L)** — KES 12,000\n\nAll prices include labour & disposal fees. No hidden charges!",
    suggestions: ['How do I pay?', 'What size do I need?', 'Are there discounts?'],
  },
  {
    patterns: ['pay', 'payment', 'mpesa', 'm-pesa', 'card', 'cash', 'lipa'],
    reply: "💳 **We accept the following payment methods:**\n\n📱 **M-Pesa** — Fastest! Pay with STK push (lipa na M-Pesa)\n💵 **Cash** — Pay the driver on arrival\n\nAll transactions are secure and you'll receive an automatic SMS receipt.",
    suggestions: ['How do I book?', 'Is it safe?', 'Do you give receipts?'],
  },
  {
    patterns: ['track', 'tracking', 'where', 'driver', 'location', 'gps', 'live'],
    reply: "📍 **Yes! We have real-time GPS tracking!**\n\nOnce your booking is confirmed:\n• You'll see your driver on a live map\n• Get SMS updates at each stage\n• Driver's phone number shared for direct contact\n• Estimated arrival time shown in real-time",
    suggestions: ['How do I book?', 'How fast do they come?', 'Contact support'],
  },
  {
    patterns: ['how long', 'eta', 'response time', 'wait', 'fast', 'quick', 'speed', 'time'],
    reply: "⏱️ **Response times by truck size:**\n\n🚛 Compact — 10-15 minutes\n🚚 Standard — 10-20 minutes\n🚜 Plus — 15-25 minutes\n🚛 Premium — 20-30 minutes\n🚚 XL — 30-45 minutes\n\nAverage response across Nairobi is **under 20 minutes!** 🚀",
    suggestions: ['What areas do you cover?', 'Book now', 'Pricing'],
  },
  {
    patterns: ['area', 'location', 'nairobi', 'where', 'cover', 'service area', 'available', 'region'],
    reply: "📍 **We currently serve all of Nairobi and surrounding areas:**\n\n✅ Westlands, Kilimani, Karen\n✅ CBD, Parklands, Lavington\n✅ Kasarani, Ruiru, Thika Road\n✅ South B, South C, Langata\n✅ Eastlands, Kayole, Umoja\n\nEnter your address on the booking form — we'll confirm availability instantly!",
    suggestions: ['Book now', 'How does it work?', 'Pricing'],
  },
  {
    patterns: ['driver', 'safe', 'certified', 'license', 'nema', 'verified', 'trust', 'professional'],
    reply: "🛡️ **All UsafiLink drivers are:**\n\n✅ NEMA certified for waste handling\n✅ Fully background-checked\n✅ Trained in safe disposal practices\n✅ Rated by customers after each job\n✅ Carry valid driving licenses & permits\n\nYour safety and service quality are our top priority!",
    suggestions: ['How do I book?', 'What are your prices?', 'Contact support'],
  },
  {
    patterns: ['signup', 'sign up', 'register', 'account', 'create', 'join', 'new user'],
    reply: "✨ **Creating an account is free and takes 1 minute!**\n\nWhat you get:\n• Book & track services in real-time\n• View booking history & receipts\n• Save favourite locations\n• Schedule recurring services\n• Priority support\n\nClick **\"Get Started\"** at the top of the page to sign up now! 🎉",
    suggestions: ['How do I book?', 'Is registration free?', 'What after signup?'],
  },
  {
    patterns: ['contact', 'support', 'help', 'phone', 'email', 'call', 'reach', 'talk to human'],
    reply: "📞 **Need to talk to a human? We're here!**\n\n📱 **Phone:** +254 746 749 299\n📧 **Email:** mutendeclive@gmail.com\n⏰ **Hours:** 24/7 for emergencies\n\nYou can also track and manage your booking directly from your dashboard after logging in.",
    suggestions: ['How do I book?', 'What are your prices?', 'Back to services'],
  },
  {
    patterns: ['emergency', 'urgent', 'asap', 'immediately', 'flooding', 'overflow', 'blocked'],
    reply: "🚨 **Emergency service is available 24/7!**\n\nFor urgent situations:\n📱 Call us directly: **+254 746 749 299**\n⚡ We prioritize emergency bookings\n🚛 Fastest available truck dispatched immediately\n\nYou can also mark your booking as **URGENT** during the booking process for priority dispatch.",
    suggestions: ['Call now: +254 746 749 299', 'Book emergency service', 'What are the prices?'],
  },
  {
    patterns: ['size', 'which size', 'what size', 'recommend', 'how big', 'which truck', 'capacity'],
    reply: "🔍 **Here's how to choose your size:**\n\n🏠 **Single room/bedsitter** → Compact (1,000L)\n🏡 **Family home (3-4beds)** → Standard (2,000L) ⭐\n🏘️ **Large home / guest house** → Plus (3,000L)\n🏢 **Small business / estate** → Premium (5,000L)\n🏭 **Commercial / industrial** → XL (10,000L)\n\nNot sure? Start with Standard — it covers 90% of homes!",
    suggestions: ['See all prices', 'Book Standard now', 'How do I book?'],
  },
  {
    patterns: ['recurring', 'regular', 'monthly', 'weekly', 'schedule repeat', 'subscribe'],
    reply: "🔄 **Yes! You can set up recurring services!**\n\nAfter your first booking, go to your **Dashboard** and enable:\n• Monthly automatic service\n• Quarterly service reminders\n• Custom schedule (every N weeks)\n\n💡 Tip: Regular customers get priority dispatch!",
    suggestions: ['Create an account', 'How to book?', 'Pricing'],
  },
  {
    patterns: ['receipt', 'invoice', 'proof', 'document', 'confirmation'],
    reply: "📄 **Yes, you get full documentation!**\n\n✅ SMS confirmation on booking\n✅ Email receipt after payment\n✅ Service report after completion\n✅ Full history in your dashboard\n\nAll records are available anytime in your Account → Payments section.",
    suggestions: ['Create an account', 'Payment methods', 'How to book?'],
  },
  {
    patterns: ['cancel', 'refund', 'reschedule', 'change', 'modify'],
    reply: "↩️ **Cancellation & Refund Policy:**\n\n✅ Cancel before driver dispatched → **Full refund**\n⏳ Cancel after dispatch → **50% refund**\n❌ Cancel on arrival → **No refund**\n\nRefunds via M-Pesa within 24-48 hours. To cancel, go to your booking in the Dashboard.",
    suggestions: ['How to book?', 'Contact support', 'Pricing'],
  },
  {
    patterns: ['thank', 'thanks', 'appreciate', 'asante', 'great', 'awesome', 'perfect'],
    reply: "😊 **You're very welcome!** Happy to help.\n\nIs there anything else you'd like to know about UsafiLink? I'm here 24/7!",
    suggestions: ['Book a service', 'Contact us', 'View pricing'],
  },
  {
    patterns: ['bye', 'goodbye', 'see you', 'kwaheri', 'later'],
    reply: "👋 **Goodbye! Have a great day!**\n\nRemember — when you need exhauster services, UsafiLink is just a tap away. Stay fresh! 💧",
    suggestions: ['Book a service', 'Contact us'],
  },
];

const DEFAULT_SUGGESTIONS = ['How do I book?', "What are your prices?", 'Areas covered', 'Payment options'];

const BOT_INTRO = {
  id: 'intro',
  from: 'bot',
  text: "👋 Hi! I'm **UsafiBot**, your 24/7 UsafiLink assistant.\n\nI can help you with booking, pricing, service areas, drivers, payments and more.\n\nWhat would you like to know?",
  suggestions: DEFAULT_SUGGESTIONS,
  time: new Date(),
};

/* ─────────────────── helpers ─────────────────── */
const findReply = (input) => {
  const lower = input.toLowerCase().trim();
  for (const entry of KB) {
    if (entry.patterns.some(p => lower.includes(p))) {
      return { text: entry.reply, suggestions: entry.suggestions };
    }
  }
  return {
    text: "🤔 I'm not sure about that one. Here are things I can help you with:\n\n• 📅 **Booking** an exhauster truck\n• 💰 **Pricing** & available sizes\n• 📍 **Service areas** in Nairobi\n• 💳 **Payment** methods\n• 🛡️ **Driver** verification\n\nOr contact us directly at **+254 746 749 299**.",
    suggestions: DEFAULT_SUGGESTIONS,
  };
};

const formatText = (text) => {
  // Convert **bold** to <strong>, bullet points, and line breaks
  return text
    .split('\n')
    .map((line, i) => {
      const parts = line.split(/\*\*(.*?)\*\*/g);
      return (
        <span key={i}>
          {parts.map((part, j) => j % 2 === 1 ? <strong key={j}>{part}</strong> : part)}
          {i < text.split('\n').length - 1 && <br />}
        </span>
      );
    });
};

/* ─────────────────── component ─────────────────── */
const Chatbot = () => {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState([BOT_INTRO]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [unread, setUnread] = useState(0);
  const [hasOpened, setHasOpened] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  // Focus input when opened
  useEffect(() => {
    if (open && !minimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, minimized]);

  // Show notification bubble after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!hasOpened) setUnread(1);
    }, 3000);
    return () => clearTimeout(timer);
  }, [hasOpened]);

  const handleOpen = () => {
    setOpen(true);
    setMinimized(false);
    setUnread(0);
    setHasOpened(true);
  };

  const handleClose = () => {
    setOpen(false);
    setUnread(0);
  };

  const sendMessage = (text) => {
    const userMsg = { id: Date.now(), from: 'user', text, time: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setTyping(true);

    const delay = 800 + Math.random() * 600;
    setTimeout(() => {
      setTyping(false);
      const { text: replyText, suggestions } = findReply(text);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        from: 'bot',
        text: replyText,
        suggestions,
        time: new Date(),
      }]);
    }, delay);
  };

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input.trim());
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const fmtTime = (d) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <>
      {/* ── Floating button ── */}
      <button
        id="chatbot-toggle"
        onClick={open ? handleClose : handleOpen}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95
          ${open ? 'bg-gray-800 rotate-0' : 'bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500'}
          ${selectedVehicle => selectedVehicle ? 'bottom-24' : 'bottom-6'}`}
        style={{ bottom: '24px' }}
        aria-label="Open chat assistant"
      >
        {open
          ? <X className="w-6 h-6 text-white" />
          : <MessageCircle className="w-6 h-6 text-white" />
        }
        {!open && unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-black rounded-full flex items-center justify-center animate-bounce">
            {unread}
          </span>
        )}
      </button>

      {/* ── Chat window ── */}
      {open && (
        <div className={`fixed right-6 z-40 w-[360px] bg-white rounded-3xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden transition-all duration-300 ${minimized ? 'h-16 bottom-24' : 'h-[560px] bottom-24'}`}
          style={{ boxShadow: '0 25px 60px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.05)' }}>

          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-5 py-4 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-xl">
                  🤖
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full" />
              </div>
              <div>
                <div className="text-white font-black text-sm">UsafiBot</div>
                <div className="text-emerald-200 text-xs">Always online • Instant replies</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button onClick={() => setMinimized(!minimized)}
                className="text-white/70 hover:text-white transition-colors p-1 rounded">
                {minimized ? <ChevronDown className="w-4 h-4 rotate-180" /> : <Minimize2 className="w-4 h-4" />}
              </button>
              <button onClick={handleClose}
                className="text-white/70 hover:text-white transition-colors p-1 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!minimized && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-gray-50/50">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] ${msg.from === 'user' ? '' : 'flex items-start space-x-2'}`}>
                      {msg.from === 'bot' && (
                        <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex-shrink-0 flex items-center justify-center text-sm mt-0.5">
                          🤖
                        </div>
                      )}
                      <div>
                        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${msg.from === 'user'
                          ? 'bg-gradient-to-br from-emerald-600 to-teal-600 text-white rounded-br-sm'
                          : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-sm'
                          }`}>
                          {formatText(msg.text)}
                        </div>
                        <div className={`text-xs text-gray-400 mt-1 ${msg.from === 'user' ? 'text-right' : 'text-left ml-1'}`}>
                          {fmtTime(msg.time)}
                        </div>
                        {/* Suggestions */}
                        {msg.from === 'bot' && msg.suggestions && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {msg.suggestions.map((s, i) => (
                              <button key={i} onClick={() => sendMessage(s)}
                                className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-full px-3 py-1.5 font-semibold transition-all hover:scale-105 active:scale-95">
                                {s}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Typing indicator */}
                {typing && (
                  <div className="flex items-start space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex-shrink-0 flex items-center justify-center text-sm">
                      🤖
                    </div>
                    <div className="bg-white border border-gray-100 shadow-sm px-4 py-3 rounded-2xl rounded-bl-sm">
                      <div className="flex space-x-1 items-center h-4">
                        <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="px-4 py-3 bg-white border-t border-gray-100 flex-shrink-0">
                <div className="flex items-center space-x-2 bg-gray-50 rounded-2xl px-4 py-2 border border-gray-200 focus-within:border-emerald-400 focus-within:bg-white transition-all">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKey}
                    placeholder="Ask me anything..."
                    className="flex-1 bg-transparent text-gray-800 placeholder-gray-400 outline-none text-sm"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim()}
                    className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${input.trim() ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white hover:scale-110 active:scale-95' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
                    <Send className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-center text-xs text-gray-400 mt-2">
                  Powered by UsafiLink AI • 24/7 assistance
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default Chatbot;

