// ══════════════════════════════════════════════════════════════════════════════
// LifeOS — Personal Life Operating System  |  v64
// ──────────────────────────────────────────────────────────────────────────────
// ARCHITECTURE NOTE (Problem 6): This is intentionally a single-file app for
// portability and zero-build deployment. When complexity exceeds ~10k lines or
// a build step is acceptable, split into these logical modules:
//
//   core/        tokens.js · themes.js · i18n.js · hooks.js · helpers.js
//   engine/      ai.js · debtWorker.js · computed.js
//   components/  primitives/ · modals/ · charts/ · layout/
//   pages/       Home · Money · Health · Growth · Knowledge
//                Career · Calendar · Intel · Archive · Settings
//   app.jsx      Root — state, actions, routing
//
// SEARCH GUIDE  (⌘F these markers to jump to sections):
//   ── DESIGN TOKENS     ── AI ROUTER        ── ENGINE
//   ── PRIMITIVES        ── MODALS           ── PAGES
//   ── SIDEBAR           ── SETTINGS PAGE    ── ROOT (LifeOS export default)
// ══════════════════════════════════════════════════════════════════════════════
import React, { useState, useEffect, useRef, useCallback, useMemo, createContext, useContext, memo } from "react";
import PropTypes from "prop-types";
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  PieChart, Pie, Cell, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";

// ── GLOBAL STYLES ─────────────────────────────────────────────────────────────
(() => {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=IBM+Plex+Mono:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap';
  document.head.appendChild(link);
  const style = document.createElement('style');
  style.textContent = `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    ::-webkit-scrollbar { width: 2px; height: 2px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: rgba(0,245,212,0.18); border-radius: 2px; }
    @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
    @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
    @keyframes glowPulse { 0%,100% { box-shadow:0 0 8px rgba(0,245,212,0.25); } 50% { box-shadow:0 0 28px rgba(0,245,212,0.65),0 0 50px rgba(0,245,212,0.12); } }
    @keyframes dotPulse { 0%,100% { transform:scale(1); opacity:1; } 50% { transform:scale(1.6); opacity:0.5; } }
    @keyframes nodeEnter { from { opacity:0; transform:scale(0.8) translateX(-8px); } to { opacity:1; transform:scale(1) translateX(0); } }
    @keyframes modalIn { from { opacity:0; transform:scale(0.95) translateY(10px); } to { opacity:1; transform:scale(1) translateY(0); } }
    @keyframes countUp { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
    @keyframes slideDown { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
    @keyframes toastTimer { from { width:100%; } to { width:0%; } }
    @keyframes xpPop { 0% { opacity:0; transform:translateY(16px) scale(0.85); } 15% { opacity:1; transform:translateY(-4px) scale(1.06); } 30% { transform:translateY(0) scale(1); } 70% { opacity:1; transform:translateY(0) scale(1); } 100% { opacity:0; transform:translateY(-20px) scale(0.92); } }
    @keyframes fabItemIn { from { opacity:0; transform:scale(0.4); } to { opacity:1; transform:scale(1); } }
    @keyframes badgeIn { from { opacity:0; transform:scale(0.7) rotateY(90deg); } to { opacity:1; transform:scale(1) rotateY(0deg); } }
    @keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
    @media (max-width:767px) {
      .los-desktop-only { display:none !important; }
      .los-mobile-only { display:flex !important; }
    }
    @media (min-width:768px) {
      .los-mobile-only { display:none !important; }
    }
    .los-btn:hover { filter:brightness(1.2); transform:translateY(-1px); }
    .los-card:hover { border-color:rgba(0,245,212,0.18) !important; }
    .los-nav:hover { background:rgba(0,245,212,0.08) !important; }
    .los-qa:hover { background:rgba(255,255,255,0.07) !important; transform:translateY(-2px); }
    .los-ev:hover { background:rgba(255,255,255,0.04) !important; }
    .los-tab:hover { background:rgba(255,255,255,0.05) !important; }
    .los-row:hover { background:rgba(255,255,255,0.03) !important; }
    .los-cmd:hover { background:rgba(255,255,255,0.06) !important; }
    .los-heat:hover { transform:scale(1.4); z-index:10; }
    /* UX fix: keep outline:none for mouse users but restore visible focus ring for
       keyboard/AT users via :focus-visible. Previously ALL focus indicators were
       removed, making keyboard navigation effectively invisible. */
    input, textarea, select { outline:none; font-family:inherit; }
    input:focus, textarea:focus, select:focus { border-color:rgba(0,245,212,0.5) !important; }
    button { cursor:pointer; border:none; background:none; font-family:inherit; transition:all 0.18s ease; }
    button:focus-visible { outline: 2px solid rgba(0,245,212,0.7); outline-offset: 2px; border-radius: 6px; }
    a:focus-visible { outline: 2px solid rgba(0,245,212,0.7); outline-offset: 2px; border-radius: 4px; }
    select option { background:#0b0b1a; color:#dde0f2; }
  `;
  document.head.appendChild(style);
})();

// ── DESIGN TOKENS ─────────────────────────────────────────────────────────────
let T = {
  bg:'#040408', bg1:'#070710', bg2:'#0b0b1a',
  surface:'rgba(255,255,255,0.028)', surfaceHi:'rgba(255,255,255,0.055)',
  border:'rgba(255,255,255,0.07)', borderLit:'rgba(0,245,212,0.3)',
  accent:'#00f5d4', accentDim:'rgba(0,245,212,0.12)', accentLo:'rgba(0,245,212,0.06)',
  violet:'#8b5cf6', violetDim:'rgba(139,92,246,0.12)',
  amber:'#fbbf24', amberDim:'rgba(251,191,36,0.12)',
  rose:'#fb7185', roseDim:'rgba(251,113,133,0.12)',
  emerald:'#34d399', emeraldDim:'rgba(52,211,153,0.12)',
  sky:'#38bdf8', skyDim:'rgba(56,189,248,0.12)',
  text:'#dde0f2', textSub:'#6b6b90', textMuted:'#36364e',
  fD:'Syne, sans-serif', fM:'"IBM Plex Mono", monospace',
  r:'10px', rL:'16px', sw:72,
};

// ── S5: THEME SYSTEM ──────────────────────────────────────────────────────────
const THEMES = {
  dark: {
    bg:'#040408', bg1:'#070710', bg2:'#0b0b1a',
    surface:'rgba(255,255,255,0.028)', surfaceHi:'rgba(255,255,255,0.055)',
    border:'rgba(255,255,255,0.07)', borderLit:'rgba(0,245,212,0.3)',
    accent:'#00f5d4', accentDim:'rgba(0,245,212,0.12)', accentLo:'rgba(0,245,212,0.06)',
    violet:'#8b5cf6', violetDim:'rgba(139,92,246,0.12)',
    amber:'#fbbf24', amberDim:'rgba(251,191,36,0.12)',
    rose:'#fb7185', roseDim:'rgba(251,113,133,0.12)',
    emerald:'#34d399', emeraldDim:'rgba(52,211,153,0.12)',
    sky:'#38bdf8', skyDim:'rgba(56,189,248,0.12)',
    text:'#dde0f2', textSub:'#6b6b90', textMuted:'#36364e',
    fD:'Syne, sans-serif', fM:'"IBM Plex Mono", monospace',
    r:'10px', rL:'16px', sw:72,
  },
  light: {
    bg:'#f4f6fb', bg1:'#e8ecf4', bg2:'#ffffff',
    surface:'rgba(0,0,0,0.04)', surfaceHi:'rgba(0,0,0,0.07)',
    border:'rgba(0,0,0,0.10)', borderLit:'rgba(0,180,160,0.4)',
    accent:'#00a896', accentDim:'rgba(0,168,150,0.12)', accentLo:'rgba(0,168,150,0.06)',
    violet:'#7c3aed', violetDim:'rgba(124,58,237,0.12)',
    amber:'#d97706', amberDim:'rgba(217,119,6,0.12)',
    rose:'#e11d48', roseDim:'rgba(225,29,72,0.12)',
    emerald:'#059669', emeraldDim:'rgba(5,150,105,0.12)',
    sky:'#0284c7', skyDim:'rgba(2,132,199,0.12)',
    text:'#1e1e2e', textSub:'#4a4a6a', textMuted:'#9090b0',
    fD:'Syne, sans-serif', fM:'"IBM Plex Mono", monospace',
    r:'10px', rL:'16px', sw:72,
  },
  amoled: {
    bg:'#000000', bg1:'#050505', bg2:'#0a0a0a',
    surface:'rgba(255,255,255,0.015)', surfaceHi:'rgba(255,255,255,0.035)',
    border:'rgba(255,255,255,0.05)', borderLit:'rgba(0,255,200,0.35)',
    accent:'#00ffc8', accentDim:'rgba(0,255,200,0.10)', accentLo:'rgba(0,255,200,0.04)',
    violet:'#a78bfa', violetDim:'rgba(167,139,250,0.10)',
    amber:'#fcd34d', amberDim:'rgba(252,211,77,0.10)',
    rose:'#ff6b8a', roseDim:'rgba(255,107,138,0.10)',
    emerald:'#6ee7b7', emeraldDim:'rgba(110,231,183,0.10)',
    sky:'#7dd3fc', skyDim:'rgba(125,211,252,0.10)',
    text:'#e8eaf0', textSub:'#555570', textMuted:'#2a2a3a',
    fD:'Syne, sans-serif', fM:'"IBM Plex Mono", monospace',
    r:'10px', rL:'16px', sw:72,
  },
  solarized: {
    bg:'#001e26', bg1:'#002b36', bg2:'#073642',
    surface:'rgba(255,255,255,0.04)', surfaceHi:'rgba(255,255,255,0.08)',
    border:'rgba(255,255,255,0.10)', borderLit:'rgba(42,161,152,0.4)',
    accent:'#2aa198', accentDim:'rgba(42,161,152,0.14)', accentLo:'rgba(42,161,152,0.06)',
    violet:'#6c71c4', violetDim:'rgba(108,113,196,0.14)',
    amber:'#b58900', amberDim:'rgba(181,137,0,0.14)',
    rose:'#dc322f', roseDim:'rgba(220,50,47,0.14)',
    emerald:'#859900', emeraldDim:'rgba(133,153,0,0.14)',
    sky:'#268bd2', skyDim:'rgba(38,139,210,0.14)',
    text:'#839496', textSub:'#586e75', textMuted:'#334955',
    fD:'Syne, sans-serif', fM:'"IBM Plex Mono", monospace',
    r:'10px', rL:'16px', sw:72,
  },
};

// ── AI ROUTER ─────────────────────────────────────────────────────────────────
// Single entry point for all AI calls. Routes to Ollama, OpenAI, or Anthropic
// based on settings.aiProvider. Add new providers here — nowhere else.
async function callAI(settings, { system, messages, max_tokens = 1000 }) {
  const provider = settings?.aiProvider || 'claude';

  // ── OLLAMA (local) ──────────────────────────────────────────────────────────
  if (provider === 'ollama') {
    const model = settings?.ollamaModel || 'llama3.2';
    const res = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        stream: false,
        messages: [
          ...(system ? [{ role: 'system', content: system }] : []),
          ...messages,
        ],
      }),
    });
    if (!res.ok) {
      const err = await res.text().catch(() => res.statusText);
      throw new Error(`Ollama error (${res.status}): ${err}`);
    }
    const data = await res.json();
    return data.message?.content || '';
  }

  // ── OPENAI ──────────────────────────────────────────────────────────────────
  if (provider === 'openai') {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings?.aiApiKey || ''}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens,
        messages: [
          ...(system ? [{ role: 'system', content: system }] : []),
          ...messages,
        ],
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `OpenAI error ${res.status}`);
    }
    const data = await res.json();
    return data.choices?.[0]?.message?.content || '';
  }

  // ── ANTHROPIC (default) ─────────────────────────────────────────────────────
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': settings?.aiApiKey || '',
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens,
      system,
      messages,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Anthropic error ${res.status}`);
  }
  const data = await res.json();
  return data.content?.[0]?.text || '';
}

// ── S5: THEME BOOT — apply saved theme before first render ───────────────────
// Reads localStorage synchronously at module load so T is correct on the very
// first paint — no flash of wrong theme (FOWT) on refresh or cold start.
(() => {
  try {
    const raw = localStorage.getItem('los_settings');
    if (raw) {
      const saved = JSON.parse(raw);
      const theme = saved?.theme;
      if (theme && THEMES[theme]) Object.assign(T, THEMES[theme]);
    }
  } catch {} // silent — fall back to dark
})();

// ── S5: i18n ──────────────────────────────────────────────────────────────────
const LOCALES = {
  en: {
    home:'Home', timeline:'Timeline', money:'Money', health:'Health',
    growth:'Growth', knowledge:'Knowledge', intel:'Intelligence',
    archive:'Archive', settings:'Settings', career:'Career', calendar:'Calendar',
    netWorth:'Net Worth', savingsRate:'Savings Rate', habits:'Habits',
    goals:'Goals', notes:'Notes', expenses:'Expenses', income:'Income',
    addExpense:'Log Expense', addIncome:'Log Income', logHabit:'Log Habit',
    logVitals:'Log Vitals', addNote:'New Note', addGoal:'New Goal',
    thisMonth:'This Month', today:'Today', streak:'streak',
    save:'Save', cancel:'Cancel', delete:'Delete', edit:'Edit',
    commandCenter:'Command Center', dailyBrief:'AI Daily Brief',
    quickActions:'Quick Actions', smartAlerts:'Smart Alerts',
  },
  fr: {
    home:'Accueil', timeline:'Journal', money:'Finance', health:'Santé',
    growth:'Croissance', knowledge:'Savoir', intel:'Intelligence',
    archive:'Archive', settings:'Réglages', career:'Carrière', calendar:'Calendrier',
    netWorth:'Patrimoine Net', savingsRate:'Taux d\'épargne', habits:'Habitudes',
    goals:'Objectifs', notes:'Notes', expenses:'Dépenses', income:'Revenus',
    addExpense:'Ajouter dépense', addIncome:'Ajouter revenu', logHabit:'Valider habitude',
    logVitals:'Mes signes vitaux', addNote:'Nouvelle note', addGoal:'Nouvel objectif',
    thisMonth:'Ce mois', today:'Aujourd\'hui', streak:'série',
    save:'Enregistrer', cancel:'Annuler', delete:'Supprimer', edit:'Modifier',
    commandCenter:'Centre de Commande', dailyBrief:'Briefing IA Quotidien',
    quickActions:'Actions Rapides', smartAlerts:'Alertes Intelligentes',
  },
};
// Bug-fix: removed `currentLang` mutable global. The t() function now always
// requires an explicit lang argument (defaulting to 'en'). All call-sites already
// pass lang via useLang(), so this is a no-op in practice — but it eliminates
// the race where currentLang lagged behind the LangContext value.
const t = (key, lang = 'en') => LOCALES[lang]?.[key] || LOCALES.en[key] || key;
const LangContext = createContext('en');
function useLang() { return useContext(LangContext); }

// ── DOMAIN CONTEXTS — per-domain state isolation ──────────────────────────────
const MoneyContext = createContext(null);
const HealthContext = createContext(null);
const GrowthContext = createContext(null);
/** Hook for money-domain components */
function useMoney() { return useContext(MoneyContext); }
/** Hook for health-domain components */
function useHealth() { return useContext(HealthContext); }
/** Hook for growth-domain components */
function useGrowth() { return useContext(GrowthContext); }

// ── LOCAL STORAGE HOOK ────────────────────────────────────────────────────────
function useLocalStorage(key, defaultVal) {
  const [val, setVal] = useState(() => {
    try {
      const s = localStorage.getItem(key);
      if (s === null) return defaultVal;
      const parsed = JSON.parse(s);
      // Guard: JSON.parse("null") returns null — fall back to defaultVal
      return parsed !== null && parsed !== undefined ? parsed : defaultVal;
    }
    catch { return defaultVal; }
  });
  const setter = useCallback((v) => {
    setVal(prev => {
      const next = typeof v === 'function' ? v(prev) : v;
      try { localStorage.setItem(key, JSON.stringify(next)); } catch {}
      return next;
    });
  }, [key]);
  return [val, setter];
}
function useDebouncedLocalStorage(key, defaultVal, delay = 600) {
  const [val, setValState] = useState(() => {
    try {
      const s = localStorage.getItem(key);
      if (s === null) return defaultVal;
      const parsed = JSON.parse(s);
      return parsed !== null && parsed !== undefined ? parsed : defaultVal;
    }
    catch { return defaultVal; }
  });
  const timerRef = useRef(null);
  const latestVal = useRef(defaultVal);
  const setter = useCallback((v) => {
    setValState(prev => {
      const next = typeof v === 'function' ? v(prev) : v;
      latestVal.current = next;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        try { localStorage.setItem(key, JSON.stringify(latestVal.current)); } catch {}
      }, delay);
      return next;
    });
  }, [key, delay]);
  // Flush on unmount — never lose in-flight writes
  useEffect(() => () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      try { localStorage.setItem(key, JSON.stringify(latestVal.current)); } catch {}
    }
  }, [key]);
  return [val, setter];
}

// ── HELPERS ───────────────────────────────────────────────────────────────────
const today = () => new Date().toISOString().slice(0, 10);
const fmtN = (n) => {
  if (n === undefined || n === null) return '0';
  const num = Number(n);
  if (isNaN(num)) return '0';
  return num >= 1000000 ? `${(num/1000000).toFixed(2)}M`
    : num >= 1000 ? num.toLocaleString('en-US', {maximumFractionDigits:0})
    : num.toFixed(num % 1 ? 2 : 0);
};
const getStreak = (habitId, habitLogs) => {
  const logs = habitLogs[habitId] || [];
  let streak = 0; let d = new Date();
  while (true) { const s = d.toISOString().slice(0, 10); if (logs.includes(s)) { streak++; d.setDate(d.getDate()-1); } else break; }
  return streak;
};

// ── useMobile hook ─────────────────────────────────────────────────────────────
function useMobile() {
  const [mobile, setMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);
  useEffect(() => {
    const mq = window.matchMedia('(max-width:767px)');
    const handler = (e) => setMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return mobile;
}

// ── useClock hook ──────────────────────────────────────────────────────────────
// UX fix: the topbar clock was evaluated once at render time and never updated.
// This hook ticks every 30 seconds so the displayed time stays accurate.
function useClock() {
  const fmt = () => new Date().toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' });
  const [time, setTime] = useState(fmt);
  useEffect(() => {
    const id = setInterval(() => setTime(fmt()), 30_000);
    return () => clearInterval(id);
  }, []);
  return time;
}

// ── useDebounce hook ───────────────────────────────────────────────────────────
function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}


// ── CHALLENGES — predefined 30-day self-improvement challenges ─────────────────
const CHALLENGES_CATALOG = [
  { id:'no_spend_30',  title:'No-Spend Month',      desc:'Zero non-essential spending for 30 days',  emoji:'🚫💸', xp:500, cat:'finance', days:30 },
  { id:'steps_10k',    title:'10K Steps Daily',      desc:'Hit 10,000 steps every day for 30 days',   emoji:'👣',   xp:400, cat:'health',  days:30 },
  { id:'read_30',      title:'Read Every Day',       desc:'Read for 20+ mins daily for 30 days',      emoji:'📚',   xp:350, cat:'growth',  days:30 },
  { id:'journal_30',   title:'Daily Journaling',     desc:'Write a note or reflection every day',      emoji:'✍️',   xp:300, cat:'mind',    days:30 },
  { id:'no_social',    title:'Digital Detox',        desc:'No social media for 14 days',               emoji:'📵',   xp:250, cat:'mind',    days:14 },
  { id:'meditation',   title:'Meditation Streak',    desc:'Meditate 10+ mins daily for 21 days',      emoji:'🧘',   xp:300, cat:'health',  days:21 },
  { id:'savings_20',   title:'Save 20% Challenge',   desc:'Achieve 20%+ savings rate for 4 weeks',    emoji:'💰',   xp:400, cat:'finance', days:28 },
  { id:'cold_shower',  title:'Cold Shower Warrior',  desc:'Cold shower every day for 30 days',         emoji:'🚿',   xp:200, cat:'health',  days:30 },
  { id:'gratitude',    title:'Gratitude Practice',   desc:'Log 3 gratitudes daily for 21 days',        emoji:'🙏',   xp:250, cat:'mind',    days:21 },
  { id:'learn_skill',  title:'Skill Sprint',         desc:'Study a new skill for 1h daily, 14 days',   emoji:'🎯',   xp:300, cat:'growth',  days:14 },
];

// ── ACHIEVEMENTS (20 total) ────────────────────────────────────────────────────
const ACHIEVEMENTS = [
  // Habits
  { id:'habit_first',   emoji:'🌱', name:'First Step',       desc:'Log your first habit',              color:T.accent,  check:d => Object.values(d.habitLogs).flat().length >= 1 },
  { id:'streak_7',      emoji:'🔥', name:'Week Warrior',     desc:'7-day streak on any habit',          color:T.amber,   check:d => d.habits.some(h => getStreak(h.id, d.habitLogs) >= 7) },
  { id:'streak_30',     emoji:'⚡', name:'Iron Discipline',  desc:'30-day streak on any habit',         color:T.violet,  check:d => d.habits.some(h => getStreak(h.id, d.habitLogs) >= 30) },
  { id:'habits_100',    emoji:'💯', name:'Century Club',     desc:'100 total habit logs',               color:T.accent,  check:d => Object.values(d.habitLogs).flat().length >= 100 },
  { id:'habits_5',      emoji:'🎭', name:'Multi-Tracker',    desc:'Track 5 habits simultaneously',      color:T.sky,     check:d => d.habits.length >= 5 },
  // Finance
  { id:'expense_first', emoji:'💳', name:'First Log',        desc:'Log your first expense',             color:T.rose,    check:d => d.expenses.length >= 1 },
  { id:'expenses_50',   emoji:'📊', name:'Data Driven',      desc:'Log 50 expenses',                    color:T.rose,    check:d => d.expenses.length >= 50 },
  { id:'income_first',  emoji:'💰', name:'Earner',           desc:'Log your first income',              color:T.emerald, check:d => d.incomes.length >= 1 },
  { id:'debt_free',     emoji:'🏆', name:'Debt Slayer',      desc:'Reduce all debts to zero balance',   color:T.emerald, check:d => d.debts.length > 0 && d.debts.every(x => Number(x.balance||0) === 0) },
  { id:'savings_50',    emoji:'🚀', name:'Super Saver',      desc:'Achieve 50%+ savings rate',          color:T.accent,  check:d => { const m=new Date().toISOString().slice(0,7); const inc=d.incomes.filter(i=>i.date?.startsWith(m)).reduce((s,i)=>s+Number(i.amount||0),0); const exp=d.expenses.filter(e=>e.date?.startsWith(m)).reduce((s,e)=>s+Number(e.amount||0),0); return inc>0&&((inc-exp)/inc)>=0.5; } },
  // Growth / XP
  { id:'level_5',       emoji:'⚔️', name:'Rising Star',      desc:'Reach Level 5',                      color:T.violet,  check:d => Math.floor(Math.sqrt(Number(d.totalXP)/100))+1 >= 5 },
  { id:'level_10',      emoji:'👑', name:'Life Master',      desc:'Reach Level 10',                     color:T.amber,   check:d => Math.floor(Math.sqrt(Number(d.totalXP)/100))+1 >= 10 },
  { id:'goals_5',       emoji:'🎯', name:'Visionary',        desc:'Create 5 goals',                     color:T.amber,   check:d => d.goals.length >= 5 },
  { id:'goal_done',     emoji:'🏅', name:'Goal Getter',      desc:'Complete your first goal',           color:T.emerald, check:d => d.goals.some(g => Number(g.current||0) >= Number(g.target||1) && g.target > 0) },
  { id:'xp_1000',       emoji:'✨', name:'XP Collector',     desc:'Earn 1,000 XP',                      color:T.violet,  check:d => Number(d.totalXP) >= 1000 },
  // Knowledge / Health
  { id:'note_first',    emoji:'📝', name:'Note Taker',       desc:'Create your first note',             color:T.amber,   check:d => d.notes.length >= 1 },
  { id:'notes_10',      emoji:'📚', name:'Librarian',        desc:'Build a library of 10 notes',        color:T.amber,   check:d => d.notes.length >= 10 },
  { id:'vitals_first',  emoji:'❤️', name:'Body Check',       desc:'Log vitals for the first time',      color:T.sky,     check:d => d.vitals.length >= 1 },
  { id:'vitals_30',     emoji:'🏃', name:'Health Tracker',   desc:'Log vitals 30 times',                color:T.sky,     check:d => d.vitals.length >= 30 },
  // Portfolio
  { id:'invest_first',  emoji:'📈', name:'Investor',         desc:'Add your first investment position', color:T.violet,  check:d => d.investments.length >= 1 },
];
const EXPENSE_COLORS = {
  '🍽️ Food':T.emerald,'🍔 Fast Food':T.amber,'🚗 Transport':T.sky,
  '❤️ Health':T.rose,'🏠 Housing':T.violet,'💳 Debts':T.rose,
  '💰 Savings':T.accent,'🎮 Leisure':T.amber,'👕 Shopping':T.violet,
  '🔧 Other':T.textSub,'✈️ Travel':T.sky,'🚬 Tabac':T.textMuted,
};
const getCatColor = (cat) => {
  if (!cat) return T.textSub;
  for (const [k, v] of Object.entries(EXPENSE_COLORS)) { if (cat.includes(k.split(' ')[1] || k)) return v; }
  return T.textSub;
};

// ── ICON COMPONENTS ───────────────────────────────────────────────────────────
const Ico = ({ d, size=18, stroke='currentColor', fill='none', sw=1.8, style={}, vb='0 0 24 24' }) => (
  <svg width={size} height={size} viewBox={vb} fill={fill} stroke={stroke}
    strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
    style={{display:'inline-block',flexShrink:0,...style}}>{d}</svg>
);
const IcoHome     = (p) => <Ico {...p} d={<><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>} />;
const IcoTimeline = (p) => <Ico {...p} d={<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>} />;
const IcoMoney    = (p) => <Ico {...p} d={<><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></>} />;
const IcoHealth   = (p) => <Ico {...p} d={<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>} />;
const IcoGrowth   = (p) => <Ico {...p} d={<><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></>} />;
const IcoBook     = (p) => <Ico {...p} d={<><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></>} />;
const IcoBrain    = (p) => <Ico {...p} d={<><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24A2.5 2.5 0 0 0 14.5 2Z"/></>} />;
const IcoArchive  = (p) => <Ico {...p} d={<><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></>} />;
const IcoSettings = (p) => <Ico {...p} d={<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></>} />;
const IcoPlus     = (p) => <Ico {...p} d={<><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>} />;
const IcoX        = (p) => <Ico {...p} d={<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>} />;
const IcoChevR    = (p) => <Ico {...p} d={<polyline points="9 18 15 12 9 6"/>} />;
const IcoSend     = (p) => <Ico {...p} d={<><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></>} />;
const IcoCheck    = (p) => <Ico {...p} d={<><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></>} />;
const IcoSearch   = (p) => <Ico {...p} d={<><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>} />;
const IcoTrash    = (p) => <Ico {...p} d={<><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></>} />;
const IcoPencil   = (p) => <Ico {...p} d={<><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>} />;
const IcoUndo     = (p) => <Ico {...p} d={<><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.99"/></>} />;
const IcoBill     = (p) => <Ico {...p} d={<><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></>} />;
const IcoStickyNote=(p) => <Ico {...p} d={<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></>} />;
const IcoTrophy   = (p) => <Ico {...p} d={<><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-1a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2h-2"/><rect x="6" y="18" width="12" height="4"/></>} />;
const IcoStar     = (p) => <Ico {...p} d={<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>} />;
const IcoMenu     = (p) => <Ico {...p} d={<><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></>} />;
const IcoFlag     = (p) => <Ico {...p} d={<><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></>} />;

// ── S4/S5: NEW ICONS ─────────────────────────────────────────────────────────
const IcoBriefcase = (p) => <Ico {...p} d={<><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></>} />;
const IcoCalendar  = (p) => <Ico {...p} d={<><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>} />;
const IcoGlobe     = (p) => <Ico {...p} d={<><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></>} />;
const IcoRefresh   = (p) => <Ico {...p} d={<><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></>} />;
const IcoChevLeft  = (p) => <Ico {...p} d={<polyline points="15 18 9 12 15 6"/>} />;
const IcoTrendUp   = (p) => <Ico {...p} d={<><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></>} />;
const IcoKanban    = (p) => <Ico {...p} d={<><rect x="3" y="3" width="5" height="18" rx="1"/><rect x="10" y="3" width="5" height="12" rx="1"/><rect x="17" y="3" width="5" height="15" rx="1"/></>} />;

// ── SHARED UI COMPONENTS ──────────────────────────────────────────────────────
const GlassCard = ({ children, style={}, className='', onClick }) => (
  <div className={`los-card ${className}`} onClick={onClick} style={{
    background:T.surface, border:`1px solid ${T.border}`,
    borderRadius:T.rL, backdropFilter:'blur(20px)',
    transition:'border-color 0.2s, box-shadow 0.2s', ...style
  }}>{children}</div>
);
const Badge = ({ children, color=T.accent }) => (
  <span style={{ display:'inline-flex', alignItems:'center', gap:3, padding:'2px 8px', borderRadius:99, background:color+'18', color, fontSize:9, fontFamily:T.fM, fontWeight:600, letterSpacing:'0.06em', border:`1px solid ${color}28` }}>{children}</span>
);
const ProgressBar = ({ pct, color=T.accent, height=4 }) => (
  <div style={{ width:'100%', height, borderRadius:99, background:'rgba(255,255,255,0.06)', overflow:'hidden' }}>
    <div style={{ height:'100%', width:`${Math.min(Math.max(pct||0,0),100)}%`, borderRadius:99, background:`linear-gradient(90deg, ${color}aa, ${color})`, boxShadow:`0 0 6px ${color}44`, transition:'width 0.6s cubic-bezier(0.34,1.56,0.64,1)' }} />
  </div>
);
const Input = ({ value, onChange, placeholder, type='text', style={} }) => (
  <input type={type} value={value} onChange={onChange} placeholder={placeholder} style={{ width:'100%', padding:'9px 12px', background:'rgba(255,255,255,0.04)', border:`1px solid ${T.border}`, borderRadius:T.r, fontFamily:T.fM, fontSize:12, color:T.text, transition:'border-color 0.2s', ...style }} />
);
const Select = ({ value, onChange, children, style={} }) => (
  <select value={value} onChange={onChange} style={{ width:'100%', padding:'9px 12px', background:'rgba(255,255,255,0.04)', border:`1px solid ${T.border}`, borderRadius:T.r, fontFamily:T.fM, fontSize:12, color:T.text, transition:'border-color 0.2s', ...style }}>{children}</select>
);
const SectionLabel = ({ children }) => (
  <div style={{ fontSize:9, fontFamily:T.fM, color:T.textSub, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:12 }}>{children}</div>
);
const ChartTooltip = ({ active, payload, label, prefix='', suffix='' }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:T.bg2, border:`1px solid ${T.border}`, borderRadius:8, padding:'8px 12px', fontFamily:T.fM, fontSize:11, color:T.text }}>
      {label && <div style={{ color:T.textSub, marginBottom:3 }}>{label}</div>}
      {payload.map((p,i) => <div key={i} style={{ color:p.color||T.accent }}>{p.name}: <b>{prefix}{typeof p.value==='number'?p.value.toLocaleString():p.value}{suffix}</b></div>)}
    </div>
  );
};
const Modal = ({ open, onClose, title, children, wide=false }) => {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:999, display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(6px)', padding:16 }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:T.bg2, border:`1px solid ${T.border}`, borderRadius:20, padding:24, width:'100%', maxWidth:wide?640:420, animation:'modalIn 0.25s ease', maxHeight:'90vh', overflowY:'auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <h2 style={{ fontSize:16, fontFamily:T.fD, fontWeight:700, color:T.text }}>{title}</h2>
          <button onClick={onClose}><IcoX size={16} stroke={T.textSub} /></button>
        </div>
        {children}
      </div>
    </div>
  );
};
const Btn = ({ children, onClick, color=T.accent, disabled=false, full=false, style={} }) => (
  <button className="los-btn" onClick={onClick} disabled={disabled} style={{ padding:'10px 20px', borderRadius:T.r, background:disabled?T.surface:(color+'18'), color:disabled?T.textMuted:color, border:`1px solid ${disabled?T.border:(color+'44')}`, fontSize:12, fontFamily:T.fM, fontWeight:600, letterSpacing:'0.04em', width:full?'100%':'auto', transition:'all 0.18s', ...style }}>{children}</button>
);


// ── MILESTONE PROGRESS BAR ─────────────────────────────────────────────────────
const MilestoneProgressBar = ({ pct, color=T.accent, height=4, milestones=[] }) => (
  <div style={{ position:'relative', width:'100%', paddingBottom: milestones.length ? 14 : 0 }}>
    <div style={{ width:'100%', height, borderRadius:99, background:'rgba(255,255,255,0.06)', overflow:'visible', position:'relative' }}>
      <div style={{ height:'100%', width:`${Math.min(Math.max(pct||0,0),100)}%`, borderRadius:99, background:`linear-gradient(90deg,${color}aa,${color})`, boxShadow:`0 0 6px ${color}44`, transition:'width 0.6s cubic-bezier(0.34,1.56,0.64,1)' }} />
      {milestones.map((m,i) => (
        <div key={i} title={m.label} style={{ position:'absolute', left:`${m.pct}%`, top:'50%', transform:'translate(-50%,-50%)', width:height+6, height:height+6, borderRadius:'50%', background:(pct||0)>=m.pct?color:T.bg2, border:`2px solid ${(pct||0)>=m.pct?color:T.textMuted}`, zIndex:2, boxShadow:(pct||0)>=m.pct?`0 0 6px ${color}88`:'none', transition:'all 0.4s ease' }} />
      ))}
    </div>
    {milestones.length > 0 && (
      <div style={{ position:'relative', width:'100%', marginTop:4 }}>
        {milestones.map((m,i) => (
          <div key={i} style={{ position:'absolute', left:`${m.pct}%`, transform:'translateX(-50%)', fontSize:8, fontFamily:T.fM, color:(pct||0)>=m.pct?color:T.textMuted, textAlign:'center', whiteSpace:'nowrap', transition:'color 0.4s ease' }}>{m.label}</div>
        ))}
      </div>
    )}
  </div>
);

// ── XP POP CONTAINER ──────────────────────────────────────────────────────────
function XPPopContainer({ pops }) {
  if (!pops.length) return null;
  return (
    <div style={{ position:'fixed', top:62, right:20, zIndex:9997, display:'flex', flexDirection:'column', gap:8, alignItems:'flex-end', pointerEvents:'none' }}>
      {pops.map(pop => (
        <div key={pop.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 14px', borderRadius:12, background:`${T.bg2}f0`, border:`1.5px solid ${pop.color||T.violet}66`, boxShadow:`0 4px 20px rgba(0,0,0,0.5), 0 0 12px ${pop.color||T.violet}22`, color:pop.color||T.violet, fontFamily:T.fM, fontWeight:700, fontSize:13, letterSpacing:'0.02em', animation:'xpPop 1.9s ease forwards', whiteSpace:'nowrap', backdropFilter:'blur(12px)' }}>
          <span style={{ fontSize:16, filter:`drop-shadow(0 0 6px ${pop.color||T.violet})` }}>⚡</span>
          <span style={{ color:T.text }}>{pop.label}</span>
        </div>
      ))}
    </div>
  );
}

// ── QUICK CAPTURE FAB ─────────────────────────────────────────────────────────
function QuickCaptureFAB({ onAction, isMobile }) {
  const [open, setOpen] = useState(false);
  const FAB_ITEMS = [
    { label:'Expense', emoji:'💳', modal:'expense', color:T.rose },
    { label:'Income',  emoji:'💰', modal:'income',  color:T.emerald },
    { label:'Habit',   emoji:'🔥', modal:'habit',   color:T.accent },
    { label:'Vitals',  emoji:'❤️', modal:'vitals',  color:T.sky },
    { label:'Note',    emoji:'📝', modal:'note',    color:T.amber },
    { label:'Goal',    emoji:'🎯', modal:'goal',    color:T.violet },
  ];
  // Fan arc from 90° (up) to 180° (left) at radius 78px
  const positions = FAB_ITEMS.map((_,i) => {
    const deg = 90 + (90 / (FAB_ITEMS.length - 1)) * i;
    const rad = deg * Math.PI / 180;
    return { x: Math.round(Math.cos(rad) * 78), y: Math.round(Math.sin(rad) * 78) };
  });
  const bottomOffset = isMobile ? 74 : 46;
  return (
    <div style={{ position:'fixed', bottom:bottomOffset, right:20, zIndex:9990 }}>
      {open && FAB_ITEMS.map((item, i) => (
        <button
          key={item.modal}
          onClick={() => { onAction(item.modal); setOpen(false); }}
          title={item.label}
          style={{ position:'absolute', bottom:positions[i].y, right:-positions[i].x, width:44, height:44, borderRadius:'50%', background:T.bg2, border:`1.5px solid ${item.color}55`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:19, boxShadow:`0 4px 16px rgba(0,0,0,0.6), 0 0 8px ${item.color}22`, animation:`fabItemIn 0.22s ease ${i*0.045}s both`, cursor:'pointer' }}
        >{item.emoji}</button>
      ))}
      {open && (
        <div onClick={() => setOpen(false)} style={{ position:'fixed', inset:0, zIndex:-1 }} />
      )}
      <button
        onClick={() => setOpen(v => !v)}
        style={{ width:52, height:52, borderRadius:'50%', background:open?T.roseDim:T.accentDim, border:`1.5px solid ${open?T.rose:T.accent}55`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, color:open?T.rose:T.accent, boxShadow:`0 4px 20px ${open?T.rose:T.accent}33`, transform:open?'rotate(45deg)':'none', transition:'all 0.25s cubic-bezier(0.34,1.56,0.64,1)', animation:open?'none':'glowPulse 4s infinite', cursor:'pointer' }}
      >⊕</button>
    </div>
  );
}

// ── BOTTOM NAV (mobile) ───────────────────────────────────────────────────────
const BOTTOM_NAV_DEFS = [
  { id:'home',      Icon:IcoHome,     tKey:'home'      },
  { id:'money',     Icon:IcoMoney,    tKey:'money'     },
  { id:'health',    Icon:IcoHealth,   tKey:'health'    },
  { id:'growth',    Icon:IcoGrowth,   tKey:'growth'    },
  { id:'knowledge', Icon:IcoBook,     tKey:'knowledge' },
];
function BottomNav({ active, onNav, onAI, showAI }) {
  const lang = useLang();
  const BOTTOM_NAV = BOTTOM_NAV_DEFS.map(n => ({ ...n, label: t(n.tKey, lang) }));
  return (
    <div className="los-mobile-only" style={{ position:'fixed', bottom:0, left:0, right:0, height:60, background:`${T.bg1}f0`, borderTop:`1px solid ${T.border}`, backdropFilter:'blur(20px)', zIndex:200, alignItems:'stretch', justifyContent:'space-around', display:'none' }}>
      {BOTTOM_NAV.map(({ id, Icon, label }) => {
        const isA = active === id;
        return (
          <button key={id} onClick={() => onNav(id)} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:3, background:'none', color:isA?T.accent:T.textSub, borderTop:`2px solid ${isA?T.accent:'transparent'}`, transition:'all 0.18s', padding:'6px 0' }}>
            <Icon size={17} stroke={isA?T.accent:T.textSub} />
            <span style={{ fontSize:8, fontFamily:T.fM, letterSpacing:'0.06em' }}>{label.toUpperCase()}</span>
          </button>
        );
      })}
      {/* AI button */}
      <button onClick={onAI} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:3, background:'none', color:showAI?T.accent:T.textSub, borderTop:`2px solid ${showAI?T.accent:'transparent'}`, transition:'all 0.18s', padding:'6px 0', position:'relative' }}>
        <IcoBrain size={17} stroke={showAI?T.accent:T.textSub} />
        {!showAI && <span style={{ position:'absolute', top:8, left:'50%', marginLeft:3, width:5, height:5, borderRadius:'50%', background:T.accent, animation:'dotPulse 2s infinite' }} />}
        <span style={{ fontSize:8, fontFamily:T.fM, letterSpacing:'0.06em' }}>AI</span>
      </button>
    </div>
  );
}

// ── TOAST / UNDO SYSTEM ───────────────────────────────────────────────────────
function ToastContainer({ toasts, onUndo, onDismiss, isMobile }) {
  if (!toasts.length) return null;
  return (
    <div style={{ position:'fixed', bottom:isMobile?72:38, left:'50%', transform:'translateX(-50%)', zIndex:9998, display:'flex', flexDirection:'column', gap:8, alignItems:'center', pointerEvents:'none' }}>
      {toasts.map(t => (
        <div key={t.id} style={{ position:'relative', display:'flex', alignItems:'center', gap:12, padding:'10px 16px', background:`${T.bg2}f8`, border:`1px solid ${t.onUndo?T.amber+'55':T.border}`, borderRadius:12, boxShadow:`0 8px 32px rgba(0,0,0,0.55), ${t.onUndo?`0 0 20px ${T.amber}18`:''}`, animation:'slideDown 0.25s cubic-bezier(0.34,1.56,0.64,1)', fontFamily:T.fM, fontSize:12, color:T.text, pointerEvents:'all', minWidth:260, maxWidth:380, backdropFilter:'blur(16px)', overflow:'hidden' }}>
          {t.onUndo && <span style={{ fontSize:16, flexShrink:0 }}>🗑️</span>}
          <span style={{ flex:1, lineHeight:1.4 }}>{t.message}</span>
          {t.onUndo && (
            <button onClick={()=>onUndo(t.id)} style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 11px', borderRadius:7, background:T.amberDim, border:`1px solid ${T.amber}44`, color:T.amber, fontSize:11, fontFamily:T.fM, fontWeight:700, cursor:'pointer', flexShrink:0, transition:'all 0.15s' }}>
              <IcoUndo size={11} stroke={T.amber} /> Undo
            </button>
          )}
          <button onClick={()=>onDismiss(t.id)} style={{ color:T.textSub, padding:4, borderRadius:5, background:'none', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}><IcoX size={13} stroke={T.textSub} /></button>
          {/* Animated timer bar */}
          <div style={{ position:'absolute', bottom:0, left:0, right:0, height:2, background:'rgba(255,255,255,0.05)' }}>
            <div style={{ height:'100%', background:t.onUndo?T.amber:T.accent, borderRadius:'0 0 12px 12px', animation:`toastTimer ${t.duration||6}s linear forwards` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── SIDEBAR ───────────────────────────────────────────────────────────────────
// NAV uses t() at render time via a getter so labels auto-update with lang
// NAV: 7 items — removed Timeline, Archive, Career, Calendar.
// Timeline and Archive are pure history (no actions). Career and Calendar
// are low-frequency tools accessible via the Intelligence page or ⌘K.
// All pages still exist and are accessible via Command Palette (⌘K).
const NAV_DEFS = [
  { id:'home',      Icon:IcoHome,       tKey:'home'        },
  { id:'money',     Icon:IcoMoney,      tKey:'money'       },
  { id:'health',    Icon:IcoHealth,     tKey:'health'      },
  { id:'growth',    Icon:IcoGrowth,     tKey:'growth'      },
  { id:'knowledge', Icon:IcoBook,       tKey:'knowledge'   },
  { id:'intel',     Icon:IcoBrain,      tKey:'intel'       },
  { id:'settings',  Icon:IcoSettings,   tKey:'settings'    },
];
function Sidebar({ active, onNav, userName, onAI, showAI }) {
  const [hov, setHov] = useState(null);
  const lang = useLang();
  const NAV = NAV_DEFS.map(n => ({ ...n, label: t(n.tKey, lang) }));
  const init = userName ? userName.charAt(0).toUpperCase() : 'U';
  return (
    <div className="los-desktop-only" style={{ width:T.sw, minHeight:'100vh', flexShrink:0, background:`linear-gradient(180deg, ${T.bg} 0%, ${T.bg1} 100%)`, borderRight:`1px solid ${T.border}`, display:'flex', flexDirection:'column', alignItems:'center', padding:'16px 0', gap:2, position:'fixed', top:0, left:0, bottom:0, zIndex:100 }}>
      <div style={{ width:36, height:36, borderRadius:10, marginBottom:14, background:`linear-gradient(135deg,${T.accent}22,${T.violet}22)`, border:`1px solid ${T.accent}44`, display:'flex', alignItems:'center', justifyContent:'center', animation:'glowPulse 3s infinite', fontSize:15 }}>⬡</div>
      {NAV.map(({ id, Icon, label }) => {
        const isA = active===id;
        return (
          <div key={id} style={{ position:'relative', width:'100%' }} onMouseEnter={()=>setHov(id)} onMouseLeave={()=>setHov(null)}>
            <button className="los-nav" onClick={()=>onNav(id)} style={{ width:'100%', height:42, display:'flex', alignItems:'center', justifyContent:'center', background:isA?T.accentDim:'transparent', color:isA?T.accent:T.textSub, borderLeft:`2px solid ${isA?T.accent:'transparent'}`, transition:'all 0.18s', position:'relative' }}>
              {isA && <div style={{ position:'absolute', left:0, top:'50%', transform:'translateY(-50%)', width:2, height:18, background:T.accent, boxShadow:`0 0 8px ${T.accent}`, borderRadius:'0 2px 2px 0' }} />}
              <Icon size={15} stroke={isA?T.accent:T.textSub} />
            </button>
            {hov===id && (
              <div style={{ position:'absolute', left:'100%', top:'50%', transform:'translateY(-50%)', background:T.bg2, border:`1px solid ${T.border}`, borderRadius:6, padding:'4px 10px', zIndex:200, fontSize:10, fontFamily:T.fM, color:T.text, whiteSpace:'nowrap', marginLeft:6, pointerEvents:'none', animation:'fadeIn 0.15s ease' }}>{label}</div>
            )}
          </div>
        );
      })}
      <div style={{ flex:1 }} />
      {/* AI Coach button */}
      <div style={{ position:'relative', width:'100%' }} onMouseEnter={()=>setHov('ai')} onMouseLeave={()=>setHov(null)}>
        <button onClick={onAI} style={{ width:'100%', height:40, display:'flex', alignItems:'center', justifyContent:'center', background:showAI?T.accentDim:'transparent', color:showAI?T.accent:T.textSub, borderLeft:`2px solid ${showAI?T.accent:'transparent'}`, transition:'all 0.18s', position:'relative' }}>
          <IcoBrain size={15} stroke={showAI?T.accent:T.textSub} />
          {!showAI && <span style={{ position:'absolute', top:8, right:14, width:5, height:5, borderRadius:'50%', background:T.accent, animation:'dotPulse 2s infinite' }} />}
        </button>
        {hov==='ai' && <div style={{ position:'absolute', left:'100%', top:'50%', transform:'translateY(-50%)', background:T.bg2, border:`1px solid ${T.border}`, borderRadius:6, padding:'4px 10px', zIndex:200, fontSize:10, fontFamily:T.fM, color:T.text, whiteSpace:'nowrap', marginLeft:6, pointerEvents:'none', animation:'fadeIn 0.15s ease' }}>AI Coach (A)</div>}
      </div>
      <div style={{ width:32, height:32, borderRadius:'50%', background:`linear-gradient(135deg,${T.violet},${T.accent})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:T.bg, fontFamily:T.fD, border:`2px solid ${T.border}`, marginBottom:6 }}>{init}</div>
      <div style={{ width:5, height:5, borderRadius:'50%', background:T.emerald, boxShadow:`0 0 6px ${T.emerald}`, animation:'dotPulse 2s infinite', marginBottom:8 }} />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ── ENGINE — Pure computation functions (no React state) ─────────────────────
// ══════════════════════════════════════════════════════════════════════════════

// Phase 3 — Debt Payoff Engine (avalanche / snowball)

// ── DEBT WORKER FACTORY ───────────────────────────────────────────────────────
// Creates an inline Web Worker so heavy debt payoff simulations don't block the UI.
// The worker receives the same args as calcDebtPayoff and posts back the result.
function createDebtWorker() {
  const src = `
    function calcDebtPayoff(debts, extraPayment, method) {
      if (!debts || (debts||[]).length === 0) return { months:0, totalInterest:0, payoffDate:null, impossible:false };
      const MAX_MONTHS = 360;
      const sorted = [...debts].sort((a,b) =>
        method === 'avalanche' ? Number(b.rate||0)-Number(a.rate||0) : Number(a.balance||0)-Number(b.balance||0)
      );
      let remaining = sorted.map(d => ({
        balance: Number(d.balance||0),
        monthlyRate: Number(d.rate||0)/100/12,
        min: Math.max(Number(d.minPayment||0), 1),
      }));
      const totalMin = remaining.reduce((s,d)=>s+d.min,0) + extraPayment;
      const totalInterestFirst = remaining.reduce((s,d)=>s+d.balance*d.monthlyRate,0);
      if (totalMin <= totalInterestFirst && extraPayment === 0)
        return { months:MAX_MONTHS, totalInterest:Infinity, payoffDate:null, impossible:true };
      let months = 0, totalInterest = 0;
      while (remaining.some(d=>d.balance>0.01) && months < MAX_MONTHS) {
        months++;
        let extra = extraPayment;
        remaining = remaining.map(d => {
          if (d.balance<=0) return d;
          const interest = d.balance*d.monthlyRate;
          totalInterest += interest;
          return { ...d, balance: Math.max(0, d.balance+interest-d.min) };
        });
        for (let i=0;i<remaining.length;i++) {
          if (remaining[i].balance>0 && extra>0) {
            const pmt = Math.min(remaining[i].balance, extra);
            remaining[i] = { ...remaining[i], balance: remaining[i].balance-pmt };
            extra -= pmt;
          }
        }
      }
      const impossible = remaining.some(d=>d.balance>0.01);
      return { months, totalInterest, impossible, payoffDate: impossible ? null : Date.now()+months*30.44*24*3600*1000 };
    }
    self.onmessage = (e) => {
      const { debts, extraPayment, method } = e.data;
      const result = calcDebtPayoff(debts, extraPayment, method);
      self.postMessage(result);
    };
  `;
  try {
    const blob = new Blob([src], { type: 'application/javascript' });
    return new Worker(URL.createObjectURL(blob));
  } catch {
    return null; // fallback to sync if Worker unavailable
  }
}

function calcDebtPayoff(debts, extraPayment = 0, method = 'avalanche') {
  if (!debts || (debts||[]).length === 0) return { months: 0, totalInterest: 0, payoffDate: new Date(), impossible: false };
  const MAX_MONTHS = 360; // hard cap — never loop more than 30 years
  const sorted = [...debts].sort((a, b) =>
    method === 'avalanche'
      ? Number(b.rate || 0) - Number(a.rate || 0)
      : Number(a.balance || 0) - Number(b.balance || 0)
  );
  let remaining = sorted.map(d => ({
    ...d, balance: Number(d.balance || 0),
    monthlyRate: Number(d.rate || 0) / 100 / 12,
    min: Math.max(Number(d.minPayment || 0), 1), // ensure at least $1/mo to prevent infinite loops
  }));
  // Early bail-out: if min payments don't even cover interest, it's impossible without extra
  const totalMin = remaining.reduce((s, d) => s + d.min, 0) + extraPayment;
  const totalInterestFirst = remaining.reduce((s, d) => s + d.balance * d.monthlyRate, 0);
  if (totalMin <= totalInterestFirst && extraPayment === 0) {
    return { months: MAX_MONTHS, totalInterest: Infinity, payoffDate: null, impossible: true };
  }
  let months = 0; let totalInterest = 0;
  while (remaining.some(d => d.balance > 0.01) && months < MAX_MONTHS) {
    months++;
    let extra = extraPayment;
    remaining = remaining.map(d => {
      if (d.balance <= 0) return d;
      const interest = d.balance * d.monthlyRate;
      totalInterest += interest;
      return { ...d, balance: Math.max(0, d.balance + interest - d.min) };
    });
    for (let i = 0; i < remaining.length; i++) {
      if (remaining[i].balance > 0 && extra > 0) {
        const pmt = Math.min(remaining[i].balance, extra);
        remaining[i] = { ...remaining[i], balance: remaining[i].balance - pmt };
        extra -= pmt;
      }
    }
  }
  const impossible = remaining.some(d => d.balance > 0.01);
  const payoffDate = impossible ? null : new Date(Date.now() + months * 30.44 * 24 * 3600 * 1000);
  return { months, totalInterest, payoffDate, impossible };
}

// Phase 2 — Budget Engine
function calcBudgetStatus(expenses, budgets, month) {
  const result = {};
  (expenses||[]).filter(e => e.date?.startsWith(month)).forEach(e => {
    const cat = e.category;
    if (!result[cat]) result[cat] = { spent: 0, budget: Number(budgets[cat] || 0) };
    result[cat].spent += Number(e.amount || 0);
  });
  Object.keys(budgets).forEach(cat => {
    if (!result[cat]) result[cat] = { spent: 0, budget: Number(budgets[cat] || 0) };
  });
  return result;
}

// Phase 8 — Search Index Builder
function buildSearchIndex(data) {
  const items = [];
  const {notes=[], goals=[], habits=[], habitLogs={}, expenses=[], incomes=[], debts=[], investments=[], assets=[]} = data;
  (notes||[]).forEach(n => items.push({ type:'note', icon:'📝', label:n.title, sub:n.body?.slice(0,60)||'', id:n.id, page:'knowledge', color:T.amber }));
  (goals||[]).forEach(g => items.push({ type:'goal', icon:'🎯', label:g.name, sub:`${Math.round(((g.current||0)/Math.max(1,g.target))*100)}% complete`, id:g.id, page:'growth', color:T.violet }));
  (habits||[]).forEach(h => items.push({ type:'habit', icon:'🔥', label:h.name, sub:`🔥 ${getStreak(h.id,habitLogs)}d streak`, id:h.id, page:'growth', color:T.accent }));
  (expenses||[]).slice(0,50).forEach(e => items.push({ type:'expense', icon:'💳', label:e.note||e.category, sub:`${e.date} · ${e.category}`, id:e.id, page:'money', color:T.rose }));
  (debts||[]).forEach(d => items.push({ type:'debt', icon:'⚠️', label:d.name||d.creditor, sub:`Balance: ${d.balance}`, id:d.id, page:'money', color:T.rose }));
  (investments||[]).forEach(inv => items.push({ type:'investment', icon:'📈', label:inv.symbol||inv.name, sub:`×${inv.quantity}`, id:inv.id, page:'money', color:T.violet }));
  (assets||[]).forEach(a => items.push({ type:'asset', icon:'💎', label:a.name, sub:a.type, id:a.id, page:'money', color:T.accent }));
  return items;
}

// ══════════════════════════════════════════════════════════════════════════════
// ── MODALS ─────────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

const CATS = ['🍽️ Food','🍔 Fast Food','🚗 Transport','❤️ Health','🏠 Housing','💳 Debts','💰 Savings','🎮 Leisure','👕 Shopping','🔧 Other','✈️ Travel','🚬 Tabac'];
// Resolve active categories — uses custom list if configured
const getActiveCats = () => { try { const s=JSON.parse(localStorage.getItem('los_settings')||'{}'); return s.customCats?.length ? s.customCats : CATS; } catch { return CATS; } };


// ── SPLIT EXPENSE MODAL ───────────────────────────────────────────────────────
function SplitExpenseModal({ open, onClose, expense, onSave, cur }) {
  const [splits, setSplits] = useState([{ name:'', pct:50 }, { name:'', pct:50 }]);
  useEffect(() => { if (open) setSplits([{ name:'', pct:50 }, { name:'', pct:50 }]); }, [open]);
  const totalPct = splits.reduce((s,sp)=>s+Number(sp.pct||0),0);
  const ok = expense && Math.abs(totalPct-100)<0.1 && splits.every(sp=>sp.name.trim());
  const handleSave = () => {
    if (!ok) return;
    const parts = splits.map(sp=>({
      id: Date.now()+Math.random(),
      amount: +(Number(expense.amount||0)*sp.pct/100).toFixed(2),
      category: expense.category,
      note: `${expense.note||expense.category} — ${sp.name}`,
      date: expense.date,
      subcategory: expense.subcategory||'',
      splitOf: expense.id,
    }));
    onSave(parts);
  };
  const updateSplit = (i, key, val) => setSplits(p=>p.map((s,j)=>j===i?{...s,[key]:val}:s));
  const addSplit = () => setSplits(p=>[...p, { name:'', pct:0 }]);
  const removeSplit = (i) => setSplits(p=>p.filter((_,j)=>j!==i));
  return (
    <Modal open={open} onClose={onClose} title="✂️ Split Expense">
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {expense && <div style={{ fontSize:11, fontFamily:T.fM, color:T.textSub, padding:'8px 10px', borderRadius:T.r, background:T.surface }}>{expense.note||expense.category} · {cur}{fmtN(expense.amount)} · {expense.date}</div>}
        <div style={{ fontSize:10, fontFamily:T.fM, color:T.textSub }}>Split between people or categories. Total must equal 100%.</div>
        {splits.map((sp,i)=>(
          <div key={i} style={{ display:'flex', gap:8, alignItems:'center' }}>
            <input value={sp.name} onChange={e=>updateSplit(i,'name',e.target.value)} placeholder={`Split ${i+1} label`} style={{ flex:1, padding:'8px 10px', background:'rgba(255,255,255,0.04)', border:`1px solid ${T.border}`, borderRadius:T.r, fontFamily:T.fM, fontSize:12, color:T.text }} />
            <input type="number" value={sp.pct} onChange={e=>updateSplit(i,'pct',e.target.value)} min="1" max="99" style={{ width:65, padding:'8px 10px', background:'rgba(255,255,255,0.04)', border:`1px solid ${T.border}`, borderRadius:T.r, fontFamily:T.fM, fontSize:12, color:T.text, textAlign:'center' }} />
            <span style={{ fontSize:10, color:T.textSub, flexShrink:0 }}>%</span>
            {splits.length>2&&<button onClick={()=>removeSplit(i)} style={{ padding:'4px 6px', borderRadius:5, background:T.surface, border:`1px solid ${T.border}`, opacity:0.6 }}><IcoTrash size={10} stroke={T.rose} /></button>}
          </div>
        ))}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <button onClick={addSplit} style={{ fontSize:10, fontFamily:T.fM, color:T.accent }}>+ Add split</button>
          <span style={{ fontSize:10, fontFamily:T.fM, color:Math.abs(totalPct-100)<0.1?T.emerald:T.amber }}>Total: {totalPct.toFixed(0)}%</span>
        </div>
        <Btn full onClick={handleSave} color={T.sky} style={{ opacity:ok?1:0.4 }}>Split into {splits.length} entries</Btn>
      </div>
    </Modal>
  );
}

// ── RECEIPT SCANNER MODAL (AI OCR) ───────────────────────────────────────────
function ReceiptScannerModal({ open, onClose, onExpenseDetected, settings, currency }) {
  const apiKey = settings?.aiApiKey || '';
  const provider = settings?.aiProvider || 'claude';
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [imgPreview, setImgPreview] = useState(null);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food & Drink');
  const [note, setNote] = useState('');
  const [expDate, setExpDate] = useState(today());
  const fileRef = useRef();

  useEffect(() => { if (!open) { setResult(null); setError(''); setImgPreview(null); setAmount(''); setNote(''); setExpDate(today()); } }, [open]);

  const scan = async (file) => {
    if (!file) return;
    if (provider === 'ollama') { setError('Receipt Scanner requires a vision model. Switch to Anthropic or OpenAI in Settings → AI Provider.'); return; }
    if (!apiKey) { setError('Add your API key in Settings → AI Provider to use Receipt Scanner.'); return; }
    setScanning(true); setError(''); setResult(null);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const b64 = e.target.result.split(',')[1];
      setImgPreview(e.target.result);
      try {
        let text = '';
        if (provider === 'openai') {
          const res = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
            body: JSON.stringify({ model:'gpt-4o', max_tokens:400, messages:[{ role:'user', content:[
              { type:'image_url', image_url:{ url:`data:${file.type||'image/jpeg'};base64,${b64}` } },
              { type:'text', text:'Extract this receipt. Respond ONLY with valid JSON (no markdown): {"merchant":"","amount":0,"date":"YYYY-MM-DD","category":"Food & Drink","items":"short summary of items"}. Use today if date unclear. Category must be one of: Food & Drink, Transport, Shopping, Health, Entertainment, Utilities, Housing, Other.' }
            ]}] })
          });
          const d = await res.json();
          text = d.choices?.[0]?.message?.content || '';
        } else {
          // Anthropic (default)
          const res = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
            body: JSON.stringify({ model:'claude-sonnet-4-20250514', max_tokens:400, messages:[{ role:'user', content:[
              { type:'image', source:{ type:'base64', media_type:file.type||'image/jpeg', data:b64 } },
              { type:'text', text:'Extract this receipt. Respond ONLY with valid JSON (no markdown): {"merchant":"","amount":0,"date":"YYYY-MM-DD","category":"Food & Drink","items":"short summary of items"}. Use today if date unclear. Category must be one of: Food & Drink, Transport, Shopping, Health, Entertainment, Utilities, Housing, Other.' }
            ]}] })
          });
          const d = await res.json();
          text = d.content?.find(b=>b.type==='text')?.text || '';
        }
        const clean = text.replace(/```json?|```/g,'').trim();
        const parsed = JSON.parse(clean);
        setResult(parsed);
        setAmount(String(parsed.amount||''));
        setCategory(parsed.category||'Food & Drink');
        setNote(parsed.merchant ? `${parsed.merchant}${parsed.items?` — ${parsed.items}`:''}` : '');
        setExpDate(parsed.date||today());
      } catch(err) {
        setError('Could not parse receipt. Try a clearer photo.');
      } finally { setScanning(false); }
    };
    reader.readAsDataURL(file);
  };

  if (!open) return null;
  const cur = currency||'$';
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', zIndex:3000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ width:'100%', maxWidth:480, maxHeight:'90vh', overflowY:'auto', borderRadius:20, background:T.bg, border:`1px solid ${T.border}`, padding:'28px 30px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <h2 style={{ fontSize:18, fontFamily:T.fD, fontWeight:800, color:T.text }}>🧾 Receipt Scanner</h2>
          <button onClick={onClose} style={{ fontSize:20, color:T.textSub, background:'none', border:'none', cursor:'pointer' }}>×</button>
        </div>
        {!result && !scanning && (
          <div
            onClick={()=>fileRef.current?.click()}
            style={{ border:`2px dashed ${T.border}`, borderRadius:12, padding:40, textAlign:'center', cursor:'pointer', transition:'border-color 0.2s' }}
            onDragOver={e=>{e.preventDefault();}} onDrop={e=>{e.preventDefault();const f=e.dataTransfer.files[0];if(f)scan(f);}}>
            <div style={{ fontSize:40, marginBottom:12 }}>📷</div>
            <div style={{ fontSize:13, fontFamily:T.fD, fontWeight:600, color:T.text, marginBottom:6 }}>Snap or drop a receipt</div>
            <div style={{ fontSize:11, fontFamily:T.fM, color:T.textSub }}>AI will extract the amount, merchant, date and category automatically</div>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display:'none' }} onChange={e=>scan(e.target.files[0])} />
          </div>
        )}
        {scanning && (
          <div style={{ textAlign:'center', padding:40 }}>
            <div style={{ fontSize:36, marginBottom:12, animation:'spin 1.5s linear infinite' }}>🔍</div>
            <div style={{ fontSize:13, fontFamily:T.fD, fontWeight:600, color:T.accent }}>Scanning receipt…</div>
            <div style={{ fontSize:11, fontFamily:T.fM, color:T.textSub, marginTop:6 }}>AI is extracting merchant, amount, date & items</div>
          </div>
        )}
        {error && <div style={{ padding:'14px 16px', borderRadius:10, background:T.roseDim, border:`1px solid ${T.rose}44`, fontSize:12, fontFamily:T.fM, color:T.rose, marginBottom:16 }}>⚠️ {error}</div>}
        {result && !scanning && (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {imgPreview && <img src={imgPreview} alt="receipt" style={{ width:'100%', maxHeight:200, objectFit:'contain', borderRadius:10, border:`1px solid ${T.border}` }} />}
            <div style={{ padding:'12px 14px', borderRadius:10, background:`${T.emerald}10`, border:`1px solid ${T.emerald}33` }}>
              <div style={{ fontSize:10, fontFamily:T.fM, color:T.emerald, marginBottom:4 }}>✅ Receipt scanned — review & confirm</div>
              {result.merchant && <div style={{ fontSize:12, fontFamily:T.fD, fontWeight:600, color:T.text }}>{result.merchant}</div>}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              <div>
                <div style={{ fontSize:10, fontFamily:T.fM, color:T.textSub, marginBottom:4 }}>Amount ({cur})</div>
                <Input type="number" value={amount} onChange={e=>setAmount(e.target.value)} />
              </div>
              <div>
                <div style={{ fontSize:10, fontFamily:T.fM, color:T.textSub, marginBottom:4 }}>Date</div>
                <Input type="date" value={expDate} onChange={e=>setExpDate(e.target.value)} />
              </div>
            </div>
            <div>
              <div style={{ fontSize:10, fontFamily:T.fM, color:T.textSub, marginBottom:4 }}>Category</div>
              <Select value={category} onChange={e=>setCategory(e.target.value)}>
                {['Food & Drink','Transport','Shopping','Health','Entertainment','Utilities','Housing','Other'].map(c=><option key={c}>{c}</option>)}
              </Select>
            </div>
            <div>
              <div style={{ fontSize:10, fontFamily:T.fM, color:T.textSub, marginBottom:4 }}>Note</div>
              <Input value={note} onChange={e=>setNote(e.target.value)} placeholder="Merchant / items…" />
            </div>
            <div style={{ display:'flex', gap:8, marginTop:4 }}>
              <button onClick={()=>{setResult(null);setImgPreview(null);}} style={{ flex:1, padding:'10px', borderRadius:T.r, background:T.surface, border:`1px solid ${T.border}`, fontFamily:T.fM, fontSize:11, color:T.textSub, cursor:'pointer' }}>Rescan</button>
              <Btn onClick={()=>{ onExpenseDetected({ id:Date.now(), date:expDate, amount:Number(amount), category, note, source:'receipt' }); onClose(); }} color={T.accent} style={{ flex:2, padding:'10px 0' }}>✓ Add Expense</Btn>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function LogExpenseModal({ open, onClose, onSave }) {
  const [regret, setRegret] = useState(false);
  const [trigger, setTrigger] = useState('');   // friction log: what caused this
  const [subcategory, setSubcategory] = useState('');
  const [amt, setAmt] = useState(''); const [cat, setCat] = useState('🍽️ Food');
  const [note, setNote] = useState(''); const [date, setDate] = useState(today());
  const [recurring, setRecurring] = useState(false); const [frequency, setFrequency] = useState('monthly');

  useEffect(() => { if (!open) { setRegret(false); setTrigger(''); } }, [open]);

  const TRIGGERS = [
    { id:'boredom',   label:'😴 Boredom',         emoji:'😴' },
    { id:'stress',    label:'😰 Stress',           emoji:'😰' },
    { id:'social',    label:'👥 Social pressure',  emoji:'👥' },
    { id:'impulse',   label:'⚡ Impulse',           emoji:'⚡' },
    { id:'habit',     label:'🔁 Habit / routine',  emoji:'🔁' },
  ];

  const save = () => {
    if (!amt) return;
    onSave({ id:Date.now(), amount:Number(amt), category:cat, note, date, recurring, frequency:recurring?frequency:null, regret:!!regret, trigger:regret?trigger:'', subcategory:subcategory.trim() });
    setAmt(''); setNote(''); setRecurring(false); setRegret(false); setTrigger(''); setSubcategory(''); onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="💳 Log Expense">
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        <Input type="number" value={amt} onChange={e=>setAmt(e.target.value)} placeholder="Amount" />
        <Select value={cat} onChange={e=>setCat(e.target.value)}>{getActiveCats().map(c=><option key={c}>{c}</option>)}</Select>
        <Input value={note} onChange={e=>setNote(e.target.value)} placeholder="Note (optional)" />
        <Input type="date" value={date} onChange={e=>setDate(e.target.value)} />
        <Input value={subcategory} onChange={e=>setSubcategory(e.target.value)} placeholder="Subcategory (e.g. Groceries, Gym — optional)" />
        <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:11, fontFamily:T.fM, color:T.textSub, cursor:'pointer', padding:'4px 2px' }}>
          <input type="checkbox" checked={recurring} onChange={e=>setRecurring(e.target.checked)} style={{ accentColor:T.sky }} />
          <span>Recurring</span>
          {recurring && <Select value={frequency} onChange={e=>setFrequency(e.target.value)} style={{ marginLeft:4, padding:'2px 6px', fontSize:10 }}>{['weekly','bi-weekly','monthly','quarterly','yearly'].map(f=><option key={f}>{f}</option>)}</Select>}
        </label>
        <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:11, fontFamily:T.fM, color:T.rose, cursor:'pointer', padding:'4px 2px' }}>
          <input type="checkbox" checked={regret} onChange={e=>setRegret(e.target.checked)} style={{ accentColor:T.rose }} />
          <span>🤦 Regret this purchase</span>
        </label>
        {/* Friction log — surfaces only when regret is checked */}
        {regret && (
          <div style={{ padding:'12px 14px', borderRadius:T.r, background:T.roseDim, border:`1px solid ${T.rose}33`, animation:'slideDown 0.15s ease' }}>
            <div style={{ fontSize:9, fontFamily:T.fM, color:T.rose, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:8, fontWeight:700 }}>
              What triggered this? <span style={{ color:T.textMuted, fontWeight:400 }}>(optional — builds your spending pattern)</span>
            </div>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {TRIGGERS.map(t => (
                <button key={t.id} onClick={()=>setTrigger(prev=>prev===t.id?'':t.id)}
                  style={{ padding:'5px 12px', borderRadius:99, fontSize:10, fontFamily:T.fM, cursor:'pointer', transition:'all 0.12s', background:trigger===t.id?T.rose+'22':T.surface, color:trigger===t.id?T.rose:T.textSub, border:`1px solid ${trigger===t.id?T.rose+'55':T.border}` }}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        )}
        <Btn full onClick={save} color={T.rose}>{t('save')}</Btn>
      </div>
    </Modal>
  );
}

function EditIncomeModal({ open, onClose, income, onSave }) {
  const [amt, setAmt] = useState(''); const [note, setNote] = useState(''); const [date, setDate] = useState(today());
  const [recurring, setRecurring] = useState(false); const [frequency, setFrequency] = useState('monthly');
  useEffect(() => { if (income && open) { setAmt(String(income.amount||'')); setNote(income.note||''); setDate(income.date||today()); setRecurring(income.recurring||false); setFrequency(income.frequency||'monthly'); } }, [income, open]);
  const save = () => { if (!amt) return; onSave(income.id, { amount:Number(amt), note, date, recurring, frequency:recurring?frequency:null }); onClose(); };
  return (
    <Modal open={open} onClose={onClose} title="✏️ Edit Income">
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        <Input type="number" value={amt} onChange={e=>setAmt(e.target.value)} placeholder="Amount" />
        <Input value={note} onChange={e=>setNote(e.target.value)} placeholder="Source (Salary, Freelance...)" />
        <Input type="date" value={date} onChange={e=>setDate(e.target.value)} />
        <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:12, fontFamily:T.fM, color:T.text, cursor:'pointer', padding:'8px 10px', borderRadius:T.r, background:T.surface, border:`1px solid ${T.border}` }}>
          <input type="checkbox" checked={recurring} onChange={e=>setRecurring(e.target.checked)} />
          <span>Recurring income</span>
          {recurring && <Select value={frequency} onChange={e=>setFrequency(e.target.value)} style={{ marginLeft:8, padding:'2px 6px' }}>{['weekly','bi-weekly','monthly','quarterly','yearly'].map(f=><option key={f}>{f}</option>)}</Select>}
        </label>
        <Btn full onClick={save} color={T.emerald}>Save Changes</Btn>
      </div>
    </Modal>
  );
}

function LogIncomeModal({ open, onClose, onSave }) {
  const [amt, setAmt] = useState(''); const [note, setNote] = useState(''); const [date, setDate] = useState(today());
  const [recurring, setRecurring] = useState(false); const [frequency, setFrequency] = useState('monthly');
  const save = () => { if (!amt) return; onSave({ id:Date.now(), amount:Number(amt), note, date, recurring, frequency:recurring?frequency:null }); setAmt(''); setNote(''); setRecurring(false); onClose(); };
  return (
    <Modal open={open} onClose={onClose} title="💰 Log Income">
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        <Input type="number" value={amt} onChange={e=>setAmt(e.target.value)} placeholder="Amount" />
        <Input value={note} onChange={e=>setNote(e.target.value)} placeholder="Source (Salary, Freelance...)" />
        <Input type="date" value={date} onChange={e=>setDate(e.target.value)} />
        <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:12, fontFamily:T.fM, color:T.text, cursor:'pointer', padding:'8px 10px', borderRadius:T.r, background:T.surface, border:`1px solid ${T.border}` }}>
          <input type="checkbox" checked={recurring} onChange={e=>setRecurring(e.target.checked)} />
          <span>Recurring income</span>
          {recurring && <Select value={frequency} onChange={e=>setFrequency(e.target.value)} style={{ marginLeft:8, padding:'2px 6px' }}>{['weekly','bi-weekly','monthly','quarterly','yearly'].map(f=><option key={f}>{f}</option>)}</Select>}
        </label>
        <Btn full onClick={save} color={T.emerald}>Save Income</Btn>
      </div>
    </Modal>
  );
}

function LogHabitModal({ open, onClose, habits, habitLogs, onLog, onAddHabit }) {
  const [newName, setNewName] = useState(''); const [newEmoji, setNewEmoji] = useState('🔥'); const [newFreq, setNewFreq] = useState('daily'); const [newCat, setNewCat] = useState('');
  const [selectedDate, setSelectedDate] = useState(today());

  // Reset date to today when modal opens
  React.useEffect(() => { if (open) setSelectedDate(today()); }, [open]);

  const isToday = selectedDate === today();

  // Build last 30 days for the mini calendar picker
  const dateOptions = React.useMemo(() => {
    const opts = [];
    for (let i = 0; i < 30; i++) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const ds = d.toISOString().slice(0, 10);
      const label = i === 0 ? 'Today' : i === 1 ? 'Yesterday' : d.toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' });
      opts.push({ value: ds, label });
    }
    return opts;
  }, []);

  return (
    <Modal open={open} onClose={onClose} title="🔥 Log Habit">
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>

        {/* ── Date picker ──────────────────────────────────────────────── */}
        <div style={{ padding:'10px 12px', borderRadius:T.r, background:T.surface, border:`1px solid ${isToday ? T.border : T.amber+'55'}` }}>
          <div style={{ fontSize:9, fontFamily:T.fM, color: isToday ? T.textSub : T.amber, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:6, fontWeight: isToday ? 400 : 700 }}>
            {isToday ? '📅 Logging for today' : `📅 Backfilling — ${new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday:'long', month:'short', day:'numeric' })}`}
          </div>
          <select
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            style={{ width:'100%', padding:'7px 10px', background:'rgba(255,255,255,0.05)', border:`1px solid ${T.border}`, borderRadius:T.r, fontFamily:T.fM, fontSize:12, color:T.text, cursor:'pointer' }}
          >
            {dateOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label} — {opt.value}</option>
            ))}
          </select>
        </div>

        {/* ── Habit list ───────────────────────────────────────────────── */}
        {(habits||[]).length === 0 && <div style={{ fontSize:12, fontFamily:T.fM, color:T.textSub, textAlign:'center', padding:16 }}>No habits yet. Create your first one below.</div>}
        {(habits||[]).map(h => {
          const done = (habitLogs[h.id]||[]).includes(selectedDate);
          const streak = getStreak(h.id, habitLogs);
          return (
            <div key={h.id} className="los-row" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 12px', borderRadius:T.r, background:done?T.accentDim:T.surface, border:`1px solid ${done?T.accent+'33':T.border}`, transition:'all 0.15s' }}>
              <div>
                <div style={{ fontSize:12, fontFamily:T.fD, fontWeight:600, color:T.text }}>{h.emoji ? h.emoji + ' ' : ''}{h.name}</div>
                <div style={{ fontSize:10, fontFamily:T.fM, color:T.textSub, marginTop:2 }}>🔥 {streak} day streak</div>
              </div>
              {done
                ? <Badge color={T.accent}>✓ Done</Badge>
                : <Btn onClick={()=>onLog(h.id, selectedDate)} color={isToday ? T.accent : T.amber} style={{ padding:'5px 14px' }}>{isToday ? 'Log' : 'Backfill'}</Btn>
              }
            </div>
          );
        })}

        {/* ── Create new habit ─────────────────────────────────────────── */}
        <div style={{ marginTop:8, display:'flex', flexDirection:'column', gap:8, padding:'10px', borderRadius:T.r, background:T.accentLo, border:`1px solid ${T.accent}22` }}>
          <div style={{ fontSize:9, fontFamily:T.fM, color:T.textSub, letterSpacing:'0.08em' }}>CREATE NEW HABIT</div>
          <Input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="Habit name…" onKeyDown={e=>e.key==='Enter'&&newName.trim()&&(onAddHabit(newName.trim(),{emoji:newEmoji,frequency:newFreq,category:newCat}),setNewName(''))} />
          <div style={{ display:'grid', gridTemplateColumns:'60px 1fr 1fr', gap:6 }}>
            <Input value={newEmoji} onChange={e=>setNewEmoji(e.target.value)} style={{ textAlign:'center', fontSize:18 }} placeholder="🔥" />
            <Select value={newFreq} onChange={e=>setNewFreq(e.target.value)}>{['daily','weekdays','3x week','weekly'].map(f=><option key={f}>{f}</option>)}</Select>
            <Select value={newCat} onChange={e=>setNewCat(e.target.value)}>{['','Mind','Body','Finance','Social','Learning','Health'].map(c=><option key={c} value={c}>{c||'No category'}</option>)}</Select>
          </div>
          <Btn onClick={()=>{ if(newName.trim()){ onAddHabit(newName.trim(),{emoji:newEmoji,frequency:newFreq,category:newCat}); setNewName(''); }}} color={T.accent} full>+ Add Habit</Btn>
        </div>
      </div>
    </Modal>
  );
}

// S3 — Sleep Quality Stars
function SleepStars({ value, onChange, size=18 }) {
  const [hov, setHov] = useState(0);
  const labels = ['', 'Terrible', 'Poor', 'Fair', 'Good', 'Excellent'];
  return (
    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
      {[1,2,3,4,5].map(n => (
        <button key={n} onMouseEnter={()=>setHov(n)} onMouseLeave={()=>setHov(0)} onClick={()=>onChange(n)} style={{ padding:1, background:'none', fontSize:size, lineHeight:1, filter:((hov||value)>=n)?'none':'grayscale(1) opacity(0.25)', transition:'filter 0.1s, transform 0.1s', transform:((hov||value)>=n)?'scale(1.15)':'scale(1)' }}>⭐</button>
      ))}
      {(hov||value) > 0 && <span style={{ fontSize:10, fontFamily:T.fM, color:T.textSub, marginLeft:4 }}>{labels[hov||value]}</span>}
    </div>
  );
}

function LogVitalsModal({ open, onClose, onSave, existingDates=[], weightUnit='lbs' }) {
  const [sleep, setSleep] = useState(''); const [sleepQuality, setSleepQuality] = useState(0);
  const [mood, setMood] = useState(''); const [energy, setEnergy] = useState('');
  const [weight, setWeight] = useState(''); const [steps, setSteps] = useState('');
  const [note, setNote] = useState(''); const [date, setDate] = useState(today());
  const alreadyLogged = existingDates.includes(date) && date === today();
  const save = () => {
    onSave({ id:Date.now(), date, sleep:Number(sleep)||0, sleepQuality, mood:Number(mood)||0, energy:Number(energy)||0, weight:Number(weight)||0, steps:Number(steps)||0, note });
    setSleep(''); setSleepQuality(0); setMood(''); setEnergy(''); setWeight(''); setSteps(''); setNote(''); setDate(today()); onClose();
  };
  return (
    <Modal open={open} onClose={onClose} title="❤️ Log Vitals">
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        <div>
          <div style={{ fontSize:10, fontFamily:T.fM, color:T.textSub, marginBottom:4 }}>Date</div>
          <Input type="date" value={date} onChange={e=>setDate(e.target.value)} />
          {existingDates.includes(date) && <div style={{ fontSize:10, fontFamily:T.fM, color:T.amber, marginTop:4 }}>⚠ Existing entry for this date will be overwritten</div>}
        </div>
        <div>
          <div style={{ fontSize:10, fontFamily:T.fM, color:T.textSub, marginBottom:6 }}>Sleep hours</div>
          <Input type="number" value={sleep} onChange={e=>setSleep(e.target.value)} placeholder="e.g. 7.5" />
        </div>
        <div>
          <div style={{ fontSize:10, fontFamily:T.fM, color:T.textSub, marginBottom:6 }}>Sleep quality</div>
          <SleepStars value={sleepQuality} onChange={setSleepQuality} />
        </div>
        <Input type="number" value={mood} onChange={e=>setMood(e.target.value)} placeholder="Mood (1–10)" />
        <Input type="number" value={energy} onChange={e=>setEnergy(e.target.value)} placeholder="Energy (1–10)" />
        <Input type="number" value={weight} onChange={e=>setWeight(e.target.value)} placeholder={`Weight (${weightUnit}, optional)`} />
        <Input type="number" value={steps} onChange={e=>setSteps(e.target.value)} placeholder="Steps today (optional)" />
        <Input value={note} onChange={e=>setNote(e.target.value)} placeholder="Note (optional)" />
        <Btn full onClick={save} color={T.sky}>Save Vitals</Btn>
      </div>
    </Modal>
  );
}

function EditVitalsModal({ open, onClose, vitals, onSave, weightUnit='lbs' }) {
  const [sleep, setSleep] = useState(''); const [sleepQuality, setSleepQuality] = useState(0);
  const [mood, setMood] = useState(''); const [energy, setEnergy] = useState('');
  const [weight, setWeight] = useState(''); const [steps, setSteps] = useState('');
  const [note, setNote] = useState(''); const [date, setDate] = useState('');
  useEffect(() => { if (vitals && open) { setSleep(String(vitals.sleep||'')); setSleepQuality(vitals.sleepQuality||0); setMood(String(vitals.mood||'')); setEnergy(String(vitals.energy||'')); setWeight(String(vitals.weight||'')); setSteps(String(vitals.steps||'')); setNote(vitals.note||''); setDate(vitals.date||today()); } }, [vitals, open]);
  const save = () => { onSave(vitals.id, { date, sleep:Number(sleep)||0, sleepQuality, mood:Number(mood)||0, energy:Number(energy)||0, weight:Number(weight)||0, steps:Number(steps)||0, note }); onClose(); };
  return (
    <Modal open={open} onClose={onClose} title="✏️ Edit Vitals">
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        <div>
          <div style={{ fontSize:10, fontFamily:T.fM, color:T.textSub, marginBottom:4 }}>Date</div>
          <Input type="date" value={date} onChange={e=>setDate(e.target.value)} />
        </div>
        <div>
          <div style={{ fontSize:10, fontFamily:T.fM, color:T.textSub, marginBottom:6 }}>Sleep hours</div>
          <Input type="number" value={sleep} onChange={e=>setSleep(e.target.value)} placeholder="e.g. 7.5" />
        </div>
        <div>
          <div style={{ fontSize:10, fontFamily:T.fM, color:T.textSub, marginBottom:6 }}>Sleep quality</div>
          <SleepStars value={sleepQuality} onChange={setSleepQuality} />
        </div>
        <Input type="number" value={mood} onChange={e=>setMood(e.target.value)} placeholder="Mood (1–10)" />
        <Input type="number" value={energy} onChange={e=>setEnergy(e.target.value)} placeholder="Energy (1–10)" />
        <Input type="number" value={weight} onChange={e=>setWeight(e.target.value)} placeholder={`Weight (${weightUnit}, optional)`} />
        <Input type="number" value={steps} onChange={e=>setSteps(e.target.value)} placeholder="Steps today (optional)" />
        <Input value={note} onChange={e=>setNote(e.target.value)} placeholder="Note (optional)" />
        <Btn full onClick={save} color={T.sky}>Save Changes</Btn>
      </div>
    </Modal>
  );
}

function AddNoteModal({ open, onClose, onSave }) {
  const [title, setTitle] = useState(''); const [body, setBody] = useState(''); const [tag, setTag] = useState('General');
  const [type, setType] = useState('note'); const [priority, setPriority] = useState(2); const [dueDate, setDueDate] = useState('');
  const save = () => {
    if (!title.trim()) return;
    onSave({ id:Date.now(), title:title.trim(), body:body.trim(), tag, type, priority, dueDate, date:today(), archived:false });
    setTitle(''); setBody(''); setTag('General'); setType('note'); setPriority(2); setDueDate(''); onClose();
  };
  return (
    <Modal open={open} onClose={onClose} title="📝 New Note">
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          <Select value={type} onChange={e=>setType(e.target.value)}>{['note','task','idea','bookmark'].map(t=><option key={t}>{t}</option>)}</Select>
          <Select value={tag} onChange={e=>setTag(e.target.value)}>{['General','Finance','Health','Career','Growth','Ideas'].map(t=><option key={t}>{t}</option>)}</Select>
        </div>
        <Input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Title" />
        <textarea value={body} onChange={e=>setBody(e.target.value)} placeholder="Content..." rows={3} style={{ width:'100%', padding:'9px 12px', background:'rgba(255,255,255,0.04)', border:`1px solid ${T.border}`, borderRadius:T.r, fontFamily:T.fM, fontSize:12, color:T.text, resize:'vertical' }} />
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <div style={{ fontSize:11, fontFamily:T.fM, color:T.textSub, flexShrink:0 }}>Priority:</div>
          {[1,2,3].map(p=><button key={p} onClick={()=>setPriority(p)} style={{ padding:'4px 12px', borderRadius:99, fontSize:10, fontFamily:T.fM, background:priority===p?[T.rose,T.amber,T.sky][p-1]+'33':'transparent', color:priority===p?[T.rose,T.amber,T.sky][p-1]:T.textSub, border:`1px solid ${priority===p?[T.rose,T.amber,T.sky][p-1]+'55':T.border}` }}>{['🔴 High','🟡 Med','🔵 Low'][p-1]}</button>)}
        </div>
        {type==='task' && <Input type="date" value={dueDate} onChange={e=>setDueDate(e.target.value)} placeholder="Due date (tasks)" />}
        <Btn full onClick={save} color={T.amber}>Save {type.charAt(0).toUpperCase()+type.slice(1)}</Btn>
      </div>
    </Modal>
  );
}

function AddGoalModal({ open, onClose, onSave }) {
  const [name, setName] = useState(''); const [target, setTarget] = useState('');
  const [cat, setCat] = useState('finance'); const [deadline, setDeadline] = useState('');
  const [useMilestones, setUseMilestones] = useState(true);
  const DEFAULT_MILESTONES = [{ label:'25%', pct:25 }, { label:'50%', pct:50 }, { label:'75%', pct:75 }];
  const save = () => {
    if (!name.trim() || !target) return;
    const emojiMap = { finance:'💰', health:'🏃', growth:'🎓', career:'💼', other:'🎯' };
    onSave({ id:Date.now(), name:name.trim(), target:Number(target), current:0, cat, deadline, emoji:emojiMap[cat]||'🎯', color:T.accent, milestones:useMilestones?DEFAULT_MILESTONES:[] });
    setName(''); setTarget(''); onClose();
  };
  return (
    <Modal open={open} onClose={onClose} title="🎯 New Goal">
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        <Input value={name} onChange={e=>setName(e.target.value)} placeholder="Goal name" />
        <Input type="number" value={target} onChange={e=>setTarget(e.target.value)} placeholder="Target amount / value" />
        <Select value={cat} onChange={e=>setCat(e.target.value)}>{['finance','health','growth','career','other'].map(c=><option key={c}>{c}</option>)}</Select>
        <Input type="date" value={deadline} onChange={e=>setDeadline(e.target.value)} placeholder="Deadline (optional)" />
        <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:12, fontFamily:T.fM, color:T.text, cursor:'pointer', padding:'8px 10px', borderRadius:T.r, background:T.surface, border:`1px solid ${T.border}` }}>
          <input type="checkbox" checked={useMilestones} onChange={e=>setUseMilestones(e.target.checked)} />
          <span>Add milestone checkpoints <span style={{ color:T.textSub, fontSize:10 }}>(25%, 50%, 75%)</span></span>
        </label>
        <Btn full onClick={save} color={T.amber}>Create Goal</Btn>
      </div>
    </Modal>
  );
}

function AddAssetModal({ open, onClose, onSave }) {
  const [name, setName] = useState(''); const [val, setVal] = useState(''); const [type, setType] = useState('Cash');
  const save = () => { if (!name || !val) return; onSave({ id:Date.now(), name:name.trim(), value:Number(val), type }); setName(''); setVal(''); onClose(); };
  return (
    <Modal open={open} onClose={onClose} title="💎 Add Asset">
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        <Input value={name} onChange={e=>setName(e.target.value)} placeholder="Asset name (e.g. Savings Account)" />
        <Input type="number" value={val} onChange={e=>setVal(e.target.value)} placeholder="Current value" />
        <Select value={type} onChange={e=>setType(e.target.value)}>{['Cash','Real Estate','Vehicle','Crypto','Other'].map(t=><option key={t}>{t}</option>)}</Select>
        <Btn full onClick={save} color={T.accent}>Add Asset</Btn>
      </div>
    </Modal>
  );
}

// Phase 3 — Add Debt Modal
function AddDebtModal({ open, onClose, onSave }) {
  const [name, setName] = useState(''); const [balance, setBalance] = useState('');
  const [rate, setRate] = useState(''); const [minPayment, setMinPayment] = useState('');
  const [type, setType] = useState('Credit Card');
  const save = () => {
    if (!name.trim() || !balance) return;
    onSave({ id:Date.now(), name:name.trim(), balance:Number(balance), originalBalance:Number(balance), rate:Number(rate)||0, minPayment:Number(minPayment)||0, type, createdAt:today() });
    setName(''); setBalance(''); setRate(''); setMinPayment(''); onClose();
  };
  return (
    <Modal open={open} onClose={onClose} title="⚠️ Add Debt">
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        <Input value={name} onChange={e=>setName(e.target.value)} placeholder="Debt name (e.g. Visa Card, Student Loan)" />
        <Select value={type} onChange={e=>setType(e.target.value)}>{['Credit Card','Student Loan','Car Loan','Mortgage','Personal Loan','Medical','Other'].map(t=><option key={t}>{t}</option>)}</Select>
        <Input type="number" value={balance} onChange={e=>setBalance(e.target.value)} placeholder="Current balance" />
        <Input type="number" value={rate} onChange={e=>setRate(e.target.value)} placeholder="Interest rate (APR %)" />
        <Input type="number" value={minPayment} onChange={e=>setMinPayment(e.target.value)} placeholder="Minimum monthly payment" />
        <Btn full onClick={save} color={T.rose}>Add Debt</Btn>
      </div>
    </Modal>
  );
}

// Phase 3 — Log Debt Payment Modal
function LogDebtPaymentModal({ open, onClose, debts, onPay }) {
  const [debtId, setDebtId] = useState('');
  const [amount, setAmount] = useState('');
  const save = () => {
    const debt = (debts||[]).find(d => String(d.id) === String(debtId));
    if (!debt || !amount) return;
    onPay(debt.id, Number(amount));
    setAmount(''); onClose();
  };
  useEffect(() => { if (open && (debts||[]).length > 0) setDebtId(String(debts[0].id)); }, [open, debts]);
  return (
    <Modal open={open} onClose={onClose} title="💸 Log Debt Payment">
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {(debts||[]).length === 0 ? (
          <div style={{ fontSize:12, fontFamily:T.fM, color:T.textSub, textAlign:'center', padding:20 }}>No debts tracked yet.</div>
        ) : (<>
          <Select value={debtId} onChange={e=>setDebtId(e.target.value)}>{(debts||[]).map(d=><option key={d.id} value={d.id}>{d.name} — ${fmtN(d.balance)} remaining</option>)}</Select>
          <Input type="number" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="Payment amount" />
          <Btn full onClick={save} color={T.emerald}>Record Payment</Btn>
        </>)}
      </div>
    </Modal>
  );
}

// Phase 4 — Add Investment Modal
function AddInvestmentModal({ open, onClose, onSave }) {
  const [thesis, setThesis] = useState('');
  const [symbol, setSymbol] = useState(''); const [name, setName] = useState('');
  const [qty, setQty] = useState(''); const [buyPrice, setBuyPrice] = useState('');
  const [currentPrice, setCurrentPrice] = useState(''); const [type, setType] = useState('Stock');
  const [date, setDate] = useState(today()); const [notes, setNotes] = useState('');
  const save = () => {
    if (!qty || !buyPrice) return;
    onSave({ id:Date.now(), symbol:symbol.trim().toUpperCase(), name:name.trim()||symbol.trim(), quantity:Number(qty), buyPrice:Number(buyPrice), currentPrice:Number(currentPrice)||Number(buyPrice), type, date, notes:notes.trim(), thesis:thesis.trim() });
    setSymbol(''); setName(''); setQty(''); setBuyPrice(''); setCurrentPrice(''); setNotes(''); setThesis(''); onClose();
  };
  return (
    <Modal open={open} onClose={onClose} title="📈 Add Investment">
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        <Select value={type} onChange={e=>setType(e.target.value)}>{['Stock','ETF','Crypto','Bond','REIT','Commodity','Real Estate','Other'].map(t=><option key={t}>{t}</option>)}</Select>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          <Input value={symbol} onChange={e=>setSymbol(e.target.value)} placeholder="Ticker (e.g. AAPL)" />
          <Input value={name} onChange={e=>setName(e.target.value)} placeholder="Full name (optional)" />
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
          <Input type="number" value={qty} onChange={e=>setQty(e.target.value)} placeholder="Quantity" />
          <Input type="number" value={buyPrice} onChange={e=>setBuyPrice(e.target.value)} placeholder="Buy price" />
          <Input type="number" value={currentPrice} onChange={e=>setCurrentPrice(e.target.value)} placeholder="Current price" />
        </div>
        <Input type="date" value={date} onChange={e=>setDate(e.target.value)} />
        <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Investment thesis / notes (optional)" rows={2} style={{ width:'100%', padding:'9px 12px', background:'rgba(255,255,255,0.04)', border:`1px solid ${T.border}`, borderRadius:T.r, fontFamily:T.fM, fontSize:12, color:T.text, resize:'vertical' }} />
        <Btn full onClick={save} color={T.violet}>Add Position</Btn>
      </div>
    </Modal>
  );
}

// Phase 2 — Add Subscription Modal
function EditSubscriptionModal({ open, onClose, sub, onSave }) {
  const [name, setName] = useState(''); const [amount, setAmount] = useState('');
  const [cycle, setCycle] = useState('monthly'); const [category, setCategory] = useState('Entertainment');
  const [nextDate, setNextDate] = useState(today()); const [emoji, setEmoji] = useState('📺');
  useEffect(() => { if (sub && open) { setName(sub.name||''); setAmount(String(sub.amount||'')); setCycle(sub.cycle||'monthly'); setCategory(sub.category||'Entertainment'); setNextDate(sub.nextDate||today()); setEmoji(sub.emoji||'📺'); } }, [sub, open]);
  const save = () => { if (!name.trim() || !amount) return; onSave(sub.id, { name:name.trim(), amount:Number(amount), cycle, category, nextDate, emoji }); onClose(); };
  return (
    <Modal open={open} onClose={onClose} title="✏️ Edit Subscription">
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        <div style={{ display:'grid', gridTemplateColumns:'48px 1fr', gap:8 }}>
          <Input value={emoji} onChange={e=>setEmoji(e.target.value)} style={{ textAlign:'center', fontSize:18 }} />
          <Input value={name} onChange={e=>setName(e.target.value)} placeholder="Service name" />
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          <Input type="number" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="Amount" />
          <Select value={cycle} onChange={e=>setCycle(e.target.value)}>{['monthly','yearly','weekly'].map(c=><option key={c}>{c}</option>)}</Select>
        </div>
        <Select value={category} onChange={e=>setCategory(e.target.value)}>{['Entertainment','Software','Health','Finance','Education','Shopping','Other'].map(c=><option key={c}>{c}</option>)}</Select>
        <div>
          <div style={{ fontSize:10, fontFamily:T.fM, color:T.textSub, marginBottom:4 }}>Next billing date</div>
          <Input type="date" value={nextDate} onChange={e=>setNextDate(e.target.value)} />
        </div>
        <Btn full onClick={save} color={T.sky}>Save Changes</Btn>
      </div>
    </Modal>
  );
}

function EditBillModal({ open, onClose, bill, onSave }) {
  const [name, setName] = useState(''); const [amount, setAmount] = useState('');
  const [dueDay, setDueDay] = useState('1'); const [category, setCategory] = useState('Utilities');
  const [emoji, setEmoji] = useState('🧾'); const [autoPay, setAutoPay] = useState(false);
  const [nextDate, setNextDate] = useState(today());
  useEffect(() => { if (bill && open) { setName(bill.name||''); setAmount(String(bill.amount||'')); setDueDay(String(bill.dueDay||1)); setCategory(bill.category||'Utilities'); setEmoji(bill.emoji||'🧾'); setAutoPay(bill.autoPay||false); setNextDate(bill.nextDate||today()); } }, [bill, open]);
  const save = () => { if (!name.trim() || !amount) return; onSave(bill.id, { name:name.trim(), amount:Number(amount), dueDay:Number(dueDay), category, emoji, autoPay, nextDate }); onClose(); };
  return (
    <Modal open={open} onClose={onClose} title="✏️ Edit Bill">
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        <div style={{ display:'grid', gridTemplateColumns:'48px 1fr', gap:8 }}>
          <Input value={emoji} onChange={e=>setEmoji(e.target.value)} style={{ textAlign:'center', fontSize:18 }} />
          <Input value={name} onChange={e=>setName(e.target.value)} placeholder="Bill name" />
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          <Input type="number" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="Amount" />
          <Input type="number" value={dueDay} onChange={e=>setDueDay(e.target.value)} placeholder="Due day (1-31)" min="1" max="31" />
        </div>
        <Select value={category} onChange={e=>setCategory(e.target.value)}>{['Utilities','Rent/Mortgage','Insurance','Phone','Internet','Transportation','Other'].map(c=><option key={c}>{c}</option>)}</Select>
        <div>
          <div style={{ fontSize:10, fontFamily:T.fM, color:T.textSub, marginBottom:4 }}>Next due date</div>
          <Input type="date" value={nextDate} onChange={e=>setNextDate(e.target.value)} />
        </div>
        <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:12, fontFamily:T.fM, color:T.text, cursor:'pointer' }}>
          <input type="checkbox" checked={autoPay} onChange={e=>setAutoPay(e.target.checked)} /> Auto-pay enabled
        </label>
        <Btn full onClick={save} color={T.sky}>Save Changes</Btn>
      </div>
    </Modal>
  );
}

function AddSubscriptionModal({ open, onClose, onSave }) {
  const [name, setName] = useState(''); const [amount, setAmount] = useState('');
  const [cycle, setCycle] = useState('monthly'); const [category, setCategory] = useState('Entertainment');
  const [nextDate, setNextDate] = useState(today()); const [emoji, setEmoji] = useState('📺');
  const save = () => {
    if (!name.trim() || !amount) return;
    onSave({ id:Date.now(), name:name.trim(), amount:Number(amount), cycle, category, nextDate, emoji, createdAt:today() });
    setName(''); setAmount(''); onClose();
  };
  return (
    <Modal open={open} onClose={onClose} title="🔄 Add Subscription">
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        <div style={{ display:'grid', gridTemplateColumns:'48px 1fr', gap:8 }}>
          <Input value={emoji} onChange={e=>setEmoji(e.target.value)} style={{ textAlign:'center', fontSize:18 }} />
          <Input value={name} onChange={e=>setName(e.target.value)} placeholder="Service name (e.g. Netflix)" />
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          <Input type="number" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="Amount" />
          <Select value={cycle} onChange={e=>setCycle(e.target.value)}>{['monthly','yearly','weekly'].map(c=><option key={c}>{c}</option>)}</Select>
        </div>
        <Select value={category} onChange={e=>setCategory(e.target.value)}>{['Entertainment','Software','Health','Finance','Education','Shopping','Other'].map(c=><option key={c}>{c}</option>)}</Select>
        <Input type="date" value={nextDate} onChange={e=>setNextDate(e.target.value)} placeholder="Next billing date" />
        <Btn full onClick={save} color={T.sky}>Add Subscription</Btn>
      </div>
    </Modal>
  );
}

// Phase 2 — Budget Setup Modal
function BudgetModal({ open, onClose, budgets, onSave }) {
  const [local, setLocal] = useState({});
  useEffect(() => { if (open) setLocal({...budgets}); }, [open, budgets]);
  return (
    <Modal open={open} onClose={onClose} title="📊 Monthly Budgets">
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        <div style={{ fontSize:11, fontFamily:T.fM, color:T.textSub, marginBottom:4 }}>Set spending limits per category</div>
        {getActiveCats().map(cat => (
          <div key={cat} style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontSize:12, fontFamily:T.fM, color:T.text, minWidth:140 }}>{cat}</span>
            <Input type="number" value={local[cat]||''} onChange={e=>setLocal(p=>({...p,[cat]:e.target.value}))} placeholder="No limit" style={{ flex:1 }} />
          </div>
        ))}
        <Btn full onClick={()=>{ onSave(Object.fromEntries(Object.entries(local).filter(([,v])=>v))); onClose(); }} color={T.accent} style={{ marginTop:8 }}>Save Budgets</Btn>
      </div>
    </Modal>
  );
}

// S1 — Edit Expense Modal
function EditExpenseModal({ open, onClose, expense, onSave }) {
  const [amt, setAmt] = useState(''); const [cat, setCat] = useState('🍽️ Food');
  const [note, setNote] = useState(''); const [date, setDate] = useState(today());
  useEffect(() => { if (expense && open) { setAmt(String(expense.amount||'')); setCat(expense.category||'🍽️ Food'); setNote(expense.note||''); setDate(expense.date||today()); } }, [expense, open]);
  const save = () => { if (!amt) return; onSave(expense.id, { amount:Number(amt), category:cat, note, date }); onClose(); };
  return (
    <Modal open={open} onClose={onClose} title="✏️ Edit Expense">
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        <Input type="number" value={amt} onChange={e=>setAmt(e.target.value)} placeholder="Amount" />
        <Select value={cat} onChange={e=>setCat(e.target.value)}>{getActiveCats().map(c=><option key={c}>{c}</option>)}</Select>
      </div>
    </Modal>
  );
}

// S1 — Edit Debt Modal
function EditDebtModal({ open, onClose, debt, onSave }) {
  const [name, setName] = useState(''); const [balance, setBalance] = useState('');
  const [rate, setRate] = useState(''); const [minPayment, setMinPayment] = useState('');
  const [type, setType] = useState('Credit Card');
  useEffect(() => { if (debt && open) { setName(debt.name||''); setBalance(String(debt.balance||'')); setRate(String(debt.rate||'')); setMinPayment(String(debt.minPayment||'')); setType(debt.type||'Credit Card'); } }, [debt, open]);
  const save = () => { if (!name.trim() || !balance) return; onSave(debt.id, { name:name.trim(), balance:Number(balance), rate:Number(rate)||0, minPayment:Number(minPayment)||0, type }); onClose(); };
  return (
    <Modal open={open} onClose={onClose} title="✏️ Edit Debt">
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        <Input value={name} onChange={e=>setName(e.target.value)} placeholder="Debt name" />
        <Select value={type} onChange={e=>setType(e.target.value)}>{['Credit Card','Student Loan','Car Loan','Mortgage','Personal Loan','Medical','Other'].map(t=><option key={t}>{t}</option>)}</Select>
        <Input type="number" value={balance} onChange={e=>setBalance(e.target.value)} placeholder="Current balance" />
        <Input type="number" value={rate} onChange={e=>setRate(e.target.value)} placeholder="Interest rate (APR %)" />
        <Input type="number" value={minPayment} onChange={e=>setMinPayment(e.target.value)} placeholder="Minimum monthly payment" />
        <Btn full onClick={save} color={T.rose}>Save Changes</Btn>
      </div>
    </Modal>
  );
}

// S1 — Add Bill Modal
function AddBillModal({ open, onClose, onSave }) {
  const [name, setName] = useState(''); const [amount, setAmount] = useState('');
  const [dueDay, setDueDay] = useState('1'); const [category, setCategory] = useState('Utilities');
  const [emoji, setEmoji] = useState('🧾'); const [autoPay, setAutoPay] = useState(false);
  const save = () => {
    if (!name.trim() || !amount) return;
    const nextDate = (() => { const d=new Date(); d.setDate(Number(dueDay)); if(d<new Date()) d.setMonth(d.getMonth()+1); return d.toISOString().slice(0,10); })();
    onSave({ id:Date.now(), name:name.trim(), amount:Number(amount), dueDay:Number(dueDay), category, emoji, autoPay, nextDate, createdAt:today(), paid:false });
    setName(''); setAmount(''); onClose();
  };
  return (
    <Modal open={open} onClose={onClose} title="🧾 Add Bill">
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        <div style={{ display:'grid', gridTemplateColumns:'48px 1fr', gap:8 }}>
          <Input value={emoji} onChange={e=>setEmoji(e.target.value)} style={{ textAlign:'center', fontSize:18 }} />
          <Input value={name} onChange={e=>setName(e.target.value)} placeholder="Bill name (e.g. Electricity)" />
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          <Input type="number" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="Amount" />
          <Input type="number" value={dueDay} onChange={e=>setDueDay(e.target.value)} placeholder="Due day of month (1-31)" min="1" max="31" />
        </div>
        <Select value={category} onChange={e=>setCategory(e.target.value)}>{['Utilities','Rent/Mortgage','Insurance','Phone','Internet','Transportation','Other'].map(c=><option key={c}>{c}</option>)}</Select>
        <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:12, fontFamily:T.fM, color:T.text, cursor:'pointer' }}>
          <input type="checkbox" checked={autoPay} onChange={e=>setAutoPay(e.target.checked)} /> Auto-pay enabled
        </label>
        <Btn full onClick={save} color={T.sky}>Add Bill</Btn>
      </div>
    </Modal>
  );
}

// S1 — Add Quick Note Modal
function AddQuickNoteModal({ open, onClose, onSave }) {
  const [text, setText] = useState(''); const [color, setColor] = useState('#fbbf24');
  const COLORS = ['#fbbf24','#34d399','#38bdf8','#8b5cf6','#fb7185','#00f5d4'];
  const save = () => { if (!text.trim()) return; onSave({ id:Date.now(), text:text.trim(), color, date:today() }); setText(''); onClose(); };
  return (
    <Modal open={open} onClose={onClose} title="📌 Quick Note">
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Capture a thought, idea, or reminder..." rows={4} style={{ width:'100%', padding:'9px 12px', background:'rgba(255,255,255,0.04)', border:`1px solid ${T.border}`, borderRadius:T.r, fontFamily:T.fM, fontSize:12, color:T.text, resize:'vertical' }} />
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:11, fontFamily:T.fM, color:T.textSub }}>Color:</span>
          {COLORS.map(c=>(
            <button key={c} onClick={()=>setColor(c)} style={{ width:20, height:20, borderRadius:'50%', background:c, border:`2px solid ${color===c?T.text:'transparent'}`, cursor:'pointer', flexShrink:0 }} />
          ))}
        </div>
        <Btn full onClick={save} color={T.amber}>Save Note</Btn>
      </div>
    </Modal>
  );
}

// S2 — Edit Habit Modal

// ── CHRONICLE MODAL — log a life win / milestone ─────────────────────────────
function AddChronicleModal({ open, onClose, onSave }) {
  const [title, setTitle] = useState(''); const [body, setBody] = useState('');
  const [emoji, setEmoji] = useState('🏆'); const [date, setDate] = useState(today());
  const EMOJIS = ['🏆','⭐','🎉','💪','🚀','❤️','🎓','💰','🌟','🔥'];
  const save = () => {
    if (!title.trim()) return;
    onSave({ id:Date.now(), title:title.trim(), body:body.trim(), emoji, date });
    setTitle(''); setBody(''); setEmoji('🏆'); setDate(today()); onClose();
  };
  return (
    <Modal open={open} onClose={onClose} title="✨ Chronicle a Win">
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        <div style={{ fontSize:11, fontFamily:T.fM, color:T.textSub }}>What did you achieve or experience?</div>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          {EMOJIS.map(e=><button key={e} onClick={()=>setEmoji(e)} style={{ fontSize:20, padding:6, borderRadius:8, background:emoji===e?T.accentDim:T.surface, border:`1px solid ${emoji===e?T.accent+'55':T.border}` }}>{e}</button>)}
        </div>
        <Input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Title — what happened?" />
        <textarea value={body} onChange={e=>setBody(e.target.value)} placeholder="Details (optional)..." rows={3} style={{ width:'100%', padding:'9px 12px', background:'rgba(255,255,255,0.04)', border:`1px solid ${T.border}`, borderRadius:T.r, fontFamily:T.fM, fontSize:12, color:T.text, resize:'vertical' }} />
        <Input type="date" value={date} onChange={e=>setDate(e.target.value)} />
        <Btn full onClick={save} color={T.amber}>Save Chronicle</Btn>
      </div>
    </Modal>
  );
}

function EditHabitModal({ open, onClose, habit, onSave }) {
  const [name, setName] = useState(''); const [emoji, setEmoji] = useState('🔥');
  const [frequency, setFrequency] = useState('daily'); const [xp, setXp] = useState('10'); const [category, setCategory] = useState('Mind');
  useEffect(() => { if (habit && open) { setName(habit.name||''); setEmoji(habit.emoji||'🔥'); setFrequency(habit.frequency||'daily'); setXp(String(habit.xp||10)); setCategory(habit.category||'Mind'); } }, [habit, open]);
  const save = () => { if (!name.trim()) return; onSave(habit.id, { name:name.trim(), emoji, frequency, xp:Number(xp)||10, category }); onClose(); };
  return (
    <Modal open={open} onClose={onClose} title="✏️ Edit Habit">
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        <div style={{ display:'grid', gridTemplateColumns:'52px 1fr', gap:8 }}>
          <Input value={emoji} onChange={e=>setEmoji(e.target.value)} style={{ textAlign:'center', fontSize:20 }} />
          <Input value={name} onChange={e=>setName(e.target.value)} placeholder="Habit name" />
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          <Select value={frequency} onChange={e=>setFrequency(e.target.value)}>{['daily','weekdays','3x week','weekly'].map(f=><option key={f}>{f}</option>)}</Select>
          <Select value={category} onChange={e=>setCategory(e.target.value)}>{['Mind','Body','Finance','Social','Learning','Health'].map(c=><option key={c}>{c}</option>)}</Select>
        </div>
        <div>
          <div style={{ fontSize:10, fontFamily:T.fM, color:T.textSub, marginBottom:6 }}>XP reward per log</div>
          <Input type="number" value={xp} onChange={e=>setXp(e.target.value)} placeholder="10" />
        </div>
        <Btn full onClick={save} color={T.accent}>Save Changes</Btn>
      </div>
    </Modal>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ── COMMAND PALETTE — Phase 1 / Phase 8 ───────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
function CommandPalette({ open, onClose, data, onNav, onModal }) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => { if (open) { setTimeout(() => inputRef.current?.focus(), 50); setQuery(''); setSelected(0); } }, [open]);

  const PAGES = [
    { id:'home', label:'Dashboard', icon:'🏠' }, { id:'timeline', label:'Timeline', icon:'📅' },
    { id:'money', label:'Money Hub', icon:'💰' }, { id:'health', label:'Health & Vitals', icon:'❤️' },
    { id:'growth', label:'Habits & Goals', icon:'📈' }, { id:'knowledge', label:'Knowledge Base', icon:'📚' },
    { id:'intel', label:'Intelligence', icon:'🧠' }, { id:'archive', label:'Archive', icon:'🗃️' },
    { id:'settings', label:'Settings', icon:'⚙️' },
  ];
  const ACTIONS = [
    { label:'Log Expense', icon:'💳', action:()=>onModal('expense') },
    { label:'Log Income', icon:'💰', action:()=>onModal('income') },
    { label:'Log Habit', icon:'🔥', action:()=>onModal('habit') },
    { label:'Log Vitals', icon:'❤️', action:()=>onModal('vitals') },
    { label:'Add Note', icon:'📝', action:()=>onModal('note') },
    { label:'Add Goal', icon:'🎯', action:()=>onModal('goal') },
    { label:'Add Debt', icon:'⚠️', action:()=>onModal('debt') },
    { label:'Add Investment', icon:'📈', action:()=>onModal('investment') },
    { label:'Add Subscription', icon:'🔄', action:()=>onModal('subscription') },
  ];

  // Rebuild search index only when item *counts* or *IDs* change — not on every parent re-render
  // Only recompute search index when palette is open AND item IDs changed
  const searchDepsKey = useMemo(() => {
    if (!open) return 'closed'; // freeze while palette is shut
    return [
      (data.notes||[]).map(n=>n.id).join(','),
      (data.goals||[]).map(g=>g.id).join(','),
      (data.habits||[]).map(h=>h.id).join(','),
      (data.expenses||[]).slice(0,20).map(e=>e.id).join(','),
      (data.debts||[]).map(d=>d.id).join(','),
      (data.investments||[]).map(i=>i.id).join(','),
      (data.assets||[]).map(a=>a.id).join(','),
    ].join('|');
  }, [open, data.notes, data.goals, data.habits, data.expenses, data.debts, data.investments, data.assets]);
  const searchIndex = useMemo(() => open ? buildSearchIndex(data) : [], [searchDepsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ACTIONS.slice(0,6).map(a => ({ ...a, type:'action', sub:'Quick action' }));
    const out = [];
    PAGES.filter(p => p.label.toLowerCase().includes(q)).forEach(p => out.push({ ...p, type:'page', sub:'Navigate to page', action:()=>onNav(p.id) }));
    ACTIONS.filter(a => a.label.toLowerCase().includes(q)).forEach(a => out.push({ ...a, type:'action', sub:'Run action' }));
    searchIndex.filter(item => item.label?.toLowerCase().includes(q)).slice(0,6).forEach(item => out.push({ ...item, sub:item.sub||item.type, action:()=>onNav(item.page) }));
    return out.slice(0, 8);
  }, [query, searchIndex]);

  useEffect(() => setSelected(0), [results]);

  const TYPE_COLORS = { page:T.sky, action:T.accent, note:T.amber, goal:T.violet, habit:T.accent, expense:T.rose, debt:T.rose, investment:T.violet, asset:T.accent };

  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', zIndex:9999, display:'flex', alignItems:'flex-start', justifyContent:'center', padding:'10vh 16px', backdropFilter:'blur(10px)' }}>
      <div onClick={e=>e.stopPropagation()} style={{ width:'100%', maxWidth:580, background:T.bg2, border:`1px solid ${T.borderLit}`, borderRadius:18, overflow:'hidden', animation:'modalIn 0.2s ease', boxShadow:`0 0 60px ${T.accent}18` }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 18px', borderBottom:`1px solid ${T.border}` }}>
          <IcoSearch size={14} stroke={T.textSub} />
          <input ref={inputRef} value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>{
            if (e.key==='Escape') onClose();
            if (e.key==='ArrowDown') { e.preventDefault(); setSelected(s=>Math.min(s+1,results.length-1)); }
            if (e.key==='ArrowUp') { e.preventDefault(); setSelected(s=>Math.max(s-1,0)); }
            if (e.key==='Enter' && results[selected]) { results[selected].action?.(); onClose(); }
          }} placeholder="Search notes, goals, habits, or run a command…" style={{ flex:1, background:'transparent', border:'none', fontSize:14, fontFamily:T.fM, color:T.text, outline:'none' }} />
          <div style={{ display:'flex', gap:4 }}>
            <span style={{ fontSize:9, fontFamily:T.fM, color:T.textMuted, padding:'3px 7px', background:T.surface, border:`1px solid ${T.border}`, borderRadius:5 }}>↑↓</span>
            <span style={{ fontSize:9, fontFamily:T.fM, color:T.textMuted, padding:'3px 7px', background:T.surface, border:`1px solid ${T.border}`, borderRadius:5 }}>↵</span>
            <span style={{ fontSize:9, fontFamily:T.fM, color:T.textMuted, padding:'3px 7px', background:T.surface, border:`1px solid ${T.border}`, borderRadius:5 }}>ESC</span>
          </div>
        </div>
        <div style={{ padding:'8px 0', maxHeight:380, overflowY:'auto' }}>
          {!query && <div style={{ fontSize:9, fontFamily:T.fM, color:T.textMuted, padding:'6px 18px', letterSpacing:'0.1em' }}>QUICK ACTIONS</div>}
          {results.length === 0 && <div style={{ padding:'24px', textAlign:'center', fontSize:12, fontFamily:T.fM, color:T.textMuted }}>No results for "{query}"</div>}
          {results.map((r, i) => (
            <div key={i} className="los-cmd" onClick={()=>{ r.action?.(); onClose(); }} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 18px', cursor:'pointer', background:i===selected?'rgba(255,255,255,0.06)':'transparent', transition:'background 0.1s', borderLeft:`2px solid ${i===selected?(TYPE_COLORS[r.type]||T.accent):'transparent'}` }}>
              <span style={{ fontSize:16, flexShrink:0 }}>{r.icon}</span>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:12, fontFamily:T.fD, fontWeight:600, color:T.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.label}</div>
                <div style={{ fontSize:10, fontFamily:T.fM, color:T.textSub, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.sub}</div>
              </div>
              <Badge color={TYPE_COLORS[r.type]||T.textSub}>{r.type}</Badge>
            </div>
          ))}
        </div>
        <div style={{ borderTop:`1px solid ${T.border}`, padding:'8px 18px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span style={{ fontSize:9, fontFamily:T.fM, color:T.textMuted }}>{results.length} result{results.length!==1?'s':''}</span>
          <span style={{ fontSize:9, fontFamily:T.fM, color:T.textMuted }}><span style={{ color:T.accent }}>⌘K</span> to open anytime</span>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ── HABIT HEATMAP — Phase 5 ───────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
const HabitHeatmap = memo(function HabitHeatmap({ habitLogs, habits }) {
  const WEEKS = 18; const DAYS = 7;
  const cells = useMemo(() => {
    const total = (habits||[]).length || 1;
    const result = [];
    const now = new Date(); now.setHours(0,0,0,0);
    const startOffset = now.getDay();
    const start = new Date(now); start.setDate(start.getDate() - (WEEKS * 7) + (7 - startOffset));
    const dateCountMap = {};
    Object.values(habitLogs).forEach(logs => logs.forEach(d => { dateCountMap[d] = (dateCountMap[d]||0)+1; }));
    for (let w = 0; w < WEEKS; w++) {
      for (let d = 0; d < DAYS; d++) {
        const date = new Date(start); date.setDate(start.getDate() + w * 7 + d);
        const ds = date.toISOString().slice(0, 10);
        const done = dateCountMap[ds] || 0;
        const pct = Math.min(1, done / total);
        result.push({ date:ds, done, pct, future:date > now });
      }
    }
    return result;
  }, [habitLogs, habits]);

  // ── Insight stats derived from heatmap data ─────────────────────────────────
  const insights = useMemo(() => {
    const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const pastCells = cells.filter(c => !c.future && c.pct > 0);
    if (pastCells.length < 7) return null;

    // Average completion by day of week
    const byDow = Array.from({length:7}, () => ({ total:0, count:0 }));
    cells.filter(c => !c.future).forEach(c => {
      const dow = new Date(c.date + 'T12:00:00').getDay();
      byDow[dow].total += c.pct;
      byDow[dow].count++;
    });
    const dowAvgs = byDow.map((d, i) => ({ dow:i, label:DAY_NAMES[i], avg: d.count > 0 ? d.total/d.count : 0 }));
    const bestDow  = [...dowAvgs].sort((a,b) => b.avg - a.avg)[0];
    const worstDow = [...dowAvgs].filter(d => d.count > 0).sort((a,b) => a.avg - b.avg)[0] || bestDow;

    // Overall avg completion across past 18 weeks
    const allPast = cells.filter(c => !c.future);
    const avgCompletion = allPast.length ? allPast.reduce((s,c)=>s+c.pct,0)/allPast.length : 0;

    // Streak trend: last 4 weeks avg vs prior 4 weeks avg
    const last4w = cells.filter(c => !c.future).slice(-28);
    const prev4w = cells.filter(c => !c.future).slice(-56, -28);
    const last4avg = last4w.length ? last4w.reduce((s,c)=>s+c.pct,0)/last4w.length : 0;
    const prev4avg = prev4w.length ? prev4w.reduce((s,c)=>s+c.pct,0)/prev4w.length : 0;
    const trend = prev4avg > 0 ? ((last4avg - prev4avg) / prev4avg) * 100 : 0;

    return { bestDow, worstDow, avgCompletion, trend, last4avg };
  }, [cells]);

  const heatColor = (pct, future) => {
    if (future) return 'transparent';
    if (pct === 0) return 'rgba(255,255,255,0.04)';
    const alpha = 0.2 + pct * 0.8;
    return `rgba(0,245,212,${alpha.toFixed(2)})`;
  };

  const MONTH_LABELS = useMemo(() => {
    const labels = []; let lastMonth = '';
    cells.filter((_, i) => i % 7 === 0).forEach((c, wi) => {
      const m = c.date.slice(0, 7);
      if (m !== lastMonth) { labels.push({ wi, label: new Date(c.date+'T12:00:00').toLocaleDateString('en-US',{month:'short'}) }); lastMonth = m; }
      else labels.push({ wi, label: '' });
    });
    return labels;
  }, [cells]);

  return (
    <div>
      <div style={{ display:'flex', gap:2, marginBottom:4 }}>
        {MONTH_LABELS.map((ml, i) => (
          <div key={i} style={{ width: 7*8+2, fontSize:9, fontFamily:T.fM, color:T.textSub }}>{ml.label}</div>
        ))}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:`repeat(${WEEKS},1fr)`, gap:2 }}>
        {Array.from({ length: WEEKS }, (_, wi) => (
          <div key={wi} style={{ display:'flex', flexDirection:'column', gap:2 }}>
            {cells.slice(wi*7, wi*7+7).map((cell, di) => (
              <div key={di} className="los-heat" title={`${cell.date}: ${cell.done} habit${cell.done!==1?'s':''} done`} style={{ width:'100%', aspectRatio:'1', borderRadius:3, background:heatColor(cell.pct, cell.future), border:`1px solid rgba(255,255,255,0.04)`, cursor:'pointer', transition:'transform 0.1s' }} />
            ))}
          </div>
        ))}
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:8, justifyContent:'flex-end' }}>
        <span style={{ fontSize:9, fontFamily:T.fM, color:T.textMuted }}>Less</span>
        {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
          <div key={i} style={{ width:10, height:10, borderRadius:2, background:heatColor(p, false) }} />
        ))}
        <span style={{ fontSize:9, fontFamily:T.fM, color:T.textMuted }}>More</span>
      </div>

      {/* ── Insight strip below the grid ───────────────────────────────────── */}
      {insights && (
        <div style={{ marginTop:14, display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))', gap:8 }}>
          {[
            {
              label: 'Avg completion',
              value: `${Math.round(insights.avgCompletion * 100)}%`,
              sub: 'across 18 weeks',
              color: insights.avgCompletion >= 0.7 ? T.emerald : insights.avgCompletion >= 0.4 ? T.amber : T.rose,
            },
            {
              label: 'Best day',
              value: insights.bestDow.label,
              sub: `${Math.round(insights.bestDow.avg * 100)}% avg completion`,
              color: T.accent,
            },
            {
              label: 'Weakest day',
              value: insights.worstDow.label,
              sub: `${Math.round(insights.worstDow.avg * 100)}% avg — worth watching`,
              color: T.rose,
            },
            {
              label: 'Trend (4-wk)',
              value: `${insights.trend >= 0 ? '+' : ''}${Math.round(insights.trend)}%`,
              sub: insights.trend >= 5 ? 'Improving momentum' : insights.trend <= -5 ? 'Declining — check in' : 'Stable',
              color: insights.trend >= 0 ? T.emerald : T.rose,
            },
          ].map((s, i) => (
            <div key={i} style={{ padding:'10px 12px', borderRadius:T.r, background:T.surface, border:`1px solid ${s.color}22` }}>
              <div style={{ fontSize:8, fontFamily:T.fM, color:T.textSub, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>{s.label}</div>
              <div style={{ fontSize:15, fontFamily:T.fD, fontWeight:700, color:s.color, marginBottom:2 }}>{s.value}</div>
              <div style={{ fontSize:8, fontFamily:T.fM, color:T.textMuted, lineHeight:1.4 }}>{s.sub}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

// ══════════════════════════════════════════════════════════════════════════════
// ── S3: SMART ALERTS ENGINE (shared by TopBar + HomePage) ────────────────────
// ══════════════════════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════
// ── LIFE PULSE SCORE ──────────────────────────────────────────────────────────
// A single 0-100 composite score visible on Home. Updates daily from real data.
// Five domains weighted equally (20pts each):
//   Finance   — savings rate + net worth direction
//   Health    — sleep avg + mood avg (7-day)
//   Habits    — completion rate (7-day) + streak quality
//   Goals     — avg progress across active goals with deadlines
//   Consistency — days logged across all domains in last 14 days
// Stored daily in los_pulse_history for trend display.
// ══════════════════════════════════════════════════════════════════════════════
function computeLifePulse({ expenses=[], incomes=[], habits=[], habitLogs={}, vitals=[], goals=[], assets=[], investments=[], debts=[], settings={} }) {
  const now     = new Date();
  const today_  = now.toISOString().slice(0, 10);
  const thisM   = today_.slice(0, 7);

  // ── Finance (20pts) ───────────────────────────────────────────────────────
  const monthInc = (incomes||[]).filter(i => i.date?.startsWith(thisM)).reduce((s, i) => s + Number(i.amount||0), 0);
  const monthExp = (expenses||[]).filter(e => e.date?.startsWith(thisM)).reduce((s, e) => s + Number(e.amount||0), 0);
  const savRate  = monthInc > 0 ? ((monthInc - monthExp) / monthInc) * 100 : 0;
  const invVal   = (investments||[]).reduce((s, i) => s + Number((i.currentPrice ?? i.buyPrice)||0) * Number(i.quantity||0), 0);
  const nw       = (assets||[]).reduce((s, a) => s + Number(a.value||0), 0) + invVal - (debts||[]).reduce((s, d) => s + Number(d.balance||0), 0);
  const financeScore = Math.min(20, Math.round(
    (Math.min(10, savRate * 0.35)) +           // up to 10pts for savings rate (30% = 10pts)
    (nw > 0 ? Math.min(10, nw / 5000) : 0)    // up to 10pts for positive NW
  ));

  // ── Health (20pts) ────────────────────────────────────────────────────────
  const v7 = (vitals||[]).slice(-7);
  const avgSleep = v7.length ? v7.reduce((s, v) => s + Number(v.sleep||0), 0) / v7.length : 0;
  const avgMood  = v7.length ? v7.reduce((s, v) => s + Number(v.mood||0),  0) / v7.length : 0;
  const healthScore = v7.length === 0 ? 0 : Math.min(20, Math.round(
    (Math.min(10, (avgSleep / 8) * 10)) +      // up to 10pts for 8h sleep
    (Math.min(10, (avgMood / 10) * 10))         // up to 10pts for 10/10 mood
  ));

  // ── Habits (20pts) ────────────────────────────────────────────────────────
  const last7Days = Array.from({length:7}, (_, i) => {
    const d = new Date(now); d.setDate(d.getDate() - i);
    return d.toISOString().slice(0, 10);
  });
  const habitCompletion = (habits||[]).length > 0
    ? last7Days.reduce((s, d) =>
        s + (habits||[]).filter(h => (habitLogs[h.id]||[]).includes(d)).length, 0
      ) / ((habits||[]).length * 7)
    : 0;
  const bestStreak = (habits||[]).reduce((mx, h) => { const s = getStreak(h.id, habitLogs); return s > mx ? s : mx; }, 0);
  const habitsScore = (habits||[]).length === 0 ? 0 : Math.min(20, Math.round(
    (habitCompletion * 14) +                    // up to 14pts for 100% completion
    (Math.min(6, bestStreak / 5))               // up to 6pts for streaks
  ));

  // ── Goals (20pts) ─────────────────────────────────────────────────────────
  const activeGoals = (goals||[]).filter(g => g.target && Number(g.target) > 0);
  const avgGoalPct  = activeGoals.length
    ? activeGoals.reduce((s, g) => s + Math.min(1, Number(g.current||0) / Number(g.target)), 0) / activeGoals.length
    : 0;
  const goalsScore = activeGoals.length === 0 ? 10 : Math.min(20, Math.round(avgGoalPct * 20)); // 10pts if no goals set

  // ── Consistency (20pts) — are you logging regularly? ──────────────────────
  const last14 = Array.from({length:14}, (_, i) => {
    const d = new Date(now); d.setDate(d.getDate() - i);
    return d.toISOString().slice(0, 10);
  });
  const expDays    = new Set((expenses||[]).map(e => e.date)).size;
  const incDays    = new Set((incomes||[]).map(i => i.date)).size;
  const vitalsDays = (vitals||[]).filter(v => last14.includes(v.date)).length;
  const habitDays  = last14.filter(d => (habits||[]).some(h => (habitLogs[h.id]||[]).includes(d))).length;
  // Score: 0-5pts per category (expenses, income, vitals, habits) for last 14 days
  const consistencyScore = Math.min(20, Math.round(
    Math.min(5, expDays / 2)      +             // expenses logged regularly
    Math.min(5, incDays / 1)      +             // income logged
    Math.min(5, (vitalsDays / 14) * 5) +        // vitals completeness
    Math.min(5, (habitDays / 14) * 5)           // habit logging rate
  ));

  const total = financeScore + healthScore + habitsScore + goalsScore + consistencyScore;

  return {
    total,
    domains: {
      finance:     { score: financeScore,     max: 20, label: 'Finance'     },
      health:      { score: healthScore,      max: 20, label: 'Health'      },
      habits:      { score: habitsScore,      max: 20, label: 'Habits'      },
      goals:       { score: goalsScore,       max: 20, label: 'Goals'       },
      consistency: { score: consistencyScore, max: 20, label: 'Consistency' },
    },
  };
}

// ── LIFE PULSE CHIP — shown in Home greeting header ───────────────────────────
function LifePulseChip({ pulse }) {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const color = pulse.total >= 75 ? T.emerald : pulse.total >= 50 ? T.accent : pulse.total >= 30 ? T.amber : T.rose;
  const label = pulse.total >= 75 ? 'Strong' : pulse.total >= 50 ? 'Good' : pulse.total >= 30 ? 'Fair' : 'Low';

  return (
    <div style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        onClick={() => setShowBreakdown(v => !v)}
        style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 99, background: color + '18', border: '1px solid ' + color + '44', cursor: 'pointer', transition: 'all 0.15s' }}
        title="Life Pulse — your composite daily score"
      >
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: color, animation: 'dotPulse 2.5s infinite' }} />
        <span style={{ fontSize: 9, fontFamily: T.fM, color, fontWeight: 700, letterSpacing: '0.08em' }}>
          PULSE {pulse.total}
        </span>
        <span style={{ fontSize: 9, fontFamily: T.fM, color, opacity: 0.8 }}>{label}</span>
      </button>

      {showBreakdown && (
        <>
          <div onClick={() => setShowBreakdown(false)} style={{ position: 'fixed', inset: 0, zIndex: 198 }} />
          <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, width: 220, background: T.bg2, border: '1px solid ' + T.borderLit, borderRadius: 12, boxShadow: '0 12px 40px rgba(0,0,0,0.5)', zIndex: 199, animation: 'slideDown 0.18s ease', overflow: 'hidden', padding: '14px 16px' }}>
            <div style={{ fontSize: 9, fontFamily: T.fM, color: T.textSub, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10, fontWeight: 700 }}>Life Pulse Breakdown</div>
            {Object.values(pulse.domains).map(d => (
              <div key={d.label} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, fontFamily: T.fM, color: T.textSub, marginBottom: 3 }}>
                  <span>{d.label}</span>
                  <span style={{ color: d.score >= 16 ? T.emerald : d.score >= 10 ? T.accent : T.amber, fontWeight: 600 }}>{d.score}/{d.max}</span>
                </div>
                <ProgressBar pct={(d.score / d.max) * 100} color={d.score >= 16 ? T.emerald : d.score >= 10 ? T.accent : T.amber} height={3} />
              </div>
            ))}
            <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid ' + T.border, fontSize: 8, fontFamily: T.fM, color: T.textMuted, lineHeight: 1.5 }}>
              Updates daily. Covers finance, health, habits, goals, and logging consistency.
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── MONTH-OVER-MONTH AUTO-SUMMARY ─────────────────────────────────────────────
// Runs once on the 1st of each month. Generates a plain-text summary comparing
// the just-ended month to the one before it. Saves to Chronicles automatically.
// No user action needed — it's just there when you open the app on the 1st.
function useMonthAutoSummary({ expenses=[], incomes=[], habits=[], habitLogs={}, vitals=[], goals=[], settings={}, actions }) {
  useEffect(() => {
    const now = new Date();
    if (now.getDate() !== 1) return; // only on 1st of month
    const KEY = 'los_mth_summary_last';
    const prevM = (() => { const d = new Date(now); d.setMonth(d.getMonth() - 1); return d.toISOString().slice(0, 7); })();
    if (localStorage.getItem(KEY) === prevM) return; // already generated for this month

    const cur  = settings?.currency || '$';
    const prevPrevM = (() => { const d = new Date(now); d.setMonth(d.getMonth() - 2); return d.toISOString().slice(0, 7); })();

    const mInc  = (incomes||[]).filter(i => i.date?.startsWith(prevM)).reduce((s, i) => s + Number(i.amount||0), 0);
    const mExp  = (expenses||[]).filter(e => e.date?.startsWith(prevM)).reduce((s, e) => s + Number(e.amount||0), 0);
    const ppInc = (incomes||[]).filter(i => i.date?.startsWith(prevPrevM)).reduce((s, i) => s + Number(i.amount||0), 0);
    const ppExp = (expenses||[]).filter(e => e.date?.startsWith(prevPrevM)).reduce((s, e) => s + Number(e.amount||0), 0);
    const mSaved  = Math.max(0, mInc - mExp);
    const ppSaved = Math.max(0, ppInc - ppExp);
    const savRate = mInc > 0 ? ((mSaved / mInc) * 100).toFixed(1) : 0;

    const habitCons = (habits||[]).length > 0
      ? (() => {
          const days = new Set();
          (habits||[]).forEach(h => (habitLogs[h.id]||[]).filter(d => d.startsWith(prevM)).forEach(d => days.add(d)));
          const daysInM = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
          return Math.round((days.size / daysInM) * 100);
        })()
      : null;

    const mVitals  = (vitals||[]).filter(v => v.date?.startsWith(prevM));
    const avgSleep = mVitals.length ? (mVitals.reduce((s, v) => s + Number(v.sleep||0), 0) / mVitals.length).toFixed(1) : null;
    const avgMood  = mVitals.length ? (mVitals.reduce((s, v) => s + Number(v.mood||0),  0) / mVitals.length).toFixed(1) : null;

    const goalsCompleted = (goals||[]).filter(g => Number(g.current||0) >= Number(g.target||1) && g.target > 0).length;

    // Build the summary text
    const lines = [
      '📊 Monthly Summary — ' + prevM,
      '',
      '💰 Finance',
      '  Income: ' + cur + mInc.toLocaleString() + (ppInc ? ' (' + (mInc >= ppInc ? '+' : '') + ((((mInc - ppInc) / Math.max(1, ppInc)) * 100).toFixed(0)) + '% vs prev month)' : ''),
      '  Expenses: ' + cur + mExp.toLocaleString() + (ppExp ? ' (' + (mExp <= ppExp ? '↓' : '↑') + ' vs prev month)' : ''),
      '  Saved: ' + cur + mSaved.toLocaleString() + ' (' + savRate + '%)' + (ppSaved ? ' vs ' + cur + ppSaved.toLocaleString() + ' prior month' : ''),
      '',
      habitCons !== null ? ('🔥 Habits: ' + habitCons + '% consistency across ' + (habits||[]).length + ' habit' + ((habits||[]).length !== 1 ? 's' : '')) : '',
      avgSleep ? ('😴 Sleep: ' + avgSleep + 'h avg · Mood: ' + avgMood + '/10 avg') : '',
      goalsCompleted > 0 ? ('🏆 Goals: ' + goalsCompleted + ' completed') : '',
    ].filter(Boolean);

    actions.addChronicle({
      id: Date.now(),
      emoji: '📊',
      title: 'Monthly Summary — ' + prevM,
      body: lines.join('\n'),
      date: now.toISOString().slice(0, 10),
      autoGenerated: true,
    });

    localStorage.setItem(KEY, prevM);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

// ══════════════════════════════════════════════════════════════════════════════
// ── DECISION LOG ──────────────────────────────────────────────────────────────
// Log any life decision with context: what, why, which domains it touches,
// financial amount if relevant. Stored in los_decisions.
// Shows in Chronicles and is included in AI context.
// ══════════════════════════════════════════════════════════════════════════════
function LogDecisionModal({ open, onClose, onSave }) {
  const [title,   setTitle  ] = useState('');
  const [why,     setWhy    ] = useState('');
  const [domains, setDomains] = useState([]);
  const [amount,  setAmount ] = useState('');
  const [impact,  setImpact ] = useState('neutral'); // positive | neutral | uncertain

  useEffect(() => { if (open) { setTitle(''); setWhy(''); setDomains([]); setAmount(''); setImpact('neutral'); } }, [open]);

  const DOMAINS = ['Finance', 'Health', 'Career', 'Habits', 'Relationships', 'Growth'];
  const toggleDomain = d => setDomains(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);

  const save = () => {
    if (!title.trim()) return;
    onSave({
      id: Date.now(),
      title: title.trim(),
      why: why.trim(),
      domains,
      amount: amount ? Number(amount) : null,
      impact,
      date: new Date().toISOString().slice(0, 10),
    });
    onClose();
  };

  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 480, borderRadius: 20, background: T.bg1, border: '1px solid ' + T.border, padding: '28px 32px', animation: 'modalIn 0.25s ease' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontFamily: T.fD, fontWeight: 800, color: T.text }}>📝 Log a Decision</h2>
          <button onClick={onClose} style={{ fontSize: 20, color: T.textSub, background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <div style={{ fontSize: 10, fontFamily: T.fM, color: T.textSub, marginBottom: 6 }}>What did you decide?</div>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Switch jobs, cancel Netflix, start running..." />
          </div>
          <div>
            <div style={{ fontSize: 10, fontFamily: T.fM, color: T.textSub, marginBottom: 6 }}>Why? (your reasoning, optional)</div>
            <textarea value={why} onChange={e => setWhy(e.target.value)} placeholder="What led to this decision?" rows={2}
              style={{ width: '100%', padding: '9px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid ' + T.border, borderRadius: T.r, fontFamily: T.fM, fontSize: 12, color: T.text, resize: 'vertical' }} />
          </div>
          <div>
            <div style={{ fontSize: 10, fontFamily: T.fM, color: T.textSub, marginBottom: 6 }}>Domains affected</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {DOMAINS.map(d => (
                <button key={d} onClick={() => toggleDomain(d)}
                  style={{ padding: '4px 12px', borderRadius: 99, fontSize: 10, fontFamily: T.fM, cursor: 'pointer', background: domains.includes(d) ? T.accent + '22' : T.surface, color: domains.includes(d) ? T.accent : T.textSub, border: '1px solid ' + (domains.includes(d) ? T.accent + '55' : T.border), transition: 'all 0.15s' }}>
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <div style={{ fontSize: 10, fontFamily: T.fM, color: T.textSub, marginBottom: 6 }}>Financial impact (optional)</div>
              <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount ±" />
            </div>
            <div>
              <div style={{ fontSize: 10, fontFamily: T.fM, color: T.textSub, marginBottom: 6 }}>Expected outcome</div>
              <select value={impact} onChange={e => setImpact(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid ' + T.border, borderRadius: T.r, fontFamily: T.fM, fontSize: 12, color: T.text }}>
                <option value="positive">Positive</option>
                <option value="neutral">Neutral</option>
                <option value="uncertain">Uncertain</option>
                <option value="negative">Difficult but necessary</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
            <button onClick={onClose} style={{ padding: '10px 20px', borderRadius: T.r, background: T.surface, border: '1px solid ' + T.border, fontFamily: T.fM, fontSize: 11, color: T.textSub, cursor: 'pointer' }}>Cancel</button>
            <Btn onClick={save} color={T.accent} style={{ flex: 1 }} disabled={!title.trim()}>Save Decision</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ── BROWSER NOTIFICATION ENGINE ───────────────────────────────────────────────
// Fires real browser push notifications based on reminder settings + live data.
// Called once per app mount. Uses the Notification API — no server needed.
// ══════════════════════════════════════════════════════════════════════════════
function useSmartNotifications({ habits=[], habitLogs={}, bills=[], budgets={}, expenses=[], vitals=[], settings={} }) {
  useEffect(() => {
    if (typeof Notification === 'undefined') return;
    if (Notification.permission === 'denied') return;

    const fire = (title, body, icon = '⬡') => {
      try {
        if (Notification.permission === 'granted') {
          new Notification(title, { body, icon: '/favicon.ico', tag: title });
        }
      } catch {}
    };

    const now  = new Date();
    const hour = now.getHours();
    const today_ = now.toISOString().slice(0, 10);
    const NOTIF_KEY = 'los_notif_last_' + today_;
    const alreadyFiredToday = localStorage.getItem(NOTIF_KEY) === '1';
    if (alreadyFiredToday) return;

    // Request permission on first use if any reminders are enabled
    const anyEnabled = settings.remindHabit || settings.remindExpense || settings.remindVitals || settings.remindBudget;
    if (anyEnabled && Notification.permission === 'default') {
      Notification.requestPermission();
      return; // fire tomorrow once permission is granted
    }

    if (Notification.permission !== 'granted') return;

    let fired = false;

    // Morning brief (8-10am) — habits not yet logged
    if (settings.remindHabit !== false && hour >= 8 && hour < 10) {
      const doneSoFar = (habits||[]).filter(h => (habitLogs[h.id]||[]).includes(today_)).length;
      if (doneSoFar < (habits||[]).length && (habits||[]).length > 0) {
        fire('LifeOS — Morning check-in', doneSoFar + '/' + (habits||[]).length + ' habits logged. Start your day strong.');
        fired = true;
      }
    }

    // Evening habit reminder (9pm) — streaks at risk
    if (settings.remindHabit !== false && hour >= 21 && hour < 22) {
      const atRisk = (habits||[]).filter(h => {
        const logs = habitLogs[h.id] || [];
        const streak = getStreak(h.id, habitLogs);
        return streak >= 3 && !logs.includes(today_);
      });
      if (atRisk.length > 0) {
        fire('LifeOS — Streak at risk 🔥', atRisk[0].name + ' (' + getStreak(atRisk[0].id, habitLogs) + 'd) not logged yet tonight.');
        fired = true;
      }
    }

    // Bill reminder (any time) — bills due in 3 days
    if (hour >= 9) {
      (bills||[]).filter(b => !b.paid && b.nextDate).forEach(b => {
        const daysUntil = Math.round((new Date(b.nextDate) - now) / 86400000);
        if (daysUntil >= 0 && daysUntil <= 3) {
          fire('LifeOS — Bill due soon', b.name + ' is due in ' + (daysUntil === 0 ? 'today' : daysUntil + ' day' + (daysUntil > 1 ? 's' : '')));
          fired = true;
        }
      });
    }

    // Budget alert (any time after midday) — category over 90%
    if (settings.remindBudget !== false && hour >= 12) {
      const thisM = today_.slice(0, 7);
      Object.entries(budgets||{}).forEach(([cat, limit]) => {
        const spent = (expenses||[]).filter(e => e.date?.startsWith(thisM) && e.category === cat).reduce((s, e) => s + Number(e.amount||0), 0);
        const pct = limit > 0 ? (spent / Number(limit)) * 100 : 0;
        if (pct >= 90 && pct < 110) {
          fire('LifeOS — Budget alert 💸', cat + ' is at ' + Math.round(pct) + '% of budget.');
          fired = true;
        }
      });
    }

    // Vitals reminder (8pm) — not logged today
    if (settings.remindVitals && hour >= 20 && hour < 21) {
      const loggedToday = (vitals||[]).some(v => v.date === today_);
      if (!loggedToday) {
        fire('LifeOS — Log your vitals', 'Track sleep, mood, and energy to reveal your patterns.');
        fired = true;
      }
    }

    if (fired) localStorage.setItem(NOTIF_KEY, '1');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

// ── DAILY BRIEF ENGINE — Step 1 of the "what's about to happen" shift ─────────
// Pure deterministic computation. No AI, no API. Runs on every Home render.
// Answers three questions: what's the financial trajectory, what habit is at
// risk, and what is the single most valuable thing to do today.
// ══════════════════════════════════════════════════════════════════════════════
function computeDailyBrief({ expenses=[], incomes=[], habits=[], habitLogs={}, vitals=[], goals=[], bills=[], budgets={}, assets=[], investments=[], debts=[], settings={} }) {
  const cur    = settings?.currency || '$';
  const today_ = today();
  const thisM  = today_.slice(0, 7);
  const now    = new Date();
  const dayOfMonth   = now.getDate();
  const daysInMonth  = new Date(now.getFullYear(), now.getMonth()+1, 0).getDate();
  const daysLeft     = daysInMonth - dayOfMonth;
  const monthPct     = (dayOfMonth / daysInMonth) * 100;

  // ── Trailing 3-month averages ──────────────────────────────────────────────
  const trailing = [1,2,3].map(i => {
    const d = new Date(); d.setMonth(d.getMonth()-i);
    const m = d.toISOString().slice(0,7);
    const inc = (incomes||[]).filter(x=>x.date?.startsWith(m)).reduce((s,x)=>s+Number(x.amount||0),0);
    const exp = (expenses||[]).filter(x=>x.date?.startsWith(m)).reduce((s,x)=>s+Number(x.amount||0),0);
    return { inc, exp, saved: Math.max(0, inc-exp) };
  });
  const avgInc  = trailing.reduce((s,t)=>s+t.inc,0)  / Math.max(1, trailing.filter(t=>t.inc>0).length || 1);
  const avgExp  = trailing.reduce((s,t)=>s+t.exp,0)  / Math.max(1, trailing.filter(t=>t.exp>0).length || 1);
  const avgSave = trailing.reduce((s,t)=>s+t.saved,0) / Math.max(1, trailing.filter(t=>t.saved>0).length || 1);

  // This month so far
  const monthInc = (incomes||[]).filter(i=>i.date?.startsWith(thisM)).reduce((s,i)=>s+Number(i.amount||0),0);
  const monthExp = (expenses||[]).filter(e=>e.date?.startsWith(thisM)).reduce((s,e)=>s+Number(e.amount||0),0);

  // ── Financial signal ───────────────────────────────────────────────────────
  let financial = null;
  if (monthInc > 0 || avgInc > 0) {
    const projExp  = monthPct > 0 ? (monthExp / (monthPct/100)) : 0; // extrapolate to full month
    const projSave = Math.max(0, monthInc - projExp);
    const expDelta = avgExp > 0 ? ((projExp - avgExp) / avgExp) * 100 : 0;
    const saveDelta= avgSave > 0 ? projSave - avgSave : 0;
    const severity = expDelta > 25 ? 'warn' : expDelta > 10 ? 'notice' : expDelta < -10 ? 'good' : 'neutral';

    // Budget pace — find the most over-tracked budget
    let budgetSignal = null;
    Object.entries(budgets||{}).forEach(([cat, limit]) => {
      const spent = (expenses||[]).filter(e=>e.date?.startsWith(thisM)&&e.category===cat).reduce((s,e)=>s+Number(e.amount||0),0);
      const pct   = limit>0 ? (spent/Number(limit))*100 : 0;
      const proj  = monthPct > 0 ? (spent / (monthPct/100)) : 0;
      if (proj > Number(limit)*1.05) {
        const overshoot = Math.round(proj - Number(limit));
        if (!budgetSignal || overshoot > budgetSignal.overshoot) {
          budgetSignal = { cat, pct: Math.round(pct), overshoot, daysLeft };
        }
      }
    });

    if (budgetSignal) {
      financial = {
        severity: 'warn',
        emoji: '💸',
        signal: `${budgetSignal.cat} budget on track to overshoot`,
        detail: `${Math.round(monthPct)}% through the month, ${Math.round(budgetSignal.pct)}% of budget used — projects ${cur}${fmtN(budgetSignal.overshoot)} over by month-end.`,
        projection: `${daysLeft} days left to course-correct`,
        action: 'Review budget', actionNav: 'money',
      };
    } else if (severity === 'warn') {
      financial = {
        severity: 'warn',
        emoji: '📉',
        signal: `Spending ${Math.abs(Math.round(expDelta))}% above your average`,
        detail: `Projected month-end spend: ${cur}${fmtN(Math.round(projExp))} vs your ${cur}${fmtN(Math.round(avgExp))} average. Projected savings: ${cur}${fmtN(Math.round(projSave))}.`,
        projection: saveDelta < 0 ? `${cur}${fmtN(Math.abs(Math.round(saveDelta)))} less than your usual savings` : `On track`,
        action: 'See spending', actionNav: 'money',
      };
    } else if (severity === 'good') {
      financial = {
        severity: 'good',
        emoji: '📈',
        signal: `Savings pace above average`,
        detail: `Projected to save ${cur}${fmtN(Math.round(projSave))} this month — ${cur}${fmtN(Math.abs(Math.round(saveDelta)))} more than your usual ${cur}${fmtN(Math.round(avgSave))}.`,
        projection: `Best savings month in ${trailing.length}+ months`,
        action: 'View forecast', actionNav: 'intel',
      };
    } else {
      financial = {
        severity: 'neutral',
        emoji: '💰',
        signal: `Savings on track`,
        detail: `${cur}${fmtN(monthInc)} income · ${cur}${fmtN(monthExp)} spent so far. Projected savings: ${cur}${fmtN(Math.round(projSave))}.`,
        projection: `Near your ${cur}${fmtN(Math.round(avgSave))} monthly average`,
        action: 'Log expense', actionModal: 'expense',
      };
    }

    if (monthInc === 0 && avgInc > 0) {
      financial = {
        severity: 'warn',
        emoji: '⚠️',
        signal: `No income logged this month`,
        detail: `All projections depend on income data. Your 3-month average was ${cur}${fmtN(Math.round(avgInc))}/mo.`,
        projection: `Log income to restore forecast accuracy`,
        action: 'Log income', actionModal: 'income',
      };
    }
  } else {
    financial = {
      severity: 'neutral',
      emoji: '💳',
      signal: `Start tracking to see your forecast`,
      detail: `Log a few months of income and expenses — the brief builds itself from your real patterns.`,
      projection: ``,
      action: 'Log income', actionModal: 'income',
    };
  }

  // ── Habit signal ───────────────────────────────────────────────────────────
  let habit = null;
  if ((habits||[]).length > 0) {
    const BREAK_RISK_LENGTHS = [3, 7, 14, 21, 30]; // research-backed streak break points
    const DOW = now.getDay(); // 0=Sun, 6=Sat
    const isWeekend = DOW === 0 || DOW === 6;

    // Build per-habit streak history to detect personal break patterns
    const habitRisks = (habits||[]).map(h => {
      const logs   = (habitLogs[h.id] || []).sort();
      const streak = getStreak(h.id, habitLogs);
      const doneToday = logs.includes(today_);

      // How many times has this habit broken on a weekend?
      let weekendBreaks = 0, totalBreaks = 0;
      for (let i = 1; i < logs.length; i++) {
        const prev = new Date(logs[i-1]), curr = new Date(logs[i]);
        const gap  = Math.round((curr - prev) / 86400000);
        if (gap > 1) {
          totalBreaks++;
          const breakDay = new Date(prev); breakDay.setDate(breakDay.getDate()+1);
          if (breakDay.getDay()===0||breakDay.getDay()===6) weekendBreaks++;
        }
      }
      const weekendBreakRate = totalBreaks > 0 ? weekendBreaks/totalBreaks : 0;

      // Risk score: streak at break-point length + weekend pattern + not done today
      const atBreakLength = BREAK_RISK_LENGTHS.includes(streak) || BREAK_RISK_LENGTHS.some(l => Math.abs(streak-l)<=1);
      const riskScore = (
        (doneToday ? 0 : 3) +
        (atBreakLength ? 2 : 0) +
        (isWeekend && weekendBreakRate > 0.4 ? 2 : 0) +
        (streak >= 7 ? 1 : 0) // higher stakes for longer streaks
      );

      return { h, streak, doneToday, riskScore, weekendBreakRate, atBreakLength };
    }).sort((a,b) => b.riskScore - a.riskScore);

    const topRisk = habitRisks[0];
    const allDone = habitRisks.every(r => r.doneToday);
    const doneSoFar = habitRisks.filter(r => r.doneToday).length;

    if (allDone && (habits||[]).length > 0) {
      habit = {
        severity: 'good',
        emoji: '🔥',
        signal: `All ${(habits||[]).length} habits done today`,
        detail: `Perfect day. Best streak: ${Math.max(...habitRisks.map(r=>r.streak))} days.`,
        projection: `Keep the momentum into tomorrow`,
        action: null,
      };
    } else if (topRisk && topRisk.riskScore >= 3) {
      const weekendNote = isWeekend && topRisk.weekendBreakRate > 0.4
        ? ` You've broken this habit on ${Math.round(topRisk.weekendBreakRate*100)}% of past weekends.` : '';
      const breakNote   = topRisk.atBreakLength ? ` Day ${topRisk.streak} is a historically common break point.` : '';
      habit = {
        severity: topRisk.streak >= 7 ? 'warn' : 'notice',
        emoji: '🎯',
        signal: `${topRisk.h.emoji||'🔥'} ${topRisk.h.name} — ${topRisk.streak}d streak at risk`,
        detail: `${doneSoFar}/${(habits||[]).length} habits logged today.${weekendNote}${breakNote}`,
        projection: topRisk.streak >= 14 ? `A ${topRisk.streak}-day streak is worth protecting` : `Build consistency — log it now`,
        action: 'Log habit', actionModal: 'habit',
        habitName: topRisk.h.name,
      };
    } else {
      habit = {
        severity: 'neutral',
        emoji: '✅',
        signal: `${doneSoFar}/${(habits||[]).length} habits logged today`,
        detail: `${(habits||[]).length - doneSoFar} remaining. Best streak: ${Math.max(1,...habitRisks.map(r=>r.streak))} days.`,
        projection: `Log remaining habits to maintain streaks`,
        action: doneSoFar < (habits||[]).length ? 'Log habits' : null,
        actionModal: 'habit',
      };
    }
  }

  // ── Health signal ──────────────────────────────────────────────────────────
  let health = null;
  if ((vitals||[]).length >= 3) {
    const recent7 = [...vitals].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,7);
    const avgMood  = recent7.reduce((s,v)=>s+Number(v.mood||0),0) / recent7.length;
    const avgSleep = recent7.reduce((s,v)=>s+Number(v.sleep||0),0) / recent7.length;
    const lastVit  = recent7[0];
    const daysSince= Math.round((now - new Date(lastVit.date)) / 86400000);

    // Trend: compare last 3 days vs prior 4 days
    const last3 = recent7.slice(0,3);
    const prev4  = recent7.slice(3,7);
    const moodTrend  = prev4.length > 0 ? (last3.reduce((s,v)=>s+Number(v.mood||0),0)/last3.length) - (prev4.reduce((s,v)=>s+Number(v.mood||0),0)/prev4.length) : 0;
    const sleepTrend = prev4.length > 0 ? (last3.reduce((s,v)=>s+Number(v.sleep||0),0)/last3.length) - (prev4.reduce((s,v)=>s+Number(v.sleep||0),0)/prev4.length) : 0;

    if (daysSince >= 3) {
      health = {
        severity: 'notice',
        emoji: '❤️',
        signal: `No vitals logged in ${daysSince} days`,
        detail: `Last entry: sleep ${lastVit.sleep}h, mood ${lastVit.mood}/10.`,
        projection: `Consistent logging reveals mood & energy patterns`,
        action: 'Log vitals', actionModal: 'vitals',
      };
    } else if (moodTrend <= -1.5) {
      health = {
        severity: 'notice',
        emoji: '😶',
        signal: `Mood trending down over 3 days`,
        detail: `Recent avg: ${(last3.reduce((s,v)=>s+Number(v.mood||0),0)/last3.length).toFixed(1)}/10 vs prior ${(prev4.reduce((s,v)=>s+Number(v.mood||0),0)/prev4.length).toFixed(1)}/10.`,
        projection: sleepTrend < -0.5 ? `Sleep also declining — may be connected` : `Worth noting`,
        action: 'Log vitals', actionModal: 'vitals',
      };
    } else if (avgSleep < 6.5 && avgSleep > 0) {
      health = {
        severity: 'notice',
        emoji: '😴',
        signal: `Average sleep below 7h this week`,
        detail: `${avgSleep.toFixed(1)}h average over last ${recent7.length} entries. Sleep deficit builds over days.`,
        projection: `Research links sub-7h sleep to reduced discipline and impulse spending`,
        action: 'Log vitals', actionModal: 'vitals',
      };
    } else if (moodTrend >= 1.5) {
      health = {
        severity: 'good',
        emoji: '🌟',
        signal: `Mood trending up — strong 3-day run`,
        detail: `Recent avg ${(last3.reduce((s,v)=>s+Number(v.mood||0),0)/last3.length).toFixed(1)}/10. Sleep: ${avgSleep.toFixed(1)}h avg.`,
        projection: `Good window to tackle hard goals or financial decisions`,
        action: null,
      };
    } else {
      health = {
        severity: 'neutral',
        emoji: '💚',
        signal: `Health tracking consistent`,
        detail: `7-day avg: mood ${avgMood.toFixed(1)}/10, sleep ${avgSleep.toFixed(1)}h.`,
        projection: ``,
        action: !(vitals||[]).some(v=>v.date===today_) ? 'Log today' : null,
        actionModal: 'vitals',
      };
    }
  }

  // ── Top action — the single highest-leverage thing to do right now ─────────
  // Priority: overdue bill > budget bust > no income > high habit risk > mood drop > goal behind
  let topAction = null;

  const overdueBill = (bills||[]).find(b => !b.paid && b.nextDate && b.nextDate < today_);
  if (overdueBill) {
    topAction = { emoji:'🚨', text:`${overdueBill.name} is overdue — mark it paid or log the payment`, severity:'urgent', nav:'money' };
  }

  if (!topAction && financial?.severity === 'warn' && financial.actionModal === 'income') {
    topAction = { emoji:'💰', text:`Log this month's income — every projection is off without it`, severity:'high', modal:'income' };
  }

  if (!topAction && habit?.severity === 'warn') {
    topAction = { emoji:'🔥', text:`Log ${habit.habitName || 'your habits'} before the streak breaks`, severity:'high', modal:'habit' };
  }

  if (!topAction && financial?.severity === 'warn') {
    topAction = { emoji:'💸', text:financial.signal, severity:'medium', nav: financial.actionNav };
  }

  if (!topAction && health?.severity === 'notice') {
    topAction = { emoji:'❤️', text:health.signal, severity:'medium', modal: health.actionModal };
  }

  // Goal behind pace
  if (!topAction) {
    const behindGoal = (goals||[]).find(g => {
      if (!g.deadline || !g.target) return false;
      const daysTotal = Math.round((new Date(g.deadline) - new Date(g.date||today_)) / 86400000);
      const daysGone  = Math.round((now - new Date(g.date||today_)) / 86400000);
      const pctTime   = daysTotal > 0 ? daysGone/daysTotal : 0;
      const pctDone   = (g.current||0) / g.target;
      return pctTime - pctDone > 0.2; // more than 20% behind pace
    });
    if (behindGoal) {
      topAction = { emoji:'🎯', text:`"${behindGoal.name}" is behind pace — update your progress`, severity:'medium', nav:'growth' };
    }
  }

  if (!topAction && financial?.action) {
    topAction = { emoji: financial.emoji, text: `Good time to ${financial.action.toLowerCase()}`, severity:'low', modal: financial.actionModal, nav: financial.actionNav };
  }

  return { financial, habit, health, topAction };
}

// ── DAILY BRIEF CARD ──────────────────────────────────────────────────────────
function DailyBriefCard({ data, onNav, onModal }) {
  const {expenses=[], incomes=[], habits=[], habitLogs={}, vitals=[], goals=[], bills=[], budgets={}, assets=[], investments=[], debts=[], settings={}} = data;
  const [collapsed, setCollapsed] = useLocalStorage('los_brief_collapsed', false);

  const brief = useMemo(() =>
    computeDailyBrief({ expenses, incomes, habits, habitLogs, vitals, goals, bills, budgets, assets, investments, debts, settings }),
    // Recompute when key data changes — not on every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [(expenses||[]).length, (incomes||[]).length, (habits||[]).length, Object.values(habitLogs).flat().length, (vitals||[]).length, (goals||[]).length, (bills||[]).length, Object.keys(budgets||{}).length, Object.values(budgets||{}).reduce((s,v)=>s+Number(v||0),0)]
  );

  const SEV_COLORS = { urgent: T.rose, high: T.amber, medium: T.accent, low: T.emerald, neutral: T.textSub };
  const SEV_BG     = { urgent: T.roseDim, high: T.amberDim, medium: T.accentDim, low: T.emeraldDim, neutral: T.surface };

  // Severity of the overall brief = highest individual severity
  const overallSev = brief.topAction?.severity || 'neutral';
  const borderColor = SEV_COLORS[overallSev] || T.border;

  const Signal = ({ s, onAction }) => {
    if (!s) return null;
    const sColor = { good: T.emerald, warn: T.amber, notice: T.sky, neutral: T.textSub }[s.severity] || T.textSub;
    return (
      <div style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'10px 14px', borderRadius:T.r, background:T.surface, border:`1px solid ${T.border}` }}>
        <span style={{ fontSize:18, flexShrink:0, lineHeight:1.3 }}>{s.emoji}</span>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:12, fontFamily:T.fD, fontWeight:700, color:T.text, marginBottom:2 }}>{s.signal}</div>
          <div style={{ fontSize:10, fontFamily:T.fM, color:T.textSub, lineHeight:1.5 }}>{s.detail}</div>
          {s.projection && <div style={{ fontSize:9, fontFamily:T.fM, color:sColor, marginTop:3, fontWeight:600 }}>{s.projection}</div>}
        </div>
        {s.action && (
          <button onClick={onAction} style={{ flexShrink:0, padding:'4px 10px', borderRadius:99, background:sColor+'18', border:`1px solid ${sColor}33`, fontSize:9, fontFamily:T.fM, color:sColor, cursor:'pointer', whiteSpace:'nowrap', alignSelf:'center', transition:'all 0.15s' }}
            onMouseEnter={e=>{e.currentTarget.style.background=sColor+'30';}}
            onMouseLeave={e=>{e.currentTarget.style.background=sColor+'18';}}>
            {s.action} →
          </button>
        )}
      </div>
    );
  };

  const handleAction = (s) => {
    if (!s) return;
    if (s.actionModal) onModal(s.actionModal);
    else if (s.actionNav)  onNav(s.actionNav);
  };

  return (
    <div style={{ marginBottom:18, borderRadius:T.rL, border:`1px solid ${borderColor}44`, background:`linear-gradient(135deg,${borderColor}06,transparent)`, overflow:'hidden', animation:'fadeUp 0.35s ease' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 18px', borderBottom: collapsed ? 'none' : `1px solid ${T.border}` }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:6, height:6, borderRadius:'50%', background:borderColor, animation:'dotPulse 3s infinite', flexShrink:0 }} />
          <span style={{ fontSize:10, fontFamily:T.fM, color:borderColor, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase' }}>Today's Brief</span>
          <span style={{ fontSize:9, fontFamily:T.fM, color:T.textMuted }}>
            {new Date().toLocaleDateString('en-US',{weekday:'long',month:'short',day:'numeric'})}
          </span>
        </div>
        <button onClick={()=>setCollapsed(v=>!v)} style={{ fontSize:9, fontFamily:T.fM, color:T.textSub, background:'none', border:'none', cursor:'pointer', padding:'2px 8px', borderRadius:6, transition:'color 0.15s' }}
          onMouseEnter={e=>{e.currentTarget.style.color=T.text;}}
          onMouseLeave={e=>{e.currentTarget.style.color=T.textSub;}}>
          {collapsed ? '▾ Show' : '▴ Collapse'}
        </button>
      </div>

      {!collapsed && (
        <div style={{ padding:'14px 18px', display:'flex', flexDirection:'column', gap:8 }}>
          {/* Three signals */}
          <Signal s={brief.financial} onAction={()=>handleAction(brief.financial)} />
          {brief.habit  && <Signal s={brief.habit}   onAction={()=>handleAction(brief.habit)} />}
          {brief.health && <Signal s={brief.health}  onAction={()=>handleAction(brief.health)} />}

          {/* Top action — the one thing */}
          {brief.topAction && (
            <div style={{ marginTop:4, display:'flex', alignItems:'center', gap:12, padding:'12px 16px', borderRadius:T.r, background:SEV_BG[brief.topAction.severity]||T.surface, border:`1px solid ${SEV_COLORS[brief.topAction.severity]||T.border}44` }}>
              <span style={{ fontSize:20, flexShrink:0 }}>{brief.topAction.emoji}</span>
              <div style={{ flex:1, fontSize:12, fontFamily:T.fM, color:T.text, lineHeight:1.5 }}>
                <span style={{ fontSize:9, fontFamily:T.fM, color:SEV_COLORS[brief.topAction.severity]||T.textSub, textTransform:'uppercase', letterSpacing:'0.1em', fontWeight:700, display:'block', marginBottom:2 }}>Best thing to do now</span>
                {brief.topAction.text}
              </div>
              <button
                onClick={()=>{
                  if (brief.topAction.modal)  onModal(brief.topAction.modal);
                  else if (brief.topAction.nav) onNav(brief.topAction.nav);
                }}
                style={{ flexShrink:0, padding:'7px 16px', borderRadius:T.r, background:SEV_COLORS[brief.topAction.severity]+'22'||T.accentDim, border:`1px solid ${SEV_COLORS[brief.topAction.severity]+'44'||T.accent+'44'}`, fontSize:10, fontFamily:T.fM, fontWeight:700, color:SEV_COLORS[brief.topAction.severity]||T.accent, cursor:'pointer', transition:'all 0.15s' }}
                onMouseEnter={e=>{e.currentTarget.style.filter='brightness(1.2)';}}
                onMouseLeave={e=>{e.currentTarget.style.filter='none';}}>
                Do it →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ── STEP 3: PROACTIVE ALERTS ENGINE ──────────────────────────────────────────
// Alerts now lead with CONSEQUENCE not FACT. Each alert has:
//   severity  — urgent | warn | positive | info
//   title     — what is happening (short)
//   body      — why it matters + what happens if ignored/acted on
//   action    — label for the CTA button
//   actionModal / actionNav — where the CTA goes
//   dismissKey — unique key for daily snooze
// ══════════════════════════════════════════════════════════════════════════════
function computeSmartAlerts({ bills=[], budgets={}, expenses=[], habits=[], habitLogs={}, vitals=[], thisMonth, monthInc=0, savRate=0, incomes=[], assets=[], investments=[], goals=[], netWorth=0 }) {
  const today_ = today();
  const now    = new Date();
  const dayOfMonth  = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth()+1, 0).getDate();
  const daysLeft    = daysInMonth - dayOfMonth;
  const monthPct    = dayOfMonth / daysInMonth;
  const alerts = [];

  // ── 1. Overdue bills (urgent) ──────────────────────────────────────────────
  (bills||[]).filter(b=>!b.paid && b.nextDate).forEach(b => {
    const daysAgo = Math.round((now - new Date(b.nextDate)) / 86400000);
    if (daysAgo > 0) {
      alerts.push({
        id: `bill-overdue-${b.id}`, type:'bill', severity:'urgent',
        title: `${b.name} is ${daysAgo}d overdue`,
        body: `Mark it paid or the missed payment may incur late fees.`,
        action: 'View bills', actionNav: 'money',
        dismissKey: `bill-overdue-${b.id}-${today_}`,
        color: T.rose,
      });
    }
  });

  // ── 2. Bills due soon ──────────────────────────────────────────────────────
  (bills||[]).filter(b=>!b.paid && b.nextDate).forEach(b => {
    const daysUntil = Math.round((new Date(b.nextDate) - now) / 86400000);
    if (daysUntil >= 0 && daysUntil <= 5) {
      alerts.push({
        id: `bill-due-${b.id}`, type:'bill', severity:'warn',
        title: `${b.name} due in ${daysUntil === 0 ? 'today' : daysUntil+'d'}`,
        body: `Make sure funds are available before the due date.`,
        action: 'View bills', actionNav: 'money',
        dismissKey: `bill-due-${b.id}-${today_}`,
        color: T.amber,
      });
    }
  });

  // ── 3. Budget about to bust — PROJECTED overshoot ─────────────────────────
  Object.entries(budgets||{}).forEach(([cat, limit]) => {
    const spent = (expenses||[]).filter(e=>e.date?.startsWith(thisMonth)&&e.category===cat)
      .reduce((s,e)=>s+Number(e.amount||0),0);
    const pct   = limit>0 ? (spent/Number(limit))*100 : 0;
    const proj  = monthPct > 0.05 ? spent / monthPct : spent; // extrapolate
    const overshoot = Math.round(proj - Number(limit));
    if (pct >= 100) {
      alerts.push({
        id: `budget-over-${cat}`, type:'budget', severity:'urgent',
        title: `${cat} budget exceeded`,
        body: `Spent ${Math.round(pct)}% of budget. Every new purchase adds to the overage.`,
        action: 'Review spending', actionNav: 'money',
        dismissKey: `budget-over-${cat}-${thisMonth}`,
        color: T.rose,
      });
    } else if (overshoot > 0 && pct >= 65) {
      alerts.push({
        id: `budget-pace-${cat}`, type:'budget', severity:'warn',
        title: `${cat} on pace to overshoot`,
        body: `At current pace: projected to exceed limit by ~${Math.round(overshoot)} (${Math.round(pct)}% used so far). ${daysLeft} days left to adjust.`,
        action: 'See budget', actionNav: 'money',
        dismissKey: `budget-pace-${cat}-${today_}`,
        color: T.amber,
      });
    }
  });

  // ── 4. Habit streak at risk ────────────────────────────────────────────────
  (habits||[]).forEach(h => {
    const logs   = (habitLogs[h.id]||[]).sort();
    const streak = getStreak(h.id, habitLogs);
    const doneToday = logs.includes(today_);
    if (!doneToday && streak >= 3) {
      const hour = now.getHours();
      // Only surface after midday to avoid nagging at 7am
      if (hour >= 12) {
        alerts.push({
          id: `habit-risk-${h.id}`, type:'habit', severity: streak >= 7 ? 'warn' : 'info',
          title: `${h.emoji||'🔥'} ${h.name} — ${streak}d streak at risk`,
          body: streak >= 14
            ? `A ${streak}-day streak is serious momentum. Log it before midnight.`
            : `${streak} days in. Don't break the chain.`,
          action: 'Log habit', actionModal: 'habit',
          dismissKey: `habit-risk-${h.id}-${today_}`,
          color: streak >= 7 ? T.amber : T.accent,
        });
      }
    }
  });

  // ── 5. No income logged this month ────────────────────────────────────────
  if (monthInc === 0 && dayOfMonth >= 5) {
    // Check if they ever had income — not just a new user
    const hasHistoricalIncome = (incomes||[]).length > 0;
    if (hasHistoricalIncome) {
      alerts.push({
        id: `no-income-${thisMonth}`, type:'income', severity:'warn',
        title: `No income logged this month`,
        body: `All projections (forecast, FI date, savings rate) are unreliable without income data.`,
        action: 'Log income', actionModal: 'income',
        dismissKey: `no-income-${thisMonth}`,
        color: T.amber,
      });
    }
  }

  // ── 6. Savings rate critically low ────────────────────────────────────────
  if (monthInc > 0 && savRate < 5 && dayOfMonth >= 10) {
    alerts.push({
      id: `savrate-low-${thisMonth}`, type:'savings', severity:'warn',
      title: `Savings rate at ${savRate.toFixed(0)}%`,
      body: `Less than 5% saved this month. At this rate you'll save ${T.amber} less than your average.`,
      action: 'See forecast', actionNav: 'intel',
      dismissKey: `savrate-low-${thisMonth}`,
      color: T.amber,
    });
  }

  // ── 7. Goal behind pace ───────────────────────────────────────────────────
  (goals||[]).forEach(g => {
    if (!g.deadline || !g.target || !g.current) return;
    const start     = new Date(g.date || g.createdAt || thisMonth);
    const end       = new Date(g.deadline);
    const daysTotal = Math.max(1, Math.round((end - start) / 86400000));
    const daysGone  = Math.round((now - start) / 86400000);
    const pctTime   = Math.min(1, daysGone / daysTotal);
    const pctDone   = Math.min(1, Number(g.current) / Number(g.target));
    const lag       = pctTime - pctDone;
    const daysToGo  = Math.round((end - now) / 86400000);
    if (lag > 0.25 && daysToGo > 0 && daysToGo < 90) {
      alerts.push({
        id: `goal-lag-${g.id}`, type:'goal', severity:'info',
        title: `"${g.name}" is behind pace`,
        body: `${Math.round(pctDone*100)}% done with ${Math.round(pctTime*100)}% of time elapsed. ${daysToGo}d to deadline.`,
        action: 'Update goal', actionNav: 'growth',
        dismissKey: `goal-lag-${g.id}-${today_}`,
        color: T.violet,
      });
    }
  });

  // ── 8. No vitals in 3+ days ────────────────────────────────────────────────
  if ((vitals||[]).length > 0) {
    const lastV     = [...vitals].sort((a,b)=>b.date.localeCompare(a.date))[0];
    const daysSince = Math.round((now - new Date(lastV.date)) / 86400000);
    if (daysSince >= 3) {
      alerts.push({
        id: `vitals-gap-${lastV.date}`, type:'health', severity:'info',
        title: `No vitals logged in ${daysSince} days`,
        body: `Health tracking gaps make it harder to spot mood and sleep patterns early.`,
        action: 'Log vitals', actionModal: 'vitals',
        dismissKey: `vitals-gap-${today_}`,
        color: T.sky,
      });
    }
  }

  // ── 9. Net worth data staleness ───────────────────────────────────────────
  // Trajectory arrows and FI date are meaningless if asset values haven't been
  // updated recently. Alert after 30 days of no asset/investment update.
  if ((assets||[]).length > 0 || (investments||[]).length > 0) {
    const allFinancialItems = [
      ...(assets||[]).map(a => a.updatedAt || a.createdAt || today_),
      ...(investments||[]).map(i => i.updatedAt || i.date || today_),
    ];
    if (allFinancialItems.length > 0) {
      const mostRecent = allFinancialItems.sort().reverse()[0];
      const daysSinceUpdate = Math.round((now - new Date(mostRecent)) / 86400000);
      if (daysSinceUpdate >= 30) {
        alerts.push({
          id: `nw-stale-${thisMonth}`, type:'networth', severity:'info',
          title: `Net worth data is ${daysSinceUpdate} days old`,
          body: `Asset values and investment prices haven't been updated since ${mostRecent}. Projections and trajectory arrows may be inaccurate.`,
          action: 'Update assets', actionNav: 'money',
          dismissKey: `nw-stale-${thisMonth}`,
          color: T.sky,
        });
      }
    }
  }

  // ── 10. Expense anomaly detector ─────────────────────────────────────────
  // Compares each category's current month spend against 3-month trailing average.
  // Surfaces the single most anomalous category (2× or more above average).
  // No setup required — emerges purely from logged data.
  if (dayOfMonth >= 7 && (expenses||[]).length >= 10) {
    const cats = [...new Set((expenses||[]).map(e => e.category).filter(Boolean))];
    let worstCat = null, worstRatio = 0;
    cats.forEach(cat => {
      const thisMonthSpend = (expenses||[]).filter(e => e.date?.startsWith(thisMonth) && e.category===cat)
        .reduce((s,e)=>s+Number(e.amount||0),0);
      const projected = monthPct > 0.1 ? thisMonthSpend / monthPct : thisMonthSpend;
      const trailAmts = [1,2,3].map(i => {
        const d = new Date(); d.setMonth(d.getMonth()-i);
        const m = d.toISOString().slice(0,7);
        return (expenses||[]).filter(e=>e.date?.startsWith(m)&&e.category===cat).reduce((s,e)=>s+Number(e.amount||0),0);
      }).filter(x=>x>0);
      if (trailAmts.length < 2) return; // need at least 2 months of history
      const avgTrail = trailAmts.reduce((s,x)=>s+x,0)/trailAmts.length;
      const ratio = avgTrail > 0 ? projected / avgTrail : 0;
      if (ratio >= 2.0 && ratio > worstRatio) { worstRatio = ratio; worstCat = { cat, projected, avgTrail, ratio }; }
    });
    if (worstCat) {
      alerts.push({
        id: `anomaly-${worstCat.cat}-${thisMonth}`, type:'anomaly', severity:'warn',
        title: `${worstCat.cat} is ${worstCat.ratio.toFixed(1)}× above normal`,
        body: `On pace for ~${Math.round(worstCat.projected)} this month vs your ${Math.round(worstCat.avgTrail)} average. Something unusual happened here.`,
        action: 'Review spending', actionNav: 'money',
        dismissKey: `anomaly-${worstCat.cat}-${thisMonth}`,
        color: T.rose,
      });
    }
  }

  // ── 11. POSITIVE: Best savings month upcoming ──────────────────────────────
  if (monthInc > 0 && savRate > 0) {
    // Trailing 3-month average
    const trail = [1,2,3].map(i => {
      const d = new Date(); d.setMonth(d.getMonth()-i);
      const m = d.toISOString().slice(0,7);
      const inc = (incomes||[]).filter(x=>x.date?.startsWith(m)).reduce((s,x)=>s+Number(x.amount||0),0);
      const exp = (expenses||[]).filter(x=>x.date?.startsWith(m)).reduce((s,x)=>s+Number(x.amount||0),0);
      return inc > 0 ? ((inc-exp)/inc)*100 : null;
    }).filter(r=>r!=null);
    const avgSR = trail.length ? trail.reduce((s,r)=>s+r,0)/trail.length : 0;
    if (savRate >= avgSR + 8 && dayOfMonth >= 15) {
      alerts.push({
        id: `savrate-high-${thisMonth}`, type:'positive', severity:'positive',
        title: `On track for best savings month`,
        body: `${savRate.toFixed(1)}% savings rate vs your ${avgSR.toFixed(1)}% average. Adding just a bit more this week could make it a personal record.`,
        action: 'See forecast', actionNav: 'intel',
        dismissKey: `savrate-high-${thisMonth}`,
        color: T.emerald,
      });
    }
  }

  // ── 12. POSITIVE: Habit streak milestone ─────────────────────────────────
  (habits||[]).forEach(h => {
    const streak = getStreak(h.id, habitLogs);
    const logs   = (habitLogs[h.id]||[]);
    const doneToday = logs.includes(today_);
    if (doneToday && [7,14,21,30,60,90,100].includes(streak)) {
      alerts.push({
        id: `streak-milestone-${h.id}-${streak}`, type:'positive', severity:'positive',
        title: `${h.emoji||'🔥'} ${streak}-day streak on "${h.name}"`,
        body: `This is a significant milestone. Habits at ${streak} days are significantly more likely to stick permanently.`,
        action: null,
        dismissKey: `streak-milestone-${h.id}-${streak}`,
        color: T.emerald,
      });
    }
  });

  // Sort: urgent first, then warn, positive last, then info
  const ORDER = { urgent:0, warn:1, positive:2, info:3 };
  return [...alerts].sort((a,b) => (ORDER[a.severity]||3) - (ORDER[b.severity]||3));
}

// ── SMART ALERTS BUTTON — Step 3 rebuilt ─────────────────────────────────────
// Now shows the top alert title inline when urgent/warn alerts exist.
// Dismissed alerts tracked in localStorage per-day so they stop reappearing.
function SmartAlertsButton({ alerts, onNav, onModal }) {
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useLocalStorage('los_alerts_dismissed', {});

  // Filter out today-dismissed alerts
  const active = alerts.filter(a => !dismissed[a.dismissKey]);
  const urgent = active.filter(a => a.severity === 'urgent' || a.severity === 'warn');
  const positive = active.filter(a => a.severity === 'positive');
  const top = urgent[0] || positive[0] || null;

  const dismiss = (dismissKey, e) => {
    e?.stopPropagation();
    setDismissed(prev => ({ ...prev, [dismissKey]: today() }));
  };

  // Clean up old dismiss keys (older than today)
  useEffect(() => {
    const today_ = today();
    setDismissed(prev => {
      const clean = {};
      Object.entries(prev).forEach(([k,v]) => { if (v === today_) clean[k] = v; });
      return clean;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const SEV_COLOR = { urgent: T.rose, warn: T.amber, positive: T.emerald, info: T.sky };

  if (!active.length) return (
    <button style={{ padding:'5px 7px', borderRadius:7, background:'transparent', border:'1px solid transparent', color:T.textMuted, display:'flex', alignItems:'center', justifyContent:'center' }} title="No alerts">
      <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
    </button>
  );

  return (
    <div style={{ position:'relative' }}>
      {/* Bell + inline top-alert preview */}
      <button onClick={()=>setOpen(v=>!v)}
        style={{ display:'flex', alignItems:'center', gap:6, padding:'4px 8px', borderRadius:7, background:open?`${SEV_COLOR[top?.severity]||T.amber}18`:`${SEV_COLOR[top?.severity]||T.amber}10`, border:`1px solid ${open?SEV_COLOR[top?.severity]||T.amber:SEV_COLOR[top?.severity]||T.amber}33`, color:SEV_COLOR[top?.severity]||T.amber, transition:'all 0.15s', cursor:'pointer' }}
        title={`${active.length} alert${active.length>1?'s':''}`}>
        <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
        {/* Inline preview of top alert — visible even before clicking */}
        {top && !open && (
          <span style={{ fontSize:9, fontFamily:T.fM, maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontWeight:600 }}>
            {top.title}
          </span>
        )}
        <span style={{ width:14, height:14, borderRadius:'50%', background:SEV_COLOR[top?.severity]||T.amber, display:'flex', alignItems:'center', justifyContent:'center', fontSize:7, fontFamily:T.fM, fontWeight:700, color:T.bg, flexShrink:0 }}>{active.length}</span>
      </button>

      {/* Dropdown panel */}
      {open && (
        <>
          <div onClick={()=>setOpen(false)} style={{ position:'fixed', inset:0, zIndex:498 }} />
          <div style={{ position:'absolute', top:'calc(100% + 8px)', right:0, width:340, background:T.bg2, border:`1px solid ${T.borderLit}`, borderRadius:14, boxShadow:`0 16px 48px rgba(0,0,0,0.55)`, zIndex:499, animation:'slideDown 0.18s ease', overflow:'hidden' }}>
            <div style={{ padding:'10px 14px', borderBottom:`1px solid ${T.border}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <span style={{ fontSize:9, fontFamily:T.fM, color:T.text, letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:700 }}>
                {urgent.length > 0 ? `⚠️ ${urgent.length} action${urgent.length>1?'s':''} needed` : `✅ All clear · ${positive.length} positive`}
              </span>
              {active.length > 0 && (
                <button onClick={()=>{ active.forEach(a=>dismiss(a.dismissKey)); setOpen(false); }} style={{ fontSize:9, fontFamily:T.fM, color:T.textSub, background:'none', border:'none', cursor:'pointer' }}>
                  Dismiss all
                </button>
              )}
            </div>
            <div style={{ padding:'6px 0', maxHeight:380, overflowY:'auto' }}>
              {active.map((a,i)=>(
                <div key={a.id} style={{ padding:'10px 14px', borderBottom:i<active.length-1?`1px solid ${T.border}`:'none', background: a.severity==='positive'?`${T.emerald}06`:'' }}>
                  <div style={{ display:'flex', alignItems:'flex-start', gap:8 }}>
                    <div style={{ width:3, borderRadius:2, alignSelf:'stretch', flexShrink:0, background:SEV_COLOR[a.severity]||T.border, minHeight:36 }} />
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:6, marginBottom:3 }}>
                        <div style={{ fontSize:11, fontFamily:T.fD, fontWeight:700, color:T.text, lineHeight:1.3 }}>{a.title}</div>
                        <button onClick={(e)=>dismiss(a.dismissKey,e)} style={{ fontSize:11, color:T.textMuted, background:'none', border:'none', cursor:'pointer', flexShrink:0, lineHeight:1, padding:'1px 3px' }}>×</button>
                      </div>
                      <div style={{ fontSize:10, fontFamily:T.fM, color:T.textSub, lineHeight:1.5, marginBottom: a.action?8:0 }}>{a.body}</div>
                      {a.action && (
                        <button onClick={()=>{ if(a.actionModal&&onModal) onModal(a.actionModal); else if(a.actionNav&&onNav) onNav(a.actionNav); setOpen(false); }}
                          style={{ padding:'4px 12px', borderRadius:99, background:`${SEV_COLOR[a.severity]||T.accent}18`, border:`1px solid ${SEV_COLOR[a.severity]||T.accent}33`, fontSize:9, fontFamily:T.fM, color:SEV_COLOR[a.severity]||T.accent, cursor:'pointer', fontWeight:600, transition:'all 0.12s' }}
                          onMouseEnter={e=>{e.currentTarget.style.background=`${SEV_COLOR[a.severity]||T.accent}30`;}}
                          onMouseLeave={e=>{e.currentTarget.style.background=`${SEV_COLOR[a.severity]||T.accent}18`;}}>
                          {a.action} →
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── PROPTYPES (must appear after all const components are initialized) ─────────
if (typeof PropTypes !== 'undefined') {
  // UI primitives
  GlassCard.propTypes    = { children: PropTypes.node, style: PropTypes.object, className: PropTypes.string, onClick: PropTypes.func };
  Badge.propTypes        = { children: PropTypes.node, color: PropTypes.string };
  ProgressBar.propTypes  = { pct: PropTypes.number, color: PropTypes.string, height: PropTypes.number };
  Btn.propTypes          = { children: PropTypes.node, onClick: PropTypes.func, color: PropTypes.string, disabled: PropTypes.bool, full: PropTypes.bool, style: PropTypes.object };
  Modal.propTypes        = { open: PropTypes.bool, onClose: PropTypes.func, title: PropTypes.string, children: PropTypes.node, wide: PropTypes.bool };
  // Feature components
  HabitHeatmap.propTypes = { habitLogs: PropTypes.object.isRequired, habits: PropTypes.array.isRequired };
  SmartAlertsButton.propTypes = { alerts: PropTypes.array.isRequired };
  // Navigation
  BottomNav.propTypes    = { active: PropTypes.string.isRequired, onNav: PropTypes.func.isRequired };
  Sidebar.propTypes      = { active: PropTypes.string.isRequired, onNav: PropTypes.func.isRequired, userName: PropTypes.string };
  // Shared data shape (used by all pages)
  const dataPropType     = PropTypes.shape({ expenses:PropTypes.array, incomes:PropTypes.array, habits:PropTypes.array, habitLogs:PropTypes.object, settings:PropTypes.object.isRequired, computed:PropTypes.object.isRequired });
  const actionsPropType  = PropTypes.shape({ addExpense:PropTypes.func, addIncome:PropTypes.func, addHabit:PropTypes.func });
  HomePage.propTypes     = { data: dataPropType.isRequired, actions: actionsPropType.isRequired, onNav: PropTypes.func.isRequired };
  MoneyPage.propTypes    = { data: dataPropType.isRequired, actions: actionsPropType.isRequired };
  HealthPage.propTypes   = { data: dataPropType.isRequired, actions: actionsPropType.isRequired };
  GrowthPage.propTypes   = { data: dataPropType.isRequired, actions: actionsPropType.isRequired };
  KnowledgePage.propTypes= { data: dataPropType.isRequired, actions: actionsPropType.isRequired };
  IntelligencePage.propTypes = { data: dataPropType.isRequired };
  SettingsPage.propTypes = { data: dataPropType.isRequired, actions: actionsPropType.isRequired };
  CareerPage.propTypes   = { data: dataPropType.isRequired, actions: actionsPropType.isRequired };
}

// ══════════════════════════════════════════════════════════════════════════════
// ── HOME PAGE ─────────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
// ── ERROR BOUNDARY ────────────────────────────────────────────────────────────
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, info) { console.error('[LifeOS ErrorBoundary]', error, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding:40, textAlign:'center', animation:'fadeUp 0.4s ease' }}>
          <div style={{ fontSize:32, marginBottom:16 }}>⚠️</div>
          <div style={{ fontSize:14, fontFamily:T.fD, fontWeight:700, color:T.text, marginBottom:8 }}>Something went wrong in this section</div>
          <div style={{ fontSize:11, fontFamily:T.fM, color:T.textSub, marginBottom:20, maxWidth:360, margin:'0 auto 20px' }}>
            {this.state.error?.message || 'An unexpected error occurred.'}
          </div>
          <button onClick={()=>this.setState({hasError:false,error:null})} style={{ padding:'8px 20px', borderRadius:T.r, background:T.accentDim, border:`1px solid ${T.accent}44`, color:T.accent, fontFamily:T.fM, fontSize:11, cursor:'pointer' }}>
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function HomePage({ data, actions, onNav }) {
  const {expenses=[], incomes=[], assets=[], investments=[], debts=[], habits=[], habitLogs={}, goals=[], vitals=[], totalXP=0, settings={}, notes=[], budgets={}, bills=[]} = data;
  const [modal, setModal] = useState(null);
  const [showDecision, setShowDecision] = useState(false);
  const [focusMode, setFocusMode] = useLocalStorage('los_focus_mode', false);
  const [simulateOpen, setSimulateOpen] = useState(false);
  const [showMoodBanner, setShowMoodBanner] = useState(() => !(vitals||[]).some(v=>v.date===today()));
  const [quickMood, setQuickMood] = useState(null); // 1-5 quick mood tap
  const [weeklyFocusEdit, setWeeklyFocusEdit] = useState(false);
  // Stored Weekly AI Brief
  const [storedBrief, setStoredBrief] = useLocalStorage('los_weekly_brief', { week:'', content:'', loading:false });
  const currentWeek = (() => { const d=new Date(); const jan1=new Date(d.getFullYear(),0,1); return `${d.getFullYear()}-W${Math.ceil(((d-jan1)/86400000+jan1.getDay()+1)/7)}`; })();
  const briefOutdated = storedBrief.week !== currentWeek;
  const weeklyFocus = settings.weeklyFocus || ['','',''];
  const cur = settings.currency || '$'; const thisMonth = today().slice(0,7);
  const hour = new Date().getHours();
  const greeting = hour<12?'Good morning':hour<17?'Good afternoon':'Good evening';
  // Use pre-computed values from App root (no duplicate reduce loops)
  const { monthExp, monthInc, invVal, assetVal, debtVal, nw: netWorth, savRate } = data.computed;
  const fhsDetail = useMemo(()=>{
    const mdp = (debts||[]).reduce((a,d)=>a+Number(d.minPayment||0),0);
    const dti = monthInc>0?(mdp/monthInc)*100:50;
    const cash = (assets||[]).filter(a=>a.type==='Cash').reduce((a,x)=>a+Number(x.value||0),0);
    const ef = monthExp>0?cash/monthExp:0;
    const savScore = Math.round(Math.min(30, savRate*1.5));
    const dtiScore = Math.round(Math.max(0, 25-dti*0.5));
    const efScore  = Math.round(Math.min(25, ef*4.2));
    const nwScore  = netWorth>0?Math.round(Math.min(20,10+(netWorth/10000)*5)):0;
    const total = Math.max(0,Math.min(100, savScore+dtiScore+efScore+nwScore));
    return { total, savScore, savMax:30, dtiScore, dtiMax:25, efScore, efMax:25, nwScore, nwMax:20, dti:dti.toFixed(1), ef:ef.toFixed(1) };
  },[savRate,debts,assets,monthInc,monthExp,netWorth]);
  const fhs = fhsDetail.total;
  const level = Math.floor(Math.sqrt(Number(totalXP)/100))+1;
  const xpForNext = Math.pow(level,2)*100; const xpForCurrent = Math.pow(level-1,2)*100;
  const xpPct = ((Number(totalXP)-xpForCurrent)/(xpForNext-xpForCurrent))*100;
  const todayDone = (habits||[]).filter(h=>(habitLogs[h.id]||[]).includes(today())).length;
  const bestStreak = (habits||[]).reduce((max,h)=>{ const s=getStreak(h.id,habitLogs); return s>max?s:max; },0);
  const lastVitals = (vitals||[]).length ? [...vitals].sort((a,b)=>a.date<b.date?1:-1)[0] : null;
  const recentEvents = useMemo(()=>{
    const evs = [];
    [...expenses].sort((a,b)=>a.date<b.date?1:-1).slice(0,3).forEach(e=>evs.push({ id:'exp-'+e.id, ts:e.date, title:e.note||e.category, sub:e.category, value:`-${cur}${fmtN(e.amount)}`, cat:'expense', color:T.rose }));
    [...incomes].sort((a,b)=>a.date<b.date?1:-1).slice(0,2).forEach(e=>evs.push({ id:'inc-'+e.id, ts:e.date, title:e.note||'Income', sub:'Income logged', value:`+${cur}${fmtN(e.amount)}`, cat:'income', color:T.emerald }));
    (habits||[]).forEach(h=>{ const logs=(habitLogs[h.id]||[]); const d=logs.includes(today())?today():logs[logs.length-1]; if(d) evs.push({ id:'hab-'+h.id, ts:d, title:h.name, sub:`🔥 ${getStreak(h.id,habitLogs)} day streak`, value:'+XP', cat:'habit', color:T.accent }); });
    if(lastVitals) evs.push({ id:'vit-0', ts:lastVitals.date, title:'Vitals Logged', sub:`Sleep ${lastVitals.sleep}h · Mood ${lastVitals.mood}/10`, value:'❤️', cat:'health', color:T.sky });
    return evs.sort((a,b)=>a.ts<b.ts?1:-1).slice(0,6);
  },[expenses,incomes,habits,habitLogs,lastVitals,cur]);

  const [dismissed, setDismissed] = useLocalStorage('los_alerts_dismissed', {});
  // Clean up dismissed keys older than today on mount
  useEffect(() => {
    const today_ = today();
    setDismissed(prev => {
      const clean = {};
      Object.entries(prev||{}).forEach(([k,v]) => { if (v === today_) clean[k] = v; });
      return clean;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const dismissAlert  = (key) => setDismissed(prev => ({ ...prev, [key]: today() }));
  const dismissAllAlerts = (alerts) => setDismissed(prev => {
    const next = { ...prev };
    alerts.forEach(a => { next[a.dismissKey] = today(); });
    return next;
  });

  const QUICK_ACTIONS = [
    { label:'Log Expense', emoji:'💳', modal:'expense' }, { label:'Log Income', emoji:'💰', modal:'income' },
    { label:'Log Habit',   emoji:'🔥', modal:'habit'   }, { label:'Log Vitals', emoji:'❤️', modal:'vitals' },
    { label:'Add Note',    emoji:'📝', modal:'note'    }, { label:'Add Goal',   emoji:'🎯', modal:'goal'   },
  ];

  return (
    <div style={{ animation:'fadeUp 0.4s ease' }}>
      <LogExpenseModal open={modal==='expense'} onClose={()=>setModal(null)} onSave={e=>{actions.addExpense(e);setModal(null);}} />
      <LogIncomeModal open={modal==='income'} onClose={()=>setModal(null)} onSave={e=>{actions.addIncome(e);setModal(null);}} />
      <LogHabitModal open={modal==='habit'} onClose={()=>setModal(null)} habits={habits} habitLogs={habitLogs} onLog={actions.logHabit} onAddHabit={actions.addHabit} />
      <LogVitalsModal open={modal==='vitals'} onClose={()=>setModal(null)} onSave={e=>{actions.addVitals(e);setModal(null);}} />
      <AddNoteModal open={modal==='note'} onClose={()=>setModal(null)} onSave={e=>{actions.addNote(e);setModal(null);}} />
      <AddGoalModal open={modal==='goal'} onClose={()=>setModal(null)} onSave={e=>{actions.addGoal(e);setModal(null);}} />
      {showMoodBanner && (
        <div style={{ marginBottom:14, borderRadius:T.rL, background:`linear-gradient(135deg,${T.sky}0e,${T.violet}0a)`, border:`1px solid ${T.sky}33`, overflow:'hidden', animation:'fadeUp 0.3s ease' }}>
          {quickMood === null ? (
            <div style={{ padding:'14px 18px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ fontSize:20 }}>☀️</span>
                <div>
                  <div style={{ fontSize:12, fontFamily:T.fD, fontWeight:700, color:T.text }}>Daily Check-in</div>
                  <div style={{ fontSize:10, fontFamily:T.fM, color:T.textSub, marginTop:2 }}>How are you feeling right now?</div>
                </div>
              </div>
              <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                {[['😩','1',T.rose],['😕','2',T.amber],['😐','3',T.textSub],['🙂','4',T.sky],['😄','5',T.emerald]].map(([emoji, val, color]) => (
                  <button key={val} onClick={()=>setQuickMood(Number(val))} style={{ width:38, height:38, borderRadius:10, background:T.surface, border:`1px solid ${T.border}`, fontSize:20, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', transition:'all 0.15s' }}
                    onMouseEnter={e=>{e.currentTarget.style.background=color+'22';e.currentTarget.style.borderColor=color+'66';e.currentTarget.style.transform='scale(1.15)';}}
                    onMouseLeave={e=>{e.currentTarget.style.background=T.surface;e.currentTarget.style.borderColor=T.border;e.currentTarget.style.transform='scale(1)';}}>
                    {emoji}
                  </button>
                ))}
                <button onClick={()=>setShowMoodBanner(false)} style={{ fontSize:9, fontFamily:T.fM, color:T.textMuted, padding:'4px 10px', borderRadius:6, background:T.surface, border:`1px solid ${T.border}`, marginLeft:4, cursor:'pointer' }}>Later</button>
              </div>
            </div>
          ) : (
            <div style={{ padding:'14px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ fontSize:22 }}>{['😩','😕','😐','🙂','😄'][quickMood-1]}</span>
                <div>
                  <div style={{ fontSize:12, fontFamily:T.fD, fontWeight:700, color:T.text }}>Mood: {quickMood}/5 — {['Rough day','Below average','Neutral','Pretty good','Excellent!'][quickMood-1]}</div>
                  <div style={{ fontSize:10, fontFamily:T.fM, color:T.textSub }}>Log full vitals for sleep & energy too.</div>
                </div>
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <Btn onClick={()=>{ actions.addVitals({ id:Date.now(), date:today(), mood:quickMood*2, sleep:0, energy:quickMood*2, weight:'', steps:'', note:'Quick check-in' }); setShowMoodBanner(false); }} color={T.sky} style={{ padding:'5px 14px' }}>Save Quick</Btn>
                <Btn onClick={()=>{ setModal('vitals'); setShowMoodBanner(false); }} color={T.violet} style={{ padding:'5px 14px' }}>Full Log</Btn>
              </div>
            </div>
          )}
        </div>
      )}
      <LogDecisionModal open={showDecision} onClose={()=>setShowDecision(false)} onSave={d=>{actions.addDecision(d);setShowDecision(false);}} />
      <SimulateDecisionModal open={simulateOpen} onClose={()=>setSimulateOpen(false)} data={data} />
      <div style={{ marginBottom:26 }}>
        <div style={{ fontSize:10, fontFamily:T.fM, color:T.textSub, letterSpacing:'0.1em', marginBottom:5, textTransform:'uppercase' }}>{greeting.toUpperCase()} · {new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})}</div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', flexWrap:'wrap', gap:8 }}>
          <h1 style={{ fontSize:26, fontFamily:T.fD, fontWeight:800, color:T.text }}>Command Center</h1>
          <div style={{ display:'flex', gap:6, alignItems:'center' }}>
            <button onClick={()=>setFocusMode(v=>!v)}
              style={{ display:'flex', alignItems:'center', gap:5, padding:'4px 12px', borderRadius:99, fontSize:9, fontFamily:T.fM, fontWeight:700, cursor:'pointer', transition:'all 0.15s', background:focusMode?T.accentDim:T.surface, border:`1px solid ${focusMode?T.accent+'55':T.border}`, color:focusMode?T.accent:T.textSub }}
              title="Focus Mode — see only what matters today">
              {focusMode ? '⊙ Focus' : '○ Focus'}
            </button>
            <button onClick={()=>setSimulateOpen(true)}
              style={{ display:'flex', alignItems:'center', gap:5, padding:'4px 12px', borderRadius:99, fontSize:9, fontFamily:T.fM, fontWeight:700, cursor:'pointer', background:T.violetDim, border:`1px solid ${T.violet}33`, color:T.violet }}>
              ⚡ Simulate
            </button>
          </div>
        </div>
        <div style={{ fontSize:11, fontFamily:T.fM, color:T.textSub, marginTop:6, display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
          {settings.name?<span>Welcome back, {settings.name}</span>:null}
          <LifePulseChip pulse={computeLifePulse({ expenses, incomes, habits, habitLogs, vitals, goals, assets, investments, debts, settings })} />
          <span style={{ color:T.emerald }}>●</span><span>{(habits||[]).length} habits</span>
          <span style={{ color:T.accent }}>●</span><span>NW {cur}{fmtN(netWorth)}</span>
          <span style={{ color:T.textMuted, cursor:'pointer' }} onClick={()=>{}}>⌘K search</span>
          <button onClick={()=>setShowDecision(true)} style={{ fontSize:9, fontFamily:T.fM, color:T.violet, background:T.violetDim, border:'1px solid '+T.violet+'33', borderRadius:99, padding:'2px 10px', cursor:'pointer' }}>+ Log decision</button>
        </div>
      </div>

      {/* ── Focus Mode — collapsed view showing only what matters today ─── */}
      {focusMode && (() => {
        const todayDoneHabits = (habits||[]).filter(h=>(habitLogs[h.id]||[]).includes(today()));
        const pendingHabits   = (habits||[]).filter(h=>!(habitLogs[h.id]||[]).includes(today()));
        const todayVitals     = (vitals||[]).some(v=>v.date===today());
        const urgentBills     = (bills||[]).filter(b=>!b.paid&&b.nextDate&&Math.round((new Date(b.nextDate)-new Date())/86400000)<=3);
        const pulse           = computeLifePulse({ expenses, incomes, habits, habitLogs, vitals, goals, assets, investments, debts, settings });
        return (
          <div style={{ marginBottom:18, animation:'fadeUp 0.3s ease' }}>
            <GlassCard style={{ padding:'20px 24px', border:`1px solid ${T.accent}33`, background:`linear-gradient(135deg,${T.accent}06,transparent)` }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                <div style={{ fontSize:9, fontFamily:T.fM, color:T.accent, letterSpacing:'0.14em', textTransform:'uppercase', fontWeight:700 }}>⊙ Focus Mode</div>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontSize:9, fontFamily:T.fM, color:T.textSub }}>Life Pulse</span>
                  <span style={{ fontSize:18, fontFamily:T.fD, fontWeight:800, color: pulse.total>=70?T.emerald:pulse.total>=50?T.accent:T.amber }}>{pulse.total}</span>
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:10, marginBottom:16 }}>
                {/* Habits left */}
                <div style={{ padding:'12px 14px', borderRadius:T.r, background: pendingHabits.length===0?T.emeraldDim:T.surface, border:`1px solid ${pendingHabits.length===0?T.emerald+'44':T.border}` }}>
                  <div style={{ fontSize:8, fontFamily:T.fM, color:T.textSub, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:5 }}>Habits today</div>
                  <div style={{ fontSize:20, fontFamily:T.fD, fontWeight:700, color:pendingHabits.length===0?T.emerald:T.accent }}>
                    {todayDoneHabits.length}/{(habits||[]).length}
                  </div>
                  <div style={{ fontSize:9, fontFamily:T.fM, color:T.textSub, marginTop:2 }}>
                    {pendingHabits.length===0?'All done 🎉':pendingHabits.slice(0,2).map(h=>h.emoji||'🔥'+' '+h.name).join(' · ')}
                  </div>
                </div>
                {/* Vitals logged */}
                <div style={{ padding:'12px 14px', borderRadius:T.r, background:todayVitals?T.emeraldDim:T.surface, border:`1px solid ${todayVitals?T.emerald+'44':T.border}` }}>
                  <div style={{ fontSize:8, fontFamily:T.fM, color:T.textSub, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:5 }}>Vitals</div>
                  <div style={{ fontSize:20, fontFamily:T.fD, fontWeight:700, color:todayVitals?T.emerald:T.textSub }}>{todayVitals?'✓ Logged':'Not yet'}</div>
                  {!todayVitals && <button onClick={()=>setModal('vitals')} style={{ fontSize:9, fontFamily:T.fM, color:T.sky, background:'none', border:'none', cursor:'pointer', marginTop:4 }}>Log now →</button>}
                </div>
                {/* Net worth */}
                <div style={{ padding:'12px 14px', borderRadius:T.r, background:T.surface, border:`1px solid ${T.border}` }}>
                  <div style={{ fontSize:8, fontFamily:T.fM, color:T.textSub, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:5 }}>Net Worth</div>
                  <div style={{ fontSize:17, fontFamily:T.fD, fontWeight:700, color:T.accent }}>{cur}{fmtN(netWorth)}</div>
                </div>
                {/* Savings rate */}
                <div style={{ padding:'12px 14px', borderRadius:T.r, background:T.surface, border:`1px solid ${T.border}` }}>
                  <div style={{ fontSize:8, fontFamily:T.fM, color:T.textSub, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:5 }}>Savings rate</div>
                  <div style={{ fontSize:17, fontFamily:T.fD, fontWeight:700, color:savRate>=20?T.emerald:T.amber }}>{savRate.toFixed(1)}%</div>
                </div>
              </div>
              {/* Pending habits quick-log */}
              {pendingHabits.length > 0 && (
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  {pendingHabits.slice(0,5).map(h=>(
                    <button key={h.id} onClick={()=>actions.logHabit(h.id)}
                      style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 14px', borderRadius:99, background:T.accentDim, border:`1px solid ${T.accent}33`, fontSize:10, fontFamily:T.fM, color:T.accent, cursor:'pointer', transition:'all 0.15s' }}
                      onMouseEnter={e=>{e.currentTarget.style.background=T.accent+'30';}}
                      onMouseLeave={e=>{e.currentTarget.style.background=T.accentDim;}}>
                      {h.emoji||'🔥'} {h.name}
                    </button>
                  ))}
                </div>
              )}
              {urgentBills.length > 0 && (
                <div style={{ marginTop:10, padding:'8px 12px', borderRadius:T.r, background:T.amberDim, border:`1px solid ${T.amber}33`, fontSize:10, fontFamily:T.fM, color:T.amber }}>
                  ⏰ {urgentBills.length} bill{urgentBills.length>1?'s':''} due soon: {urgentBills.map(b=>b.name).join(', ')}
                </div>
              )}
            </GlassCard>
          </div>
        );
      })()}

      {/* When in Focus Mode, skip everything else */}
      {!focusMode && (<>
      {/* ── Step 1: Daily Brief — the front door of the "what's about to happen" shift */}
      <DailyBriefCard data={data} onNav={onNav} onModal={setModal} />
      {/* UX Fix 4: Empty-state guidance strip — shown only when the user has no data
          at all. Each pill disappears once its domain has at least one entry.
          Avoids the "six zeroes and silence" problem on a fresh install. */}
      {(() => {
        const steps = [
          { done: (expenses||[]).length > 0 || (incomes||[]).length > 0, emoji:'💳', label:'Log your first expense or income', modal:'expense', color:T.rose },
          { done: (habits||[]).length > 0,                          emoji:'🔥', label:'Create a habit to track',          modal:'habit',   color:T.accent },
          { done: (vitals||[]).some(v=>v.date===today()),           emoji:'❤️', label:'Log today\'s vitals',              modal:'vitals',  color:T.sky },
          { done: (assets||[]).length > 0 || (investments||[]).length > 0,emoji:'💎', label:'Add an asset to track net worth', modal:null,      color:T.violet, nav:'money' },
        ];
        const remaining = steps.filter(s => !s.done);
        if (!remaining.length) return null;
        return (
          <div style={{ marginBottom:18, padding:'14px 18px', borderRadius:T.rL, background:`linear-gradient(135deg,${T.accent}06,${T.violet}04)`, border:`1px solid ${T.accent}22`, animation:'fadeUp 0.35s ease' }}>
            <div style={{ fontSize:9, fontFamily:T.fM, color:T.accent, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:10 }}>Get started — {remaining.length} step{remaining.length>1?'s':''} remaining</div>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {remaining.map((s,i) => (
                <button key={i} onClick={()=> s.modal ? setModal(s.modal) : onNav(s.nav||'money')}
                  style={{ display:'flex', alignItems:'center', gap:7, padding:'7px 14px', borderRadius:99, background:`${s.color}10`, border:`1px solid ${s.color}33`, fontSize:11, fontFamily:T.fM, color:s.color, cursor:'pointer', transition:'all 0.15s', whiteSpace:'nowrap' }}
                  onMouseEnter={e=>{e.currentTarget.style.background=`${s.color}22`;e.currentTarget.style.transform='translateY(-1px)';}}
                  onMouseLeave={e=>{e.currentTarget.style.background=`${s.color}10`;e.currentTarget.style.transform='none';}}>
                  <span>{s.emoji}</span> {s.label} <span style={{ opacity:0.5 }}>→</span>
                </button>
              ))}
            </div>
          </div>
        );
      })()}
      {/* ── Step 2: Trajectory-aware stat cards ─────────────────────────────── */}
      {(()=>{
        // ── Compute trajectories from historical data ─────────────────────────
        // Net worth: monthly delta from NW history snapshots
        const nwHist = data.netWorthHistory || [];
        const nwMonthlyDelta = nwHist.length >= 2
          ? (nwHist[nwHist.length-1].value - nwHist[nwHist.length-2].value)
          : null;
        const nwProj90 = nwMonthlyDelta != null ? Math.round(netWorth + nwMonthlyDelta * 3) : null;

        // Savings rate: compare this month vs 3-month trailing average
        const trailSavRates = [1,2,3].map(i => {
          const d = new Date(); d.setMonth(d.getMonth()-i);
          const m = d.toISOString().slice(0,7);
          const inc = (incomes||[]).filter(x=>x.date?.startsWith(m)).reduce((s,x)=>s+Number(x.amount||0),0);
          const exp = (expenses||[]).filter(x=>x.date?.startsWith(m)).reduce((s,x)=>s+Number(x.amount||0),0);
          return inc > 0 ? ((inc-exp)/inc)*100 : null;
        }).filter(r => r !== null);
        const avgSavRate   = trailSavRates.length ? trailSavRates.reduce((s,r)=>s+r,0)/trailSavRates.length : null;
        const savRateDelta = avgSavRate != null ? savRate - avgSavRate : null;

        // XP: compare last 30 days vs prior 30 days
        const now30 = new Date(); now30.setDate(now30.getDate()-30);
        const now60 = new Date(); now60.setDate(now60.getDate()-60);
        const xpLogs30 = Object.values(habitLogs).flat().filter(d => d >= now30.toISOString().slice(0,10)).length;
        const xpLogs60 = Object.values(habitLogs).flat().filter(d => d >= now60.toISOString().slice(0,10) && d < now30.toISOString().slice(0,10)).length;
        const xpTrend  = xpLogs60 > 0 ? ((xpLogs30 - xpLogs60) / xpLogs60) * 100 : null;

        // Financial Health: month-over-month
        const prevM = (() => { const d = new Date(); d.setMonth(d.getMonth()-1); return d.toISOString().slice(0,7); })();
        const prevInc = (incomes||[]).filter(i=>i.date?.startsWith(prevM)).reduce((s,i)=>s+Number(i.amount||0),0);
        const prevExp = (expenses||[]).filter(e=>e.date?.startsWith(prevM)).reduce((s,e)=>s+Number(e.amount||0),0);
        const prevSavRate = prevInc > 0 ? ((prevInc-prevExp)/prevInc)*100 : 0;
        const fhsTrend = fhs - (prevSavRate > 0 ? Math.min(100, Math.round(prevSavRate*1.5)) : fhs);

        // ── Arrow helper ──────────────────────────────────────────────────────
        const Arrow = ({ delta, fmt, suffix='', invert=false }) => {
          if (delta == null || Math.abs(delta) < 0.5) return (
            <span style={{ fontSize:9, fontFamily:T.fM, color:T.textSub, display:'inline-flex', alignItems:'center', gap:2 }}>
              → stable
            </span>
          );
          const up      = invert ? delta < 0 : delta > 0;
          const color   = up ? T.emerald : T.rose;
          const arrow   = delta > 0 ? '↑' : '↓';
          const display = fmt ? fmt(Math.abs(delta)) : `${Math.abs(delta).toFixed(1)}${suffix}`;
          return (
            <span style={{ fontSize:9, fontFamily:T.fM, color, display:'inline-flex', alignItems:'center', gap:2, fontWeight:600 }}>
              {arrow} {display}
              <span style={{ fontSize:8, color, opacity:0.7 }}>vs avg</span>
            </span>
          );
        };

        // ── Projection chip ───────────────────────────────────────────────────
        const ProjChip = ({ label, color }) => (
          <span style={{ fontSize:8, fontFamily:T.fM, color, background:color+'14', border:`1px solid ${color}30`, borderRadius:99, padding:'1px 7px', whiteSpace:'nowrap' }}>
            {label}
          </span>
        );

        const cards = [
          {
            label:'Net Worth', icon:'💎', color:T.accent,
            value:`${cur}${fmtN(netWorth)}`,
            sub:`Assets ${cur}${fmtN(assetVal+invVal)} · Debts ${cur}${fmtN(debtVal)}`,
            arrow: <Arrow delta={nwMonthlyDelta} fmt={d=>`${cur}${fmtN(Math.round(d))}/mo`} />,
            proj:  nwProj90 != null ? <ProjChip label={`90d → ${cur}${fmtN(nwProj90)}`} color={nwProj90 >= netWorth ? T.emerald : T.rose} /> : null,
            pct:   null,
          },
          {
            label:'Financial Health', icon:'📊', color:T.emerald,
            value:`${fhs}/100`,
            sub:fhs>=70?'Strong finances':fhs>=40?'Room to improve':'Needs attention',
            arrow: <Arrow delta={fhsTrend} suffix=' pts' />,
            proj:  <ProjChip label={fhs>=70?'On track':'Improve savings rate'} color={fhs>=70?T.emerald:T.amber} />,
            pct:   fhs, detail: fhsDetail,
          },
          {
            label:`Life XP — Lv ${level}`, icon:'⚡', color:T.violet,
            value:`${Number(totalXP).toLocaleString()} XP`,
            sub:`${Math.round(xpForNext-Number(totalXP))} XP to Lv ${level+1}`,
            arrow: xpTrend != null ? <Arrow delta={xpTrend} suffix='%' fmt={d=>`${d.toFixed(0)}% more active`} /> : null,
            proj:  <ProjChip label={xpLogs30 > xpLogs60 ? '↑ More active than last month' : xpLogs30 < xpLogs60 ? '↓ Less active than last month' : '→ Same pace'} color={xpLogs30 >= xpLogs60 ? T.violet : T.textSub} />,
            pct:   xpPct,
          },
          {
            label:'Savings Rate', icon:'🎯', color:T.sky,
            value:`${savRate.toFixed(1)}%`,
            sub:`${cur}${fmtN(Math.max(0,monthInc-monthExp))} saved this month`,
            arrow: <Arrow delta={savRateDelta} suffix=' pts' />,
            proj:  avgSavRate != null ? <ProjChip label={`3-mo avg ${avgSavRate.toFixed(1)}%`} color={savRate >= avgSavRate ? T.emerald : T.amber} /> : null,
            pct:   savRate,
          },
        ];

        return (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(170px,1fr))', gap:12, marginBottom:18 }}>
            {cards.map((m,i)=>(
              <GlassCard key={i} style={{ padding:'18px 20px', animation:`fadeUp 0.4s ease ${i*0.08}s both` }}>
                {/* Label + icon row */}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                  <div style={{ fontSize:9, fontFamily:T.fM, color:T.textSub, letterSpacing:'0.1em', textTransform:'uppercase' }}>{m.label}</div>
                  <span style={{ fontSize:16, opacity:0.7 }}>{m.icon}</span>
                </div>
                {/* Big value */}
                <div style={{ fontSize:20, fontFamily:T.fD, fontWeight:700, color:m.color, lineHeight:1, marginBottom:5 }}>{m.value}</div>
                {/* Sub-label */}
                <div style={{ fontSize:10, fontFamily:T.fM, color:T.textSub, marginBottom:6 }}>{m.sub}</div>
                {/* Trajectory arrow + projection chip */}
                <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap', marginBottom:m.pct!=null?8:0 }}>
                  {m.arrow}
                  {m.proj}
                </div>
                {m.pct!=null && <ProgressBar pct={m.pct} color={m.color} height={4} />}
                {/* Financial Health breakdown */}
                {m.detail && (
                  <div style={{ marginTop:10, display:'flex', flexDirection:'column', gap:4, borderTop:`1px solid ${T.border}`, paddingTop:8 }}>
                    {[
                      { label:'Savings Rate',   score:m.detail.savScore, max:m.detail.savMax, hint:`${savRate.toFixed(0)}%` },
                      { label:'Debt-to-Income', score:m.detail.dtiScore, max:m.detail.dtiMax, hint:`${m.detail.dti}% DTI` },
                      { label:'Emergency Fund', score:m.detail.efScore,  max:m.detail.efMax,  hint:`${m.detail.ef}mo` },
                      { label:'Net Worth',      score:m.detail.nwScore,  max:m.detail.nwMax,  hint:netWorth>0?'Positive':'—' },
                    ].map(sub => (
                      <div key={sub.label}>
                        <div style={{ display:'flex', justifyContent:'space-between', fontSize:9, fontFamily:T.fM, color:T.textSub, marginBottom:2 }}>
                          <span>{sub.label}</span>
                          <span style={{ color:m.color }}>{sub.score}/{sub.max} · {sub.hint}</span>
                        </div>
                        <ProgressBar pct={(sub.score/sub.max)*100} color={m.color} height={3} />
                      </div>
                    ))}
                  </div>
                )}
              </GlassCard>
            ))}
          </div>
        );
      })()}
      {/* Recent Achievements Strip */}
      {(() => {
        const unlocked = ACHIEVEMENTS.filter(a => a.check(data)).slice(-3).reverse();
        if (!unlocked.length) return null;
        return (
          <div style={{ marginBottom:16, display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
            <span style={{ fontSize:9, fontFamily:T.fM, color:T.textMuted, letterSpacing:'0.1em', textTransform:'uppercase', flexShrink:0 }}>Recent badges</span>
            {unlocked.map((a,i) => (
              <div key={a.id} title={`${a.name} — ${a.desc}`} style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 12px', borderRadius:99, background:`${a.color}12`, border:`1px solid ${a.color}33`, animation:`badgeIn 0.3s ease ${i*0.08}s both`, cursor:'default' }}>
                <span style={{ fontSize:15, filter:`drop-shadow(0 0 4px ${a.color}66)` }}>{a.emoji}</span>
                <span style={{ fontSize:10, fontFamily:T.fM, fontWeight:600, color:a.color }}>{a.name}</span>
              </div>
            ))}
            <button onClick={()=>onNav('growth')} style={{ fontSize:9, fontFamily:T.fM, color:T.accent, background:'none', border:'none', cursor:'pointer', marginLeft:'auto' }}>All badges →</button>
          </div>
        );
      })()}

      {/* Weekly Focus Intentions */}
      <GlassCard style={{ padding:'18px 22px', marginBottom:16 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <SectionLabel>This Week's Focus</SectionLabel>
          <button onClick={()=>setWeeklyFocusEdit(e=>!e)} style={{ fontSize:9, fontFamily:T.fM, color:T.accent, padding:'3px 10px', borderRadius:99, background:T.accentDim, border:`1px solid ${T.accent}33` }}>{weeklyFocusEdit?'✓ Done':'Edit'}</button>
        </div>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          {weeklyFocus.map((f,i)=>(
            <div key={i} style={{ flex:1, minWidth:160, position:'relative' }}>
              {weeklyFocusEdit ? (
                <input value={f} onChange={e=>{ const nf=[...weeklyFocus]; nf[i]=e.target.value; actions.updateSettings({...settings, weeklyFocus:nf}); }} placeholder={`Focus ${i+1}…`} style={{ width:'100%', padding:'8px 12px', background:'rgba(255,255,255,0.04)', border:`1px solid ${T.border}`, borderRadius:T.r, fontFamily:T.fM, fontSize:12, color:T.text }} />
              ) : (
                <div style={{ padding:'8px 12px', borderRadius:T.r, background:T.accentLo, border:`1px solid ${T.accent}22`, fontSize:12, fontFamily:T.fM, color:f?T.text:T.textMuted, minHeight:36 }}>{f||`Focus ${i+1} — click Edit`}</div>
              )}
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Budget Overview Widget */}
      {Object.keys(budgets).length>0 && (() => {
        const thisM = today().slice(0,7);
        const budgetStatus = {};
        (expenses||[]).filter(e=>e.date?.startsWith(thisM)).forEach(e=>{ const c=e.category; budgetStatus[c]=(budgetStatus[c]||0)+Number(e.amount||0); });
        const entries = Object.entries(budgets).filter(([,b])=>Number(b)>0).slice(0,4).map(([cat,bud])=>({ cat, bud:Number(bud), spent:budgetStatus[cat]||0 }));
        if (!entries.length) return null;
        return (
          <GlassCard style={{ padding:'18px 22px', marginBottom:16 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <SectionLabel>Budget Remaining</SectionLabel>
              <button onClick={()=>onNav('money')} style={{ fontSize:9, fontFamily:T.fM, color:T.accent }}>Full report →</button>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {entries.map(({cat,bud,spent})=>{ const pct=Math.min(100,(spent/bud)*100); const c=pct>90?T.rose:pct>70?T.amber:T.emerald; return (
                <div key={cat}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, fontFamily:T.fM, marginBottom:4 }}>
                    <span style={{ color:T.text }}>{cat}</span>
                    <span style={{ color:c }}>{cur}{fmtN(bud-spent)} left of {cur}{fmtN(bud)}</span>
                  </div>
                  <ProgressBar pct={pct} color={c} height={5} />
                </div>
              ); })}
            </div>
          </GlassCard>
        );
      })()}

      {/* ── Step 3: Proactive Alerts Panel — action buttons, dismissable, positive included */}
      {(()=>{
        const allAlerts = computeSmartAlerts({ bills, budgets, expenses, habits, habitLogs, vitals, incomes, goals, thisMonth, monthInc: monthInc||0, savRate: savRate||0, netWorth, assets, investments });
        const active = allAlerts.filter(a => !dismissed[a.dismissKey]);
        if (!active.length) return null;
        const SEV_COLOR = { urgent:T.rose, warn:T.amber, positive:T.emerald, info:T.sky };
        const urgent   = active.filter(a=>a.severity==='urgent'||a.severity==='warn');
        const positive = active.filter(a=>a.severity==='positive');
        const borderC  = urgent.length ? T.amber : positive.length ? T.emerald : T.sky;
        return (
          <GlassCard style={{ padding:'18px 22px', marginBottom:16, borderLeft:`3px solid ${borderC}55` }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <SectionLabel style={{ marginBottom:0 }}>{urgent.length ? `⚠️ ${urgent.length} action${urgent.length>1?'s':''} needed` : positive.length ? '🌟 Momentum' : '💡 Insights'}</SectionLabel>
                {active.length > 1 && <span style={{ fontSize:9, fontFamily:T.fM, color:T.textSub }}>{active.length} total</span>}
              </div>
              <button onClick={()=>dismissAllAlerts(active)} style={{ fontSize:9, fontFamily:T.fM, color:T.textSub, background:'none', border:'none', cursor:'pointer' }}>Dismiss all</button>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {active.slice(0,4).map((a,i)=>(
                <div key={a.id} style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'10px 14px', borderRadius:T.r, background:`${SEV_COLOR[a.severity]||T.amber}08`, border:`1px solid ${SEV_COLOR[a.severity]||T.amber}22`, animation:`fadeUp 0.25s ease ${i*0.06}s both` }}>
                  <div style={{ width:3, borderRadius:2, alignSelf:'stretch', flexShrink:0, background:SEV_COLOR[a.severity]||T.amber, minHeight:32 }} />
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:11, fontFamily:T.fD, fontWeight:700, color:T.text, marginBottom:2 }}>{a.title}</div>
                    <div style={{ fontSize:10, fontFamily:T.fM, color:T.textSub, lineHeight:1.5 }}>{a.body}</div>
                  </div>
                  <div style={{ display:'flex', gap:6, flexShrink:0, alignSelf:'center' }}>
                    {a.action && (
                      <button onClick={()=>{ if(a.actionModal) setModal(a.actionModal); else if(a.actionNav) onNav(a.actionNav); }}
                        style={{ padding:'5px 12px', borderRadius:99, background:`${SEV_COLOR[a.severity]||T.accent}18`, border:`1px solid ${SEV_COLOR[a.severity]||T.accent}33`, fontSize:9, fontFamily:T.fM, color:SEV_COLOR[a.severity]||T.accent, cursor:'pointer', fontWeight:600, whiteSpace:'nowrap', transition:'all 0.12s' }}
                        onMouseEnter={e=>{e.currentTarget.style.filter='brightness(1.2)';}}
                        onMouseLeave={e=>{e.currentTarget.style.filter='none';}}>
                        {a.action} →
                      </button>
                    )}
                    <button onClick={()=>dismissAlert(a.dismissKey)}
                      style={{ padding:'5px 7px', borderRadius:99, background:'transparent', border:`1px solid ${T.border}`, fontSize:10, fontFamily:T.fM, color:T.textMuted, cursor:'pointer', lineHeight:1 }}>×</button>
                  </div>
                </div>
              ))}
              {active.length > 4 && (
                <div style={{ fontSize:10, fontFamily:T.fM, color:T.textMuted, textAlign:'center', padding:'4px 0' }}>
                  +{active.length-4} more in the topbar bell →
                </div>
              )}
            </div>
          </GlassCard>
        );
      })()}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(min(340px,100%),1fr))', gap:16 }}>
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {/* Smart Alerts — now rendered in TopBar bell icon (S3) */}
          <GlassCard style={{ padding:'20px 22px' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
              <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                <div style={{ width:5, height:5, borderRadius:'50%', background:'#c084fc', animation:'dotPulse 2s infinite' }} />
                <span style={{ fontSize:9, fontFamily:T.fM, letterSpacing:'0.1em', color:'#c084fc', textTransform:'uppercase' }}>AI Weekly Brief</span>
              </div>
              {settings.aiApiKey && briefOutdated && (() => {
                const generateBrief = async () => {
                  setStoredBrief(b=>({...b, loading:true}));
                  try {
                    const ctx = `Monthly income: ${cur}${fmtN(monthInc)}, expenses: ${cur}${fmtN(monthExp)}, savings rate: ${savRate.toFixed(1)}%, NW: ${cur}${fmtN(netWorth)}, habits done today: ${todayDone}/${(habits||[]).length}, best streak: ${bestStreak}d.`;
                    const text = await callAI(settings, {
                      max_tokens: 250,
                      messages:[{ role:'user', content:`Generate a 3-sentence motivational weekly financial+habits brief for this user. Be specific, warm, and actionable. Data: ${ctx}` }]
                    });
                    setStoredBrief({ week:currentWeek, content:text||'Keep pushing!', loading:false });
                  } catch { setStoredBrief(b=>({...b, loading:false})); }
                };
                return <button onClick={generateBrief} style={{ fontSize:9, fontFamily:T.fM, color:'#c084fc', padding:'2px 8px', borderRadius:6, background:'#c084fc22', border:'1px solid #c084fc33' }}>Refresh</button>;
              })()}
            </div>
            {storedBrief.loading ? (
              <div style={{ fontSize:12, fontFamily:T.fM, color:T.textSub, fontStyle:'italic', padding:'8px 0' }}>Generating your weekly brief…</div>
            ) : storedBrief.content && !briefOutdated ? (
              <div style={{ fontSize:12, fontFamily:T.fM, color:T.text, lineHeight:1.7, borderLeft:`3px solid #c084fc55`, paddingLeft:12 }}>{storedBrief.content}</div>
            ) : (
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
                {[
                  { icon:'💰', label:'Finance', msg:savRate>35?`Savings rate ${savRate.toFixed(0)}% — excellent!`:`Monthly spend ${cur}${fmtN(monthExp)} vs income ${cur}${fmtN(monthInc)}. Rate: ${savRate.toFixed(1)}%.` },
                  { icon:'❤️', label:'Health', msg:lastVitals?`Last logged: sleep ${lastVitals.sleep}h, mood ${lastVitals.mood}/10. ${lastVitals.sleep>=7?'Great rest!':'Aim for 7–8h.'}`:'Log your vitals today to track health trends.' },
                  { icon:'🔥', label:'Habits', msg:`${todayDone}/${(habits||[]).length} habits done today. ${bestStreak>0?`Best streak: ${bestStreak} days 🔥`:'Start building streaks.'}` },
                ].map((item,i)=>(
                  <div key={i} style={{ background:T.accentLo, borderRadius:T.r, padding:'12px 14px', border:`1px solid ${T.border}`, animation:`fadeUp 0.4s ease ${i*0.1+0.2}s both` }}>
                    <div style={{ fontSize:16, marginBottom:5 }}>{item.icon}</div>
                    <div style={{ fontSize:9, fontFamily:T.fM, color:T.textSub, letterSpacing:'0.08em', marginBottom:3 }}>{item.label.toUpperCase()}</div>
                    <div style={{ fontSize:11, fontFamily:T.fM, color:T.text, lineHeight:1.5 }}>{item.msg}</div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
          <GlassCard style={{ padding:'20px 22px' }}>
            <SectionLabel>Quick Actions</SectionLabel>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(100px,1fr))', gap:8 }}>
              {QUICK_ACTIONS.map((a,i)=>(
                <button key={i} className="los-qa" onClick={()=>setModal(a.modal)} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:5, padding:'10px 6px', borderRadius:T.r, background:T.surface, border:`1px solid ${T.border}`, transition:'all 0.18s', animation:`fadeUp 0.3s ease ${i*0.06}s both` }}>
                  <span style={{ fontSize:18 }}>{a.emoji}</span>
                  <span style={{ fontSize:9, fontFamily:T.fM, color:T.textSub, textAlign:'center', lineHeight:1.3 }}>{a.label}</span>
                </button>
              ))}
            </div>
          </GlassCard>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:10 }}>
            {[
              { label:'This Month', sub:'Income', val:`${cur}${fmtN(monthInc)}`, color:T.emerald },
              { label:'This Month', sub:'Spent', val:`${cur}${fmtN(monthExp)}`, color:T.rose },
              { label:'Habits', sub:`${todayDone}/${(habits||[]).length} today`, val:bestStreak?`🔥 ${bestStreak}d`:(habits||[]).length===0?'None yet':'0d', color:T.accent },
              { label:'Goals', sub:`${(goals||[]).length} active`, val:(goals||[]).length>0?`${Math.round((goals||[]).reduce((s,g)=>s+(g.current||0)/Math.max(1,g.target)*100,0)/Math.max(1,(goals||[]).length))}% avg`:'Set goals', color:T.violet },
            ].map((s,i)=>(
              <GlassCard key={i} style={{ padding:'14px 16px' }}>
                <div style={{ fontSize:9, fontFamily:T.fM, color:T.textSub, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:4 }}>{s.label} · {s.sub}</div>
                <div style={{ fontSize:16, fontFamily:T.fD, fontWeight:700, color:s.color }}>{s.val}</div>
              </GlassCard>
            ))}
          </div>
          <GlassCard style={{ padding:'18px', flex:1 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <SectionLabel>Today's Habits</SectionLabel>
              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                <span style={{ fontSize:10, fontFamily:T.fM, color:todayDone===(habits||[]).length&&(habits||[]).length>0?T.emerald:T.textSub }}>{todayDone}/{(habits||[]).length}</span>
                <button onClick={()=>onNav('growth')} style={{ fontSize:9, fontFamily:T.fM, color:T.accent, display:'flex', alignItems:'center', gap:2 }}>All <IcoChevR size={9} stroke={T.accent} /></button>
              </div>
            </div>
            {(habits||[]).length === 0 ? (
              <div style={{ textAlign:'center', padding:'16px 0', fontSize:11, fontFamily:T.fM, color:T.textMuted }}>No habits tracked yet.<br/><button onClick={()=>setModal('habit')} style={{ color:T.accent, fontSize:11, fontFamily:T.fM, marginTop:6, cursor:'pointer' }}>+ Add habit</button></div>
            ) : (
              (habits||[]).slice(0, 7).map((h,i) => {
                const done = (habitLogs[h.id]||[]).includes(today());
                const streak = getStreak(h.id, habitLogs);
                const HCOLORS=[T.accent,T.violet,T.sky,T.amber,T.rose,T.emerald];
                const hc = HCOLORS[i%HCOLORS.length];
                return (
                  <div key={h.id} className="los-row" style={{ display:'flex', alignItems:'center', gap:10, padding:'7px 4px', borderRadius:8, transition:'background 0.15s', marginBottom:1 }}>
                    <button onClick={()=>{ if(!done) actions.logHabit(h.id); }} style={{ width:24, height:24, borderRadius:7, flexShrink:0, background:done?hc+'22':T.surface, border:`1.5px solid ${done?hc:T.border}`, display:'flex', alignItems:'center', justifyContent:'center', cursor:done?'default':'pointer', transition:'all 0.2s cubic-bezier(0.34,1.56,0.64,1)', transform:done?'scale(1)':'scale(0.95)' }}
                      onMouseEnter={e=>{ if(!done) e.currentTarget.style.borderColor=hc; }}
                      onMouseLeave={e=>{ if(!done) e.currentTarget.style.borderColor=T.border; }}>
                      {done && <span style={{ fontSize:12, color:hc }}>✓</span>}
                    </button>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:11, fontFamily:T.fD, fontWeight:600, color:done?T.textSub:T.text, textDecoration:done?'line-through':'none', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{h.emoji||'🔥'} {h.name}</div>
                    </div>
                    {streak > 0 && <span style={{ fontSize:9, fontFamily:T.fM, color:streak>=7?T.amber:hc, flexShrink:0, fontWeight:streak>=7?700:400 }}>🔥{streak}d</span>}
                  </div>
                );
              })
            )}
            {(habits||[]).length > 7 && (
              <div style={{ marginTop:6, fontSize:10, fontFamily:T.fM, color:T.textMuted, textAlign:'center', cursor:'pointer' }} onClick={()=>onNav('growth')}>+{(habits||[]).length-7} more → view all</div>
            )}
            <div style={{ marginTop:10, paddingTop:10, borderTop:`1px solid ${T.border}`, display:'flex', justifyContent:'space-between', alignItems:'center', gap:10 }}>
              <span style={{ fontSize:10, fontFamily:T.fM, color:T.textSub, flexShrink:0 }}>{todayDone}/{(habits||[]).length} done today</span>
              <div style={{ flex:1 }}><ProgressBar pct={(habits||[]).length>0?(todayDone/(habits||[]).length)*100:0} color={todayDone===(habits||[]).length&&(habits||[]).length>0?T.emerald:T.accent} height={4} /></div>
              {todayDone===(habits||[]).length&&(habits||[]).length>0 && <span style={{ fontSize:10, color:T.emerald, flexShrink:0 }}>🎉 All done!</span>}
            </div>
          </GlassCard>
          <GlassCard style={{ padding:'18px', flex:1 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <SectionLabel>Today's Feed</SectionLabel>
              <button onClick={()=>onNav('timeline')} style={{ fontSize:9, fontFamily:T.fM, color:T.accent, display:'flex', alignItems:'center', gap:2 }}>All <IcoChevR size={9} stroke={T.accent} /></button>
            </div>
            {recentEvents.length === 0 ? (
              <div style={{ textAlign:'center', padding:'20px 0', fontSize:11, fontFamily:T.fM, color:T.textMuted }}>Start logging expenses, habits, or vitals<br/>to see your activity feed here.</div>
            ) : (
              recentEvents.map((ev,i)=>(
                <div key={ev.id} className="los-ev" style={{ display:'flex', alignItems:'flex-start', gap:9, padding:'9px 7px', borderRadius:7, cursor:'pointer', transition:'background 0.15s', borderBottom:i<recentEvents.length-1?`1px solid ${T.border}`:'none' }}>
                  <div style={{ width:6, height:6, borderRadius:'50%', marginTop:5, flexShrink:0, background:ev.color, boxShadow:`0 0 5px ${ev.color}` }} />
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <div style={{ fontSize:11, fontFamily:T.fD, fontWeight:600, color:T.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:160 }}>{ev.title}</div>
                      <div style={{ fontSize:10, fontFamily:T.fM, color:ev.color, whiteSpace:'nowrap', marginLeft:6 }}>{ev.value}</div>
                    </div>
                    <div style={{ fontSize:9, fontFamily:T.fM, color:T.textSub, marginTop:1 }}>{ev.sub} · {ev.ts}</div>
                  </div>
                </div>
              ))
            )}
          </GlassCard>
        </div>
      </div>
    </>)}
    </div>
  );
}

// ── TIMELINE PAGE ─────────────────────────────────────────────────────────────
function TimelinePage({ data }) {
  const { expenses=[], incomes=[], habits=[], habitLogs={}, vitals=[], goals=[], investments=[], debts=[], settings={} } = data;
  const [filter, setFilter] = useState('all');
  const cur = settings.currency || '$';
  // Per-category memos — each only recalculates when its source data changes
  const expenseEvs    = useMemo(() => (expenses||[]).map(e=>({ id:'e-'+e.id, ts:e.date, title:e.note||e.category, sub:e.category, value:`-${cur}${fmtN(e.amount)}`, cat:'expense', color:T.rose, emoji:'💳' })), [expenses, cur]);
  const incomeEvs     = useMemo(() => (incomes||[]).map(i=>({ id:'i-'+i.id, ts:i.date, title:i.note||'Income received', sub:'Income', value:`+${cur}${fmtN(i.amount)}`, cat:'income', color:T.emerald, emoji:'💰' })), [incomes, cur]);
  const habitEvs      = useMemo(() => { const evs=[]; (habits||[]).forEach(h=>(habitLogs[h.id]||[]).forEach(d=>evs.push({ id:'h-'+h.id+d, ts:d, title:h.name+' completed', sub:'Habit · 🔥 streak', value:'+XP', cat:'habit', color:T.accent, emoji:'🔥' }))); return evs; }, [habits, habitLogs]);
  const vitalEvs      = useMemo(() => (vitals||[]).map(v=>({ id:'v-'+v.id, ts:v.date, title:'Vitals Logged', sub:`Sleep ${v.sleep}h · Mood ${v.mood}/10`, value:'❤️', cat:'health', color:T.sky, emoji:'❤️' })), [vitals]);
  const goalEvs       = useMemo(() => (goals||[]).filter(g=>g.current>=g.target).map(g=>({ id:'g-'+g.id, ts:g.updatedAt||today(), title:`Goal completed: ${g.name}`, sub:'Goal milestone', value:'🏆 +50XP', cat:'goal', color:T.amber, emoji:'🎯' })), [goals]);
  const investmentEvs = useMemo(() => (investments||[]).map(inv=>({ id:'inv-'+inv.id, ts:inv.date||today(), title:`${inv.symbol||inv.name} position`, sub:'Investment', value:`${cur}${fmtN(Number(inv.currentPrice??inv.buyPrice)*Number(inv.quantity))}`, cat:'investment', color:T.violet, emoji:'📈' })), [investments, cur]);
  const debtEvs       = useMemo(() => (debts||[]).map(d=>({ id:'d-'+d.id, ts:d.createdAt||today(), title:`Debt: ${d.name}`, sub:`${d.type||'Debt'} · ${d.rate||0}% APR`, value:`${cur}${fmtN(d.balance)}`, cat:'debt', color:T.rose, emoji:'⚠️' })), [debts, cur]);
  // Merge only when a category slice actually changes
  const allEvents = useMemo(() =>
    [...expenseEvs,...incomeEvs,...habitEvs,...vitalEvs,...goalEvs,...investmentEvs,...debtEvs]
      .sort((a,b)=>a.ts<b.ts?1:-1),
    [expenseEvs,incomeEvs,habitEvs,vitalEvs,goalEvs,investmentEvs,debtEvs]);
  const cats = ['all','expense','income','investment','habit','health','goal','debt'];
  const filtered = filter==='all'?allEvents:allEvents.filter(e=>e.cat===filter);
  const groups = useMemo(()=>{ const g={}; filtered.forEach(ev=>{ const d=ev.ts?.slice(0,10)||'Unknown'; if(!g[d])g[d]=[]; g[d].push(ev); }); return Object.entries(g).sort((a,b)=>a[0]<b[0]?1:-1); },[filtered]);
  return (
    <div style={{ animation:'fadeUp 0.4s ease' }}>
      <div style={{ marginBottom:22 }}>
        <SectionLabel>Core System</SectionLabel>
        <h1 style={{ fontSize:26, fontFamily:T.fD, fontWeight:800, color:T.text }}>Life Timeline</h1>
        <div style={{ fontSize:11, fontFamily:T.fM, color:T.textSub, marginTop:4 }}>{allEvents.length} events recorded across all domains</div>
      </div>
      <div style={{ display:'flex', gap:6, marginBottom:22, flexWrap:'wrap' }}>
        {cats.map(cat=>{ const colorMap={expense:T.rose,income:T.emerald,investment:T.violet,habit:T.accent,health:T.sky,goal:T.amber,debt:T.rose}; const c=colorMap[cat]||T.textSub; return (
          <button key={cat} onClick={()=>setFilter(cat)} style={{ padding:'4px 12px', borderRadius:99, fontSize:9, fontFamily:T.fM, textTransform:'uppercase', letterSpacing:'0.06em', background:filter===cat?(c+'18'):'transparent', color:filter===cat?c:T.textSub, border:`1px solid ${filter===cat?c+'44':T.border}`, transition:'all 0.15s' }}>{cat==='all'?'⬡ All':cat}</button>
        ); })}
      </div>
      {groups.length===0 ? (
        <GlassCard style={{ padding:40, textAlign:'center' }}><div style={{ fontSize:11, fontFamily:T.fM, color:T.textMuted }}>No events yet. Start logging to build your life timeline.</div></GlassCard>
      ) : (
        <div style={{ position:'relative' }}>
          <div style={{ position:'absolute', left:18, top:0, bottom:0, width:1, background:`linear-gradient(180deg,${T.accent}44 0%,${T.border} 40%,transparent 100%)` }} />
          {groups.map(([date,events],gi)=>(
            <div key={date} style={{ marginBottom:24, animation:`fadeUp 0.4s ease ${gi*0.06}s both` }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10, paddingLeft:36 }}>
                <div style={{ fontSize:10, fontFamily:T.fM, fontWeight:600, color:T.textSub, letterSpacing:'0.08em', textTransform:'uppercase' }}>{date==='Unknown'?'Unknown date':new Date(date+'T12:00:00').toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})}</div>
                <div style={{ flex:1, height:1, background:T.border }} />
              </div>
              {events.map((ev,i)=>(
                <div key={ev.id} className="los-ev" style={{ display:'flex', alignItems:'flex-start', gap:14, paddingLeft:36, paddingBottom:12, cursor:'pointer', borderRadius:9, transition:'background 0.15s', animation:`nodeEnter 0.25s ease ${i*0.05}s both` }}>
                  <div style={{ position:'absolute', left:12, width:12, height:12, borderRadius:'50%', background:T.bg, border:`2px solid ${ev.color}`, boxShadow:`0 0 7px ${ev.color}55`, marginTop:12 }} />
                  <GlassCard style={{ flex:1, padding:'12px 16px', borderLeft:`3px solid ${ev.color}55` }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8 }}>
                      <div>
                        <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:3 }}><span style={{ fontSize:13 }}>{ev.emoji}</span><span style={{ fontSize:12, fontFamily:T.fD, fontWeight:700, color:T.text }}>{ev.title}</span><Badge color={ev.color}>{ev.cat}</Badge></div>
                        <div style={{ fontSize:10, fontFamily:T.fM, color:T.textSub }}>{ev.sub}</div>
                      </div>
                      <div style={{ fontSize:12, fontFamily:T.fM, fontWeight:600, color:ev.color, whiteSpace:'nowrap' }}>{ev.value}</div>
                    </div>
                  </GlassCard>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ── MONEY PAGE (Enhanced: Debts + Subscriptions + Budget) ────────────────────
// ══════════════════════════════════════════════════════════════════════════════

// ── MONEY TOOLS TAB ───────────────────────────────────────────────────────────
function MoneyToolsTab({ data, cur }) {
  const {expenses=[], debts=[], subscriptions=[], assets=[], investments=[], settings={}} = data;
  const monthExp = data.computed.monthExp;
  const monthInc = data.computed.monthInc;
// ── Compound Growth Simulator ──────────────────────────────────────────
const [principal, setPrincipal] = useState(10000);
const [rate, setRate]           = useState(7);
const [years, setYears]         = useState(20);
const [monthly, setMonthly]     = useState(500);
const chartData = useMemo(() => {
  const d = []; let val = principal;
  for (let y = 0; y <= years; y++) {
    d.push({ year:`Y${y}`, value:Math.round(val), noContrib:Math.round(principal * Math.pow(1+rate/100, y)) });
    val = val * (1 + rate/100) + monthly * 12;
  }
  return d;
}, [principal, rate, years, monthly]);
const finalVal    = chartData[chartData.length-1]?.value||0;
const totalIn     = principal + monthly * 12 * years;
const totalGrowth = finalVal - totalIn;

// ── Emergency Fund Tracker ─────────────────────────────────────────────
const [efMonths, setEfMonths]   = useState(6);
const [efCurrent, setEfCurrent] = useState(0);
const monthlyFixed = ((debts||[]).reduce((s,d)=>s+Number(d.minPayment||0),0)) + ((subscriptions||[]).reduce((s,sub)=>{ const n=Number(sub.amount||0); return s+(sub.cycle==='yearly'?n/12:sub.cycle==='weekly'?n*4.33:n); },0));
const efTarget    = monthlyFixed + monthExp;
const efGoal      = efTarget * efMonths;
const efPct       = efGoal > 0 ? Math.min(100, (efCurrent / efGoal) * 100) : 0;
const efColor     = efPct >= 100 ? T.emerald : efPct >= 50 ? T.amber : T.rose;
const EF_LEVELS   = [{ pct:25, label:'1mo' }, { pct:50, label:'3mo' }, { pct:100, label:`${efMonths}mo` }];

// ── DTI Ratio ─────────────────────────────────────────────────────────
const monthlyDebtPmts = (debts||[]).reduce((s,d)=>s+Number(d.minPayment||0),0);
const dti = monthInc > 0 ? (monthlyDebtPmts / monthInc) * 100 : 0;
const dtiColor = dti > 43 ? T.rose : dti > 28 ? T.amber : T.emerald;
const dtiLabel = dti > 43 ? 'High risk — reduce debt' : dti > 36 ? 'Stretched' : dti > 20 ? 'Manageable' : 'Excellent';


  return (
<div style={{ display:'flex', flexDirection:'column', gap:16 }}>
  {/* DTI */}
  <GlassCard style={{ padding:'20px 22px' }}>
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
      <div>
        <SectionLabel>Debt-to-Income Ratio</SectionLabel>
        <div style={{ fontSize:28, fontFamily:T.fM, fontWeight:700, color:dtiColor }}>{dti.toFixed(1)}%</div>
        <div style={{ fontSize:11, fontFamily:T.fM, color:dtiColor, marginTop:3 }}>{dtiLabel}</div>
      </div>
      <div style={{ fontSize:11, fontFamily:T.fM, color:T.textSub, textAlign:'right', lineHeight:1.7 }}>
        <div>Monthly debt payments: <span style={{ color:T.rose }}>{cur}{fmtN(monthlyDebtPmts)}</span></div>
        <div>Monthly income: <span style={{ color:T.emerald }}>{cur}{fmtN(monthInc)}</span></div>
      </div>
    </div>
    <ProgressBar pct={Math.min(dti/50*100,100)} color={dtiColor} height={8} />
    <div style={{ display:'flex', justifyContent:'space-between', marginTop:8, fontSize:9, fontFamily:T.fM }}>
      {[{p:0,l:'0%'},{p:20,l:'20% ideal'},{p:36,l:'36% caution'},{p:43,l:'43% limit'},{p:100,l:'50%+'}].map(m=>(
        <span key={m.p} style={{ color:T.textMuted }}>{m.l}</span>
      ))}
    </div>
  </GlassCard>

  {/* Emergency Fund */}
  <GlassCard style={{ padding:'20px 22px' }}>
    <SectionLabel>Emergency Fund Tracker</SectionLabel>
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14, marginBottom:18 }}>
      <div>
        <div style={{ fontSize:10, fontFamily:T.fM, color:T.textSub, marginBottom:6 }}>Current savings ({cur})</div>
        <input type="number" value={efCurrent} onChange={e=>setEfCurrent(Number(e.target.value)||0)} style={{ width:'100%', padding:'8px 10px', background:'rgba(255,255,255,0.04)', border:`1px solid ${T.border}`, borderRadius:T.r, fontFamily:T.fM, fontSize:13, color:T.text }} />
      </div>
      <div>
        <div style={{ fontSize:10, fontFamily:T.fM, color:T.textSub, marginBottom:6 }}>Target months</div>
        <input type="number" min={1} max={24} value={efMonths} onChange={e=>setEfMonths(Number(e.target.value)||6)} style={{ width:'100%', padding:'8px 10px', background:'rgba(255,255,255,0.04)', border:`1px solid ${T.border}`, borderRadius:T.r, fontFamily:T.fM, fontSize:13, color:T.text }} />
      </div>
      <div>
        <div style={{ fontSize:10, fontFamily:T.fM, color:T.textSub, marginBottom:6 }}>Goal</div>
        <div style={{ padding:'8px 10px', background:T.surface, borderRadius:T.r, fontSize:13, fontFamily:T.fM, fontWeight:700, color:efColor }}>{cur}{fmtN(efGoal)}</div>
      </div>
    </div>
    <MilestoneProgressBar pct={efPct} color={efColor} height={10} milestones={EF_LEVELS} />
    <div style={{ display:'flex', justifyContent:'space-between', marginTop:18, fontSize:11, fontFamily:T.fM }}>
      <span style={{ color:T.textSub }}>Based on {cur}{fmtN(efTarget)}/month expenses + fixed costs</span>
      <span style={{ color:efColor, fontWeight:600 }}>{efPct >= 100 ? '✓ Fully funded!' : `${cur}${fmtN(efGoal - efCurrent)} to go`}</span>
    </div>
  </GlassCard>

  {/* Compound Growth Simulator */}
  <GlassCard style={{ padding:'20px 22px' }}>
    <SectionLabel>Compound Growth Simulator</SectionLabel>
    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:14, marginBottom:18 }}>
      <div>
        <div style={{ fontSize:10, fontFamily:T.fM, color:T.textSub, marginBottom:4 }}>Starting amount ({cur})</div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <input type="range" min={0} max={500000} step={1000} value={principal} onChange={e=>setPrincipal(Number(e.target.value))} style={{ flex:1, accentColor:T.violet }} />
          <span style={{ fontSize:12, fontFamily:T.fM, color:T.violet, minWidth:70, textAlign:'right' }}>{cur}{fmtN(principal)}</span>
        </div>
      </div>
      <div>
        <div style={{ fontSize:10, fontFamily:T.fM, color:T.textSub, marginBottom:4 }}>Monthly contribution ({cur})</div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <input type="range" min={0} max={5000} step={50} value={monthly} onChange={e=>setMonthly(Number(e.target.value))} style={{ flex:1, accentColor:T.accent }} />
          <span style={{ fontSize:12, fontFamily:T.fM, color:T.accent, minWidth:60, textAlign:'right' }}>{cur}{fmtN(monthly)}</span>
        </div>
      </div>
      <div>
        <div style={{ fontSize:10, fontFamily:T.fM, color:T.textSub, marginBottom:4 }}>Annual return (%)</div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <input type="range" min={1} max={20} step={0.5} value={rate} onChange={e=>setRate(Number(e.target.value))} style={{ flex:1, accentColor:T.emerald }} />
          <span style={{ fontSize:12, fontFamily:T.fM, color:T.emerald, minWidth:50, textAlign:'right' }}>{rate}%</span>
        </div>
      </div>
      <div>
        <div style={{ fontSize:10, fontFamily:T.fM, color:T.textSub, marginBottom:4 }}>Time horizon (years)</div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <input type="range" min={1} max={50} step={1} value={years} onChange={e=>setYears(Number(e.target.value))} style={{ flex:1, accentColor:T.amber }} />
          <span style={{ fontSize:12, fontFamily:T.fM, color:T.amber, minWidth:50, textAlign:'right' }}>{years}yr</span>
        </div>
      </div>
    </div>
    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:12, marginBottom:18 }}>
      {[{ label:'Final Value', val:`${cur}${fmtN(finalVal)}`, color:T.violet }, { label:'Total Invested', val:`${cur}${fmtN(totalIn)}`, color:T.text }, { label:'Total Growth', val:`+${cur}${fmtN(totalGrowth)}`, color:T.emerald }].map((s,i)=>(
        <div key={i} style={{ padding:'12px 16px', borderRadius:T.r, background:T.surface, border:`1px solid ${T.border}` }}>
          <div style={{ fontSize:9, fontFamily:T.fM, color:T.textSub, marginBottom:4, textTransform:'uppercase', letterSpacing:'0.08em' }}>{s.label}</div>
          <div style={{ fontSize:16, fontFamily:T.fD, fontWeight:700, color:s.color }}>{s.val}</div>
        </div>
      ))}
    </div>
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={chartData} margin={{top:4,right:0,left:0,bottom:0}}>
        <defs>
          <linearGradient id="cg1" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={T.violet} stopOpacity={0.3}/><stop offset="95%" stopColor={T.violet} stopOpacity={0}/></linearGradient>
          <linearGradient id="cg2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={T.accent} stopOpacity={0.2}/><stop offset="95%" stopColor={T.accent} stopOpacity={0}/></linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="2 4" stroke={T.border} vertical={false} />
        <XAxis dataKey="year" tick={{fill:T.textSub,fontSize:9,fontFamily:T.fM}} axisLine={false} tickLine={false} />
        <YAxis tickFormatter={v=>v>=1000000?`${(v/1000000).toFixed(1)}M`:v>=1000?`${(v/1000).toFixed(0)}K`:v} tick={{fill:T.textSub,fontSize:9,fontFamily:T.fM}} axisLine={false} tickLine={false} />
        <Tooltip content={<ChartTooltip prefix={cur} />} />
        <Area type="monotone" dataKey="value" name="With contributions" stroke={T.violet} strokeWidth={2} fill="url(#cg1)" />
        <Area type="monotone" dataKey="noContrib" name="No contributions" stroke={T.accent} strokeWidth={1.5} fill="url(#cg2)" strokeDasharray="4 2" />
      </AreaChart>
    </ResponsiveContainer>
    <div style={{ display:'flex', gap:16, marginTop:10, fontSize:10, fontFamily:T.fM, color:T.textSub }}>
      <span style={{ display:'flex', alignItems:'center', gap:5 }}><span style={{ width:16, height:2, background:T.violet, display:'inline-block', borderRadius:2 }}/>With {cur}{fmtN(monthly)}/mo contributions</span>
      <span style={{ display:'flex', alignItems:'center', gap:5 }}><span style={{ width:16, height:2, background:T.accent, display:'inline-block', borderRadius:2, borderTop:'2px dashed' }}/>Initial investment only</span>
    </div>
  </GlassCard>
</div>
  );
}

function MoneyPage({ data, actions }) {
  const [tab, setTab] = useState('overview');
  const [modal, setModal] = useState(null);
  const [receiptScannerOpen, setReceiptScannerOpen] = useState(false);
  const [goalAmt, setGoalAmt] = useState(''); const [goalIdx, setGoalIdx] = useState(null);
  const [payoffMethod, setPayoffMethod] = useState('avalanche');
  const [extraPayment, setExtraPayment] = useState(0);
  const debouncedExtraPayment = useDebounce(extraPayment, 300);
  const [editExpense, setEditExpense] = useState(null);
  const [splitExpense, setSplitExpense] = useState(null);
  const [editDebt, setEditDebt] = useState(null);
  const [editIncome, setEditIncome] = useState(null);
  const [editingSub, setEditingSub] = useState(null);
  const [editingBill, setEditingBill] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(today().slice(0,7));
  const [goalCatFilter, setGoalCatFilter] = useState('all');
  const [showMonthlyReview, setShowMonthlyReview] = useState(false);
  const {expenses=[], incomes=[], assets=[], investments=[], debts=[], goals=[], settings={}, netWorthHistory=[], subscriptions=[], budgets={}, bills=[]} = data;
  const cur = settings.currency || '$'; const thisMonth = today().slice(0,7);
  // Use pre-computed values from App root
  const { monthExp, monthInc, invVal, assetVal, debtVal, nw: netWorth, savRate } = data.computed;
  const availableMonths = useMemo(()=>{
    const ms=new Set([...(expenses||[]).map(e=>e.date?.slice(0,7)),...(incomes||[]).map(i=>i.date?.slice(0,7))].filter(Boolean));
    const arr=[...ms].sort().reverse();
    if(!arr.includes(today().slice(0,7))) arr.unshift(today().slice(0,7));
    return arr;
  },[expenses,incomes]);
  const selMonthExp = useMemo(()=>(expenses||[]).filter(e=>e.date?.startsWith(selectedMonth)).reduce((s,e)=>s+Number(e.amount||0),0),[expenses,selectedMonth]);
  const selMonthInc = useMemo(()=>(incomes||[]).filter(i=>i.date?.startsWith(selectedMonth)).reduce((s,i)=>s+Number(i.amount||0),0),[incomes,selectedMonth]);
  const selMonthExpenses = useMemo(()=>[...expenses].filter(e=>e.date?.startsWith(selectedMonth)).sort((a,b)=>a.date<b.date?1:-1),[expenses,selectedMonth]);
  const totalBudget = useMemo(()=>Object.values(budgets||{}).reduce((s,v)=>s+Number(v||0),0),[budgets]);
  const spendByCat = useMemo(()=>{ const m={}; selMonthExpenses.forEach(e=>{ m[e.category]=(m[e.category]||0)+Number(e.amount||0); }); return Object.entries(m).map(([name,value])=>({ name, value, color:getCatColor(name) })).sort((a,b)=>b.value-a.value); },[selMonthExpenses]);
  const cashflowMonths = useMemo(()=>{ const months={}; (expenses||[]).forEach(e=>{ const m=e.date?.slice(0,7); if(!m)return; if(!months[m])months[m]={m,inc:0,exp:0}; months[m].exp+=Number(e.amount||0); }); (incomes||[]).forEach(i=>{ const m=i.date?.slice(0,7); if(!m)return; if(!months[m])months[m]={m,inc:0,exp:0}; months[m].inc+=Number(i.amount||0); }); return Object.values(months).sort((a,b)=>a.m<b.m?-1:1).slice(-6); },[expenses,incomes]);
  // Use Web Worker for >10 debts; sync fallback for small lists
  const [payoffInfo, setPayoffInfo] = useState(() => calcDebtPayoff(debts, 0, payoffMethod));
  const workerRef = useRef(null);
  useEffect(() => {
    if ((debts||[]).length > 10) {
      if (!workerRef.current) workerRef.current = createDebtWorker();
      if (workerRef.current) {
        const w = workerRef.current;
        const handler = (e) => {
          const r = e.data;
          // Worker returns timestamp instead of Date object — convert back
          setPayoffInfo({ ...r, payoffDate: r.payoffDate ? new Date(r.payoffDate) : null });
        };
        w.addEventListener('message', handler);
        w.postMessage({ debts, extraPayment: debouncedExtraPayment, method: payoffMethod });
        return () => w.removeEventListener('message', handler);
      }
    }
    // Sync path for ≤10 debts (fast enough, <2ms)
    setPayoffInfo(calcDebtPayoff(debts, debouncedExtraPayment, payoffMethod));
    return undefined;
  }, [debts, debouncedExtraPayment, payoffMethod]);
  useEffect(() => () => { workerRef.current?.terminate(); workerRef.current = null; }, []);
  const budgetStatus = useMemo(()=>calcBudgetStatus(expenses, budgets||{}, selectedMonth),[expenses,budgets,selectedMonth]);
  const monthlySubTotal = useMemo(()=>(subscriptions||[]).reduce((s,sub)=>{ const n=Number(sub.amount||0); return s+(sub.cycle==='yearly'?n/12:sub.cycle==='weekly'?n*4.33:n); },0),[subscriptions]);
  const billsArr = bills || [];
  const upcomingBills = useMemo(()=>[...billsArr].filter(b=>!b.paid).sort((a,b)=>a.nextDate<b.nextDate?-1:1),[billsArr]);
  const TABS = ['overview','spending','debts','recurring','investments','trades','watchlist','investor','depreciation','goals','assets','tools','simulator','forecast','ingest'];
  return (
    <div style={{ animation:'fadeUp 0.4s ease' }}>
      <ReceiptScannerModal open={receiptScannerOpen} onClose={()=>setReceiptScannerOpen(false)} onExpenseDetected={e=>{actions.addExpense(e);setReceiptScannerOpen(false);}} settings={data.settings} currency={cur} />
      <LogExpenseModal open={modal==='expense'} onClose={()=>setModal(null)} onSave={e=>{actions.addExpense(e);setModal(null);}} />
      <LogIncomeModal open={modal==='income'} onClose={()=>setModal(null)} onSave={e=>{actions.addIncome(e);setModal(null);}} />
      <EditIncomeModal open={!!editIncome} onClose={()=>setEditIncome(null)} income={editIncome} onSave={(id,patch)=>{actions.updateIncome(id,patch);setEditIncome(null);}} />
      <AddAssetModal open={modal==='asset'} onClose={()=>setModal(null)} onSave={e=>{actions.addAsset(e);setModal(null);}} />
      <AddGoalModal open={modal==='goal'} onClose={()=>setModal(null)} onSave={e=>{actions.addGoal(e);setModal(null);}} />
      <AddDebtModal open={modal==='debt'} onClose={()=>setModal(null)} onSave={e=>{actions.addDebt(e);setModal(null);}} />
      <LogDebtPaymentModal open={modal==='pay-debt'} onClose={()=>setModal(null)} debts={debts} onPay={(id,amt)=>{actions.payDebt(id,amt);setModal(null);}} />
      <AddInvestmentModal open={modal==='investment'} onClose={()=>setModal(null)} onSave={e=>{actions.addInvestment(e);setModal(null);}} />
      <AddSubscriptionModal open={modal==='subscription'} onClose={()=>setModal(null)} onSave={e=>{actions.addSubscription(e);setModal(null);}} />
      <AddBillModal open={modal==='bill'} onClose={()=>setModal(null)} onSave={e=>{actions.addBill(e);setModal(null);}} />
      <EditSubscriptionModal open={!!editingSub} onClose={()=>setEditingSub(null)} sub={editingSub} onSave={(id,patch)=>{actions.updateSubscription(id,patch);setEditingSub(null);}} />
      <EditBillModal open={!!editingBill} onClose={()=>setEditingBill(null)} bill={editingBill} onSave={(id,patch)=>{actions.updateBill(id,patch);setEditingBill(null);}} />
      <BudgetModal open={modal==='budget'} onClose={()=>setModal(null)} budgets={budgets||{}} onSave={actions.setBudgets} />
      <MonthlyReviewModal open={showMonthlyReview} onClose={()=>setShowMonthlyReview(false)} data={data} actions={actions} />
      <EditExpenseModal open={!!editExpense} onClose={()=>setEditExpense(null)} expense={editExpense} onSave={(id,patch)=>{actions.updateExpense(id,patch);setEditExpense(null);}} />
      <SplitExpenseModal open={!!splitExpense} onClose={()=>setSplitExpense(null)} expense={splitExpense} cur={cur} onSave={parts=>{ actions.removeExpense(splitExpense.id); parts.forEach(p=>actions.addExpense(p)); setSplitExpense(null); }} />
      <EditDebtModal open={!!editDebt} onClose={()=>setEditDebt(null)} debt={editDebt} onSave={(id,patch)=>{actions.updateDebt(id,patch);setEditDebt(null);}} />
      <div style={{ marginBottom:22 }}>
        <SectionLabel>Financial Domain</SectionLabel>
        <h1 style={{ fontSize:26, fontFamily:T.fD, fontWeight:800, color:T.text }}>Money Hub</h1>
      </div>
      <div style={{ display:'flex', gap:2, marginBottom:22, background:T.surface, borderRadius:T.r, padding:3, width:'fit-content', border:`1px solid ${T.border}`, flexWrap:'wrap' }}>
        {TABS.map(t=>(
          <button key={t} className="los-tab" onClick={()=>setTab(t)} style={{ padding:'5px 14px', borderRadius:8, fontSize:9, fontFamily:T.fM, textTransform:'uppercase', letterSpacing:'0.06em', background:tab===t?T.accentDim:'transparent', color:tab===t?T.accent:T.textSub, border:`1px solid ${tab===t?T.accent+'33':'transparent'}`, transition:'all 0.15s' }}>{t}</button>
        ))}
      </div>

      {tab==='overview' && (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(170px,1fr))', gap:12 }}>
            {[{ label:'Net Worth', val:`${cur}${fmtN(netWorth)}`, sub:`Assets ${cur}${fmtN(assetVal+invVal)} - Debts ${cur}${fmtN(debtVal)}`, color:T.accent }, { label:'Monthly Income', val:`${cur}${fmtN(monthInc)}`, sub:'This month total', color:T.emerald }, { label:'Monthly Spend', val:`${cur}${fmtN(monthExp)}`, sub:`${monthInc>0?`${((monthExp/monthInc)*100).toFixed(0)}% of income`:'Track income to compare'}`, color:T.rose }, { label:'Savings Rate', val:`${savRate.toFixed(1)}%`, sub:`${cur}${fmtN(monthInc-monthExp)} saved`, color:T.sky }].map((m,i)=>(
              <GlassCard key={i} style={{ padding:'16px 18px' }}>
                <div style={{ fontSize:9, fontFamily:T.fM, color:T.textSub, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:6 }}>{m.label}</div>
                <div style={{ fontSize:18, fontFamily:T.fD, fontWeight:700, color:m.color, marginBottom:4 }}>{m.val}</div>
                <div style={{ fontSize:10, fontFamily:T.fM, color:T.textSub }}>{m.sub}</div>
              </GlassCard>
            ))}
          </div>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            <Btn onClick={()=>setModal('expense')} color={T.rose}>+ Log Expense</Btn>
            <Btn onClick={()=>setReceiptScannerOpen(true)} color={T.amber}>🧾 Scan Receipt</Btn>
            <Btn onClick={()=>setModal('income')} color={T.emerald}>+ Log Income</Btn>
            <Btn onClick={()=>setModal('asset')} color={T.accent}>+ Add Asset</Btn>
            <Btn onClick={()=>setModal('debt')} color={T.rose}>+ Add Debt</Btn>
            <Btn onClick={()=>setShowMonthlyReview(true)} color={T.violet}>📅 Monthly Review</Btn>
          </div>
          <GlassCard style={{ padding:'20px 22px' }}>
            <SectionLabel>Cash Flow — Last 6 Months</SectionLabel>
            {cashflowMonths.length > 0 ? (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={cashflowMonths} barGap={3} margin={{top:4,right:0,left:0,bottom:0}}>
                  <CartesianGrid strokeDasharray="2 4" stroke={T.border} vertical={false} />
                  <XAxis dataKey="m" tick={{fill:T.textSub,fontSize:9,fontFamily:T.fM}} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip content={<ChartTooltip prefix={cur} />} />
                  <Bar dataKey="inc" name="Income" fill={T.emerald} opacity={0.85} radius={[4,4,0,0]} />
                  <Bar dataKey="exp" name="Expenses" fill={T.rose} opacity={0.7} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div style={{ height:80, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontFamily:T.fM, color:T.textMuted }}>Log income & expenses to see cash flow trends.</div>}
          </GlassCard>
          {(debts||[]).length>0 && (
            <GlassCard style={{ padding:'20px 22px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12 }}>
                <SectionLabel>Debts Overview</SectionLabel>
                <button onClick={()=>setTab('debts')} style={{ fontSize:9, fontFamily:T.fM, color:T.accent, display:'flex', alignItems:'center', gap:2 }}>Manage <IcoChevR size={9} stroke={T.accent} /></button>
              </div>
              {(debts||[]).map((d,i)=>{ const origBal=Number(d.originalBalance||d.balance||0); const curBal=Number(d.balance||0); const paidPct=origBal>0?((origBal-curBal)/origBal)*100:0; return (
                <div key={d.id||i} style={{ marginBottom:14 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}><span style={{ fontSize:12, fontFamily:T.fM, color:T.text }}>{d.name||d.creditor}</span><span style={{ fontSize:11, fontFamily:T.fM, color:T.rose }}>{cur}{fmtN(curBal)} remaining</span></div>
                  <ProgressBar pct={paidPct} color={T.emerald} height={5} />
                  <div style={{ fontSize:9, fontFamily:T.fM, color:T.textSub, marginTop:3 }}>{paidPct.toFixed(0)}% paid off · {d.rate||0}% APR</div>
                </div>
              ); })}
            </GlassCard>
          )}
        </div>
      )}

      {tab==='spending' && (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {/* Controls */}
          <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
            <Btn onClick={()=>setModal('expense')} color={T.rose}>+ Log Expense</Btn>
            <Btn onClick={()=>setModal('budget')} color={T.amber}>📊 Budgets</Btn>
            <Btn onClick={()=>setShowMonthlyReview(true)} color={T.violet}>📅 Monthly Review</Btn>
            <div style={{ flex:1 }} />
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontSize:10, fontFamily:T.fM, color:T.textSub }}>Month:</span>
              <select value={selectedMonth} onChange={e=>setSelectedMonth(e.target.value)} style={{ padding:'6px 10px', background:T.surface, border:`1px solid ${T.border}`, borderRadius:T.r, fontFamily:T.fM, fontSize:11, color:T.text, cursor:'pointer' }}>
                {availableMonths.map(m=><option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          {/* Month summary banners */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))', gap:10 }}>
            {[
              { label:'Income', val:`${cur}${fmtN(selMonthInc)}`, color:T.emerald, icon:'💰' },
              { label:'Spent', val:`${cur}${fmtN(selMonthExp)}`, color:T.rose, icon:'💳' },
              { label:'Remaining', val:`${cur}${fmtN(selMonthInc-selMonthExp)}`, color:(selMonthInc-selMonthExp)>=0?T.accent:T.rose, icon:(selMonthInc-selMonthExp)>=0?'✅':'⚠️' },
              ...(totalBudget>0?[{ label:'Budget Left', val:`${cur}${fmtN(totalBudget-selMonthExp)}`, color:(totalBudget-selMonthExp)>=0?T.sky:T.rose, icon:'📊' }]:[]),
            ].map((s,i)=>(
              <GlassCard key={i} style={{ padding:'14px 16px' }}>
                <div style={{ fontSize:9, fontFamily:T.fM, color:T.textSub, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:4 }}>{s.icon} {s.label}</div>
                <div style={{ fontSize:17, fontFamily:T.fD, fontWeight:700, color:s.color }}>{s.val}</div>
              </GlassCard>
            ))}
          </div>

          {spendByCat.length===0 ? (
            <GlassCard style={{ padding:40, textAlign:'center' }}><div style={{ fontSize:11, fontFamily:T.fM, color:T.textMuted }}>No expenses for {selectedMonth}.</div></GlassCard>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:14 }}>
              <GlassCard style={{ padding:'20px 22px' }}>
                <SectionLabel>Breakdown — {selectedMonth}</SectionLabel>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart><Pie data={spendByCat} cx="50%" cy="50%" innerRadius={55} outerRadius={88} paddingAngle={3} dataKey="value">{spendByCat.map((e,i)=><Cell key={i} fill={e.color} />)}</Pie><Tooltip content={<ChartTooltip prefix={cur} />} /></PieChart>
                </ResponsiveContainer>
                <div style={{ marginTop:10 }}>
                  {spendByCat.slice(0,5).map((c,i)=>(
                    <div key={i} style={{ display:'flex', justifyContent:'space-between', fontSize:10, fontFamily:T.fM, padding:'3px 0' }}>
                      <span style={{ color:T.textSub, display:'flex', alignItems:'center', gap:5 }}><span style={{ width:8,height:8,borderRadius:'50%',background:c.color,display:'inline-block' }} />{c.name}</span>
                      <span style={{ color:T.text, fontWeight:600 }}>{cur}{fmtN(c.value)}</span>
                    </div>
                  ))}
                </div>
              </GlassCard>
              <GlassCard style={{ padding:'20px 22px' }}>
                <SectionLabel>vs Budget</SectionLabel>
                {Object.keys(budgets||{}).length===0 && <div style={{ fontSize:10,fontFamily:T.fM,color:T.textMuted,textAlign:'center',padding:'16px 0' }}>No budgets set yet.</div>}
                {spendByCat.map((c,i)=>{ const bs=budgetStatus[c.name]; const budget=bs?.budget||0; const over=budget>0&&c.value>budget; return (
                  <div key={i} style={{ marginBottom:12 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                      <span style={{ fontSize:11, fontFamily:T.fM, color:T.text }}>{c.name}</span>
                      <span style={{ fontSize:11, fontFamily:T.fM, color:over?T.rose:c.color, fontWeight:600 }}>{cur}{fmtN(c.value)}{budget>0?` / ${cur}${fmtN(budget)}`:''}</span>
                    </div>
                    <ProgressBar pct={budget>0?(c.value/budget)*100:(c.value/Math.max(1,selMonthExp))*100} color={over?T.rose:c.color} height={4} />
                    {over?<div style={{ fontSize:9,fontFamily:T.fM,color:T.rose,marginTop:2 }}>Over by {cur}{fmtN(c.value-budget)}</div>:budget>0&&<div style={{ fontSize:9,fontFamily:T.fM,color:T.emerald,marginTop:2 }}>{cur}{fmtN(budget-c.value)} remaining</div>}
                  </div>
                ); })}
              </GlassCard>
            </div>
          )}

          {/* Full expense list for selected month */}
          <GlassCard style={{ padding:'20px 22px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
              <SectionLabel>All Expenses — {selectedMonth} ({selMonthExpenses.length})</SectionLabel>
              <span style={{ fontSize:12, fontFamily:T.fM, color:T.rose, fontWeight:700 }}>{cur}{fmtN(selMonthExp)}</span>
            </div>
            {selMonthExpenses.length===0 ? (
              <div style={{ fontSize:11, fontFamily:T.fM, color:T.textMuted, textAlign:'center', padding:20 }}>No expenses for {selectedMonth}.</div>
            ) : selMonthExpenses.map((e,i)=>(
              <div key={e.id||i} className="los-row" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'9px 0', borderBottom:i<selMonthExpenses.length-1?`1px solid ${T.border}`:'none' }}>
                <div style={{ display:'flex', gap:10, alignItems:'center', flex:1, minWidth:0 }}>
                  <div style={{ width:8, height:8, borderRadius:'50%', background:getCatColor(e.category), flexShrink:0 }} />
                  <div style={{ minWidth:0 }}>
                    <div style={{ fontSize:12, fontFamily:T.fM, color:T.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{e.note||e.category}</div>
                    <div style={{ fontSize:9, fontFamily:T.fM, color:T.textSub, marginTop:2 }}>{e.category}{e.subcategory?` · ${e.subcategory}`:''} · {e.date}{e.regret&&<span title="Regret" style={{ marginLeft:6 }}>🤦</span>}{e.autoLogged&&<span title="Auto-logged" style={{ marginLeft:4, color:T.sky }}>🔄</span>}</div>
                  </div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
                  <span style={{ fontSize:13, fontFamily:T.fM, fontWeight:600, color:T.rose }}>-{cur}{fmtN(e.amount)}</span>
                  <button onClick={()=>setSplitExpense(e)} title="Split expense" style={{ padding:4, borderRadius:6, background:T.surface, border:`1px solid ${T.border}`, opacity:0.5, fontSize:10 }}>✂️</button>
                  <button onClick={()=>setEditExpense(e)} style={{ padding:4, borderRadius:6, background:T.surface, border:`1px solid ${T.border}`, opacity:0.5 }}><IcoPencil size={11} stroke={T.sky} /></button>
                  <button onClick={()=>actions.removeExpense(e.id)} style={{ padding:4, borderRadius:6, background:T.surface, border:`1px solid ${T.border}`, opacity:0.5 }}><IcoTrash size={11} stroke={T.rose} /></button>
                </div>
              </div>
            ))}
            {selMonthExpenses.length>0 && (
              <div style={{ marginTop:12, paddingTop:12, borderTop:`1px solid ${T.border}`, display:'flex', justifyContent:'space-between', fontSize:11, fontFamily:T.fM }}>
                <span style={{ color:T.textSub }}>{selMonthExpenses.length} transactions</span>
                <span style={{ color:T.rose, fontWeight:700 }}>{cur}{fmtN(selMonthExp)} total</span>
              </div>
            )}
          </GlassCard>

          {/* Income list for selected month */}
          {(() => { const selMonthIncomes = [...incomes].filter(i=>i.date?.startsWith(selectedMonth)).sort((a,b)=>a.date<b.date?1:-1); return selMonthIncomes.length > 0 && (
            <GlassCard style={{ padding:'20px 22px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                <SectionLabel>Income — {selectedMonth} ({selMonthIncomes.length})</SectionLabel>
                <span style={{ fontSize:12, fontFamily:T.fM, color:T.emerald, fontWeight:700 }}>{cur}{fmtN(selMonthInc)}</span>
              </div>
              {selMonthIncomes.map((inc,i)=>(
                <div key={inc.id||i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'9px 0', borderBottom:i<selMonthIncomes.length-1?`1px solid ${T.border}`:'none' }}>
                  <div style={{ display:'flex', gap:10, alignItems:'center', flex:1, minWidth:0 }}>
                    <div style={{ width:8, height:8, borderRadius:'50%', background:T.emerald, flexShrink:0 }} />
                    <div style={{ minWidth:0 }}>
                      <div style={{ fontSize:12, fontFamily:T.fM, color:T.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{inc.note||'Income'}</div>
                      <div style={{ fontSize:9, fontFamily:T.fM, color:T.textSub, marginTop:2 }}>{inc.date}{inc.recurring?` · 🔄 ${inc.frequency}`:''}</div>
                    </div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
                    <span style={{ fontSize:13, fontFamily:T.fM, fontWeight:600, color:T.emerald }}>+{cur}{fmtN(inc.amount)}</span>
                    <button onClick={()=>setEditIncome(inc)} style={{ padding:4, borderRadius:6, background:T.surface, border:`1px solid ${T.border}`, opacity:0.5 }}><IcoPencil size={11} stroke={T.sky} /></button>
                    <button onClick={()=>actions.removeIncome(inc.id)} style={{ padding:4, borderRadius:6, background:T.surface, border:`1px solid ${T.border}`, opacity:0.5 }}><IcoTrash size={11} stroke={T.rose} /></button>
                  </div>
                </div>
              ))}
            </GlassCard>
          ); })()}
        </div>
      )}

      {tab==='debts' && (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            <Btn onClick={()=>setModal('debt')} color={T.rose}>+ Add Debt</Btn>
            {(debts||[]).length>0 && <Btn onClick={()=>setModal('pay-debt')} color={T.emerald}>💸 Log Payment</Btn>}
          </div>
          {(debts||[]).length === 0 ? (
            <GlassCard style={{ padding:40, textAlign:'center' }}>
              <div style={{ fontSize:28, marginBottom:12 }}>⚠️</div>
              <div style={{ fontSize:13, fontFamily:T.fD, fontWeight:600, color:T.text, marginBottom:6 }}>No debts tracked</div>
              <div style={{ fontSize:11, fontFamily:T.fM, color:T.textMuted }}>Add your debts to track payoff progress and optimize your strategy.</div>
            </GlassCard>
          ) : (<>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:12 }}>
              {[{ label:'Total Debt', val:`${cur}${fmtN(debtVal)}`, color:T.rose }, { label:'Payoff (months)', val:payoffInfo.months>599?'50+ years':`${payoffInfo.months} mo`, color:T.amber }, { label:'Total Interest', val:`${cur}${fmtN(payoffInfo.totalInterest)}`, color:T.textSub }].map((m,i)=>(
                <GlassCard key={i} style={{ padding:'16px 18px' }}>
                  <div style={{ fontSize:9, fontFamily:T.fM, color:T.textSub, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:6 }}>{m.label}</div>
                  <div style={{ fontSize:18, fontFamily:T.fD, fontWeight:700, color:m.color }}>{m.val}</div>
                </GlassCard>
              ))}
            </div>
            <GlassCard style={{ padding:'20px 22px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                <SectionLabel>Payoff Strategy Calculator</SectionLabel>
                <div style={{ display:'flex', gap:6 }}>
                  {['avalanche','snowball'].map(m=>(
                    <button key={m} onClick={()=>setPayoffMethod(m)} style={{ padding:'4px 12px', borderRadius:99, fontSize:9, fontFamily:T.fM, textTransform:'uppercase', letterSpacing:'0.05em', background:payoffMethod===m?T.accentDim:T.surface, color:payoffMethod===m?T.accent:T.textSub, border:`1px solid ${payoffMethod===m?T.accent+'44':T.border}` }}>{m}</button>
                  ))}
                </div>
              </div>
              <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:14 }}>
                <span style={{ fontSize:11, fontFamily:T.fM, color:T.textSub, whiteSpace:'nowrap' }}>Extra monthly payment:</span>
                <input type="number" value={extraPayment} onChange={e=>setExtraPayment(Number(e.target.value)||0)} placeholder="0" style={{ width:120, padding:'6px 10px', background:'rgba(255,255,255,0.04)', border:`1px solid ${T.border}`, borderRadius:T.r, fontFamily:T.fM, fontSize:12, color:T.text }} />
                <div style={{ fontSize:10, fontFamily:T.fM, color:T.textSub }}>→ Payoff in <span style={{ color:T.accent, fontWeight:600 }}>{payoffInfo.months} months</span>, saving <span style={{ color:T.emerald }}>{cur}{fmtN((debts||[]).reduce((s,d)=>s+Number(d.balance||0)*Number(d.rate||0)/100,0)*payoffInfo.months/12)}</span> in interest</div>
              </div>
              <div style={{ fontSize:9, fontFamily:T.fM, color:T.textMuted, padding:'8px 12px', background:T.surface, borderRadius:T.r }}>
                <strong style={{ color:T.accent }}>Avalanche</strong> pays highest interest rate first — minimizes total interest paid.<br/>
                <strong style={{ color:T.violet }}>Snowball</strong> pays smallest balance first — builds momentum and motivation.
              </div>
            </GlassCard>

            {/* ── Debt → FI Impact ────────────────────────────────────────── */}
            {(() => {
              if (!payoffInfo.months || payoffInfo.months > 599) return null;
              const totalMinPayments = (debts||[]).reduce((s,d)=>s+Number(d.minPayment||0),0);
              const extraMonthly     = Number(extraPayment)||0;
              const totalMonthly     = totalMinPayments + extraMonthly;
              const payoffYears      = (payoffInfo.months / 12).toFixed(1);
              const payoffYear       = new Date().getFullYear() + Math.ceil(payoffInfo.months / 12);
              // After debt-free: this monthly payment becomes investable
              // Simulate: current portfolio + current contributions → payoff year
              // Then add freed cashflow to contributions for remaining years to FI
              const r = 0.07;
              const annualContribNow = Math.max(0, (() => {
                const trail = [1,2,3].map(i => {
                  const d = new Date(); d.setMonth(d.getMonth()-i);
                  const m = d.toISOString().slice(0,7);
                  const inc = (incomes||[]).filter(x=>x.date?.startsWith(m)).reduce((s,x)=>s+Number(x.amount||0),0);
                  const exp = (expenses||[]).filter(x=>x.date?.startsWith(m)).reduce((s,x)=>s+Number(x.amount||0),0);
                  return Math.max(0, inc-exp);
                });
                return trail.reduce((s,x)=>s+x,0)/3;
              })()) * 12;

              const portfolioNow = (investments||[]).reduce((s,i)=>s+Number((i.currentPrice??i.buyPrice)||0)*Number(i.quantity||0),0)
                + (assets||[]).filter(a=>a.type==='Cash').reduce((s,a)=>s+Number(a.value||0),0);
              const annualExp = (expenses||[]).filter(e=>e.date?.startsWith(today().slice(0,7)))
                .reduce((s,e)=>s+Number(e.amount||0),0) * 12 || 24000;
              const fiTarget = annualExp * 25;

              // Scenario A: without extra debt payoff speed (baseline)
              const simulateFI = (startPortfolio, annualContrib, startYear) => {
                let p = startPortfolio, yr = 0;
                while (p < fiTarget && yr < 60) { p = p*(1+r) + annualContrib; yr++; }
                return { years: yr, fiYear: startYear + yr };
              };

              // Baseline: current contributions only, debt never fully paid
              const baselineFI = simulateFI(portfolioNow, annualContribNow, new Date().getFullYear());

              // With debt payoff: portfolio grows at current rate until payoff,
              // then freed cashflow added to contributions
              const monthsToPayoff = payoffInfo.months;
              let portfolioAtPayoff = portfolioNow;
              for (let m = 0; m < monthsToPayoff; m++) {
                portfolioAtPayoff = portfolioAtPayoff * (1 + r/12) + (annualContribNow/12);
              }
              const boostedAnnual  = annualContribNow + totalMonthly * 12;
              const afterPayoffFI  = simulateFI(portfolioAtPayoff, boostedAnnual, payoffYear);
              const yearsGained    = Math.max(0, baselineFI.fiYear - afterPayoffFI.fiYear);

              return (
                <GlassCard style={{ padding:'20px 22px', border:`1px solid ${T.violet}33`, background:`linear-gradient(135deg,${T.violet}06,${T.accent}04)` }}>
                  <SectionLabel>Impact on Financial Independence</SectionLabel>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:10, marginBottom:16 }}>
                    {[
                      { label:'Debt-free year',         val:String(payoffYear),                color:T.emerald, sub:`in ${payoffYears} years` },
                      { label:'Cashflow freed',          val:`${cur}${fmtN(totalMonthly)}/mo`,  color:T.accent,  sub:`${cur}${fmtN(totalMonthly*12)}/yr to invest` },
                      { label:'FI date without payoff',  val:String(baselineFI.fiYear),         color:T.textSub, sub:`in ${baselineFI.years}yr at current pace` },
                      { label:'FI date after debt-free', val:String(afterPayoffFI.fiYear),      color:T.violet,  sub: yearsGained > 0 ? `${yearsGained} years earlier 🎉` : 'Same timeline' },
                    ].map((m,i) => (
                      <div key={i} style={{ padding:'12px 14px', borderRadius:T.r, background:T.surface, border:`1px solid ${T.border}` }}>
                        <div style={{ fontSize:9, fontFamily:T.fM, color:T.textSub, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:5 }}>{m.label}</div>
                        <div style={{ fontSize:17, fontFamily:T.fD, fontWeight:700, color:m.color, marginBottom:3 }}>{m.val}</div>
                        <div style={{ fontSize:9, fontFamily:T.fM, color:T.textMuted }}>{m.sub}</div>
                      </div>
                    ))}
                  </div>
                  {yearsGained > 0 && (
                    <div style={{ padding:'10px 14px', borderRadius:T.r, background:T.emeraldDim, border:`1px solid ${T.emerald}33`, fontSize:11, fontFamily:T.fM, color:T.text, lineHeight:1.6 }}>
                      💡 Once debt-free in <strong style={{ color:T.emerald }}>{payoffYear}</strong>, redirecting <strong style={{ color:T.accent }}>{cur}{fmtN(totalMonthly)}/mo</strong> into investments would move your FI date from <strong style={{ color:T.textSub }}>{baselineFI.fiYear}</strong> to <strong style={{ color:T.violet }}>{afterPayoffFI.fiYear}</strong> — <strong style={{ color:T.emerald }}>{yearsGained} years earlier</strong>.
                    </div>
                  )}
                  <div style={{ marginTop:10, fontSize:9, fontFamily:T.fM, color:T.textMuted }}>⚠ Assumes freed cashflow goes directly into investments at 7%/yr. Does not model inflation or taxes.</div>
                </GlassCard>
              );
            })()}
            <GlassCard style={{ padding:'20px 22px' }}>
              <SectionLabel>Debt Accounts</SectionLabel>
              {(debts||[]).map((d,i)=>{ const origBal=Number(d.originalBalance||d.balance||0); const curBal=Number(d.balance||0); const paidPct=origBal>0?((origBal-curBal)/origBal)*100:0; return (
                <div key={d.id||i} style={{ padding:'14px 0', borderBottom:i<(debts||[]).length-1?`1px solid ${T.border}`:'none' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                    <div>
                      <div style={{ fontSize:13, fontFamily:T.fD, fontWeight:700, color:T.text }}>{d.name}</div>
                      <div style={{ display:'flex', gap:8, marginTop:3 }}><Badge color={T.rose}>{d.type||'Debt'}</Badge><span style={{ fontSize:10, fontFamily:T.fM, color:T.textSub }}>{d.rate||0}% APR · Min {cur}{fmtN(d.minPayment||0)}/mo</span></div>
                    </div>
                    <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                      <div style={{ textAlign:'right' }}>
                        <div style={{ fontSize:14, fontFamily:T.fM, fontWeight:600, color:T.rose }}>{cur}{fmtN(curBal)}</div>
                        <div style={{ fontSize:10, fontFamily:T.fM, color:T.textSub }}>{paidPct.toFixed(0)}% paid</div>
                      </div>
                      <button onClick={()=>setEditDebt(d)} style={{ padding:5, borderRadius:6, background:T.surface, border:`1px solid ${T.border}`, opacity:0.5 }}><IcoPencil size={12} stroke={T.sky} /></button>
                      <button onClick={()=>actions.removeDebt(d.id)} style={{ padding:5, borderRadius:6, background:T.surface, border:`1px solid ${T.border}`, opacity:0.5 }}><IcoTrash size={12} stroke={T.rose} /></button>
                    </div>
                  </div>
                  <ProgressBar pct={paidPct} color={T.emerald} height={5} />
                </div>
              ); })}
            </GlassCard>
          </>)}
        </div>
      )}

      {tab==='investments' && (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ display:'flex', gap:10 }}>
            <Btn onClick={()=>setModal('investment')} color={T.violet}>+ Add Position</Btn>
          </div>
          {(investments||[]).length===0 ? (
            <GlassCard style={{ padding:40, textAlign:'center' }}><div style={{ fontSize:11, fontFamily:T.fM, color:T.textMuted }}>No investment positions yet. Add your first position.</div></GlassCard>
          ) : (<>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:12 }}>
              {[{ label:'Portfolio Value', val:`${cur}${fmtN(invVal)}`, color:T.violet }, { label:'Total Invested', val:`${cur}${fmtN((investments||[]).reduce((s,i)=>s+Number(i.buyPrice||0)*Number(i.quantity||0),0))}`, color:T.text }, { label:'Total P&L', val:`${invVal-(investments||[]).reduce((s,i)=>s+Number(i.buyPrice||0)*Number(i.quantity||0),0)>=0?'+':''}${cur}${fmtN(invVal-(investments||[]).reduce((s,i)=>s+Number(i.buyPrice||0)*Number(i.quantity||0),0))}`, color:invVal>=(investments||[]).reduce((s,i)=>s+Number(i.buyPrice||0)*Number(i.quantity||0),0)?T.emerald:T.rose }].map((m,i)=>(
                <GlassCard key={i} style={{ padding:'16px 18px' }}>
                  <div style={{ fontSize:9, fontFamily:T.fM, color:T.textSub, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:6 }}>{m.label}</div>
                  <div style={{ fontSize:18, fontFamily:T.fD, fontWeight:700, color:m.color }}>{m.val}</div>
                </GlassCard>
              ))}
            </div>
            <GlassCard style={{ padding:'20px 22px' }}>
              <SectionLabel>Positions</SectionLabel>
              {(investments||[]).map((inv,i)=>{ const cp=inv.currentPrice??inv.buyPrice??0; const val=Number(cp)*Number(inv.quantity||0); const cost=Number(inv.buyPrice||0)*Number(inv.quantity||0); const pnl=val-cost; const pnlPct=cost>0?(pnl/cost)*100:0; return (
                <div key={inv.id||i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:i<(investments||[]).length-1?`1px solid ${T.border}`:'none' }}>
                  <div>
                    <div style={{ fontSize:13, fontFamily:T.fD, fontWeight:700, color:T.text }}>{inv.symbol||inv.name}</div>
                    <div style={{ fontSize:10, fontFamily:T.fM, color:T.textSub }}>×{inv.quantity} @ {cur}{fmtN(inv.buyPrice)} · <Badge color={T.textSub}>{inv.type||'Stock'}</Badge></div>
                  </div>
                  <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontSize:13, fontFamily:T.fM, fontWeight:600, color:T.text }}>{cur}{fmtN(val)}</div>
                      <div style={{ fontSize:10, fontFamily:T.fM, color:pnl>=0?T.emerald:T.rose }}>{pnl>=0?'+':''}{cur}{fmtN(pnl)} ({pnlPct.toFixed(1)}%)</div>
                    </div>
                    <button onClick={()=>actions.removeInvestment(inv.id)} style={{ padding:5, borderRadius:6, background:T.surface, border:`1px solid ${T.border}`, opacity:0.5 }}><IcoTrash size={12} stroke={T.rose} /></button>
                  </div>
                </div>
              ); })}
            </GlassCard>
            {/* S4: Live Prices Panel */}
            <LivePricesPanel investments={investments} onUpdatePrice={actions.updateInvestmentPrice} />
          </>)}
        </div>
      )}

      {tab==='trades' && (
        <TradeJournalTab />
      )}

      {tab==='watchlist' && (
        <WatchlistTab />
      )}

      {tab==='investor' && (
        <InvestorProfileTab data={data} actions={actions} />
      )}

      {tab==='depreciation' && (
        <AssetDepreciationTab data={data} />
      )}


      {tab==='goals' && (() => {
        const allCats = ['all', ...new Set((goals||[]).map(g=>g.cat||'other').filter(Boolean))];
        const filteredGoals = goalCatFilter==='all' ? goals : (goals||[]).filter(g=>(g.cat||'other')===goalCatFilter);
        const catColors = { finance:T.accent, health:T.sky, growth:T.violet, career:T.amber, other:T.textSub };
        return (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8 }}>
            <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
              {allCats.map(cat=>(
                <button key={cat} onClick={()=>setGoalCatFilter(cat)} style={{ padding:'4px 12px', borderRadius:99, fontSize:9, fontFamily:T.fM, textTransform:'uppercase', letterSpacing:'0.06em', background:goalCatFilter===cat?(catColors[cat]||T.amber)+'22':'transparent', color:goalCatFilter===cat?(catColors[cat]||T.amber):T.textSub, border:`1px solid ${goalCatFilter===cat?(catColors[cat]||T.amber)+'55':T.border}`, cursor:'pointer' }}>{cat}</button>
              ))}
            </div>
            <Btn onClick={()=>setModal('goal')} color={T.amber}>+ New Goal</Btn>
          </div>
          {filteredGoals.length===0 ? (
            <GlassCard style={{ padding:40, textAlign:'center' }}><div style={{ fontSize:11, fontFamily:T.fM, color:T.textMuted }}>{goalCatFilter==='all'?'No goals yet. Create your first financial goal.':'No goals in this category.'}</div></GlassCard>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:12 }}>
              {filteredGoals.map((goal,i)=>{
                const pct=Math.min(100,Math.round(((goal.current||0)/Math.max(1,goal.target))*100));
                const catColors={finance:T.accent,health:T.sky,growth:T.violet,career:T.amber}; const c=catColors[goal.cat]||T.accent;
                const remaining = Math.max(0, Number(goal.target||0) - Number(goal.current||0));
                const monthsLeft = goal.deadline ? Math.max(1, Math.round((new Date(goal.deadline)-new Date())/(1000*60*60*24*30.4))) : null;
                const monthlyNeeded = monthsLeft ? (remaining / monthsLeft) : null;

                // ── Goal velocity: on-track / behind / at risk ────────────────
                let velocity = null;
                if (goal.deadline && goal.target && goal.date) {
                  const daysTotal = Math.max(1, Math.round((new Date(goal.deadline) - new Date(goal.date)) / 86400000));
                  const daysGone  = Math.round((new Date() - new Date(goal.date)) / 86400000);
                  const pctTime   = Math.min(1, daysGone / daysTotal);
                  const pctDone   = Math.min(1, Number(goal.current||0) / Number(goal.target||1));
                  const lag = pctTime - pctDone;
                  const daysLeft = Math.round((new Date(goal.deadline) - new Date()) / 86400000);
                  if (pctDone >= 1) {
                    velocity = { label:'✓ Complete', color: T.emerald };
                  } else if (daysLeft < 0) {
                    velocity = { label:'Overdue', color: T.rose };
                  } else if (lag > 0.3) {
                    velocity = { label:`⚠ Behind — ${Math.round(lag*100)}% off pace`, color: T.rose };
                  } else if (lag > 0.15) {
                    velocity = { label:`↓ Slightly behind`, color: T.amber };
                  } else if (lag < -0.1) {
                    velocity = { label:`↑ Ahead of pace`, color: T.emerald };
                  } else {
                    velocity = { label:'→ On track', color: T.emerald };
                  }
                }

                return (
                <GlassCard key={goal.id||i} style={{ padding:'18px 20px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                    <div>
                      <div style={{ fontSize:20, marginBottom:6 }}>{goal.emoji||'🎯'}</div>
                      <div style={{ fontSize:13, fontFamily:T.fD, fontWeight:700, color:T.text }}>{goal.name}</div>
                      <div style={{ display:'flex', gap:6, alignItems:'center', marginTop:4, flexWrap:'wrap' }}>
                        <Badge color={c}>{goal.cat||'goal'}</Badge>
                        {velocity && <Badge color={velocity.color}>{velocity.label}</Badge>}
                      </div>
                    </div>
                    <div style={{ width:46, height:46, borderRadius:'50%', background:`conic-gradient(${c} ${pct*3.6}deg,${T.border} 0deg)`, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:`0 0 12px ${c}33` }}><div style={{ width:34, height:34, borderRadius:'50%', background:T.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontFamily:T.fM, fontWeight:600, color:c }}>{pct}%</div></div>
                  </div>
                  <ProgressBar pct={pct} color={c} height={5} />
                  <div style={{ display:'flex', justifyContent:'space-between', marginTop:6, fontSize:10, fontFamily:T.fM, color:T.textSub }}><span>{cur}{fmtN(goal.current||0)}</span><span>{cur}{fmtN(goal.target)}</span></div>
                  {monthlyNeeded !== null && pct < 100 && (
                    <div style={{ marginTop:10, padding:'8px 10px', borderRadius:T.r, background:`${c}11`, border:`1px solid ${c}22`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <span style={{ fontSize:10, fontFamily:T.fM, color:T.textSub }}>💡 Save <span style={{ color:c, fontWeight:700 }}>{cur}{fmtN(monthlyNeeded)}/mo</span></span>
                      <span style={{ fontSize:9, fontFamily:T.fM, color:T.textMuted }}>{monthsLeft}mo left</span>
                    </div>
                  )}
                  {goalIdx===i ? (
                    <div style={{ display:'flex', gap:8, marginTop:10 }}>
                      <Input type="number" value={goalAmt} onChange={e=>setGoalAmt(e.target.value)} placeholder="Add amount" style={{ flex:1 }} />
                      <Btn onClick={()=>{ actions.updateGoalProgress(goal.id,Number(goalAmt)); setGoalAmt(''); setGoalIdx(null); }} color={c} style={{ padding:'6px 12px' }}>+</Btn>
                    </div>
                  ) : (
                    <div style={{ display:'flex', gap:8, marginTop:10 }}>
                      <button onClick={()=>setGoalIdx(i)} style={{ fontSize:10, fontFamily:T.fM, color:c }}>+ Add Progress</button>
                      <button onClick={()=>actions.removeGoal(goal.id)} style={{ fontSize:10, fontFamily:T.fM, color:T.textMuted, marginLeft:'auto' }}>Remove</button>
                    </div>
                  )}
                </GlassCard>
              ); })}
            </div>
          )}
        </div>
      )})()} 

      {tab==='assets' && (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ display:'flex', gap:10 }}><Btn onClick={()=>setModal('asset')} color={T.accent}>+ Add Asset</Btn></div>
          {(assets||[]).length===0 ? (
            <GlassCard style={{ padding:40, textAlign:'center' }}><div style={{ fontSize:11, fontFamily:T.fM, color:T.textMuted }}>No assets yet. Add your cash, property, and other assets.</div></GlassCard>
          ) : (
            <GlassCard style={{ padding:'20px 22px' }}>
              <SectionLabel>Assets · Total {cur}{fmtN(assetVal)}</SectionLabel>
              {(assets||[]).map((a,i)=>(
                <div key={a.id||i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:i<(assets||[]).length-1?`1px solid ${T.border}`:'none' }}>
                  <div><div style={{ fontSize:12, fontFamily:T.fM, color:T.text }}>{a.name}</div><Badge color={T.textSub}>{a.type||'Other'}</Badge></div>
                  <div style={{ fontSize:14, fontFamily:T.fD, fontWeight:700, color:T.accent }}>{cur}{fmtN(a.value)}</div>
                </div>
              ))}
            </GlassCard>
          )}
        </div>
      )}

      {tab==='recurring' && (() => {
        const billTotal = billsArr.reduce((s,b)=>s+Number(b.amount||0),0);
        const recurringIncomes = (incomes||[]).filter(i => i.recurring);
        const recurringIncomeMo = recurringIncomes.reduce((s,i) => {
          const amt = Number(i.amount||0);
          if (i.frequency==='yearly') return s + amt/12;
          if (i.frequency==='weekly') return s + amt*4.33;
          if (i.frequency==='bi-weekly') return s + amt*2.17;
          return s + amt; // monthly default
        }, 0);
        const combinedMonthly = monthlySubTotal + billTotal;
        return (
          <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
            {/* Summary bar */}
            <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
              <div style={{ flex:1, minWidth:140, padding:'10px 14px', background:T.emeraldDim, borderRadius:T.r, border:`1px solid ${T.emerald}22` }}>
                <div style={{ fontSize:9, fontFamily:T.fM, color:T.textSub, letterSpacing:'0.08em', marginBottom:4 }}>RECURRING INCOME / MO</div>
                <div style={{ fontSize:18, fontFamily:T.fD, fontWeight:700, color:T.emerald }}>{cur}{fmtN(recurringIncomeMo)}</div>
                <div style={{ fontSize:10, fontFamily:T.fM, color:T.textSub, marginTop:2 }}>{recurringIncomes.length} source{recurringIncomes.length!==1?'s':''}</div>
              </div>
              <div style={{ flex:1, minWidth:140, padding:'10px 14px', background:T.roseDim, borderRadius:T.r, border:`1px solid ${T.rose}22` }}>
                <div style={{ fontSize:9, fontFamily:T.fM, color:T.textSub, letterSpacing:'0.08em', marginBottom:4 }}>RECURRING COSTS / MO</div>
                <div style={{ fontSize:18, fontFamily:T.fD, fontWeight:700, color:T.rose }}>{cur}{fmtN(combinedMonthly)}</div>
                <div style={{ fontSize:10, fontFamily:T.fM, color:T.textSub, marginTop:2 }}>{cur}{fmtN(combinedMonthly*12)}/year</div>
              </div>
              <div style={{ flex:1, minWidth:140, padding:'10px 14px', background:recurringIncomeMo>combinedMonthly?T.emeraldDim:T.roseDim, borderRadius:T.r, border:`1px solid ${recurringIncomeMo>combinedMonthly?T.emerald:T.rose}22` }}>
                <div style={{ fontSize:9, fontFamily:T.fM, color:T.textSub, letterSpacing:'0.08em', marginBottom:4 }}>NET RECURRING / MO</div>
                <div style={{ fontSize:18, fontFamily:T.fD, fontWeight:700, color:recurringIncomeMo>combinedMonthly?T.emerald:T.rose }}>{recurringIncomeMo>combinedMonthly?'+':''}{cur}{fmtN(recurringIncomeMo-combinedMonthly)}</div>
                <div style={{ fontSize:10, fontFamily:T.fM, color:T.textSub, marginTop:2 }}>{recurringIncomeMo>0?`${((combinedMonthly/recurringIncomeMo)*100).toFixed(0)}% of recurring income`:'Add recurring income'}</div>
              </div>
            </div>

            {/* Recurring Income section */}
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                <div style={{ fontSize:11, fontFamily:T.fM, color:T.textSub, fontWeight:600, letterSpacing:'0.08em' }}>💰 RECURRING INCOME</div>
                <Btn onClick={()=>setModal('income')} color={T.emerald} style={{ padding:'4px 12px', fontSize:11 }}>+ Add</Btn>
              </div>
              {recurringIncomes.length === 0 ? (
                <GlassCard style={{ padding:24, textAlign:'center' }}>
                  <div style={{ fontSize:22, marginBottom:8 }}>💰</div>
                  <div style={{ fontSize:12, fontFamily:T.fM, color:T.textMuted, marginBottom:10 }}>No recurring income tracked</div>
                  <div style={{ fontSize:10, fontFamily:T.fM, color:T.textSub }}>Log income with the "Recurring" toggle on to track salary, rent, dividends, etc.</div>
                </GlassCard>
              ) : (
                <GlassCard style={{ padding:'14px 18px' }}>
                  {recurringIncomes.map((inc, i) => {
                    const monthly = inc.frequency==='yearly' ? Number(inc.amount)/12 : inc.frequency==='weekly' ? Number(inc.amount)*4.33 : inc.frequency==='bi-weekly' ? Number(inc.amount)*2.17 : Number(inc.amount);
                    const freqLabel = { monthly:'mo', yearly:'yr', weekly:'wk', 'bi-weekly':'2wk' }[inc.frequency] || 'mo';
                    return (
                      <div key={inc.id||i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:i<recurringIncomes.length-1?`1px solid ${T.border}`:'none' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                          <div style={{ width:34, height:34, borderRadius:T.r, background:T.emeraldDim, border:`1px solid ${T.emerald}33`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>💰</div>
                          <div>
                            <div style={{ fontSize:12, fontFamily:T.fD, fontWeight:600, color:T.text }}>{inc.note||'Recurring Income'}</div>
                            <div style={{ fontSize:10, fontFamily:T.fM, color:T.textSub }}>🔄 {inc.frequency||'monthly'} · Since {inc.date}</div>
                          </div>
                        </div>
                        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                          <div style={{ textAlign:'right' }}>
                            <div style={{ fontSize:12, fontFamily:T.fM, fontWeight:600, color:T.emerald }}>{cur}{fmtN(inc.amount)}/{freqLabel}</div>
                            {inc.frequency!=='monthly' && <div style={{ fontSize:10, fontFamily:T.fM, color:T.textSub }}>{cur}{fmtN(monthly)}/mo</div>}
                          </div>
                          <button onClick={()=>setEditIncome(inc)} style={{ padding:5, borderRadius:6, background:T.surface, border:`1px solid ${T.border}` }} title="Edit"><IcoPencil size={11} stroke={T.sky} /></button>
                          <button onClick={()=>actions.removeIncome(inc.id)} style={{ padding:5, borderRadius:6, background:T.surface, border:`1px solid ${T.border}`, opacity:0.5 }}><IcoTrash size={11} stroke={T.rose} /></button>
                        </div>
                      </div>
                    );
                  })}
                  <div style={{ marginTop:12, paddingTop:12, borderTop:`1px solid ${T.border}`, display:'flex', justifyContent:'space-between', fontSize:10, fontFamily:T.fM }}>
                    <span style={{ color:T.textSub }}>{recurringIncomes.length} source{recurringIncomes.length!==1?'s':''} · {cur}{fmtN(recurringIncomeMo*12)}/year</span>
                    <span style={{ color:T.emerald, fontWeight:700 }}>{cur}{fmtN(recurringIncomeMo)}/month</span>
                  </div>
                </GlassCard>
              )}
            </div>

            {/* Subscriptions section */}
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                <div style={{ fontSize:11, fontFamily:T.fM, color:T.textSub, fontWeight:600, letterSpacing:'0.08em' }}>🔄 SUBSCRIPTIONS</div>
                <Btn onClick={()=>setModal('subscription')} color={T.sky} style={{ padding:'4px 12px', fontSize:11 }}>+ Add</Btn>
              </div>
              {(subscriptions||[]).length===0 ? (
                <GlassCard style={{ padding:24, textAlign:'center' }}>
                  <div style={{ fontSize:22, marginBottom:8 }}>🔄</div>
                  <div style={{ fontSize:12, fontFamily:T.fM, color:T.textMuted }}>No subscriptions tracked yet</div>
                </GlassCard>
              ) : (
                <GlassCard style={{ padding:'14px 18px' }}>
                  {/* Annual cost shock banner */}
                  {(() => {
                    const annualTotal = (subscriptions||[]).reduce((s, sub) => {
                      const n = Number(sub.amount||0);
                      return s + (sub.cycle==='yearly' ? n : sub.cycle==='weekly' ? n*52 : n*12);
                    }, 0);
                    const monthlyTotal = annualTotal / 12;
                    return (
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 14px', borderRadius:T.r, background:`linear-gradient(135deg,${T.rose}08,${T.amber}04)`, border:`1px solid ${T.rose}22`, marginBottom:12 }}>
                        <div>
                          <div style={{ fontSize:9, fontFamily:T.fM, color:T.textSub, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:4 }}>Total subscription cost</div>
                          <div style={{ display:'flex', gap:12, alignItems:'baseline' }}>
                            <span style={{ fontSize:20, fontFamily:T.fD, fontWeight:800, color:T.rose }}>{cur}{fmtN(Math.round(annualTotal))}<span style={{ fontSize:10, fontWeight:400, color:T.textSub }}>/yr</span></span>
                            <span style={{ fontSize:12, fontFamily:T.fM, color:T.textSub }}>{cur}{fmtN(Math.round(monthlyTotal))}/mo</span>
                          </div>
                        </div>
                        <div style={{ textAlign:'right' }}>
                          <div style={{ fontSize:9, fontFamily:T.fM, color:T.textMuted, marginBottom:3 }}>{(subscriptions||[]).length} active</div>
                          <div style={{ fontSize:9, fontFamily:T.fM, color:T.rose }}>{monthInc > 0 ? `${((monthlyTotal/monthInc)*100).toFixed(1)}% of income` : 'Log income to compare'}</div>
                        </div>
                      </div>
                    );
                  })()}
                  {(subscriptions||[]).map((sub,i)=>{ const monthly=sub.cycle==='yearly'?Number(sub.amount)/12:sub.cycle==='weekly'?Number(sub.amount)*4.33:Number(sub.amount); return (
                    <div key={sub.id||i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:i<(subscriptions||[]).length-1?`1px solid ${T.border}`:'none' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <span style={{ fontSize:20 }}>{sub.emoji||'📺'}</span>
                        <div>
                          <div style={{ fontSize:12, fontFamily:T.fD, fontWeight:600, color:T.text }}>{sub.name}</div>
                          <div style={{ fontSize:10, fontFamily:T.fM, color:T.textSub }}>{sub.category} · {sub.cycle} · Next: {sub.nextDate}</div>
                        </div>
                      </div>
                      <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                        <div style={{ textAlign:'right' }}>
                          <div style={{ fontSize:12, fontFamily:T.fM, fontWeight:600, color:T.sky }}>{cur}{fmtN(sub.amount)}/{sub.cycle==='monthly'?'mo':sub.cycle==='yearly'?'yr':'wk'}</div>
                          {sub.cycle!=='monthly'&&<div style={{ fontSize:10, fontFamily:T.fM, color:T.textSub }}>{cur}{fmtN(monthly)}/mo</div>}
                        </div>
                        <button onClick={()=>setEditingSub(sub)} style={{ padding:5, borderRadius:6, background:T.surface, border:`1px solid ${T.border}` }} title="Edit"><IcoPencil size={11} stroke={T.accent} /></button>
                        <button onClick={()=>actions.removeSubscription(sub.id)} style={{ padding:5, borderRadius:6, background:T.surface, border:`1px solid ${T.border}`, opacity:0.5 }}><IcoTrash size={11} stroke={T.rose} /></button>
                      </div>
                    </div>
                  ); })}
                </GlassCard>
              )}
            </div>

            {/* Bills section */}
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                <div style={{ fontSize:11, fontFamily:T.fM, color:T.textSub, fontWeight:600, letterSpacing:'0.08em' }}>🧾 BILLS</div>
                <Btn onClick={()=>setModal('bill')} color={T.amber} style={{ padding:'4px 12px', fontSize:11 }}>+ Add</Btn>
              </div>
              {billsArr.length===0 ? (
                <GlassCard style={{ padding:24, textAlign:'center' }}>
                  <div style={{ fontSize:22, marginBottom:8 }}>🧾</div>
                  <div style={{ fontSize:12, fontFamily:T.fM, color:T.textMuted }}>No bills tracked yet</div>
                </GlassCard>
              ) : (
                <GlassCard style={{ padding:'14px 18px' }}>
                  {upcomingBills.map((bill,i)=>{ const daysUntil=Math.ceil((new Date(bill.nextDate)-new Date())/(1000*60*60*24)); const isOverdue=daysUntil<0; const isUrgent=daysUntil<=3&&daysUntil>=0; const statusColor=isOverdue?T.rose:isUrgent?T.amber:T.textSub; return (
                    <div key={bill.id||i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:i<upcomingBills.length-1?`1px solid ${T.border}`:'none' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ width:34, height:34, borderRadius:T.r, background:T.skyDim, border:`1px solid ${T.sky}33`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>{bill.emoji||'🧾'}</div>
                        <div>
                          <div style={{ fontSize:12, fontFamily:T.fD, fontWeight:600, color:T.text }}>{bill.name}</div>
                          <div style={{ fontSize:10, fontFamily:T.fM, color:T.textSub }}>{bill.category} · Due: {bill.nextDate}{bill.autoPay?' · ✓ Auto-pay':''}</div>
                        </div>
                      </div>
                      <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                        <div style={{ textAlign:'right' }}>
                          <div style={{ fontSize:12, fontFamily:T.fM, fontWeight:600, color:T.sky }}>{cur}{fmtN(bill.amount)}</div>
                          <div style={{ fontSize:10, fontFamily:T.fM, color:statusColor, fontWeight:isOverdue||isUrgent?600:400 }}>{isOverdue?`${-daysUntil}d overdue`:isUrgent?`Due in ${daysUntil}d`:`${daysUntil}d away`}</div>
                        </div>
                        <button onClick={()=>actions.markBillPaid(bill.id)} style={{ padding:'3px 8px', borderRadius:6, background:T.emeraldDim, border:`1px solid ${T.emerald}44`, fontSize:10, fontFamily:T.fM, color:T.emerald, cursor:'pointer' }}>✓</button>
                        <button onClick={()=>setEditingBill(bill)} style={{ padding:5, borderRadius:6, background:T.surface, border:`1px solid ${T.border}` }} title="Edit"><IcoPencil size={11} stroke={T.accent} /></button>
                        <button onClick={()=>actions.removeBill(bill.id)} style={{ padding:5, borderRadius:6, background:T.surface, border:`1px solid ${T.border}`, opacity:0.5 }}><IcoTrash size={11} stroke={T.rose} /></button>
                      </div>
                    </div>
                  ); })}
                  {billsArr.filter(b=>b.paid).length>0&&(
                    <div style={{ marginTop:12, paddingTop:12, borderTop:`1px solid ${T.border}` }}>
                      <div style={{ fontSize:9, fontFamily:T.fM, color:T.textMuted, marginBottom:8, letterSpacing:'0.08em' }}>PAID THIS CYCLE</div>
                      {billsArr.filter(b=>b.paid).map((bill)=>(
                        <div key={bill.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 0', opacity:0.5 }}>
                          <div style={{ display:'flex', gap:8, alignItems:'center' }}><span>{bill.emoji||'🧾'}</span><span style={{ fontSize:11, fontFamily:T.fM, color:T.textSub, textDecoration:'line-through' }}>{bill.name}</span></div>
                          <div style={{ fontSize:11, fontFamily:T.fM, color:T.emerald }}>✓ {cur}{fmtN(bill.amount)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </GlassCard>
              )}
            </div>
          </div>
        );
      })()}

      {/* S4: What-If Financial Simulator tab */}
      {tab === 'simulator' && <WhatIfSimulator data={data} />}

      {tab==='tools' && (
        <MoneyToolsTab data={data} cur={cur} />
      )}

      {/* Forecast moved from Intelligence — belongs here with financial data */}
      {tab==='forecast' && <LifeForecastTab data={data} />}

      {/* Ingest moved from Intelligence — a Money tool for importing transactions */}
      {tab==='ingest' && <DataIngestTab data={data} actions={actions} />}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ── HEALTH PAGE ───────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
function HealthPage({ data, actions }) {
  const [mealPlan, setMealPlan] = useLocalStorage('los_mealplan', null);
  const [mealPlanLoading, setMealPlanLoading] = useState(false);
  const [sleepCoachTips, setSleepCoachTips] = useLocalStorage('los_sleep_tips', null);
  const [sleepCoachLoading, setSleepCoachLoading] = useState(false);
  const [modal, setModal] = useState(null);
  const [editingVitals, setEditingVitals] = useState(null);
  const [focusActive, setFocusActive] = useState(false);
  const [focusTime, setFocusTime] = useState(25*60);
  const [elapsed, setElapsed] = useState(0);
  const [focusHabitId, setFocusHabitId] = useState('');
  const [focusComplete, setFocusComplete] = useState(false);
  const {vitals=[], habits=[], habitLogs={}} = data;
  const wu = data.settings?.weightUnit || 'lbs'; // UX fix: weight unit from settings

  useEffect(() => {
    if (!focusActive) return;
    const iv = setInterval(() => setElapsed(e => {
      if (e >= focusTime) { setFocusActive(false); setFocusComplete(true); return focusTime; }
      return e + 1;
    }), 1000);
    return () => clearInterval(iv);
  }, [focusActive, focusTime]);

  const handleFocusLog = () => {
    if (focusHabitId) actions.logHabit(focusHabitId);
    setFocusComplete(false); setElapsed(0);
  };

  const fmtTime = s => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
  const remaining = focusTime - elapsed; const fpct = (elapsed / focusTime) * 100;
  const [healthTab, setHealthTab] = useState('overview');
  const sorted = [...vitals].sort((a,b)=>a.date<b.date?1:-1);
  const recent7 = sorted.slice(0,7).reverse();
  const avgSleep    = recent7.length ? (recent7.reduce((s,v)=>s+Number(v.sleep||0),0)/recent7.length).toFixed(1) : '—';
  const avgMood     = recent7.length ? (recent7.reduce((s,v)=>s+Number(v.mood||0),0)/recent7.length).toFixed(1) : '—';
  const avgEnergy   = recent7.length ? (recent7.reduce((s,v)=>s+Number(v.energy||0),0)/recent7.length).toFixed(1) : '—';
  const avgSleepQ   = recent7.filter(v=>v.sleepQuality>0).length ? (recent7.filter(v=>v.sleepQuality>0).reduce((s,v)=>s+Number(v.sleepQuality||0),0)/recent7.filter(v=>v.sleepQuality>0).length).toFixed(1) : null;
  const latestWeight = sorted.find(v=>v.weight>0);
  const STAR_COLORS = { 5:T.emerald, 4:T.accent, 3:T.amber, 2:T.rose, 1:T.rose };
  return (
    <div style={{ animation:'fadeUp 0.4s ease' }}>
      <LogVitalsModal open={modal==='vitals'} onClose={()=>setModal(null)} onSave={e=>{actions.addVitals(e);setModal(null);}} existingDates={(vitals||[]).map(v=>v.date)} weightUnit={wu} />
      <EditVitalsModal open={!!editingVitals} onClose={()=>setEditingVitals(null)} vitals={editingVitals} onSave={(id,patch)=>{actions.updateVitals(id,patch);setEditingVitals(null);}} weightUnit={wu} />
      <div style={{ marginBottom:22 }}><SectionLabel>Health Domain</SectionLabel><h1 style={{ fontSize:26, fontFamily:T.fD, fontWeight:800, color:T.text }}>Health & Vitals</h1></div>
      <div style={{ display:'flex', gap:10, marginBottom:18 }}><Btn onClick={()=>setModal('vitals')} color={T.sky}>+ Log Vitals</Btn></div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(170px,1fr))', gap:12, marginBottom:18 }}>
        {[
          { label:'Avg Sleep (7d)', val:`${avgSleep}h`, sub:avgSleepQ?`Quality: ${avgSleepQ}/5 ⭐`:Number(avgSleep)>=7?'Great rest!':'Aim for 7-8h', color:T.sky },
          { label:'Avg Mood (7d)',  val:`${avgMood}/10`, sub:'Emotional wellbeing', color:T.violet },
          { label:'Avg Energy (7d)',val:`${avgEnergy}/10`, sub:'Vitality level', color:T.accent },
          { label:'Current Weight', val:latestWeight?`${latestWeight.weight} ${wu}`:'—', sub:latestWeight?latestWeight.date:'Not logged', color:T.emerald },
          { label:'Avg Steps (7d)', val:(() => { const s=recent7.filter(v=>v.steps>0); return s.length?Math.round(s.reduce((a,v)=>a+Number(v.steps||0),0)/s.length).toLocaleString():'—'; })(), sub:'Daily step count', color:T.amber },
        ].map((m,i)=>(
          <GlassCard key={i} style={{ padding:'16px 18px' }}>
            <div style={{ fontSize:9, fontFamily:T.fM, color:T.textSub, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:6 }}>{m.label}</div>
            <div style={{ fontSize:20, fontFamily:T.fD, fontWeight:700, color:m.color, marginBottom:4 }}>{m.val}</div>
            <div style={{ fontSize:10, fontFamily:T.fM, color:T.textSub }}>{m.sub}</div>
          </GlassCard>
        ))}
      </div>
      <div style={{ display:'flex', gap:2, marginBottom:18, background:T.surface, borderRadius:T.r, padding:3, width:'fit-content', border:`1px solid ${T.border}`, flexWrap:'wrap' }}>
        {[{id:'overview',l:'Overview'},{id:'mealplan',l:'🍽 Meals'},{id:'sleepcoach',l:'😴 Sleep Coach'},{id:'custommetrics',l:'📊 Custom Metrics'}].map(({id,l})=>(
          <button key={id} className="los-tab" onClick={()=>setHealthTab(id)} style={{ padding:'5px 14px', borderRadius:8, fontSize:9, fontFamily:T.fM, textTransform:'uppercase', letterSpacing:'0.06em', background:healthTab===id?T.skyDim:'transparent', color:healthTab===id?T.sky:T.textSub, border:`1px solid ${healthTab===id?T.sky+'33':'transparent'}`, transition:'all 0.18s' }}>{l}</button>
        ))}
      </div>

      {healthTab==='mealplan' && <AIMealPlannerTab data={data} mealPlan={mealPlan} setMealPlan={setMealPlan} mealPlanLoading={mealPlanLoading} setMealPlanLoading={setMealPlanLoading} />}
      {healthTab==='sleepcoach' && <AISleepCoachTab data={data} sleepCoachTips={sleepCoachTips} setSleepCoachTips={setSleepCoachTips} sleepCoachLoading={sleepCoachLoading} setSleepCoachLoading={setSleepCoachLoading} />}
      {healthTab==='custommetrics' && <CustomMetricsTab data={data} actions={actions} />}

      {healthTab==='overview' && <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(min(300px,100%),1fr))', gap:14 }}>
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <GlassCard style={{ padding:'20px 22px' }}>
            <SectionLabel>Sleep History</SectionLabel>
            {recent7.length>0 ? (
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={recent7} barSize={28} margin={{top:4,right:0,left:0,bottom:0}}>
                  <CartesianGrid strokeDasharray="2 4" stroke={T.border} vertical={false} />
                  <XAxis dataKey="date" tickFormatter={d=>d.slice(5)} tick={{fill:T.textSub,fontSize:9,fontFamily:T.fM}} axisLine={false} tickLine={false} />
                  <YAxis domain={[0,12]} hide />
                  <Tooltip content={<ChartTooltip suffix="h" />} />
                  <Bar dataKey="sleep" name="Sleep" fill={T.sky} opacity={0.85} radius={[5,5,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div style={{ height:80, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontFamily:T.fM, color:T.textMuted }}>Log vitals to see your sleep chart.</div>}
          </GlassCard>
          <GlassCard style={{ padding:'20px 22px' }}>
            <SectionLabel>Mood & Energy Trends</SectionLabel>
            {recent7.length>0 ? (
              <ResponsiveContainer width="100%" height={130}>
                <LineChart data={recent7} margin={{top:4,right:0,left:0,bottom:0}}>
                  <CartesianGrid strokeDasharray="2 4" stroke={T.border} vertical={false} />
                  <XAxis dataKey="date" tickFormatter={d=>d.slice(5)} tick={{fill:T.textSub,fontSize:9,fontFamily:T.fM}} axisLine={false} tickLine={false} />
                  <YAxis domain={[0,10]} hide />
                  <Tooltip content={<ChartTooltip suffix="/10" />} />
                  <Line type="monotone" dataKey="mood" name="Mood" stroke={T.violet} strokeWidth={2} dot={{fill:T.violet,r:3}} />
                  <Line type="monotone" dataKey="energy" name="Energy" stroke={T.accent} strokeWidth={2} dot={{fill:T.accent,r:3}} />
                </LineChart>
              </ResponsiveContainer>
            ) : <div style={{ height:80, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontFamily:T.fM, color:T.textMuted }}>Log vitals to see mood & energy trends.</div>}
          </GlassCard>
          {recent7.some(v=>v.sleepQuality>0) && (
            <GlassCard style={{ padding:'20px 22px' }}>
              <SectionLabel>Sleep Quality (7d)</SectionLabel>
              <ResponsiveContainer width="100%" height={110}>
                <BarChart data={recent7} barSize={22} margin={{top:4,right:0,left:0,bottom:0}}>
                  <CartesianGrid strokeDasharray="2 4" stroke={T.border} vertical={false} />
                  <XAxis dataKey="date" tickFormatter={d=>d.slice(5)} tick={{fill:T.textSub,fontSize:9,fontFamily:T.fM}} axisLine={false} tickLine={false} />
                  <YAxis domain={[0,5]} hide />
                  <Tooltip formatter={(v)=>`${v}/5 ⭐`} contentStyle={{ background:T.surfaceHi, border:`1px solid ${T.border}`, borderRadius:8, fontSize:11, fontFamily:T.fM }} />
                  <Bar dataKey="sleepQuality" name="Sleep Quality" fill={T.amber} opacity={0.85} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:9, fontFamily:T.fM, color:T.textSub, marginTop:6 }}>
                {['1★','2★','3★','4★','5★'].map(s=><span key={s}>{s}</span>)}
              </div>
            </GlassCard>
          )}
          {recent7.some(v=>v.steps>0) && (
            <GlassCard style={{ padding:'20px 22px' }}>
              <SectionLabel>Steps (7d)</SectionLabel>
              <ResponsiveContainer width="100%" height={110}>
                <BarChart data={recent7} barSize={22} margin={{top:4,right:0,left:0,bottom:0}}>
                  <CartesianGrid strokeDasharray="2 4" stroke={T.border} vertical={false} />
                  <XAxis dataKey="date" tickFormatter={d=>d.slice(5)} tick={{fill:T.textSub,fontSize:9,fontFamily:T.fM}} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip content={<ChartTooltip suffix=" steps" />} />
                  <Bar dataKey="steps" name="Steps" fill={T.amber} opacity={0.85} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
              <div style={{ fontSize:9, fontFamily:T.fM, color:T.textSub, marginTop:4 }}>
                {(() => { const s=recent7.filter(v=>v.steps>0); const avg=s.length?Math.round(s.reduce((a,v)=>a+Number(v.steps||0),0)/s.length):0; return `Avg: ${avg.toLocaleString()} steps/day${avg>=10000?' · ✅ 10k goal hit!':` · ${(10000-avg).toLocaleString()} to 10k goal`}`; })()}
              </div>
            </GlassCard>
          )}
          {(() => {
            const weightData = [...vitals].filter(v=>Number(v.weight)>0).sort((a,b)=>a.date>b.date?1:-1).slice(-20);
            if (weightData.length < 2) return null;
            const minW = Math.min(...weightData.map(v=>Number(v.weight)));
            const maxW = Math.max(...weightData.map(v=>Number(v.weight)));
            const range = maxW - minW;
            const delta = Number(weightData[weightData.length-1].weight) - Number(weightData[0].weight);
            const deltaColor = delta > 0 ? T.amber : delta < 0 ? T.emerald : T.textSub;
            return (
              <GlassCard style={{ padding:'20px 22px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                  <SectionLabel>Weight Trend</SectionLabel>
                  <span style={{ fontSize:10, fontFamily:T.fM, color:deltaColor, fontWeight:600 }}>{delta>0?'+':''}{delta.toFixed(1)} {wu}</span>
                </div>
                <ResponsiveContainer width="100%" height={120}>
                  <LineChart data={weightData} margin={{top:4,right:0,left:0,bottom:0}}>
                    <CartesianGrid strokeDasharray="2 4" stroke={T.border} vertical={false} />
                    <XAxis dataKey="date" tickFormatter={d=>d.slice(5)} tick={{fill:T.textSub,fontSize:9,fontFamily:T.fM}} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                    <YAxis domain={[minW - (range||5)*0.3, maxW + (range||5)*0.3]} hide />
                    <Tooltip content={<ChartTooltip suffix={` ${wu}`} />} />
                    <Line type="monotone" dataKey="weight" name="Weight" stroke={T.emerald} strokeWidth={2} dot={{fill:T.emerald,r:3}} />
                  </LineChart>
                </ResponsiveContainer>
                <div style={{ display:'flex', gap:20, marginTop:6, fontSize:9, fontFamily:T.fM, color:T.textSub }}>
                  <span>Low: {minW} {wu}</span>
                  <span>High: {maxW} {wu}</span>
                  <span>Latest: {weightData[weightData.length-1].weight} {wu}</span>
                </div>
              </GlassCard>
            );
          })()}
          <GlassCard style={{ padding:'20px 22px' }}>
            <SectionLabel>Recent Vitals</SectionLabel>
            {sorted.slice(0,8).map((v,i)=>(
              <div key={v.id||i} style={{ display:'flex', gap:14, justifyContent:'space-between', padding:'8px 0', borderBottom:i<7?`1px solid ${T.border}`:'none', fontSize:11, fontFamily:T.fM, alignItems:'center' }}>
                <span style={{ color:T.textSub, flexShrink:0 }}>{v.date}</span>
                <div style={{ display:'flex', gap:12, flexWrap:'wrap', justifyContent:'flex-end', alignItems:'center', flex:1 }}>
                  {v.sleep>0&&<span style={{ color:T.sky }}>😴 {v.sleep}h</span>}
                  {v.sleepQuality>0&&<span style={{ color:STAR_COLORS[v.sleepQuality]||T.amber, fontSize:10 }}>{'⭐'.repeat(v.sleepQuality)} <span style={{ fontSize:9, color:T.textSub }}>quality</span></span>}
                  {v.mood>0&&<span style={{ color:T.violet }}>😊 {v.mood}/10</span>}
                  {v.energy>0&&<span style={{ color:T.accent }}>⚡ {v.energy}/10</span>}
                  {v.weight>0&&<span style={{ color:T.emerald }}>⚖️ {v.weight}</span>}
                </div>
                <div style={{ display:'flex', gap:5, flexShrink:0 }}>
                  <button onClick={()=>setEditingVitals(v)} style={{ padding:4, borderRadius:5, background:T.surface, border:`1px solid ${T.border}` }} title="Edit"><IcoPencil size={10} stroke={T.accent} /></button>
                  <button onClick={()=>actions.removeVitals(v.id)} style={{ padding:4, borderRadius:5, background:T.surface, border:`1px solid ${T.border}`, opacity:0.5 }} title="Delete"><IcoTrash size={10} stroke={T.rose} /></button>
                </div>
              </div>
            ))}
            {sorted.length===0 && <div style={{ textAlign:'center', padding:20, fontSize:11, fontFamily:T.fM, color:T.textMuted }}>No vitals logged yet.</div>}
          </GlassCard>
        </div>
        <GlassCard style={{ padding:'22px', display:'flex', flexDirection:'column', alignItems:'center' }}>
          <SectionLabel>Focus Session</SectionLabel>
          {focusComplete ? (
            <div style={{ width:'100%', display:'flex', flexDirection:'column', alignItems:'center', gap:14, padding:'16px 0' }}>
              <div style={{ fontSize:38 }}>🎉</div>
              <div style={{ fontSize:14, fontFamily:T.fD, fontWeight:700, color:T.accent, textAlign:'center' }}>Session Complete!</div>
              <div style={{ fontSize:11, fontFamily:T.fM, color:T.textSub, textAlign:'center' }}>{fmtTime(focusTime)} focused</div>
              {(habits||[]).length > 0 && (
                <div style={{ width:'100%' }}>
                  <div style={{ fontSize:10, fontFamily:T.fM, color:T.textSub, marginBottom:6 }}>Log a habit for this session?</div>
                  <Select value={focusHabitId} onChange={e=>setFocusHabitId(e.target.value)} style={{ marginBottom:8 }}>
                    <option value="">Skip</option>
                    {(habits||[]).map(h=><option key={h.id} value={h.id}>{h.emoji||'🔥'} {h.name}</option>)}
                  </Select>
                </div>
              )}
              <Btn full onClick={handleFocusLog} color={T.accent}>{focusHabitId ? '✓ Log Habit & Done' : 'Done'}</Btn>
            </div>
          ) : (<>
            <div style={{ position:'relative', width:150, height:150, margin:'0 auto 16px' }}>
              <svg width={150} height={150} style={{ transform:'rotate(-90deg)' }}>
                <circle cx={75} cy={75} r={64} fill="none" stroke={T.border} strokeWidth={5} />
                <circle cx={75} cy={75} r={64} fill="none" stroke={T.accent} strokeWidth={5} strokeDasharray={`${2*Math.PI*64*(fpct/100)} ${2*Math.PI*64*(1-fpct/100)}`} strokeLinecap="round" style={{ filter:`drop-shadow(0 0 5px ${T.accent})`, transition:'stroke-dasharray 1s linear' }} />
              </svg>
              <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
                <div style={{ fontSize:26, fontFamily:T.fM, fontWeight:600, color:T.text }}>{fmtTime(remaining)}</div>
                <div style={{ fontSize:9, fontFamily:T.fM, color:T.textSub }}>remaining</div>
              </div>
            </div>
            <div style={{ display:'flex', gap:5, marginBottom:10 }}>
              {[15*60,25*60,45*60,60*60].map(s=>(
                <button key={s} onClick={()=>{setFocusTime(s);setElapsed(0);setFocusActive(false);}} style={{ padding:'3px 9px', borderRadius:99, fontSize:9, fontFamily:T.fM, background:focusTime===s?T.accentDim:T.surface, color:focusTime===s?T.accent:T.textSub, border:`1px solid ${focusTime===s?T.accent+'44':T.border}` }}>{s/60}m</button>
              ))}
            </div>
            {(habits||[]).length > 0 && (
              <div style={{ width:'100%', marginBottom:10 }}>
                <div style={{ fontSize:10, fontFamily:T.fM, color:T.textSub, marginBottom:5 }}>Link habit (logged on complete)</div>
                <Select value={focusHabitId} onChange={e=>setFocusHabitId(e.target.value)}>
                  <option value="">None</option>
                  {(habits||[]).map(h=><option key={h.id} value={h.id}>{h.emoji||'🔥'} {h.name}</option>)}
                </Select>
              </div>
            )}
            <button className="los-btn" onClick={()=>setFocusActive(!focusActive)} style={{ width:'100%', padding:'11px', borderRadius:T.r, background:focusActive?T.roseDim:T.accentDim, color:focusActive?T.rose:T.accent, border:`1px solid ${focusActive?T.rose+'44':T.accent+'44'}`, fontSize:11, fontFamily:T.fM, fontWeight:600, animation:focusActive?'glowPulse 2s infinite':'none' }}>
              {focusActive?'⏸ PAUSE':'▶ START FOCUS'}
            </button>
          </>)}
        </GlassCard>

        {/* Focus Billing */}
        <div style={{ marginTop:14 }}>
          <FocusBillingTab data={data} />
        </div>
      </div>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ── GROWTH PAGE (Enhanced: Heatmap + Delete Habits/Goals) ────────────────────
// ══════════════════════════════════════════════════════════════════════════════
function GrowthPage({ data, actions }) {
  const [tab, setTab] = useState('character');
  const [modal, setModal] = useState(null);
  const [editHabit, setEditHabit] = useState(null);
  const [editGoal, setEditGoal] = useState(null);
  const [chronicleModal, setChronicleModal] = useState(false);
  const {habits=[], habitLogs={}, goals=[], totalXP=0, settings={}, chronicles=[], challenges=[]} = data;
  const cur = settings.currency||'$';
  // Stable ref for HabitHeatmap via useRef snapshot — avoids JSON.stringify on every render
  const habitLogsRef = useRef(habitLogs);
  const stableHabitLogsRef = useRef(habitLogs);
  if (habitLogsRef.current !== habitLogs) {
    // Only do the deep-equality check when the reference actually changed
    const prevKeys = Object.keys(habitLogsRef.current);
    const nextKeys = Object.keys(habitLogs);
    const changed = prevKeys.length !== nextKeys.length ||
      nextKeys.some(k => (habitLogs[k]?.length ?? 0) !== (habitLogsRef.current[k]?.length ?? 0));
    if (changed) stableHabitLogsRef.current = habitLogs;
    habitLogsRef.current = habitLogs;
  }
  const stableHabitLogs = stableHabitLogsRef.current;
  const level = Math.floor(Math.sqrt(Number(totalXP)/100))+1;
  const xpForNext = Math.pow(level,2)*100; const xpForCurrent = Math.pow(level-1,2)*100;
  const xpPct = ((Number(totalXP)-xpForCurrent)/(xpForNext-xpForCurrent))*100;
  const CLASSES = ['Apprentice','Seeker','Wanderer','Scholar','Artisan','Champion','Sage','Master','Grandmaster','Legend'];
  const heroClass = CLASSES[Math.min(level-1,CLASSES.length-1)];
  const d = today();
  const LIFE_STATS = [
    { label:'Financial', val:Math.min(100,Math.round((goals||[]).filter(g=>g.cat==='finance').length*25)), color:T.emerald },
    { label:'Health',    val:Math.min(100,data.vitals.length*8), color:T.sky },
    { label:'Habits',    val:Math.min(100,(habits||[]).length*12), color:T.accent },
    { label:'Growth',    val:Math.min(100,Math.round(Number(totalXP)/50)), color:T.violet },
    { label:'Focus',     val:Math.min(100,data.focusSessions.length*5), color:T.rose },
    { label:'Knowledge', val:Math.min(100,data.notes.length*10), color:T.amber },
  ];
  const unlockedAchievements = useMemo(() => ACHIEVEMENTS.filter(a => a.check(data)), [data]);
  const lockedAchievements = useMemo(() => ACHIEVEMENTS.filter(a => !a.check(data)), [data]);
  return (
    <div style={{ animation:'fadeUp 0.4s ease' }}>
      <LogHabitModal open={modal==='habit'} onClose={()=>setModal(null)} habits={habits} habitLogs={habitLogs} onLog={actions.logHabit} onAddHabit={actions.addHabit} />
      <AddGoalModal open={modal==='goal'} onClose={()=>setModal(null)} onSave={e=>{actions.addGoal(e);setModal(null);}} />
      <EditHabitModal open={!!editHabit} onClose={()=>setEditHabit(null)} habit={editHabit} onSave={(id,patch)=>{actions.updateHabit(id,patch);setEditHabit(null);}} />
      <EditGoalModal open={!!editGoal} onClose={()=>setEditGoal(null)} goal={editGoal} onSave={(id,patch)=>{actions.updateGoal(id,patch);setEditGoal(null);}} />
      <AddChronicleModal open={chronicleModal} onClose={()=>setChronicleModal(false)} onSave={c=>{actions.addChronicle(c);setChronicleModal(false);}} />
      <div style={{ marginBottom:22 }}><SectionLabel>Growth Domain</SectionLabel><h1 style={{ fontSize:26, fontFamily:T.fD, fontWeight:800, color:T.text }}>Character · Habits · Goals</h1></div>
      <div style={{ display:'flex', gap:2, marginBottom:22, background:T.surface, borderRadius:T.r, padding:3, width:'fit-content', border:`1px solid ${T.border}`, flexWrap:'wrap' }}>
        {['character','habits','goals','achievements','chronicles','challenges','social','vision','lifemap'].map(t=>(
          <button key={t} className="los-tab" onClick={()=>setTab(t)} style={{ padding:'5px 14px', borderRadius:8, fontSize:9, fontFamily:T.fM, textTransform:'uppercase', letterSpacing:'0.06em', background:tab===t?T.violetDim:'transparent', color:tab===t?T.violet:T.textSub, border:`1px solid ${tab===t?T.violet+'33':'transparent'}`, transition:'all 0.15s', position:'relative' }}>
            {t==='lifemap'?'🗺️ Map':t}{t==='achievements'&&<span style={{ marginLeft:4, fontSize:8, background:T.violet, color:T.bg, borderRadius:99, padding:'0px 5px', fontWeight:700 }}>{unlockedAchievements.length}</span>}
            {t==='chronicles'&&(chronicles||[]).length>0&&<span style={{ marginLeft:4, fontSize:8, background:T.amber, color:T.bg, borderRadius:99, padding:'0px 5px', fontWeight:700 }}>{(chronicles||[]).length}</span>}
          </button>
        ))}
      </div>

      {tab==='character' && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:14 }}>
          <GlassCard style={{ padding:'22px', gridColumn:'span 2' }}>
            <div style={{ display:'flex', alignItems:'center', gap:20 }}>
              <div style={{ width:76, height:76, borderRadius:'50%', flexShrink:0, background:`linear-gradient(135deg,${T.violet},${T.accent})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, fontFamily:T.fD, fontWeight:800, color:T.bg, boxShadow:`0 0 24px ${T.violet}44` }}>{level}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:9, fontFamily:T.fM, color:T.textSub, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:3 }}>Life Level · {heroClass}</div>
                <div style={{ fontSize:20, fontFamily:T.fD, fontWeight:800, color:T.text, marginBottom:8 }}>Level {level} — {heroClass}</div>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}><span style={{ fontSize:10, fontFamily:T.fM, color:T.textSub }}>{Number(totalXP).toLocaleString()} XP</span><span style={{ fontSize:10, fontFamily:T.fM, color:T.violet }}>{(xpForNext-Number(totalXP)).toLocaleString()} to Lv {level+1}</span></div>
                <ProgressBar pct={xpPct} color={T.violet} height={8} />
                <div style={{ display:'flex', gap:8, marginTop:10, flexWrap:'wrap' }}>
                  {unlockedAchievements.slice(0,6).map(a=>(
                    <div key={a.id} title={a.name} style={{ fontSize:18, filter:`drop-shadow(0 0 4px ${a.color}66)` }}>{a.emoji}</div>
                  ))}
                  {unlockedAchievements.length > 6 && <span style={{ fontSize:10, fontFamily:T.fM, color:T.textSub, alignSelf:'center' }}>+{unlockedAchievements.length-6} more</span>}
                </div>
              </div>
            </div>
          </GlassCard>
          <GlassCard style={{ padding:'20px 22px' }}>
            <SectionLabel>Life Dimensions</SectionLabel>
            {LIFE_STATS.map((s,i)=>(
              <div key={i} style={{ marginBottom:12 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}><span style={{ fontSize:11, fontFamily:T.fM, color:T.text }}>{s.label}</span><span style={{ fontSize:11, fontFamily:T.fM, color:s.color, fontWeight:600 }}>{s.val}</span></div>
                <ProgressBar pct={s.val} color={s.color} height={5} />
              </div>
            ))}
          </GlassCard>
          <GlassCard style={{ padding:'20px 22px' }}>
            <SectionLabel>Life Balance Radar</SectionLabel>
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={LIFE_STATS.map(s=>({subject:s.label,A:s.val}))} margin={{top:8,right:20,bottom:8,left:20}}>
                <PolarGrid stroke={T.border} />
                <PolarAngleAxis dataKey="subject" tick={{fill:T.textSub,fontSize:9,fontFamily:T.fM}} />
                <PolarRadiusAxis domain={[0,100]} tick={false} axisLine={false} />
                <Radar dataKey="A" stroke={T.violet} fill={T.violet} fillOpacity={0.15} strokeWidth={1.5} dot={{fill:T.violet,r:3}} />
              </RadarChart>
            </ResponsiveContainer>
          </GlassCard>
        </div>
      )}

      {tab==='recurring' && (
        <RecurringDetectedCard detectedRecurring={detectedRecurring} cur={cur} actions={{}} />
      )}

      {tab==='habits' && (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ display:'flex', justifyContent:'flex-end' }}>
            <Btn onClick={()=>setModal('habit')} color={T.accent}>+ Log / Add Habit</Btn>
          </div>
          {(habits||[]).length > 0 && (() => {
            const DAY_LABELS = ['M','T','W','T','F','S','S'];
            const weekDays = Array.from({length:7},(_,i)=>{ const d=new Date(); const day=d.getDay(); const diff=i-(day===0?6:day-1); d.setDate(d.getDate()+diff); return d.toISOString().slice(0,10); });
            const weekDone = (habits||[]).map(h=>({
              habit:h,
              days: weekDays.map(d=>({ date:d, done:(habitLogs[h.id]||[]).includes(d) })),
              streak: getStreak(h.id,habitLogs),
            }));
            const HCOLORS=[T.accent,T.violet,T.sky,T.amber,T.rose,T.emerald];
            const totalThisWeek = weekDone.reduce((s,h)=>s+h.days.filter(d=>d.done).length,0);
            const maxThisWeek = (habits||[]).length * 7;
            return (
              <GlassCard style={{ padding:'20px 22px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                  <SectionLabel>This Week's Review</SectionLabel>
                  <span style={{ fontSize:11, fontFamily:T.fM, color:T.accent, fontWeight:600 }}>{totalThisWeek}/{maxThisWeek} completed</span>
                </div>
                <div style={{ overflowX:'auto' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse', minWidth:320 }}>
                    <thead>
                      <tr>
                        <th style={{ fontSize:9, fontFamily:T.fM, color:T.textSub, textAlign:'left', padding:'0 0 8px', fontWeight:500, minWidth:120 }}>Habit</th>
                        {weekDays.map((d,i) => (
                          <th key={d} style={{ fontSize:9, fontFamily:T.fM, color:d===today()?T.accent:T.textSub, textAlign:'center', padding:'0 4px 8px', fontWeight:d===today()?700:400, width:30 }}>
                            <div>{DAY_LABELS[i]}</div>
                            <div style={{ fontSize:8, color:T.textMuted }}>{d.slice(8)}</div>
                          </th>
                        ))}
                        <th style={{ fontSize:9, fontFamily:T.fM, color:T.textSub, textAlign:'center', padding:'0 0 8px 8px', fontWeight:500 }}>Streak</th>
                      </tr>
                    </thead>
                    <tbody>
                      {weekDone.map((row,i) => {
                        const hc = HCOLORS[i%HCOLORS.length];
                        const doneCount = row.days.filter(d=>d.done).length;
                        return (
                          <tr key={row.habit.id} style={{ borderTop:`1px solid ${T.border}` }}>
                            <td style={{ padding:'8px 0', fontSize:11, fontFamily:T.fD, fontWeight:600, color:T.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:130 }}>
                              {row.habit.emoji||'🔥'} {row.habit.name}
                            </td>
                            {row.days.map(d => (
                              <td key={d.date} style={{ textAlign:'center', padding:'8px 4px' }}>
                                <div style={{ width:20, height:20, borderRadius:5, margin:'0 auto', background:d.done?hc+'33':T.surface, border:`1.5px solid ${d.done?hc:T.border}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                                  {d.done && <span style={{ fontSize:9, color:hc }}>✓</span>}
                                </div>
                              </td>
                            ))}
                            <td style={{ textAlign:'center', padding:'8px 0 8px 8px', fontSize:10, fontFamily:T.fM, color:row.streak>0?hc:T.textMuted, fontWeight:row.streak>=7?700:400 }}>
                              🔥{row.streak}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div style={{ marginTop:12, paddingTop:10, borderTop:`1px solid ${T.border}` }}>
                  <ProgressBar pct={maxThisWeek>0?(totalThisWeek/maxThisWeek)*100:0} color={T.accent} height={4} />
                  <div style={{ fontSize:9, fontFamily:T.fM, color:T.textSub, marginTop:4 }}>{Math.round(maxThisWeek>0?(totalThisWeek/maxThisWeek)*100:0)}% completion this week</div>
                </div>
              </GlassCard>
            );
          })()}
          {(habits||[]).length > 0 && (
            <GlassCard style={{ padding:'20px 22px' }}>
              <SectionLabel>Activity Heatmap — Last 18 Weeks</SectionLabel>
              <HabitHeatmap habitLogs={stableHabitLogs} habits={habits} />
            </GlassCard>
          )}
          {(habits||[]).length===0 ? (
            <GlassCard style={{ padding:40, textAlign:'center' }}><div style={{ fontSize:11, fontFamily:T.fM, color:T.textMuted }}>No habits yet. Create your first habit to start building streaks.</div></GlassCard>
          ) : (
            (habits||[]).map((habit,i)=>{ const streak=getStreak(habit.id,habitLogs); const done=(habitLogs[habit.id]||[]).includes(d); const HCOLORS=[T.accent,T.violet,T.sky,T.amber,T.rose,T.emerald]; const hc=HCOLORS[i%HCOLORS.length]; return (
              <GlassCard key={habit.id||i} style={{ padding:'16px 20px', animation:`fadeUp 0.3s ease ${i*0.06}s both` }}>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ width:40, height:40, borderRadius:T.r, flexShrink:0, background:hc+'18', border:`1px solid ${hc}33`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>{habit.emoji||'🔥'}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                      <div>
                        <span style={{ fontSize:13, fontFamily:T.fD, fontWeight:600, color:T.text }}>{habit.name}</span>
                        {habit.frequency && habit.frequency !== 'daily' && <span style={{ fontSize:9, fontFamily:T.fM, color:T.textSub, marginLeft:8 }}>{habit.frequency}</span>}
                      </div>
                      <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                        <span style={{ fontSize:11, fontFamily:T.fM, color:hc }}>🔥 {streak}d</span>
                        {habit.xp && <span style={{ fontSize:9, fontFamily:T.fM, color:T.textMuted }}>+{habit.xp}xp</span>}
                        {done ? <Badge color={hc}>✓ Done</Badge> : <Btn onClick={()=>actions.logHabit(habit.id)} color={hc} style={{ padding:'4px 12px' }}>Log</Btn>}
                        <button onClick={()=>setEditHabit(habit)} style={{ padding:4, borderRadius:6, background:T.surface, border:`1px solid ${T.border}`, opacity:0.5 }}><IcoPencil size={11} stroke={T.sky} /></button>
                        <button onClick={()=>actions.removeHabit(habit.id)} style={{ padding:4, borderRadius:6, background:T.surface, border:`1px solid ${T.border}`, opacity:0.4 }}><IcoTrash size={11} stroke={T.rose} /></button>
                      </div>
                    </div>
                    <ProgressBar pct={(streak/Math.max(streak,30))*100} color={hc} height={4} />
                    <div style={{ fontSize:9, fontFamily:T.fM, color:T.textSub, marginTop:3 }}>Total logs: {(habitLogs[habit.id]||[]).length}{habit.category && <span style={{ marginLeft:8, background:hc+'22', color:hc, borderRadius:99, padding:'1px 6px', fontSize:8 }}>{habit.category}</span>}</div>
                    <div style={{ display:'flex', gap:3, marginTop:8, alignItems:'center' }}>
                      <span style={{ fontSize:8, fontFamily:T.fM, color:T.textMuted, marginRight:2 }}>7d:</span>
                      {Array.from({length:7},(_,i)=>{ const d2=new Date(); d2.setDate(d2.getDate()-6+i); const ds=d2.toISOString().slice(0,10); const done2=(habitLogs[habit.id]||[]).includes(ds); return (
                        <div key={ds} title={ds} style={{ width:14, height:14, borderRadius:3, background:done2?hc+'55':T.surface, border:`1px solid ${done2?hc+'66':T.border}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                          {done2 && <span style={{ fontSize:7, color:hc }}>✓</span>}
                        </div>
                      ); })}
                    </div>
                  </div>
                </div>
              </GlassCard>
            ); })
          )}
        </div>
      )}

      {tab==='goals' && (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div style={{ display:'flex', justifyContent:'flex-end' }}><Btn onClick={()=>setModal('goal')} color={T.amber}>+ New Goal</Btn></div>
          {(goals||[]).length===0 ? (
            <GlassCard style={{ padding:40, textAlign:'center' }}><div style={{ fontSize:11, fontFamily:T.fM, color:T.textMuted }}>No goals yet. Create your first goal to start tracking progress.</div></GlassCard>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:12 }}>
              {(goals||[]).map((goal,i)=>{ const pct=Math.min(100,Math.round(((goal.current||0)/Math.max(1,goal.target))*100)); const catColors={finance:T.accent,health:T.sky,growth:T.violet,career:T.amber}; const c=catColors[goal.cat]||T.violet; const ms=goal.milestones||[]; return (
                <GlassCard key={goal.id||i} style={{ padding:'18px 20px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                    <div style={{ fontSize:20, marginBottom:6 }}>{goal.emoji||'🎯'}</div>
                    <div style={{ display:'flex', gap:5 }}>
                      <button onClick={()=>setEditGoal(goal)} style={{ padding:4, borderRadius:6, background:T.surface, border:`1px solid ${T.border}`, opacity:0.6 }} title="Edit goal"><IcoPencil size={11} stroke={T.sky} /></button>
                      <button onClick={()=>actions.removeGoal(goal.id)} style={{ padding:4, borderRadius:6, background:T.surface, border:`1px solid ${T.border}`, opacity:0.4 }}><IcoTrash size={11} stroke={T.rose} /></button>
                    </div>
                  </div>
                  <div style={{ fontSize:13, fontFamily:T.fD, fontWeight:700, color:T.text, marginBottom:4 }}>{goal.name}</div>
                  <div style={{ fontSize:10, fontFamily:T.fM, color:T.textSub, marginBottom:10 }}>{cur}{fmtN(goal.current||0)} / {cur}{fmtN(goal.target)} · {pct}%{goal.deadline?` · Due ${goal.deadline}`:''}</div>
                  <MilestoneProgressBar pct={pct} color={c} height={6} milestones={ms} />
                  {pct>=100 && <div style={{ marginTop:8, fontSize:11, fontFamily:T.fM, color:T.emerald }}>🎉 Completed!</div>}
                  {ms.length > 0 && pct < 100 && (() => { const next = ms.find(m => (pct||0) < m.pct); return next ? <div style={{ fontSize:9, fontFamily:T.fM, color:c, marginTop:8 }}>Next milestone: {next.label} at {next.pct}%</div> : null; })()}
                  {goal.deadline && pct < 100 && (() => {
                    const remaining = goal.target - (goal.current||0);
                    const daysLeft = Math.max(1, Math.round((new Date(goal.deadline) - new Date()) / 86400000));
                    const monthsLeft = Math.max(0.1, daysLeft/30.44);
                    const perMonth = remaining / monthsLeft;
                    return <div style={{ fontSize:9, fontFamily:T.fM, color:T.textSub, marginTop:6 }}>💡 Need {cur}{fmtN(perMonth)}/mo to hit deadline</div>;
                  })()}
                </GlassCard>
              ); })}
            </div>
          )}
        </div>
      )}

      {tab==='chronicles' && (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div><SectionLabel>Life Wins Journal</SectionLabel><div style={{ fontSize:11, fontFamily:T.fM, color:T.textSub }}>Chronicle your milestones, wins, and proud moments.</div></div>
            <Btn onClick={()=>setChronicleModal(true)} color={T.amber}>+ Chronicle Win</Btn>
          </div>
          {(chronicles||[]).length===0 ? (
            <GlassCard style={{ padding:40, textAlign:'center' }}>
              <div style={{ fontSize:32, marginBottom:12 }}>✨</div>
              <div style={{ fontSize:13, fontFamily:T.fD, fontWeight:600, color:T.text, marginBottom:6 }}>No chronicles yet</div>
              <div style={{ fontSize:11, fontFamily:T.fM, color:T.textMuted }}>Start logging your life wins — big and small.</div>
            </GlassCard>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {[...chronicles].sort((a,b)=>a.date<b.date?1:-1).map((c,i)=>(
                <GlassCard key={c.id} style={{ padding:'18px 22px', borderLeft:`3px solid ${c.autoGenerated?T.sky:T.amber}44`, animation:`fadeUp 0.3s ease ${i*0.06}s both` }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                    <div style={{ display:'flex', gap:12, alignItems:'flex-start', flex:1 }}>
                      <div style={{ fontSize:28, flexShrink:0 }}>{c.emoji}</div>
                      <div style={{ flex:1 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                          <div style={{ fontSize:13, fontFamily:T.fD, fontWeight:700, color:T.text }}>{c.title}</div>
                          {c.autoGenerated && <span style={{ fontSize:7, fontFamily:T.fM, color:T.sky, background:T.skyDim, border:`1px solid ${T.sky}33`, borderRadius:99, padding:'1px 6px' }}>auto</span>}
                        </div>
                        {c.body && <div style={{ fontSize:11, fontFamily:T.fM, color:T.textSub, lineHeight:1.5, whiteSpace:'pre-wrap' }}>{c.body}</div>}
                        <div style={{ fontSize:9, fontFamily:T.fM, color:T.textMuted, marginTop:6 }}>{c.date}</div>
                      </div>
                    </div>
                    <button onClick={()=>actions.removeChronicle(c.id)} style={{ padding:4, borderRadius:6, background:T.surface, border:`1px solid ${T.border}`, opacity:0.4, flexShrink:0 }}><IcoTrash size={10} stroke={T.rose} /></button>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}

          {/* ── Decision Log ──────────────────────────────────────────────── */}
          {(data.decisions||[]).length > 0 && (
            <div style={{ marginTop:8 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                <div><SectionLabel>Decision Log</SectionLabel><div style={{ fontSize:10, fontFamily:T.fM, color:T.textSub }}>Decisions you logged with context. The AI uses these to give better advice.</div></div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {[...(data.decisions||[])].sort((a,b)=>a.date<b.date?1:-1).map((d,i)=>{
                  const IMPACT_COLOR = { positive:T.emerald, neutral:T.textSub, uncertain:T.amber, negative:T.rose };
                  const c = IMPACT_COLOR[d.impact] || T.textSub;
                  return (
                    <GlassCard key={d.id||i} style={{ padding:'14px 18px', borderLeft:`3px solid ${T.violet}44` }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:d.why?8:0 }}>
                        <div style={{ flex:1 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:4 }}>
                            <span style={{ fontSize:12, fontFamily:T.fD, fontWeight:700, color:T.text }}>📝 {d.title}</span>
                            <span style={{ fontSize:8, fontFamily:T.fM, color:c, background:c+'18', border:`1px solid ${c}33`, borderRadius:99, padding:'1px 8px' }}>{d.impact||'neutral'}</span>
                            {(d.domains||[]).map(dom=><span key={dom} style={{ fontSize:8, fontFamily:T.fM, color:T.violet, background:T.violetDim, border:`1px solid ${T.violet}33`, borderRadius:99, padding:'1px 7px' }}>{dom}</span>)}
                          </div>
                          {d.why && <div style={{ fontSize:10, fontFamily:T.fM, color:T.textSub, lineHeight:1.5 }}>{d.why}</div>}
                          {d.amount && <div style={{ fontSize:10, fontFamily:T.fM, color:T.accent, marginTop:4 }}>Financial impact: {settings.currency||'$'}{fmtN(Math.abs(d.amount))}</div>}
                          <div style={{ fontSize:8, fontFamily:T.fM, color:T.textMuted, marginTop:6 }}>{d.date}</div>
                        </div>
                        <button onClick={()=>actions.removeDecision(d.id)} style={{ padding:4, borderRadius:6, background:T.surface, border:`1px solid ${T.border}`, opacity:0.4 }}><IcoTrash size={10} stroke={T.rose} /></button>
                      </div>
                    </GlassCard>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {tab==='achievements' && (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
            <div style={{ fontSize:13, fontFamily:T.fD, fontWeight:700, color:T.text }}>{unlockedAchievements.length} / {ACHIEVEMENTS.length} unlocked</div>
            <ProgressBar pct={(unlockedAchievements.length/ACHIEVEMENTS.length)*100} color={T.violet} height={5} />
          </div>
          {unlockedAchievements.length > 0 && (
            <div>
              <SectionLabel>Unlocked</SectionLabel>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:10 }}>
                {unlockedAchievements.map((a,i) => (
                  <GlassCard key={a.id} style={{ padding:'16px', textAlign:'center', borderColor:`${a.color}33`, animation:`badgeIn 0.35s ease ${i*0.05}s both` }}>
                    <div style={{ fontSize:32, marginBottom:8, filter:`drop-shadow(0 0 8px ${a.color}66)` }}>{a.emoji}</div>
                    <div style={{ fontSize:12, fontFamily:T.fD, fontWeight:700, color:T.text, marginBottom:4 }}>{a.name}</div>
                    <div style={{ fontSize:10, fontFamily:T.fM, color:T.textSub, lineHeight:1.4 }}>{a.desc}</div>
                    <div style={{ marginTop:8 }}><Badge color={a.color}>✓ Unlocked</Badge></div>
                  </GlassCard>
                ))}
              </div>
            </div>
          )}
          {lockedAchievements.length > 0 && (
            <div>
              <SectionLabel>Locked</SectionLabel>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:10 }}>
                {lockedAchievements.map((a) => (
                  <GlassCard key={a.id} style={{ padding:'16px', textAlign:'center', opacity:0.45 }}>
                    <div style={{ fontSize:32, marginBottom:8, filter:'grayscale(1)' }}>{a.emoji}</div>
                    <div style={{ fontSize:12, fontFamily:T.fD, fontWeight:700, color:T.textSub, marginBottom:4 }}>{a.name}</div>
                    <div style={{ fontSize:10, fontFamily:T.fM, color:T.textMuted, lineHeight:1.4 }}>{a.desc}</div>
                    <div style={{ marginTop:8 }}><Badge color={T.textMuted}>🔒 Locked</Badge></div>
                  </GlassCard>
                ))}
              </div>
            </div>
          )}
          {unlockedAchievements.length === 0 && (
            <GlassCard style={{ padding:40, textAlign:'center' }}>
              <div style={{ fontSize:32, marginBottom:12 }}>🏆</div>
              <div style={{ fontSize:13, fontFamily:T.fD, fontWeight:600, color:T.text, marginBottom:6 }}>No achievements yet</div>
              <div style={{ fontSize:11, fontFamily:T.fM, color:T.textMuted }}>Start logging habits, expenses, and vitals to unlock your first badges.</div>
            </GlassCard>
          )}
        </div>
      )}

      {tab==='challenges' && (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div><SectionLabel>30-Day Challenges</SectionLabel><div style={{ fontSize:11, fontFamily:T.fM, color:T.textSub }}>Pick a challenge, track daily progress, earn bonus XP.</div></div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:12 }}>
            {CHALLENGES_CATALOG.map(ch => {
              const active = (challenges||[]).find(c=>c.challengeId===ch.id);
              const doneDays = active?.done?.length||0;
              const pct = Math.round((doneDays/ch.days)*100);
              const todayStr = today();
              const todayDone = active?.done?.includes(todayStr);
              const catColors = { finance:T.emerald, health:T.sky, growth:T.violet, mind:T.amber };
              const c = catColors[ch.cat]||T.accent;
              return (
                <GlassCard key={ch.id} style={{ padding:'18px 20px', borderLeft:`3px solid ${c}44` }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                    <div style={{ fontSize:26 }}>{ch.emoji}</div>
                    <Badge color={c}>{ch.cat}</Badge>
                  </div>
                  <div style={{ fontSize:13, fontFamily:T.fD, fontWeight:700, color:T.text, marginBottom:4 }}>{ch.title}</div>
                  <div style={{ fontSize:11, fontFamily:T.fM, color:T.textSub, marginBottom:10, lineHeight:1.4 }}>{ch.desc}</div>
                  {active ? (
                    <>
                      <ProgressBar pct={pct} color={c} height={5} />
                      <div style={{ display:'flex', justifyContent:'space-between', marginTop:6, marginBottom:10, fontSize:9, fontFamily:T.fM }}>
                        <span style={{ color:T.textSub }}>{doneDays}/{ch.days} days · {pct}%</span>
                        <span style={{ color:c }}>+{ch.xp} XP on complete</span>
                      </div>
                      <div style={{ display:'flex', gap:8 }}>
                        <Btn onClick={()=>actions.toggleChallengeDay(ch.id, todayStr)} color={todayDone?T.emerald:c} style={{ flex:1, padding:'6px 12px' }}>{todayDone?'✓ Done today':'Mark today done'}</Btn>
                        <button onClick={()=>actions.leaveChallenge(ch.id)} style={{ padding:'6px 10px', borderRadius:T.r, background:T.surface, border:`1px solid ${T.border}`, fontSize:9, fontFamily:T.fM, color:T.textMuted }}>Leave</button>
                      </div>
                    </>
                  ) : (
                    <Btn onClick={()=>actions.joinChallenge(ch.id)} color={c} style={{ width:'100%' }}>Join Challenge · {ch.days}d</Btn>
                  )}
                </GlassCard>
              );
            })}
          </div>
        </div>
      )}

      {tab==='social' && (
        <SocialChallengesTab data={data} actions={actions} />
      )}

      {tab==='vision' && (
        <VisionBoardTab />
      )}

      {tab==='lifemap' && (
        <LifeMapTab data={data} actions={actions} />
      )}
    </div>
  );
}

// ── EDIT NOTE MODAL ────────────────────────────────────────────────────────────
function EditNoteModal({ open, onClose, note, onSave }) {
  const [title, setTitle] = useState(''); const [body, setBody] = useState('');
  const [tag, setTag] = useState('General'); const [type, setType] = useState('note');
  const [priority, setPriority] = useState(2); const [dueDate, setDueDate] = useState('');
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (note && open) {
      setTitle(note.title || ''); setBody(note.body || ''); setTag(note.tag || 'General');
      setType(note.type || 'note'); setPriority(note.priority || 2);
      setDueDate(note.dueDate || ''); setDone(!!note.done);
    }
  }, [note, open]);
  const save = () => {
    if (!title.trim()) return;
    onSave(note.id, { title: title.trim(), body: body.trim(), tag, type, priority, dueDate, done });
    onClose();
  };
  return (
    <Modal open={open} onClose={onClose} title="✏️ Edit Note">
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          <Select value={type} onChange={e=>setType(e.target.value)}>{['note','task','idea','bookmark'].map(t=><option key={t}>{t}</option>)}</Select>
          <Select value={tag} onChange={e=>setTag(e.target.value)}>{['General','Finance','Health','Career','Growth','Ideas'].map(t=><option key={t}>{t}</option>)}</Select>
        </div>
        <Input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Title" />
        <textarea value={body} onChange={e=>setBody(e.target.value)} placeholder="Content..." rows={4} style={{ width:'100%', padding:'9px 12px', background:'rgba(255,255,255,0.04)', border:`1px solid ${T.border}`, borderRadius:T.r, fontFamily:T.fM, fontSize:12, color:T.text, resize:'vertical' }} />
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <div style={{ fontSize:11, fontFamily:T.fM, color:T.textSub, flexShrink:0 }}>Priority:</div>
          {[1,2,3].map(p=><button key={p} onClick={()=>setPriority(p)} style={{ padding:'4px 12px', borderRadius:99, fontSize:10, fontFamily:T.fM, background:priority===p?[T.rose,T.amber,T.sky][p-1]+'33':'transparent', color:priority===p?[T.rose,T.amber,T.sky][p-1]:T.textSub, border:`1px solid ${priority===p?[T.rose,T.amber,T.sky][p-1]+'55':T.border}` }}>{['🔴 High','🟡 Med','🔵 Low'][p-1]}</button>)}
        </div>
        {type==='task' && (
          <>
            <Input type="date" value={dueDate} onChange={e=>setDueDate(e.target.value)} placeholder="Due date" />
            <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:12, fontFamily:T.fM, color:T.text, cursor:'pointer', padding:'8px 10px', borderRadius:T.r, background:done?T.emeraldDim:T.surface, border:`1px solid ${done?T.emerald+'44':T.border}` }}>
              <input type="checkbox" checked={done} onChange={e=>setDone(e.target.checked)} />
              <span>{done ? '✅ Task completed' : 'Mark as done'}</span>
            </label>
          </>
        )}
        <Btn full onClick={save} color={T.amber}>Save Changes</Btn>
      </div>
    </Modal>
  );
}

// ── KNOWLEDGE PAGE ────────────────────────────────────────────────────────────
function KnowledgePage({ data, actions }) {
  const [noteAnalysis, setNoteAnalysis] = useLocalStorage('los_note_analysis', null);
  const [noteAnalysisLoading, setNoteAnalysisLoading] = useState(false);
  const [tab, setTab] = useState('notes');
  const [modal, setModal] = useState(null);
  const [editingNote, setEditingNote] = useState(null);
  const [noteTypeFilter, setNoteTypeFilter] = useState('all');
  const [notePriorityFilter, setNotePriorityFilter] = useState('all');
  const [showArchived, setShowArchived] = useState(false);
  const [noteSearch, setNoteSearch] = useState('');
  const [messages, setMessages] = useState([{ role:'assistant', content:"Hello. I'm your Life Intelligence Engine. I have a complete view of your finances, health, habits, and goals. How can I help you today?" }]);
  const [input, setInput] = useState(''); const [loading, setLoading] = useState(false);
  const endRef = useRef(null);
  const {notes=[], expenses=[], incomes=[], habits=[], habitLogs={}, goals=[], vitals=[], totalXP=0, assets=[], investments=[], debts=[], settings={}, quickNotes=[]} = data;
  const cur = settings.currency||'$';
  useEffect(()=>{ endRef.current?.scrollIntoView({behavior:'smooth'}); },[messages]);
  const buildContext = () => {
    const m=today().slice(0,7); const mInc=(incomes||[]).filter(i=>i.date?.startsWith(m)).reduce((s,i)=>s+Number(i.amount||0),0); const mExp=(expenses||[]).filter(e=>e.date?.startsWith(m)).reduce((s,e)=>s+Number(e.amount||0),0); const invVal=(investments||[]).reduce((s,i)=>s+Number((i.currentPrice??i.buyPrice)||0)*Number(i.quantity||0),0); const nw=(assets||[]).reduce((s,a)=>s+Number(a.value||0),0)+invVal-(debts||[]).reduce((s,d)=>s+Number(d.balance||0),0); const sr=mInc>0?((mInc-mExp)/mInc*100).toFixed(1):0; const habitSum=(habits||[]).map(h=>`${h.name} (streak:${getStreak(h.id,habitLogs)}d)`).join(', ')||'none'; const goalSum=(goals||[]).map(g=>`${g.name}: ${Math.round(((g.current||0)/Math.max(1,g.target))*100)}%`).join(', ')||'none'; const v7=(vitals||[]).slice(-7); const avgSlp=v7.length?(v7.reduce((s,v)=>s+Number(v.sleep||0),0)/v7.length).toFixed(1):'N/A';
    return `USER'S REAL LIFE DATA:\nNet Worth: ${cur}${fmtN(nw)}\nThis Month: income ${cur}${fmtN(mInc)}, expenses ${cur}${fmtN(mExp)}, savings rate ${sr}%\nInvestments: ${cur}${fmtN(invVal)}\nLevel: ${Math.floor(Math.sqrt(Number(totalXP)/100))+1}, ${totalXP} XP\nHabits: ${habitSum}\nGoals: ${goalSum}\nAvg Sleep (7d): ${avgSlp}h\nDebts: ${(debts||[]).length} totaling ${cur}${fmtN((debts||[]).reduce((s,d)=>s+Number(d.balance||0),0))}`;
  };
  const apiKey = settings.aiApiKey || '';
  const send = async () => {
    if (!input.trim()||loading) return;
    if (!apiKey) {
      setMessages(p=>[...p,{role:'assistant',content:'⚠️ No AI provider configured. Go to Settings → AI Provider and select Anthropic, OpenAI, or Ollama. Your key is stored locally only.'}]);
      return;
    }
    const um={role:'user',content:input}; setMessages(p=>[...p,um]); setInput(''); setLoading(true);
    try {
      const text = await callAI(settings, {
        max_tokens: 1000,
        system: `You are a Life Intelligence Engine for a personal Life OS. ${buildContext()} Give insightful, data-driven advice. Be concise and direct. Reference the user's real data.`,
        messages: [...messages,um].filter(m=>m.role!=='system').map(m=>({role:m.role,content:m.content}))
      });
      if (!text) throw new Error('Empty response');
      setMessages(p=>[...p,{role:'assistant',content:text}]);
    } catch(err) { setMessages(p=>[...p,{role:'assistant',content:`Connection error: ${err.message||'Please try again.'}`}]); }
    finally { setLoading(false); }
  };
  const TAG_COLORS = { Finance:T.violet, Health:T.sky, Career:T.amber, Growth:T.emerald, Ideas:'#c084fc', General:T.textSub };
  const qn = quickNotes || [];
  const filteredNotes = useMemo(()=>{
    const q = noteSearch.trim().toLowerCase();
    return [...notes].filter(n => {
      if (Boolean(n.archived) !== showArchived) return false;
      if (noteTypeFilter !== 'all' && (n.type||'note') !== noteTypeFilter) return false;
      if (notePriorityFilter !== 'all' && (n.priority||2) !== notePriorityFilter) return false;
      if (q && !(n.title||'').toLowerCase().includes(q) && !(n.body||'').toLowerCase().includes(q)) return false;
      return true;
    }).sort((a,b) => ((a.priority||2)-(b.priority||2)) || (a.date<b.date?1:-1));
  },[notes, noteSearch, noteTypeFilter, notePriorityFilter, showArchived]);
  const STICKY_COLORS = ['#fbbf24','#34d399','#38bdf8','#8b5cf6','#fb7185','#00f5d4'];
  const analyzeNotes = async () => {
    if (noteAnalysisLoading || !(notes||[]).length) return;
    setNoteAnalysisLoading(true);
    const noteSummary = (notes||[]).slice(0,20).map(n=>`[${n.tag}] ${n.title}: ${(n.body||'').slice(0,120)}`).join('\n');
    try {
      const text = await callAI(data.settings, {
        max_tokens: 600,
        messages:[{ role:'user', content:`Analyze these personal notes and provide: 1) Key themes and patterns, 2) Top 3 actionable insights, 3) What the person seems most focused on, 4) One growth opportunity. Notes:\n${noteSummary}` }]
      });
      setNoteAnalysis({ text: text||'No response', ts: today(), count: (notes||[]).length });
    } catch { setNoteAnalysis({ text:'Error — check AI settings.', ts:today(), count:0 }); }
    setNoteAnalysisLoading(false);
  };

  return (
    <div style={{ animation:'fadeUp 0.4s ease' }}>
      <AddNoteModal open={modal==='note'} onClose={()=>setModal(null)} onSave={e=>{actions.addNote(e);setModal(null);}} />
      <AddQuickNoteModal open={modal==='qnote'} onClose={()=>setModal(null)} onSave={e=>{actions.addQuickNote(e);setModal(null);}} />
      <EditNoteModal open={!!editingNote} onClose={()=>setEditingNote(null)} note={editingNote} onSave={(id,patch)=>{actions.updateNote(id,patch);setEditingNote(null);}} />
      <div style={{ marginBottom:22 }}><SectionLabel>Knowledge Domain</SectionLabel><h1 style={{ fontSize:26, fontFamily:T.fD, fontWeight:800, color:T.text }}>Knowledge Base</h1></div>
      <div style={{ display:'flex', gap:2, marginBottom:22, background:T.surface, borderRadius:T.r, padding:3, width:'fit-content', border:`1px solid ${T.border}` }}>
        {/* notes + quick notes merged into one "Notes" tab. AI assistant removed — use Global AI Panel (A key). */}
        {['notes','courses','capsule','note analysis','gmail'].map(t=>(
          <button key={t} className="los-tab" onClick={()=>setTab(t)} style={{ padding:'5px 14px', borderRadius:8, fontSize:9, fontFamily:T.fM, textTransform:'uppercase', letterSpacing:'0.06em', background:tab===t?T.amberDim:'transparent', color:tab===t?T.amber:T.textSub, border:`1px solid ${tab===t?T.amber+'33':'transparent'}`, transition:'all 0.15s' }}>{t}</button>
        ))}
      </div>
      {tab==='notes' && (
        <div>
          <div style={{ display:'flex', gap:10, marginBottom:10, alignItems:'center' }}>
            <div style={{ flex:1, position:'relative' }}>
              <IcoSearch size={12} stroke={T.textSub} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
              <input value={noteSearch} onChange={e=>setNoteSearch(e.target.value)} placeholder="Search notes…" style={{ width:'100%', padding:'8px 12px 8px 30px', background:'rgba(255,255,255,0.04)', border:`1px solid ${T.border}`, borderRadius:T.r, fontFamily:T.fM, fontSize:12, color:T.text }} />
            </div>
            <Btn onClick={()=>setModal('note')} color={T.amber}>+ New Note</Btn>
          </div>
          <div style={{ display:'flex', gap:6, marginBottom:14, flexWrap:'wrap', alignItems:'center' }}>
            {['all','note','task','idea','bookmark'].map(type=>(<button key={type} onClick={()=>setNoteTypeFilter(type)} style={{ padding:'3px 10px', borderRadius:99, fontSize:9, fontFamily:T.fM, background:noteTypeFilter===type?T.amber+'33':'transparent', color:noteTypeFilter===type?T.amber:T.textSub, border:`1px solid ${noteTypeFilter===type?T.amber+'44':T.border}` }}>{type==='all'?'All types':type}</button>))}
            <div style={{ flex:1 }} />
            {['all',1,2,3].map(p=>(<button key={p} onClick={()=>setNotePriorityFilter(p)} style={{ padding:'3px 10px', borderRadius:99, fontSize:9, fontFamily:T.fM, background:notePriorityFilter===p?T.violet+'33':'transparent', color:notePriorityFilter===p?T.violet:T.textSub, border:`1px solid ${notePriorityFilter===p?T.violet+'44':T.border}` }}>{p==='all'?'All priority':['🔴 High','🟡 Med','🔵 Low'][p-1]}</button>))}
            <button onClick={()=>setShowArchived(a=>!a)} style={{ padding:'3px 10px', borderRadius:99, fontSize:9, fontFamily:T.fM, background:showArchived?T.surface:'transparent', color:showArchived?T.text:T.textSub, border:`1px solid ${T.border}` }}>{showArchived?'📦 Archived':'Active'}</button>
          </div>
          {filteredNotes.length===0 ? (
            <GlassCard style={{ padding:40, textAlign:'center' }}><div style={{ fontSize:11, fontFamily:T.fM, color:T.textMuted }}>{noteSearch?`No notes match "${noteSearch}"` :'No notes yet. Create your first note to build your knowledge base.'}</div></GlassCard>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:12 }}>
              {filteredNotes.map((note,i)=>{ const tc=TAG_COLORS[note.tag]||T.textSub; return (
                <GlassCard key={note.id||i} style={{ padding:'18px', cursor:'pointer', borderLeft:`3px solid ${note.priority===1?T.rose:note.priority===2?T.amber:tc}88`, animation:`fadeUp 0.3s ease ${i*0.08}s both`, opacity:note.done?0.65:1 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                    <div style={{ display:'flex', gap:5, alignItems:'center', flexWrap:'wrap' }}>
                      <Badge color={tc}>{note.tag||'General'}</Badge>
                      {note.type && note.type!=='note' && <Badge color={note.type==='task'?T.sky:note.type==='idea'?T.violet:T.amber}>{note.type}</Badge>}
                      {note.priority === 1 && <span style={{ display:'inline-flex', alignItems:'center', gap:3, padding:'1px 7px', borderRadius:99, fontSize:9, fontFamily:T.fM, fontWeight:700, background:T.roseDim, border:`1px solid ${T.rose}44`, color:T.rose }}>🔴 High</span>}
                      {note.priority === 2 && <span style={{ display:'inline-flex', alignItems:'center', gap:3, padding:'1px 7px', borderRadius:99, fontSize:9, fontFamily:T.fM, background:T.amberDim, border:`1px solid ${T.amber}33`, color:T.amber }}>🟡 Med</span>}
                      {note.dueDate && <span style={{ fontSize:9, fontFamily:T.fM, color:T.amber }}>📅 {note.dueDate}</span>}
                      {note.done && <Badge color={T.emerald}>✅ Done</Badge>}
                    </div>
                    <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                      <span style={{ fontSize:9, fontFamily:T.fM, color:T.textMuted }}>{note.date||note.createdAt}</span>
                      {note.type==='task' && (
                        <button onClick={e=>{e.stopPropagation();actions.updateNote(note.id,{done:!note.done});}} title={note.done?'Mark undone':'Mark done'} style={{ padding:'2px 8px', borderRadius:99, fontSize:9, fontFamily:T.fM, background:note.done?T.emeraldDim:T.surface, border:`1px solid ${note.done?T.emerald+'44':T.border}`, color:note.done?T.emerald:T.textSub }}>
                          {note.done?'✓ Done':'Mark done'}
                        </button>
                      )}
                      <button onClick={e=>{e.stopPropagation();setEditingNote(note);}} title="Edit" style={{ padding:3, borderRadius:5, background:T.surface, border:`1px solid ${T.border}`, opacity:0.7 }}><IcoPencil size={10} stroke={T.accent} /></button>
                      <button onClick={e=>{e.stopPropagation();actions.updateNote?actions.updateNote(note.id,{archived:!note.archived}):null;}} title={note.archived?'Unarchive':'Archive'} style={{ padding:3, borderRadius:5, background:T.surface, border:`1px solid ${T.border}`, opacity:0.5, fontSize:10 }}>{note.archived?'📤':'📦'}</button>
                      <button onClick={e=>{e.stopPropagation();actions.removeNote(note.id);}} style={{ padding:3, borderRadius:5, background:T.surface, border:`1px solid ${T.border}`, opacity:0.5 }}><IcoTrash size={10} stroke={T.rose} /></button>
                    </div>
                  </div>
                  <div style={{ fontSize:13, fontFamily:T.fD, fontWeight:700, color:T.text, marginBottom:7, textDecoration:note.done?'line-through':'' }}>{note.title}</div>
                  <div style={{ fontSize:11, fontFamily:T.fM, color:T.textSub, lineHeight:1.5, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:3, WebkitBoxOrient:'vertical' }}>{note.body||note.content||note.text||''}</div>
                </GlassCard>
              ); })}
            </div>
          )}
          {/* ── Quick Notes — merged from separate tab ───────────────────── */}
          {qn.length > 0 && (
            <div style={{ marginTop:24 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                <div style={{ fontSize:9, fontFamily:T.fM, color:T.textSub, letterSpacing:'0.12em', textTransform:'uppercase' }}>📌 Quick Notes ({qn.length})</div>
                <Btn onClick={()=>setModal('qnote')} color={T.amber} style={{ padding:'4px 12px', fontSize:9 }}>+ New</Btn>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:10 }}>
                {[...qn].sort((a,b)=>a.date<b.date?1:-1).slice(0,8).map((n,i)=>(
                  <div key={n.id||i} style={{ padding:'14px', borderRadius:T.r, background:`${n.color||T.amber}10`, border:`1px solid ${n.color||T.amber}33`, animation:`fadeUp 0.25s ease ${i*0.05}s both` }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                      <div style={{ width:8, height:8, borderRadius:'50%', background:n.color||T.amber, flexShrink:0, marginTop:3 }} />
                      <button onClick={()=>actions.removeQuickNote(n.id)} style={{ padding:2, borderRadius:4, background:'rgba(255,255,255,0.06)', border:'none', opacity:0.5, cursor:'pointer' }}><IcoTrash size={9} stroke={T.rose} /></button>
                    </div>
                    <div style={{ fontSize:11, fontFamily:T.fM, color:T.text, lineHeight:1.6, wordBreak:'break-word' }}>{n.text}</div>
                    <div style={{ fontSize:8, fontFamily:T.fM, color:T.textMuted, marginTop:8 }}>{n.date}</div>
                  </div>
                ))}
              </div>
              {qn.length > 8 && <div style={{ marginTop:8, fontSize:10, fontFamily:T.fM, color:T.textMuted, textAlign:'center' }}>+{qn.length-8} more quick notes</div>}
            </div>
          )}
          {qn.length === 0 && (
            <div style={{ marginTop:24, display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 16px', borderRadius:T.r, background:T.surface, border:`1px solid ${T.border}` }}>
              <span style={{ fontSize:11, fontFamily:T.fM, color:T.textMuted }}>📌 No quick notes yet — capture a fleeting thought</span>
              <Btn onClick={()=>setModal('qnote')} color={T.amber} style={{ padding:'4px 12px', fontSize:9 }}>+ Quick Note</Btn>
            </div>
          )}
        </div>
      )}
      {tab==='courses' && (
        <CourseTrackerTab data={data} actions={actions} />
      )}

      {tab==='capsule' && (
        <TimeCapsuleTab data={data} actions={actions} />
      )}

      {tab==='note analysis' && (
        <AINotesAnalysisCard notes={notes} settings={data.settings} noteAnalysis={noteAnalysis} setNoteAnalysis={setNoteAnalysis} noteAnalysisLoading={noteAnalysisLoading} setNoteAnalysisLoading={setNoteAnalysisLoading} />
      )}
      {tab==='gmail' && (
        <GmailIntegrationTab data={data} />
      )}
    </div>
  );
}


// ── COMPOUND GROWTH SIMULATOR CARD ───────────────────────────────────────────
function CompoundGrowthCard({ cur }) {
  const [cgAmt, setCgAmt] = useState(1000);
  const [cgRate, setCgRate] = useState(8);
  const [cgYears, setCgYears] = useState(20);
  const cgResult = cgAmt * Math.pow(1 + cgRate/100, cgYears);
  const cgGain = cgResult - cgAmt;
  return (
    <GlassCard style={{ padding:'20px 22px' }}>
      <SectionLabel>Compound Growth Simulator</SectionLabel>
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {[
          { label:`Initial: ${cur}${fmtN(cgAmt)}`, val:cgAmt, set:setCgAmt, min:100, max:100000, step:100 },
          { label:`Rate: ${cgRate}% /yr`, val:cgRate, set:setCgRate, min:1, max:30, step:0.5 },
          { label:`Years: ${cgYears}`, val:cgYears, set:setCgYears, min:1, max:50, step:1 },
        ].map(({label,val,set,min,max,step})=>(
          <div key={label}>
            <div style={{ fontSize:10, fontFamily:T.fM, color:T.textSub, marginBottom:4 }}>{label}</div>
            <input type="range" min={min} max={max} step={step} value={val} onChange={e=>set(Number(e.target.value))} style={{ width:'100%', accentColor:T.violet }} />
          </div>
        ))}
        <div style={{ marginTop:6, padding:'12px', borderRadius:T.r, background:T.violetDim, border:`1px solid ${T.violet}33`, textAlign:'center' }}>
          <div style={{ fontSize:9, fontFamily:T.fM, color:T.textSub, marginBottom:4 }}>After {cgYears} years</div>
          <div style={{ fontSize:22, fontFamily:T.fD, fontWeight:700, color:T.violet }}>{cur}{fmtN(cgResult)}</div>
          <div style={{ fontSize:10, fontFamily:T.fM, color:T.emerald }}>+{cur}{fmtN(cgGain)} gain ({((cgGain/cgAmt)*100).toFixed(0)}x growth)</div>
        </div>
      </div>
    </GlassCard>
  );
}

function ScenarioCard({ cur, monthInc, savRate }) {
  const [scnIncome, setScnIncome] = useState(monthInc||3000);
  const [scnSave, setScnSave] = useState(Math.round(savRate)||20);
  const [scnReturn, setScnReturn] = useState(7);
  const [scnYears, setScnYears] = useState(10);
  const monthlySave = scnIncome * scnSave/100;
  const annualSave = monthlySave * 12;
  const futureVal = scnReturn > 0 ? annualSave * ((Math.pow(1+scnReturn/100, scnYears)-1)/(scnReturn/100)) : annualSave * scnYears;
  return (
    <GlassCard style={{ padding:'20px 22px' }}>
      <SectionLabel>Scenario Planner</SectionLabel>
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {[
          { label:`Income: ${cur}${fmtN(scnIncome)}/mo`, val:scnIncome, set:setScnIncome, min:500, max:50000, step:100 },
          { label:`Savings Rate: ${scnSave}%`, val:scnSave, set:setScnSave, min:1, max:80, step:1 },
          { label:`Annual Return: ${scnReturn}%`, val:scnReturn, set:setScnReturn, min:0, max:20, step:0.5 },
          { label:`Horizon: ${scnYears} years`, val:scnYears, set:setScnYears, min:1, max:40, step:1 },
        ].map(({label,val,set,min,max,step})=>(
          <div key={label}>
            <div style={{ fontSize:10, fontFamily:T.fM, color:T.textSub, marginBottom:4 }}>{label}</div>
            <input type="range" min={min} max={max} step={step} value={val} onChange={e=>set(Number(e.target.value))} style={{ width:'100%', accentColor:T.accent }} />
          </div>
        ))}
        <div style={{ padding:'12px', borderRadius:T.r, background:T.accentLo, border:`1px solid ${T.accent}22`, textAlign:'center' }}>
          <div style={{ fontSize:9, fontFamily:T.fM, color:T.textSub, marginBottom:4 }}>Projected wealth in {scnYears} years</div>
          <div style={{ fontSize:22, fontFamily:T.fD, fontWeight:700, color:T.accent }}>{cur}{fmtN(futureVal)}</div>
          <div style={{ fontSize:10, fontFamily:T.fM, color:T.textSub }}>Saving {cur}{fmtN(monthlySave)}/mo · {cur}{fmtN(annualSave)}/yr</div>
        </div>
      </div>
    </GlassCard>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ── 🗺️ LIFE MAP — force-directed SVG goal/habit graph ────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
function LifeMapTab({ data, actions }) {
  const {goals=[], habits=[], settings={}} = data;
  const cur = settings.currency || '$';
  const DOMAIN_COLORS = { Finance:T.emerald, Health:T.sky, Growth:T.violet, Mind:T.accent, Learning:T.amber, Career:T.rose, Social:'#c084fc', Body:T.sky };

  const buildGraph = useCallback(() => {
    const W=700, H=480;
    const nodes=[], edges=[];
    const domains=['Finance','Health','Growth','Mind','Career','Learning'];
    domains.forEach((d,i)=>{
      const angle=(i/domains.length)*Math.PI*2-Math.PI/2, r=140;
      nodes.push({ id:`domain-${d}`, label:d, type:'domain', color:DOMAIN_COLORS[d]||T.accent, x:W/2+Math.cos(angle)*r, y:H/2+Math.sin(angle)*r, r:32 });
    });
    (goals||[]).slice(0,12).forEach((g,i)=>{
      const dom=nodes.find(n=>n.id===`domain-${g.cat||'Growth'}`) || nodes[i%domains.length];
      const angle=Math.random()*Math.PI*2, dist=80+Math.random()*40;
      const progress=g.target>0?Math.min(1,(g.current||0)/g.target):0;
      nodes.push({ id:`goal-${g.id}`, label:g.name, type:'goal', color:dom.color, x:dom.x+Math.cos(angle)*dist, y:dom.y+Math.sin(angle)*dist, r:22, goalData:g, progress });
      edges.push({ from:`domain-${g.cat||'Growth'}`, to:`goal-${g.id}` });
    });
    (habits||[]).slice(0,16).forEach((h,i)=>{
      const dom=nodes.find(n=>n.id===`domain-${h.category||'Growth'}`) || nodes[i%domains.length];
      const angle=Math.random()*Math.PI*2, dist=60+Math.random()*30;
      nodes.push({ id:`habit-${h.id}`, label:h.name, type:'habit', color:T.textSub, x:dom.x+Math.cos(angle)*dist, y:dom.y+Math.sin(angle)*dist, r:14, emoji:h.emoji||'🔥' });
      edges.push({ from:`domain-${h.category||'Growth'}`, to:`habit-${h.id}` });
    });
    return { nodes, edges };
  }, [goals, habits]);

  const [graph, setGraph] = useState(()=>buildGraph());
  const [dragging, setDragging] = useState(null);
  const [selected, setSelected] = useState(null);
  const [simRunning, setSimRunning] = useState(true);
  const svgRef = useRef(null);
  const rafRef = useRef(null);
  const velRef = useRef({});

  useEffect(()=>{
    if (!simRunning) return;
    const W=700, H=480;
    const SPRING_K=0.022, REST=115, REP=2800, DAMP=0.82, GRAV=0.08;
    let iters=0;
    const tick=()=>{
      setGraph(prev=>{
        const nodes=prev.nodes.map(n=>({...n}));
        const vel=velRef.current;
        nodes.forEach(n=>{ if (!vel[n.id]) vel[n.id]={vx:0,vy:0}; });
        prev.edges.forEach(e=>{
          const a=nodes.find(n=>n.id===e.from), b=nodes.find(n=>n.id===e.to);
          if (!a||!b) return;
          const dx=b.x-a.x, dy=b.y-a.y, dist=Math.sqrt(dx*dx+dy*dy)||1;
          const f=SPRING_K*(dist-REST), fx=f*dx/dist, fy=f*dy/dist;
          vel[a.id].vx+=fx; vel[a.id].vy+=fy;
          vel[b.id].vx-=fx; vel[b.id].vy-=fy;
        });
        for (let i=0;i<nodes.length;i++) for (let j=i+1;j<nodes.length;j++) {
          const a=nodes[i], b=nodes[j];
          const dx=b.x-a.x, dy=b.y-a.y, d2=dx*dx+dy*dy||1, d=Math.sqrt(d2);
          const f=REP/d2, fx=f*dx/d, fy=f*dy/d;
          vel[a.id].vx-=fx; vel[a.id].vy-=fy;
          vel[b.id].vx+=fx; vel[b.id].vy+=fy;
        }
        nodes.forEach(n=>{
          vel[n.id].vx+=(W/2-n.x)*GRAV;
          vel[n.id].vy+=(H/2-n.y)*GRAV;
        });
        nodes.forEach(n=>{
          if (dragging&&dragging.nodeId===n.id) { vel[n.id]={vx:0,vy:0}; return; }
          vel[n.id].vx*=DAMP; vel[n.id].vy*=DAMP;
          n.x=Math.max(n.r+10,Math.min(W-n.r-10,n.x+vel[n.id].vx));
          n.y=Math.max(n.r+10,Math.min(H-n.r-10,n.y+vel[n.id].vy));
        });
        return {...prev, nodes};
      });
      iters++;
      if (iters<150) rafRef.current=requestAnimationFrame(tick);
      else setSimRunning(false);
    };
    rafRef.current=requestAnimationFrame(tick);
    return ()=>{ if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [simRunning, dragging]);

  const handleMouseDown=useCallback((e,nodeId)=>{
    e.stopPropagation();
    const svg=svgRef.current; if (!svg) return;
    const pt=svg.createSVGPoint(); pt.x=e.clientX; pt.y=e.clientY;
    const sp=pt.matrixTransform(svg.getScreenCTM().inverse());
    const node=graph.nodes.find(n=>n.id===nodeId);
    setDragging({nodeId, offsetX:sp.x-node.x, offsetY:sp.y-node.y});
    setSelected(nodeId); setSimRunning(false);
  },[graph.nodes]);

  const handleMouseMove=useCallback((e)=>{
    if (!dragging) return;
    const svg=svgRef.current; if (!svg) return;
    const pt=svg.createSVGPoint(); pt.x=e.clientX; pt.y=e.clientY;
    const sp=pt.matrixTransform(svg.getScreenCTM().inverse());
    setGraph(prev=>({ ...prev, nodes:prev.nodes.map(n=>n.id===dragging.nodeId ? {...n, x:Math.max(n.r+10,Math.min(690-n.r,sp.x-dragging.offsetX)), y:Math.max(n.r+10,Math.min(470-n.r,sp.y-dragging.offsetY))} : n) }));
  },[dragging]);

  const handleMouseUp=useCallback(()=>setDragging(null),[]);
  const resetLayout=()=>{ velRef.current={}; setGraph(buildGraph()); setSimRunning(true); setSelected(null); };
  const selectedNode=selected?graph.nodes.find(n=>n.id===selected):null;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', flexWrap:'wrap', gap:10 }}>
        <div>
          <SectionLabel>🗺️ Life Map</SectionLabel>
          <div style={{ fontSize:11, fontFamily:T.fM, color:T.textSub }}>Goals and habits as a connected graph. Drag nodes to rearrange.</div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <Btn onClick={resetLayout} color={T.textSub} style={{ fontSize:10, padding:'5px 12px' }}>Reset Layout</Btn>
          <Btn onClick={()=>{velRef.current={}; setSimRunning(true);}} color={T.accent} style={{ fontSize:10, padding:'5px 12px' }}>▶ Simulate</Btn>
        </div>
      </div>

      {(goals||[]).length===0&&(habits||[]).length===0 ? (
        <GlassCard style={{ padding:40, textAlign:'center' }}>
          <div style={{ fontSize:36, marginBottom:12 }}>🗺️</div>
          <div style={{ fontSize:13, fontFamily:T.fD, fontWeight:700, color:T.text, marginBottom:6 }}>No map yet</div>
          <div style={{ fontSize:11, fontFamily:T.fM, color:T.textSub }}>Add goals and habits — they'll appear here as a connected life graph.</div>
        </GlassCard>
      ) : (
        <GlassCard style={{ padding:'6px', overflow:'hidden' }}>
          <svg ref={svgRef} viewBox="0 0 700 480"
            style={{ width:'100%', height:'auto', cursor:dragging?'grabbing':'default', background:'transparent', userSelect:'none', display:'block' }}
            onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
            <defs>
              <radialGradient id="mapGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={T.accent} stopOpacity="0.04"/>
                <stop offset="100%" stopColor={T.accent} stopOpacity="0"/>
              </radialGradient>
            </defs>
            <rect width="700" height="480" fill="url(#mapGlow)" />
            {/* Edges */}
            {graph.edges.map((e,i)=>{
              const a=graph.nodes.find(n=>n.id===e.from), b=graph.nodes.find(n=>n.id===e.to);
              if (!a||!b) return null;
              return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={a.color+'33'} strokeWidth={1.5} strokeDasharray={b.type==='habit'?'3 3':'none'} />;
            })}
            {/* Nodes */}
            {graph.nodes.map(node=>(
              <g key={node.id} transform={`translate(${node.x},${node.y})`} onMouseDown={e=>handleMouseDown(e,node.id)} style={{ cursor:'grab' }}>
                {selected===node.id&&<circle r={node.r+7} fill="none" stroke={node.color} strokeWidth={1.5} opacity={0.4} />}
                {node.type==='goal'&&node.progress>0&&(
                  <circle r={node.r+4} fill="none" stroke={node.color} strokeWidth={3}
                    strokeDasharray={`${node.progress*2*Math.PI*(node.r+4)} ${2*Math.PI*(node.r+4)}`}
                    strokeLinecap="round" transform="rotate(-90)" opacity={0.85} />
                )}
                <circle r={node.r}
                  fill={node.type==='domain'?node.color+'1e':node.type==='goal'?node.color+'14':T.surface}
                  stroke={selected===node.id?node.color:node.color+(node.type==='domain'?'88':'44')}
                  strokeWidth={selected===node.id?2.5:node.type==='domain'?2:1.5} />
                {node.type==='habit'&&<text textAnchor="middle" dominantBaseline="central" fontSize={12} style={{ pointerEvents:'none' }}>{node.emoji}</text>}
                {node.type==='domain'&&<text textAnchor="middle" dominantBaseline="central" fontSize={10} fill={node.color} fontWeight={700} fontFamily={T.fM} letterSpacing="-0.5" style={{ pointerEvents:'none' }}>{node.label.slice(0,3)}</text>}
                {node.type==='goal'&&<text textAnchor="middle" dominantBaseline="central" fontSize={8} fill={node.color} fontWeight={600} fontFamily={T.fM} style={{ pointerEvents:'none' }}>{Math.round((node.progress||0)*100)}%</text>}
                <text y={node.r+12} textAnchor="middle" fontSize={node.type==='domain'?9:8}
                  fill={node.type==='domain'?node.color:T.textSub} fontFamily={T.fM}
                  fontWeight={node.type==='domain'?700:400} style={{ pointerEvents:'none' }}>
                  {node.label.length>15?node.label.slice(0,14)+'…':node.label}
                </text>
              </g>
            ))}
          </svg>
        </GlassCard>
      )}

      {selectedNode&&(
        <GlassCard style={{ padding:'14px 18px', borderLeft:`3px solid ${selectedNode.color}55`, animation:'slideDown 0.2s ease' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
            <div>
              <div style={{ fontSize:9, fontFamily:T.fM, color:T.textSub, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:4 }}>{selectedNode.type}</div>
              <div style={{ fontSize:15, fontFamily:T.fD, fontWeight:700, color:T.text }}>{selectedNode.label}</div>
              {selectedNode.type==='goal'&&selectedNode.goalData&&(
                <div style={{ fontSize:11, fontFamily:T.fM, color:T.textSub, marginTop:4 }}>
                  {cur}{fmtN(selectedNode.goalData.current||0)} / {cur}{fmtN(selectedNode.goalData.target||0)} · {Math.round((selectedNode.progress||0)*100)}% complete
                </div>
              )}
            </div>
            <button onClick={()=>setSelected(null)} style={{ color:T.textSub, padding:4, background:'none', border:'none', cursor:'pointer', marginTop:2 }}><IcoX size={13} stroke={T.textSub} /></button>
          </div>
        </GlassCard>
      )}

      <div style={{ display:'flex', gap:16, flexWrap:'wrap', fontSize:9, fontFamily:T.fM, color:T.textSub }}>
        {[{l:'Domain node',s:'⬡',c:T.accent},{l:'Goal (ring = % complete)',s:'◎',c:T.violet},{l:'Habit',s:'●',c:T.textSub}].map(x=>(
          <span key={x.l} style={{ display:'flex', alignItems:'center', gap:4 }}><span style={{ color:x.c, fontSize:12 }}>{x.s}</span>{x.l}</span>
        ))}
        <span style={{ marginLeft:'auto', color:T.textMuted }}>Drag to rearrange · Click to inspect</span>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ── 🔮 LIFE FORECAST ENGINE ───────────────────────────────────────════════════
// ══════════════════════════════════════════════════════════════════════════════
function LifeForecastTab({ data }) {
  const {settings={}, vitals=[], habits=[], habitLogs={}, expenses=[], incomes=[], assets=[], investments=[], debts=[]} = data;
  const cur = settings.currency || '$';

  // ── Overrides: user can edit any input directly in the tab ──────────────────
  const [ov, setOv] = useLocalStorage('los_forecast_overrides', {});
  const [showOverrides, setShowOverrides] = useState(false);
  const setField = (k, v) => setOv(prev => ({ ...prev, [k]: v }));

  // ── Fix 1: Trailing 3-month average income & expenses ──────────────────────
  // Current-month snapshot gives wildly wrong results early in the month.
  // We use the last 3 full calendar months for a stable baseline.
  const trailingMonths = useMemo(() => {
    const months = [];
    for (let i = 1; i <= 3; i++) {
      const d = new Date(); d.setMonth(d.getMonth() - i);
      months.push(d.toISOString().slice(0, 7));
    }
    return months;
  }, []);

  const trailingAvgInc = useMemo(() => {
    const total = trailingMonths.reduce((s, m) =>
      s + (incomes||[]).filter(i => i.date?.startsWith(m)).reduce((a, i) => a + Number(i.amount||0), 0), 0);
    return trailingMonths.length ? total / trailingMonths.length : 0;
  }, [incomes, trailingMonths]);

  const trailingAvgExp = useMemo(() => {
    const total = trailingMonths.reduce((s, m) =>
      s + (expenses||[]).filter(e => e.date?.startsWith(m)).reduce((a, e) => a + Number(e.amount||0), 0), 0);
    return trailingMonths.length ? total / trailingMonths.length : 0;
  }, [expenses, trailingMonths]);

  const trailingAvgSav = Math.max(0, trailingAvgInc - trailingAvgExp);

  // ── Fix 2: Actual investment contributions vs cashflow ─────────────────────
  // Cashflow != investing. User overrides what actually gets contributed monthly.
  const monthlyContrib = ov.monthlyContrib != null
    ? Number(ov.monthlyContrib)
    : Math.round(trailingAvgSav);

  // ── Fix 3: Only investable portfolio compounds at market rate ──────────────
  // Real estate, vehicles etc don't earn 7%/yr. Only investments + liquid cash.
  const portfolioValue = useMemo(() => {
    const invVal  = (investments||[]).reduce((s, i) =>
      s + Number((i.currentPrice ?? i.buyPrice) || 0) * Number(i.quantity || 0), 0);
    const cashVal = (assets||[]).filter(a => a.type === 'Cash')
      .reduce((s, a) => s + Number(a.value || 0), 0);
    return invVal + cashVal;
  }, [investments, assets]);

  const illiquidVal = useMemo(() =>
    (assets||[]).filter(a => a.type !== 'Cash').reduce((s, a) => s + Number(a.value||0), 0),
  [assets]);

  const totalDebt = useMemo(() =>
    (debts||[]).reduce((s, d) => s + Number(d.balance||0), 0),
  [debts]);

  const netWorth = portfolioValue + illiquidVal - totalDebt;

  // ── Fix 4: User-controlled return rate — not noisy NW history ──────────────
  const annualReturnRate = ov.returnRate != null ? Number(ov.returnRate) : 7;
  const r = annualReturnRate / 100;

  // ── Projections: portfolio-only compounding with real contributions ──────────
  const YEARS = [1, 2, 3, 5, 10, 15, 20];

  // Future value of a growing annuity: P*(1+r)^n + C*((1+r)^n-1)/r
  const project = (principal, annual_contrib, rate, yr) => {
    if (rate === 0) return principal + annual_contrib * yr;
    return Math.round(
      principal * Math.pow(1 + rate, yr) +
      annual_contrib * (Math.pow(1 + rate, yr) - 1) / rate
    );
  };

  const annualContrib = monthlyContrib * 12;

  const nwForecast = useMemo(() => YEARS.map(yr => ({
    year: `${yr}yr`,
    conservative: project(portfolioValue, annualContrib, 0.04, yr) + illiquidVal - totalDebt,
    base:         project(portfolioValue, annualContrib, r,    yr) + illiquidVal - totalDebt,
    optimistic:   project(portfolioValue, annualContrib, 0.10, yr) + illiquidVal - totalDebt,
    portfolio:    project(portfolioValue, annualContrib, r,    yr),
  })), [portfolioValue, annualContrib, r, illiquidVal, totalDebt]);

  // ── FI calc: based on trailing expenses, portfolio only ───────────────────
  const fiCalc = useMemo(() => {
    const annualExp = (ov.annualExp != null ? Number(ov.annualExp) : Math.round(trailingAvgExp * 12));
    const fiNumber  = annualExp * 25;
    const annualSav = annualContrib;
    if (annualSav <= 0 || fiNumber <= 0) return { years: null, fiNumber, pct: 0, annualExp, annualSav };
    let years = 0, projected = portfolioValue;
    while (projected < fiNumber && years < 100) {
      projected = projected * (1 + r) + annualSav;
      years++;
    }
    return {
      years, fiNumber,
      date: new Date().getFullYear() + years,
      pct: Math.min(100, (portfolioValue / Math.max(1, fiNumber)) * 100),
      annualExp, annualSav,
    };
  }, [portfolioValue, annualContrib, r, trailingAvgExp, ov.annualExp]);

  // ── Monthly savings waterfall data ────────────────────────────────────────
  const savingsWaterfall = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i);
      const m = d.toISOString().slice(0, 7);
      const inc = (incomes||[]).filter(x => x.date?.startsWith(m)).reduce((s, x) => s + Number(x.amount||0), 0);
      const exp = (expenses||[]).filter(x => x.date?.startsWith(m)).reduce((s, x) => s + Number(x.amount||0), 0);
      months.push({ month: m.slice(5), income: inc, expenses: exp, saved: Math.max(0, inc - exp) });
    }
    return months;
  }, [incomes, expenses]);

  // ── Habit / mood correlation ───────────────────────────────────────────────
  const habitMoodData = useMemo(() =>
    (vitals||[]).filter(v => v.mood && v.date).map(v => ({
      date: v.date,
      mood: Number(v.mood),
      completion: (habits||[]).length > 0
        ? Math.round(((habits||[]).filter(h => (habitLogs[h.id]||[]).includes(v.date)).length / (habits||[]).length) * 100)
        : 0,
    })).sort((a, b) => a.date > b.date ? 1 : -1).slice(-30),
  [vitals, habits, habitLogs]);

  const correlation = useMemo(() => {
    const pts = habitMoodData.filter(p => p.completion > 0);
    if (pts.length < 4) return null;
    const n = pts.length;
    const mx = pts.reduce((s, p) => s + p.completion, 0) / n;
    const my = pts.reduce((s, p) => s + p.mood, 0) / n;
    const cov = pts.reduce((s, p) => s + (p.completion - mx) * (p.mood - my), 0) / n;
    const sdx = Math.sqrt(pts.reduce((s, p) => s + Math.pow(p.completion - mx, 2), 0) / n);
    const sdy = Math.sqrt(pts.reduce((s, p) => s + Math.pow(p.mood - my, 2), 0) / n);
    return sdx > 0 && sdy > 0 ? (cov / (sdx * sdy)).toFixed(2) : null;
  }, [habitMoodData]);

  const corrLabel = correlation === null ? '—' : Number(correlation) > 0.5 ? 'Strong positive' : Number(correlation) > 0.2 ? 'Moderate positive' : Number(correlation) < -0.2 ? 'Negative' : 'Weak';
  const corrColor = correlation === null ? T.textSub : Number(correlation) > 0.2 ? T.emerald : Number(correlation) < -0.2 ? T.rose : T.textSub;

  // ── Collapsible methodology panel state ──────────────────────────────────
  const [showNWMethod,   setShowNWMethod  ] = useState(false);
  const [showFIMethod,   setShowFIMethod  ] = useState(false);
  const [showCorrMethod, setShowCorrMethod] = useState(false);

  const MethodBtn = ({ open, onToggle }) => (
    <button onClick={onToggle} style={{ display:'flex', alignItems:'center', gap:4, fontSize:9, fontFamily:T.fM, color:open?T.accent:T.textSub, background:open?T.accentDim:'transparent', border:`1px solid ${open?T.accent+'44':T.border}`, borderRadius:99, padding:'3px 10px', cursor:'pointer', transition:'all 0.15s', flexShrink:0 }}>
      🔬 {open ? 'Hide' : 'How calculated?'}
    </button>
  );
  const MRow = ({ label, val, sub }) => (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', padding:'7px 0', borderBottom:`1px solid ${T.border}` }}>
      <div>
        <div style={{ fontSize:11, fontFamily:T.fM, color:T.text }}>{label}</div>
        {sub && <div style={{ fontSize:9, fontFamily:T.fM, color:T.textMuted, marginTop:2 }}>{sub}</div>}
      </div>
      <div style={{ fontSize:11, fontFamily:T.fM, color:T.accent, fontWeight:600, flexShrink:0, marginLeft:16 }}>{val}</div>
    </div>
  );

  // ── Inline override field ────────────────────────────────────────────────
  const OvField = ({ label, fieldKey, value, placeholder, suffix='' }) => (
    <div>
      <div style={{ fontSize:9, fontFamily:T.fM, color:T.textSub, marginBottom:4 }}>{label}</div>
      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
        <input
          type="number"
          value={value}
          onChange={e => setField(fieldKey, e.target.value)}
          placeholder={placeholder}
          style={{ flex:1, padding:'7px 10px', background:'rgba(255,255,255,0.04)', border:`1px solid ${T.border}`, borderRadius:T.r, fontFamily:T.fM, fontSize:12, color:T.text }}
        />
        {suffix && <span style={{ fontSize:10, fontFamily:T.fM, color:T.textSub, flexShrink:0 }}>{suffix}</span>}
        {ov[fieldKey] != null && (
          <button onClick={() => setField(fieldKey, null)} style={{ fontSize:9, fontFamily:T.fM, color:T.rose, background:'none', border:'none', cursor:'pointer', flexShrink:0 }}>✕ reset</button>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:18 }}>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', flexWrap:'wrap', gap:10 }}>
        <div>
          <SectionLabel>🔮 Life Forecast Engine</SectionLabel>
          <div style={{ fontSize:11, fontFamily:T.fM, color:T.textSub }}>Built from your trailing 3-month average · Only your investable portfolio compounds · All inputs editable below.</div>
        </div>
        <button onClick={() => setShowOverrides(v => !v)} style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 14px', borderRadius:T.r, background:showOverrides?T.amberDim:T.surface, border:`1px solid ${showOverrides?T.amber+'55':T.border}`, fontSize:10, fontFamily:T.fM, color:showOverrides?T.amber:T.textSub, cursor:'pointer', transition:'all 0.15s' }}>
          ✏️ {showOverrides ? 'Close overrides' : 'Edit assumptions'}
        </button>
      </div>

      {/* ── Override editor ────────────────────────────────────────────────── */}
      {showOverrides && (
        <GlassCard style={{ padding:'18px 22px', border:`1px solid ${T.amber}33`, animation:'slideDown 0.2s ease' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <SectionLabel>✏️ Edit Assumptions</SectionLabel>
            <button onClick={() => { setOv({}); }} style={{ fontSize:9, fontFamily:T.fM, color:T.rose, background:T.roseDim, border:`1px solid ${T.rose}33`, borderRadius:99, padding:'3px 10px', cursor:'pointer' }}>Reset all to auto</button>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:14 }}>
            <OvField label={`Monthly contribution (${cur})`}       fieldKey="monthlyContrib" value={ov.monthlyContrib ?? monthlyContrib}    placeholder={`auto: ${cur}${fmtN(monthlyContrib)}`} />
            <OvField label="Expected annual return rate"          fieldKey="returnRate"     value={ov.returnRate     ?? annualReturnRate}   placeholder="7" suffix="% / yr" />
            <OvField label={`Annual expenses for FI calc (${cur})`} fieldKey="annualExp"    value={ov.annualExp      ?? Math.round(trailingAvgExp*12)} placeholder={`auto: ${cur}${fmtN(Math.round(trailingAvgExp*12))}`} />
          </div>
          <div style={{ marginTop:12, padding:'10px 12px', borderRadius:T.r, background:T.surface, border:`1px solid ${T.border}`, fontSize:10, fontFamily:T.fM, color:T.textSub, lineHeight:1.6 }}>
            <b style={{ color:T.text }}>Auto-detected values</b> — Monthly income avg: <b style={{ color:T.emerald }}>{cur}{fmtN(trailingAvgInc)}</b> · Monthly expense avg: <b style={{ color:T.rose }}>{cur}{fmtN(trailingAvgExp)}</b> · Avg monthly surplus: <b style={{ color:T.accent }}>{cur}{fmtN(trailingAvgSav)}</b> · Based on last {trailingMonths.length} full months of data.
          </div>
        </GlassCard>
      )}

      {/* ── KPI row ────────────────────────────────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(190px,1fr))', gap:12 }}>
        {[
          { label:'Investable Portfolio',    val:`${cur}${fmtN(portfolioValue)}`,          sub:'Investments + liquid cash',                              color:T.accent },
          { label:'Monthly Contribution',    val:`${cur}${fmtN(monthlyContrib)}`,          sub:ov.monthlyContrib!=null?'Manual override':'Auto from 3-mo avg surplus', color:T.emerald },
          { label:'FI Number (25× expenses)',val:fiCalc.fiNumber>0?`${cur}${fmtN(fiCalc.fiNumber)}`:'—', sub:`Based on ${cur}${fmtN(fiCalc.annualExp)}/yr expenses`,  color:T.violet },
          { label:'Estimated FI Year',       val:fiCalc.years!=null?(fiCalc.years<1?'Now! 🎉':`${fiCalc.date}`):'—', sub:fiCalc.years!=null?`~${fiCalc.years}yr at ${cur}${fmtN(monthlyContrib)}/mo`:'Set contributions to project', color:T.sky },
        ].map((m, i) => (
          <GlassCard key={i} style={{ padding:'16px 18px' }}>
            <div style={{ fontSize:9, fontFamily:T.fM, color:T.textSub, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:6 }}>{m.label}</div>
            <div style={{ fontSize:20, fontFamily:T.fD, fontWeight:700, color:m.color, marginBottom:4 }}>{m.val}</div>
            <div style={{ fontSize:10, fontFamily:T.fM, color:T.textSub }}>{m.sub}</div>
          </GlassCard>
        ))}
      </div>

      {/* ── Monthly savings waterfall ─────────────────────────────────────── */}
      <GlassCard style={{ padding:'20px 22px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14, flexWrap:'wrap', gap:8 }}>
          <div>
            <SectionLabel>Monthly Savings — Last 6 Months</SectionLabel>
            <div style={{ fontSize:10, fontFamily:T.fM, color:T.textSub, marginTop:2 }}>
              Avg income: <b style={{ color:T.emerald }}>{cur}{fmtN(trailingAvgInc)}</b> · Avg expenses: <b style={{ color:T.rose }}>{cur}{fmtN(trailingAvgExp)}</b> · Avg saved: <b style={{ color:T.accent }}>{cur}{fmtN(trailingAvgSav)}</b>
            </div>
          </div>
          <div style={{ display:'flex', gap:12, fontSize:9, fontFamily:T.fM }}>
            {[{l:'Income',c:T.emerald},{l:'Expenses',c:T.rose},{l:'Saved',c:T.accent}].map(x=>(
              <span key={x.l} style={{ display:'flex', alignItems:'center', gap:4, color:T.textSub }}>
                <span style={{ width:8, height:8, borderRadius:2, background:x.c, display:'inline-block' }} />{x.l}
              </span>
            ))}
          </div>
        </div>
        {savingsWaterfall.some(m => m.income > 0) ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={savingsWaterfall} barGap={3} margin={{top:4,right:0,left:0,bottom:0}}>
              <CartesianGrid strokeDasharray="2 4" stroke={T.border} vertical={false} />
              <XAxis dataKey="month" tick={{fill:T.textSub,fontSize:9,fontFamily:T.fM}} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip content={<ChartTooltip prefix={cur} />} />
              <Bar dataKey="income"   name="Income"   fill={T.emerald} opacity={0.5} radius={[4,4,0,0]} barSize={18} />
              <Bar dataKey="expenses" name="Expenses" fill={T.rose}    opacity={0.7} radius={[4,4,0,0]} barSize={18} />
              <Bar dataKey="saved"    name="Saved"    fill={T.accent}  opacity={0.9} radius={[4,4,0,0]} barSize={18} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ height:80, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontFamily:T.fM, color:T.textMuted }}>Log income and expenses to see your savings history.</div>
        )}
        {/* Savings rate row */}
        <div style={{ marginTop:14, display:'flex', flexDirection:'column', gap:8 }}>
          {savingsWaterfall.filter(m=>m.income>0).map((m,i)=>{
            const rate = m.income > 0 ? (m.saved/m.income)*100 : 0;
            const c = rate>=30?T.emerald:rate>=15?T.accent:rate>0?T.amber:T.rose;
            return (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ fontSize:9, fontFamily:T.fM, color:T.textSub, width:32, flexShrink:0 }}>{m.month}</div>
                <div style={{ flex:1 }}><ProgressBar pct={Math.min(100,rate)} color={c} height={5} /></div>
                <div style={{ fontSize:9, fontFamily:T.fM, color:c, width:60, textAlign:'right', flexShrink:0 }}>{cur}{fmtN(m.saved)} <span style={{color:T.textMuted}}>({rate.toFixed(0)}%)</span></div>
              </div>
            );
          })}
        </div>
      </GlassCard>

      {/* ── Portfolio projection ──────────────────────────────────────────── */}
      <GlassCard style={{ padding:'20px 22px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6, flexWrap:'wrap', gap:8 }}>
          <SectionLabel>Portfolio Projection</SectionLabel>
          <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
            {[{l:'Conservative (4%)',c:T.sky},{l:`Base (${annualReturnRate}%)`,c:T.accent},{l:'Optimistic (10%)',c:T.emerald}].map(x=>(
              <span key={x.l} style={{ display:'flex', alignItems:'center', gap:4, fontSize:9, fontFamily:T.fM, color:T.textSub }}>
                <span style={{ width:8, height:8, borderRadius:'50%', background:x.c, display:'inline-block' }}/>{x.l}
              </span>
            ))}
            <MethodBtn open={showNWMethod} onToggle={() => setShowNWMethod(v=>!v)} />
          </div>
        </div>
        <div style={{ fontSize:10, fontFamily:T.fM, color:T.textSub, marginBottom:14 }}>
          Starting portfolio: <b style={{ color:T.accent }}>{cur}{fmtN(portfolioValue)}</b> · Monthly contribution: <b style={{ color:T.emerald }}>{cur}{fmtN(monthlyContrib)}</b> · Illiquid assets ({cur}{fmtN(illiquidVal)}) and debts (−{cur}{fmtN(totalDebt)}) are added flat — they don't compound.
        </div>

        {showNWMethod && (
          <div style={{ marginBottom:16, padding:'14px 16px', borderRadius:T.r, background:T.accentLo, border:`1px solid ${T.accent}22`, animation:'slideDown 0.2s ease' }}>
            <div style={{ fontSize:10, fontFamily:T.fM, color:T.accent, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:10 }}>How this is calculated</div>
            <MRow label="Investable portfolio" val={`${cur}${fmtN(portfolioValue)}`}     sub="Investments (current price × qty) + Cash assets — this is what compounds" />
            <MRow label="Illiquid assets"       val={`${cur}${fmtN(illiquidVal)}`}       sub="Real estate, vehicles, other — added as flat values, not compounded" />
            <MRow label="Total debt"            val={`−${cur}${fmtN(totalDebt)}`}        sub="Subtracted from net worth but not from portfolio projection" />
            <MRow label="Annual contribution"   val={`${cur}${fmtN(annualContrib)}`}     sub={`${cur}${fmtN(monthlyContrib)}/mo × 12`} />
            <div style={{ marginTop:12, padding:'10px 12px', borderRadius:T.r, background:T.surface, border:`1px solid ${T.border}`, fontSize:10, fontFamily:T.fM, color:T.textSub, lineHeight:1.7 }}>
              Formula: <span style={{ color:T.accent }}>P × (1+r)^n + C × ((1+r)^n − 1) / r</span><br/>
              where P = portfolio today, r = annual rate, n = years, C = annual contributions.<br/>
              Three scenarios use r = 4% (conservative), {annualReturnRate}% (your base), 10% (optimistic).
            </div>
            <div style={{ marginTop:8, fontSize:9, fontFamily:T.fM, color:T.textMuted, lineHeight:1.5 }}>⚠ Assumes constant contributions and does not model inflation, taxes, or market volatility.</div>
          </div>
        )}

        {portfolioValue > 0 || monthlyContrib > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={nwForecast} margin={{top:4,right:0,left:0,bottom:0}}>
                <CartesianGrid strokeDasharray="2 4" stroke={T.border} vertical={false} />
                <XAxis dataKey="year" tick={{fill:T.textSub,fontSize:9,fontFamily:T.fM}} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip content={<ChartTooltip prefix={cur} />} />
                <Line type="monotone" dataKey="conservative" name="Conservative (4%)"              stroke={T.sky}     strokeWidth={2}   dot={{fill:T.sky,r:3}}     strokeDasharray="5 3" />
                <Line type="monotone" dataKey="base"         name={`Base (${annualReturnRate}%)`}  stroke={T.accent}  strokeWidth={2.5} dot={{fill:T.accent,r:4}} />
                <Line type="monotone" dataKey="optimistic"   name="Optimistic (10%)"               stroke={T.emerald} strokeWidth={2}   dot={{fill:T.emerald,r:3}} strokeDasharray="5 3" />
              </LineChart>
            </ResponsiveContainer>
            {/* Number table below chart */}
            <div style={{ marginTop:14, overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:10, fontFamily:T.fM }}>
                <thead>
                  <tr>
                    {['Year','Conservative','Base','Optimistic'].map(h=>(
                      <th key={h} style={{ textAlign:'left', padding:'4px 8px', color:T.textSub, fontWeight:600, borderBottom:`1px solid ${T.border}`, letterSpacing:'0.05em', fontSize:9 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {nwForecast.map(row=>(
                    <tr key={row.year} style={{ borderBottom:`1px solid ${T.border}22` }}>
                      <td style={{ padding:'5px 8px', color:T.textSub }}>{row.year}</td>
                      <td style={{ padding:'5px 8px', color:T.sky,     fontWeight:600 }}>{cur}{fmtN(row.conservative)}</td>
                      <td style={{ padding:'5px 8px', color:T.accent,  fontWeight:600 }}>{cur}{fmtN(row.base)}</td>
                      <td style={{ padding:'5px 8px', color:T.emerald, fontWeight:600 }}>{cur}{fmtN(row.optimistic)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div style={{ height:100, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontFamily:T.fM, color:T.textMuted }}>Add investments or cash assets, or set a monthly contribution above, to generate projections.</div>
        )}
      </GlassCard>

      {/* ── FI Calculation ────────────────────────────────────────────────── */}
      <GlassCard style={{ padding:'20px 22px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14, flexWrap:'wrap', gap:8 }}>
          <SectionLabel>Financial Independence Calculation</SectionLabel>
          <MethodBtn open={showFIMethod} onToggle={() => setShowFIMethod(v=>!v)} />
        </div>

        {showFIMethod && (
          <div style={{ marginBottom:16, padding:'14px 16px', borderRadius:T.r, background:T.violetDim, border:`1px solid ${T.violet}22`, animation:'slideDown 0.2s ease' }}>
            <div style={{ fontSize:10, fontFamily:T.fM, color:T.violet, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:10 }}>Inputs used</div>
            <MRow label="Monthly expenses (3-mo avg)" val={`${cur}${fmtN(trailingAvgExp)}`}   sub="Trailing average, not current month snapshot" />
            <MRow label="Annual expenses"             val={`${cur}${fmtN(fiCalc.annualExp)}`} sub="Monthly × 12 (override in Edit Assumptions above)" />
            <MRow label="FI number"                   val={`${cur}${fmtN(fiCalc.fiNumber)}`}  sub="Annual expenses × 25  (4% withdrawal rule)" />
            <MRow label="Current portfolio"           val={`${cur}${fmtN(portfolioValue)}`}   sub="Starting point for simulation" />
            <MRow label="Annual contribution"         val={`${cur}${fmtN(annualContrib)}`}    sub={`${cur}${fmtN(monthlyContrib)}/mo — override in Edit Assumptions`} />
            <div style={{ marginTop:12, padding:'10px 12px', borderRadius:T.r, background:T.surface, border:`1px solid ${T.border}`, fontSize:10, fontFamily:T.fM, color:T.textSub, lineHeight:1.7 }}>
              Year-by-year simulation starting from <b style={{ color:T.text }}>{cur}{fmtN(portfolioValue)}</b>:<br/>
              <span style={{ color:T.violet }}>portfolio(year+1) = portfolio(year) × (1 + {annualReturnRate}%) + {cur}{fmtN(annualContrib)}</span><br/>
              Stops when portfolio ≥ <b style={{ color:T.text }}>{cur}{fmtN(fiCalc.fiNumber)}</b>.<br/><br/>
              <b style={{ color:T.text }}>Why 25×?</b> The 4% rule (Trinity Study, 1998): withdraw 4% of your portfolio per year → 1 ÷ 4% = 25× annual expenses needed.
            </div>
            <div style={{ marginTop:8, fontSize:9, fontFamily:T.fM, color:T.textMuted }}>⚠ Assumes expenses stay constant. Real FI date shifts as income, spending, and markets change.</div>
          </div>
        )}

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:10, marginBottom:14 }}>
          {[
            { label:'Annual expenses',  val:`${cur}${fmtN(fiCalc.annualExp)}`,                                  color:T.rose   },
            { label:'FI target',        val:fiCalc.fiNumber>0?`${cur}${fmtN(fiCalc.fiNumber)}`:'—',             color:T.accent },
            { label:'Gap remaining',    val:`${cur}${fmtN(Math.max(0,fiCalc.fiNumber-portfolioValue))}`,        color:T.amber  },
            { label:'Years to FI',      val:fiCalc.years!=null?(fiCalc.years<1?'Now!':String(fiCalc.years)):'—', color:T.violet },
          ].map((m, i) => (
            <div key={i} style={{ padding:'12px 14px', borderRadius:T.r, background:T.surface, border:`1px solid ${T.border}` }}>
              <div style={{ fontSize:9, fontFamily:T.fM, color:T.textSub, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:5 }}>{m.label}</div>
              <div style={{ fontSize:17, fontFamily:T.fD, fontWeight:700, color:m.color }}>{m.val}</div>
            </div>
          ))}
        </div>
        {fiCalc.pct > 0 && (
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:9, fontFamily:T.fM, color:T.textSub, marginBottom:5 }}>
              <span>FI progress</span>
              <span style={{ color:T.emerald }}>{fiCalc.pct.toFixed(1)}%</span>
            </div>
            <ProgressBar pct={fiCalc.pct} color={T.emerald} height={6} />
          </div>
        )}

        {/* ── Actionable FI recommendation ──────────────────────────────── */}
        {fiCalc.years != null && fiCalc.years > 1 && (() => {
          // How much more per month would shave 5 years off?
          // Binary search for the monthly contribution needed to hit FI 5 years sooner
          const targetYears = Math.max(1, fiCalc.years - 5);
          const simulateFI = (monthly) => {
            let yrs = 0, p = portfolioValue;
            const annual = monthly * 12;
            while (p < fiCalc.fiNumber && yrs < 100) { p = p * (1 + r) + annual; yrs++; }
            return yrs;
          };

          // Incrementally find the extra monthly needed
          let extraNeeded = null;
          for (let extra = 50; extra <= 2000; extra += 50) {
            if (simulateFI(monthlyContrib + extra) <= targetYears) {
              extraNeeded = extra;
              break;
            }
          }

          // What would keeping current rate cost in extra working years?
          const gapYears = fiCalc.years;
          const fiYear   = fiCalc.date;

          return (
            <div style={{ marginTop:14, padding:'14px 16px', borderRadius:T.r, background:`linear-gradient(135deg,${T.violet}08,${T.accent}04)`, border:`1px solid ${T.violet}33` }}>
              <div style={{ fontSize:9, fontFamily:T.fM, color:T.violet, textTransform:'uppercase', letterSpacing:'0.1em', fontWeight:700, marginBottom:8 }}>
                💡 What would actually move your FI date
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {/* Current trajectory */}
                <div style={{ fontSize:11, fontFamily:T.fM, color:T.text, lineHeight:1.6 }}>
                  At <span style={{ color:T.emerald, fontWeight:700 }}>{cur}{fmtN(monthlyContrib)}/mo</span> you reach FI in <span style={{ color:T.violet, fontWeight:700 }}>{gapYears} years ({fiYear})</span>.
                </div>
                {/* The lever */}
                {extraNeeded && (
                  <div style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'10px 12px', borderRadius:T.r, background:T.accentDim, border:`1px solid ${T.accent}33` }}>
                    <span style={{ fontSize:18, flexShrink:0 }}>⚡</span>
                    <div>
                      <div style={{ fontSize:11, fontFamily:T.fM, color:T.text, lineHeight:1.6 }}>
                        Adding just <span style={{ color:T.accent, fontWeight:700 }}>{cur}{fmtN(extraNeeded)}/mo</span> more to your portfolio would shave <span style={{ color:T.emerald, fontWeight:700 }}>5 years</span> off — reaching FI in <span style={{ color:T.accent, fontWeight:700 }}>{fiYear - 5}</span> instead of {fiYear}.
                      </div>
                      <div style={{ fontSize:9, fontFamily:T.fM, color:T.textSub, marginTop:4 }}>
                        That's <span style={{ color:T.accent }}>{cur}{fmtN(extraNeeded * 12)}/yr</span> — adjust in Edit Assumptions above to model different scenarios.
                      </div>
                    </div>
                  </div>
                )}
                {/* Expenses lever */}
                {fiCalc.annualExp > 0 && (() => {
                  const reducedExp = Math.round(fiCalc.annualExp * 0.9); // 10% reduction
                  const newFINum   = reducedExp * 25;
                  let yrs = 0, p = portfolioValue;
                  const annual = monthlyContrib * 12;
                  while (p < newFINum && yrs < 100) { p = p * (1 + r) + annual; yrs++; }
                  const yearsGained = Math.max(0, fiCalc.years - yrs);
                  if (yearsGained >= 2) return (
                    <div style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'10px 12px', borderRadius:T.r, background:`${T.emerald}08`, border:`1px solid ${T.emerald}22` }}>
                      <span style={{ fontSize:18, flexShrink:0 }}>✂️</span>
                      <div style={{ fontSize:11, fontFamily:T.fM, color:T.text, lineHeight:1.6 }}>
                        Cutting annual expenses by just 10% (<span style={{ color:T.emerald, fontWeight:700 }}>{cur}{fmtN(Math.round(fiCalc.annualExp * 0.1))}/yr</span>) would gain <span style={{ color:T.emerald, fontWeight:700 }}>{yearsGained} years</span> — both by reducing your FI number and increasing savings.
                      </div>
                    </div>
                  );
                  return null;
                })()}
              </div>
            </div>
          );
        })()}
      </GlassCard>

      {/* ── Habit / Mood Correlation ──────────────────────────────────────── */}
      <GlassCard style={{ padding:'20px 22px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14, flexWrap:'wrap', gap:8 }}>
          <SectionLabel>Habit Completion vs Mood</SectionLabel>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            {correlation !== null && (
              <span style={{ fontSize:10, fontFamily:T.fM, color:corrColor, background:corrColor+'18', padding:'3px 10px', borderRadius:99, border:`1px solid ${corrColor}33` }}>r = {correlation} · {corrLabel}</span>
            )}
            <MethodBtn open={showCorrMethod} onToggle={() => setShowCorrMethod(v=>!v)} />
          </div>
        </div>

        {showCorrMethod && (
          <div style={{ marginBottom:16, padding:'14px 16px', borderRadius:T.r, background:`${corrColor}0a`, border:`1px solid ${corrColor}22`, animation:'slideDown 0.2s ease' }}>
            <MRow label="Data points"    val={`${habitMoodData.filter(p=>p.completion>0).length} days`} sub="Days with both a mood log and ≥1 habit completed, last 30 days" />
            <MRow label="Habit coverage" val={`${(habits||[]).length} habits`} sub="Completion % = habits done on that day ÷ total habits × 100" />
            <div style={{ marginTop:10, padding:'10px 12px', borderRadius:T.r, background:T.surface, border:`1px solid ${T.border}`, fontSize:10, fontFamily:T.fM, color:T.textSub, lineHeight:1.7 }}>
              <b style={{ color:T.text }}>Pearson r:</b> <span style={{ color:corrColor }}>r = Σ[(x−x̄)(y−ȳ)] ÷ (n × σx × σy)</span><br/>
              x = habit %, y = mood score, σ = std dev. Result between −1 and +1.
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginTop:10 }}>
              {[
                { range:'r > 0.5',        label:'Strong positive',  note:'High habit days reliably → higher mood', c:T.emerald },
                { range:'0.2 to 0.5',     label:'Moderate positive',note:'Some link, but noisy',                   c:T.accent  },
                { range:'-0.2 to 0.2',    label:'No clear link',    note:'No pattern yet in your data',            c:T.textSub },
                { range:'r < -0.2',       label:'Negative',         note:'May signal over-commitment or fatigue',  c:T.rose    },
              ].map(s => (
                <div key={s.range} style={{ padding:'8px 10px', borderRadius:T.r, background:T.surface, border:`1px solid ${s.c}33` }}>
                  <div style={{ fontSize:10, fontFamily:T.fM, color:s.c, fontWeight:700 }}>{s.range}</div>
                  <div style={{ fontSize:9, fontFamily:T.fM, color:T.text, marginTop:2 }}>{s.label}</div>
                  <div style={{ fontSize:8, fontFamily:T.fM, color:T.textSub, marginTop:2 }}>{s.note}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop:8, fontSize:9, fontFamily:T.fM, color:T.textMuted }}>⚠ Correlation ≠ causation. Sleep, stress, and weekends also affect mood.</div>
          </div>
        )}

        {habitMoodData.length >= 4 ? (
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={habitMoodData} margin={{top:4,right:0,left:0,bottom:0}}>
              <CartesianGrid strokeDasharray="2 4" stroke={T.border} vertical={false} />
              <XAxis dataKey="date" tickFormatter={d => d.slice(5)} tick={{fill:T.textSub,fontSize:9,fontFamily:T.fM}} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip content={<ChartTooltip />} />
              <Line type="monotone" dataKey="mood"       name="Mood /10" stroke={T.violet} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="completion" name="Habit %"  stroke={T.accent} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ height:80, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontFamily:T.fM, color:T.textMuted, textAlign:'center' }}>
            Log vitals (mood) and complete habits for 4+ days to see your correlation.
          </div>
        )}
        {correlation !== null && (
          <div style={{ marginTop:10, fontSize:11, fontFamily:T.fM, color:T.textSub, lineHeight:1.6, borderLeft:`3px solid ${corrColor}44`, paddingLeft:12 }}>
            {Number(correlation) > 0.5 ? 'Strong evidence that habit completion boosts your mood.' :
             Number(correlation) > 0.2 ? 'Moderate positive link between habits and mood — keep the streak going.' :
             Number(correlation) < -0.2 ? 'Negative correlation — you may be over-committed. Consider reducing habits.' :
             'Weak or unclear pattern so far. Keep logging to reveal it.'}
          </div>
        )}
      </GlassCard>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ── 📡 PASSIVE DATA INGEST ────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
function DataIngestTab({ data, actions }) {
  const {settings={}} = data;
  const cur = settings.currency || '$';
  const [stage, setStage] = useState('idle'); // idle | loading | review | done
  const [fileName, setFileName] = useState('');
  const [parsed, setParsed] = useState([]);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(0);
  const fileRef = useRef(null);

  const readAsBase64 = (file) => new Promise((res,rej)=>{ const r=new FileReader(); r.onload=()=>res(r.result.split(',')[1]); r.onerror=()=>rej(new Error('Read failed')); r.readAsDataURL(file); });
  const readAsText  = (file) => new Promise((res,rej)=>{ const r=new FileReader(); r.onload=()=>res(r.result); r.onerror=()=>rej(new Error('Read failed')); r.readAsText(file); });

  const handleFile = async (e) => {
    const file=e.target.files[0]; if (!file) return;
    if (!settings.aiApiKey&&settings.aiProvider!=='ollama') { setError('Add an API key in Settings → AI Provider to use Data Ingest.'); return; }
    setFileName(file.name); setStage('loading'); setError(null);
    const PROMPT=`Extract every financial transaction. Return ONLY a JSON array (no markdown) where each item: {"type":"expense"|"income","amount":number,"date":"YYYY-MM-DD","note":"description","category":"one of: 🍔 Food|🏠 Housing|🚗 Transport|💳 Shopping|📱 Subscriptions|💊 Health|🎉 Entertainment|💰 Salary|💸 Transfer|Other"}. Use today ${today()} if no date found.`;
    try {
      const isPdf = file.name.toLowerCase().endsWith('.pdf');
      let messages;
      if (isPdf&&(settings.aiProvider==='claude'||!settings.aiProvider)) {
        const b64=await readAsBase64(file);
        messages=[{ role:'user', content:[
          { type:'document', source:{ type:'base64', media_type:'application/pdf', data:b64 }},
          { type:'text', text:PROMPT }
        ]}];
      } else {
        const text=await readAsText(file);
        messages=[{ role:'user', content:`${PROMPT}\n\nDocument:\n${text.slice(0,10000)}` }];
      }
      const raw=await callAI(settings,{ max_tokens:2000, messages });
      const clean=raw.replace(/```json|```/g,'').trim();
      const items=JSON.parse(clean);
      if (!Array.isArray(items)) throw new Error('Unexpected AI response format');
      setParsed(items.map((item,i)=>({ ...item, _id:i, _accepted:true })));
      setStage('review');
    } catch(err) { setError(`Parse failed: ${err.message}`); setStage('idle'); }
    if (fileRef.current) fileRef.current.value='';
  };

  const saveAccepted = () => {
    const accepted=parsed.filter(p=>p._accepted);
    accepted.forEach(item=>{
      const base={ id:Date.now()+Math.random(), amount:Number(item.amount)||0, date:item.date||today(), note:item.note||'', category:item.category||'Other' };
      if (item.type==='income') actions.addIncome({ ...base, note:item.note||'Imported' });
      else actions.addExpense(base);
    });
    setSaved(accepted.length); setStage('done'); setParsed([]);
  };

  const toggle=(id)=>setParsed(p=>p.map(x=>x._id===id?{...x,_accepted:!x._accepted}:x));

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
      <div>
        <SectionLabel>📡 Passive Data Ingest</SectionLabel>
        <div style={{ fontSize:11, fontFamily:T.fM, color:T.textSub, lineHeight:1.6 }}>Upload a bank statement, receipt, or email export. AI extracts every transaction and queues them for review before anything is saved.</div>
      </div>

      {(stage==='idle'||stage==='loading') && (
        <GlassCard style={{ padding:'40px', textAlign:'center' }}>
          {stage==='loading' ? (
            <>
              <div style={{ fontSize:36, marginBottom:14, display:'inline-block', animation:'spin 1.8s linear infinite' }}>⚙️</div>
              <div style={{ fontSize:13, fontFamily:T.fD, fontWeight:700, color:T.text, marginBottom:6 }}>Parsing {fileName}…</div>
              <div style={{ fontSize:11, fontFamily:T.fM, color:T.textSub }}>AI is reading and extracting transactions — usually 5–15s</div>
            </>
          ) : (
            <>
              <div style={{ fontSize:44, marginBottom:14 }}>📂</div>
              <div style={{ fontSize:14, fontFamily:T.fD, fontWeight:700, color:T.text, marginBottom:6 }}>Drop a document to parse</div>
              <div style={{ fontSize:11, fontFamily:T.fM, color:T.textSub, marginBottom:22 }}>Bank PDF · Credit card statement · Receipt · Invoice · .eml email</div>
              <label style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'10px 24px', borderRadius:T.r, background:T.accentDim, border:`1px solid ${T.accent}44`, color:T.accent, fontSize:12, fontFamily:T.fM, fontWeight:600, cursor:'pointer', transition:'all 0.15s' }}>
                📎 Choose File (.pdf · .eml · .txt)
                <input ref={fileRef} type="file" accept=".pdf,.eml,.txt,.csv" onChange={handleFile} style={{ display:'none' }} />
              </label>
              {error&&<div style={{ marginTop:16, fontSize:11, fontFamily:T.fM, color:T.rose, padding:'8px 12px', borderRadius:T.r, background:T.roseDim, border:`1px solid ${T.rose}33` }}>{error}</div>}
              {(!settings.aiApiKey&&settings.aiProvider!=='ollama')&&<div style={{ marginTop:12, fontSize:10, fontFamily:T.fM, color:T.amber }}>⚠️ Requires an API key in Settings → AI Provider.</div>}
              <div style={{ marginTop:20, fontSize:9, fontFamily:T.fM, color:T.textMuted }}>PDF requires Claude · .eml/.txt/.csv works with any provider</div>
            </>
          )}
        </GlassCard>
      )}

      {stage==='review' && (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <GlassCard style={{ padding:'18px 22px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, flexWrap:'wrap', gap:8 }}>
              <div>
                <SectionLabel>Review {parsed.length} Parsed Items</SectionLabel>
                <div style={{ fontSize:11, fontFamily:T.fM, color:T.textSub }}>{parsed.filter(p=>p._accepted).length} selected — click to toggle</div>
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <Btn onClick={()=>setParsed(p=>p.map(x=>({...x,_accepted:true})))}  color={T.sky}     style={{ fontSize:10, padding:'5px 12px' }}>All</Btn>
                <Btn onClick={()=>setParsed(p=>p.map(x=>({...x,_accepted:false})))} color={T.textSub} style={{ fontSize:10, padding:'5px 12px' }}>None</Btn>
                <Btn onClick={()=>{setStage('idle');setParsed([]);}} color={T.textSub} style={{ fontSize:10, padding:'5px 12px' }}>Cancel</Btn>
                <Btn onClick={saveAccepted} color={T.accent} style={{ fontSize:10, padding:'5px 14px' }}>Save {parsed.filter(p=>p._accepted).length} →</Btn>
              </div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:7, maxHeight:420, overflowY:'auto' }}>
              {parsed.map(item=>(
                <div key={item._id} onClick={()=>toggle(item._id)}
                  style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', borderRadius:T.r, background:item._accepted?(item.type==='income'?T.emeraldDim:T.roseDim):T.surface, border:`1px solid ${item._accepted?(item.type==='income'?T.emerald+'44':T.rose+'44'):T.border}`, cursor:'pointer', transition:'all 0.12s', opacity:item._accepted?1:0.4 }}>
                  <div style={{ width:18, height:18, borderRadius:5, background:item._accepted?(item.type==='income'?T.emerald:T.rose):'transparent', border:`2px solid ${item._accepted?(item.type==='income'?T.emerald:T.rose):T.textMuted}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:10, color:T.bg, fontWeight:700 }}>{item._accepted?'✓':''}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:12, fontFamily:T.fD, fontWeight:600, color:T.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.note||item.category}</div>
                    <div style={{ fontSize:9, fontFamily:T.fM, color:T.textSub, marginTop:2 }}>{item.category} · {item.date}</div>
                  </div>
                  <div style={{ fontSize:14, fontFamily:T.fD, fontWeight:700, color:item.type==='income'?T.emerald:T.rose, flexShrink:0 }}>{item.type==='income'?'+':'-'}{cur}{fmtN(item.amount)}</div>
                </div>
              ))}
            </div>
          </GlassCard>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, fontFamily:T.fM, color:T.textSub }}>
            <span>Income: {cur}{fmtN(parsed.filter(p=>p._accepted&&p.type==='income').reduce((s,p)=>s+Number(p.amount||0),0))}</span>
            <span>Expenses: {cur}{fmtN(parsed.filter(p=>p._accepted&&p.type==='expense').reduce((s,p)=>s+Number(p.amount||0),0))}</span>
          </div>
        </div>
      )}

      {stage==='done' && (
        <GlassCard style={{ padding:'48px', textAlign:'center' }}>
          <div style={{ fontSize:44, marginBottom:12 }}>✅</div>
          <div style={{ fontSize:16, fontFamily:T.fD, fontWeight:700, color:T.emerald, marginBottom:6 }}>{saved} transaction{saved!==1?'s':''} saved</div>
          <div style={{ fontSize:11, fontFamily:T.fM, color:T.textSub, marginBottom:22 }}>All accepted items added to your records and reflected in your dashboards.</div>
          <Btn onClick={()=>{setStage('idle');setSaved(0);}} color={T.accent}>Parse Another File</Btn>
        </GlassCard>
      )}
    </div>
  );
}

// ── INTELLIGENCE PAGE ─────────────────────────────────────────────────────────
function IntelligencePage({ data, actions={} }) {
  const [tab, setTab] = useState('overview');
  const [coachMessages, setCoachMessages] = useLocalStorage('los_fincoach_msgs', []);
  const [coachInput, setCoachInput] = useState('');
  const [coachLoading, setCoachLoading] = useState(false);
  const {expenses=[], incomes=[], habits=[], habitLogs={}, vitals=[], goals=[], assets=[], investments=[], debts=[], totalXP=0, settings={}, netWorthHistory=[]} = data;
  const cur = settings.currency||'$';
  // Use pre-computed values from App root
  const { monthExp, monthInc, invVal, nw, savRate, thisMonth, topCatEntry, level: lvl } = data.computed;
  const topCat = topCatEntry; // from data.computed
  
  const avgSleep7 = useMemo(()=>{ const v=(vitals||[]).slice(-7); return v.length?(v.reduce((s,x)=>s+Number(x.sleep||0),0)/v.length).toFixed(1):'?'; },[vitals]);
  const level = lvl; // from data.computed
  const todayDone = (habits||[]).filter(h=>(habitLogs[h.id]||[]).includes(today())).length;
  const bestStreak = (habits||[]).reduce((mx,h)=>{const s=getStreak(h.id,habitLogs);return s>mx?s:mx;},0);

  // Spending trends — last 6 months by category
  const spendTrends = useMemo(() => {
    const months = Array.from({length:6},(_,i)=>{ const d=new Date(); d.setMonth(d.getMonth()-5+i); return d.toISOString().slice(0,7); });
    const cats = [...new Set((expenses||[]).map(e=>e.category))].slice(0,6);
    return { months, cats, data: months.map(m => {
      const row = { month: m.slice(5) };
      cats.forEach(c => { row[c] = (expenses||[]).filter(e=>e.date?.startsWith(m)&&e.category===c).reduce((s,e)=>s+Number(e.amount||0),0); });
      row._total = (expenses||[]).filter(e=>e.date?.startsWith(m)).reduce((s,e)=>s+Number(e.amount||0),0);
      return row;
    })};
  }, [expenses]);

  // Net worth projections
  const nwProjection = useMemo(() => {
    const months = netWorthHistory.slice(-12);
    if (months.length < 2) return [];
    const growth = (months[months.length-1].value - months[0].value) / Math.max(1, months.length-1);
    const projected = Array.from({length:6},(_,i) => ({
      month: (() => { const d=new Date(); d.setMonth(d.getMonth()+i+1); return d.toISOString().slice(0,7); })(),
      projected: Math.round(months[months.length-1].value + growth*(i+1)),
    }));
    return [...months, ...projected];
  }, [netWorthHistory]);

  // Detected recurring transactions (appear 2+ months at similar amount)
  const detectedRecurring = useMemo(() => {
    const byNote = {};
    (expenses||[]).forEach(e => {
      const key = (e.note||e.category||'').toLowerCase().trim().slice(0,30);
      if (!key) return;
      if (!byNote[key]) byNote[key] = [];
      byNote[key].push(e);
    });
    return Object.entries(byNote)
      .filter(([,list]) => {
        if (list.length < 2) return false;
        const months = [...new Set(list.map(e=>e.date?.slice(0,7)))];
        if (months.length < 2) return false;
        const amounts = list.map(e=>Number(e.amount||0));
        const avg = amounts.reduce((s,a)=>s+a,0)/amounts.length;
        const allClose = amounts.every(a => Math.abs(a-avg)/Math.max(avg,1) < 0.15);
        return allClose;
      })
      .map(([key,list]) => ({
        name: list[0].note||list[0].category||key,
        category: list[0].category,
        avgAmount: list.reduce((s,e)=>s+Number(e.amount||0),0)/list.length,
        count: list.length,
        months: [...new Set(list.map(e=>e.date?.slice(0,7)))].sort().slice(-3),
      }))
      .sort((a,b) => b.avgAmount - a.avgAmount)
      .slice(0,8);
  }, [expenses]);

  // Habit weekly analytics — last 8 weeks consistency %
  const habitAnalytics = useMemo(() => {
    const weeks = Array.from({length:8},(_,i)=>{
      const start = new Date(); start.setDate(start.getDate() - start.getDay() - 7*(7-i));
      return Array.from({length:7},(_,j)=>{ const d=new Date(start); d.setDate(d.getDate()+j); return d.toISOString().slice(0,10); });
    });
    return weeks.map(days => {
      const total = (habits||[]).length * 7;
      const done = (habits||[]).reduce((s,h)=>s+days.filter(d=>(habitLogs[h.id]||[]).includes(d)).length, 0);
      return { week: days[0].slice(5), pct: total>0?Math.round((done/total)*100):0, done, total };
    });
  }, [habits, habitLogs]);

  const insights = [
    monthInc>0&&savRate<20 && { title:'Low Savings Rate', body:`You're saving ${savRate.toFixed(0)}% this month. Target 20-35% to build long-term wealth. Reduce spending by ${cur}${fmtN(0.2*monthInc-(monthInc-monthExp))} to hit 20%.`, color:T.amber, icon:'⚠️', type:'warning' },
    monthInc>0&&savRate>=35 && { title:'Excellent Savings Rate', body:`${savRate.toFixed(0)}% savings rate — you're outperforming most. ${cur}${fmtN(monthInc-monthExp)} saved this month. On track for financial independence.`, color:T.emerald, icon:'📈', type:'positive' },
    topCat && { title:`Top Spending: ${topCat[0]}`, body:`${topCat[0]} is your largest expense at ${cur}${fmtN(topCat[1])} this month (${monthInc>0?((topCat[1]/monthInc)*100).toFixed(0):0}% of income).`, color:T.violet, icon:'💳', type:'insight' },
    Number(avgSleep7)>0&&Number(avgSleep7)<7 && { title:'Sleep Deficit Detected', body:`Average sleep of ${avgSleep7}h is below optimal 7-8h. Poor sleep correlates with reduced productivity and worse financial decisions.`, color:T.sky, icon:'😴', type:'insight' },
    Number(avgSleep7)>=7 && { title:'Sleep Health Strong', body:`${avgSleep7}h average sleep over 7 days — within optimal range. Research shows well-rested individuals make better financial decisions.`, color:T.sky, icon:'🌙', type:'positive' },
    bestStreak>=7 && { title:`Habit Momentum — ${bestStreak} Day Streak`, body:`Your longest active streak is ${bestStreak} days. Habits compound like investments — you're building powerful life capital.`, color:T.accent, icon:'🔥', type:'positive' },
    (habits||[]).length>0&&todayDone===0 && { title:'No Habits Logged Today', body:`You have ${(habits||[]).length} habits but haven't logged any today. Consistency drives your XP and life score.`, color:T.amber, icon:'🎯', type:'warning' },
    (debts||[]).length>0 && { title:'Active Debt Tracking', body:`${(debts||[]).length} debt(s) totaling ${cur}${fmtN((debts||[]).reduce((s,d)=>s+Number(d.balance||0),0))}. Use the avalanche method (highest rate first) to minimize interest paid.`, color:T.rose, icon:'💳', type:'insight' },
    (goals||[]).length===0 && { title:'Set Your First Goal', body:'No goals defined yet. Users with written goals are 42% more likely to achieve them. Set a financial target to unlock projection tools.', color:'#c084fc', icon:'🎯', type:'coach' },
    (goals||[]).length>0 && { title:'Goal Progress', body:`${(goals||[]).filter(g=>(g.current||0)>=g.target).length} of ${(goals||[]).length} goals completed. Average progress: ${Math.round((goals||[]).reduce((s,g)=>s+((g.current||0)/Math.max(1,g.target))*100,0)/Math.max(1,(goals||[]).length))}%.`, color:T.amber, icon:'🏆', type:'positive' },
  ].filter(Boolean).slice(0,6);
  const LIFE_STATS = [
    { label:'Financial', val:Math.min(100,Math.round((savRate*0.5)+(nw>0?30:0)+((debts||[]).length===0?20:0))), color:T.emerald },
    { label:'Health',    val:Math.min(100,(vitals||[]).length*8), color:T.sky },
    { label:'Habits',    val:Math.min(100,(habits||[]).length*15+bestStreak*2), color:T.accent },
    { label:'Growth',    val:Math.min(100,Math.round(Number(totalXP)/50)), color:T.violet },
    { label:'Focus',     val:Math.min(100,data.focusSessions.length*5), color:T.rose },
    { label:'Knowledge', val:Math.min(100,data.notes.length*10), color:T.amber },
  ];
  const CAT_COLORS = [T.accent,T.rose,T.violet,T.sky,T.amber,T.emerald];
  return (
    <div style={{ animation:'fadeUp 0.4s ease' }}>
      <div style={{ marginBottom:22 }}>
        <SectionLabel>Intelligence Layer</SectionLabel>
        <h1 style={{ fontSize:26, fontFamily:T.fD, fontWeight:800, color:T.text }}>Life Intelligence</h1>
        <div style={{ fontSize:11, fontFamily:T.fM, color:T.textSub, marginTop:4 }}>AI-powered insights · <span style={{ color:'#c084fc' }}>●</span> {insights.length} active insights</div>
      </div>
      {/* Tab nav — 5 focused tabs; AI coach is the Global AI Panel (A key / brain icon) */}
      <div style={{ display:'flex', gap:2, marginBottom:22, background:T.surface, borderRadius:T.r, padding:3, width:'fit-content', border:`1px solid ${T.border}`, flexWrap:'wrap' }}>
        {[
          {id:'overview',   l:'🧠 Overview'},
          {id:'spending',   l:'📊 Spending'},
          {id:'net worth',  l:'💎 Net Worth'},
          {id:'habits',     l:'🔥 Habits'},
          {id:'recurring',  l:'🔄 Recurring'},
        ].map(({id:t,l})=>(
          <button key={t} className="los-tab" onClick={()=>setTab(t)} style={{ padding:'5px 14px', borderRadius:8, fontSize:9, fontFamily:T.fM, textTransform:'uppercase', letterSpacing:'0.06em', background:tab===t?'#c084fc22':'transparent', color:tab===t?'#c084fc':T.textSub, border:`1px solid ${tab===t?'#c084fc33':'transparent'}`, transition:'all 0.15s' }}>{l}</button>
        ))}
        {/* AI Coach is the Global AI Panel — press A or click the brain icon in the topbar */}
        <div style={{ display:'flex', alignItems:'center', padding:'5px 12px', fontSize:9, fontFamily:T.fM, color:T.textMuted, borderRadius:8, background:'transparent', gap:5 }}>
          <IcoBrain size={10} stroke={T.textMuted} />
          <span>AI Coach → press</span>
          <kbd style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:3, padding:'1px 4px', fontSize:8, color:T.accent }}>A</kbd>
        </div>
      </div>

      {tab==='overview' && (
        <>
          <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:22 }}>
            {insights.map((ins,i)=>(
              <GlassCard key={i} style={{ padding:'18px 22px', borderLeft:`3px solid ${ins.color}55`, animation:`fadeUp 0.3s ease ${i*0.07}s both` }}>
                <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
                  <div style={{ fontSize:22, flexShrink:0 }}>{ins.icon}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}><div style={{ fontSize:13, fontFamily:T.fD, fontWeight:700, color:T.text }}>{ins.title}</div><Badge color={ins.color}>{ins.type}</Badge></div>
                    <div style={{ fontSize:12, fontFamily:T.fM, color:T.textSub, lineHeight:1.6 }}>{ins.body}</div>
                  </div>
                </div>
              </GlassCard>
            ))}
            {insights.length===0 && <GlassCard style={{ padding:40, textAlign:'center' }}><div style={{ fontSize:11, fontFamily:T.fM, color:T.textMuted }}>Log expenses, habits and vitals to generate personalized insights.</div></GlassCard>}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:14 }}>
            <GlassCard style={{ padding:'20px 22px' }}>
              <SectionLabel>Life Domain Scores</SectionLabel>
              {LIFE_STATS.map((s,i)=>(
                <div key={i} style={{ marginBottom:12 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}><span style={{ fontSize:11, fontFamily:T.fM, color:T.text }}>{s.label}</span><span style={{ fontSize:11, fontFamily:T.fM, color:s.color, fontWeight:600 }}>{s.val}/100</span></div>
                  <ProgressBar pct={s.val} color={s.color} height={5} />
                </div>
              ))}
            </GlassCard>
            <GlassCard style={{ padding:'20px 22px' }}>
              <SectionLabel>This Month Summary</SectionLabel>
              {[{ label:'Income', val:`${cur}${fmtN(monthInc)}`, color:T.emerald }, { label:'Expenses', val:`${cur}${fmtN(monthExp)}`, color:T.rose }, { label:'Saved', val:`${cur}${fmtN(monthInc-monthExp)}`, color:T.accent }, { label:'Savings Rate', val:`${savRate.toFixed(1)}%`, color:T.sky }, { label:'Net Worth', val:`${cur}${fmtN(nw)}`, color:T.violet }, { label:'Habit Streak', val:`🔥 ${bestStreak}d`, color:T.amber }].map((item,i)=>(
                <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:i<5?`1px solid ${T.border}`:'none', fontSize:11, fontFamily:T.fM }}>
                  <span style={{ color:T.textSub }}>{item.label}</span><span style={{ color:item.color, fontWeight:600 }}>{item.val}</span>
                </div>
              ))}
            </GlassCard>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:14, marginTop:14 }}>
            {(() => {
              const cashAssets = (assets||[]).filter(a=>a.type==='Cash').reduce((s,a)=>s+Number(a.value||0),0);
              const avgMonthExp = monthExp > 0 ? monthExp : (expenses||[]).reduce((s,e)=>s+Number(e.amount||0),0) / Math.max(1, [...new Set((expenses||[]).map(e=>e.date?.slice(0,7)))].length);
              const efMonths = avgMonthExp > 0 ? cashAssets/avgMonthExp : 0;
              const efTarget = 6; const efPct = Math.min(100,(efMonths/efTarget)*100);
              const efColor = efMonths>=6?T.emerald:efMonths>=3?T.amber:T.rose;
              return (
                <GlassCard style={{ padding:'20px 22px', borderLeft:`3px solid ${efColor}44` }}>
                  <SectionLabel>Emergency Fund</SectionLabel>
                  <div style={{ fontSize:22, fontFamily:T.fD, fontWeight:700, color:efColor, marginBottom:4 }}>{efMonths.toFixed(1)} months</div>
                  <div style={{ fontSize:10, fontFamily:T.fM, color:T.textSub, marginBottom:10 }}>Cash {cur}{fmtN(cashAssets)} ÷ avg spend {cur}{fmtN(avgMonthExp)}/mo</div>
                  <ProgressBar pct={efPct} color={efColor} height={6} />
                  <div style={{ fontSize:10, fontFamily:T.fM, color:T.textSub, marginTop:8 }}>
                    {efMonths>=6?'✅ Fully funded (6+ months)':efMonths>=3?`⚠️ Partially funded — need ${cur}${fmtN((efTarget-efMonths)*avgMonthExp)} more`:`🚨 Under-funded — build to ${cur}${fmtN(efTarget*avgMonthExp)}`}
                  </div>
                </GlassCard>
              );
            })()}
            {(expenses||[]).length >= 4 && (() => {
              const freq = {};
              (expenses||[]).forEach(e => { const k = `${e.category}|${Math.round(Number(e.amount)/5)*5}`; if (!freq[k]) freq[k] = { cat:e.category, amount:Math.round(Number(e.amount)/5)*5, count:0 }; freq[k].count++; });
              const recurring = Object.values(freq).filter(x=>x.count>=3).sort((a,b)=>b.count-a.count).slice(0,5);
              if (!recurring.length) return null;
              return (
                <GlassCard style={{ padding:'20px 22px' }}>
                  <SectionLabel>Detected Recurring</SectionLabel>
                  <div style={{ fontSize:10, fontFamily:T.fM, color:T.textSub, marginBottom:10 }}>Expenses appearing 3+ times</div>
                  {recurring.map((r,i)=>(
                    <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:i<recurring.length-1?`1px solid ${T.border}`:'none', fontSize:11, fontFamily:T.fM }}>
                      <span style={{ color:T.text }}>{r.cat}</span>
                      <span style={{ color:T.violet }}>{cur}{fmtN(r.amount)} × {r.count}</span>
                    </div>
                  ))}
                </GlassCard>
              );
            })()}
            <CompoundGrowthCard cur={cur} />
            <ScenarioCard cur={cur} monthInc={monthInc} savRate={savRate} />

            {/* ── Friction Log Insights ─────────────────────────────────── */}
            {(() => {
              const regretExp = (expenses||[]).filter(e => e.regret && e.trigger);
              if (regretExp.length < 2) return null;
              const triggerCounts = {};
              regretExp.forEach(e => { triggerCounts[e.trigger] = (triggerCounts[e.trigger]||0)+1; });
              const sorted = Object.entries(triggerCounts).sort((a,b)=>b[1]-a[1]);
              const topTrigger = sorted[0];
              const totalRegretAmt = regretExp.reduce((s,e)=>s+Number(e.amount||0),0);
              const TRIGGER_LABELS = { boredom:'😴 Boredom', stress:'😰 Stress', social:'👥 Social pressure', impulse:'⚡ Impulse', habit:'🔁 Habit' };
              return (
                <GlassCard style={{ padding:'20px 22px', borderLeft:`3px solid ${T.rose}44` }}>
                  <SectionLabel>🤦 Spending Triggers</SectionLabel>
                  <div style={{ fontSize:10, fontFamily:T.fM, color:T.textSub, marginBottom:12 }}>
                    {regretExp.length} regret purchase{regretExp.length>1?'s':''} · {cur}{fmtN(Math.round(totalRegretAmt))} total · top trigger: <span style={{ color:T.rose, fontWeight:600 }}>{TRIGGER_LABELS[topTrigger[0]]||topTrigger[0]}</span>
                  </div>
                  {sorted.map(([trigger, count]) => (
                    <div key={trigger} style={{ marginBottom:8 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, fontFamily:T.fM, color:T.textSub, marginBottom:3 }}>
                        <span>{TRIGGER_LABELS[trigger]||trigger}</span>
                        <span style={{ color:T.rose }}>{count} time{count>1?'s':''}</span>
                      </div>
                      <ProgressBar pct={(count/regretExp.length)*100} color={T.rose} height={4} />
                    </div>
                  ))}
                  <div style={{ marginTop:10, fontSize:10, fontFamily:T.fM, color:T.textSub, lineHeight:1.6, borderLeft:`2px solid ${T.rose}33`, paddingLeft:10 }}>
                    {topTrigger[0]==='boredom' ? 'Most regret spending happens when bored. Having a list of free alternatives helps.'
                     : topTrigger[0]==='stress' ? 'Stress is your main spending trigger. A 10-minute cooling-off rule before purchases could save significantly.'
                     : topTrigger[0]==='social' ? 'Social pressure drives most of your regret. It\'s okay to opt out — your finances are worth it.'
                     : topTrigger[0]==='impulse' ? 'Impulse buying is your pattern. A 24-hour rule on non-essential purchases would help.'
                     : 'Routine spending on autopilot. Review subscriptions and habitual purchases.'}
                  </div>
                </GlassCard>
              );
            })()}
          </div>
        </>
      )}

      {tab==='spending' && (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <GlassCard style={{ padding:'20px 22px' }}>
            <SectionLabel>Monthly Spend — Last 6 Months</SectionLabel>
            {spendTrends.data.some(m=>m._total>0) ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={spendTrends.data} barSize={28} margin={{top:4,right:0,left:0,bottom:0}}>
                  <CartesianGrid strokeDasharray="2 4" stroke={T.border} vertical={false} />
                  <XAxis dataKey="month" tick={{fill:T.textSub,fontSize:9,fontFamily:T.fM}} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip content={<ChartTooltip prefix={cur} />} />
                  {spendTrends.cats.map((cat,i) => (
                    <Bar key={cat} dataKey={cat} name={cat} stackId="a" fill={CAT_COLORS[i%CAT_COLORS.length]} opacity={0.85} radius={i===spendTrends.cats.length-1?[4,4,0,0]:[0,0,0,0]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height:120, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontFamily:T.fM, color:T.textMuted }}>Log expenses to see spending trends.</div>
            )}
            {spendTrends.cats.length > 0 && (
              <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginTop:10 }}>
                {spendTrends.cats.map((cat,i) => (
                  <div key={cat} style={{ display:'flex', alignItems:'center', gap:5, fontSize:9, fontFamily:T.fM, color:T.textSub }}>
                    <div style={{ width:8, height:8, borderRadius:2, background:CAT_COLORS[i%CAT_COLORS.length] }} />{cat}
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
          <GlassCard style={{ padding:'20px 22px' }}>
            <SectionLabel>Category Breakdown — This Month</SectionLabel>
            {spendTrends.data.length > 0 && (() => {
              const latest = spendTrends.data[spendTrends.data.length-1];
              const total = latest._total || 1;
              return (
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {spendTrends.cats.filter(c=>latest[c]>0).sort((a,b)=>latest[b]-latest[a]).map((cat,i) => {
                    const pct = Math.round((latest[cat]/total)*100);
                    return (
                      <div key={cat}>
                        <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, fontFamily:T.fM, marginBottom:3 }}>
                          <span style={{ color:T.text }}>{cat}</span>
                          <span style={{ color:CAT_COLORS[spendTrends.cats.indexOf(cat)%CAT_COLORS.length] }}>{cur}{fmtN(latest[cat])} · {pct}%</span>
                        </div>
                        <ProgressBar pct={pct} color={CAT_COLORS[spendTrends.cats.indexOf(cat)%CAT_COLORS.length]} height={4} />
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </GlassCard>
          <GlassCard style={{ padding:'20px 22px' }}>
            <SectionLabel>Month-over-Month Total Spend</SectionLabel>
            {spendTrends.data.some(m=>m._total>0) ? (
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={spendTrends.data} margin={{top:4,right:0,left:0,bottom:0}}>
                  <CartesianGrid strokeDasharray="2 4" stroke={T.border} vertical={false} />
                  <XAxis dataKey="month" tick={{fill:T.textSub,fontSize:9,fontFamily:T.fM}} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip content={<ChartTooltip prefix={cur} />} />
                  <Line type="monotone" dataKey="_total" name="Total Spend" stroke={T.rose} strokeWidth={2} dot={{fill:T.rose,r:4}} />
                </LineChart>
              </ResponsiveContainer>
            ) : <div style={{ height:80, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontFamily:T.fM, color:T.textMuted }}>No data yet.</div>}
          </GlassCard>
        </div>
      )}

      {tab==='net worth' && (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(170px,1fr))', gap:12 }}>
            {[
              { label:'Current Net Worth', val:`${cur}${fmtN(nw)}`, color:T.accent },
              { label:'Assets', val:`${cur}${fmtN((assets||[]).reduce((s,a)=>s+Number(a.value||0),0)+invVal)}`, color:T.emerald },
              { label:'Debts', val:`${cur}${fmtN((debts||[]).reduce((s,d)=>s+Number(d.balance||0),0))}`, color:T.rose },
              { label:'Investments', val:`${cur}${fmtN(invVal)}`, color:T.violet },
            ].map((m,i)=>(
              <GlassCard key={i} style={{ padding:'16px 18px' }}>
                <div style={{ fontSize:9, fontFamily:T.fM, color:T.textSub, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:6 }}>{m.label}</div>
                <div style={{ fontSize:18, fontFamily:T.fD, fontWeight:700, color:m.color }}>{m.val}</div>
              </GlassCard>
            ))}
          </div>
          <GlassCard style={{ padding:'20px 22px' }}>
            <SectionLabel>Net Worth History</SectionLabel>
            {netWorthHistory.length > 1 ? (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={nwProjection.length>1?nwProjection:netWorthHistory} margin={{top:4,right:0,left:0,bottom:0}}>
                  <defs>
                    <linearGradient id="nwGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={T.accent} stopOpacity={0.35}/><stop offset="100%" stopColor={T.accent} stopOpacity={0}/></linearGradient>
                    <linearGradient id="projGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={T.violet} stopOpacity={0.2}/><stop offset="100%" stopColor={T.violet} stopOpacity={0}/></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="2 4" stroke={T.border} vertical={false} />
                  <XAxis dataKey="month" tick={{fill:T.textSub,fontSize:9,fontFamily:T.fM}} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip content={<ChartTooltip prefix={cur} />} />
                  <Area type="monotone" dataKey="value" name="Net Worth" stroke={T.accent} strokeWidth={2} fill="url(#nwGrad)" dot={false} />
                  {nwProjection.some(d=>d.projected) && <Area type="monotone" dataKey="projected" name="Projected" stroke={T.violet} strokeWidth={1.5} strokeDasharray="4 3" fill="url(#projGrad)" dot={false} />}
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height:120, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontFamily:T.fM, color:T.textMuted }}>Net worth history builds automatically each month. Log assets and income to start.</div>
            )}
            {nwProjection.some(d=>d.projected) && (
              <div style={{ display:'flex', gap:16, marginTop:8 }}>
                <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:9, fontFamily:T.fM, color:T.textSub }}><div style={{ width:12, height:2, background:T.accent }} />Actual</div>
                <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:9, fontFamily:T.fM, color:T.textSub }}><div style={{ width:12, height:2, background:T.violet, opacity:0.7 }} />6-month projection</div>
              </div>
            )}
          </GlassCard>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:14 }}>
            <GlassCard style={{ padding:'20px 22px' }}>
              <SectionLabel>Asset Breakdown</SectionLabel>
              {(assets||[]).length === 0 ? <div style={{ fontSize:11, fontFamily:T.fM, color:T.textMuted }}>No assets logged yet.</div> : (
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {[...new Set((assets||[]).map(a=>a.type))].map((type,i) => {
                    const val = (assets||[]).filter(a=>a.type===type).reduce((s,a)=>s+Number(a.value||0),0);
                    const pct = Math.round((val/((assets||[]).reduce((s,a)=>s+Number(a.value||0),0)+invVal||1))*100);
                    return (
                      <div key={type}>
                        <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, fontFamily:T.fM, marginBottom:3 }}>
                          <span style={{ color:T.text }}>{type}</span>
                          <span style={{ color:CAT_COLORS[i%CAT_COLORS.length] }}>{cur}{fmtN(val)} · {pct}%</span>
                        </div>
                        <ProgressBar pct={pct} color={CAT_COLORS[i%CAT_COLORS.length]} height={4} />
                      </div>
                    );
                  })}
                </div>
              )}
            </GlassCard>
            <GlassCard style={{ padding:'20px 22px' }}>
              <SectionLabel>Debt Overview</SectionLabel>
              {(debts||[]).length === 0 ? <div style={{ fontSize:11, fontFamily:T.fM, color:T.emerald }}>🎉 Debt free!</div> : (
                (debts||[]).map((d,i) => {
                  const bal = Number(d.balance||0);
                  const maxBal = Math.max(...(debts||[]).map(x=>Number(x.balance||0)));
                  return (
                    <div key={d.id||i} style={{ marginBottom:i<(debts||[]).length-1?12:0 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, fontFamily:T.fM, marginBottom:3 }}>
                        <span style={{ color:T.text }}>{d.name}</span>
                        <span style={{ color:T.rose }}>{cur}{fmtN(bal)} · {d.rate||0}%</span>
                      </div>
                      <ProgressBar pct={maxBal>0?(bal/maxBal)*100:0} color={T.rose} height={4} />
                    </div>
                  );
                })
              )}
            </GlassCard>
          </div>
        </div>
      )}

      {tab==='habits' && (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(170px,1fr))', gap:12 }}>
            {[
              { label:'Active Habits', val:(habits||[]).length, color:T.accent },
              { label:'Done Today', val:`${todayDone}/${(habits||[]).length}`, color:todayDone===(habits||[]).length&&(habits||[]).length>0?T.emerald:T.amber },
              { label:'Best Streak', val:`🔥 ${bestStreak}d`, color:T.amber },
              { label:'Total Logs', val:Object.values(habitLogs).flat().length, color:T.violet },
            ].map((m,i)=>(
              <GlassCard key={i} style={{ padding:'16px 18px' }}>
                <div style={{ fontSize:9, fontFamily:T.fM, color:T.textSub, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:6 }}>{m.label}</div>
                <div style={{ fontSize:20, fontFamily:T.fD, fontWeight:700, color:m.color }}>{m.val}</div>
              </GlassCard>
            ))}
          </div>
          <GlassCard style={{ padding:'20px 22px' }}>
            <SectionLabel>Weekly Consistency — Last 8 Weeks</SectionLabel>
            {habitAnalytics.some(w=>w.pct>0) ? (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={habitAnalytics} barSize={22} margin={{top:4,right:0,left:0,bottom:0}}>
                  <CartesianGrid strokeDasharray="2 4" stroke={T.border} vertical={false} />
                  <XAxis dataKey="week" tick={{fill:T.textSub,fontSize:9,fontFamily:T.fM}} axisLine={false} tickLine={false} />
                  <YAxis domain={[0,100]} hide />
                  <Tooltip formatter={(v)=>`${v}%`} contentStyle={{ background:T.surfaceHi, border:`1px solid ${T.border}`, borderRadius:8, fontSize:11, fontFamily:T.fM }} />
                  <Bar dataKey="pct" name="Consistency %" fill={T.accent} opacity={0.85} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div style={{ height:80, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontFamily:T.fM, color:T.textMuted }}>Log habits to see weekly trends.</div>}
          </GlassCard>
          <GlassCard style={{ padding:'20px 22px' }}>
            <SectionLabel>Per-Habit Performance</SectionLabel>
            {(habits||[]).length === 0 ? <div style={{ fontSize:11, fontFamily:T.fM, color:T.textMuted }}>No habits tracked yet.</div> : (
              (habits||[]).map((h,i) => {
                const streak = getStreak(h.id, habitLogs);
                const total = (habitLogs[h.id]||[]).length;
                const last30 = Array.from({length:30},(_,j)=>{ const d=new Date(); d.setDate(d.getDate()-29+j); return d.toISOString().slice(0,10); }).filter(d=>(habitLogs[h.id]||[]).includes(d)).length;
                const cons30 = Math.round((last30/30)*100);
                const HCOLORS=[T.accent,T.violet,T.sky,T.amber,T.rose,T.emerald];
                const hc = HCOLORS[i%HCOLORS.length];
                return (
                  <div key={h.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom:i<(habits||[]).length-1?`1px solid ${T.border}`:'none' }}>
                    <div style={{ fontSize:18, flexShrink:0 }}>{h.emoji||'🔥'}</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                        <span style={{ fontSize:12, fontFamily:T.fD, fontWeight:600, color:T.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{h.name}</span>
                        <span style={{ fontSize:10, fontFamily:T.fM, color:hc, flexShrink:0, marginLeft:8 }}>🔥{streak}d · {cons30}% last 30d</span>
                      </div>
                      <ProgressBar pct={cons30} color={hc} height={4} />
                      <div style={{ fontSize:9, fontFamily:T.fM, color:T.textSub, marginTop:2 }}>{total} total logs · {last30}/30 this month</div>
                    </div>
                  </div>
                );
              })
            )}
          </GlassCard>
        </div>
      )}

      {tab==='recurring' && (
        <RecurringDetectedCard detectedRecurring={detectedRecurring} cur={cur} actions={{}} />
      )}
    </div>
  );
}

// ── ARCHIVE PAGE ──────────────────────────────────────────────────────────────
function ArchivePage({ data }) {
  const {netWorthHistory=[], expenses=[], incomes=[], habits=[], habitLogs={}, vitals=[], settings={}} = data;
  const cur = settings.currency||'$'; const thisMonth = today().slice(0,7);
  const monthExp = (expenses||[]).filter(e=>e.date?.startsWith(thisMonth)).reduce((s,e)=>s+Number(e.amount||0),0);
  const monthInc = (incomes||[]).filter(i=>i.date?.startsWith(thisMonth)).reduce((s,i)=>s+Number(i.amount||0),0);
  const bestStreak = (habits||[]).reduce((mx,h)=>{const s=getStreak(h.id,habitLogs);return s>mx?s:mx;},0);
  return (
    <div style={{ animation:'fadeUp 0.4s ease' }}>
      <div style={{ marginBottom:22 }}><SectionLabel>Archive</SectionLabel><h1 style={{ fontSize:26, fontFamily:T.fD, fontWeight:800, color:T.text }}>Life History</h1></div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:14 }}>
        <GlassCard style={{ padding:'20px 22px' }}>
          <SectionLabel>Net Worth History</SectionLabel>
          {netWorthHistory.length>1 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={netWorthHistory} margin={{top:4,right:0,left:0,bottom:0}}>
                <defs><linearGradient id="ag" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={T.accent} stopOpacity={0.3}/><stop offset="100%" stopColor={T.accent} stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="2 4" stroke={T.border} vertical={false} />
                <XAxis dataKey="month" tick={{fill:T.textSub,fontSize:9,fontFamily:T.fM}} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip content={<ChartTooltip prefix={cur} />} />
                <Area type="monotone" dataKey="value" name="Net Worth" stroke={T.accent} strokeWidth={2} fill="url(#ag)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : <div style={{ height:100, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontFamily:T.fM, color:T.textMuted }}>Net worth history builds automatically each month.</div>}
        </GlassCard>
        <GlassCard style={{ padding:'20px 22px' }}>
          <SectionLabel>This Month — {thisMonth}</SectionLabel>
          {[{ label:'Income logged', val:`${cur}${fmtN(monthInc)}`, color:T.emerald }, { label:'Expenses logged', val:`${cur}${fmtN(monthExp)}`, color:T.rose }, { label:'Net saved', val:`${cur}${fmtN(monthInc-monthExp)}`, color:T.accent }, { label:'Vitals logged', val:`${(vitals||[]).filter(v=>v.date?.startsWith(thisMonth)).length} days`, color:T.sky }, { label:'Habits tracked', val:`${(habits||[]).length} habits`, color:T.violet }, { label:'Best streak', val:`🔥 ${bestStreak} days`, color:T.amber }].map((item,i)=>(
            <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'9px 0', borderBottom:i<5?`1px solid ${T.border}`:'none', fontSize:11, fontFamily:T.fM }}>
              <span style={{ color:T.textSub }}>{item.label}</span><span style={{ color:item.color, fontWeight:600 }}>{item.val}</span>
            </div>
          ))}
        </GlassCard>
        {(expenses||[]).length>0 && (
          <GlassCard style={{ padding:'20px 22px', gridColumn:'span 2' }}>
            <SectionLabel>All-Time Summary</SectionLabel>
            <div style={{ display:'flex', gap:20, flexWrap:'wrap' }}>
              {[{ label:'TOTAL EXPENSES', val:`${cur}${fmtN((expenses||[]).reduce((s,e)=>s+Number(e.amount||0),0))}`, color:T.rose }, { label:'TOTAL INCOME', val:`${cur}${fmtN((incomes||[]).reduce((s,i)=>s+Number(i.amount||0),0))}`, color:T.emerald }, { label:'HABIT LOGS', val:Object.values(habitLogs).flat().length, color:T.accent }, { label:'VITALS DAYS', val:(vitals||[]).length, color:T.sky }, { label:'BEST STREAK', val:`🔥 ${bestStreak}d`, color:T.amber }].map((item,i)=>(
                <div key={i}><div style={{ fontSize:9, fontFamily:T.fM, color:T.textSub, marginBottom:4 }}>{item.label}</div><div style={{ fontSize:20, fontFamily:T.fD, fontWeight:700, color:item.color }}>{item.val}</div></div>
              ))}
            </div>
          </GlassCard>
        )}
      </div>
    </div>
  );
}

// ── CUSTOM CATEGORY INPUT ─────────────────────────────────────────────────────
function CustomCatInput({ onAdd }) {
  const [val, setVal] = useState('');
  return (
    <>
      <Input
        value={val}
        onChange={e => setVal(e.target.value)}
        placeholder="New category (e.g. 🚬 Tabac)…"
        onKeyDown={e => { if (e.key === 'Enter' && val.trim()) { onAdd(val.trim()); setVal(''); } }}
        style={{ flex: 1 }}
      />
      <Btn onClick={() => { if (val.trim()) { onAdd(val.trim()); setVal(''); } }} color={T.accent}>Add</Btn>
    </>
  );
}

// ── SETTINGS PAGE ─────────────────────────────────────────────────────────────
function SettingsPage({ data, actions }) {
  const {settings={}} = data;
  const [name, setName] = useState(settings.name||'');
  const [currency, setCurrency] = useState(settings.currency||'$');
  const [incomeTarget, setIncomeTarget] = useState(settings.incomeTarget||'');
  const [savingsTarget, setSavingsTarget] = useState(settings.savingsTarget||'');
  const [theme, setTheme] = useState(settings.theme||'dark');
  const [language, setLanguage] = useState(settings.language||'en');
  const [pin, setPin] = useState(settings.pin||'');
  const [aiProvider, setAiProvider] = useState(settings.aiProvider||'claude');
  const [aiApiKey, setAiApiKey] = useState(settings.aiApiKey||'');
  const [keyTestStatus, setKeyTestStatus] = useState(null); // null | 'testing' | 'ok' | 'empty' | 'error:...'
  // UX fix: weightUnit persisted in settings so Health charts use the correct label
  const [weightUnit, setWeightUnit] = useState(settings.weightUnit||'lbs');

  const save = () => {
    actions.updateSettings({ ...settings, name, currency, incomeTarget:Number(incomeTarget), savingsTarget:Number(savingsTarget), theme, language, aiProvider, aiApiKey, pin:pin.length===4?pin:'', weightUnit });
    // Apply theme immediately so inline styles re-read T before next paint
    Object.assign(T, THEMES[theme] || THEMES.dark);
    // Note: currentLang global removed (Bug 5 fix) — language flows via LangContext
  };
  const exportCSV = () => {
    const headers = ['Date','Amount','Category','Note'];
    const rows = [...(data.expenses||[])].sort((a,b)=>a.date<b.date?1:-1).map(e=>[e.date, e.amount, e.category, (e.note||'').replace(/,/g,' ')]);
    const csvContent = [headers, ...rows].map(r=>r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type:'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download=`lifeos-expenses-${today()}.csv`; a.click(); URL.revokeObjectURL(url);
  };
  // Architecture fix: all 18 localStorage keys are now exported — previously
  // los_bills, los_career, los_qnotes, and los_eventlog were silently omitted.
  const exportData = () => {
    const d = {
      los_habits:       data.habits,
      los_habitlogs:    data.habitLogs,
      los_expenses:     data.expenses,
      los_incomes:      data.incomes,
      los_debts:        data.debts,
      los_goals:        data.goals,
      los_assets:       data.assets,
      los_investments:  data.investments,
      los_vitals:       data.vitals,
      los_notes:        data.notes,
      los_xp:           data.totalXP,
      los_nwhistory:    data.netWorthHistory,
      los_settings:     settings,
      los_focus:        data.focusSessions,
      los_subs:         data.subscriptions,
      los_budgets:      data.budgets,
      los_bills:        data.bills,
      los_career:       data.career,
      los_qnotes:       data.quickNotes,
      los_chronicles:   data.chronicles,
      los_challenges:   data.challenges,
      los_eventlog:     data.eventLog,
    };
    const blob=new Blob([JSON.stringify(d,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a'); a.href=url; a.download=`lifeos_backup_${today()}.json`; a.click();
    URL.revokeObjectURL(url);
  };
  const importData = (e) => {
    const file = e.target.files[0]; if (!file) return;
    // Architecture fix: added confirmation dialog — previously reloaded blindly
    const confirmed = window.confirm(
      `Import "${file.name}"?\n\nThis will overwrite ALL current data and reload the app. This cannot be undone.\n\nMake sure you have a backup of your current data first.`
    );
    if (!confirmed) { e.target.value = ''; return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const d = JSON.parse(ev.target.result);
        // Only write known los_ keys to avoid polluting localStorage
        const KNOWN_KEYS = ['los_habits','los_habitlogs','los_expenses','los_incomes','los_debts','los_goals','los_assets','los_investments','los_vitals','los_notes','los_xp','los_nwhistory','los_settings','los_focus','los_subs','los_budgets','los_bills','los_career','los_qnotes','los_chronicles','los_challenges','los_eventlog','los_decisions'];
        Object.entries(d).forEach(([key, val]) => {
          if (KNOWN_KEYS.includes(key)) {
            try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
          }
        });
        window.location.reload();
      } catch { alert('Import failed — the file is not a valid LifeOS backup.'); }
    };
    reader.readAsText(file);
  };
  // Architecture fix: show localStorage usage so users know before they hit the ~5MB wall
  const lsUsageKB = (() => {
    try {
      let total = 0;
      for (const key of Object.keys(localStorage)) {
        if (key.startsWith('los_')) total += (localStorage.getItem(key)||'').length;
      }
      return Math.round(total / 1024);
    } catch { return 0; }
  })();
  return (
    <div style={{ animation:'fadeUp 0.4s ease' }}>
      <div style={{ marginBottom:22 }}><SectionLabel>System</SectionLabel><h1 style={{ fontSize:26, fontFamily:T.fD, fontWeight:800, color:T.text }}>Settings</h1></div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:14 }}>
        <GlassCard style={{ padding:'24px' }}>
          <SectionLabel>Profile</SectionLabel>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <Input value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" />
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              <Select value={currency} onChange={e=>setCurrency(e.target.value)}>{['$','€','£','¥','₹','₩','Fr','A$','C$'].map(c=><option key={c}>{c}</option>)}</Select>
              {/* UX fix: weight unit selector — previously stored raw numbers with no unit context */}
              <div style={{ display:'flex', gap:4 }}>
                {['lbs','kg'].map(u=>(
                  <button key={u} onClick={()=>setWeightUnit(u)} style={{ flex:1, padding:'9px', borderRadius:T.r, background:weightUnit===u?T.skyDim:T.surface, border:`1px solid ${weightUnit===u?T.sky+'55':T.border}`, fontSize:11, fontFamily:T.fM, color:weightUnit===u?T.sky:T.textSub, transition:'all 0.15s' }}>{u}</button>
                ))}
              </div>
            </div>
            <Input type="number" value={incomeTarget} onChange={e=>setIncomeTarget(e.target.value)} placeholder="Monthly income target" />
            <Input type="number" value={savingsTarget} onChange={e=>setSavingsTarget(e.target.value)} placeholder="Savings rate target (%)" />
            <div style={{ marginTop:16, paddingTop:16, borderTop:`1px solid ${T.border}` }}>
              <div style={{ fontSize:10, fontFamily:T.fM, color:T.textSub, marginBottom:6 }}>🔒 PIN Lock (4 digits, blank = disabled)</div>
              <input type="password" value={pin} onChange={e=>setPin(e.target.value.replace(/\D/g,'').slice(0,4))} placeholder="4-digit PIN…" maxLength={4} inputMode="numeric" style={{ width:'100%', padding:'9px 12px', background:'rgba(255,255,255,0.04)', border:`1px solid ${T.border}`, borderRadius:T.r, fontFamily:T.fM, fontSize:20, color:T.text, letterSpacing:'0.4em', textAlign:'center' }} />
              {pin.length>0&&pin.length<4&&<div style={{ fontSize:9, fontFamily:T.fM, color:T.amber, marginTop:4 }}>Must be exactly 4 digits</div>}
            </div>
            <Btn full onClick={save} color={T.accent}>Save Settings</Btn>

          <div style={{ marginTop:24, paddingTop:24, borderTop:`1px solid ${T.border}` }}>
            <SectionLabel>Custom Expense Categories</SectionLabel>
            <div style={{ fontSize:10, fontFamily:T.fM, color:T.textSub, marginBottom:10 }}>Add or remove spending categories. Changes apply globally.</div>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:10 }}>
              {(settings.customCats||[...CATS]).map((cat,i)=>(
                <div key={i} style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 10px', borderRadius:99, background:T.surface, border:`1px solid ${T.border}`, fontSize:10, fontFamily:T.fM, color:T.text }}>
                  <span>{cat}</span>
                  <button onClick={()=>{ const cats=(settings.customCats||[...CATS]).filter((_,j)=>j!==i); actions.updateSettings({...settings, customCats:cats}); }} style={{ color:T.rose, marginLeft:2, fontSize:12, lineHeight:1 }}>×</button>
                </div>
              ))}
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <CustomCatInput onAdd={cat=>{ const cats=[...(settings.customCats||CATS), cat]; actions.updateSettings({...settings, customCats:cats}); }} />
            </div>
          </div>

          <div style={{ marginTop:24, paddingTop:24, borderTop:`1px solid ${T.border}` }}>
            <SectionLabel>Data Health Check</SectionLabel>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {[
                { label:'Income logged this month', ok:data.incomes?.some(i=>i.date?.startsWith(today().slice(0,7))), tip:'Log at least one income source this month' },
                { label:'Expenses tracked', ok:(data.expenses?.length||0)>=3, tip:'Track 3+ expenses for meaningful budgets' },
                { label:'At least one habit active', ok:(data.habits?.length||0)>=1, tip:'Create habits to build streaks' },
                { label:'Vitals logged in last 7 days', ok:data.vitals?.some(v=>{ const d=new Date(v.date); const now=new Date(); return (now-d)/86400000<=7; }), tip:'Track sleep, mood, energy weekly' },
                { label:'Net worth components set', ok:(data.assets?.length||0)+(data.investments?.length||0)>=1, tip:'Add assets or investments for net worth tracking' },
                { label:'Name configured', ok:Boolean(settings.name), tip:'Set your name in profile settings' },
                { label:'AI API key configured', ok:Boolean(settings.aiApiKey), tip:'Add an API key to enable AI features' },
              ].map(({label,ok,tip},i)=>(
                <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:T.r, background:T.surface, border:`1px solid ${ok?T.emerald+'33':T.border}` }}>
                  <span style={{ fontSize:14, flexShrink:0 }}>{ok?'✅':'⚠️'}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:11, fontFamily:T.fM, color:T.text }}>{label}</div>
                    {!ok && <div style={{ fontSize:9, fontFamily:T.fM, color:T.textSub, marginTop:2 }}>{tip}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
          </div>
        </GlassCard>

        {/* S5: Theme selector */}
        <GlassCard style={{ padding:'24px' }}>
          <SectionLabel>🎨 Appearance — S5</SectionLabel>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <div style={{ fontSize:10, fontFamily:T.fM, color:T.textSub, marginBottom:2 }}>Theme</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              {[
                { id:'dark',      label:'🌑 Dark',       preview:'#040408' },
                { id:'light',     label:'☀️ Light',      preview:'#f4f6fb' },
                { id:'amoled',    label:'⬛ AMOLED',     preview:'#000000' },
                { id:'solarized', label:'🌊 Solarized',  preview:'#002b36' },
              ].map(th => (
                <button key={th.id} onClick={()=>{ setTheme(th.id); Object.assign(T, THEMES[th.id]); actions.updateSettings({...settings, theme:th.id}); }} style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 12px', borderRadius:8, background:theme===th.id?T.accentDim:T.surface, border:`1px solid ${theme===th.id?T.accent+'55':T.border}`, cursor:'pointer', fontSize:11, fontFamily:T.fM, color:theme===th.id?T.accent:T.text, transition:'all 0.18s' }}>
                  <div style={{ width:14, height:14, borderRadius:3, background:th.preview, border:`1px solid ${T.border}`, flexShrink:0 }} />
                  {th.label}
                </button>
              ))}
            </div>

            {/* S5: Language */}
            <div style={{ fontSize:10, fontFamily:T.fM, color:T.textSub, marginTop:8, marginBottom:2 }}>Language</div>
            <div style={{ display:'flex', gap:8 }}>
              {[{id:'en',label:'🇬🇧 English'},{id:'fr',label:'🇫🇷 Français'}].map(lang=>(
                <button key={lang.id} onClick={()=>{ setLanguage(lang.id); actions.updateSettings({...settings, language:lang.id, name, currency, incomeTarget:Number(incomeTarget), savingsTarget:Number(savingsTarget), theme, aiProvider, aiApiKey, pin:pin.length===4?pin:''}); }} style={{ flex:1, padding:'8px', borderRadius:8, background:language===lang.id?T.accentDim:T.surface, border:`1px solid ${language===lang.id?T.accent+'55':T.border}`, cursor:'pointer', fontSize:11, fontFamily:T.fM, color:language===lang.id?T.accent:T.text }}>
                  {lang.label}
                </button>
              ))}
            </div>
          </div>
        </GlassCard>

        {/* S5: AI Provider */}
        <GlassCard style={{ padding:'24px' }}>
          <SectionLabel>🤖 AI Provider — S5</SectionLabel>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <div style={{ fontSize:10, fontFamily:T.fM, color:T.textSub }}>Select your AI backend for the AI Coach feature</div>
            {[
              { id:'claude',  label:'Claude (Anthropic)',  icon:'⚡', desc:'Recommended — fastest, most accurate' },
              { id:'ollama',  label:'Ollama (Local)',       icon:'🖥', desc:'Run locally with llama3, mistral, etc.' },
              { id:'openai',  label:'GPT-4o (OpenAI)',     icon:'🟢', desc:'Requires an OpenAI API key' },
            ].map(prov=>(
              <div key={prov.id} onClick={()=>setAiProvider(prov.id)} style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'12px', borderRadius:8, background:aiProvider===prov.id?T.accentDim:T.surface, border:`1px solid ${aiProvider===prov.id?T.accent+'55':T.border}`, cursor:'pointer', transition:'all 0.18s' }}>
                <span style={{ fontSize:16, flexShrink:0 }}>{prov.icon}</span>
                <div>
                  <div style={{ fontSize:11, fontFamily:T.fD, fontWeight:700, color:aiProvider===prov.id?T.accent:T.text }}>{prov.label}</div>
                  <div style={{ fontSize:9, fontFamily:T.fM, color:T.textSub, marginTop:2 }}>{prov.desc}</div>
                </div>
                {aiProvider===prov.id && <div style={{ marginLeft:'auto', fontSize:11, color:T.accent }}>✓</div>}
              </div>
            ))}
            {aiProvider !== 'ollama' && (
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {/* Key input row */}
                <div style={{ display:'flex', gap:8 }}>
                  <div style={{ flex:1 }}>
                    <Input value={aiApiKey} onChange={e=>{ setAiApiKey(e.target.value); setKeyTestStatus(null); }} placeholder={`${aiProvider==='openai'?'sk-...':'sk-ant-...'} API key`} type="password" />
                  </div>
                  {/* Test connection button */}
                  <button
                    disabled={!aiApiKey.trim() || keyTestStatus==='testing'}
                    onClick={async () => {
                      setKeyTestStatus('testing');
                      try {
                        const text = await callAI(
                          { aiProvider, aiApiKey },
                          { max_tokens: 10, messages: [{ role:'user', content:'Reply with the single word OK.' }] }
                        );
                        setKeyTestStatus(text && text.length > 0 ? 'ok' : 'empty');
                      } catch(e) {
                        setKeyTestStatus('error:' + (e?.message||'Unknown error'));
                      }
                    }}
                    style={{ flexShrink:0, padding:'0 14px', borderRadius:T.r, background: keyTestStatus==='ok' ? T.emeraldDim : keyTestStatus==='testing' ? T.surface : T.accentDim, border:`1px solid ${ keyTestStatus==='ok' ? T.emerald+'55' : keyTestStatus==='testing' ? T.border : T.accent+'44'}`, fontSize:10, fontFamily:T.fM, fontWeight:600, color: keyTestStatus==='ok' ? T.emerald : keyTestStatus==='testing' ? T.textSub : T.accent, cursor: (!aiApiKey.trim()||keyTestStatus==='testing') ? 'not-allowed' : 'pointer', opacity: !aiApiKey.trim() ? 0.5 : 1, transition:'all 0.2s', whiteSpace:'nowrap' }}>
                    {keyTestStatus==='testing' ? '⏳ Testing…' : keyTestStatus==='ok' ? '✓ Connected' : '⚡ Test key'}
                  </button>
                </div>
                {/* Test result feedback */}
                {keyTestStatus && keyTestStatus !== 'testing' && keyTestStatus !== 'ok' && (
                  <div style={{ fontSize:10, fontFamily:T.fM, color:T.rose, padding:'8px 12px', borderRadius:T.r, background:T.roseDim, border:`1px solid ${T.rose}33`, lineHeight:1.5, wordBreak:'break-word' }}>
                    ❌ {keyTestStatus === 'empty'
                      ? 'API returned an empty response. The key may work but the model returned nothing.'
                      : keyTestStatus.startsWith('error:')
                        ? keyTestStatus.slice(6)
                        : keyTestStatus}
                  </div>
                )}
                {keyTestStatus === 'ok' && (
                  <div style={{ fontSize:10, fontFamily:T.fM, color:T.emerald, padding:'8px 12px', borderRadius:T.r, background:T.emeraldDim, border:`1px solid ${T.emerald}33`, lineHeight:1.5 }}>
                    ✅ Connection successful — your {aiProvider==='openai'?'OpenAI':'Anthropic'} key is valid and the model responded. Hit Save to apply.
                  </div>
                )}
                {/* Security notice */}
                <div style={{ fontSize:9, fontFamily:T.fM, color:T.amber, padding:'7px 10px', borderRadius:T.r, background:T.amberDim, border:`1px solid ${T.amber}33`, lineHeight:1.5 }}>
                  🔑 Key stored in browser localStorage — visible to extensions and scripts on this page. Use a dedicated low-budget key, not your main account key.
                </div>
              </div>
            )}
            {aiProvider === 'ollama' && (
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                <div style={{ fontSize:9, fontFamily:T.fM, color:T.textSub, padding:'8px 10px', borderRadius:T.r, background:T.surface, border:`1px solid ${T.border}` }}>
                  Make sure Ollama is running at <code style={{ color:T.accent }}>localhost:11434</code>. Note: Ollama only works when running LifeOS locally — not in Codespaces.
                </div>
                <Input
                  value={settings.ollamaModel||'llama3.2'}
                  onChange={e=>actions.updateSettings({...settings, ollamaModel:e.target.value})}
                  placeholder="Model name e.g. llama3.2, mistral, phi3, llama3.2:1b"
                />
                <div style={{ fontSize:9, fontFamily:T.fM, color:T.textMuted }}>Run <code style={{ color:T.accent }}>ollama list</code> in your terminal to see available models</div>
              </div>
            )}
            <Btn full onClick={save} color={T.violet}>Save AI Settings</Btn>
          </div>
        </GlassCard>

        <GlassCard style={{ padding:'24px' }}>
          <SectionLabel>Data Management</SectionLabel>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {[{ label:'Expenses logged', val:data.expenses.length, color:T.rose }, { label:'Habits tracked', val:data.habits.length, color:T.accent }, { label:'Goals set', val:data.goals.length, color:T.amber }, { label:'Debts tracked', val:data.debts.length, color:T.rose }, { label:'Investments', val:data.investments.length, color:T.violet }].map((item,i)=>(
              <div key={i} style={{ padding:'10px 14px', borderRadius:T.r, background:T.surface, border:`1px solid ${T.border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div style={{ fontSize:12, fontFamily:T.fM, color:T.text }}>{item.label}</div>
                <div style={{ fontSize:16, fontFamily:T.fD, fontWeight:700, color:item.color }}>{item.val}</div>
              </div>
            ))}
            {/* Architecture fix: localStorage quota indicator — browser limit is ~5MB per origin */}
            <div style={{ padding:'10px 14px', borderRadius:T.r, background:T.surface, border:`1px solid ${lsUsageKB>3500?T.rose+'55':lsUsageKB>2000?T.amber+'55':T.border}` }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                <div style={{ fontSize:10, fontFamily:T.fM, color:T.textSub }}>Storage used (LifeOS data)</div>
                <div style={{ fontSize:11, fontFamily:T.fM, color:lsUsageKB>3500?T.rose:lsUsageKB>2000?T.amber:T.emerald, fontWeight:600 }}>{lsUsageKB} KB / ~5 MB</div>
              </div>
              <div style={{ width:'100%', height:4, borderRadius:99, background:'rgba(255,255,255,0.06)', overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${Math.min((lsUsageKB/5120)*100,100)}%`, borderRadius:99, background:lsUsageKB>3500?T.rose:lsUsageKB>2000?T.amber:T.emerald, transition:'width 0.5s ease' }} />
              </div>
              {lsUsageKB > 3500 && <div style={{ fontSize:9, fontFamily:T.fM, color:T.rose, marginTop:5 }}>⚠ Approaching browser storage limit — export a backup now.</div>}
            </div>
            <Btn full onClick={exportData} color={T.sky}>📦 Export All Data (JSON)</Btn>
            <Btn full onClick={()=>{ const d = { los_habits:data.habits, los_expenses:data.expenses, los_incomes:data.incomes, los_debts:data.debts, los_goals:data.goals, los_investments:data.investments, los_vitals:data.vitals, los_notes:data.notes }; navigator.clipboard.writeText(JSON.stringify(d,null,2)).then(()=>alert('Data copied to clipboard!')).catch(()=>alert('Clipboard copy failed — try Export JSON instead')); }} color={T.textSub}>📋 Copy Data to Clipboard</Btn>
            <Btn full onClick={exportCSV} color={T.emerald}>📊 Export Expenses CSV</Btn>
            <label style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'10px 20px', borderRadius:T.r, background:T.violetDim, color:T.violet, border:`1px solid ${T.violet}44`, fontSize:12, fontFamily:T.fM, fontWeight:600, cursor:'pointer' }}>
              📥 Import Backup (JSON)
              <input type="file" accept=".json" onChange={importData} style={{ display:'none' }} />
            </label>
            <div style={{ marginTop:8, paddingTop:12, borderTop:`1px solid ${T.border}` }}>
              <Btn full onClick={()=>{ actions.updateSettings({...settings, onboarded:false, name:''}); window.location.reload(); }} color={T.amber}>🧭 Restart Onboarding Wizard</Btn>
            </div>
          </div>
        </GlassCard>

        <GlassCard style={{ padding:'24px' }}>
          <SectionLabel>🔔 Smart Reminders</SectionLabel>
          <div style={{ fontSize:10, fontFamily:T.fM, color:T.textSub, marginBottom:12 }}>Configure daily nudges (uses browser Notification API when available).</div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {[
              { key:'remindExpense',  label:'💳 Daily expense log reminder',    def:true  },
              { key:'remindHabit',    label:'🔥 Habit check-in reminder',       def:true  },
              { key:'remindVitals',   label:'❤️ Vitals log reminder',           def:false },
              { key:'remindWeekly',   label:'📅 Weekly review reminder (Mon)',  def:false },
              { key:'remindBudget',   label:'💸 Budget alert when over 80%',    def:true  },
            ].map(({key,label,def})=>{
              const enabled = settings[key]!==undefined ? settings[key] : def;
              return (
                <label key={key} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:T.r, background:T.surface, border:`1px solid ${T.border}`, cursor:'pointer' }}>
                  <input type='checkbox' checked={enabled} onChange={e=>actions.updateSettings({...settings, [key]:e.target.checked})} style={{ accentColor:T.accent, width:14, height:14 }} />
                  <span style={{ fontSize:11, fontFamily:T.fM, color:T.text, flex:1 }}>{label}</span>
                  <span style={{ fontSize:9, fontFamily:T.fM, color:enabled?T.accent:T.textMuted }}>{enabled?'On':'Off'}</span>
                </label>
              );
            })}
            <div style={{ fontSize:9, fontFamily:T.fM, color:T.textMuted, marginTop:4, lineHeight:1.5 }}>Browser notifications require permission. LifeOS checks these flags to surface smart alerts in the top bar and dashboard widget.</div>
            {typeof Notification !== 'undefined' && Notification.permission !== 'granted' && (
              <button
                onClick={() => Notification.requestPermission()}
                style={{ marginTop:8, padding:'8px 16px', borderRadius:T.r, background:T.accentDim, border:`1px solid ${T.accent}44`, fontSize:10, fontFamily:T.fM, color:T.accent, cursor:'pointer', width:'100%', fontWeight:600 }}>
                🔔 Enable Browser Notifications
              </button>
            )}
            {typeof Notification !== 'undefined' && Notification.permission === 'granted' && (
              <div style={{ marginTop:8, padding:'7px 12px', borderRadius:T.r, background:T.emeraldDim, border:`1px solid ${T.emerald}33`, fontSize:9, fontFamily:T.fM, color:T.emerald }}>
                ✅ Browser notifications enabled — LifeOS will remind you at the right time.
              </div>
            )}
          </div>
        </GlassCard>

        <GlassCard style={{ padding:'24px', gridColumn:'span 2' }}>
          <SectionLabel>System Status</SectionLabel>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))', gap:10 }}>
            {['Finance Engine','Health Sync','AI Coach','Timeline','Intelligence'].map((sys,i)=>(
              <div key={i} style={{ padding:'12px', borderRadius:T.r, background:T.surface, border:`1px solid ${T.border}` }}>
                <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:4 }}><div style={{ width:5, height:5, borderRadius:'50%', background:T.emerald, animation:'dotPulse 2s infinite' }} /><span style={{ fontSize:9, fontFamily:T.fM, color:T.emerald }}>Online</span></div>
                <div style={{ fontSize:10, fontFamily:T.fM, color:T.text }}>{sys}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop:14, padding:'14px', borderRadius:T.r, background:`${T.accent}08`, border:`1px solid ${T.accent}22` }}>
            <div style={{ fontSize:11, fontFamily:T.fM, color:T.accent, fontWeight:600, marginBottom:4 }}>✓ Enhanced LifeOS v61 — S4 + S5 + S6 + S7 Upgrades Active</div>
            <div style={{ fontSize:11, fontFamily:T.fM, color:T.textSub, lineHeight:1.5 }}>S4: Career Hub (Kanban + REX), Calendar view, What-If Simulator, Live Crypto Prices, Global Undo. S5: 4 Themes, AI Provider selection, i18n (EN/FR). S6: Smart Alerts Widget, AI Coach, AI Advisor, Meal Planner, Sleep Coach, Note Analysis, Social Challenges, Bond Tracker, Thesis Notes, Regret Tags, Recurring Detection, Subcategories, Category Filter, Clipboard, Smart Reminders, Auto-Log. S7: Split Expenses, Custom Health Metrics, Gmail MCP, Google Calendar MCP, Badge Fix (no more spam).</div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ── S4: CAREER PAGE ──────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
const JOB_STAGES = ['Applied','Interview','Offer','Rejected'];
const STAGE_COLORS = { Applied:T.sky, Interview:T.amber, Offer:T.emerald, Rejected:T.textMuted };

function CareerPage({ data, actions }) {
  const { career = {} } = data;
  const jobs = career.jobs || [];
  const skills = career.skills || [];
  const rex = career.rex || [];
  const cv = career.cv || {};

  const [tab, setTab] = useState('kanban');
  const [modal, setModal] = useState(null);

  // --- Job modal state ---
  const [jTitle, setJTitle]     = useState('');
  const [jCompany, setJCompany] = useState('');
  const [jStage, setJStage]     = useState('Applied');
  const [jDate, setJDate]       = useState(today());
  const [jLink, setJLink]       = useState('');
  const [jNotes, setJNotes]     = useState('');
  const [editJobId, setEditJobId] = useState(null);

  // --- Skill state ---
  const [skillInput, setSkillInput] = useState('');
  const [skillLevel, setSkillLevel] = useState('Intermediate');

  // --- REX state ---
  const [rexTitle, setRexTitle] = useState('');
  const [rexBody, setRexBody]   = useState('');
  const [rexTag, setRexTag]     = useState('Win');

  // --- CV state ---
  const [cvRole,    setCvRole]    = useState(cv.role||'');
  const [cvBio,     setCvBio]     = useState(cv.bio||'');
  const [cvEmail,   setCvEmail]   = useState(cv.email||'');
  const [cvLinked,  setCvLinked]  = useState(cv.linkedin||'');

  const saveJob = () => {
    if (!jTitle.trim() || !jCompany.trim()) return;
    const entry = { id: editJobId||Date.now(), title:jTitle.trim(), company:jCompany.trim(), stage:jStage, date:jDate, link:jLink.trim(), notes:jNotes.trim() };
    actions.updateCareer(c => ({ ...c, jobs: editJobId ? (c.jobs||[]).map(j=>j.id===editJobId?entry:j) : [...(c.jobs||[]), entry] }));
    setJTitle(''); setJCompany(''); setJLink(''); setJNotes(''); setEditJobId(null); setModal(null);
  };

  const openEditJob = (j) => { setJTitle(j.title); setJCompany(j.company); setJStage(j.stage); setJDate(j.date); setJLink(j.link||''); setJNotes(j.notes||''); setEditJobId(j.id); setModal('job'); };

  const moveJob = (id, stage) => actions.updateCareer(c => ({ ...c, jobs: (c.jobs||[]).map(j=>j.id===id?{...j,stage}:j) }));
  const removeJob = (id) => actions.updateCareer(c => ({ ...c, jobs: (c.jobs||[]).filter(j=>j.id!==id) }));

  const addSkill = () => {
    if (!skillInput.trim()) return;
    actions.updateCareer(c => ({ ...c, skills: [...(c.skills||[]), { id:Date.now(), name:skillInput.trim(), level:skillLevel }] }));
    setSkillInput('');
  };
  const removeSkill = (id) => actions.updateCareer(c => ({ ...c, skills: (c.skills||[]).filter(s=>s.id!==id) }));

  const addRex = () => {
    if (!rexTitle.trim()) return;
    actions.updateCareer(c => ({ ...c, rex: [{ id:Date.now(), title:rexTitle.trim(), body:rexBody.trim(), tag:rexTag, date:today() }, ...(c.rex||[])] }));
    setRexTitle(''); setRexBody(''); setModal(null);
  };
  const removeRex = (id) => actions.updateCareer(c => ({ ...c, rex: (c.rex||[]).filter(r=>r.id!==id) }));

  const saveCV = () => actions.updateCareer(c => ({ ...c, cv: { ...c.cv, role:cvRole, bio:cvBio, email:cvEmail, linkedin:cvLinked } }));

  const SKILL_LEVELS = ['Beginner','Intermediate','Advanced','Expert'];
  const SKILL_COLORS = { Beginner:T.textSub, Intermediate:T.sky, Advanced:T.violet, Expert:T.accent };
  const REX_TAGS = ['Win','Challenge','Lesson','Idea','Collaboration'];
  const REX_TAG_COLORS = { Win:T.emerald, Challenge:T.rose, Lesson:T.amber, Idea:T.violet, Collaboration:T.sky };

  const statCards = [
    { label:'Active Jobs',    val: jobs.filter(j=>j.stage!=='Rejected').length, color:T.accent },
    { label:'Interviews',     val: jobs.filter(j=>j.stage==='Interview').length, color:T.amber },
    { label:'Offers',         val: jobs.filter(j=>j.stage==='Offer').length,     color:T.emerald },
    { label:'Skills',         val: skills.length,                                color:T.violet },
  ];

  return (
    <div style={{ animation:'fadeUp 0.4s ease' }}>
      {/* Modal: Add/Edit Job */}
      <Modal open={modal==='job'} onClose={()=>{setModal(null);setEditJobId(null);}} title={editJobId?'✏️ Edit Application':'💼 New Application'}>
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <Input value={jTitle}   onChange={e=>setJTitle(e.target.value)}   placeholder="Job title" />
          <Input value={jCompany} onChange={e=>setJCompany(e.target.value)} placeholder="Company" />
          <Select value={jStage}  onChange={e=>setJStage(e.target.value)}>{JOB_STAGES.map(s=><option key={s}>{s}</option>)}</Select>
          <Input type="date" value={jDate} onChange={e=>setJDate(e.target.value)} />
          <Input value={jLink}  onChange={e=>setJLink(e.target.value)}  placeholder="Job URL (optional)" />
          <textarea value={jNotes} onChange={e=>setJNotes(e.target.value)} placeholder="Notes..." rows={3} style={{ width:'100%', padding:'9px 12px', background:'rgba(255,255,255,0.04)', border:`1px solid ${T.border}`, borderRadius:T.r, fontFamily:T.fM, fontSize:12, color:T.text, resize:'vertical' }} />
          <Btn full onClick={saveJob} color={T.accent}>{editJobId?'Update':'Add Application'}</Btn>
        </div>
      </Modal>
      {/* Modal: REX Journal */}
      <Modal open={modal==='rex'} onClose={()=>setModal(null)} title="📖 REX Journal Entry">
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <Input value={rexTitle} onChange={e=>setRexTitle(e.target.value)} placeholder="Title (e.g. Nailed system design round)" />
          <Select value={rexTag} onChange={e=>setRexTag(e.target.value)}>{REX_TAGS.map(t=><option key={t}>{t}</option>)}</Select>
          <textarea value={rexBody} onChange={e=>setRexBody(e.target.value)} placeholder="What happened? What did you learn?" rows={5} style={{ width:'100%', padding:'9px 12px', background:'rgba(255,255,255,0.04)', border:`1px solid ${T.border}`, borderRadius:T.r, fontFamily:T.fM, fontSize:12, color:T.text, resize:'vertical' }} />
          <Btn full onClick={addRex} color={T.amber}>Save Entry</Btn>
        </div>
      </Modal>

      <div style={{ marginBottom:22 }}><SectionLabel>Career Domain</SectionLabel><h1 style={{ fontSize:26, fontFamily:T.fD, fontWeight:800, color:T.text }}>Career Hub</h1></div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(170px,1fr))', gap:12, marginBottom:18 }}>
        {statCards.map((m,i)=>(
          <GlassCard key={i} style={{ padding:'16px 18px' }}>
            <div style={{ fontSize:9, fontFamily:T.fM, color:T.textSub, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:6 }}>{m.label}</div>
            <div style={{ fontSize:22, fontFamily:T.fD, fontWeight:800, color:m.color }}>{m.val}</div>
          </GlassCard>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:6, marginBottom:18 }}>
        {[{id:'kanban',label:'🗂 Kanban'},{id:'skills',label:'🧠 Skills'},{id:'rex',label:'📖 REX Journal'},{id:'cv',label:'📄 CV'}].map(tb=>(
          <button key={tb.id} onClick={()=>setTab(tb.id)} className="los-tab" style={{ padding:'7px 16px', borderRadius:8, fontSize:11, fontFamily:T.fM, fontWeight:600, background:tab===tb.id?T.accentDim:T.surface, color:tab===tb.id?T.accent:T.textSub, border:`1px solid ${tab===tb.id?T.accent+'44':T.border}`, transition:'all 0.18s' }}>{tb.label}</button>
        ))}
        <div style={{ flex:1 }} />
        {tab==='kanban' && <Btn onClick={()=>{setEditJobId(null);setJTitle('');setJCompany('');setJStage('Applied');setJDate(today());setJLink('');setJNotes('');setModal('job');}} color={T.accent}>+ Add Application</Btn>}
        {tab==='rex'    && <Btn onClick={()=>setModal('rex')} color={T.amber}>+ Add Entry</Btn>}
      </div>

      {/* Kanban Board */}
      {tab === 'kanban' && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(170px,1fr))', gap:12 }}>
          {JOB_STAGES.map(stage => {
            const stageJobs = jobs.filter(j=>j.stage===stage);
            const sc = STAGE_COLORS[stage];
            return (
              <GlassCard key={stage} style={{ padding:'16px', minHeight:200 }}>
                <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:12 }}>
                  <div style={{ width:8, height:8, borderRadius:'50%', background:sc }} />
                  <span style={{ fontSize:10, fontFamily:T.fM, fontWeight:700, color:sc, letterSpacing:'0.08em', textTransform:'uppercase' }}>{stage}</span>
                  <span style={{ marginLeft:'auto', fontSize:10, fontFamily:T.fM, color:T.textMuted }}>{stageJobs.length}</span>
                </div>
                {stageJobs.map(j => (
                  <div key={j.id} className="los-card" style={{ padding:'12px', marginBottom:8, borderRadius:10, background:T.surfaceHi, border:`1px solid ${T.border}`, cursor:'pointer' }}>
                    <div style={{ fontFamily:T.fD, fontWeight:700, fontSize:12, color:T.text, marginBottom:2 }}>{j.title}</div>
                    <div style={{ fontFamily:T.fM, fontSize:10, color:T.textSub, marginBottom:6 }}>{j.company}</div>
                    <div style={{ fontSize:9, fontFamily:T.fM, color:T.textMuted, marginBottom:6 }}>{j.date}</div>
                    <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                      {JOB_STAGES.filter(s=>s!==stage).map(s=>(
                        <button key={s} onClick={()=>moveJob(j.id, s)} style={{ fontSize:8, fontFamily:T.fM, padding:'2px 8px', borderRadius:99, background:`${STAGE_COLORS[s]}18`, color:STAGE_COLORS[s], border:`1px solid ${STAGE_COLORS[s]}33`, cursor:'pointer' }}>→{s}</button>
                      ))}
                      <button onClick={()=>openEditJob(j)} style={{ fontSize:8, fontFamily:T.fM, padding:'2px 8px', borderRadius:99, background:T.accentDim, color:T.accent, border:`1px solid ${T.accent}33` }}>✏️</button>
                      <button onClick={()=>removeJob(j.id)} style={{ fontSize:8, fontFamily:T.fM, padding:'2px 8px', borderRadius:99, background:T.roseDim, color:T.rose, border:`1px solid ${T.rose}33` }}>✕</button>
                    </div>
                    {j.notes && <div style={{ marginTop:6, fontSize:9, fontFamily:T.fM, color:T.textSub, fontStyle:'italic', lineHeight:1.5 }}>{j.notes.slice(0,80)}{j.notes.length>80?'...':''}</div>}
                  </div>
                ))}
                {stageJobs.length===0 && <div style={{ fontSize:10, fontFamily:T.fM, color:T.textMuted, textAlign:'center', padding:'20px 0' }}>No applications</div>}
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* Skills */}
      {tab === 'skills' && (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <GlassCard style={{ padding:'20px 22px' }}>
            <div style={{ display:'flex', gap:8, marginBottom:14 }}>
              <Input value={skillInput} onChange={e=>setSkillInput(e.target.value)} placeholder="Add skill (e.g. TypeScript, Leadership...)" style={{ flex:1 }} />
              <Select value={skillLevel} onChange={e=>setSkillLevel(e.target.value)} style={{ width:160 }}>{SKILL_LEVELS.map(l=><option key={l}>{l}</option>)}</Select>
              <Btn onClick={addSkill} color={T.accent}>Add</Btn>
            </div>
            {SKILL_LEVELS.map(level => {
              const lvSkills = skills.filter(s=>s.level===level);
              if (!lvSkills.length) return null;
              return (
                <div key={level} style={{ marginBottom:16 }}>
                  <div style={{ fontSize:9, fontFamily:T.fM, color:SKILL_COLORS[level], letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8 }}>{level}</div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                    {lvSkills.map(s=>(
                      <div key={s.id} style={{ display:'flex', alignItems:'center', gap:5, padding:'4px 12px', borderRadius:99, background:`${SKILL_COLORS[level]}18`, border:`1px solid ${SKILL_COLORS[level]}33`, fontSize:11, fontFamily:T.fM, color:SKILL_COLORS[level] }}>
                        {s.name}
                        <button onClick={()=>removeSkill(s.id)} style={{ color:T.textMuted, fontSize:10, marginLeft:2 }}>×</button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            {skills.length===0 && <div style={{ textAlign:'center', padding:'20px 0', fontSize:11, fontFamily:T.fM, color:T.textMuted }}>Add your first skill above.</div>}
          </GlassCard>
        </div>
      )}

      {/* REX Journal */}
      {tab === 'rex' && (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {rex.map((r,i)=>(
            <GlassCard key={r.id} style={{ padding:'18px 22px', borderLeft:`3px solid ${REX_TAG_COLORS[r.tag]||T.textSub}55`, animation:`fadeUp 0.3s ease ${i*0.06}s both` }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}><Badge color={REX_TAG_COLORS[r.tag]||T.accent}>{r.tag}</Badge><span style={{ fontFamily:T.fD, fontWeight:700, fontSize:13, color:T.text }}>{r.title}</span></div>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <span style={{ fontSize:9, fontFamily:T.fM, color:T.textMuted }}>{r.date}</span>
                  <button onClick={()=>removeRex(r.id)} style={{ color:T.textMuted, fontSize:12, cursor:'pointer' }}>×</button>
                </div>
              </div>
              {r.body && <div style={{ fontSize:11, fontFamily:T.fM, color:T.textSub, lineHeight:1.7 }}>{r.body}</div>}
            </GlassCard>
          ))}
          {rex.length===0 && <GlassCard style={{ padding:40, textAlign:'center' }}><div style={{ fontSize:11, fontFamily:T.fM, color:T.textMuted }}>No REX entries yet. Add your first experience reflection.</div></GlassCard>}
        </div>
      )}

      {/* CV */}
      {tab === 'cv' && (
        <GlassCard style={{ padding:'24px', maxWidth:640 }}>
          <SectionLabel>Digital CV</SectionLabel>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <Input value={cvRole}   onChange={e=>setCvRole(e.target.value)}   placeholder="Current role / target role" />
            <textarea value={cvBio} onChange={e=>setCvBio(e.target.value)} placeholder="Professional summary (2–3 sentences)" rows={4} style={{ width:'100%', padding:'9px 12px', background:'rgba(255,255,255,0.04)', border:`1px solid ${T.border}`, borderRadius:T.r, fontFamily:T.fM, fontSize:12, color:T.text, resize:'vertical' }} />
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:10 }}>
              <Input value={cvEmail}  onChange={e=>setCvEmail(e.target.value)}  placeholder="Email" />
              <Input value={cvLinked} onChange={e=>setCvLinked(e.target.value)} placeholder="LinkedIn URL" />
            </div>
            <Btn onClick={saveCV} color={T.accent}>Save CV</Btn>
          </div>
          {cv.role && (
            <div style={{ marginTop:20, padding:'18px', borderRadius:T.r, background:T.accentLo, border:`1px solid ${T.accent}22` }}>
              <div style={{ fontSize:14, fontFamily:T.fD, fontWeight:700, color:T.text, marginBottom:4 }}>{cv.role}</div>
              {cv.bio && <div style={{ fontSize:11, fontFamily:T.fM, color:T.textSub, lineHeight:1.7, marginBottom:8 }}>{cv.bio}</div>}
              <div style={{ display:'flex', gap:12, fontSize:10, fontFamily:T.fM, color:T.textMuted }}>
                {cv.email && <span>✉ {cv.email}</span>}
                {cv.linkedin && <span>🔗 {cv.linkedin}</span>}
              </div>
            </div>
          )}
        </GlassCard>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ── S4: CALENDAR PAGE ────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
function CalendarPage({ data }) {
  const [gcalTab, setGcalTab] = useState('local');
  const {expenses=[], habits=[], habitLogs={}, bills=[], goals=[], settings={}} = data;
  const cur = settings.currency || '$';
  const now = new Date();
  const [viewYear,  setViewYear ] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  const prevMonth = () => { if (viewMonth===0) { setViewMonth(11); setViewYear(y=>y-1); } else setViewMonth(m=>m-1); };
  const nextMonth = () => { if (viewMonth===11) { setViewMonth(0); setViewYear(y=>y+1); } else setViewMonth(m=>m+1); };

  const monthStr = `${viewYear}-${String(viewMonth+1).padStart(2,'0')}`;
  const monthName = new Date(viewYear, viewMonth, 1).toLocaleString('en-US', { month:'long', year:'numeric' });

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth+1, 0).getDate();

  // Build day-indexed maps
  const expByDay   = {};
  const habitByDay = {};
  const billByDay  = {};
  const goalDeadlines = {};

  (expenses||[]).filter(e=>e.date?.startsWith(monthStr)).forEach(e => {
    const d = parseInt(e.date.slice(8));
    if (!expByDay[d]) expByDay[d] = 0;
    expByDay[d] += Number(e.amount||0);
  });

  (habits||[]).forEach(h => {
    (habitLogs[h.id]||[]).filter(date=>date.startsWith(monthStr)).forEach(date => {
      const d = parseInt(date.slice(8));
      if (!habitByDay[d]) habitByDay[d] = 0;
      habitByDay[d]++;
    });
  });

  (bills||[]).forEach(b => {
    if (b.nextDate?.startsWith(monthStr)) {
      const d = parseInt(b.nextDate.slice(8));
      if (!billByDay[d]) billByDay[d] = [];
      billByDay[d].push(b.name);
    }
  });

  (goals||[]).forEach(g => {
    if (g.deadline?.startsWith(monthStr)) {
      const d = parseInt(g.deadline.slice(8));
      goalDeadlines[d] = (goalDeadlines[d]||[]).concat(g.name);
    }
  });

  const todayDay = (now.getFullYear()===viewYear && now.getMonth()===viewMonth) ? now.getDate() : -1;

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const maxExp = Math.max(...Object.values(expByDay), 1);
  const totalMonthExp = Object.values(expByDay).reduce((s,v)=>s+v,0);
  const daysWithHabits = Object.keys(habitByDay).length;

  return (
    <div style={{ animation:'fadeUp 0.4s ease' }}>
      {/* Tab switcher */}
      <div style={{ display:'flex', gap:2, marginBottom:18, background:T.surface, borderRadius:T.r, padding:3, width:'fit-content', border:`1px solid ${T.border}` }}>
        {[{id:'local',l:'📅 Local'},{id:'gcal',l:'🗓 Google Calendar'}].map(({id,l})=>(
          <button key={id} onClick={()=>setGcalTab(id)} className="los-tab" style={{ padding:'5px 14px', borderRadius:8, fontSize:9, fontFamily:T.fM, textTransform:'uppercase', letterSpacing:'0.06em', background:gcalTab===id?T.accentDim:'transparent', color:gcalTab===id?T.accent:T.textSub, border:`1px solid ${gcalTab===id?T.accent+'33':'transparent'}`, transition:'all 0.18s' }}>{l}</button>
        ))}
      </div>
      {gcalTab==='gcal' && <GoogleCalendarTab data={data} />}
      {gcalTab==='local' && <div><div style={{ marginBottom:22 }}><SectionLabel>Calendar Domain</SectionLabel><h1 style={{ fontSize:26, fontFamily:T.fD, fontWeight:800, color:T.text }}>Monthly Overview</h1></div>

      {/* Stats row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(170px,1fr))', gap:12, marginBottom:18 }}>
        {[
          { label:'Month Spend',   val:`${cur}${fmtN(totalMonthExp)}`, color:T.rose   },
          { label:'Active Days',   val:`${daysWithHabits} days`,       color:T.accent },
          { label:'Bills Due',     val:`${Object.keys(billByDay).length}`,  color:T.amber  },
          { label:'Goal Deadlines',val:`${Object.keys(goalDeadlines).length}`, color:T.violet },
        ].map((m,i)=>(
          <GlassCard key={i} style={{ padding:'14px 16px' }}>
            <div style={{ fontSize:9, fontFamily:T.fM, color:T.textSub, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:4 }}>{m.label}</div>
            <div style={{ fontSize:18, fontFamily:T.fD, fontWeight:800, color:m.color }}>{m.val}</div>
          </GlassCard>
        ))}
      </div>

      <GlassCard style={{ padding:'22px' }}>
        {/* Navigation */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
          <button onClick={prevMonth} style={{ padding:'6px 10px', borderRadius:8, background:T.surface, border:`1px solid ${T.border}`, cursor:'pointer' }}><IcoChevLeft size={16} stroke={T.textSub} /></button>
          <span style={{ fontSize:15, fontFamily:T.fD, fontWeight:700, color:T.text }}>{monthName}</span>
          <button onClick={nextMonth} style={{ padding:'6px 10px', borderRadius:8, background:T.surface, border:`1px solid ${T.border}`, cursor:'pointer' }}><IcoChevR size={16} stroke={T.textSub} /></button>
        </div>

        {/* Day headers */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4, marginBottom:4 }}>
          {DAYS.map(d=>(
            <div key={d} style={{ fontSize:9, fontFamily:T.fM, color:T.textMuted, textAlign:'center', letterSpacing:'0.06em', paddingBottom:4 }}>{d.toUpperCase()}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4 }}>
          {cells.map((day, i) => {
            if (!day) return <div key={`e${i}`} />;
            const isToday = day === todayDay;
            const expAmt  = expByDay[day] || 0;
            const habCnt  = habitByDay[day] || 0;
            const hasBill = !!billByDay[day];
            const hasGoal = !!goalDeadlines[day];
            const expIntensity = expAmt > 0 ? Math.min(expAmt / maxExp, 1) : 0;
            return (
              <div key={day} style={{ minHeight:68, padding:'6px 4px', borderRadius:8, background:isToday?T.accentLo:T.surface, border:`1px solid ${isToday?T.accent+'66':T.border}`, position:'relative', display:'flex', flexDirection:'column', gap:2 }}>
                <span style={{ fontSize:10, fontFamily:T.fM, fontWeight:isToday?700:400, color:isToday?T.accent:T.text, textAlign:'center' }}>{day}</span>
                {/* Expense bar */}
                {expAmt > 0 && (
                  <div title={`${cur}${fmtN(expAmt)} spent`} style={{ height:3, borderRadius:2, background:T.rose, opacity:0.4+expIntensity*0.6, width:'80%', alignSelf:'center' }} />
                )}
                {/* Dots */}
                <div style={{ display:'flex', flexWrap:'wrap', gap:2, justifyContent:'center' }}>
                  {habCnt > 0 && <div title={`${habCnt} habit${habCnt>1?'s':''}`} style={{ width:6, height:6, borderRadius:'50%', background:T.accent, opacity:0.85 }} />}
                  {hasBill && <div title={`Bill: ${billByDay[day].join(', ')}`} style={{ width:6, height:6, borderRadius:'50%', background:T.amber }} />}
                  {hasGoal && <div title={`Deadline: ${goalDeadlines[day].join(', ')}`} style={{ width:6, height:6, borderRadius:'50%', background:T.violet }} />}
                </div>
                {expAmt > 0 && <div style={{ fontSize:7, fontFamily:T.fM, color:T.rose, textAlign:'center', opacity:0.8 }}>{cur}{expAmt>=1000?fmtN(expAmt):expAmt.toFixed(0)}</div>}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div style={{ display:'flex', gap:16, marginTop:14, fontSize:9, fontFamily:T.fM, color:T.textSub }}>
          {[{color:T.accent,label:'Habits logged'},{color:T.rose,label:'Expense activity'},{color:T.amber,label:'Bill due'},{color:T.violet,label:'Goal deadline'}].map((l,i)=>(
            <span key={i} style={{ display:'flex', alignItems:'center', gap:4 }}><span style={{ width:8, height:8, borderRadius:'50%', background:l.color, display:'inline-block' }} />{l.label}</span>
          ))}
        </div>
      </GlassCard>
      </div>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ── S4: WHAT-IF FINANCIAL SIMULATOR ──────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════
// ── SIMULATE A DECISION ───────────────────────────────────────────────────────
// Conversational entry: describe a decision in plain text, answer 2-3 questions,
// and get a 5-year net worth comparison: current path vs decision path.
// Uses real data from the forecast engine under the hood.
// ══════════════════════════════════════════════════════════════════════════════
function SimulateDecisionModal({ open, onClose, data }) {
  const { expenses=[], incomes=[], assets=[], investments=[], debts=[], settings={} } = data || {};
  const cur  = settings?.currency || '$';
  const r    = 0.07;

  // Baseline portfolio value
  const portfolioNow = useMemo(() =>
    (investments||[]).reduce((s,i)=>s+Number((i.currentPrice??i.buyPrice)||0)*Number(i.quantity||0),0)
    + (assets||[]).filter(a=>a.type==='Cash').reduce((s,a)=>s+Number(a.value||0),0),
  [investments, assets]);

  // Trailing 3-month avg monthly savings
  const baseMonthly = useMemo(() => {
    if (!(incomes||[]).length && !(expenses||[]).length) return 0;
    const trail = [1,2,3].map(i => {
      const d = new Date(); d.setMonth(d.getMonth()-i);
      const m = d.toISOString().slice(0,7);
      const inc = (incomes||[]).filter(x=>x.date?.startsWith(m)).reduce((s,x)=>s+Number(x.amount||0),0);
      const exp = (expenses||[]).filter(x=>x.date?.startsWith(m)).reduce((s,x)=>s+Number(x.amount||0),0);
      return Math.max(0, inc - exp);
    });
    return Math.round(trail.reduce((s,x)=>s+x,0)/3);
  }, [incomes, expenses]);

  // Decision templates for quick-start
  const TEMPLATES = [
    { label:'New job (+income)',       incChange:500,  expChange:200,  oneOff:0,    desc:'New job with higher pay but more commute costs' },
    { label:'Buy a car',               incChange:0,    expChange:300,  oneOff:15000,desc:'New car purchase — loan payment + running costs' },
    { label:'Move to cheaper city',    incChange:0,    expChange:-400, oneOff:2000, desc:'Relocate — lower rent saves significantly' },
    { label:'Start a side project',    incChange:300,  expChange:100,  oneOff:1000, desc:'Side income potential with upfront investment' },
    { label:'Cut a subscription tier', incChange:0,    expChange:-50,  oneOff:0,    desc:'Downgrade or cancel a recurring service' },
    { label:'Custom',                  incChange:0,    expChange:0,    oneOff:0,    desc:'' },
  ];

  const [step,      setStep     ] = useState(0); // 0=pick template, 1=tune numbers, 2=results
  const [template,  setTemplate ] = useState(null);
  const [incChange, setIncChange] = useState(0);   // monthly income change
  const [expChange, setExpChange] = useState(0);   // monthly expense change (+ = more, - = less)
  const [oneOff,    setOneOff   ] = useState(0);   // one-time cost or gain
  const [label,     setLabel    ] = useState('');

  useEffect(() => { if (open) { setStep(0); setTemplate(null); } }, [open]);

  const pickTemplate = (tmpl) => {
    setTemplate(tmpl);
    setIncChange(tmpl.incChange);
    setExpChange(tmpl.expChange);
    setOneOff(tmpl.oneOff);
    setLabel(tmpl.desc);
    setStep(1);
  };

  // Project portfolio over N years with monthly contribution
  const project = (principal, monthlyContrib, years) => {
    let p = principal;
    const mr = Math.pow(1+r, 1/12) - 1;
    for (let m = 0; m < years*12; m++) {
      p = p*(1+mr) + Math.max(0, monthlyContrib);
    }
    return Math.round(p);
  };

  const YEARS = [1, 3, 5, 10];
  const baseContrib    = baseMonthly;
  const decisionContrib = baseMonthly + incChange - expChange;
  const decisionStart   = portfolioNow - oneOff; // one-off cost deducted upfront

  const results = YEARS.map(y => ({
    y,
    base:     project(portfolioNow,   baseContrib,     y),
    decision: project(decisionStart,  decisionContrib, y),
  }));

  const net5yr  = results.find(r=>r.y===5);
  const diff5yr = net5yr ? net5yr.decision - net5yr.base : 0;

  if (!open) return null;

  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', zIndex:3000, display:'flex', alignItems:'center', justifyContent:'center', padding:20, backdropFilter:'blur(6px)' }}>
      <div onClick={e=>e.stopPropagation()} style={{ width:'100%', maxWidth:560, maxHeight:'92vh', overflowY:'auto', borderRadius:22, background:T.bg1, border:`1px solid ${T.border}`, animation:'modalIn 0.28s ease' }}>

        {/* Header */}
        <div style={{ padding:'22px 28px 0', display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
          <div>
            <div style={{ fontSize:9, fontFamily:T.fM, color:T.violet, textTransform:'uppercase', letterSpacing:'0.14em', marginBottom:5, fontWeight:700 }}>⚡ Simulate a Decision</div>
            <h2 style={{ fontSize:18, fontFamily:T.fD, fontWeight:800, color:T.text }}>
              {step===0 ? 'What are you deciding?' : step===1 ? 'Tune the numbers' : 'The 5-year picture'}
            </h2>
          </div>
          <button onClick={onClose} style={{ color:T.textSub, background:'none', border:'none', cursor:'pointer', fontSize:20 }}>×</button>
        </div>

        <div style={{ padding:'18px 28px 28px', display:'flex', flexDirection:'column', gap:16 }}>

          {/* Step 0 — Pick a template */}
          {step===0 && (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              <div style={{ fontSize:10, fontFamily:T.fM, color:T.textSub, marginBottom:4 }}>Pick a scenario to model with your real numbers:</div>
              {TEMPLATES.map((tmpl,i) => (
                <button key={i} onClick={()=>pickTemplate(tmpl)}
                  style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', borderRadius:T.r, background:T.surface, border:`1px solid ${T.border}`, cursor:'pointer', textAlign:'left', transition:'all 0.15s' }}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=T.violet+'55';e.currentTarget.style.background=T.violetDim;}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.background=T.surface;}}>
                  <div>
                    <div style={{ fontSize:12, fontFamily:T.fD, fontWeight:700, color:T.text }}>{tmpl.label}</div>
                    {tmpl.desc && <div style={{ fontSize:10, fontFamily:T.fM, color:T.textSub, marginTop:2 }}>{tmpl.desc}</div>}
                  </div>
                  <span style={{ marginLeft:'auto', color:T.violet, opacity:0.6 }}>→</span>
                </button>
              ))}
            </div>
          )}

          {/* Step 1 — Tune numbers */}
          {step===1 && (
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <input value={label} onChange={e=>setLabel(e.target.value)} placeholder="Describe the decision…"
                style={{ width:'100%', padding:'10px 14px', background:'rgba(255,255,255,0.04)', border:`1px solid ${T.border}`, borderRadius:T.r, fontFamily:T.fM, fontSize:12, color:T.text }} />

              {[
                { label:'Monthly income change', val:incChange, set:setIncChange, color:T.emerald, prefix:cur, hint:'positive = more income, negative = less' },
                { label:'Monthly expense change', val:expChange, set:setExpChange, color:T.rose, prefix:cur, hint:'positive = more spending, negative = savings' },
                { label:'One-time cost or gain', val:oneOff, set:setOneOff, color:T.amber, prefix:cur, hint:'upfront cost (positive) or windfall (negative)' },
              ].map((f,i) => (
                <div key={i}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, fontFamily:T.fM, color:T.textSub, marginBottom:6 }}>
                    <span>{f.label}</span>
                    <span style={{ color:f.color, fontWeight:700 }}>{f.val >= 0 ? '+' : ''}{f.prefix}{fmtN(Math.abs(f.val))}</span>
                  </div>
                  <input type="number" value={f.val} onChange={e=>f.set(Number(e.target.value)||0)}
                    style={{ width:'100%', padding:'8px 12px', background:'rgba(255,255,255,0.04)', border:`1px solid ${T.border}`, borderRadius:T.r, fontFamily:T.fM, fontSize:12, color:T.text }} />
                  <div style={{ fontSize:8, fontFamily:T.fM, color:T.textMuted, marginTop:3 }}>{f.hint}</div>
                </div>
              ))}

              {/* Context: your baseline */}
              <div style={{ padding:'10px 14px', borderRadius:T.r, background:T.surface, border:`1px solid ${T.border}`, fontSize:10, fontFamily:T.fM, color:T.textSub, lineHeight:1.6 }}>
                Your baseline: <span style={{ color:T.accent }}>{cur}{fmtN(baseMonthly)}/mo</span> saved · portfolio <span style={{ color:T.accent }}>{cur}{fmtN(portfolioNow)}</span> · decision changes monthly saving to <span style={{ color: decisionContrib > baseContrib ? T.emerald : T.rose, fontWeight:700 }}>{cur}{fmtN(Math.max(0,decisionContrib))}/mo</span>
              </div>

              <div style={{ display:'flex', gap:8 }}>
                <button onClick={()=>setStep(0)} style={{ padding:'9px 18px', borderRadius:T.r, background:T.surface, border:`1px solid ${T.border}`, fontFamily:T.fM, fontSize:10, color:T.textSub, cursor:'pointer' }}>← Back</button>
                <Btn onClick={()=>setStep(2)} color={T.violet} style={{ flex:1 }}>See the 5-year picture →</Btn>
              </div>
            </div>
          )}

          {/* Step 2 — Results */}
          {step===2 && (
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {/* Summary verdict */}
              <div style={{ padding:'14px 16px', borderRadius:T.r, background: diff5yr >= 0 ? T.emeraldDim : T.roseDim, border:`1px solid ${diff5yr>=0?T.emerald:T.rose}44` }}>
                <div style={{ fontSize:9, fontFamily:T.fM, color: diff5yr>=0?T.emerald:T.rose, textTransform:'uppercase', letterSpacing:'0.1em', fontWeight:700, marginBottom:6 }}>
                  {diff5yr >= 0 ? '✅ Net positive decision' : '⚠ Net cost decision'}
                </div>
                <div style={{ fontSize:13, fontFamily:T.fM, color:T.text, lineHeight:1.6 }}>
                  <strong style={{ color: diff5yr>=0?T.emerald:T.rose }}>{label || 'This decision'}</strong> leaves you <strong style={{ color: diff5yr>=0?T.emerald:T.rose }}>{diff5yr>=0?'+':''}{cur}{fmtN(Math.abs(diff5yr))}</strong> {diff5yr>=0?'ahead':'behind'} after 5 years compared to staying the course.
                </div>
              </div>

              {/* Year-by-year comparison */}
              <div>
                <div style={{ fontSize:9, fontFamily:T.fM, color:T.textSub, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:10 }}>Portfolio comparison</div>
                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  {results.map(row => {
                    const diff = row.decision - row.base;
                    const c = diff >= 0 ? T.emerald : T.rose;
                    return (
                      <div key={row.y} style={{ display:'grid', gridTemplateColumns:'50px 1fr 1fr 80px', gap:10, alignItems:'center', padding:'8px 12px', borderRadius:T.r, background:T.surface, border:`1px solid ${T.border}` }}>
                        <div style={{ fontSize:10, fontFamily:T.fM, color:T.textSub, fontWeight:700 }}>{row.y}yr</div>
                        <div style={{ fontSize:11, fontFamily:T.fM, color:T.textSub }}><span style={{ fontSize:8, display:'block', marginBottom:1, opacity:0.7 }}>Current path</span>{cur}{fmtN(row.base)}</div>
                        <div style={{ fontSize:11, fontFamily:T.fM, color:T.text }}><span style={{ fontSize:8, display:'block', marginBottom:1, opacity:0.7 }}>With decision</span>{cur}{fmtN(row.decision)}</div>
                        <div style={{ fontSize:11, fontFamily:T.fM, color:c, fontWeight:700, textAlign:'right' }}>{diff>=0?'+':''}{cur}{fmtN(Math.abs(diff))}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Save as decision */}
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={()=>setStep(1)} style={{ padding:'9px 18px', borderRadius:T.r, background:T.surface, border:`1px solid ${T.border}`, fontFamily:T.fM, fontSize:10, color:T.textSub, cursor:'pointer' }}>← Adjust</button>
                <button onClick={onClose} style={{ flex:1, padding:'9px 18px', borderRadius:T.r, background:T.violetDim, border:`1px solid ${T.violet}44`, fontFamily:T.fM, fontSize:10, fontWeight:700, color:T.violet, cursor:'pointer' }}>Done</button>
              </div>
              <div style={{ fontSize:9, fontFamily:T.fM, color:T.textMuted, lineHeight:1.5 }}>⚠ Assumes 7%/yr portfolio return, constant contributions. Does not model inflation or variable income.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function WhatIfSimulator({ data }) {
  const {expenses=[], incomes=[], debts=[], assets=[], investments=[], settings={}} = data;
  const cur = settings.currency || '$';
  const thisMonth = today().slice(0,7);
  const baseInc = (incomes||[]).filter(i=>i.date?.startsWith(thisMonth)).reduce((s,i)=>s+Number(i.amount||0),0) || Number(settings.incomeTarget||0) || 5000;
  const baseExp = (expenses||[]).filter(e=>e.date?.startsWith(thisMonth)).reduce((s,e)=>s+Number(e.amount||0),0) || 3000;
  const baseDebt = (debts||[]).reduce((s,d)=>s+Number(d.balance||0),0);
  const baseNW = (assets||[]).reduce((s,a)=>s+Number(a.value||0),0) + (investments||[]).reduce((s,i)=>s+Number((i.currentPrice??i.buyPrice)||0)*Number(i.quantity||0),0) - baseDebt;

  const [incDelta,  setIncDelta ] = useState(0);   // % income increase
  const [expCut,    setExpCut   ] = useState(0);   // % expense cut
  const [extraDebt, setExtraDebt] = useState(0);   // extra monthly debt payment
  const [investPct, setInvestPct] = useState(7);   // assumed annual return %

  const newMonthInc = baseInc * (1 + incDelta/100);
  const newMonthExp = baseExp * (1 - expCut/100);
  const newSaved    = newMonthInc - newMonthExp - extraDebt;
  const newSavRate  = newMonthInc > 0 ? (newSaved/newMonthInc)*100 : 0;

  const projectNW = (months) => {
    let nw = baseNW;
    const monthlyReturn = Math.pow(1 + investPct/100, 1/12) - 1;
    let debtLeft = baseDebt;
    for (let m = 0; m < months; m++) {
      const savingsThisMonth = Math.max(0, newSaved);
      nw += savingsThisMonth * (1 + monthlyReturn * (months - m)/months);
      debtLeft = Math.max(0, debtLeft - extraDebt);
    }
    return nw;
  };

  const horizons = [12, 36, 60];
  const projections = horizons.map(m => ({ months:m, label:m===12?'1 Year':m===36?'3 Years':'5 Years', base:baseNW + newMonthInc*0.1*m, projected:projectNW(m), color:m===12?T.sky:m===36?T.violet:T.accent }));

  const chartData = Array.from({length:61}, (_,m) => ({
    m: m===0?'Now':`${m}mo`,
    base: baseNW + (baseInc - baseExp) * m,
    scenario: projectNW(m),
  })).filter((_,i) => i===0 || (i%6===0));

  return (
    <GlassCard style={{ padding:'24px' }}>
      <SectionLabel>💡 What-If Financial Simulator</SectionLabel>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:20, marginBottom:20 }}>
        {[
          { label:'Income increase (%)', val:incDelta, set:setIncDelta, min:-50, max:200, step:5, color:T.emerald },
          { label:'Expense cut (%)',     val:expCut,   set:setExpCut,   min:0,   max:90,  step:5, color:T.rose   },
          { label:'Extra debt payment (/mo)', val:extraDebt, set:setExtraDebt, min:0, max:5000, step:100, color:T.amber },
          { label:'Investment return (%/yr)', val:investPct, set:setInvestPct, min:0, max:20,   step:0.5, color:T.violet },
        ].map((s,i)=>(
          <div key={i}>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, fontFamily:T.fM, color:T.textSub, marginBottom:6 }}>
              <span>{s.label}</span>
              <span style={{ color:s.color, fontWeight:700 }}>{s.val}{i===2?` ${cur}`:i===3?'%/yr':'%'}</span>
            </div>
            <input type="range" min={s.min} max={s.max} step={s.step} value={s.val} onChange={e=>s.set(Number(e.target.value))} style={{ width:'100%', accentColor:s.color }} />
          </div>
        ))}
      </div>

      {/* Scenario summary */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:10, marginBottom:18 }}>
        {[
          { label:'New Monthly Save', val:`${cur}${fmtN(Math.max(0,newSaved))}`, sub:`Was ${cur}${fmtN(Math.max(0,baseInc-baseExp))}`, color:newSaved>0?T.accent:T.rose },
          { label:'New Savings Rate', val:`${newSavRate.toFixed(1)}%`, sub:`Was ${baseInc>0?((baseInc-baseExp)/baseInc*100).toFixed(1):0}%`, color:newSavRate>30?T.emerald:T.amber },
          { label:'Extra Debt Years', val:extraDebt>0&&baseDebt>0?`${(baseDebt/extraDebt/12).toFixed(1)}yr`:'N/A', sub:extraDebt>0?'to pay off debt':'Set extra payment', color:T.rose },
        ].map((s,i)=>(
          <div key={i} style={{ padding:'12px 14px', borderRadius:T.r, background:T.surface, border:`1px solid ${T.border}` }}>
            <div style={{ fontSize:9, fontFamily:T.fM, color:T.textSub, marginBottom:4, textTransform:'uppercase' }}>{s.label}</div>
            <div style={{ fontSize:16, fontFamily:T.fD, fontWeight:700, color:s.color }}>{s.val}</div>
            <div style={{ fontSize:9, fontFamily:T.fM, color:T.textMuted, marginTop:2 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Projection horizons */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:10, marginBottom:16 }}>
        {projections.map((p,i)=>(
          <div key={i} style={{ padding:'14px', borderRadius:T.r, background:`${p.color}0d`, border:`1px solid ${p.color}33` }}>
            <div style={{ fontSize:9, fontFamily:T.fM, color:p.color, marginBottom:4, textTransform:'uppercase', fontWeight:700 }}>{p.label}</div>
            <div style={{ fontSize:18, fontFamily:T.fD, fontWeight:800, color:p.color }}>{cur}{fmtN(p.projected)}</div>
            <div style={{ fontSize:9, fontFamily:T.fM, color:T.textSub, marginTop:3 }}>Δ {cur}{fmtN(p.projected - baseNW)} vs now</div>
          </div>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={chartData} margin={{top:4,right:0,left:0,bottom:0}}>
          <defs>
            <linearGradient id="wi1" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={T.accent} stopOpacity={0.25}/><stop offset="95%" stopColor={T.accent} stopOpacity={0}/></linearGradient>
            <linearGradient id="wi2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={T.textSub} stopOpacity={0.15}/><stop offset="95%" stopColor={T.textSub} stopOpacity={0}/></linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="2 4" stroke={T.border} vertical={false} />
          <XAxis dataKey="m" tick={{fill:T.textSub,fontSize:9,fontFamily:T.fM}} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={v=>v>=1000000?`${(v/1000000).toFixed(1)}M`:v>=1000?`${(v/1000).toFixed(0)}K`:`${v}`} tick={{fill:T.textSub,fontSize:9,fontFamily:T.fM}} axisLine={false} tickLine={false} />
          <Tooltip content={<ChartTooltip prefix={cur} />} />
          <Area type="monotone" dataKey="scenario" name="Scenario NW" stroke={T.accent} strokeWidth={2} fill="url(#wi1)" />
          <Area type="monotone" dataKey="base"     name="Current Path" stroke={T.textSub} strokeWidth={1.5} fill="url(#wi2)" strokeDasharray="4 2" />
        </AreaChart>
      </ResponsiveContainer>
    </GlassCard>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ── S4: LIVE PRICES PANEL ────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
const CRYPTO_IDS = { BTC:'bitcoin', ETH:'ethereum', SOL:'solana', BNB:'binancecoin', ADA:'cardano', DOT:'polkadot', XRP:'ripple', AVAX:'avalanche-2', MATIC:'matic-network', LINK:'chainlink' };
// Stock tickers that can be fetched via Yahoo Finance public endpoint
const STOCK_TYPES = ['Stock', 'ETF', 'Index', 'Fund'];

function LivePricesPanel({ investments, onUpdatePrice }) {
  const [cryptoPrices, setCryptoPrices] = useState({});
  const [stockPrices,  setStockPrices ] = useState({});
  const [loading,      setLoading     ] = useState(false);
  const [lastFetched,  setLastFetched ] = useState(null);
  const [errors,       setErrors      ] = useState([]);

  const cryptoInvs = (investments||[]).filter(i => i.type === 'Crypto' && CRYPTO_IDS[i.symbol?.toUpperCase()]);
  const stockInvs  = (investments||[]).filter(i => STOCK_TYPES.includes(i.type) && i.symbol);
  const cryptoIds  = [...new Set(cryptoInvs.map(i => CRYPTO_IDS[i.symbol.toUpperCase()]))];
  const stockSyms  = [...new Set(stockInvs.map(i => i.symbol.toUpperCase()))];

  const fetchCrypto = async () => {
    if (!cryptoIds.length) return null;
    const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${cryptoIds.join(',')}&vs_currencies=usd&include_24hr_change=true`);
    if (!res.ok) throw new Error('Crypto API error');
    return await res.json();
  };

  // Yahoo Finance v8 — no API key needed, browser fetch (CORS varies by env)
  const fetchStock = async (symbol) => {
    const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`);
    if (!res.ok) throw new Error(`${symbol} fetch failed`);
    const j = await res.json();
    const meta = j?.chart?.result?.[0]?.meta;
    if (!meta) throw new Error(`No data for ${symbol}`);
    const price = meta.regularMarketPrice || meta.previousClose;
    const prev  = meta.chartPreviousClose || meta.previousClose;
    const chg   = prev > 0 ? ((price - prev) / prev) * 100 : null;
    return { price, chg };
  };

  const fetchAll = async () => {
    setLoading(true); setErrors([]);
    const errs = [];
    try {
      // Crypto
      if (cryptoIds.length) {
        try {
          const data = await fetchCrypto();
          setCryptoPrices(data);
          cryptoInvs.forEach(inv => {
            const cid = CRYPTO_IDS[inv.symbol.toUpperCase()];
            if (data[cid]) onUpdatePrice(inv.id, data[cid].usd);
          });
        } catch (e) { errs.push('Crypto: ' + e.message); }
      }
      // Stocks — parallel requests
      if (stockSyms.length) {
        const results = await Promise.allSettled(stockSyms.map(s => fetchStock(s).then(d => ({ sym:s, ...d }))));
        const newStocks = {};
        results.forEach((r, i) => {
          if (r.status === 'fulfilled') {
            newStocks[stockSyms[i]] = r.value;
            stockInvs.filter(inv => inv.symbol.toUpperCase() === stockSyms[i]).forEach(inv => onUpdatePrice(inv.id, r.value.price));
          } else {
            errs.push(`${stockSyms[i]}: ${r.reason?.message||'fetch failed'}`);
          }
        });
        setStockPrices(p => ({ ...p, ...newStocks }));
      }
    } finally {
      setLoading(false);
      setLastFetched(new Date().toLocaleTimeString());
      if (errs.length) setErrors(errs);
    }
  };

  useEffect(() => {
    const handler = () => fetchAll();
    window.addEventListener('focus', handler);
    return () => window.removeEventListener('focus', handler);
  }, []);

  const allInvs = [...cryptoInvs, ...stockInvs];
  if (!allInvs.length) return (
    <GlassCard style={{ padding:'18px 20px' }}>
      <SectionLabel>📡 Live Prices</SectionLabel>
      <div style={{ fontSize:10, fontFamily:T.fM, color:T.textMuted, textAlign:'center', padding:'12px 0' }}>Add investments typed as Stock, ETF, or Crypto with symbols to see live prices.</div>
    </GlassCard>
  );

  return (
    <GlassCard style={{ padding:'18px 20px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
        <SectionLabel>📡 Live Prices (Crypto + Stocks)</SectionLabel>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          {lastFetched && <span style={{ fontSize:9, fontFamily:T.fM, color:T.textMuted }}>Updated {lastFetched}</span>}
          <button onClick={fetchAll} disabled={loading} style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 10px', borderRadius:7, background:T.accentDim, border:`1px solid ${T.accent}44`, color:T.accent, fontSize:10, fontFamily:T.fM, cursor:'pointer', opacity:loading?0.5:1 }}>
            <IcoRefresh size={11} stroke={T.accent} style={loading?{animation:'spin 1s linear infinite'}:{}} /> {loading?'Fetching…':'Refresh'}
          </button>
        </div>
      </div>
      {errors.length > 0 && (
        <div style={{ fontSize:9, fontFamily:T.fM, color:T.amber, marginBottom:8, padding:'6px 10px', background:T.amberDim, borderRadius:6, lineHeight:1.5 }}>
          {errors.map((e,i)=><div key={i}>⚠ {e}</div>)}
        </div>
      )}
      <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
        {allInvs.map(inv => {
          const isCrypto = inv.type === 'Crypto';
          const sym = inv.symbol?.toUpperCase();
          let price = null, chg = null, posVal = null;
          if (isCrypto) {
            const cid = CRYPTO_IDS[sym];
            const p = cryptoPrices[cid];
            if (p) { price = p.usd; chg = p.usd_24h_change; posVal = price * Number(inv.quantity); }
          } else {
            const p = stockPrices[sym];
            if (p) { price = p.price; chg = p.chg; posVal = price * Number(inv.quantity); }
          }
          return (
            <div key={inv.id} className="los-row" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 10px', borderRadius:T.r, background:T.surface, border:`1px solid ${T.border}` }}>
              <div style={{ display:'flex', flexDirection:'column' }}>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <span style={{ fontSize:12, fontFamily:T.fD, fontWeight:700, color:T.text }}>{sym}</span>
                  <span style={{ fontSize:8, fontFamily:T.fM, color:isCrypto?T.amber:T.sky, background:isCrypto?T.amberDim:T.skyDim, padding:'1px 5px', borderRadius:99 }}>{inv.type||'—'}</span>
                  <span style={{ fontSize:9, color:T.textMuted }}>×{inv.quantity}</span>
                </div>
                <span style={{ fontSize:9, fontFamily:T.fM, color:T.textSub }}>Cost basis ${fmtN(inv.buyPrice)}</span>
              </div>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end' }}>
                <span style={{ fontSize:12, fontFamily:T.fM, fontWeight:700, color:T.text }}>{price!=null?`$${fmtN(price)}`:'—'}</span>
                {chg != null && <span style={{ fontSize:9, fontFamily:T.fM, color:chg>=0?T.emerald:T.rose }}>{chg>=0?'+':''}{chg.toFixed(2)}% 24h</span>}
                {posVal != null && <span style={{ fontSize:9, fontFamily:T.fM, color:T.textSub }}>Pos: ${fmtN(posVal)}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// BATCH 3 & 4 COMPONENTS
// ══════════════════════════════════════════════════════════════════════════════

// ── ONBOARDING WIZARD ─────────────────────────────────────────────────────────
// ── EDIT GOAL MODAL ───────────────────────────────────────────────────────────
function EditGoalModal({ open, onClose, goal, onSave }) {
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [current, setCurrent] = useState('');
  const [deadline, setDeadline] = useState('');
  const [emoji, setEmoji] = useState('🎯');
  const [cat, setCat] = useState('other');
  const [milestones, setMilestones] = useState([]);
  const [newMsPct, setNewMsPct] = useState('');
  const [newMsLabel, setNewMsLabel] = useState('');

  useEffect(() => {
    if (goal) {
      setName(goal.name||''); setTarget(goal.target||''); setCurrent(goal.current||0);
      setDeadline(goal.deadline||''); setEmoji(goal.emoji||'🎯'); setCat(goal.cat||'other');
      setMilestones(goal.milestones||[]);
    }
  }, [goal]);

  if (!open || !goal) return null;

  const addMilestone = () => {
    const p = Number(newMsPct);
    if (!p || p<1 || p>99 || !newMsLabel.trim()) return;
    setMilestones(prev => [...prev.filter(m=>m.pct!==p), { pct:p, label:newMsLabel.trim() }].sort((a,b)=>a.pct-b.pct));
    setNewMsPct(''); setNewMsLabel('');
  };

  const pct = Math.min(100, Math.round((Number(current)/Math.max(1,Number(target)))*100));
  const catColors = { finance:T.accent, health:T.sky, growth:T.violet, career:T.amber, other:T.textSub };
  const c = catColors[cat]||T.violet;

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', zIndex:3000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ width:'100%', maxWidth:520, maxHeight:'90vh', overflowY:'auto', borderRadius:20, background:T.bg, border:`1px solid ${T.border}`, padding:'28px 32px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:22 }}>
          <h2 style={{ fontSize:18, fontFamily:T.fD, fontWeight:800, color:T.text }}>✏️ Edit Goal</h2>
          <button onClick={onClose} style={{ fontSize:20, color:T.textSub, background:'none', border:'none', cursor:'pointer' }}>×</button>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {/* Emoji + Name row */}
          <div style={{ display:'flex', gap:8 }}>
            <Input value={emoji} onChange={e=>setEmoji(e.target.value)} style={{ width:56, textAlign:'center', fontSize:20, flexShrink:0 }} />
            <Input value={name} onChange={e=>setName(e.target.value)} placeholder="Goal name" style={{ flex:1 }} />
          </div>
          {/* Category */}
          <Select value={cat} onChange={e=>setCat(e.target.value)}>
            {['finance','health','growth','career','other'].map(c=><option key={c} value={c}>{c}</option>)}
          </Select>
          {/* Target + Current */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            <div>
              <div style={{ fontSize:10, fontFamily:T.fM, color:T.textSub, marginBottom:4 }}>Target amount</div>
              <Input type="number" value={target} onChange={e=>setTarget(e.target.value)} placeholder="e.g. 10000" />
            </div>
            <div>
              <div style={{ fontSize:10, fontFamily:T.fM, color:T.textSub, marginBottom:4 }}>Current progress</div>
              <Input type="number" value={current} onChange={e=>setCurrent(e.target.value)} placeholder="e.g. 3500" />
            </div>
          </div>
          {/* Progress preview */}
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, fontFamily:T.fM, color:T.textSub, marginBottom:4 }}>
              <span>Progress preview</span><span style={{ color:c }}>{pct}%</span>
            </div>
            <MilestoneProgressBar pct={pct} color={c} height={8} milestones={milestones} />
          </div>
          {/* Deadline */}
          <div>
            <div style={{ fontSize:10, fontFamily:T.fM, color:T.textSub, marginBottom:4 }}>Deadline (optional)</div>
            <Input type="date" value={deadline} onChange={e=>setDeadline(e.target.value)} />
          </div>
          {/* Milestones */}
          <div style={{ marginTop:4, paddingTop:12, borderTop:`1px solid ${T.border}` }}>
            <div style={{ fontSize:11, fontFamily:T.fD, fontWeight:600, color:T.text, marginBottom:8 }}>Milestone checkpoints</div>
            {milestones.length > 0 && (
              <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:10 }}>
                {milestones.map((m,i) => (
                  <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 10px', borderRadius:8, background:T.surface, border:`1px solid ${T.border}` }}>
                    <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                      <div style={{ width:28, height:28, borderRadius:6, background:pct>=m.pct?c+'22':T.surface, border:`1px solid ${pct>=m.pct?c+'55':T.border}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, color:pct>=m.pct?c:T.textSub, fontWeight:600 }}>{m.pct}%</div>
                      <span style={{ fontSize:11, fontFamily:T.fM, color:pct>=m.pct?c:T.text }}>{m.label}{pct>=m.pct?' ✓':''}</span>
                    </div>
                    <button onClick={()=>setMilestones(prev=>prev.filter((_,j)=>j!==i))} style={{ color:T.rose, fontSize:14, background:'none', border:'none', cursor:'pointer', opacity:0.7 }}>×</button>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display:'grid', gridTemplateColumns:'70px 1fr auto', gap:6, alignItems:'center' }}>
              <Input type="number" value={newMsPct} onChange={e=>setNewMsPct(e.target.value)} placeholder="% e.g. 50" min={1} max={99} />
              <Input value={newMsLabel} onChange={e=>setNewMsLabel(e.target.value)} placeholder="Label e.g. Halfway there!" onKeyDown={e=>{ if(e.key==='Enter') addMilestone(); }} />
              <Btn onClick={addMilestone} color={c}>Add</Btn>
            </div>
            <div style={{ fontSize:9, fontFamily:T.fM, color:T.textMuted, marginTop:6 }}>Milestones appear as markers on your progress bar</div>
          </div>
          {/* Actions */}
          <div style={{ display:'flex', gap:8, marginTop:8 }}>
            <button onClick={onClose} style={{ flex:1, padding:'10px', borderRadius:T.r, background:T.surface, border:`1px solid ${T.border}`, fontFamily:T.fM, fontSize:11, color:T.textSub, cursor:'pointer' }}>Cancel</button>
            <Btn onClick={()=>onSave(goal.id, { name:name.trim()||goal.name, target:Number(target)||goal.target, current:Number(current), deadline, emoji:emoji||'🎯', cat, milestones })} color={T.accent} style={{ flex:2, padding:'10px 0' }}>Save Goal</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── ONBOARDING WIZARD ─────────────────────────────────────────────────────────
function OnboardingWizard({ onComplete, onSkip, actions, settings }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('$');
  const [income, setIncome] = useState('');
  const [selGoals, setSelGoals] = useState([]);
  const [selHabits, setSelHabits] = useState([]);
  const GOAL_OPTS = [
    {id:'savings',label:'Build Savings',emoji:'💰'},
    {id:'debt',label:'Pay Off Debt',emoji:'💳'},
    {id:'invest',label:'Start Investing',emoji:'📈'},
    {id:'health',label:'Get Healthier',emoji:'🏃'},
    {id:'skills',label:'Learn Skills',emoji:'🎓'},
    {id:'retire',label:'Early Retirement',emoji:'🏖️'},
  ];
  const HABIT_OPTS = [
    {id:'exercise',label:'Exercise',emoji:'💪'},
    {id:'read',label:'Read',emoji:'📚'},
    {id:'meditate',label:'Meditate',emoji:'🧘'},
    {id:'journal',label:'Journal',emoji:'✍️'},
    {id:'budget',label:'Track Spending',emoji:'💳'},
    {id:'water',label:'Drink Water',emoji:'💧'},
  ];
  const STEPS = [
    {title:'Welcome to LifeOS 👋',sub:'Your personal life operating system. Set up in under a minute.'},
    {title:'What\'s your name?',sub:'We\'ll personalise your experience.'},
    {title:'Financial setup',sub:'Currency and income target — you can change these later.'},
    {title:'What are your goals?',sub:'Pick up to 3 focus areas.'},
    {title:'Pick your first habits',sub:'Start with 2–3 for best results.'},
    {title:'You\'re all set! 🎉',sub:'LifeOS is ready to go.'},
  ];
  const toggle = (arr,setArr,id,max=3) => setArr(p=>p.includes(id)?p.filter(x=>x!==id):p.length<max?[...p,id]:p);
  const finish = () => {
    actions.updateSettings({...settings,name,currency,incomeTarget:Number(income),onboarded:true});
    selGoals.forEach(g=>{const o=GOAL_OPTS.find(x=>x.id===g);actions.addGoal({id:Date.now()+Math.random(),name:o?.label||g,target:0,current:0,cat:'other',emoji:o?.emoji||'🎯',milestones:[]});});
    selHabits.forEach(h=>{const o=HABIT_OPTS.find(x=>x.id===h);actions.addHabit(o?.label||h,{emoji:o?.emoji||'✅'});});
    onComplete();
  };
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.92)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
      <div style={{width:'100%',maxWidth:480,borderRadius:20,background:T.bg,border:`1px solid ${T.border}`,padding:'32px 36px'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:28}}>
          <div style={{display:'flex',gap:4,flex:1}}>
            {STEPS.map((_,i)=><div key={i} style={{flex:1,height:3,borderRadius:99,background:i<=step?T.accent:T.border,transition:'background 0.3s'}} />)}
          </div>
          {onSkip && <button onClick={onSkip} style={{marginLeft:16,fontSize:10,fontFamily:T.fM,color:T.textMuted,background:'none',border:'none',cursor:'pointer',flexShrink:0}}>Skip</button>}
        </div>
        <div style={{fontSize:9,fontFamily:T.fM,color:T.textSub,letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:8}}>Step {step+1} / {STEPS.length}</div>
        <div style={{fontSize:22,fontFamily:T.fD,fontWeight:800,color:T.text,marginBottom:6}}>{STEPS[step].title}</div>
        <div style={{fontSize:12,fontFamily:T.fM,color:T.textSub,marginBottom:28,lineHeight:1.5}}>{STEPS[step].sub}</div>
        {step===1&&<Input value={name} onChange={e=>setName(e.target.value)} placeholder="Your name…" autoFocus />}
        {step===2&&(
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            <div><div style={{fontSize:10,fontFamily:T.fM,color:T.textSub,marginBottom:6}}>Currency</div>
              <Select value={currency} onChange={e=>setCurrency(e.target.value)}>{['$','€','£','¥','₹','₩','Fr','R$','CA$','A$'].map(c=><option key={c}>{c}</option>)}</Select></div>
            <div><div style={{fontSize:10,fontFamily:T.fM,color:T.textSub,marginBottom:6}}>Monthly income (optional)</div>
              <Input type="number" value={income} onChange={e=>setIncome(e.target.value)} placeholder="e.g. 3000" /></div>
          </div>
        )}
        {step===3&&(
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            {GOAL_OPTS.map(g=>(
              <button key={g.id} onClick={()=>toggle(selGoals,setSelGoals,g.id,3)} style={{padding:'12px 14px',borderRadius:T.r,background:selGoals.includes(g.id)?T.accentDim:T.surface,border:`1px solid ${selGoals.includes(g.id)?T.accent+'66':T.border}`,textAlign:'left',display:'flex',gap:8,alignItems:'center',cursor:'pointer',transition:'all 0.15s'}}>
                <span style={{fontSize:20}}>{g.emoji}</span><span style={{fontSize:11,fontFamily:T.fM,color:selGoals.includes(g.id)?T.accent:T.text}}>{g.label}</span>
              </button>
            ))}
          </div>
        )}
        {step===4&&(
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            {HABIT_OPTS.map(h=>(
              <button key={h.id} onClick={()=>toggle(selHabits,setSelHabits,h.id,6)} style={{padding:'12px 14px',borderRadius:T.r,background:selHabits.includes(h.id)?`${T.violet}22`:T.surface,border:`1px solid ${selHabits.includes(h.id)?T.violet+'66':T.border}`,textAlign:'left',display:'flex',gap:8,alignItems:'center',cursor:'pointer',transition:'all 0.15s'}}>
                <span style={{fontSize:20}}>{h.emoji}</span><span style={{fontSize:11,fontFamily:T.fM,color:selHabits.includes(h.id)?T.violet:T.text}}>{h.label}</span>
              </button>
            ))}
          </div>
        )}
        {step===5&&(
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {[[`👤 Name`,name||'Not set'],[`💱 Currency`,currency],[`🎯 Goals`,selGoals.length+' selected'],[`🔥 Habits`,selHabits.length+' selected']].map(([k,v])=>(
              <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'8px 12px',borderRadius:T.r,background:T.surface,border:`1px solid ${T.border}`,fontSize:11,fontFamily:T.fM}}>
                <span style={{color:T.textSub}}>{k}</span><span style={{color:T.accent,fontWeight:600}}>{v}</span>
              </div>
            ))}
          </div>
        )}
        <div style={{display:'flex',gap:10,marginTop:28}}>
          {step>0&&<button onClick={()=>setStep(s=>s-1)} style={{padding:'10px 20px',borderRadius:T.r,background:T.surface,border:`1px solid ${T.border}`,fontFamily:T.fM,fontSize:11,color:T.textSub,cursor:'pointer'}}>Back</button>}
          <Btn onClick={step<STEPS.length-1?()=>setStep(s=>s+1):finish} color={T.accent} style={{flex:1,padding:'10px 0',fontSize:12}}>{step<STEPS.length-1?'Continue →':'Launch LifeOS 🚀'}</Btn>
        </div>
      </div>
    </div>
  );
}

// ── MONTHLY REVIEW MODAL ──────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
// ── STEP 4: WEEKLY REVIEW — auto-generated every Sunday ──────────────────────
// Answers 5 questions:
//   1. What moved  — 3 metrics that changed most this week (up or down)
//   2. What you did — habits, expenses, income, vitals logged
//   3. What's coming — next week's budget pace, bills, habit risk days
//   4. The gap     — actual vs what last week's trajectory predicted
//   5. One question — weekly rotating reflection prompt
// Auto-saves to Chronicles on close. Can be dismissed without saving.
// ══════════════════════════════════════════════════════════════════════════════
function computeWeeklySnapshot({ expenses=[], incomes=[], habits=[], habitLogs={}, vitals=[], goals=[], bills=[], budgets={}, netWorthHistory=[], settings={} }) {
  const cur = settings?.currency || '$';
  const now  = new Date();

  // Week boundaries — Mon to Sun
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7)); // last Monday
  weekStart.setHours(0,0,0,0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  const prevWeekStart = new Date(weekStart);
  prevWeekStart.setDate(weekStart.getDate() - 7);
  const prevWeekEnd   = new Date(weekStart);
  prevWeekEnd.setDate(weekStart.getDate() - 1);

  const inWeek  = (d, s, e) => { const dt = new Date(d); return dt >= s && dt <= e; };
  const wStr    = d => d.toISOString().slice(0,10);

  // This week's data
  const thisWeekExp  = (expenses||[]).filter(e => inWeek(e.date, weekStart, weekEnd));
  const thisWeekInc  = (incomes||[]).filter(i  => inWeek(i.date, weekStart, weekEnd));
  const thisWeekVit  = (vitals||[]).filter(v   => inWeek(v.date, weekStart, weekEnd));
  const prevWeekExp  = (expenses||[]).filter(e => inWeek(e.date, prevWeekStart, prevWeekEnd));
  const prevWeekInc  = (incomes||[]).filter(i  => inWeek(i.date, prevWeekStart, prevWeekEnd));

  const thisExpTotal = thisWeekExp.reduce((s,e)=>s+Number(e.amount||0),0);
  const thisIncTotal = thisWeekInc.reduce((s,i)=>s+Number(i.amount||0),0);
  const prevExpTotal = prevWeekExp.reduce((s,e)=>s+Number(e.amount||0),0);
  const prevIncTotal = prevWeekInc.reduce((s,i)=>s+Number(i.amount||0),0);
  const thisSaved    = Math.max(0, thisIncTotal - thisExpTotal);

  // Habit consistency this week (Mon–Sun)
  const weekDays = Array.from({length:7},(_,i)=>{
    const d=new Date(weekStart); d.setDate(weekStart.getDate()+i);
    return wStr(d);
  });
  const habitConsistency = (habits||[]).length > 0
    ? Math.round((weekDays.reduce((s,d)=>s+(habits||[]).filter(h=>(habitLogs[h.id]||[]).includes(d)).length,0) / ((habits||[]).length*7))*100)
    : 0;
  const prevWeekDays = Array.from({length:7},(_,i)=>{
    const d=new Date(prevWeekStart); d.setDate(prevWeekStart.getDate()+i);
    return wStr(d);
  });
  const prevHabitCons = (habits||[]).length > 0
    ? Math.round((prevWeekDays.reduce((s,d)=>s+(habits||[]).filter(h=>(habitLogs[h.id]||[]).includes(d)).length,0) / ((habits||[]).length*7))*100)
    : 0;

  // Avg mood & sleep this week
  const avgMood  = thisWeekVit.length ? (thisWeekVit.reduce((s,v)=>s+Number(v.mood||0),0)/thisWeekVit.length).toFixed(1) : null;
  const avgSleep = thisWeekVit.length ? (thisWeekVit.reduce((s,v)=>s+Number(v.sleep||0),0)/thisWeekVit.length).toFixed(1) : null;

  // ── Section 1: What moved ──────────────────────────────────────────────────
  const moved = [];
  if (prevExpTotal > 0) {
    const delta = thisExpTotal - prevExpTotal;
    moved.push({ label:'Weekly spending', value:`${cur}${fmtN(thisExpTotal)}`, delta, deltaLabel:`${delta>0?'+':'-'}${cur}${fmtN(Math.abs(delta))} vs last week`, good: delta <= 0 });
  }
  if ((habits||[]).length > 0 && prevHabitCons > 0) {
    const delta = habitConsistency - prevHabitCons;
    moved.push({ label:'Habit consistency', value:`${habitConsistency}%`, delta, deltaLabel:`${delta>0?'+':'-'}${Math.abs(delta)} pts vs last week`, good: delta >= 0 });
  }
  if (avgMood) {
    moved.push({ label:'Avg mood', value:`${avgMood}/10`, delta: null, deltaLabel: `${avgSleep}h avg sleep`, good: Number(avgMood) >= 6 });
  }
  if (thisIncTotal > 0) {
    moved.push({ label:'Income logged', value:`${cur}${fmtN(thisIncTotal)}`, delta: thisIncTotal - prevIncTotal, deltaLabel:`${cur}${fmtN(thisSaved)} saved`, good: thisSaved > 0 });
  }

  // ── Section 2: What you did ────────────────────────────────────────────────
  const habitsLoggedToday = (habits||[]).filter(h=>(habitLogs[h.id]||[]).some(d=>weekDays.includes(d))).length;
  const did = [
    (habits||[]).length > 0 && `${habitsLoggedToday}/${(habits||[]).length} habits logged this week`,
    thisWeekExp.length > 0 && `${thisWeekExp.length} expenses tracked (${cur}${fmtN(thisExpTotal)})`,
    thisWeekInc.length > 0 && `${cur}${fmtN(thisIncTotal)} income logged`,
    thisWeekVit.length > 0 && `${thisWeekVit.length} vitals entries`,
    thisWeekVit.length === 0 && `No vitals logged this week`,
  ].filter(Boolean);

  // ── Section 3: What's coming next week ────────────────────────────────────
  const nextWeekStart = new Date(weekEnd); nextWeekStart.setDate(weekEnd.getDate()+1);
  const nextWeekEnd   = new Date(nextWeekStart); nextWeekEnd.setDate(nextWeekStart.getDate()+6);
  const comingBills   = (bills||[]).filter(b => !b.paid && b.nextDate && inWeek(b.nextDate, nextWeekStart, nextWeekEnd));
  const thisM         = now.toISOString().slice(0,7);
  const daysInM       = new Date(now.getFullYear(), now.getMonth()+1, 0).getDate();
  const daysPast      = now.getDate();
  const monthExp      = (expenses||[]).filter(e=>e.date?.startsWith(thisM)).reduce((s,e)=>s+Number(e.amount||0),0);
  const projMonthExp  = daysPast > 0 ? Math.round(monthExp / (daysPast/daysInM)) : 0;

  const coming = [
    comingBills.length > 0 && `${comingBills.length} bill${comingBills.length>1?'s':''} due next week: ${comingBills.map(b=>b.name).join(', ')}`,
    Object.entries(budgets||{}).some(([cat,lim]) => {
      const spent = (expenses||[]).filter(e=>e.date?.startsWith(thisM)&&e.category===cat).reduce((s,e)=>s+Number(e.amount||0),0);
      return daysPast > 0 && (spent/(daysPast/daysInM)) > Number(lim)*1.05;
    }) && `Budget overshoot risk — review spending before month-end`,
  ].filter(Boolean);

  // Habit risk days next week
  const riskDays = habits.flatMap(h => {
    const logs = (habitLogs[h.id]||[]).sort();
    let weekendBreaks=0, total=0;
    for(let i=1;i<logs.length;i++){
      const gap=Math.round((new Date(logs[i])-new Date(logs[i-1]))/86400000);
      if(gap>1){ total++; const bd=new Date(logs[i-1]); bd.setDate(bd.getDate()+1); if(bd.getDay()===0||bd.getDay()===6) weekendBreaks++; }
    }
    const rate = total > 0 ? weekendBreaks/total : 0;
    return rate > 0.4 ? [`${h.emoji||'🔥'} ${h.name} (weekend risk)`] : [];
  });
  if (riskDays.length) coming.push(`Watch: ${riskDays.slice(0,2).join(', ')} historically break on weekends`);

  // ── Section 4: The gap — actual vs what was predicted ─────────────────────
  // Predict last week's savings from the week before that trajectory
  let gap = null;
  if (prevExpTotal > 0 && thisExpTotal > 0) {
    const twoWeekAgoStart = new Date(prevWeekStart); twoWeekAgoStart.setDate(twoWeekAgoStart.getDate()-7);
    const twoWeekAgoEnd   = new Date(prevWeekStart); twoWeekAgoEnd.setDate(twoWeekAgoEnd.getDate()-1);
    const twoAgoExp = (expenses||[]).filter(e=>inWeek(e.date,twoWeekAgoStart,twoWeekAgoEnd)).reduce((s,e)=>s+Number(e.amount||0),0);
    if (twoAgoExp > 0) {
      const predicted = twoAgoExp; // last week should have been similar to week before
      const actual    = thisExpTotal;
      const diff      = actual - predicted;
      if (Math.abs(diff) > 20) {
        gap = {
          label: diff > 0 ? `Spent ${cur}${fmtN(Math.abs(Math.round(diff)))} more than expected` : `Spent ${cur}${fmtN(Math.abs(Math.round(diff)))} less than expected`,
          good: diff <= 0,
        };
      }
    }
  }

  // ── Section 5: One rotating reflection question ────────────────────────────
  const QUESTIONS = [
    "What was the one decision this week that had the most impact — positive or negative?",
    "Where did your time and money go that surprised you?",
    "Which habit is getting easier, and which one still feels like work?",
    "What would you tell yourself on Monday if you could go back?",
    "What's one thing you'd want to repeat next week, and one thing to skip?",
    "Did your spending this week reflect your actual priorities?",
    "What was the hardest moment this week, and how did you handle it?",
    "If you could only keep one habit going next week, which one matters most?",
  ];
  const weekNum   = Math.floor((now - new Date(now.getFullYear(),0,1)) / (7*86400000));
  const question  = QUESTIONS[weekNum % QUESTIONS.length];

  return {
    weekLabel: `${wStr(weekStart)} – ${wStr(weekEnd)}`,
    weekStart: wStr(weekStart),
    moved, did, coming, gap, question,
    raw: { thisExpTotal, thisIncTotal, thisSaved, habitConsistency, avgMood, avgSleep, vitalsCount: thisWeekVit.length },
    cur,
  };
}

function WeeklyReviewModal({ open, onClose, data, actions }) {
  const snap  = useMemo(() => open ? computeWeeklySnapshot(data) : null, [open]);
  const [reflection, setReflection] = useState('');
  const [saved, setSaved]           = useState(false);

  useEffect(() => { if (open) { setReflection(''); setSaved(false); } }, [open]);

  const save = () => {
    if (!snap) return;
    const body = [
      `📊 What moved: ${snap.moved.map(m=>m.label+' '+m.value).join(' · ')}`,
      `✅ Did: ${snap.did.join(' · ')}`,
      snap.coming.length ? `🔭 Coming: ${snap.coming.join(' · ')}` : '',
      snap.gap ? `📐 Gap: ${snap.gap.label}` : '',
      reflection ? `💬 Reflection: ${reflection}` : '',
    ].filter(Boolean).join('\n');
    actions.addChronicle({ id:Date.now(), emoji:'📋', title:`Weekly Review — ${snap.weekLabel}`, body, date:today() });
    setSaved(true);
    setTimeout(onClose, 900);
  };

  if (!open || !snap) return null;

  const { moved, did, coming, gap, question, weekLabel, raw, cur } = snap;
  const SEV = (good) => good ? T.emerald : T.rose;

  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', zIndex:3000, display:'flex', alignItems:'center', justifyContent:'center', padding:20, backdropFilter:'blur(6px)' }}>
      <div onClick={e=>e.stopPropagation()} style={{ width:'100%', maxWidth:600, maxHeight:'92vh', overflowY:'auto', borderRadius:22, background:T.bg1, border:`1px solid ${T.border}`, animation:'modalIn 0.28s ease' }}>
        {/* Header */}
        <div style={{ padding:'22px 28px 0', display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
          <div>
            <div style={{ fontSize:9, fontFamily:T.fM, color:T.accent, letterSpacing:'0.14em', textTransform:'uppercase', marginBottom:5, fontWeight:700 }}>📋 Weekly Review</div>
            <h2 style={{ fontSize:20, fontFamily:T.fD, fontWeight:800, color:T.text }}>{weekLabel}</h2>
          </div>
          <button onClick={onClose} style={{ color:T.textSub, background:'none', border:'none', cursor:'pointer', fontSize:20, lineHeight:1, padding:'2px 4px' }}>×</button>
        </div>

        <div style={{ padding:'18px 28px 28px', display:'flex', flexDirection:'column', gap:20 }}>

          {/* Section 1 — What moved */}
          <div>
            <div style={{ fontSize:9, fontFamily:T.fM, color:T.textSub, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:10, fontWeight:700 }}>1 · What moved this week</div>
            {moved.length === 0 ? (
              <div style={{ fontSize:11, fontFamily:T.fM, color:T.textMuted }}>Log expenses, habits, or vitals to see what moved.</div>
            ) : (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:8 }}>
                {moved.map((m,i) => (
                  <div key={i} style={{ padding:'12px 14px', borderRadius:T.r, background:T.surface, border:`1px solid ${SEV(m.good)}33` }}>
                    <div style={{ fontSize:9, fontFamily:T.fM, color:T.textSub, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:5 }}>{m.label}</div>
                    <div style={{ fontSize:18, fontFamily:T.fD, fontWeight:700, color:SEV(m.good), marginBottom:3 }}>{m.value}</div>
                    <div style={{ fontSize:9, fontFamily:T.fM, color:m.delta!=null?(m.good?T.emerald:T.rose):T.textSub }}>{m.deltaLabel}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 2 — What you did */}
          <div>
            <div style={{ fontSize:9, fontFamily:T.fM, color:T.textSub, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:10, fontWeight:700 }}>2 · What you did</div>
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
              {did.map((d,i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 12px', borderRadius:T.r, background:T.surface, border:`1px solid ${T.border}` }}>
                  <span style={{ color:T.accent, fontSize:12, flexShrink:0 }}>✓</span>
                  <span style={{ fontSize:11, fontFamily:T.fM, color:T.text }}>{d}</span>
                </div>
              ))}
              {did.length === 0 && <div style={{ fontSize:11, fontFamily:T.fM, color:T.textMuted }}>Nothing logged this week yet.</div>}
            </div>
          </div>

          {/* Section 3 — What's coming */}
          {coming.length > 0 && (
            <div>
              <div style={{ fontSize:9, fontFamily:T.fM, color:T.textSub, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:10, fontWeight:700 }}>3 · What's coming next week</div>
              <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                {coming.map((c,i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 12px', borderRadius:T.r, background:`${T.amber}08`, border:`1px solid ${T.amber}25` }}>
                    <span style={{ color:T.amber, fontSize:12, flexShrink:0 }}>→</span>
                    <span style={{ fontSize:11, fontFamily:T.fM, color:T.text }}>{c}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 4 — The gap */}
          {gap && (
            <div style={{ padding:'12px 16px', borderRadius:T.r, background:`${SEV(gap.good)}08`, border:`1px solid ${SEV(gap.good)}33`, display:'flex', gap:10, alignItems:'center' }}>
              <span style={{ fontSize:18, flexShrink:0 }}>{gap.good ? '📉' : '📈'}</span>
              <div>
                <div style={{ fontSize:9, fontFamily:T.fM, color:T.textSub, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:3, fontWeight:700 }}>4 · vs last week's trajectory</div>
                <div style={{ fontSize:12, fontFamily:T.fM, color:T.text }}>{gap.label}</div>
              </div>
            </div>
          )}

          {/* Section 5 — One question */}
          <div>
            <div style={{ fontSize:9, fontFamily:T.fM, color:'#c084fc', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:8, fontWeight:700 }}>5 · Reflection</div>
            <div style={{ fontSize:12, fontFamily:T.fD, fontWeight:600, color:T.text, marginBottom:10, lineHeight:1.5 }}>{question}</div>
            <textarea
              value={reflection}
              onChange={e=>setReflection(e.target.value)}
              placeholder="Your answer (optional — saved to Chronicles)"
              rows={3}
              style={{ width:'100%', padding:'10px 14px', background:'rgba(255,255,255,0.04)', border:`1px solid ${T.border}`, borderRadius:T.r, fontFamily:T.fM, fontSize:12, color:T.text, resize:'vertical', lineHeight:1.6 }}
            />
          </div>

          {/* Actions */}
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={onClose} style={{ padding:'10px 20px', borderRadius:T.r, background:T.surface, border:`1px solid ${T.border}`, fontFamily:T.fM, fontSize:11, color:T.textSub, cursor:'pointer' }}>
              Skip
            </button>
            <button onClick={save} style={{ flex:1, padding:'10px 20px', borderRadius:T.r, background:saved?T.emeraldDim:T.accentDim, border:`1px solid ${saved?T.emerald:T.accent}44`, fontFamily:T.fM, fontSize:11, fontWeight:700, color:saved?T.emerald:T.accent, cursor:'pointer', transition:'all 0.2s' }}>
              {saved ? '✓ Saved to Chronicles!' : 'Save to Chronicles'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MonthlyReviewModal({ open, onClose, data, actions }) {
  const {expenses=[],incomes=[],habits=[],habitLogs={},vitals=[],goals=[],settings={}}=data;
  const cur=settings.currency||'$';
  const m=today().slice(0,7);
  const prevDate=new Date(m+'-01'); prevDate.setMonth(prevDate.getMonth()-1);
  const prevM=prevDate.toISOString().slice(0,7);
  const mExp=(expenses||[]).filter(e=>e.date?.startsWith(m)).reduce((s,e)=>s+Number(e.amount||0),0);
  const mInc=(incomes||[]).filter(i=>i.date?.startsWith(m)).reduce((s,i)=>s+Number(i.amount||0),0);
  const pExp=(expenses||[]).filter(e=>e.date?.startsWith(prevM)).reduce((s,e)=>s+Number(e.amount||0),0);
  const pInc=(incomes||[]).filter(i=>i.date?.startsWith(prevM)).reduce((s,i)=>s+Number(i.amount||0),0);
  const habitScore=(habits||[]).length>0?Math.round(((habits||[]).filter(h=>(habitLogs[h.id]||[]).some(d=>d.startsWith(m))).length/(habits||[]).length)*100):0;
  const mVitals=(vitals||[]).filter(v=>v.date?.startsWith(m));
  const avgSleep=mVitals.length>0?(mVitals.reduce((s,v)=>s+Number(v.sleep||0),0)/mVitals.length).toFixed(1):'—';
  const [wins,setWins]=useState('');
  const [reflection,setReflection]=useState('');
  const [nextFocus,setNextFocus]=useState('');
  const save=()=>{
    actions.addChronicle({id:Date.now(),emoji:'📅',title:`Monthly Review — ${m}`,body:`🏆 Wins: ${wins}\n💭 Reflection: ${reflection}\n🎯 Next month: ${nextFocus}`,date:today()});
    onClose();
  };
  if(!open) return null;
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.8)',zIndex:3000,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
      <div style={{width:'100%',maxWidth:560,maxHeight:'90vh',overflowY:'auto',borderRadius:20,background:T.bg,border:`1px solid ${T.border}`,padding:'28px 32px'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:22}}>
          <h2 style={{fontSize:18,fontFamily:T.fD,fontWeight:800,color:T.text}}>📅 Monthly Review — {m}</h2>
          <button onClick={onClose} style={{fontSize:20,color:T.textSub,background:'none',border:'none',cursor:'pointer'}}>×</button>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:20}}>
          {[
            {label:'Income',val:`${cur}${fmtN(mInc)}`,sub:pInc>0?`${mInc>=pInc?'↑':'↓'} vs ${cur}${fmtN(pInc)} last mo`:'',color:T.emerald},
            {label:'Spent',val:`${cur}${fmtN(mExp)}`,sub:pExp>0?`${mExp<=pExp?'↓ less':'↑ more'} than last mo`:'',color:T.rose},
            {label:'Saved',val:`${cur}${fmtN(mInc-mExp)}`,sub:`${mInc>0?((( mInc-mExp)/mInc)*100).toFixed(0):0}% rate`,color:(mInc-mExp)>=0?T.accent:T.rose},
            {label:'Habit Score',val:`${habitScore}%`,sub:`${(habits||[]).filter(h=>(habitLogs[h.id]||[]).some(d=>d.startsWith(m))).length}/${(habits||[]).length} active`,color:T.violet},
            {label:'Avg Sleep',val:`${avgSleep}h`,sub:'this month',color:T.sky},
            {label:'Goals',val:(goals||[]).length,sub:`${(goals||[]).filter(g=>Number(g.current||0)>=Number(g.target||1)).length} completed`,color:T.amber},
          ].map((s,i)=>(
            <div key={i} style={{padding:'12px 14px',borderRadius:T.r,background:T.surface,border:`1px solid ${T.border}`}}>
              <div style={{fontSize:9,fontFamily:T.fM,color:T.textSub,letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:4}}>{s.label}</div>
              <div style={{fontSize:16,fontFamily:T.fD,fontWeight:700,color:s.color}}>{s.val}</div>
              {s.sub&&<div style={{fontSize:9,fontFamily:T.fM,color:T.textSub,marginTop:2}}>{s.sub}</div>}
            </div>
          ))}
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          {[['🏆 Wins & highlights',wins,setWins,'What went well?'],['💭 Reflection',reflection,setReflection,'What to improve?'],].map(([label,val,set,ph])=>(
            <div key={label}><div style={{fontSize:10,fontFamily:T.fM,color:T.textSub,marginBottom:6}}>{label}</div>
              <textarea value={val} onChange={e=>set(e.target.value)} placeholder={ph} rows={2} style={{width:'100%',padding:'9px 12px',background:'rgba(255,255,255,0.04)',border:`1px solid ${T.border}`,borderRadius:T.r,fontFamily:T.fM,fontSize:12,color:T.text,resize:'vertical'}} /></div>
          ))}
          <div><div style={{fontSize:10,fontFamily:T.fM,color:T.textSub,marginBottom:6}}>🎯 Main focus next month</div>
            <Input value={nextFocus} onChange={e=>setNextFocus(e.target.value)} placeholder="One key priority…" /></div>
        </div>
        <div style={{display:'flex',gap:10,marginTop:20}}>
          <button onClick={onClose} style={{padding:'10px 20px',borderRadius:T.r,background:T.surface,border:`1px solid ${T.border}`,fontFamily:T.fM,fontSize:11,color:T.textSub,cursor:'pointer'}}>Cancel</button>
          <Btn onClick={save} color={T.accent} style={{flex:1}}>Save to Chronicles</Btn>
        </div>
      </div>
    </div>
  );
}

// ── PIN LOCK OVERLAY ──────────────────────────────────────────────────────────
function PinLockOverlay({ pin, onUnlock }) {
  const [input,setInput]=useState('');
  const [shake,setShake]=useState(false);
  const tryPin=(val)=>{ if(val===pin){onUnlock();}else if(val.length>=pin.length){setShake(true);setInput('');setTimeout(()=>setShake(false),400);} };
  const addDigit=(d)=>{ const next=input+d; setInput(next); tryPin(next); };
  return (
    <div style={{position:'fixed',inset:0,background:T.bg,zIndex:99999,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:28}}>
      <div style={{fontSize:26,fontFamily:T.fD,fontWeight:800,color:T.text}}>LifeOS 🔒</div>
      <div style={{display:'flex',gap:14,animation:shake?'shake 0.4s ease':''}}>
        {Array.from({length:pin.length},(_,i)=>(
          <div key={i} style={{width:14,height:14,borderRadius:'50%',background:input.length>i?T.accent:T.border,transition:'background 0.15s'}} />
        ))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,transform:shake?'translateX(-6px)':'none',transition:'transform 0.1s'}}>
        {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((d,i)=>(
          <button key={i} onClick={()=>d==='⌫'?setInput(p=>p.slice(0,-1)):d&&addDigit(d)} style={{width:64,height:64,borderRadius:'50%',background:d?T.surface:'transparent',border:`1px solid ${d?T.border:'transparent'}`,fontSize:18,fontFamily:T.fD,fontWeight:600,color:T.text,cursor:d?'pointer':'default'}}>
            {d}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── COURSE TRACKER ────────────────────────────────────────────────────────────
function CourseTrackerTab({ data, actions }) {
  const [courses,setCourses]=useLocalStorage('los_courses',[]);
  const [modal,setModal]=useState(false);
  const [title,setTitle]=useState(''); const [url,setUrl]=useState('');
  const [platform,setPlatform]=useState('Udemy'); const [total,setTotal]=useState('');
  const add=()=>{ if(!title.trim())return; setCourses(p=>[...p,{id:Date.now(),title:title.trim(),url,platform,totalLessons:Number(total)||0,done:[],startDate:today()}]); setTitle('');setUrl('');setTotal('');setModal(false); };
  const toggleLesson=(cid,n)=>setCourses(p=>p.map(c=>c.id===cid?{...c,done:c.done.includes(n)?c.done.filter(x=>x!==n):[...c.done,n]}:c));
  return (
    <div style={{display:'flex',flexDirection:'column',gap:14}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div><div style={{fontSize:13,fontFamily:T.fD,fontWeight:700,color:T.text}}>Course Tracker</div><div style={{fontSize:10,fontFamily:T.fM,color:T.textSub}}>Track your learning progress</div></div>
        <Btn onClick={()=>setModal(true)} color={T.violet}>+ Add Course</Btn>
      </div>
      {modal&&(
        <GlassCard style={{padding:'16px 18px'}}>
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            <Input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Course title" autoFocus />
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
              <Select value={platform} onChange={e=>setPlatform(e.target.value)}>{['Udemy','Coursera','YouTube','edX','LinkedIn Learning','Skillshare','Other'].map(p=><option key={p}>{p}</option>)}</Select>
              <Input type="number" value={total} onChange={e=>setTotal(e.target.value)} placeholder="Total lessons" />
            </div>
            <Input value={url} onChange={e=>setUrl(e.target.value)} placeholder="URL (optional)" />
            <div style={{display:'flex',gap:8}}>
              <Btn onClick={add} color={T.violet} style={{flex:1}}>Add Course</Btn>
              <button onClick={()=>setModal(false)} style={{padding:'8px 16px',borderRadius:T.r,background:T.surface,border:`1px solid ${T.border}`,fontFamily:T.fM,fontSize:11,color:T.textSub,cursor:'pointer'}}>Cancel</button>
            </div>
          </div>
        </GlassCard>
      )}
      {courses.length===0&&!modal&&<GlassCard style={{padding:40,textAlign:'center'}}><div style={{fontSize:11,fontFamily:T.fM,color:T.textMuted}}>No courses yet. Start tracking your learning!</div></GlassCard>}
      {courses.map(c=>{
        const pct=c.totalLessons>0?Math.round((c.done.length/c.totalLessons)*100):0;
        const col=pct===100?T.emerald:T.violet;
        return (
          <GlassCard key={c.id} style={{padding:'18px 20px'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
              <div>
                <div style={{fontSize:13,fontFamily:T.fD,fontWeight:700,color:T.text}}>{c.title}</div>
                <div style={{fontSize:10,fontFamily:T.fM,color:T.textSub,marginTop:2}}>{c.platform}{c.url&&<> · <a href={c.url} target="_blank" rel="noreferrer" style={{color:T.accent}}>Open ↗</a></>}</div>
              </div>
              <div style={{display:'flex',gap:6,alignItems:'center'}}>
                {pct===100&&<Badge color={T.emerald}>✓ Done</Badge>}
                <button onClick={()=>setCourses(p=>p.filter(x=>x.id!==c.id))} style={{padding:4,borderRadius:6,background:T.surface,border:`1px solid ${T.border}`,opacity:0.4}}><IcoTrash size={10} stroke={T.rose} /></button>
              </div>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:6,fontSize:10,fontFamily:T.fM}}><span style={{color:T.textSub}}>Progress</span><span style={{color:col,fontWeight:600}}>{c.done.length}/{c.totalLessons||'?'} · {pct}%</span></div>
            <ProgressBar pct={pct} color={col} height={6} />
            {c.totalLessons>0&&(
              <div style={{display:'flex',gap:3,marginTop:10,flexWrap:'wrap'}}>
                {Array.from({length:Math.min(c.totalLessons,40)},(_,i)=>i+1).map(n=>(
                  <button key={n} onClick={()=>toggleLesson(c.id,n)} style={{width:18,height:18,borderRadius:3,background:c.done.includes(n)?col+'44':T.surface,border:`1px solid ${c.done.includes(n)?col+'88':T.border}`,cursor:'pointer',fontSize:8,color:c.done.includes(n)?col:T.textMuted,display:'flex',alignItems:'center',justifyContent:'center'}}>{c.done.includes(n)?'✓':n}</button>
                ))}
                {c.totalLessons>40&&<span style={{fontSize:9,fontFamily:T.fM,color:T.textSub}}>+{c.totalLessons-40} more</span>}
              </div>
            )}
          </GlassCard>
        );
      })}
    </div>
  );
}

// ── TIME CAPSULE ──────────────────────────────────────────────────────────────
function TimeCapsuleTab({ data, actions }) {
  const [capsules,setCapsules]=useLocalStorage('los_capsules',[]);
  const [modal,setModal]=useState(false);
  const [title,setTitle]=useState(''); const [msg,setMsg]=useState('');
  const [openDate,setOpenDate]=useState(''); const [emoji,setEmoji]=useState('📦');
  const add=()=>{ if(!title.trim()||!openDate)return; setCapsules(p=>[...p,{id:Date.now(),title:title.trim(),message:msg,emoji,createdAt:today(),openDate}]); setTitle('');setMsg('');setOpenDate('');setModal(false); };
  const now=today();
  const ready=capsules.filter(c=>c.openDate<=now);
  const locked=capsules.filter(c=>c.openDate>now);
  return (
    <div style={{display:'flex',flexDirection:'column',gap:14}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div><div style={{fontSize:13,fontFamily:T.fD,fontWeight:700,color:T.text}}>Time Capsule</div><div style={{fontSize:10,fontFamily:T.fM,color:T.textSub}}>Messages to your future self</div></div>
        <Btn onClick={()=>setModal(true)} color={T.violet}>+ Create</Btn>
      </div>
      {modal&&(
        <GlassCard style={{padding:'16px 18px'}}>
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            <div style={{display:'flex',gap:8}}>
              <Input value={emoji} onChange={e=>setEmoji(e.target.value)} style={{width:54,textAlign:'center',fontSize:20}} />
              <Input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Capsule title…" style={{flex:1}} />
            </div>
            <textarea value={msg} onChange={e=>setMsg(e.target.value)} placeholder="Write a message to your future self…" rows={3} style={{width:'100%',padding:'9px 12px',background:'rgba(255,255,255,0.04)',border:`1px solid ${T.border}`,borderRadius:T.r,fontFamily:T.fM,fontSize:12,color:T.text,resize:'vertical'}} />
            <div><div style={{fontSize:10,fontFamily:T.fM,color:T.textSub,marginBottom:6}}>Open on</div><Input type="date" value={openDate} onChange={e=>setOpenDate(e.target.value)} min={today()} /></div>
            <div style={{display:'flex',gap:8}}>
              <Btn onClick={add} color={T.violet} style={{flex:1}}>Seal Capsule 🔒</Btn>
              <button onClick={()=>setModal(false)} style={{padding:'8px 16px',borderRadius:T.r,background:T.surface,border:`1px solid ${T.border}`,fontFamily:T.fM,fontSize:11,color:T.textSub,cursor:'pointer'}}>Cancel</button>
            </div>
          </div>
        </GlassCard>
      )}
      {ready.length>0&&(
        <div>
          <div style={{fontSize:10,fontFamily:T.fM,color:T.emerald,letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:8}}>🎉 Ready to Open</div>
          {ready.map(c=>(
            <GlassCard key={c.id} style={{padding:'18px',marginBottom:10,borderLeft:`3px solid ${T.emerald}55`}}>
              <div style={{display:'flex',gap:12,alignItems:'flex-start'}}>
                <div style={{fontSize:28}}>{c.emoji}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontFamily:T.fD,fontWeight:700,color:T.text,marginBottom:4}}>{c.title}</div>
                  <div style={{fontSize:11,fontFamily:T.fM,color:T.textSub,lineHeight:1.6,marginBottom:8,whiteSpace:'pre-wrap'}}>{c.message}</div>
                  <div style={{fontSize:9,fontFamily:T.fM,color:T.textMuted}}>Written {c.createdAt} · Opened {c.openDate}</div>
                </div>
                <button onClick={()=>setCapsules(p=>p.filter(x=>x.id!==c.id))} style={{padding:4,borderRadius:6,background:T.surface,border:`1px solid ${T.border}`,opacity:0.4,flexShrink:0}}><IcoTrash size={10} stroke={T.rose} /></button>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
      {locked.length>0&&(
        <div>
          <div style={{fontSize:10,fontFamily:T.fM,color:T.textSub,letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:8}}>🔒 Sealed</div>
          {locked.sort((a,b)=>a.openDate<b.openDate?-1:1).map(c=>{
            const days=Math.ceil((new Date(c.openDate)-new Date())/86400000);
            return (
              <GlassCard key={c.id} style={{padding:'14px 18px',marginBottom:8,opacity:0.7}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <div style={{display:'flex',gap:10,alignItems:'center'}}>
                    <div style={{fontSize:22}}>{c.emoji}</div>
                    <div>
                      <div style={{fontSize:12,fontFamily:T.fD,fontWeight:600,color:T.text}}>{c.title}</div>
                      <div style={{fontSize:9,fontFamily:T.fM,color:T.textSub}}>Opens in {days} day{days!==1?'s':''} · {c.openDate}</div>
                    </div>
                  </div>
                  <button onClick={()=>setCapsules(p=>p.filter(x=>x.id!==c.id))} style={{padding:4,borderRadius:6,background:T.surface,border:`1px solid ${T.border}`,opacity:0.4}}><IcoTrash size={10} stroke={T.rose} /></button>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}
      {capsules.length===0&&!modal&&<GlassCard style={{padding:40,textAlign:'center'}}><div style={{fontSize:11,fontFamily:T.fM,color:T.textMuted}}>No capsules yet. Write a message to your future self!</div></GlassCard>}
    </div>
  );
}

// ── TRADE JOURNAL ─────────────────────────────────────────────────────────────
function TradeJournalTab() {
  const [trades,setTrades]=useLocalStorage('los_trades',[]);
  const [modal,setModal]=useState(false);
  const [sym,setSym]=useState(''); const [type,setType]=useState('Buy');
  const [qty,setQty]=useState(''); const [price,setPrice]=useState('');
  const [exit,setExit]=useState(''); const [note,setNote]=useState('');
  const [date,setDate]=useState(today());
  const add=()=>{
    if(!sym.trim()||!qty||!price)return;
    const entry=Number(price); const ex=Number(exit)||0;
    const pnl=ex>0?(type==='Buy'||type==='Cover'?(ex-entry)*Number(qty):(entry-ex)*Number(qty)):null;
    setTrades(p=>[{id:Date.now(),sym:sym.trim().toUpperCase(),type,qty:Number(qty),price:entry,exitPrice:ex,pnl,note,date},...p]);
    setSym('');setQty('');setPrice('');setExit('');setNote('');setModal(false);
  };
  const totalPnl=trades.filter(t=>t.pnl!==null).reduce((s,t)=>s+(t.pnl||0),0);
  const wins=trades.filter(t=>t.pnl!=null&&t.pnl>0).length;
  const losses=trades.filter(t=>t.pnl!=null&&t.pnl<0).length;
  return (
    <div style={{display:'flex',flexDirection:'column',gap:14}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div>
          <div style={{fontSize:13,fontFamily:T.fD,fontWeight:700,color:T.text}}>Trade Journal</div>
          {trades.length>0&&<div style={{fontSize:10,fontFamily:T.fM,color:T.textSub,marginTop:2}}>P&amp;L: <span style={{color:totalPnl>=0?T.emerald:T.rose,fontWeight:600}}>{totalPnl>=0?'+':''}{fmtN(totalPnl)}</span> · {wins}W / {losses}L</div>}
        </div>
        <Btn onClick={()=>setModal(true)} color={T.accent}>+ Log Trade</Btn>
      </div>
      {modal&&(
        <GlassCard style={{padding:'16px 18px'}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:8}}>
            <Input value={sym} onChange={e=>setSym(e.target.value)} placeholder="Symbol (AAPL…)" />
            <Select value={type} onChange={e=>setType(e.target.value)}>{['Buy','Sell','Short','Cover'].map(t=><option key={t}>{t}</option>)}</Select>
            <Input type="number" value={qty} onChange={e=>setQty(e.target.value)} placeholder="Quantity" />
            <Input type="number" value={price} onChange={e=>setPrice(e.target.value)} placeholder="Entry price" />
            <Input type="number" value={exit} onChange={e=>setExit(e.target.value)} placeholder="Exit price (optional)" />
            <Input type="date" value={date} onChange={e=>setDate(e.target.value)} />
          </div>
          <Input value={note} onChange={e=>setNote(e.target.value)} placeholder="Rationale / notes…" style={{marginBottom:8}} />
          <div style={{display:'flex',gap:8}}>
            <Btn onClick={add} color={T.accent} style={{flex:1}}>Save Trade</Btn>
            <button onClick={()=>setModal(false)} style={{padding:'8px 16px',borderRadius:T.r,background:T.surface,border:`1px solid ${T.border}`,fontFamily:T.fM,fontSize:11,color:T.textSub,cursor:'pointer'}}>Cancel</button>
          </div>
        </GlassCard>
      )}
      {trades.length===0&&!modal&&<GlassCard style={{padding:40,textAlign:'center'}}><div style={{fontSize:11,fontFamily:T.fM,color:T.textMuted}}>No trades logged yet. Record your first position.</div></GlassCard>}
      {trades.map((t,i)=>{
        const hasPnl=t.pnl!==null&&t.pnl!==undefined;
        const col=!hasPnl?T.textSub:t.pnl>=0?T.emerald:T.rose;
        return (
          <GlassCard key={t.id||i} style={{padding:'14px 18px'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
              <div>
                <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:4}}>
                  <span style={{fontSize:14,fontFamily:T.fD,fontWeight:700,color:T.text}}>{t.sym}</span>
                  <Badge color={t.type==='Buy'||t.type==='Cover'?T.emerald:T.rose}>{t.type}</Badge>
                  {hasPnl&&<Badge color={col}>{t.pnl>=0?'+':''}{fmtN(t.pnl)}</Badge>}
                </div>
                <div style={{fontSize:10,fontFamily:T.fM,color:T.textSub}}>{t.qty} × ${fmtN(t.price)}{t.exitPrice>0?` → $${fmtN(t.exitPrice)}`:''} · {t.date}</div>
                {t.note&&<div style={{fontSize:10,fontFamily:T.fM,color:T.textSub,marginTop:4,fontStyle:'italic'}}>{t.note}</div>}
              </div>
              <button onClick={()=>setTrades(p=>p.filter(x=>x.id!==t.id))} style={{padding:4,borderRadius:6,background:T.surface,border:`1px solid ${T.border}`,opacity:0.4}}><IcoTrash size={10} stroke={T.rose} /></button>
            </div>
          </GlassCard>
        );
      })}
    </div>
  );
}

// ── WATCHLIST & PRICE ALERTS ──────────────────────────────────────────────────
function WatchlistTab() {
  const [watchlist,setWatchlist]=useLocalStorage('los_watchlist',[]);
  const [prices,setPrices]=useState({});
  const [loading,setLoading]=useState(false);
  const [sym,setSym]=useState(''); const [hi,setHi]=useState(''); const [lo,setLo]=useState('');
  const addWatch=()=>{ if(!sym.trim())return; const s=sym.trim().toUpperCase(); setWatchlist(p=>p.some(x=>x.sym===s)?p:[...p,{id:Date.now(),sym:s,alertHigh:Number(hi)||null,alertLow:Number(lo)||null}]); setSym('');setHi('');setLo(''); };
  const COIN_IDS={BTC:'bitcoin',ETH:'ethereum',SOL:'solana',BNB:'binancecoin',ADA:'cardano',XRP:'ripple',DOGE:'dogecoin',AVAX:'avalanche-2',DOT:'polkadot',MATIC:'matic-network',LINK:'chainlink',UNI:'uniswap'};
  const refresh=async()=>{
    setLoading(true);
    try {
      const syms=watchlist.filter(w=>COIN_IDS[w.sym]);
      if(syms.length>0){
        const ids=syms.map(w=>COIN_IDS[w.sym]).join(',');
        const res=await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`);
        const d=await res.json();
        const update={};
        syms.forEach(w=>{ const id=COIN_IDS[w.sym]; if(d[id]) update[w.sym]={price:d[id].usd,change:d[id].usd_24h_change?.toFixed(2)||'0'}; });
        setPrices(p=>({...p,...update}));
      }
    } catch{}
    setLoading(false);
  };
  const triggered=watchlist.filter(w=>prices[w.sym]&&((w.alertHigh&&prices[w.sym].price>=w.alertHigh)||(w.alertLow&&prices[w.sym].price<=w.alertLow)));
  return (
    <div style={{display:'flex',flexDirection:'column',gap:14}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div><div style={{fontSize:13,fontFamily:T.fD,fontWeight:700,color:T.text}}>Watchlist & Alerts</div><div style={{fontSize:10,fontFamily:T.fM,color:T.textSub}}>Crypto prices via CoinGecko</div></div>
        <Btn onClick={refresh} color={T.sky} style={{opacity:loading?0.5:1}}>{loading?'…':'↻ Refresh'}</Btn>
      </div>
      {triggered.length>0&&<div style={{padding:'10px 14px',borderRadius:T.r,background:`${T.amber}11`,border:`1px solid ${T.amber}44`,fontSize:11,fontFamily:T.fM,color:T.amber}}>🔔 Alert: {triggered.map(w=>w.sym).join(', ')} hit your price target!</div>}
      <GlassCard style={{padding:'14px 18px'}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:8}}>
          <Input value={sym} onChange={e=>setSym(e.target.value)} placeholder="BTC, ETH, SOL…" onKeyDown={e=>e.key==='Enter'&&addWatch()} />
          <Input type="number" value={hi} onChange={e=>setHi(e.target.value)} placeholder="Alert high $" />
          <Input type="number" value={lo} onChange={e=>setLo(e.target.value)} placeholder="Alert low $" />
        </div>
        <Btn onClick={addWatch} color={T.accent} style={{width:'100%'}}>+ Add to Watchlist</Btn>
      </GlassCard>
      {watchlist.length===0?<GlassCard style={{padding:40,textAlign:'center'}}><div style={{fontSize:11,fontFamily:T.fM,color:T.textMuted}}>Add crypto symbols to watch. Supported: BTC, ETH, SOL, BNB, ADA, XRP, DOGE, AVAX…</div></GlassCard>:
        watchlist.map(w=>{
          const p=prices[w.sym];
          const alert=p&&((w.alertHigh&&p.price>=w.alertHigh)||(w.alertLow&&p.price<=w.alertLow));
          const ch=Number(p?.change||0);
          return (
            <GlassCard key={w.id} style={{padding:'14px 18px',borderLeft:alert?`3px solid ${T.amber}`:'none'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div>
                  <div style={{display:'flex',gap:8,alignItems:'center'}}>
                    <span style={{fontSize:14,fontFamily:T.fD,fontWeight:700,color:T.text}}>{w.sym}</span>
                    {alert&&<span>🔔</span>}
                  </div>
                  <div style={{fontSize:9,fontFamily:T.fM,color:T.textSub,marginTop:3}}>
                    {w.alertHigh?`↑ $${fmtN(w.alertHigh)} `:''}{w.alertLow?`↓ $${fmtN(w.alertLow)}`:''}
                  </div>
                </div>
                <div style={{display:'flex',gap:10,alignItems:'center'}}>
                  {p?<div style={{textAlign:'right'}}>
                    <div style={{fontSize:15,fontFamily:T.fD,fontWeight:700,color:T.text}}>${fmtN(p.price)}</div>
                    <div style={{fontSize:10,fontFamily:T.fM,color:ch>=0?T.emerald:T.rose}}>{ch>=0?'+':''}{ch}% 24h</div>
                  </div>:<div style={{fontSize:10,fontFamily:T.fM,color:T.textMuted}}>— refresh to load</div>}
                  <button onClick={()=>setWatchlist(p=>p.filter(x=>x.id!==w.id))} style={{padding:4,borderRadius:6,background:T.surface,border:`1px solid ${T.border}`,opacity:0.4}}><IcoTrash size={10} stroke={T.rose} /></button>
                </div>
              </div>
            </GlassCard>
          );
        })
      }
    </div>
  );
}

// ── INVESTOR PROFILE ──────────────────────────────────────────────────────────
function InvestorProfileTab({ data }) {
  const {investments=[],settings={}}=data;
  const cur=settings.currency||'$';
  const [profile,setProfile]=useLocalStorage('los_investor_profile',{risk:'moderate',horizon:'long',style:'passive',target_return:8,notes:''});
  const typeBreakdown=(investments||[]).reduce((acc,inv)=>{ acc[inv.type]=(acc[inv.type]||0)+Number(inv.quantity||0)*Number(inv.currentPrice||inv.buyPrice||0); return acc; },{});
  const totalVal=Object.values(typeBreakdown).reduce((s,v)=>s+v,0);
  const RISK=[{id:'conservative',label:'Conservative',desc:'Preserve capital',emoji:'🛡️',color:T.sky},{id:'moderate',label:'Moderate',desc:'Balanced growth',emoji:'⚖️',color:T.amber},{id:'aggressive',label:'Aggressive',desc:'Max growth',emoji:'🚀',color:T.rose}];
  const upd=(k,v)=>setProfile(p=>({...p,[k]:v}));
  return (
    <div style={{display:'flex',flexDirection:'column',gap:14}}>
      <div style={{fontSize:13,fontFamily:T.fD,fontWeight:700,color:T.text}}>Investor Profile</div>
      <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
        {RISK.map(rp=>(
          <GlassCard key={rp.id} onClick={()=>upd('risk',rp.id)} style={{padding:'14px 18px',flex:1,minWidth:130,cursor:'pointer',borderColor:profile.risk===rp.id?`${rp.color}55`:T.border,background:profile.risk===rp.id?`${rp.color}11`:T.surface}}>
            <div style={{fontSize:22,marginBottom:6}}>{rp.emoji}</div>
            <div style={{fontSize:12,fontFamily:T.fD,fontWeight:700,color:profile.risk===rp.id?rp.color:T.text}}>{rp.label}</div>
            <div style={{fontSize:10,fontFamily:T.fM,color:T.textSub,marginTop:3}}>{rp.desc}</div>
          </GlassCard>
        ))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
        <div><div style={{fontSize:10,fontFamily:T.fM,color:T.textSub,marginBottom:6}}>Time Horizon</div>
          <Select value={profile.horizon} onChange={e=>upd('horizon',e.target.value)}>{['short','medium','long'].map(h=><option key={h}>{h}</option>)}</Select></div>
        <div><div style={{fontSize:10,fontFamily:T.fM,color:T.textSub,marginBottom:6}}>Style</div>
          <Select value={profile.style} onChange={e=>upd('style',e.target.value)}>{['passive','active','value','growth','dividend','momentum'].map(s=><option key={s}>{s}</option>)}</Select></div>
        <div><div style={{fontSize:10,fontFamily:T.fM,color:T.textSub,marginBottom:6}}>Target Annual Return %</div>
          <Input type="number" value={profile.target_return} onChange={e=>upd('target_return',Number(e.target.value))} /></div>
      </div>
      <div><div style={{fontSize:10,fontFamily:T.fM,color:T.textSub,marginBottom:6}}>Investment Policy Notes</div>
        <textarea value={profile.notes} onChange={e=>upd('notes',e.target.value)} placeholder="Your rules, thesis, constraints…" rows={3} style={{width:'100%',padding:'9px 12px',background:'rgba(255,255,255,0.04)',border:`1px solid ${T.border}`,borderRadius:T.r,fontFamily:T.fM,fontSize:12,color:T.text,resize:'vertical'}} /></div>
      {totalVal>0&&(
        <GlassCard style={{padding:'18px 20px'}}>
          <SectionLabel>Current Allocation</SectionLabel>
          {Object.entries(typeBreakdown).map(([type,val])=>{
            const pct=(val/totalVal)*100;
            const col={Stock:T.emerald,ETF:T.sky,Crypto:T.violet,Bond:T.amber,REIT:T.accent,Other:T.rose}[type]||T.textSub;
            return (<div key={type} style={{marginBottom:10}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:4,fontSize:11,fontFamily:T.fM}}><span style={{color:T.text}}>{type}</span><span style={{color:col,fontWeight:600}}>{cur}{fmtN(val)} ({pct.toFixed(0)}%)</span></div>
              <ProgressBar pct={pct} color={col} height={5} />
            </div>);
          })}
        </GlassCard>
      )}
    </div>
  );
}

// ── ASSET DEPRECIATION ────────────────────────────────────────────────────────
function AssetDepreciationTab({ data }) {
  const {assets=[],settings={}}=data;
  const cur=settings.currency||'$';
  const depAssets=(assets||[]).filter(a=>['Vehicle','Other'].includes(a.type));
  if(depAssets.length===0) return <GlassCard style={{padding:40,textAlign:'center'}}><div style={{fontSize:11,fontFamily:T.fM,color:T.textMuted}}>Add Vehicle or Other assets to see estimated depreciation.</div></GlassCard>;
  return (
    <div style={{display:'flex',flexDirection:'column',gap:12}}>
      <div style={{fontSize:10,fontFamily:T.fM,color:T.textSub}}>Straight-line depreciation estimates</div>
      {depAssets.map((a,i)=>{
        const life=a.type==='Vehicle'?10:7;
        const annual=Number(a.value||0)/life;
        const monthly=annual/12;
        return (
          <GlassCard key={a.id||i} style={{padding:'16px 20px'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
              <div><div style={{fontSize:13,fontFamily:T.fD,fontWeight:700,color:T.text}}>{a.name}</div>
                <div style={{fontSize:10,fontFamily:T.fM,color:T.textSub,marginTop:2}}>{a.type} · {life}yr lifespan</div></div>
              <Badge color={T.rose}>{cur}{fmtN(annual)}/yr</Badge>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,fontSize:10,fontFamily:T.fM}}>
              {[['Current Value',cur+fmtN(a.value),T.text],['Monthly Cost',cur+fmtN(monthly),T.rose],['In 5 Years',cur+fmtN(Math.max(0,a.value-annual*5)),T.amber]].map(([l,v,c])=>(
                <div key={l} style={{textAlign:'center',padding:8,background:T.surface,borderRadius:T.r}}>
                  <div style={{color:T.textSub,marginBottom:2}}>{l}</div><div style={{color:c,fontWeight:600}}>{v}</div>
                </div>
              ))}
            </div>
          </GlassCard>
        );
      })}
    </div>
  );
}

// ── FOCUS BILLING ─────────────────────────────────────────────────────────────
function FocusBillingTab({ data }) {
  const {focusSessions=[],settings={}}=data;
  const cur=settings.currency||'$';
  const [rate,setRate]=useLocalStorage('los_hourly_rate',0);
  const [clientFilter,setClientFilter]=useState('All');
  const clients=['All',...new Set(focusSessions.filter(s=>s.client).map(s=>s.client))];
  const filtered=clientFilter==='All'?focusSessions:focusSessions.filter(s=>s.client===clientFilter);
  const totalMins=filtered.reduce((s,f)=>s+(Number(f.duration)||0),0);
  const billable=(totalMins/60)*Number(rate||0);
  return (
    <div style={{display:'flex',flexDirection:'column',gap:14}}>
      <SectionLabel>Focus Billing</SectionLabel>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
        <div><div style={{fontSize:10,fontFamily:T.fM,color:T.textSub,marginBottom:6}}>Hourly Rate ({cur})</div>
          <Input type="number" value={rate} onChange={e=>setRate(Number(e.target.value))} placeholder="e.g. 75" /></div>
        <div><div style={{fontSize:10,fontFamily:T.fM,color:T.textSub,marginBottom:6}}>Filter by client</div>
          <Select value={clientFilter} onChange={e=>setClientFilter(e.target.value)}>{clients.map(c=><option key={c}>{c}</option>)}</Select></div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}>
        {[{label:'Sessions',val:filtered.length,color:T.accent},{label:'Total Time',val:`${Math.floor(totalMins/60)}h ${totalMins%60}m`,color:T.violet},{label:'Billable',val:`${cur}${fmtN(billable)}`,color:T.emerald}].map((s,i)=>(
          <GlassCard key={i} style={{padding:'12px',textAlign:'center'}}>
            <div style={{fontSize:9,fontFamily:T.fM,color:T.textSub,letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:4}}>{s.label}</div>
            <div style={{fontSize:16,fontFamily:T.fD,fontWeight:700,color:s.color}}>{s.val}</div>
          </GlassCard>
        ))}
      </div>
      {focusSessions.length===0?<GlassCard style={{padding:40,textAlign:'center'}}><div style={{fontSize:11,fontFamily:T.fM,color:T.textMuted}}>Complete focus sessions to see billing data.</div></GlassCard>:(
        <GlassCard style={{padding:'18px 20px'}}>
          <SectionLabel>Session Log</SectionLabel>
          {filtered.slice(0,20).map((s,i)=>{
            const hrs=(Number(s.duration)||0)/60;
            const bill=hrs*Number(rate||0);
            return (<div key={s.id||i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:i<filtered.length-1?`1px solid ${T.border}`:'none',fontSize:11,fontFamily:T.fM}}>
              <div>
                <div style={{color:T.text}}>{s.label||'Focus Session'}{s.client&&<span style={{marginLeft:6,fontSize:9,color:T.accent}}>@{s.client}</span>}</div>
                <div style={{fontSize:9,color:T.textSub,marginTop:2}}>{s.date} · {Math.floor(hrs)}h {(Number(s.duration)||0)%60}m</div>
              </div>
              {rate>0&&<div style={{color:T.emerald,fontWeight:600}}>{cur}{fmtN(bill)}</div>}
            </div>);
          })}
        </GlassCard>
      )}
    </div>
  );
}

// ── VISION BOARD ─────────────────────────────────────────────────────────────
function VisionBoardTab() {
  const [items,setItems]=useLocalStorage('los_vision',[]);
  const [text,setText]=useState(''); const [emoji,setEmoji]=useState('⭐'); const [cat,setCat]=useState('Life');
  const VCATS=['Life','Career','Health','Finance','Travel','Relationships','Growth','Other'];
  const COLS={Life:T.violet,Career:T.amber,Health:T.sky,Finance:T.emerald,Travel:T.accent,Relationships:T.rose,Growth:'#a78bfa',Other:T.textSub};
  const add=()=>{ if(!text.trim())return; setItems(p=>[...p,{id:Date.now(),text:text.trim(),emoji,cat,done:false}]); setText(''); };
  const toggle=(id)=>setItems(p=>p.map(i=>i.id===id?{...i,done:!i.done}:i));
  const grouped=VCATS.reduce((acc,c)=>{ acc[c]=items.filter(i=>i.cat===c); return acc; },{});
  return (
    <div style={{display:'flex',flexDirection:'column',gap:16}}>
      <GlassCard style={{padding:'14px 18px'}}>
        <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
          <Input value={emoji} onChange={e=>setEmoji(e.target.value)} style={{width:52,textAlign:'center',fontSize:20}} />
          <Input value={text} onChange={e=>setText(e.target.value)} placeholder="A dream, goal, or aspiration…" style={{flex:1,minWidth:160}} onKeyDown={e=>e.key==='Enter'&&add()} />
          <Select value={cat} onChange={e=>setCat(e.target.value)} style={{minWidth:110}}>{VCATS.map(c=><option key={c}>{c}</option>)}</Select>
          <Btn onClick={add} color={T.violet}>Add</Btn>
        </div>
      </GlassCard>
      {VCATS.filter(c=>grouped[c]?.length>0).map(c=>(
        <div key={c}>
          <div style={{fontSize:9,fontFamily:T.fM,color:COLS[c]||T.textSub,letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:8}}>{c}</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:10}}>
            {grouped[c].map(item=>(
              <div key={item.id} style={{padding:16,borderRadius:T.r,background:`${COLS[item.cat]||T.accent}11`,border:`1px solid ${(COLS[item.cat]||T.accent)}33`,opacity:item.done?0.5:1,transition:'opacity 0.2s'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                  <span style={{fontSize:22}}>{item.emoji}</span>
                  <div style={{display:'flex',gap:5}}>
                    <button onClick={()=>toggle(item.id)} style={{padding:3,borderRadius:5,background:item.done?T.emerald+'22':T.surface,border:`1px solid ${item.done?T.emerald+'44':T.border}`,fontSize:10,color:item.done?T.emerald:T.textSub}}>✓</button>
                    <button onClick={()=>setItems(p=>p.filter(x=>x.id!==item.id))} style={{padding:3,borderRadius:5,background:T.surface,border:`1px solid ${T.border}`,opacity:0.5}}><IcoTrash size={9} stroke={T.rose} /></button>
                  </div>
                </div>
                <div style={{fontSize:12,fontFamily:T.fM,color:T.text,marginTop:8,lineHeight:1.4,textDecoration:item.done?'line-through':''}}>{item.text}</div>
                {item.done&&<div style={{fontSize:9,fontFamily:T.fM,color:T.emerald,marginTop:6}}>✅ Achieved!</div>}
              </div>
            ))}
          </div>
        </div>
      ))}
      {items.length===0&&<GlassCard style={{padding:40,textAlign:'center'}}><div style={{fontSize:11,fontFamily:T.fM,color:T.textMuted}}>Your vision board is empty. Add your first dream above.</div></GlassCard>}
    </div>
  );
}

// ── ACHIEVEMENT BADGE UNLOCK MODAL ───────────────────────────────────────────
function BadgeUnlockModal({ badge, onClose }) {
  useEffect(() => {
    if (!badge) return;
    const t = setTimeout(onClose, 4200);
    return () => clearTimeout(t);
  }, [badge, onClose]);
  if (!badge) return null;
  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:9996, background:'rgba(0,0,0,0.55)', backdropFilter:'blur(4px)', animation:'fadeIn 0.2s ease' }} />
      <div style={{ position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)', zIndex:9997, textAlign:'center', animation:'modalIn 0.35s cubic-bezier(0.34,1.56,0.64,1)' }}>
        {/* Confetti rings */}
        <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:200, height:200, borderRadius:'50%', border:`2px solid ${badge.color}33`, animation:'glowPulse 1s ease infinite', pointerEvents:'none' }} />
        <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:240, height:240, borderRadius:'50%', border:`1px solid ${badge.color}18`, animation:'glowPulse 1.5s ease infinite 0.3s', pointerEvents:'none' }} />
        <div style={{ padding:'40px 52px', background:T.bg1, border:`2px solid ${badge.color}55`, borderRadius:24, boxShadow:`0 24px 80px rgba(0,0,0,0.7), 0 0 60px ${badge.color}22`, minWidth:320, position:'relative' }}>
          {/* Glow halo */}
          <div style={{ position:'absolute', top:-1, left:-1, right:-1, height:4, background:`linear-gradient(90deg,transparent,${badge.color},transparent)`, borderRadius:'24px 24px 0 0' }} />
          <div style={{ fontSize:9, fontFamily:T.fM, color:badge.color, letterSpacing:'0.2em', textTransform:'uppercase', marginBottom:20, fontWeight:700 }}>🏆 Achievement Unlocked</div>
          <div style={{ fontSize:72, marginBottom:16, filter:`drop-shadow(0 0 20px ${badge.color}88)`, animation:'badgeIn 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.1s both' }}>{badge.emoji}</div>
          <div style={{ fontSize:22, fontFamily:T.fD, fontWeight:800, color:T.text, marginBottom:10 }}>{badge.name}</div>
          <div style={{ fontSize:13, fontFamily:T.fM, color:T.textSub, lineHeight:1.6, marginBottom:24 }}>{badge.desc}</div>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'8px 20px', borderRadius:99, background:`${badge.color}18`, border:`1px solid ${badge.color}44` }}>
            <span style={{ fontSize:14, filter:`drop-shadow(0 0 6px ${badge.color})` }}>⚡</span>
            <span style={{ fontSize:12, fontFamily:T.fM, fontWeight:700, color:badge.color }}>+50 Bonus XP</span>
          </div>
          <div style={{ marginTop:20 }}>
            <button onClick={onClose} style={{ fontSize:10, fontFamily:T.fM, color:T.textMuted, background:'none', border:'none', cursor:'pointer', letterSpacing:'0.08em' }}>TAP TO DISMISS</button>
          </div>
          {/* Progress bar auto-dismiss */}
          <div style={{ position:'absolute', bottom:0, left:0, right:0, height:3, borderRadius:'0 0 24px 24px', overflow:'hidden', background:'rgba(255,255,255,0.05)' }}>
            <div style={{ height:'100%', background:badge.color, animation:'toastTimer 4.2s linear forwards' }} />
          </div>
        </div>
      </div>
    </>
  );
}

// ── GLOBAL AI PANEL — slide-in assistant accessible from every page ──────────
// ── STEP 5: BUILD AI BRIEFING FROM DETERMINISTIC INSIGHTS ────────────────────
// Converts Steps 1-4 data into a natural-language opening message.
// Zero API calls — generated in <1ms from existing computations.
function buildAIBriefing(data) {
  const {settings={}, computed={}, habits=[], habitLogs={}, vitals=[], expenses=[], incomes=[], goals=[], debts=[], bills=[], budgets={}, assets=[], investments=[]} = data;
  const cur      = settings?.currency || '$';
  const { monthInc=0, monthExp=0, savRate=0, nw=0 } = computed || {};
  const name     = settings?.name || null;
  const today_   = today();
  const thisM    = today_.slice(0,7);

  const brief = computeDailyBrief({ expenses, incomes, habits, habitLogs,
    vitals, goals, bills, budgets, assets, investments, debts, settings });

  const dismissed = (() => { try { return JSON.parse(localStorage.getItem('los_alerts_dismissed')||'{}'); } catch { return {}; } })();
  const allAlerts = computeSmartAlerts({ bills, budgets, expenses, habits,
    habitLogs, vitals, incomes, goals, thisMonth:thisM, monthInc, savRate,
    netWorth:nw, assets, investments });
  const activeAlerts  = allAlerts.filter(a => !dismissed[a.dismissKey]);
  const urgentAlert   = activeAlerts.find(a => a.severity==='urgent'||a.severity==='warn');
  const positiveAlert = activeAlerts.find(a => a.severity==='positive');

  const trail = [1,2,3].map(i => {
    const d = new Date(); d.setMonth(d.getMonth()-i);
    const m = d.toISOString().slice(0,7);
    const inc = (incomes||[]).filter(x=>x.date?.startsWith(m)).reduce((s,x)=>s+Number(x.amount||0),0);
    const exp = (expenses||[]).filter(x=>x.date?.startsWith(m)).reduce((s,x)=>s+Number(x.amount||0),0);
    return inc > 0 ? ((inc-exp)/inc)*100 : null;
  }).filter(r=>r!=null);
  const avgSavRate = trail.length ? trail.reduce((s,r)=>s+r,0)/trail.length : null;

  const greeting = name ? `Here's what I'm seeing right now, ${name}.` : `Here's what I'm seeing right now.`;
  const parts = [];

  if (brief.financial) {
    const f = brief.financial;
    if (f.severity === 'warn') {
      parts.push(`**Finance:** ${f.signal}. ${f.detail}${f.projection ? ' ' + f.projection + '.' : ''}`);
    } else if (f.severity === 'good') {
      parts.push(`**Finance:** ${f.signal}. ${f.detail}`);
    } else if (monthInc > 0) {
      parts.push(`**Finance:** Spending ${cur}${fmtN(monthExp)} against ${cur}${fmtN(monthInc)} income this month — savings rate ${savRate.toFixed(1)}%.` + (avgSavRate!=null ? ` Your 3-month average is ${avgSavRate.toFixed(1)}%.` : ''));
    }
  }

  if (brief.habit) {
    const h = brief.habit;
    if (h.severity === 'warn' || h.severity === 'notice' || h.severity === 'good') {
      parts.push(`**Habits:** ${h.signal}. ${h.detail}`);
    } else if ((habits||[]).length > 0) {
      const done = (habits||[]).filter(h=>(habitLogs[h.id]||[]).includes(today_)).length;
      const best = (habits||[]).reduce((mx,h)=>{const s=getStreak(h.id,habitLogs);return s>mx?s:mx;},0);
      parts.push(`**Habits:** ${done}/${(habits||[]).length} done today. Best streak: ${best} days.`);
    }
  }

  if (brief.health && brief.health.severity !== 'neutral') {
    parts.push(`**Health:** ${brief.health.signal}. ${brief.health.detail}`);
  }

  if (urgentAlert && !parts.some(p=>p.toLowerCase().includes(urgentAlert.title.toLowerCase().slice(0,15)))) {
    parts.push(`**Alert:** ${urgentAlert.title} — ${urgentAlert.body}`);
  } else if (positiveAlert && !urgentAlert) {
    parts.push(`**Momentum:** ${positiveAlert.title} — ${positiveAlert.body}`);
  }

  const topAct = brief.topAction;
  const closing = topAct
    ? `The most useful thing right now is probably **${topAct.text.toLowerCase()}**. Want to dig into that — or is there something else on your mind?`
    : `What would you like to work through today?`;

  if (parts.length === 0) {
    return `${greeting}\n\nI don't have enough data yet for a useful briefing. Start by logging income, expenses, and a few habit days — then I'll have real context.\n\n${closing}`;
  }
  return `${greeting}\n\n${parts.join('\n\n')}\n\n${closing}`;
}

function GlobalAIPanel({ open, onClose, data }) {
  const [messages, setMessages] = useState([]);
  const [input,    setInput   ] = useState('');
  const [loading,  setLoading ] = useState(false);
  const [briefed,  setBriefed ] = useState(false);
  const endRef   = useRef(null);
  const inputRef = useRef(null);

  // Fix: cache today's briefing in localStorage so it's stable across
  // reloads and tab switches — not just within the same session.
  // Key includes today's date so it auto-invalidates at midnight.
  const BRIEFING_KEY = `los_ai_briefing_${today()}`;

  useEffect(() => {
    if (open && !briefed && messages.length === 0) {
      // Check localStorage for a cached briefing from earlier today
      let briefingText = null;
      try {
        const cached = localStorage.getItem(BRIEFING_KEY);
        if (cached) briefingText = cached;
      } catch {}

      // Generate fresh if no cache exists
      if (!briefingText) {
        briefingText = buildAIBriefing(data);
        try { localStorage.setItem(BRIEFING_KEY, briefingText); } catch {}
      }

      setMessages([{ role:'assistant', content:briefingText, isBriefing:true }]);
      setBriefed(true);
    }
    if (open && inputRef.current) setTimeout(() => inputRef.current?.focus(), 320);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // "New chat" clears session but keeps the cached briefing —
  // the next open will reload it from cache (same day) or regenerate (new day)
  const clearMessages = () => { setMessages([]); setBriefed(false); };

  useEffect(() => {
    if (endRef.current) endRef.current.scrollIntoView({ behavior:'smooth' });
  }, [messages, loading]);

  const buildSystemPrompt = () => {
    const {settings={}, computed={}, habits=[], habitLogs={}, goals=[], expenses=[], debts=[], vitals=[], investments=[], subscriptions=[], incomes=[], bills=[], budgets={}, assets=[]} = data;
    const cur = settings?.currency || '$';
    const briefText = buildAIBriefing(data).replace(/\*\*/g,'');
    const today_  = today();
    const bestStreak = (habits||[]).reduce((mx,h)=>{const s=getStreak(h.id,habitLogs);return s>mx?s:mx;},0);
    const todayDone  = (habits||[]).filter(h=>(habitLogs[h.id]||[]).includes(today_)).length;
    const recentExp  = (expenses||[]).slice(0,8).map(e=>`${e.category} ${cur}${e.amount} (${e.date})`).join(', ');
    const goalsList  = (goals||[]).map(g=>`${g.name}: ${Math.round((Number(g.current||0)/Number(g.target||1))*100)}%`).join(', ');
    const subsCost   = (subscriptions||[]).reduce((s,sub)=>s+Number(sub.amount||0),0);
    const invVal     = (investments||[]).reduce((s,i)=>s+Number((i.currentPrice??i.buyPrice)||0)*Number(i.quantity||0),0);
    const lastVitals = (vitals||[]).sort((a,b)=>b.date.localeCompare(a.date))[0];
    const overdueBills = (bills||[]).filter(b=>!b.paid&&b.nextDate&&b.nextDate<today_).map(b=>b.name).join(', ');
    return `You are LifeOS AI — a sharp, context-aware personal life coach. You have already delivered a briefing to the user. Continue with the same authority and specificity.

BRIEFING YOU SENT:
${briefText}

DATA SNAPSHOT:
• Net worth: ${cur}${fmtN(computed?.nw||0)} | Investable: ${cur}${fmtN(invVal)}
• This month: Income ${cur}${fmtN(computed?.monthInc||0)} · Expenses ${cur}${fmtN(computed?.monthExp||0)} · Savings rate ${(computed?.savRate||0).toFixed(1)}%
• Habits: ${(habits||[]).length} tracked · ${todayDone} done today · best streak ${bestStreak}d
• Goals: ${goalsList||'none'}
• Debt: ${cur}${fmtN((debts||[]).reduce((s,d)=>s+Number(d.balance||0),0))} across ${(debts||[]).length} accounts
• Subscriptions: ${cur}${fmtN(subsCost)}/mo · Last vitals: mood ${lastVitals?.mood||'—'}/10, sleep ${lastVitals?.sleep||'—'}h
• Recent spending: ${recentExp||'none'}
• Overdue bills: ${overdueBills||'none'}

Be warm but direct. Reference specific numbers. Prefer 2-4 sentence answers. Never ask more than one clarifying question per response.`;
  };

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role:'user', content:input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    try {
      const text = await callAI(data.settings, {
        max_tokens: 1000,
        system: buildSystemPrompt(),
        messages: newMessages
          .filter(m => !m.isBriefing)
          .map(m => ({ role:m.role, content:m.content })),
      });
      setMessages(p => [...p, { role:'assistant', content:text||'Something went wrong. Try again.' }]);
    } catch {
      setMessages(p => [...p, { role:'assistant', content:'Connection error — check AI settings.' }]);
    }
    setLoading(false);
  };

  const SUGGESTIONS = useMemo(() => {
    const {habits=[], habitLogs={}, expenses=[], incomes=[], bills=[], budgets={}, goals=[], vitals=[], assets=[], investments=[], debts=[], settings:s={}} = data;
    const brief = computeDailyBrief({ expenses, incomes, habits, habitLogs,
      vitals, goals, bills, budgets, assets, investments, debts, settings:s });
    const suggs = [];
    if (brief.financial?.severity === 'warn')
      suggs.push({ label:`Why is my spending increasing?`, emoji:'📊' });
    else
      suggs.push({ label:'How is my financial health this month?', emoji:'💰' });
    if (brief.habit?.severity === 'warn' || brief.habit?.severity === 'notice')
      suggs.push({ label:`How do I protect my ${brief.habit?.habitName||'habit'} streak?`, emoji:'🔥' });
    else
      suggs.push({ label:'What habits should I add or cut?', emoji:'🎯' });
    if ((goals||[]).length > 0)
      suggs.push({ label:'Am I on track with my goals?', emoji:'🏆' });
    else
      suggs.push({ label:'What goals should I set this month?', emoji:'🏆' });
    suggs.push({ label:'What should I focus on this week?', emoji:'📅' });
    return suggs.slice(0,4);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const formatMsg = (content) => {
    const parts = content.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((p,i) =>
      /^\*\*.*\*\*$/.test(p)
        ? <span key={i} style={{ color:T.accent, fontWeight:700 }}>{p.slice(2,-2)}</span>
        : p
    );
  };

  const hasApiKey = !!(data.settings?.aiApiKey || data.settings?.aiProvider === 'ollama');

  return (
    <>
      {open && <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:9994, background:'rgba(0,0,0,0.35)', backdropFilter:'blur(2px)', animation:'fadeIn 0.2s ease' }} />}
      <div style={{ position:'fixed', top:0, right:0, height:'100vh', width:clamp(340,380,460), background:T.bg1, borderLeft:`1px solid ${T.borderLit}`, display:'flex', flexDirection:'column', zIndex:9995, transform:open?'translateX(0)':'translateX(100%)', transition:'transform 0.3s cubic-bezier(0.32,0.72,0,1)', boxShadow:open?`-20px 0 60px rgba(0,0,0,0.6),-1px 0 0 ${T.accent}18`:'none' }}>
        <div style={{ padding:'14px 16px', borderBottom:`1px solid ${T.border}`, display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
          <div style={{ width:34, height:34, borderRadius:10, background:`linear-gradient(135deg,${T.accent}22,${T.violet}22)`, border:`1px solid ${T.accent}44`, display:'flex', alignItems:'center', justifyContent:'center', animation:'glowPulse 3s infinite', flexShrink:0 }}>
            <IcoBrain size={16} stroke={T.accent} />
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, fontFamily:T.fD, fontWeight:700, color:T.text, lineHeight:1 }}>LifeOS AI</div>
            <div style={{ fontSize:9, fontFamily:T.fM, color:T.textSub, letterSpacing:'0.1em', marginTop:3 }}>
              {briefed ? '● BRIEFED ON YOUR DATA' : 'CONTEXT-AWARE LIFE COACH'}
            </div>
          </div>
          {messages.length > 0 && (
            <button onClick={clearMessages} style={{ fontSize:9, fontFamily:T.fM, color:T.textMuted, background:T.surface, border:`1px solid ${T.border}`, borderRadius:6, padding:'4px 8px', cursor:'pointer' }}>New chat</button>
          )}
          <button onClick={onClose} style={{ padding:6, borderRadius:7, color:T.textSub, background:T.surface, border:`1px solid ${T.border}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <IcoX size={13} stroke={T.textSub} />
          </button>
        </div>
        <div style={{ flex:1, overflowY:'auto', padding:'14px 16px', display:'flex', flexDirection:'column', gap:12 }}>
          {messages.length > 0 && messages[0]?.isBriefing && (
            <>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-start', animation:'fadeUp 0.3s ease' }}>
                <div style={{ fontSize:9, fontFamily:T.fM, color:T.accent, marginBottom:4, letterSpacing:'0.08em' }}>✦ LifeOS AI · Today's Briefing</div>
                <div style={{ maxWidth:'96%', padding:'12px 16px', borderRadius:'14px 14px 14px 4px', background:T.surface, border:`1px solid ${T.accent}22`, fontSize:12, fontFamily:T.fM, color:T.text, lineHeight:1.8, whiteSpace:'pre-wrap', wordBreak:'break-word' }}>
                  {formatMsg(messages[0].content)}
                </div>
              </div>
              {messages.length === 1 && (
                <div style={{ display:'flex', flexDirection:'column', gap:6, marginTop:4 }}>
                  <div style={{ fontSize:9, fontFamily:T.fM, color:T.textMuted, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:2 }}>Suggested follow-ups</div>
                  {SUGGESTIONS.map(s => (
                    <button key={s.label} onClick={()=>{ setInput(s.label); setTimeout(()=>inputRef.current?.focus(),50); }}
                      style={{ padding:'9px 14px', borderRadius:9, background:T.surface, border:`1px solid ${T.border}`, color:T.textSub, fontSize:11, fontFamily:T.fM, textAlign:'left', cursor:'pointer', transition:'all 0.15s', display:'flex', alignItems:'center', gap:9 }}
                      onMouseEnter={e=>{e.currentTarget.style.borderColor=T.accent+'44';e.currentTarget.style.color=T.text;e.currentTarget.style.background=T.surfaceHi;}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.color=T.textSub;e.currentTarget.style.background=T.surface;}}>
                      <span style={{fontSize:15,flexShrink:0}}>{s.emoji}</span>
                      <span style={{flex:1}}>{s.label}</span>
                      <span style={{opacity:0.3}}>→</span>
                    </button>
                  ))}
                  {!hasApiKey && (
                    <div style={{ fontSize:10, fontFamily:T.fM, color:T.amber, padding:'8px 12px', borderRadius:T.r, background:T.amberDim, border:`1px solid ${T.amber}33`, marginTop:4, lineHeight:1.5 }}>
                      ⚠ The briefing is from your local data. Add an API key in Settings to ask follow-up questions.
                    </div>
                  )}
                </div>
              )}
            </>
          )}
          {messages.slice(messages[0]?.isBriefing?1:0).map((m,i) => (
            <div key={i} style={{ display:'flex', flexDirection:'column', alignItems:m.role==='user'?'flex-end':'flex-start', animation:'fadeUp 0.2s ease' }}>
              {m.role==='assistant' && <div style={{ fontSize:9, fontFamily:T.fM, color:T.accent, marginBottom:4, letterSpacing:'0.08em' }}>✦ LifeOS AI</div>}
              <div style={{ maxWidth:'88%', padding:'10px 14px', borderRadius:m.role==='user'?'14px 14px 4px 14px':'14px 14px 14px 4px', background:m.role==='user'?T.accentDim:T.surface, border:`1px solid ${m.role==='user'?T.accent+'33':T.border}`, fontSize:12, fontFamily:T.fM, color:T.text, lineHeight:1.7, whiteSpace:'pre-wrap', wordBreak:'break-word' }}>
                {m.role==='assistant' ? formatMsg(m.content) : m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-start', animation:'fadeUp 0.2s ease' }}>
              <div style={{ fontSize:9, fontFamily:T.fM, color:T.accent, marginBottom:4, letterSpacing:'0.08em' }}>✦ LifeOS AI</div>
              <div style={{ padding:'12px 16px', borderRadius:'14px 14px 14px 4px', background:T.surface, border:`1px solid ${T.border}`, display:'flex', gap:5, alignItems:'center' }}>
                {[0,1,2].map(i=><div key={i} style={{width:6,height:6,borderRadius:'50%',background:T.accent,opacity:0.7,animation:`dotPulse 1.2s infinite ${i*0.2}s`}} />)}
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>
        <div style={{ padding:'12px 16px', borderTop:`1px solid ${T.border}`, display:'flex', flexDirection:'column', gap:8, flexShrink:0 }}>
          <div style={{ display:'flex', gap:8, alignItems:'flex-end' }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e=>{ setInput(e.target.value); e.target.style.height='auto'; e.target.style.height=Math.min(e.target.scrollHeight,96)+'px'; }}
              onKeyDown={e=>{ if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();} }}
              placeholder={hasApiKey ? 'Ask a follow-up… (Enter to send)' : 'Add an API key in Settings to chat'}
              disabled={!hasApiKey}
              rows={1}
              style={{ flex:1, background:T.surface, border:`1px solid ${input.trim()?T.accent+'44':T.border}`, borderRadius:10, padding:'9px 12px', fontSize:12, fontFamily:T.fM, color:T.text, resize:'none', lineHeight:1.5, maxHeight:96, overflowY:'auto', transition:'border-color 0.15s', opacity:hasApiKey?1:0.5 }}
            />
            <button onClick={send} disabled={!input.trim()||loading||!hasApiKey} style={{ width:38, height:38, borderRadius:10, background:input.trim()&&hasApiKey?T.accentDim:T.surface, border:`1px solid ${input.trim()&&hasApiKey?T.accent+'55':T.border}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, opacity:loading||!hasApiKey?0.4:1, transition:'all 0.15s', cursor:input.trim()&&!loading&&hasApiKey?'pointer':'default' }}>
              <IcoSend size={14} stroke={input.trim()&&!loading&&hasApiKey?T.accent:T.textSub} />
            </button>
          </div>
          <div style={{ fontSize:9, fontFamily:T.fM, color:T.textMuted, textAlign:'center' }}>
            <kbd style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:3,padding:'1px 4px',fontSize:8}}>A</kbd> anywhere to toggle · <kbd style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:3,padding:'1px 4px',fontSize:8}}>Esc</kbd> to close
          </div>
        </div>
      </div>
    </>
  );
}
// ── AI FINANCIAL COACH CHAT ───────────────────────────────────────────────────
function FinCoachTab({ data, settings, coachMessages, setCoachMessages, coachInput, setCoachInput, coachLoading, setCoachLoading }) {
  const cur = settings.currency||'$';
  const {expenses=[], incomes=[], debts=[], goals=[], investments=[], computed={}} = data;
  const { monthExp, monthInc, savRate, nw } = computed||{};
  const messagesEndRef = React.useRef(null);
  React.useEffect(()=>{ messagesEndRef.current?.scrollIntoView({behavior:'smooth'}); },[coachMessages]);

  const buildContext = () => {
    const topExp = [...(expenses||[])].sort((a,b)=>Number(b.amount||0)-Number(a.amount||0)).slice(0,5).map(e=>`${e.category}: ${cur}${e.amount}`).join(', ');
    return `You are a personal financial coach AI embedded in LifeOS. Be concise, specific, and action-oriented. User financial snapshot: Monthly income ${cur}${fmtN(monthInc||0)}, Monthly expenses ${cur}${fmtN(monthExp||0)}, Savings rate ${(savRate||0).toFixed(1)}%, Net worth ${cur}${fmtN(nw||0)}, Active debts: ${(debts||[]).length}, Top expenses: ${topExp||'none'}, Goals: ${(goals||[]).map(g=>g.name).join(', ')||'none'}. Give practical, numbered advice when possible.`;
  };

  const sendMessage = async () => {
    if (!coachInput.trim() || coachLoading) return;
    const userMsg = { role:'user', content:coachInput.trim() };
    const updated = [...coachMessages, userMsg];
    setCoachMessages(updated);
    setCoachInput('');
    setCoachLoading(true);
    try {
      const reply = await callAI(settings, {
        max_tokens: 600,
        system: buildContext(),
        messages: updated.map(m=>({role:m.role,content:m.content}))
      });
      setCoachMessages(p=>[...p,{role:'assistant',content:reply||'No response — check your AI settings.'}]);
    } catch { setCoachMessages(p=>[...p,{role:'assistant',content:'Error connecting to AI. Check AI settings.'}]); }
    setCoachLoading(false);
  };

  const STARTERS = ['What are my top spending categories this month?','How can I improve my savings rate?','Should I pay off debt or invest first?','Analyze my financial health score','Create a 90-day budget plan for me'];
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div><SectionLabel>AI Financial Coach</SectionLabel><div style={{ fontSize:11, fontFamily:T.fM, color:T.textSub }}>Ask anything about your finances. Context-aware and data-driven.</div></div>
        {coachMessages.length>0 && <button onClick={()=>setCoachMessages([])} style={{ fontSize:9, fontFamily:T.fM, color:T.textMuted, padding:'3px 8px', borderRadius:6, background:T.surface, border:`1px solid ${T.border}` }}>Clear chat</button>}
      </div>
      {coachMessages.length===0 && (
        <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
          {STARTERS.map((s,i)=>(
            <button key={i} onClick={()=>{ setCoachInput(s); }} style={{ padding:'7px 13px', borderRadius:T.r, background:T.accentLo, border:`1px solid ${T.accent}22`, fontSize:10, fontFamily:T.fM, color:T.accent, cursor:'pointer', textAlign:'left', transition:'all 0.15s' }}>{s}</button>
          ))}
        </div>
      )}
      <GlassCard style={{ padding:'18px', display:'flex', flexDirection:'column', gap:0, minHeight:320, maxHeight:480, overflowY:'auto' }}>
        {coachMessages.length===0 && <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontFamily:T.fM, color:T.textMuted }}>Your financial data is loaded as context. Ask anything.</div>}
        {coachMessages.map((m,i)=>(
          <div key={i} style={{ display:'flex', gap:10, marginBottom:14, justifyContent:m.role==='user'?'flex-end':'flex-start' }}>
            {m.role==='assistant' && <div style={{ width:28, height:28, borderRadius:8, background:T.accentDim, border:`1px solid ${T.accent}33`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0 }}>🤖</div>}
            <div style={{ maxWidth:'80%', padding:'10px 14px', borderRadius:12, background:m.role==='user'?T.accentDim:T.surface, border:`1px solid ${m.role==='user'?T.accent+'44':T.border}`, fontSize:12, fontFamily:T.fM, color:T.text, lineHeight:1.6, whiteSpace:'pre-wrap' }}>{m.content}</div>
          </div>
        ))}
        {coachLoading && <div style={{ display:'flex', gap:5, padding:'10px 14px', borderRadius:12, background:T.surface, border:`1px solid ${T.border}`, width:'fit-content' }}>{[0,1,2].map(i=><div key={i} style={{ width:6, height:6, borderRadius:'50%', background:T.accent, animation:`dotPulse 1.2s ease ${i*0.2}s infinite` }}/>)}</div>}
        <div ref={messagesEndRef} />
      </GlassCard>
      <div style={{ display:'flex', gap:8 }}>
        <input value={coachInput} onChange={e=>setCoachInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&sendMessage()} placeholder="Ask your financial coach..." style={{ flex:1, padding:'10px 14px', background:'rgba(255,255,255,0.04)', border:`1px solid ${T.border}`, borderRadius:T.r, fontFamily:T.fM, fontSize:12, color:T.text }} />
        <Btn onClick={sendMessage} color={T.accent} style={{ padding:'10px 18px' }}>{coachLoading?'…':'Send'}</Btn>
      </div>
      {(!settings.aiApiKey && settings.aiProvider !== 'ollama') && <div style={{ fontSize:10, fontFamily:T.fM, color:T.amber, textAlign:'center' }}>⚠️ Add an Anthropic API key in Settings → AI Provider to enable the coach.</div>}
    </div>
  );
}

// ── AI INVESTMENT ADVISOR ────────────────────────────────────────────────────
function AIInvestmentAdvisor({ data }) {
  const {investments=[], settings={}} = data;
  const [advice, setAdvice] = useLocalStorage('los_inv_advice', null);
  const [loading, setLoading] = useState(false);
  const cur = settings.currency||'$';

  const getAdvice = async () => {
    if (loading) return;
    setLoading(true);
    const portfolio = (investments||[]).map(i=>`${i.symbol||i.name} (${i.type}): qty ${i.quantity} @ buy ${cur}${i.buyPrice}, current ${cur}${i.currentPrice||i.buyPrice}`).join('\n');
    try {
      const text = await callAI(settings, {
        max_tokens: 700,
        messages:[{ role:'user', content:`You are an investment analyst. Analyze this portfolio and give 3–5 actionable insights. Be specific about diversification, risk, and potential optimizations. Portfolio:\n${portfolio||'No investments yet'}. Keep response concise and practical.` }]
      });
      setAdvice({ text: text||'No response', ts: today() });
    } catch { setAdvice({ text:'Error — check AI settings.', ts: today() }); }
    setLoading(false);
  };

  return (
    <GlassCard style={{ padding:'20px 22px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
        <div><SectionLabel>AI Investment Advisor</SectionLabel><div style={{ fontSize:10, fontFamily:T.fM, color:T.textSub }}>AI analysis of your portfolio composition and strategy.</div></div>
        <Btn onClick={getAdvice} color={T.violet} style={{ padding:'6px 14px', fontSize:11 }}>{loading?'Analyzing…':'Analyze Portfolio'}</Btn>
      </div>
      {advice ? (
        <div>
          <div style={{ fontSize:12, fontFamily:T.fM, color:T.text, lineHeight:1.7, whiteSpace:'pre-wrap', borderLeft:`3px solid ${T.violet}55`, paddingLeft:14 }}>{advice.text}</div>
          <div style={{ fontSize:9, fontFamily:T.fM, color:T.textMuted, marginTop:10 }}>Generated {advice.ts} · Click Analyze to refresh</div>
        </div>
      ) : (
        <div style={{ textAlign:'center', padding:'24px 0', fontSize:11, fontFamily:T.fM, color:T.textMuted }}>{(investments||[]).length===0?'Add investments first to get AI analysis.':'Click "Analyze Portfolio" to get personalized investment insights.'}</div>
      )}
      {(!settings.aiApiKey && settings.aiProvider !== 'ollama') && <div style={{ fontSize:10, fontFamily:T.fM, color:T.amber, textAlign:'center', marginTop:10 }}>⚠️ Add API key in Settings to enable AI advisor.</div>}
    </GlassCard>
  );
}

// ── AI MEAL PLANNER ─────────────────────────────────────────────────────────
function AIMealPlannerTab({ data, mealPlan, setMealPlan, mealPlanLoading, setMealPlanLoading }) {
  const {settings={}, vitals=[]} = data;
  const [prefs, setPrefs] = useState('');
  const avgCal = (vitals||[]).slice(-7).reduce((s,v)=>s+Number(v.calories||0),0) / Math.max(1, (vitals||[]).filter(v=>v.calories).slice(-7).length);

  const generate = async () => {
    if (mealPlanLoading) return;
    setMealPlanLoading(true);
    try {
      const text = await callAI(settings, {
        max_tokens: 800,
        messages:[{ role:'user', content:`Create a practical 7-day meal plan${prefs?` considering: ${prefs}`:''}. Format as: Day 1: Breakfast | Lunch | Dinner. Be specific with meals. Keep it healthy, realistic, and varied. Add a brief weekly nutrition summary at the end.` }]
      });
      setMealPlan({ text: text||'No response', ts: today(), prefs });
    } catch { setMealPlan({ text:'Error — check AI settings.', ts:today(), prefs }); }
    setMealPlanLoading(false);
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div><SectionLabel>AI Meal Planner</SectionLabel><div style={{ fontSize:11, fontFamily:T.fM, color:T.textSub }}>Generate a personalized 7-day meal plan powered by AI.</div></div>
      <GlassCard style={{ padding:'18px 22px' }}>
        <div style={{ marginBottom:10 }}><div style={{ fontSize:10, fontFamily:T.fM, color:T.textSub, marginBottom:6 }}>Dietary preferences / restrictions (optional)</div>
          <input value={prefs} onChange={e=>setPrefs(e.target.value)} placeholder="e.g. vegetarian, no dairy, high protein, 2000 calories/day…" style={{ width:'100%', padding:'9px 12px', background:'rgba(255,255,255,0.04)', border:`1px solid ${T.border}`, borderRadius:T.r, fontFamily:T.fM, fontSize:12, color:T.text }} /></div>
        <Btn full onClick={generate} color={T.emerald}>{mealPlanLoading?'Generating…':'Generate 7-Day Meal Plan'}</Btn>
        {(!settings.aiApiKey && settings.aiProvider !== 'ollama') && <div style={{ fontSize:10, fontFamily:T.fM, color:T.amber, textAlign:'center', marginTop:8 }}>⚠️ Add API key in Settings to use AI features.</div>}
      </GlassCard>
      {mealPlan && (
        <GlassCard style={{ padding:'20px 22px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <SectionLabel>Your Meal Plan</SectionLabel>
            <div style={{ fontSize:9, fontFamily:T.fM, color:T.textMuted }}>Generated {mealPlan.ts}</div>
          </div>
          <div style={{ fontSize:12, fontFamily:T.fM, color:T.text, lineHeight:1.8, whiteSpace:'pre-wrap' }}>{mealPlan.text}</div>
        </GlassCard>
      )}
    </div>
  );
}

// ── AI SLEEP COACH ───────────────────────────────────────────────────────────
function AISleepCoachTab({ data, sleepCoachTips, setSleepCoachTips, sleepCoachLoading, setSleepCoachLoading }) {
  const {settings={}, vitals=[]} = data;
  const recent14 = (vitals||[]).slice(-14);
  const avgSleep = recent14.length ? (recent14.reduce((s,v)=>s+Number(v.sleep||0),0)/recent14.length).toFixed(1) : null;
  const avgSleepQuality = recent14.length ? (recent14.reduce((s,v)=>s+Number(v.sleepQuality||0),0)/recent14.length).toFixed(1) : null;
  const avgMood = recent14.length ? (recent14.reduce((s,v)=>s+Number(v.mood||0),0)/recent14.length).toFixed(1) : null;

  const analyze = async () => {
    if (sleepCoachLoading) return;
    setSleepCoachLoading(true);
    const sleepData = recent14.map(v=>`${v.date}: ${v.sleep}h sleep, quality ${v.sleepQuality||'?'}/5, mood ${v.mood||'?'}/10`).join('\n');
    try {
      const text = await callAI(settings, {
        max_tokens: 700,
        messages:[{ role:'user', content:`You are a sleep coach. Analyze this 14-day sleep log and give 4–5 personalized recommendations to improve sleep quality and duration. Be specific and practical. Data:\n${sleepData||'No sleep data logged yet'}. Average sleep: ${avgSleep}h, avg quality: ${avgSleepQuality}/5, avg mood: ${avgMood}/10.` }]
      });
      setSleepCoachTips({ text: text||'No response', ts: today() });
    } catch { setSleepCoachTips({ text:'Error — check AI settings.', ts:today() }); }
    setSleepCoachLoading(false);
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div><SectionLabel>AI Sleep Coach</SectionLabel><div style={{ fontSize:11, fontFamily:T.fM, color:T.textSub }}>AI-powered analysis of your sleep patterns and personalized tips.</div></div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))', gap:10 }}>
        {[
          { label:'Avg Sleep (14d)', val:avgSleep?`${avgSleep}h`:'—', color:avgSleep&&Number(avgSleep)>=7?T.emerald:T.amber },
          { label:'Avg Quality (14d)', val:avgSleepQuality?`${avgSleepQuality}/5`:'—', color:T.sky },
          { label:'Avg Mood (14d)', val:avgMood?`${avgMood}/10`:'—', color:T.violet },
          { label:'Entries Logged', val:String(recent14.length), color:T.accent },
        ].map((s,i)=>(
          <GlassCard key={i} style={{ padding:'14px', textAlign:'center' }}>
            <div style={{ fontSize:9, fontFamily:T.fM, color:T.textSub, letterSpacing:'0.08em', marginBottom:6 }}>{s.label.toUpperCase()}</div>
            <div style={{ fontSize:20, fontFamily:T.fD, fontWeight:700, color:s.color }}>{s.val}</div>
          </GlassCard>
        ))}
      </div>
      <Btn full onClick={analyze} color={T.sky}>{sleepCoachLoading?'Analyzing sleep patterns…':'Get AI Sleep Analysis & Tips'}</Btn>
      {(!settings.aiApiKey && settings.aiProvider !== 'ollama') && <div style={{ fontSize:10, fontFamily:T.fM, color:T.amber, textAlign:'center' }}>⚠️ Add API key in Settings to enable AI coach.</div>}
      {sleepCoachTips && (
        <GlassCard style={{ padding:'20px 22px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <SectionLabel>Sleep Coach Recommendations</SectionLabel>
            <div style={{ fontSize:9, fontFamily:T.fM, color:T.textMuted }}>{sleepCoachTips.ts}</div>
          </div>
          <div style={{ fontSize:12, fontFamily:T.fM, color:T.text, lineHeight:1.8, whiteSpace:'pre-wrap', borderLeft:`3px solid ${T.sky}44`, paddingLeft:14 }}>{sleepCoachTips.text}</div>
        </GlassCard>
      )}
    </div>
  );
}

// ── AI NOTE ANALYSIS ─────────────────────────────────────────────────────────
function AINotesAnalysisCard({ notes, settings, noteAnalysis, setNoteAnalysis, noteAnalysisLoading, setNoteAnalysisLoading }) {
  const analyze = async () => {
    if (noteAnalysisLoading || !(notes||[]).length) return;
    setNoteAnalysisLoading(true);
    const noteSummary = (notes||[]).slice(0,20).map(n=>`[${n.tag}] ${n.title}: ${(n.body||'').slice(0,120)}`).join('\n');
    try {
      const text = await callAI(settings, {
        max_tokens: 600,
        messages:[{ role:'user', content:`Analyze these personal notes and provide: 1) Key themes and patterns (2-3 sentences), 2) Top 3 actionable insights you notice, 3) What the person seems most focused on, 4) One growth opportunity. Notes:\n${noteSummary}` }]
      });
      setNoteAnalysis({ text: text||'No response', ts: today(), count: (notes||[]).length });
    } catch { setNoteAnalysis({ text:'Error — check AI settings.', ts:today(), count:0 }); }
    setNoteAnalysisLoading(false);
  };
  return (
    <GlassCard style={{ padding:'20px 22px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
        <div><SectionLabel>AI Note Analysis</SectionLabel><div style={{ fontSize:10, fontFamily:T.fM, color:T.textSub }}>Discover patterns and insights across your {(notes||[]).length} notes.</div></div>
        <Btn onClick={analyze} color={T.amber} style={{ padding:'5px 13px', fontSize:11 }}>{noteAnalysisLoading?'Analyzing…':'Analyze Notes'}</Btn>
      </div>
      {(notes||[]).length === 0 ? (
        <div style={{ fontSize:11, fontFamily:T.fM, color:T.textMuted, textAlign:'center', padding:'16px 0' }}>Add notes first to enable AI analysis.</div>
      ) : noteAnalysis ? (
        <div>
          <div style={{ fontSize:12, fontFamily:T.fM, color:T.text, lineHeight:1.7, whiteSpace:'pre-wrap', borderLeft:`3px solid ${T.amber}55`, paddingLeft:12 }}>{noteAnalysis.text}</div>
          <div style={{ fontSize:9, fontFamily:T.fM, color:T.textMuted, marginTop:10 }}>Analyzed {noteAnalysis.count} notes on {noteAnalysis.ts}</div>
        </div>
      ) : (
        <div style={{ fontSize:11, fontFamily:T.fM, color:T.textMuted, textAlign:'center', padding:'12px 0' }}>Click "Analyze Notes" to discover patterns in your knowledge base.</div>
      )}
      {(!settings.aiApiKey && settings.aiProvider !== 'ollama') && <div style={{ fontSize:10, fontFamily:T.fM, color:T.amber, textAlign:'center', marginTop:10 }}>⚠️ Add API key in Settings to enable AI analysis.</div>}
    </GlassCard>
  );
}

// ── SOCIAL CHALLENGES ────────────────────────────────────────────────────────
function SocialChallengesTab({ data, actions }) {
  const {challenges=[], settings={}} = data;
  const [shareCode, setShareCode] = useLocalStorage('los_share_code', null);
  const [friends, setFriends] = useLocalStorage('los_challenge_friends', []);
  const [newFriend, setNewFriend] = useState('');
  const [friendCode, setFriendCode] = useState('');

  const myCode = shareCode || (() => {
    const code = Math.random().toString(36).slice(2,8).toUpperCase();
    setShareCode(code);
    return code;
  })();

  const myActive = (challenges||[]).filter(c=>c.challengeId);
  const addFriend = () => {
    if (!newFriend.trim() || !friendCode.trim()) return;
    setFriends(p=>[...p, { name:newFriend.trim(), code:friendCode.trim().toUpperCase(), challenges:[], joined:today() }]);
    setNewFriend(''); setFriendCode('');
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div><SectionLabel>Social Challenges</SectionLabel><div style={{ fontSize:11, fontFamily:T.fM, color:T.textSub }}>Share your challenge progress and compete with friends.</div></div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <GlassCard style={{ padding:'18px 22px' }}>
          <SectionLabel>Your Share Code</SectionLabel>
          <div style={{ fontSize:32, fontFamily:T.fM, fontWeight:700, color:T.accent, letterSpacing:'0.2em', textAlign:'center', padding:'16px 0', background:T.accentLo, borderRadius:T.r, border:`1px solid ${T.accent}22`, marginBottom:10 }}>{myCode}</div>
          <div style={{ fontSize:10, fontFamily:T.fM, color:T.textSub, textAlign:'center', marginBottom:10 }}>Share this code with friends to compare challenge progress</div>
          <Btn full onClick={()=>navigator.clipboard.writeText(myCode)} color={T.accent} style={{ fontSize:11 }}>Copy Code</Btn>
        </GlassCard>
        <GlassCard style={{ padding:'18px 22px' }}>
          <SectionLabel>Your Active Challenges</SectionLabel>
          {myActive.length===0 ? (
            <div style={{ fontSize:11, fontFamily:T.fM, color:T.textMuted, textAlign:'center', padding:'20px 0' }}>Join challenges in the Challenges tab to appear here.</div>
          ) : (
            myActive.slice(0,4).map((c,i)=>{
              const catalog = CHALLENGES_CATALOG.find(x=>x.id===c.challengeId);
              if (!catalog) return null;
              const pct = Math.round((c.done?.length||0)/catalog.days*100);
              return (
                <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 0', borderBottom:i<myActive.length-1?`1px solid ${T.border}`:'none', fontSize:11, fontFamily:T.fM }}>
                  <span style={{ color:T.text }}>{catalog.emoji} {catalog.title.slice(0,22)}</span>
                  <span style={{ color:T.accent, fontWeight:600 }}>{pct}%</span>
                </div>
              );
            })
          )}
        </GlassCard>
      </div>
      <GlassCard style={{ padding:'18px 22px' }}>
        <SectionLabel>Challenge Friends</SectionLabel>
        <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap' }}>
          <input value={newFriend} onChange={e=>setNewFriend(e.target.value)} placeholder="Friend's name" style={{ flex:1, minWidth:120, padding:'8px 12px', background:'rgba(255,255,255,0.04)', border:`1px solid ${T.border}`, borderRadius:T.r, fontFamily:T.fM, fontSize:12, color:T.text }} />
          <input value={friendCode} onChange={e=>setFriendCode(e.target.value)} placeholder="Their code" style={{ width:100, padding:'8px 12px', background:'rgba(255,255,255,0.04)', border:`1px solid ${T.border}`, borderRadius:T.r, fontFamily:T.fM, fontSize:12, color:T.text }} />
          <Btn onClick={addFriend} color={T.sky}>Add</Btn>
        </div>
        {friends.length===0 ? (
          <div style={{ fontSize:11, fontFamily:T.fM, color:T.textMuted, textAlign:'center', padding:'16px 0' }}>No friends added yet. Share your code above to start competing!</div>
        ) : (
          friends.map((f,i)=>(
            <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:i<friends.length-1?`1px solid ${T.border}`:'none' }}>
              <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                <div style={{ width:32, height:32, borderRadius:8, background:T.surface, border:`1px solid ${T.border}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>👤</div>
                <div>
                  <div style={{ fontSize:12, fontFamily:T.fD, fontWeight:600, color:T.text }}>{f.name}</div>
                  <div style={{ fontSize:9, fontFamily:T.fM, color:T.textSub }}>Code: {f.code} · Since {f.joined}</div>
                </div>
              </div>
              <button onClick={()=>setFriends(p=>p.filter((_,j)=>j!==i))} style={{ padding:4, borderRadius:6, background:T.surface, border:`1px solid ${T.border}`, opacity:0.4 }}><IcoTrash size={10} stroke={T.rose} /></button>
            </div>
          ))
        )}
      </GlassCard>
    </div>
  );
}

// ── RECURRING TRANSACTIONS DETECTED CARD ────────────────────────────────────
function RecurringDetectedCard({ detectedRecurring, cur, actions }) {
  const [showAll, setShowAll] = useState(false);
  const shown = showAll ? detectedRecurring : detectedRecurring.slice(0,4);
  if (!detectedRecurring.length) return null;
  return (
    <GlassCard style={{ padding:'20px 22px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
        <div><SectionLabel>Detected Recurring Transactions</SectionLabel><div style={{ fontSize:10, fontFamily:T.fM, color:T.textSub }}>{detectedRecurring.length} patterns found in expense history</div></div>
        {detectedRecurring.length>4&&<button onClick={()=>setShowAll(s=>!s)} style={{ fontSize:9, fontFamily:T.fM, color:T.accent }}>{showAll?'Show less':'Show all'}</button>}
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {shown.map((r,i)=>(
          <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 12px', borderRadius:T.r, background:T.surface, border:`1px solid ${T.border}` }}>
            <div style={{ display:'flex', gap:10, alignItems:'center' }}>
              <div style={{ width:32, height:32, borderRadius:8, background:T.skyDim, border:`1px solid ${T.sky}33`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>🔄</div>
              <div>
                <div style={{ fontSize:11, fontFamily:T.fD, fontWeight:600, color:T.text }}>{r.name}</div>
                <div style={{ fontSize:9, fontFamily:T.fM, color:T.textSub }}>{r.category} · {r.count} occurrences · Last: {r.months.slice(-1)[0]}</div>
              </div>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:12, fontFamily:T.fM, fontWeight:600, color:T.rose }}>{cur}{fmtN(r.avgAmount)}/mo</div>
              <div style={{ fontSize:9, fontFamily:T.fM, color:T.textSub }}>{cur}{fmtN(r.avgAmount*12)}/yr</div>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}



// ── CUSTOM METRICS MANAGER ────────────────────────────────────────────────────
function CustomMetricsTab({ data, actions }) {
  const {settings={}} = data;
  const customMetrics = settings.customMetrics || [];
  const [name, setName] = useState(''); const [unit, setUnit] = useState(''); const [icon, setIcon] = useState('📊'); const [min, setMin] = useState(0); const [max, setMax] = useState(100);

  const add = () => {
    if (!name.trim()) return;
    const m = { id: Date.now(), name:name.trim(), unit:unit.trim()||'', icon:icon||'📊', min:Number(min||0), max:Number(max||100) };
    actions.updateSettings({ ...settings, customMetrics:[...customMetrics, m] });
    setName(''); setUnit(''); setIcon('📊'); setMin(0); setMax(100);
  };
  const remove = (id) => actions.updateSettings({ ...settings, customMetrics:customMetrics.filter(m=>m.id!==id) });

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div><SectionLabel>Custom Health Metrics</SectionLabel><div style={{ fontSize:11, fontFamily:T.fM, color:T.textSub }}>Define your own trackable metrics beyond the defaults (weight, steps, sleep, mood, energy).</div></div>
      <GlassCard style={{ padding:'20px 22px' }}>
        <SectionLabel>Add New Metric</SectionLabel>
        <div style={{ display:'grid', gridTemplateColumns:'40px 1fr 80px 60px 60px', gap:8, marginBottom:10, alignItems:'center' }}>
          <input value={icon} onChange={e=>setIcon(e.target.value)} placeholder="📊" style={{ padding:'8px', background:'rgba(255,255,255,0.04)', border:`1px solid ${T.border}`, borderRadius:T.r, fontFamily:T.fM, fontSize:18, color:T.text, textAlign:'center' }} />
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="Metric name (e.g. Blood Pressure)" style={{ padding:'8px 12px', background:'rgba(255,255,255,0.04)', border:`1px solid ${T.border}`, borderRadius:T.r, fontFamily:T.fM, fontSize:12, color:T.text }} />
          <input value={unit} onChange={e=>setUnit(e.target.value)} placeholder="Unit (kg, bpm…)" style={{ padding:'8px 10px', background:'rgba(255,255,255,0.04)', border:`1px solid ${T.border}`, borderRadius:T.r, fontFamily:T.fM, fontSize:12, color:T.text }} />
          <input type="number" value={min} onChange={e=>setMin(e.target.value)} placeholder="Min" style={{ padding:'8px 8px', background:'rgba(255,255,255,0.04)', border:`1px solid ${T.border}`, borderRadius:T.r, fontFamily:T.fM, fontSize:12, color:T.text, textAlign:'center' }} />
          <input type="number" value={max} onChange={e=>setMax(e.target.value)} placeholder="Max" style={{ padding:'8px 8px', background:'rgba(255,255,255,0.04)', border:`1px solid ${T.border}`, borderRadius:T.r, fontFamily:T.fM, fontSize:12, color:T.text, textAlign:'center' }} />
        </div>
        <Btn onClick={add} color={T.sky}>Add Custom Metric</Btn>
      </GlassCard>
      <GlassCard style={{ padding:'20px 22px' }}>
        <SectionLabel>Default Metrics</SectionLabel>
        <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:16 }}>
          {['😴 Sleep (h)','😊 Mood /10','⚡ Energy /10','⚖️ Weight','👣 Steps','⭐ Sleep Quality /5'].map(m=>(
            <div key={m} style={{ padding:'6px 12px', borderRadius:99, background:T.skyDim, border:`1px solid ${T.sky}33`, fontSize:10, fontFamily:T.fM, color:T.sky }}>{m} <span style={{ opacity:0.5 }}>· built-in</span></div>
          ))}
        </div>
        {customMetrics.length === 0 ? (
          <div style={{ fontSize:11, fontFamily:T.fM, color:T.textMuted }}>No custom metrics yet. Add one above.</div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            <SectionLabel>Your Custom Metrics</SectionLabel>
            {customMetrics.map(m=>(
              <div key={m.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 14px', borderRadius:T.r, background:T.surface, border:`1px solid ${T.border}` }}>
                <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                  <span style={{ fontSize:20 }}>{m.icon}</span>
                  <div>
                    <div style={{ fontSize:12, fontFamily:T.fD, fontWeight:600, color:T.text }}>{m.name}</div>
                    <div style={{ fontSize:9, fontFamily:T.fM, color:T.textSub }}>Range: {m.min}–{m.max}{m.unit&&` ${m.unit}`}</div>
                  </div>
                </div>
                <button onClick={()=>remove(m.id)} style={{ padding:4, borderRadius:6, background:T.surface, border:`1px solid ${T.border}`, opacity:0.5 }}><IcoTrash size={10} stroke={T.rose} /></button>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}


// ── GMAIL INTEGRATION TAB ─────────────────────────────────────────────────────
function GmailIntegrationTab({ data }) {
  const {settings={}} = data;
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [query, setQuery] = useState('is:unread');
  const [error, setError] = useState(null);

  const fetchEmails = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method:'POST',
        headers:{ 'Content-Type':'application/json', 'x-api-key': settings.aiApiKey||'', 'anthropic-version':'2023-06-01', 'anthropic-beta':'mcp-client-2025-04-04', 'anthropic-dangerous-direct-browser-access':'true' },
        body: JSON.stringify({
          model:'claude-sonnet-4-20250514', max_tokens:1000,
          tools:[],
          mcp_servers:[{ type:'url', url:'https://gmail.mcp.claude.com/mcp', name:'gmail-mcp' }],
          messages:[{ role:'user', content:`List up to 10 emails matching query "${query}". For each email return: sender name, sender email, subject, date, and first 80 chars of body. Format as JSON array with fields: from, subject, date, preview. Only respond with the JSON array, no markdown.` }]
        })
      });
      const json = await res.json();
      const text = (json.content||[]).filter(b=>b.type==='text').map(b=>b.text).join('');
      try {
        const clean = text.replace(/```json|```/g,'').trim();
        setEmails(JSON.parse(clean));
      } catch { setEmails([]); setError('Could not parse email list. Check your MCP connection.'); }
    } catch(e) { setError('Gmail MCP connection failed. Make sure Gmail is connected in Claude settings.'); }
    setLoading(false);
  };

  const summarizeInbox = async () => {
    if (!emails.length) return;
    setSummaryLoading(true);
    try {
      const emailList = emails.map(e=>`From: ${e.from}\nSubject: ${e.subject}\nPreview: ${e.preview}`).join('\n---\n');
      const text = await callAI(settings, {
        max_tokens: 500,
        messages:[{ role:'user', content:`Summarize these emails in 3-4 sentences. Highlight any urgent items, action needed, or financial relevance:\n${emailList}` }]
      });
      setSummary(text||'No summary');
    } catch { setSummary('Error generating summary.'); }
    setSummaryLoading(false);
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div><SectionLabel>Gmail Integration</SectionLabel><div style={{ fontSize:11, fontFamily:T.fM, color:T.textSub }}>Read and summarize your inbox. Requires Gmail MCP connected in Claude settings.</div></div>
      <GlassCard style={{ padding:'18px 22px' }}>
        <div style={{ display:'flex', gap:8, marginBottom:10 }}>
          <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Gmail search (e.g. is:unread, from:bank, label:bills)" style={{ flex:1, padding:'9px 12px', background:'rgba(255,255,255,0.04)', border:`1px solid ${T.border}`, borderRadius:T.r, fontFamily:T.fM, fontSize:12, color:T.text }} />
          <Btn onClick={fetchEmails} color={T.sky}>{loading?'Loading…':'Fetch'}</Btn>
        </div>
        {error && <div style={{ fontSize:11, fontFamily:T.fM, color:T.rose, padding:'8px 12px', borderRadius:T.r, background:T.roseDim, border:`1px solid ${T.rose}33`, marginBottom:8 }}>{error}</div>}
        {(!settings.aiApiKey && settings.aiProvider !== 'ollama') && <div style={{ fontSize:10, fontFamily:T.fM, color:T.amber, marginTop:4 }}>⚠️ Add API key in Settings and connect Gmail MCP to use this feature.</div>}
        {['is:unread','label:bills','label:finance','from:bank','is:important'].map(q=>(
          <button key={q} onClick={()=>setQuery(q)} style={{ marginRight:6, marginBottom:6, padding:'3px 10px', borderRadius:99, fontSize:9, fontFamily:T.fM, background:query===q?T.skyDim:T.surface, color:query===q?T.sky:T.textSub, border:`1px solid ${query===q?T.sky+'33':T.border}` }}>{q}</button>
        ))}
      </GlassCard>
      {emails.length > 0 && (
        <GlassCard style={{ padding:'18px 22px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <SectionLabel>{emails.length} Emails</SectionLabel>
            <Btn onClick={summarizeInbox} color={T.violet} style={{ fontSize:11, padding:'5px 12px' }}>{summaryLoading?'Summarizing…':'AI Summary'}</Btn>
          </div>
          {summary && <div style={{ fontSize:12, fontFamily:T.fM, color:T.text, lineHeight:1.7, borderLeft:`3px solid ${T.violet}55`, paddingLeft:12, marginBottom:14 }}>{summary}</div>}
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {emails.map((e,i)=>(
              <div key={i} style={{ padding:'12px 14px', borderRadius:T.r, background:T.surface, border:`1px solid ${T.border}` }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                  <div style={{ fontSize:12, fontFamily:T.fD, fontWeight:600, color:T.text, flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'70%' }}>{e.subject||'(no subject)'}</div>
                  <div style={{ fontSize:9, fontFamily:T.fM, color:T.textMuted, flexShrink:0 }}>{e.date||''}</div>
                </div>
                <div style={{ fontSize:10, fontFamily:T.fM, color:T.sky }}>{e.from||''}</div>
                {e.preview && <div style={{ fontSize:10, fontFamily:T.fM, color:T.textSub, marginTop:4, lineHeight:1.4 }}>{e.preview}</div>}
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
}


// ── GOOGLE CALENDAR INTEGRATION ───────────────────────────────────────────────
function GoogleCalendarTab({ data }) {
  const {settings={}} = data;
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [view, setView] = useState('week'); // 'week' | 'month'

  const fetchEvents = async () => {
    setLoading(true); setError(null);
    try {
      const now = new Date().toISOString();
      const twoWeeks = new Date(Date.now() + 14*24*60*60*1000).toISOString();
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method:'POST',
        headers:{ 'Content-Type':'application/json', 'x-api-key': settings.aiApiKey||'', 'anthropic-version':'2023-06-01', 'anthropic-beta':'mcp-client-2025-04-04', 'anthropic-dangerous-direct-browser-access':'true' },
        body: JSON.stringify({
          model:'claude-sonnet-4-20250514', max_tokens:1200,
          mcp_servers:[{ type:'url', url:'https://gcal.mcp.claude.com/mcp', name:'gcal-mcp' }],
          messages:[{ role:'user', content:`List all calendar events from now until two weeks from now. For each event return: title, start datetime (ISO), end datetime (ISO), location if any, description if any. Format as JSON array with fields: title, start, end, location, description. Only respond with the JSON array, no markdown.` }]
        })
      });
      const json = await res.json();
      const text = (json.content||[]).filter(b=>b.type==='text').map(b=>b.text).join('');
      try {
        const clean = text.replace(/```json|```/g,'').trim();
        const parsed = JSON.parse(clean);
        setEvents(Array.isArray(parsed)?parsed:[]);
      } catch { setEvents([]); setError('Could not parse calendar events. Ensure Google Calendar MCP is connected.'); }
    } catch(e) { setError('Google Calendar MCP connection failed. Connect it in Claude.ai settings.'); }
    setLoading(false);
  };

  const aiSchedule = async () => {
    if (!events.length) return;
    setSummaryLoading(true);
    const list = events.slice(0,15).map(e=>`${e.title} — ${new Date(e.start).toLocaleString()}`).join('\n');
    try {
      const text = await callAI(settings, {
        max_tokens: 400,
        messages:[{ role:'user', content:`Analyze this 2-week schedule and give: 1) busiest days, 2) any scheduling conflicts or overload, 3) recommended focus/recovery days, 4) one productivity tip:\n${list}` }]
      });
      setSummary(text||'No summary');
    } catch { setSummary('Error generating schedule analysis.'); }
    setSummaryLoading(false);
  };

  const upcoming = [...events].sort((a,b)=>new Date(a.start)-new Date(b.start));
  // Bug-fix: renamed from `today` (which shadowed the module-level today() fn)
  // to todayDateStr to avoid confusion and future "today is not a function" crashes.
  const todayDateStr = new Date().toDateString();

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div><SectionLabel>Google Calendar</SectionLabel><div style={{ fontSize:11, fontFamily:T.fM, color:T.textSub }}>Sync your real calendar. Requires Google Calendar MCP connected in Claude settings.</div></div>
      <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
        <Btn onClick={fetchEvents} color={T.accent}>{loading?'Loading…':'Sync Calendar'}</Btn>
        {events.length>0&&<Btn onClick={aiSchedule} color={T.violet} style={{ fontSize:11 }}>{summaryLoading?'Analyzing…':'AI Schedule Analysis'}</Btn>}
        {(!settings.aiApiKey && settings.aiProvider !== 'ollama') && <div style={{ fontSize:10, fontFamily:T.fM, color:T.amber }}>⚠️ Add API key in Settings and connect Google Calendar MCP.</div>}
      </div>
      {error && <div style={{ fontSize:11, fontFamily:T.fM, color:T.rose, padding:'10px 14px', borderRadius:T.r, background:T.roseDim, border:`1px solid ${T.rose}33` }}>{error}</div>}
      {summary && (
        <GlassCard style={{ padding:'18px 22px' }}>
          <SectionLabel>Schedule Analysis</SectionLabel>
          <div style={{ fontSize:12, fontFamily:T.fM, color:T.text, lineHeight:1.7, whiteSpace:'pre-wrap', borderLeft:`3px solid ${T.violet}55`, paddingLeft:12 }}>{summary}</div>
        </GlassCard>
      )}
      {upcoming.length > 0 && (
        <GlassCard style={{ padding:'18px 22px' }}>
          <SectionLabel>Upcoming Events ({upcoming.length})</SectionLabel>
          <div style={{ display:'flex', flexDirection:'column', gap:10, marginTop:10 }}>
            {upcoming.map((e,i)=>{
              const start = new Date(e.start);
              const end = new Date(e.end||e.start);
              const isToday = start.toDateString()===todayDateStr;
              const dur = Math.round((end-start)/60000);
              return (
                <div key={i} style={{ display:'flex', gap:12, alignItems:'flex-start', padding:'12px 14px', borderRadius:T.r, background:isToday?T.accentLo:T.surface, border:`1px solid ${isToday?T.accent+'44':T.border}` }}>
                  <div style={{ flexShrink:0, textAlign:'center', minWidth:40 }}>
                    <div style={{ fontSize:9, fontFamily:T.fM, color:isToday?T.accent:T.textSub, textTransform:'uppercase', letterSpacing:'0.06em' }}>{start.toLocaleString('en',{month:'short'})}</div>
                    <div style={{ fontSize:18, fontFamily:T.fD, fontWeight:700, color:isToday?T.accent:T.text, lineHeight:1 }}>{start.getDate()}</div>
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontFamily:T.fD, fontWeight:600, color:T.text, marginBottom:3 }}>{e.title}</div>
                    <div style={{ fontSize:10, fontFamily:T.fM, color:T.textSub }}>{start.toLocaleString('en',{hour:'2-digit',minute:'2-digit',hour12:true})}{dur>0?` · ${dur<60?dur+'m':Math.round(dur/60)+'h'}`:''}
                    {e.location&&<span style={{ marginLeft:8, color:T.sky }}>📍 {e.location}</span>}</div>
                    {isToday && <div style={{ marginTop:4 }}><Badge color={T.accent}>Today</Badge></div>}
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>
      )}
      {!loading && events.length===0 && !error && (
        <GlassCard style={{ padding:'40px', textAlign:'center' }}>
          <div style={{ fontSize:32, marginBottom:12 }}>🗓</div>
          <div style={{ fontSize:13, fontFamily:T.fD, fontWeight:600, color:T.text, marginBottom:6 }}>No events loaded</div>
          <div style={{ fontSize:11, fontFamily:T.fM, color:T.textMuted }}>Click "Sync Calendar" to pull events from Google Calendar.<br/>Make sure Google Calendar MCP is connected in your Claude settings.</div>
        </GlassCard>
      )}
    </div>
  );
}

function clamp(min, val, max) { return Math.max(min, Math.min(max, val)); }

export default function LifeOS() {
  const [page, setPage] = useState('home');
  const [cmdOpen, setCmdOpen] = useState(false);
  const [globalModal, setGlobalModal] = useState(null);
  // ── Bug-fix: themeVersion forces a re-render after T is mutated so all
  // inline-style references to T.bg / T.accent etc. pick up the new values.
  const [themeVersion, setThemeVersion] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [pinUnlocked, setPinUnlocked] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [showMonthlyReview, setShowMonthlyReview] = useState(false);
  const [showWeeklyReview,  setShowWeeklyReview ] = useState(false);

  // ── STATE — same localStorage keys as original app ──────────────────────────
  const [settings,      setSettings      ] = useLocalStorage('los_settings',    { name:'', currency:'$', language:'en', incomeTarget:0, savingsTarget:30 });
  const [habits,        setHabits        ] = useLocalStorage('los_habits',       []);
  const [habitLogs,     setHabitLogs     ] = useDebouncedLocalStorage('los_habitlogs',    {}, 400);
  const [expenses,      setExpenses      ] = useLocalStorage('los_expenses',     []);
  const [incomes,       setIncomes       ] = useLocalStorage('los_incomes',      []);
  const [debts,         setDebts         ] = useLocalStorage('los_debts',        []);
  const [goals,         setGoals         ] = useLocalStorage('los_goals',        []);
  const [assets,        setAssets        ] = useLocalStorage('los_assets',       []);
  const [investments,   setInvestments   ] = useLocalStorage('los_investments',  []);
  const [vitals,        setVitals        ] = useLocalStorage('los_vitals',       []);
  const [notes,         setNotes         ] = useLocalStorage('los_notes',        []);
  const [focusSessions, setFocusSessions ] = useDebouncedLocalStorage('los_focus',        [], 1000);
  const [totalXP,       setTotalXP       ] = useDebouncedLocalStorage('los_xp',           0,  400);
  const [netWorthHistory,setNetWorthHistory]=useLocalStorage('los_nwhistory',    []);
  const [eventLog,      setEventLog      ] = useDebouncedLocalStorage('los_eventlog',     [], 800);
  const [quickNotes,    setQuickNotes    ] = useLocalStorage('los_qnotes',       []);
  const [subscriptions, setSubscriptions ] = useLocalStorage('los_subs',         []);
  const [budgets,       setBudgetsStore  ] = useLocalStorage('los_budgets',      {});
  const [bills,         setBills         ] = useLocalStorage('los_bills',        []);
  // ── S4: Career state ────────────────────────────────────────────────────────
  const [career,        setCareer        ] = useLocalStorage('los_career',        { jobs:[], skills:[], rex:[], cv:{} });
  const [chronicles,    setChronicles    ] = useLocalStorage('los_chronicles',   []);
  const [decisions,     setDecisions     ] = useLocalStorage('los_decisions',    []);
  const [challenges,    setChallenges    ] = useLocalStorage('los_challenges',   []);

  // ── NULL SANITIZER — defense-in-depth against JSON.parse("null") edge case ──
  // useLocalStorage guards against this, but if any value slipped through as null
  // (e.g. stored by an older version), these ensures arrays/objects are always safe.
  const _habits        = habits        || [];
  const _expenses      = expenses      || [];
  const _incomes       = incomes       || [];
  const _investments   = investments   || [];
  const _assets        = assets        || [];
  const _debts         = debts         || [];
  const _goals         = goals         || [];
  const _vitals        = vitals        || [];
  const _notes         = notes         || [];
  const _bills         = bills         || [];
  const _subscriptions = subscriptions || [];
  const _chronicles    = chronicles    || [];
  const _decisions     = decisions     || [];
  const _challenges    = challenges    || [];
  const _habitLogs     = habitLogs     || {};
  const _budgets       = budgets       || {};
  const _netWorthHistory = netWorthHistory || [];
  const _quickNotes    = quickNotes    || [];
  const _focusSessions = focusSessions || [];
  const _eventLog      = eventLog      || [];

  // ── Auto-log recurring expenses once per day ──────────────────────────────
  useEffect(() => {
    const AUTO_KEY = 'los_autoexp_last';
    const todayStr = today();
    if (localStorage.getItem(AUTO_KEY) === todayStr) return;
    const recurring = _expenses.filter(e => e.recurring);
    if (!recurring.length) return;
    const newExps = [];
    recurring.forEach(exp => {
      const freq = exp.frequency || 'monthly';
      // Find last auto-generated instance
      const lastDate = new Date(exp.date);
      const now = new Date();
      let nextDate = new Date(lastDate);
      if (freq === 'monthly')    nextDate.setMonth(nextDate.getMonth()+1);
      else if (freq === 'weekly')nextDate.setDate(nextDate.getDate()+7);
      else if (freq === 'bi-weekly') nextDate.setDate(nextDate.getDate()+14);
      else if (freq === 'yearly')  nextDate.setFullYear(nextDate.getFullYear()+1);
      else nextDate.setMonth(nextDate.getMonth()+1);
      if (nextDate <= now) {
        const nextStr = nextDate.toISOString().slice(0,10);
        // Only add if not already logged for that date+note combo
        const alreadyLogged = _expenses.some(e => e.date===nextStr && e.note===exp.note && e.category===exp.category);
        if (!alreadyLogged) {
          newExps.push({ ...exp, id:Date.now()+Math.random(), date:nextStr, autoLogged:true });
        }
      }
    });
    if (newExps.length) {
      setExpenses(p => [...newExps, ...p]);
      addToast(`Auto-logged ${newExps.length} recurring expense${newExps.length>1?'s':''}`, null, 5);
    }
    localStorage.setItem(AUTO_KEY, todayStr);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── S1: Toast/Undo system ──────────────────────────────────────────────────
  const [toasts, setToasts] = useState([]);
  const addToast = useCallback((message, onUndo, duration=6) => {
    const id = Date.now();
    setToasts(p => [...p, { id, message, onUndo, duration }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), duration * 1000 + 500);
    return id;
  }, []);
  const dismissToast = useCallback((id) => setToasts(p => p.filter(t => t.id !== id)), []);
  const handleUndo = useCallback((toastId) => {
    // Bug-fix: read onUndo from inside the functional updater so we always have
    // the latest state, eliminating the stale-closure risk on the old `toasts` dep.
    let undoFn = null;
    setToasts(p => {
      const found = p.find(t => t.id === toastId);
      if (found?.onUndo) undoFn = found.onUndo;
      return p.map(t => t.id === toastId ? { ...t, undone: true } : t);
    });
    // Execute after the state update is flushed
    setTimeout(() => { if (undoFn) undoFn(); }, 0);
    dismissToast(toastId);
  }, [dismissToast]);

  // ── Timeline — monthly prune: keep only last 3 months, run once per calendar day ──
  useEffect(() => {
    const PRUNE_KEY = 'los_last_prune';
    const todayStr = today();
    const lastPrune = localStorage.getItem(PRUNE_KEY) || '';
    if (lastPrune === todayStr) return; // already pruned today
    const cutoff = new Date(); cutoff.setMonth(cutoff.getMonth() - 3);
    const cutoffStr = cutoff.toISOString().slice(0,10);
    setEventLog(p => {
      const pruned = p.filter(ev => (ev.ts || '') >= cutoffStr).slice(0, 500); // date + cap
      if (pruned.length < p.length) {
        localStorage.setItem(PRUNE_KEY, todayStr);
        return pruned;
      }
      return p;
    });
    localStorage.setItem(PRUNE_KEY, todayStr);
  }, []); // run once per mount, guard via localStorage date stamp

  // ── Phase 1: Timeline Event Push Engine ────────────────────────────────────
  const pushEvent = useCallback((event) => {
    const ev = { id: Date.now(), ts: today(), ...event };
    setEventLog(p => [ev, ...p].slice(0, 500)); // Cap at 500 events
  }, []);

  // ── Phase 1: Net Worth Monthly Auto-Snapshot ───────────────────────────────
  useEffect(() => {
    const month = today().slice(0, 7);
    const already = _netWorthHistory.some(h => h.month === month);
    if (already) return;
    const invVal = _investments.reduce((s,i)=>s+Number((i.currentPrice??i.buyPrice)||0)*Number(i.quantity||0),0);
    const nw = _assets.reduce((s,a)=>s+Number(a.value||0),0)+invVal-_debts.reduce((s,d)=>s+Number(d.balance||0),0);
    if (nw !== 0 || _assets.length > 0 || _investments.length > 0) {
      setNetWorthHistory(p => [...(p||[]), { month, value: nw }].slice(-24));
    }
  }, []);

  // ── Phase 1: Command Palette Keyboard Shortcut ─────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setCmdOpen(v => !v); }
      if (e.key === 'Escape') setCmdOpen(false);
      // Single-key shortcuts — only when no input is focused
      if (!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)) {
        if (e.key === 'e') setGlobalModal('expense');
        if (e.key === 'n') setGlobalModal('note');
        if (e.key === 'h') setGlobalModal('habit');
        if (e.key === 'v') setGlobalModal('vitals');
        if (e.key === 'a') setShowAIPanel(v => !v);
        if (e.key === 'm') setShowMonthlyReview(v => !v);
        if (e.key === 'w') setShowWeeklyReview(v => !v);
        if (e.key === 'Escape') { setShowAIPanel(false); setShowMonthlyReview(false); setShowWeeklyReview(false); }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // ── S5: Apply theme + language reactively on settings change ─────────────────
  // Object.assign mutates T (used in all inline styles) but React doesn't know
  // about it. Bumping themeVersion causes LifeOS to re-render, which cascades
  // to all children and lets them read the updated T values.
  useEffect(() => {
    const savedTheme = settings.theme || 'dark';
    Object.assign(T, THEMES[savedTheme] || THEMES.dark);
    setThemeVersion(v => v + 1);
  }, [settings.theme]);

  // ── Step 4: Weekly Review auto-trigger — surfaces on Sunday after 6pm ────────
  useEffect(() => {
    const WEEKLY_KEY = 'los_weekly_review_last';
    const now        = new Date();
    const isSunday   = now.getDay() === 0;
    const isEvening  = now.getHours() >= 18;
    const thisWeekId = (() => {
      const d = new Date(now);
      d.setDate(d.getDate() - d.getDay()); // start of this week (Sun)
      return d.toISOString().slice(0,10);
    })();
    const lastShown = localStorage.getItem(WEEKLY_KEY);
    // Show if it's Sunday evening and not yet shown this week
    if (isSunday && isEvening && lastShown !== thisWeekId) {
      // Delay 3s so it doesn't fire on top of the loading screen
      const t = setTimeout(() => {
        setShowWeeklyReview(true);
        localStorage.setItem(WEEKLY_KEY, thisWeekId);
      }, 3000);
      return () => clearTimeout(t);
    }
  }, []); // run once on mount — Sunday check handles the rest

  // ── Month auto-summary on 1st of month ────────────────────────────────────
  useMonthAutoSummary({ expenses, incomes, habits, habitLogs, vitals, goals, settings, actions: { addChronicle: (c) => setChronicles(p => [c, ...p]) } });

  // ── Smart browser notifications ───────────────────────────────────────────
  useSmartNotifications({ habits, habitLogs, bills, budgets, expenses, vitals, settings });

  // ── Recurring Income Auto-log ─────────────────────────────────────────────
  // Mirrors the exact same pattern as the recurring-expense engine.
  // Fires once per day. Salary, freelance payments, dividends — anything marked
  // recurring gets posted to the current date when its period has elapsed.
  useEffect(() => {
    const AUTO_KEY = 'los_autoinc_last';
    const todayStr = today();
    if (localStorage.getItem(AUTO_KEY) === todayStr) return;
    const recurringIncomes = _incomes.filter(i => i.recurring);
    if (!recurringIncomes.length) { localStorage.setItem(AUTO_KEY, todayStr); return; }
    const newIncs = [];
    recurringIncomes.forEach(inc => {
      const freq = inc.frequency || 'monthly';
      const lastDate = new Date(inc.date);
      const now = new Date();
      let nextDate = new Date(lastDate);
      if (freq === 'monthly')    nextDate.setMonth(nextDate.getMonth()+1);
      else if (freq === 'weekly')  nextDate.setDate(nextDate.getDate()+7);
      else if (freq === 'bi-weekly') nextDate.setDate(nextDate.getDate()+14);
      else if (freq === 'quarterly') nextDate.setMonth(nextDate.getMonth()+3);
      else if (freq === 'yearly')  nextDate.setFullYear(nextDate.getFullYear()+1);
      else nextDate.setMonth(nextDate.getMonth()+1);
      if (nextDate <= now) {
        const nextStr = nextDate.toISOString().slice(0,10);
        const alreadyLogged = _incomes.some(i =>
          i.date === nextStr && i.note === inc.note && i.amount === inc.amount
        );
        if (!alreadyLogged) {
          newIncs.push({ ...inc, id:Date.now()+Math.random(), date:nextStr, autoLogged:true });
        }
      }
    });
    if (newIncs.length) {
      setIncomes(p => [...newIncs, ...p]);
      addToast(`Auto-logged ${newIncs.length} recurring income${newIncs.length>1?'s':''}`, null, 6);
    }
    localStorage.setItem(AUTO_KEY, todayStr);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── S5: Recurring Expense Auto-log ────────────────────────────────────────
  // Bug-fix: added the same daily date-guard used by the expenses effect below
  // so this can't fire twice on the same day (e.g. React StrictMode double-mount).
  useEffect(() => {
    const SUB_AUTO_KEY = 'los_subautoexp_last';
    const todayStr = today();
    if (localStorage.getItem(SUB_AUTO_KEY) === todayStr) return;
    const toAutoLog = (subscriptions || []).filter(sub => {
      if (!sub.nextDate || sub.paused) return false;
      return sub.nextDate <= todayStr;
    });
    if (!toAutoLog.length) { localStorage.setItem(SUB_AUTO_KEY, todayStr); return; }
    toAutoLog.forEach(sub => {
      const expense = { id:Date.now()+Math.random(), amount:Number(sub.amount||0), category:'💳 Subscriptions', note:`Auto: ${sub.name}`, date:todayStr };
      setExpenses(p => [expense, ...p]);
      // Advance nextDate by cycle
      const next = new Date(sub.nextDate);
      if (sub.cycle === 'monthly') next.setMonth(next.getMonth()+1);
      else if (sub.cycle === 'yearly') next.setFullYear(next.getFullYear()+1);
      else next.setDate(next.getDate()+7);
      setSubscriptions(p => p.map(s => s.id===sub.id ? { ...s, nextDate:next.toISOString().slice(0,10) } : s));
    });
    localStorage.setItem(SUB_AUTO_KEY, todayStr);
    if (toAutoLog.length) addToast(`Auto-logged ${toAutoLog.length} recurring expense${toAutoLog.length>1?'s':''}`, null, 5);
  }, []);

  // ── ACTIONS ────────────────────────────────────────────────────────────────
  const addExpense = useCallback((e) => {
    setExpenses(p => [e, ...p]);
    setTotalXP(x => Number(x) + 5);
    pushEvent({ type:'expense', title:e.note||e.category, value:`-${settings.currency||'$'}${e.amount}`, color:T.rose, domain:'money' });
  }, [pushEvent, settings.currency]);

  const addIncome = useCallback((i) => {
    setIncomes(p => [i, ...p]);
    setTotalXP(x => Number(x) + 10);
    pushEvent({ type:'income', title:i.note||'Income received', value:`+${settings.currency||'$'}${i.amount}`, color:T.emerald, domain:'money' });
  }, [pushEvent, settings.currency]);

  const removeIncome = useCallback((incId) => {
    const inc = (incomes||[]).find(i => i.id === incId);
    if (!inc) return;
    setIncomes(p => p.filter(i => i.id !== incId));
    addToast(`Income deleted: ${settings.currency||'$'}${fmtN(inc.amount)}`, () => setIncomes(p => [inc, ...p]));
    pushEvent({ type:'income_removed', title:'Income deleted', value:'', color:T.textSub, domain:'money' });
  }, [incomes, pushEvent, addToast, settings.currency]);

  const updateIncome = useCallback((incId, patch) => {
    setIncomes(p => p.map(i => i.id === incId ? { ...i, ...patch } : i));
    pushEvent({ type:'income_edited', title:'Income updated', value:'', color:T.emerald, domain:'money' });
  }, [pushEvent]);

  const addHabit = useCallback((name, opts={}) => {
    const h = { id: Date.now(), name, frequency:opts.frequency||'daily', emoji:opts.emoji||'🔥', xp:opts.xp||10, category:opts.category||'' };
    setHabits(p => [...p, h]);
    pushEvent({ type:'habit_created', title:`New habit: ${name}`, value:'+XP', color:T.accent, domain:'growth' });
  }, [pushEvent]);

  const logHabit = useCallback((habitId, date) => {
    const d = date || today();
    setHabitLogs(prev => {
      const logs = prev[habitId] || [];
      if (logs.includes(d)) return prev;
      return { ...prev, [habitId]: [...logs, d] };
    });
    setTotalXP(x => Number(x) + 10);
    const habit = (habits||[]).find(h => h.id === habitId);
    const isBackfill = d !== today();
    pushEvent({ type:'habit', title:`${habit?.name||'Habit'} completed${isBackfill ? ' (' + d + ')' : ''}`, value:'+10 XP', color:T.accent, domain:'growth' });
  }, [habits, pushEvent]);

  const removeHabit = useCallback((habitId) => {
    const h = (habits||[]).find(x => x.id === habitId);
    const savedLogs = habitLogs[habitId];
    setHabits(p => p.filter(x => x.id !== habitId));
    setHabitLogs(p => { const n = {...p}; delete n[habitId]; return n; });
    pushEvent({ type:'habit_removed', title:'Habit removed', value:'', color:T.textSub, domain:'growth' });
    addToast(`Habit "${h?.name||'Habit'}" deleted`, () => {
      setHabits(p => h ? [...p, h] : p);
      if (savedLogs) setHabitLogs(p => ({ ...p, [habitId]: savedLogs }));
    });
  }, [habits, habitLogs, pushEvent, addToast]);

  const addVitals = useCallback((v) => {
    setVitals(p => {
      const existing = p.findIndex(x => x.date === v.date);
      if (existing >= 0) { const n=[...p]; n[existing]={...n[existing],...v}; return n; }
      return [v, ...p];
    });
    setTotalXP(x => Number(x) + 8);
    pushEvent({ type:'vitals', title:'Vitals logged', value:`😴 ${v.sleep}h · 😊 ${v.mood}/10`, color:T.sky, domain:'health' });
  }, [pushEvent]);

  const removeVitals = useCallback((vId) => {
    setVitals(p => p.filter(v => v.id !== vId));
    addToast('Vitals entry deleted', null, 3);
  }, [addToast]);

  const updateVitals = useCallback((vId, patch) => {
    setVitals(p => p.map(v => v.id === vId ? { ...v, ...patch } : v));
  }, []);

  const addChronicle = useCallback((c) => {
    setChronicles(p => [c, ...p]);
  }, []);
  const removeChronicle = useCallback((id) => {
    setChronicles(p => p.filter(c => c.id !== id));
  }, []);
  const addDecision = useCallback((d) => {
    setDecisions(p => [d, ...p]);
  }, []);
  const removeDecision = useCallback((id) => {
    setDecisions(p => p.filter(d => d.id !== id));
  }, []);
  const joinChallenge = useCallback((challengeId) => {
    setChallenges(p => p.some(c=>c.challengeId===challengeId) ? p : [...p, { id:Date.now(), challengeId, startDate:today(), done:[] }]);
  }, []);
  const toggleChallengeDay = useCallback((challengeId, day) => {
    setChallenges(p => p.map(c => c.challengeId===challengeId ? { ...c, done:c.done.includes(day)?c.done.filter(d=>d!==day):[...c.done,day] } : c));
  }, []);
  const leaveChallenge = useCallback((challengeId) => {
    setChallenges(p => p.filter(c => c.challengeId !== challengeId));
  }, []);
  const addNote = useCallback((n) => {
    setNotes(p => [n, ...p]);
    setTotalXP(x => Number(x) + 5);
    pushEvent({ type:'note', title:n.title, value:`${n.tag}`, color:T.amber, domain:'knowledge' });
  }, [pushEvent]);

  const addGoal = useCallback((g) => {
    setGoals(p => [...p, g]);
    setTotalXP(x => Number(x) + 20);
    pushEvent({ type:'goal_created', title:`New goal: ${g.name}`, value:`Target: ${settings.currency||'$'}${g.target}`, color:T.violet, domain:'growth' });
  }, [pushEvent, settings.currency]);

  const removeGoal = useCallback((goalId) => {
    const g = (goals||[]).find(x => x.id === goalId);
    setGoals(p => p.filter(x => x.id !== goalId));
    pushEvent({ type:'goal_removed', title:'Goal removed', value:'', color:T.textSub, domain:'growth' });
    if (g) addToast(`Goal "${g.name}" deleted`, () => setGoals(p => [...p, g]));
  }, [goals, pushEvent, addToast]);

  const updateGoal = useCallback((goalId, patch) => {
    setGoals(p => p.map(g => g.id === goalId ? { ...g, ...patch, updatedAt: today() } : g));
  }, []);

  const addAsset = useCallback((a) => {
    setAssets(p => [...p, a]);
    setTotalXP(x => Number(x) + 15);
    pushEvent({ type:'asset', title:`Asset added: ${a.name}`, value:`${settings.currency||'$'}${a.value}`, color:T.accent, domain:'money' });
  }, [pushEvent, settings.currency]);

  const updateGoalProgress = useCallback((goalId, amount) => {
    setGoals(p => p.map(g => g.id === goalId ? { ...g, current: Number(g.current||0) + amount, updatedAt: today() } : g));
    setTotalXP(x => Number(x) + 25);
    const goal = (goals||[]).find(g => g.id === goalId);
    pushEvent({ type:'goal_progress', title:`Goal progress: ${goal?.name||'Goal'}`, value:`+${settings.currency||'$'}${amount}`, color:T.amber, domain:'growth' });
  }, [goals, pushEvent, settings.currency]);

  // Phase 3 — Debt Actions
  const addDebt = useCallback((d) => {
    setDebts(p => [...p, d]);
    setTotalXP(x => Number(x) + 5);
    pushEvent({ type:'debt_added', title:`Debt tracked: ${d.name}`, value:`${settings.currency||'$'}${d.balance}`, color:T.rose, domain:'money' });
  }, [pushEvent, settings.currency]);

  const payDebt = useCallback((debtId, amount) => {
    setDebts(p => p.map(d => d.id === debtId ? { ...d, balance: Math.max(0, Number(d.balance||0) - amount) } : d));
    setTotalXP(x => Number(x) + 15);
    const debt = (debts||[]).find(d => d.id === debtId);
    pushEvent({ type:'debt_payment', title:`Payment: ${debt?.name||'Debt'}`, value:`-${settings.currency||'$'}${amount}`, color:T.emerald, domain:'money' });
  }, [debts, pushEvent, settings.currency]);

  const removeDebt = useCallback((debtId) => {
    const d = (debts||[]).find(x => x.id === debtId);
    setDebts(p => p.filter(x => x.id !== debtId));
    pushEvent({ type:'debt_removed', title:'Debt removed', value:'Paid off! 🎉', color:T.emerald, domain:'money' });
    if (d) addToast(`Debt "${d.name}" removed`, () => setDebts(p => [...p, d]));
  }, [debts, pushEvent, addToast]);

  // Phase 4 — Investment Actions
  const addInvestment = useCallback((inv) => {
    setInvestments(p => [...p, inv]);
    setTotalXP(x => Number(x) + 15);
    pushEvent({ type:'investment', title:`Position: ${inv.symbol||inv.name}`, value:`×${inv.quantity} @ ${settings.currency||'$'}${inv.buyPrice}`, color:T.violet, domain:'money' });
  }, [pushEvent, settings.currency]);

  const removeInvestment = useCallback((invId) => {
    const inv = (investments||[]).find(i => i.id === invId);
    setInvestments(p => p.filter(i => i.id !== invId));
    pushEvent({ type:'investment_removed', title:'Investment position closed', value:'', color:T.textSub, domain:'money' });
    if (inv) addToast(`Position "${inv.symbol||inv.name}" closed`, () => setInvestments(p => [...p, inv]));
  }, [investments, pushEvent, addToast]);

  // Phase 2 — Subscription Actions
  const addSubscription = useCallback((sub) => {
    setSubscriptions(p => [...p, sub]);
    pushEvent({ type:'subscription', title:`Subscription: ${sub.name}`, value:`${settings.currency||'$'}${sub.amount}/${sub.cycle}`, color:T.sky, domain:'money' });
  }, [pushEvent, settings.currency]);

  const removeSubscription = useCallback((subId) => {
    setSubscriptions(p => p.filter(s => s.id !== subId));
    pushEvent({ type:'subscription_removed', title:'Subscription cancelled', value:'', color:T.textSub, domain:'money' });
  }, [pushEvent]);

  const updateSubscription = useCallback((subId, patch) => {
    setSubscriptions(p => p.map(s => s.id === subId ? { ...s, ...patch } : s));
    pushEvent({ type:'subscription_edited', title:'Subscription updated', value:'', color:T.sky, domain:'money' });
  }, [pushEvent]);

  // Phase 2 — Budget Actions
  const setBudgets = useCallback((b) => { setBudgetsStore(b); }, []);

  // ── S1 ACTIONS ──────────────────────────────────────────────────────────────
  const removeExpense = useCallback((expId) => {
    const exp = (expenses||[]).find(e => e.id === expId);
    if (!exp) return;
    setExpenses(p => p.filter(e => e.id !== expId));
    addToast(`Expense deleted: -${settings.currency||'$'}${fmtN(exp.amount)}`, () => setExpenses(p => [exp, ...p]));
    pushEvent({ type:'expense_removed', title:'Expense deleted', value:'', color:T.textSub, domain:'money' });
  }, [expenses, pushEvent, addToast, settings.currency]);

  const updateExpense = useCallback((expId, patch) => {
    setExpenses(p => p.map(e => e.id === expId ? { ...e, ...patch } : e));
    pushEvent({ type:'expense_edited', title:'Expense updated', value:'', color:T.rose, domain:'money' });
  }, [pushEvent]);

  const updateDebt = useCallback((debtId, patch) => {
    setDebts(p => p.map(d => d.id === debtId ? { ...d, ...patch } : d));
    pushEvent({ type:'debt_edited', title:'Debt updated', value:'', color:T.rose, domain:'money' });
  }, [pushEvent]);

  const updateNote = useCallback((id, patch) => {
    setNotes(p => p.map(n => n.id===id ? {...n,...patch} : n));
  }, []);
  const removeNote = useCallback((noteId) => {
    const note = (notes||[]).find(n => n.id === noteId);
    if (!note) return;
    setNotes(p => p.filter(n => n.id !== noteId));
    addToast(`Note deleted: "${note.title}"`, () => setNotes(p => [note, ...p]));
    pushEvent({ type:'note_removed', title:'Note deleted', value:'', color:T.textSub, domain:'knowledge' });
  }, [notes, pushEvent, addToast]);

  const addBill = useCallback((bill) => {
    setBills(p => [...p, bill]);
    pushEvent({ type:'bill_added', title:`Bill added: ${bill.name}`, value:`${settings.currency||'$'}${bill.amount}/mo`, color:T.sky, domain:'money' });
  }, [pushEvent, settings.currency]);

  const removeBill = useCallback((billId) => {
    const bill = (bills||[]).find(b => b.id === billId);
    if (!bill) return;
    setBills(p => p.filter(b => b.id !== billId));
    addToast(`Bill removed: "${bill.name}"`, () => setBills(p => [bill, ...p]));
  }, [bills, addToast]);

  const updateBill = useCallback((billId, patch) => {
    setBills(p => p.map(b => b.id === billId ? { ...b, ...patch } : b));
    pushEvent({ type:'bill_edited', title:'Bill updated', value:'', color:T.sky, domain:'money' });
  }, [pushEvent]);

  const markBillPaid = useCallback((billId) => {
    setBills(p => p.map(b => {
      if (b.id !== billId) return b;
      const next = new Date(b.nextDate); next.setMonth(next.getMonth()+1);
      return { ...b, paid:true, lastPaid:today(), nextDate:next.toISOString().slice(0,10) };
    }));
    addToast('Bill marked as paid ✓', null, 3);
  }, [addToast]);

  const addQuickNote = useCallback((qn) => {
    setQuickNotes(p => [qn, ...p]);
    pushEvent({ type:'qnote', title:'Quick note added', value:'', color:T.amber, domain:'knowledge' });
  }, [pushEvent]);

  const removeQuickNote = useCallback((qnId) => {
    const qn = quickNotes.find(n => n.id === qnId);
    setQuickNotes(p => p.filter(n => n.id !== qnId));
    if (qn) addToast('Quick note deleted', () => setQuickNotes(p => [qn, ...p]));
  }, [quickNotes, addToast]);

  const updateSettings = useCallback((s) => {
    // Apply theme immediately so the re-render sees the new T values
    if (s.theme && THEMES[s.theme]) Object.assign(T, THEMES[s.theme]);
    // Note: currentLang global removed (Bug 5 fix) — language flows via LangContext
    setSettings(s);
  }, []);

  // ── S2 ACTIONS ──────────────────────────────────────────────────────────────
  const updateHabit = useCallback((habitId, patch) => {
    setHabits(p => p.map(h => h.id === habitId ? { ...h, ...patch } : h));
    pushEvent({ type:'habit_edited', title:'Habit updated', value:'', color:T.accent, domain:'growth' });
  }, [pushEvent]);

  // ── S4 ACTIONS ──────────────────────────────────────────────────────────────
  const updateCareer = useCallback((updater) => {
    setCareer(prev => typeof updater === 'function' ? updater(prev) : { ...prev, ...updater });
  }, []);

  const updateInvestmentPrice = useCallback((invId, newPrice) => {
    setInvestments(p => p.map(i => i.id === invId ? { ...i, currentPrice: newPrice } : i));
  }, []);

  // ── CENTRAL COMPUTED VALUES — single source of truth for all pages ──────────
  const _thisMonth = today().slice(0,7);
  const computed = useMemo(() => {
    // Use sanitized arrays — guaranteed non-null
    const monthInc = _incomes.filter(i=>i.date?.startsWith(_thisMonth)).reduce((s,i)=>s+Number(i.amount||0),0);
    const monthExp = _expenses.filter(e=>e.date?.startsWith(_thisMonth)).reduce((s,e)=>s+Number(e.amount||0),0);
    const invVal   = _investments.reduce((s,i)=>s+Number((i.currentPrice??i.buyPrice)||0)*Number(i.quantity||0),0);
    const assetVal = _assets.reduce((s,a)=>s+Number(a.value||0),0);
    const debtVal  = _debts.reduce((s,d)=>s+Number(d.balance||0),0);
    const nw       = assetVal + invVal - debtVal;
    const savRate  = monthInc>0?((monthInc-monthExp)/monthInc)*100:0;
    const spendByCatMap = _expenses
      .filter(e=>e.date?.startsWith(_thisMonth))
      .reduce((m,e)=>{ m[e.category]=(m[e.category]||0)+Number(e.amount||0); return m; }, {});
    const topCatEntry = Object.entries(spendByCatMap).sort((a,b)=>b[1]-a[1])[0] || null;
    const level     = Math.floor(Math.sqrt(Number(totalXP)||0)/100)+1;
    return { monthInc, monthExp, invVal, assetVal, debtVal, nw, savRate, thisMonth:_thisMonth,
             spendByCatMap, topCatEntry, level };
  }, [_incomes, _expenses, _investments, _assets, _debts, _thisMonth, totalXP]);

  const actions = {
    addExpense, addIncome, removeIncome, updateIncome, addHabit, logHabit, removeHabit,
    addVitals, removeVitals, updateVitals, addNote, addGoal, removeGoal, updateGoal, addAsset,
    updateGoalProgress, updateSettings,
    addDebt, payDebt, removeDebt,
    addInvestment, removeInvestment,
    addSubscription, removeSubscription, updateSubscription,
    setBudgets,
    // S1
    removeExpense, updateExpense, updateDebt, removeNote, updateNote,
    addBill, removeBill, markBillPaid, updateBill,
    addQuickNote, removeQuickNote,
    // S2
    updateHabit,
    // S4
    updateCareer, updateInvestmentPrice,
    // Batch 1+2
    addChronicle, removeChronicle, addDecision, removeDecision, joinChallenge, toggleChallengeDay, leaveChallenge,
  };

  const isMobile = useMobile();
  const clockTime = useClock(); // UX fix: live-updating topbar clock
  const data = {
    expenses:_expenses, incomes:_incomes, assets:_assets, investments:_investments,
    debts:_debts, goals:_goals, habits:_habits, habitLogs:_habitLogs,
    vitals:_vitals, notes:_notes, totalXP, settings,
    netWorthHistory:_netWorthHistory, eventLog:_eventLog,
    focusSessions:_focusSessions, quickNotes:_quickNotes,
    subscriptions:_subscriptions, budgets:_budgets, bills:_bills, career,
    chronicles:_chronicles, challenges:_challenges, decisions:_decisions,
    computed,
    isMobile,
  };

  // ── DERIVED STATS for status bar — uses centralised computed ─────────────────
  const level = Math.floor(Math.sqrt(Number(totalXP)||0)/100)+1;
  const bestStreak = _habits.reduce((mx,h)=>{const s=getStreak(h.id,_habitLogs);return s>mx?s:mx;},0);
  const cur = settings.currency||'$';
  const { monthInc, monthExp, invVal, nw, savRate, thisMonth } = computed;

  // ── S3: Smart Alerts — computed centrally for TopBar bell ────────────────────
  const smartAlerts = useMemo(() => computeSmartAlerts({
    bills:_bills, budgets:_budgets, expenses:_expenses, habits:_habits,
    habitLogs:_habitLogs, vitals:_vitals, incomes:_incomes, goals:_goals,
    thisMonth, monthInc, savRate,
    netWorth: computed.nw,
    assets:_assets,
    investments:_investments,
  }), [_bills, _budgets, _expenses, _habits, _habitLogs, _vitals, _incomes, _goals, thisMonth, monthInc, savRate, computed.nw, _assets, _investments]);

  // ── S2: XP Pop notifications ────────────────────────────────────────────────
  const [xpPops, setXPPops] = useState([]);
  const addXPPop = useCallback((label, color=T.violet) => {
    const id = Date.now() + Math.random();
    setXPPops(p => [...p, { id, label, color }]);
    setTimeout(() => setXPPops(p => p.filter(x => x.id !== id)), 1900);
  }, []);

  // Hook XP pops onto key actions (called after each XP-earning event)
  const logHabitWithPop = useCallback((habitId, date) => {
    logHabit(habitId, date);
    const h = (habits||[]).find(x => x.id === habitId);
    const isBackfill = date && date !== today();
    addXPPop(`+${h?.xp||10} XP — ${h?.name||'Habit'} ✓${isBackfill ? ' (backfill)' : ''}`, T.accent);
  }, [logHabit, habits, addXPPop]);

  const addGoalWithPop = useCallback((g) => {
    addGoal(g); addXPPop('+20 XP — Goal Created 🎯', T.violet);
  }, [addGoal, addXPPop]);

  const addNoteWithPop = useCallback((n) => {
    addNote(n); addXPPop('+5 XP — Note Saved 📝', T.amber);
  }, [addNote, addXPPop]);

  const addExpenseWithPop = useCallback((e) => {
    addExpense(e); addXPPop('+5 XP — Expense Logged 💳', T.rose);
  }, [addExpense, addXPPop]);

  const addIncomeWithPop = useCallback((i) => {
    addIncome(i); addXPPop('+10 XP — Income Recorded 💰', T.emerald);
  }, [addIncome, addXPPop]);

  const addVitalsWithPop = useCallback((v) => {
    addVitals(v); addXPPop('+8 XP — Vitals Logged ❤️', T.sky);
  }, [addVitals, addXPPop]);

  // Achievement unlock detection — badge modal queue
  // Persist seen IDs to localStorage so reloads don't re-fire old achievements
  const [prevUnlocked, setPrevUnlocked] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('los_seen_badges') || '[]');
      return new Set(Array.isArray(saved) ? saved : []);
    } catch { return new Set(); }
  });
  const [badgeQueue, setBadgeQueue] = useState([]);
  const [showBadge, setShowBadge] = useState(null); // current badge being shown
  const [badgesEnabled, setBadgesEnabled] = useState(true); // user can disable
  useEffect(() => {
    if (!badgesEnabled) return;
    const newly = ACHIEVEMENTS.filter(a => a.check(data) && !prevUnlocked.has(a.id));
    if (newly.length) {
      setBadgeQueue(q => [...q, ...newly]);
      const updatedIds = new Set([...prevUnlocked, ...newly.map(a => a.id)]);
      setPrevUnlocked(updatedIds);
      try { localStorage.setItem('los_seen_badges', JSON.stringify([...updatedIds])); } catch {}
    }
  }, [data]);
  // Drain queue one badge at a time
  useEffect(() => {
    if (!showBadge && badgeQueue.length > 0) {
      setShowBadge(badgeQueue[0]);
      setBadgeQueue(q => q.slice(1));
    }
  }, [showBadge, badgeQueue]);

  // ── S2: Mobile state ────────────────────────────────────────────────────────
  const eb = (child) => <ErrorBoundary key={page}>{child}</ErrorBoundary>;
  const VIEW = {
    home:      eb(<HomePage      data={data} actions={{...actions, logHabit:logHabitWithPop, addExpense:addExpenseWithPop, addIncome:addIncomeWithPop}} onNav={setPage} />),
    timeline:  eb(<TimelinePage  data={data} />),
    money:     eb(<MoneyPage     data={data} actions={{...actions, addExpense:addExpenseWithPop, addIncome:addIncomeWithPop}} />),
    health:    eb(<HealthPage    data={data} actions={{...actions, addVitals:addVitalsWithPop}} />),
    growth:    eb(<GrowthPage    data={data} actions={{...actions, logHabit:logHabitWithPop, addGoal:addGoalWithPop}} />),
    knowledge: eb(<KnowledgePage data={data} actions={{...actions, addNote:addNoteWithPop}} />),
    career:    eb(<CareerPage    data={data} actions={actions} />),
    calendar:  eb(<CalendarPage  data={data} />),
    intel:     eb(<IntelligencePage data={data} actions={{...actions, addExpense:addExpenseWithPop, addIncome:addIncomeWithPop}} />),
    archive:   eb(<ArchivePage   data={data} />),
    settings:  eb(<SettingsPage  data={data} actions={actions} />),
  };

  // Global modal handler for Command Palette quick actions
  const handleGlobalModal = (modalName) => {
    setGlobalModal(modalName);
    setCmdOpen(false);
  };

  const lang = settings.language || 'en';
  // First-launch check
  useEffect(()=>{ if(!settings.onboarded&&!settings.name) setShowOnboarding(true); },[]);
  return (
    <LangContext.Provider value={lang}>
    <MoneyContext.Provider value={{ expenses, incomes, debts, assets, investments, budgets, subscriptions, bills, computed }}>
    <HealthContext.Provider value={{ vitals, habits, habitLogs }}>
    <GrowthContext.Provider value={{ goals, focusSessions, totalXP }}>
    {settings.pin && !pinUnlocked && <PinLockOverlay pin={settings.pin} onUnlock={()=>setPinUnlocked(true)} />}
    {showOnboarding && <OnboardingWizard onComplete={()=>setShowOnboarding(false)} onSkip={()=>{ setShowOnboarding(false); actions.updateSettings({...settings, onboarded:true}); }} actions={actions} settings={settings} />}
    <GlobalAIPanel open={showAIPanel} onClose={()=>setShowAIPanel(false)} data={data} />
    <MonthlyReviewModal open={showMonthlyReview} onClose={()=>setShowMonthlyReview(false)} data={data} actions={actions} />
    <WeeklyReviewModal  open={showWeeklyReview}  onClose={()=>setShowWeeklyReview(false)}  data={data} actions={actions} />
    <BadgeUnlockModal badge={showBadge} onClose={()=>setShowBadge(null)} />
    <div style={{ minHeight:'100vh', background:T.bg, color:T.text, fontFamily:T.fD, display:'flex' }}>
      {/* Ambient glow */}
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0, overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-200, left:T.sw, width:600, height:600, borderRadius:'50%', background:`radial-gradient(circle,${T.accent}05 0%,transparent 70%)` }} />
        <div style={{ position:'absolute', bottom:-200, right:100, width:500, height:500, borderRadius:'50%', background:`radial-gradient(circle,${T.violet}04 0%,transparent 70%)` }} />
      </div>

      {/* Command Palette — Phase 1 */}
      <CommandPalette open={cmdOpen} onClose={()=>setCmdOpen(false)} data={data} onNav={(p)=>{setPage(p);setCmdOpen(false);}} onModal={handleGlobalModal} />

      {/* Toast/Undo notifications — S1 */}
      <ToastContainer toasts={toasts} onUndo={handleUndo} onDismiss={dismissToast} isMobile={isMobile} />

      {/* XP Pop notifications — S2 */}
      <XPPopContainer pops={xpPops} />

      {/* Quick Capture FAB — S2 */}
      <QuickCaptureFAB onAction={handleGlobalModal} isMobile={isMobile} />

      {/* Bottom Nav — S2 mobile */}
      <BottomNav active={page} onNav={setPage} onAI={()=>setShowAIPanel(v=>!v)} showAI={showAIPanel} />

      {/* Global modals triggered from Command Palette / FAB */}
      <LogExpenseModal open={globalModal==='expense'} onClose={()=>setGlobalModal(null)} onSave={e=>{addExpenseWithPop(e);setGlobalModal(null);}} />
      <LogIncomeModal open={globalModal==='income'} onClose={()=>setGlobalModal(null)} onSave={e=>{addIncomeWithPop(e);setGlobalModal(null);}} />
      <LogHabitModal open={globalModal==='habit'} onClose={()=>setGlobalModal(null)} habits={habits} habitLogs={habitLogs} onLog={logHabitWithPop} onAddHabit={actions.addHabit} />
      <LogVitalsModal open={globalModal==='vitals'} onClose={()=>setGlobalModal(null)} onSave={e=>{addVitalsWithPop(e);setGlobalModal(null);}} />
      <AddNoteModal open={globalModal==='note'} onClose={()=>setGlobalModal(null)} onSave={e=>{addNoteWithPop(e);setGlobalModal(null);}} />
      <AddGoalModal open={globalModal==='goal'} onClose={()=>setGlobalModal(null)} onSave={e=>{addGoalWithPop(e);setGlobalModal(null);}} />
      <AddDebtModal open={globalModal==='debt'} onClose={()=>setGlobalModal(null)} onSave={e=>{actions.addDebt(e);setGlobalModal(null);}} />
      <AddInvestmentModal open={globalModal==='investment'} onClose={()=>setGlobalModal(null)} onSave={e=>{actions.addInvestment(e);setGlobalModal(null);}} />
      <AddSubscriptionModal open={globalModal==='subscription'} onClose={()=>setGlobalModal(null)} onSave={e=>{actions.addSubscription(e);setGlobalModal(null);}} />

      <Sidebar active={page} onNav={setPage} userName={settings.name} onAI={()=>setShowAIPanel(v=>!v)} showAI={showAIPanel} />

      <div style={{ flex:1, marginLeft:isMobile?0:T.sw, minHeight:'100vh', display:'flex', flexDirection:'column', position:'relative', zIndex:1 }}>
        {/* Topbar */}
        <div style={{ height:50, borderBottom:`1px solid ${T.border}`, display:'flex', alignItems:'center', padding:`0 ${isMobile?'14px':'28px'}`, justifyContent:'space-between', background:`${T.bg}dd`, backdropFilter:'blur(20px)', position:'sticky', top:0, zIndex:50 }}>
          <div style={{ display:'flex', alignItems:'center', gap:7 }}>
            {isMobile && (
              <button onClick={()=>setCmdOpen(true)} style={{ padding:'4px 6px', borderRadius:6, background:T.surface, border:`1px solid ${T.border}`, marginRight:4 }}>
                <IcoMenu size={14} stroke={T.textSub} />
              </button>
            )}
            <span style={{ fontSize:9, fontFamily:T.fM, color:T.textMuted, letterSpacing:'0.15em' }}>LIFE OS</span>
            <span style={{ color:T.textMuted, fontSize:11 }}>›</span>
            <span style={{ fontSize:9, fontFamily:T.fM, color:T.textSub, letterSpacing:'0.1em', textTransform:'uppercase' }}>{page}</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:isMobile?8:16 }}>
            {!isMobile && (
              <button onClick={()=>setCmdOpen(true)} className="los-btn" style={{ display:'flex', alignItems:'center', gap:6, padding:'4px 10px', borderRadius:7, background:T.surface, border:`1px solid ${T.border}`, fontSize:9, fontFamily:T.fM, color:T.textSub }}>
                <IcoSearch size={10} stroke={T.textSub} />
                Search <span style={{ color:T.textMuted }}>⌘K</span>
              </button>
            )}
            <div style={{ fontSize:9, fontFamily:T.fM, color:T.textSub, display:'flex', alignItems:'center', gap:5 }}>
              <div style={{ width:4, height:4, borderRadius:'50%', background:T.emerald, animation:'dotPulse 2.5s infinite' }} />
              {!isMobile && 'All Systems Online'}
            </div>
            <SmartAlertsButton alerts={smartAlerts} onNav={setPage} onModal={setGlobalModal} />
            {/* Weekly Review trigger — Step 4 */}
            {(() => {
              const WEEKLY_KEY = 'los_weekly_review_last';
              const now = new Date();
              const thisWeekId = (() => { const d=new Date(now); d.setDate(d.getDate()-d.getDay()); return d.toISOString().slice(0,10); })();
              const hasNew = localStorage.getItem(WEEKLY_KEY) !== thisWeekId && now.getDay() === 0;
              return (
                <button onClick={()=>setShowWeeklyReview(true)} title="Weekly Review (W)" style={{ position:'relative', padding:'5px 7px', borderRadius:7, background:'transparent', border:`1px solid transparent`, color:T.textSub, display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s' }}
                  onMouseEnter={e=>{e.currentTarget.style.background=T.surface;e.currentTarget.style.borderColor=T.border;e.currentTarget.style.color=T.text;}}
                  onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.borderColor='transparent';e.currentTarget.style.color=T.textSub;}}>
                  <IcoCalendar size={15} stroke="currentColor" />
                  {hasNew && <span style={{ position:'absolute', top:-2, right:-2, width:6, height:6, borderRadius:'50%', background:T.accent, animation:'dotPulse 2s infinite' }} />}
                </button>
              );
            })()}
            {/* Global AI Panel trigger */}
            <button onClick={()=>setShowAIPanel(v=>!v)} title="AI Life Coach (A)" style={{ position:'relative', padding:'5px 7px', borderRadius:7, background:showAIPanel?T.accentDim:'transparent', border:`1px solid ${showAIPanel?T.accent+'44':'transparent'}`, color:showAIPanel?T.accent:T.textSub, display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s', animation:showAIPanel?'none':'glowPulse 6s infinite' }}
              onMouseEnter={e=>{if(!showAIPanel){e.currentTarget.style.background=T.accentDim;e.currentTarget.style.borderColor=T.accent+'33';e.currentTarget.style.color=T.accent;}}}
              onMouseLeave={e=>{if(!showAIPanel){e.currentTarget.style.background='transparent';e.currentTarget.style.borderColor='transparent';e.currentTarget.style.color=T.textSub;}}}>
              <IcoBrain size={15} stroke="currentColor" />
              {!showAIPanel && <span style={{ position:'absolute', top:-2, right:-2, width:6, height:6, borderRadius:'50%', background:T.accent, animation:'dotPulse 2s infinite' }} />}
            </button>
            {!isMobile && <div style={{ fontSize:9, fontFamily:T.fM, color:T.textMuted }}>{clockTime}</div>}
          </div>
        </div>

        {/* Page */}
        <div key={page} style={{ flex:1, padding:isMobile?'18px 14px 80px':'26px 30px', overflowY:'auto', maxWidth:1180 }}>
          {VIEW[page]}
        </div>

        {/* Status bar — desktop only */}
        {!isMobile && (
          <div style={{ height:26, borderTop:`1px solid ${T.border}`, display:'flex', alignItems:'center', padding:'0 28px', gap:18, background:T.bg }}>
            {[
              { label:'NW',      val:`${cur}${fmtN(nw)}`,           color:T.accent  },
              { label:'LV',      val:`${level}`,                     color:T.violet  },
              { label:'SAVINGS', val:`${savRate.toFixed(0)}%`,       color:T.emerald },
              { label:'STREAK',  val:`🔥 ${bestStreak}d`,           color:T.amber   },
              { label:'HABITS',  val:`${_habits.length} tracked`,     color:T.sky     },
              { label:'DEBTS',   val:`${_debts.length} · ${cur}${fmtN(_debts.reduce((s,d)=>s+Number(d.balance||0),0))}`, color:_debts.length>0?T.rose:T.textMuted },
            ].map((item,i)=>(
              <div key={i} style={{ display:'flex', alignItems:'center', gap:4, fontSize:9, fontFamily:T.fM }}>
                <span style={{ color:T.textMuted, letterSpacing:'0.08em' }}>{item.label}</span>
                <span style={{ color:item.color, fontWeight:600 }}>{item.val}</span>
                {i<5&&<span style={{ color:T.textMuted, marginLeft:6 }}>·</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    </GrowthContext.Provider>
    </HealthContext.Provider>
    </MoneyContext.Provider>
    </LangContext.Provider>
  );
}
