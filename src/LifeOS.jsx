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
    @keyframes xpPop { 0% { opacity:0; transform:translateY(12px) scale(0.8); } 18% { opacity:1; transform:translateY(-6px) scale(1.12); } 55% { opacity:1; transform:translateY(-12px) scale(1); } 100% { opacity:0; transform:translateY(-28px) scale(0.9); } }
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
    input, textarea, select { outline:none; font-family:inherit; }
    input:focus, textarea:focus, select:focus { border-color:rgba(0,245,212,0.5) !important; }
    button { cursor:pointer; border:none; background:none; font-family:inherit; transition:all 0.18s ease; }
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
let currentLang = 'en';
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
const t = (key, lang) => {
  const l = lang || currentLang;
  return LOCALES[l]?.[key] || LOCALES.en[key] || key;
};

// ── LOCAL STORAGE HOOK ────────────────────────────────────────────────────────
function useLocalStorage(key, defaultVal) {
  const [val, setVal] = useState(() => {
    try { const s = localStorage.getItem(key); return s !== null ? JSON.parse(s) : defaultVal; }
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
    try { const s = localStorage.getItem(key); return s !== null ? JSON.parse(s) : defaultVal; }
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
    <div style={{ position:'fixed', top:64, right:24, zIndex:9997, display:'flex', flexDirection:'column', gap:6, alignItems:'flex-end', pointerEvents:'none' }}>
      {pops.map(pop => (
        <div key={pop.id} style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 13px', borderRadius:99, background:`${pop.color||T.violet}18`, border:`1px solid ${pop.color||T.violet}44`, color:pop.color||T.violet, fontFamily:T.fM, fontWeight:700, fontSize:13, letterSpacing:'0.03em', animation:'xpPop 1.8s ease forwards', whiteSpace:'nowrap' }}>
          ⚡ {pop.label}
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
function BottomNav({ active, onNav }) {
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
    </div>
  );
}

// ── TOAST / UNDO SYSTEM ───────────────────────────────────────────────────────
function ToastContainer({ toasts, onUndo, onDismiss }) {
  if (!toasts.length) return null;
  return (
    <div style={{ position:'fixed', bottom:42, left:'50%', transform:'translateX(-50%)', zIndex:9998, display:'flex', flexDirection:'column', gap:8, alignItems:'center', pointerEvents:'none' }}>
      {toasts.map(t => (
        <div key={t.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 18px', background:T.bg2, border:`1px solid ${T.border}`, borderRadius:12, boxShadow:`0 8px 32px rgba(0,0,0,0.5)`, animation:'slideDown 0.25s ease', fontFamily:T.fM, fontSize:12, color:T.text, pointerEvents:'all', minWidth:280 }}>
          <span style={{ flex:1 }}>{t.message}</span>
          {t.onUndo && (
            <button onClick={()=>onUndo(t.id)} style={{ display:'flex', alignItems:'center', gap:5, padding:'4px 10px', borderRadius:7, background:T.accentDim, border:`1px solid ${T.accent}44`, color:T.accent, fontSize:11, fontFamily:T.fM, fontWeight:600, cursor:'pointer' }}>
              <IcoUndo size={11} stroke={T.accent} /> Undo
            </button>
          )}
          <button onClick={()=>onDismiss(t.id)} style={{ color:T.textSub, padding:3 }}><IcoX size={13} stroke={T.textSub} /></button>
          {/* Progress bar showing 6s timer */}
          <div style={{ position:'absolute', bottom:0, left:0, right:0, height:2, borderRadius:'0 0 12px 12px', overflow:'hidden', background:'rgba(255,255,255,0.06)' }}>
            <div style={{ height:'100%', background:T.accent, animation:`toastTimer ${t.duration||6}s linear forwards` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── SIDEBAR ───────────────────────────────────────────────────────────────────
// NAV uses t() at render time via a getter so labels auto-update with lang
const NAV_DEFS = [
  { id:'home',      Icon:IcoHome,       tKey:'home'        },
  { id:'timeline',  Icon:IcoTimeline,   tKey:'timeline'    },
  { id:'money',     Icon:IcoMoney,      tKey:'money'       },
  { id:'health',    Icon:IcoHealth,     tKey:'health'      },
  { id:'growth',    Icon:IcoGrowth,     tKey:'growth'      },
  { id:'knowledge', Icon:IcoBook,       tKey:'knowledge'   },
  { id:'career',    Icon:IcoBriefcase,  tKey:'career'      },
  { id:'calendar',  Icon:IcoCalendar,   tKey:'calendar'    },
  { id:'intel',     Icon:IcoBrain,      tKey:'intel'       },
  { id:'archive',   Icon:IcoArchive,    tKey:'archive'     },
  { id:'settings',  Icon:IcoSettings,   tKey:'settings'    },
];
function Sidebar({ active, onNav, userName }) {
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
      if (!debts || debts.length === 0) return { months:0, totalInterest:0, payoffDate:null, impossible:false };
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
  if (!debts || debts.length === 0) return { months: 0, totalInterest: 0, payoffDate: new Date(), impossible: false };
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
  expenses.filter(e => e.date?.startsWith(month)).forEach(e => {
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
  const { notes, goals, habits, habitLogs, expenses, incomes, debts, investments, assets } = data;
  notes.forEach(n => items.push({ type:'note', icon:'📝', label:n.title, sub:n.body?.slice(0,60)||'', id:n.id, page:'knowledge', color:T.amber }));
  goals.forEach(g => items.push({ type:'goal', icon:'🎯', label:g.name, sub:`${Math.round(((g.current||0)/Math.max(1,g.target))*100)}% complete`, id:g.id, page:'growth', color:T.violet }));
  habits.forEach(h => items.push({ type:'habit', icon:'🔥', label:h.name, sub:`🔥 ${getStreak(h.id,habitLogs)}d streak`, id:h.id, page:'growth', color:T.accent }));
  expenses.slice(0,50).forEach(e => items.push({ type:'expense', icon:'💳', label:e.note||e.category, sub:`${e.date} · ${e.category}`, id:e.id, page:'money', color:T.rose }));
  debts.forEach(d => items.push({ type:'debt', icon:'⚠️', label:d.name||d.creditor, sub:`Balance: ${d.balance}`, id:d.id, page:'money', color:T.rose }));
  investments.forEach(inv => items.push({ type:'investment', icon:'📈', label:inv.symbol||inv.name, sub:`×${inv.quantity}`, id:inv.id, page:'money', color:T.violet }));
  assets.forEach(a => items.push({ type:'asset', icon:'💎', label:a.name, sub:a.type, id:a.id, page:'money', color:T.accent }));
  return items;
}

// ══════════════════════════════════════════════════════════════════════════════
// ── MODALS ─────────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

const CATS = ['🍽️ Food','🍔 Fast Food','🚗 Transport','❤️ Health','🏠 Housing','💳 Debts','💰 Savings','🎮 Leisure','👕 Shopping','🔧 Other','✈️ Travel','🚬 Tabac'];
// Resolve active categories — uses custom list if configured
const getActiveCats = () => { try { const s=JSON.parse(localStorage.getItem('los_settings')||'{}'); return s.customCats?.length ? s.customCats : CATS; } catch { return CATS; } };

function LogExpenseModal({ open, onClose, onSave }) {
  const [amt, setAmt] = useState(''); const [cat, setCat] = useState('🍽️ Food');
  const [note, setNote] = useState(''); const [date, setDate] = useState(today());
  const save = () => { if (!amt) return; onSave({ id:Date.now(), amount:Number(amt), category:cat, note, date }); setAmt(''); setNote(''); onClose(); };
  return (
    <Modal open={open} onClose={onClose} title="💳 Log Expense">
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        <Input type="number" value={amt} onChange={e=>setAmt(e.target.value)} placeholder="Amount" />
        <Select value={cat} onChange={e=>setCat(e.target.value)}>{getActiveCats().map(c=><option key={c}>{c}</option>)}</Select>
        <Input value={note} onChange={e=>setNote(e.target.value)} placeholder="Note (optional)" />
        <Input type="date" value={date} onChange={e=>setDate(e.target.value)} />
        <Btn full onClick={save} color={T.rose}>{t('save')}</Btn>
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
  const d = today();
  return (
    <Modal open={open} onClose={onClose} title="🔥 Log Habit">
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {habits.length === 0 && <div style={{ fontSize:12, fontFamily:T.fM, color:T.textSub, textAlign:'center', padding:16 }}>No habits yet. Create your first one below.</div>}
        {habits.map(h => {
          const done = (habitLogs[h.id]||[]).includes(d);
          const streak = getStreak(h.id, habitLogs);
          return (
            <div key={h.id} className="los-row" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 12px', borderRadius:T.r, background:done?T.accentDim:T.surface, border:`1px solid ${done?T.accent+'33':T.border}`, transition:'all 0.15s' }}>
              <div>
                <div style={{ fontSize:12, fontFamily:T.fD, fontWeight:600, color:T.text }}>{h.name}</div>
                <div style={{ fontSize:10, fontFamily:T.fM, color:T.textSub, marginTop:2 }}>🔥 {streak} day streak</div>
              </div>
              {done ? <Badge color={T.accent}>✓ Done</Badge> : <Btn onClick={()=>onLog(h.id)} color={T.accent} style={{ padding:'5px 14px' }}>Log</Btn>}
            </div>
          );
        })}
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

function LogVitalsModal({ open, onClose, onSave }) {
  const [sleep, setSleep] = useState(''); const [sleepQuality, setSleepQuality] = useState(0);
  const [mood, setMood] = useState(''); const [energy, setEnergy] = useState('');
  const [weight, setWeight] = useState(''); const [steps, setSteps] = useState('');
  const [note, setNote] = useState('');
  const save = () => {
    onSave({ id:Date.now(), date:today(), sleep:Number(sleep)||0, sleepQuality, mood:Number(mood)||0, energy:Number(energy)||0, weight:Number(weight)||0, steps:Number(steps)||0, note });
    setSleep(''); setSleepQuality(0); setMood(''); setEnergy(''); setWeight(''); setSteps(''); setNote(''); onClose();
  };
  return (
    <Modal open={open} onClose={onClose} title="❤️ Log Vitals">
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
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
        <Input type="number" value={weight} onChange={e=>setWeight(e.target.value)} placeholder="Weight (lbs/kg, optional)" />
        <Input type="number" value={steps} onChange={e=>setSteps(e.target.value)} placeholder="Steps today (optional)" />
        <Input value={note} onChange={e=>setNote(e.target.value)} placeholder="Note (optional)" />
        <Btn full onClick={save} color={T.sky}>Save Vitals</Btn>
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
    const debt = debts.find(d => String(d.id) === String(debtId));
    if (!debt || !amount) return;
    onPay(debt.id, Number(amount));
    setAmount(''); onClose();
  };
  useEffect(() => { if (open && debts.length > 0) setDebtId(String(debts[0].id)); }, [open, debts]);
  return (
    <Modal open={open} onClose={onClose} title="💸 Log Debt Payment">
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {debts.length === 0 ? (
          <div style={{ fontSize:12, fontFamily:T.fM, color:T.textSub, textAlign:'center', padding:20 }}>No debts tracked yet.</div>
        ) : (<>
          <Select value={debtId} onChange={e=>setDebtId(e.target.value)}>{debts.map(d=><option key={d.id} value={d.id}>{d.name} — ${fmtN(d.balance)} remaining</option>)}</Select>
          <Input type="number" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="Payment amount" />
          <Btn full onClick={save} color={T.emerald}>Record Payment</Btn>
        </>)}
      </div>
    </Modal>
  );
}

// Phase 4 — Add Investment Modal
function AddInvestmentModal({ open, onClose, onSave }) {
  const [symbol, setSymbol] = useState(''); const [name, setName] = useState('');
  const [qty, setQty] = useState(''); const [buyPrice, setBuyPrice] = useState('');
  const [currentPrice, setCurrentPrice] = useState(''); const [type, setType] = useState('Stock');
  const [date, setDate] = useState(today()); const [notes, setNotes] = useState('');
  const save = () => {
    if (!qty || !buyPrice) return;
    onSave({ id:Date.now(), symbol:symbol.trim().toUpperCase(), name:name.trim()||symbol.trim(), quantity:Number(qty), buyPrice:Number(buyPrice), currentPrice:Number(currentPrice)||Number(buyPrice), type, date, notes:notes.trim() });
    setSymbol(''); setName(''); setQty(''); setBuyPrice(''); setCurrentPrice(''); setNotes(''); onClose();
  };
  return (
    <Modal open={open} onClose={onClose} title="📈 Add Investment">
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        <Select value={type} onChange={e=>setType(e.target.value)}>{['Stock','ETF','Crypto','Bond','REIT','Other'].map(t=><option key={t}>{t}</option>)}</Select>
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
        {CATS.map(cat => (
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
        <Select value={cat} onChange={e=>setCat(e.target.value)}>{CATS.map(c=><option key={c}>{c}</option>)}</Select>
        <Input value={note} onChange={e=>setNote(e.target.value)} placeholder="Note (optional)" />
        <Input type="date" value={date} onChange={e=>setDate(e.target.value)} />
        <Btn full onClick={save} color={T.rose}>Save Changes</Btn>
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
    const total = habits.length || 1;
    const result = [];
    const now = new Date(); now.setHours(0,0,0,0);
    // Go back to start of week
    const startOffset = now.getDay();
    const start = new Date(now); start.setDate(start.getDate() - (WEEKS * 7) + (7 - startOffset));
    // Pre-build a date→count map for O(1) lookups instead of O(habits) per cell
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
    </div>
  );
});

// ══════════════════════════════════════════════════════════════════════════════
// ── S3: SMART ALERTS ENGINE (shared by TopBar + HomePage) ────────────────────
// ══════════════════════════════════════════════════════════════════════════════
function computeSmartAlerts({ bills, budgets, expenses, habits, habitLogs, vitals, thisMonth, monthInc, savRate }) {
  const today_ = today();
  const alerts = [];
  // Bills due / overdue
  (bills||[]).filter(b=>!b.paid).forEach(b => {
    const d = Math.ceil((new Date(b.nextDate)-new Date())/(1000*60*60*24));
    if (d <= 3) alerts.push({ icon:d<0?'🚨':'⏰', msg:`${b.name} bill ${d<0?'overdue by '+(-d)+'d':'due in '+d+'d'}`, color:d<0?T.rose:T.amber, priority:d<0?0:1 });
  });
  // Budget over 90%
  Object.entries(budgets||{}).forEach(([cat, limit]) => {
    const spent = expenses.filter(e=>e.date?.startsWith(thisMonth)&&e.category?.includes(cat.split(' ')[1]||cat)).reduce((s,e)=>s+Number(e.amount||0),0);
    const pct = limit>0?(spent/limit)*100:0;
    if (pct>=90) alerts.push({ icon:pct>=100?'🔴':'🟡', msg:`${cat} ${pct>=100?'over budget':'at '+Math.round(pct)+'% of budget'}`, color:pct>=100?T.rose:T.amber, priority:pct>=100?0:2 });
  });
  // Streak at risk (logged yesterday but not today, after 18:00)
  habits.forEach(h => {
    const logs = habitLogs[h.id]||[];
    const yday = new Date(); yday.setDate(yday.getDate()-1);
    const ys = yday.toISOString().slice(0,10);
    if (logs.includes(ys) && !logs.includes(today_) && new Date().getHours() >= 18) {
      alerts.push({ icon:'🔥', msg:`${h.name} streak at risk! Log today`, color:T.accent, priority:1 });
    }
  });
  // Low savings rate
  if (monthInc > 0 && savRate < 10) alerts.push({ icon:'📉', msg:`Savings rate only ${savRate.toFixed(0)}% this month`, color:T.amber, priority:3 });
  // No vitals in 3 days
  if (vitals.length > 0) {
    const lastV = [...vitals].sort((a,b)=>a.date<b.date?1:-1)[0];
    const daysSince = Math.round((new Date()-new Date(lastV.date))/(1000*60*60*24));
    if (daysSince >= 3) alerts.push({ icon:'❤️', msg:`No vitals logged in ${daysSince} days`, color:T.sky, priority:3 });
  }
  return [...alerts].sort((a,b)=>a.priority-b.priority).slice(0,6);
}

// ── SmartAlertsButton — appears in TopBar ─────────────────────────────────────
function SmartAlertsButton({ alerts }) {
  const [open, setOpen] = useState(false);
  if (!alerts.length) return (
    <button style={{ position:'relative', padding:'5px 7px', borderRadius:7, background:'transparent', border:`1px solid transparent`, color:T.textMuted, display:'flex', alignItems:'center', justifyContent:'center' }} title="No alerts">
      <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
    </button>
  );
  return (
    <div style={{ position:'relative' }}>
      <button onClick={()=>setOpen(v=>!v)} style={{ position:'relative', padding:'5px 7px', borderRadius:7, background:open?T.amberDim:'transparent', border:`1px solid ${open?T.amber+'44':'transparent'}`, color:T.amber, display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s' }} title={`${alerts.length} alert${alerts.length>1?'s':''}`}>
        <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
        <span style={{ position:'absolute', top:-3, right:-3, width:14, height:14, borderRadius:'50%', background:T.rose, border:`1.5px solid ${T.bg}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:7, fontFamily:T.fM, fontWeight:700, color:'#fff' }}>{alerts.length}</span>
      </button>
      {open && (
        <>
          <div onClick={()=>setOpen(false)} style={{ position:'fixed', inset:0, zIndex:498 }} />
          <div style={{ position:'absolute', top:'calc(100% + 8px)', right:0, width:320, background:T.bg2, border:`1px solid ${T.borderLit}`, borderRadius:12, boxShadow:`0 12px 40px rgba(0,0,0,0.5)`, zIndex:499, animation:'slideDown 0.18s ease', overflow:'hidden' }}>
            <div style={{ padding:'10px 14px', borderBottom:`1px solid ${T.border}`, display:'flex', alignItems:'center', gap:7 }}>
              <span style={{ fontSize:9, fontFamily:T.fM, color:T.amber, letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:700 }}>⚠️ Smart Alerts · {alerts.length}</span>
            </div>
            <div style={{ padding:'8px 0', maxHeight:320, overflowY:'auto' }}>
              {alerts.map((a,i)=>(
                <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 14px', borderBottom:i<alerts.length-1?`1px solid ${T.border}`:'none' }}>
                  <span style={{ fontSize:16, flexShrink:0 }}>{a.icon}</span>
                  <span style={{ fontSize:11, fontFamily:T.fM, color:T.text, lineHeight:1.45 }}>{a.msg}</span>
                  <span style={{ marginLeft:'auto', width:6, height:6, borderRadius:'50%', flexShrink:0, background:a.color }} />
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
  const { expenses, incomes, assets, investments, debts, habits, habitLogs, goals, vitals, totalXP, settings, notes, budgets } = data;
  const [modal, setModal] = useState(null);
  const [showMoodBanner, setShowMoodBanner] = useState(() => !vitals.some(v=>v.date===today()));
  const [weeklyFocusEdit, setWeeklyFocusEdit] = useState(false);
  const weeklyFocus = settings.weeklyFocus || ['','',''];
  const cur = settings.currency || '$'; const thisMonth = today().slice(0,7);
  const hour = new Date().getHours();
  const greeting = hour<12?'Good morning':hour<17?'Good afternoon':'Good evening';
  // Use pre-computed values from App root (no duplicate reduce loops)
  const { monthExp, monthInc, invVal, assetVal, debtVal, nw: netWorth, savRate } = data.computed;
  const fhs = useMemo(()=>{ let s=0; s+=Math.min(30,savRate*1.5); const mdp=debts.reduce((a,d)=>a+Number(d.minPayment||0),0); const dti=monthInc>0?(mdp/monthInc)*100:50; s+=Math.max(0,25-dti*0.5); const cash=assets.filter(a=>a.type==='Cash').reduce((a,x)=>a+Number(x.value||0),0); const ef=monthExp>0?cash/monthExp:0; s+=Math.min(25,ef*4.2); if(netWorth>0)s+=Math.min(20,10+(netWorth/10000)*5); return Math.round(Math.max(0,Math.min(100,s))); },[savRate,debts,assets,monthInc,monthExp,netWorth]);
  const level = Math.floor(Math.sqrt(Number(totalXP)/100))+1;
  const xpForNext = Math.pow(level,2)*100; const xpForCurrent = Math.pow(level-1,2)*100;
  const xpPct = ((Number(totalXP)-xpForCurrent)/(xpForNext-xpForCurrent))*100;
  const todayDone = habits.filter(h=>(habitLogs[h.id]||[]).includes(today())).length;
  const bestStreak = habits.reduce((max,h)=>{ const s=getStreak(h.id,habitLogs); return s>max?s:max; },0);
  const lastVitals = vitals.length ? [...vitals].sort((a,b)=>a.date<b.date?1:-1)[0] : null;
  const recentEvents = useMemo(()=>{
    const evs = [];
    [...expenses].sort((a,b)=>a.date<b.date?1:-1).slice(0,3).forEach(e=>evs.push({ id:'exp-'+e.id, ts:e.date, title:e.note||e.category, sub:e.category, value:`-${cur}${fmtN(e.amount)}`, cat:'expense', color:T.rose }));
    [...incomes].sort((a,b)=>a.date<b.date?1:-1).slice(0,2).forEach(e=>evs.push({ id:'inc-'+e.id, ts:e.date, title:e.note||'Income', sub:'Income logged', value:`+${cur}${fmtN(e.amount)}`, cat:'income', color:T.emerald }));
    habits.forEach(h=>{ const logs=(habitLogs[h.id]||[]); const d=logs.includes(today())?today():logs[logs.length-1]; if(d) evs.push({ id:'hab-'+h.id, ts:d, title:h.name, sub:`🔥 ${getStreak(h.id,habitLogs)} day streak`, value:'+XP', cat:'habit', color:T.accent }); });
    if(lastVitals) evs.push({ id:'vit-0', ts:lastVitals.date, title:'Vitals Logged', sub:`Sleep ${lastVitals.sleep}h · Mood ${lastVitals.mood}/10`, value:'❤️', cat:'health', color:T.sky });
    return evs.sort((a,b)=>a.ts<b.ts?1:-1).slice(0,6);
  },[expenses,incomes,habits,habitLogs,lastVitals,cur]);

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
        <div style={{ marginBottom:14, padding:'12px 18px', borderRadius:T.r, background:`${T.sky}11`, border:`1px solid ${T.sky}33`, display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontSize:18 }}>☀️</span>
            <div>
              <div style={{ fontSize:12, fontFamily:T.fD, fontWeight:600, color:T.text }}>Daily Check-in</div>
              <div style={{ fontSize:10, fontFamily:T.fM, color:T.textSub }}>You haven't logged vitals today. How are you feeling?</div>
            </div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <Btn onClick={()=>{ setModal('vitals'); setShowMoodBanner(false); }} color={T.sky} style={{ padding:'5px 14px' }}>Log Now</Btn>
            <button onClick={()=>setShowMoodBanner(false)} style={{ padding:'5px 10px', borderRadius:T.r, background:T.surface, border:`1px solid ${T.border}`, fontSize:9, fontFamily:T.fM, color:T.textMuted }}>Later</button>
          </div>
        </div>
      )}
      <div style={{ marginBottom:26 }}>
        <div style={{ fontSize:10, fontFamily:T.fM, color:T.textSub, letterSpacing:'0.1em', marginBottom:5, textTransform:'uppercase' }}>{greeting.toUpperCase()} · {new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})}</div>
        <h1 style={{ fontSize:26, fontFamily:T.fD, fontWeight:800, color:T.text }}>Command Center</h1>
        <div style={{ fontSize:11, fontFamily:T.fM, color:T.textSub, marginTop:4 }}>
          {settings.name?`Welcome back, ${settings.name} · `:''}<span style={{ color:T.emerald }}>●</span> {habits.length} habits · <span style={{ color:T.accent }}>●</span> NW {cur}{fmtN(netWorth)} · <span style={{ color:T.textMuted, cursor:'pointer' }} onClick={()=>{}}>⌘K to search</span>
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(170px,1fr))', gap:12, marginBottom:18 }}>
        {[
          { label:'Net Worth', value:`${cur}${fmtN(netWorth)}`, sub:`Assets ${cur}${fmtN(assetVal+invVal)} · Debts ${cur}${fmtN(debtVal)}`, color:T.accent, icon:'💎', pct:null },
          { label:'Financial Health', value:`${fhs}/100`, sub:fhs>=70?'Strong finances':fhs>=40?'Room to improve':'Needs attention', color:T.emerald, icon:'📊', pct:fhs },
          { label:`Life XP — Lv ${level}`, value:`${Number(totalXP).toLocaleString()} XP`, sub:`${Math.round(xpForNext-Number(totalXP))} to Lv ${level+1}`, color:T.violet, icon:'⚡', pct:xpPct },
          { label:'Savings Rate', value:`${savRate.toFixed(1)}%`, sub:`${cur}${fmtN(monthInc-monthExp)} saved this month`, color:T.sky, icon:'🎯', pct:savRate },
        ].map((m,i)=>(
          <GlassCard key={i} style={{ padding:'18px 20px', animation:`fadeUp 0.4s ease ${i*0.08}s both` }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
              <div style={{ fontSize:9, fontFamily:T.fM, color:T.textSub, letterSpacing:'0.1em', textTransform:'uppercase' }}>{m.label}</div>
              <span style={{ fontSize:16, opacity:0.7 }}>{m.icon}</span>
            </div>
            <div style={{ fontSize:20, fontFamily:T.fD, fontWeight:700, color:m.color, lineHeight:1, marginBottom:6 }}>{m.value}</div>
            <div style={{ fontSize:10, fontFamily:T.fM, color:T.textSub, marginBottom:m.pct!=null?10:0 }}>{m.sub}</div>
            {m.pct!=null && <ProgressBar pct={m.pct} color={m.color} height={4} />}
          </GlassCard>
        ))}
      </div>
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
        expenses.filter(e=>e.date?.startsWith(thisM)).forEach(e=>{ const c=e.category; budgetStatus[c]=(budgetStatus[c]||0)+Number(e.amount||0); });
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

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(min(340px,100%),1fr))', gap:16 }}>
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {/* Smart Alerts — now rendered in TopBar bell icon (S3) */}
          <GlassCard style={{ padding:'20px 22px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:14 }}>
              <div style={{ width:5, height:5, borderRadius:'50%', background:'#c084fc', animation:'dotPulse 2s infinite' }} />
              <span style={{ fontSize:9, fontFamily:T.fM, letterSpacing:'0.1em', color:'#c084fc', textTransform:'uppercase' }}>AI Daily Brief</span>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
              {[
                { icon:'💰', label:'Finance', msg:savRate>35?`Savings rate ${savRate.toFixed(0)}% — excellent!`:`Monthly spend ${cur}${fmtN(monthExp)} vs income ${cur}${fmtN(monthInc)}. Rate: ${savRate.toFixed(1)}%.` },
                { icon:'❤️', label:'Health', msg:lastVitals?`Last logged: sleep ${lastVitals.sleep}h, mood ${lastVitals.mood}/10. ${lastVitals.sleep>=7?'Great rest!':'Aim for 7–8h.'}`:'Log your vitals today to track health trends.' },
                { icon:'🔥', label:'Habits', msg:`${todayDone}/${habits.length} habits done today. ${bestStreak>0?`Best streak: ${bestStreak} days 🔥`:'Start building streaks.'}` },
              ].map((item,i)=>(
                <div key={i} style={{ background:T.accentLo, borderRadius:T.r, padding:'12px 14px', border:`1px solid ${T.border}`, animation:`fadeUp 0.4s ease ${i*0.1+0.2}s both` }}>
                  <div style={{ fontSize:16, marginBottom:5 }}>{item.icon}</div>
                  <div style={{ fontSize:9, fontFamily:T.fM, color:T.textSub, letterSpacing:'0.08em', marginBottom:3 }}>{item.label.toUpperCase()}</div>
                  <div style={{ fontSize:11, fontFamily:T.fM, color:T.text, lineHeight:1.5 }}>{item.msg}</div>
                </div>
              ))}
            </div>
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
              { label:'Habits', sub:`${todayDone}/${habits.length} today`, val:bestStreak?`🔥 ${bestStreak}d`:habits.length===0?'None yet':'0d', color:T.accent },
              { label:'Goals', sub:`${goals.length} active`, val:goals.length>0?`${Math.round(goals.reduce((s,g)=>s+(g.current||0)/Math.max(1,g.target)*100,0)/Math.max(1,goals.length))}% avg`:'Set goals', color:T.violet },
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
              <button onClick={()=>onNav('growth')} style={{ fontSize:9, fontFamily:T.fM, color:T.accent, display:'flex', alignItems:'center', gap:2 }}>All <IcoChevR size={9} stroke={T.accent} /></button>
            </div>
            {habits.length === 0 ? (
              <div style={{ textAlign:'center', padding:'16px 0', fontSize:11, fontFamily:T.fM, color:T.textMuted }}>No habits tracked yet.<br/><button onClick={()=>setModal('habit')} style={{ color:T.accent, fontSize:11, fontFamily:T.fM, marginTop:6, cursor:'pointer' }}>+ Add habit</button></div>
            ) : (
              habits.map((h,i) => {
                const done = (habitLogs[h.id]||[]).includes(today());
                const streak = getStreak(h.id, habitLogs);
                const HCOLORS=[T.accent,T.violet,T.sky,T.amber,T.rose,T.emerald];
                const hc = HCOLORS[i%HCOLORS.length];
                return (
                  <div key={h.id} className="los-row" style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 6px', borderRadius:8, borderBottom:`1px solid ${T.border}`, transition:'background 0.15s', marginBottom:2 }}>
                    <button onClick={()=>!done&&actions.logHabit(h.id)} style={{ width:22, height:22, borderRadius:6, flexShrink:0, background:done?hc+'33':T.surface, border:`1.5px solid ${done?hc:T.border}`, display:'flex', alignItems:'center', justifyContent:'center', cursor:done?'default':'pointer', transition:'all 0.18s' }}>
                      {done && <span style={{ fontSize:11, color:hc }}>✓</span>}
                    </button>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:11, fontFamily:T.fD, fontWeight:600, color:done?T.textSub:T.text, textDecoration:done?'line-through':'none', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{h.emoji||'🔥'} {h.name}</div>
                    </div>
                    <span style={{ fontSize:9, fontFamily:T.fM, color:streak>0?hc:T.textMuted, flexShrink:0 }}>🔥 {streak}d</span>
                  </div>
                );
              })
            )}
            <div style={{ marginTop:10, paddingTop:10, borderTop:`1px solid ${T.border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontSize:10, fontFamily:T.fM, color:T.textSub }}>{todayDone}/{habits.length} done today</span>
              <ProgressBar pct={habits.length>0?(todayDone/habits.length)*100:0} color={T.accent} height={4} />
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
    </div>
  );
}

// ── TIMELINE PAGE ─────────────────────────────────────────────────────────────
function TimelinePage({ data }) {
  const { expenses, incomes, habits, habitLogs, vitals, goals, investments, debts, settings } = data;
  const [filter, setFilter] = useState('all');
  const cur = settings.currency || '$';
  // Per-category memos — each only recalculates when its source data changes
  const expenseEvs    = useMemo(() => expenses.map(e=>({ id:'e-'+e.id, ts:e.date, title:e.note||e.category, sub:e.category, value:`-${cur}${fmtN(e.amount)}`, cat:'expense', color:T.rose, emoji:'💳' })), [expenses, cur]);
  const incomeEvs     = useMemo(() => incomes.map(i=>({ id:'i-'+i.id, ts:i.date, title:i.note||'Income received', sub:'Income', value:`+${cur}${fmtN(i.amount)}`, cat:'income', color:T.emerald, emoji:'💰' })), [incomes, cur]);
  const habitEvs      = useMemo(() => { const evs=[]; habits.forEach(h=>(habitLogs[h.id]||[]).forEach(d=>evs.push({ id:'h-'+h.id+d, ts:d, title:h.name+' completed', sub:'Habit · 🔥 streak', value:'+XP', cat:'habit', color:T.accent, emoji:'🔥' }))); return evs; }, [habits, habitLogs]);
  const vitalEvs      = useMemo(() => vitals.map(v=>({ id:'v-'+v.id, ts:v.date, title:'Vitals Logged', sub:`Sleep ${v.sleep}h · Mood ${v.mood}/10`, value:'❤️', cat:'health', color:T.sky, emoji:'❤️' })), [vitals]);
  const goalEvs       = useMemo(() => goals.filter(g=>g.current>=g.target).map(g=>({ id:'g-'+g.id, ts:g.updatedAt||today(), title:`Goal completed: ${g.name}`, sub:'Goal milestone', value:'🏆 +50XP', cat:'goal', color:T.amber, emoji:'🎯' })), [goals]);
  const investmentEvs = useMemo(() => investments.map(inv=>({ id:'inv-'+inv.id, ts:inv.date||today(), title:`${inv.symbol||inv.name} position`, sub:'Investment', value:`${cur}${fmtN(Number(inv.currentPrice??inv.buyPrice)*Number(inv.quantity))}`, cat:'investment', color:T.violet, emoji:'📈' })), [investments, cur]);
  const debtEvs       = useMemo(() => debts.map(d=>({ id:'d-'+d.id, ts:d.createdAt||today(), title:`Debt: ${d.name}`, sub:`${d.type||'Debt'} · ${d.rate||0}% APR`, value:`${cur}${fmtN(d.balance)}`, cat:'debt', color:T.rose, emoji:'⚠️' })), [debts, cur]);
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
  const { expenses, debts, subscriptions, assets, investments, settings } = data;
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
const monthlyFixed = (debts.reduce((s,d)=>s+Number(d.minPayment||0),0)) + (subscriptions.reduce((s,sub)=>{ const n=Number(sub.amount||0); return s+(sub.cycle==='yearly'?n/12:sub.cycle==='weekly'?n*4.33:n); },0));
const efTarget    = monthlyFixed + monthExp;
const efGoal      = efTarget * efMonths;
const efPct       = efGoal > 0 ? Math.min(100, (efCurrent / efGoal) * 100) : 0;
const efColor     = efPct >= 100 ? T.emerald : efPct >= 50 ? T.amber : T.rose;
const EF_LEVELS   = [{ pct:25, label:'1mo' }, { pct:50, label:'3mo' }, { pct:100, label:`${efMonths}mo` }];

// ── DTI Ratio ─────────────────────────────────────────────────────────
const monthlyDebtPmts = debts.reduce((s,d)=>s+Number(d.minPayment||0),0);
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
  const [goalAmt, setGoalAmt] = useState(''); const [goalIdx, setGoalIdx] = useState(null);
  const [payoffMethod, setPayoffMethod] = useState('avalanche');
  const [extraPayment, setExtraPayment] = useState(0);
  const debouncedExtraPayment = useDebounce(extraPayment, 300);
  const [editExpense, setEditExpense] = useState(null);
  const [editDebt, setEditDebt] = useState(null);
  const [editingSub, setEditingSub] = useState(null);
  const [editingBill, setEditingBill] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(today().slice(0,7));
  const [showMonthlyReview, setShowMonthlyReview] = useState(false);
  const { expenses, incomes, assets, investments, debts, goals, settings, netWorthHistory, subscriptions, budgets, bills } = data;
  const cur = settings.currency || '$'; const thisMonth = today().slice(0,7);
  // Use pre-computed values from App root
  const { monthExp, monthInc, invVal, assetVal, debtVal, nw: netWorth, savRate } = data.computed;
  const availableMonths = useMemo(()=>{
    const ms=new Set([...expenses.map(e=>e.date?.slice(0,7)),...incomes.map(i=>i.date?.slice(0,7))].filter(Boolean));
    const arr=[...ms].sort().reverse();
    if(!arr.includes(today().slice(0,7))) arr.unshift(today().slice(0,7));
    return arr;
  },[expenses,incomes]);
  const selMonthExp = useMemo(()=>expenses.filter(e=>e.date?.startsWith(selectedMonth)).reduce((s,e)=>s+Number(e.amount||0),0),[expenses,selectedMonth]);
  const selMonthInc = useMemo(()=>incomes.filter(i=>i.date?.startsWith(selectedMonth)).reduce((s,i)=>s+Number(i.amount||0),0),[incomes,selectedMonth]);
  const selMonthExpenses = useMemo(()=>[...expenses].filter(e=>e.date?.startsWith(selectedMonth)).sort((a,b)=>a.date<b.date?1:-1),[expenses,selectedMonth]);
  const totalBudget = useMemo(()=>Object.values(budgets||{}).reduce((s,v)=>s+Number(v||0),0),[budgets]);
  const spendByCat = useMemo(()=>{ const m={}; selMonthExpenses.forEach(e=>{ m[e.category]=(m[e.category]||0)+Number(e.amount||0); }); return Object.entries(m).map(([name,value])=>({ name, value, color:getCatColor(name) })).sort((a,b)=>b.value-a.value); },[selMonthExpenses]);
  const cashflowMonths = useMemo(()=>{ const months={}; expenses.forEach(e=>{ const m=e.date?.slice(0,7); if(!m)return; if(!months[m])months[m]={m,inc:0,exp:0}; months[m].exp+=Number(e.amount||0); }); incomes.forEach(i=>{ const m=i.date?.slice(0,7); if(!m)return; if(!months[m])months[m]={m,inc:0,exp:0}; months[m].inc+=Number(i.amount||0); }); return Object.values(months).sort((a,b)=>a.m<b.m?-1:1).slice(-6); },[expenses,incomes]);
  // Use Web Worker for >10 debts; sync fallback for small lists
  const [payoffInfo, setPayoffInfo] = useState(() => calcDebtPayoff(debts, 0, payoffMethod));
  const workerRef = useRef(null);
  useEffect(() => {
    if (debts.length > 10) {
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
  const monthlySubTotal = useMemo(()=>subscriptions.reduce((s,sub)=>{ const n=Number(sub.amount||0); return s+(sub.cycle==='yearly'?n/12:sub.cycle==='weekly'?n*4.33:n); },0),[subscriptions]);
  const billsArr = bills || [];
  const upcomingBills = useMemo(()=>[...billsArr].filter(b=>!b.paid).sort((a,b)=>a.nextDate<b.nextDate?-1:1),[billsArr]);
  const TABS = ['overview','spending','debts','recurring','investments','trades','watchlist','investor','depreciation','goals','assets','tools','simulator'];
  return (
    <div style={{ animation:'fadeUp 0.4s ease' }}>
      <LogExpenseModal open={modal==='expense'} onClose={()=>setModal(null)} onSave={e=>{actions.addExpense(e);setModal(null);}} />
      <LogIncomeModal open={modal==='income'} onClose={()=>setModal(null)} onSave={e=>{actions.addIncome(e);setModal(null);}} />
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
      <MonthlyReviewModal open={showMonthlyReview} onClose={()=>setShowMonthlyReview(false)} data={data} actions={actions} />
      <EditExpenseModal open={!!editExpense} onClose={()=>setEditExpense(null)} expense={editExpense} onSave={(id,patch)=>{actions.updateExpense(id,patch);setEditExpense(null);}} />
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
          {debts.length>0 && (
            <GlassCard style={{ padding:'20px 22px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12 }}>
                <SectionLabel>Debts Overview</SectionLabel>
                <button onClick={()=>setTab('debts')} style={{ fontSize:9, fontFamily:T.fM, color:T.accent, display:'flex', alignItems:'center', gap:2 }}>Manage <IcoChevR size={9} stroke={T.accent} /></button>
              </div>
              {debts.map((d,i)=>{ const origBal=Number(d.originalBalance||d.balance||0); const curBal=Number(d.balance||0); const paidPct=origBal>0?((origBal-curBal)/origBal)*100:0; return (
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
                    <div style={{ fontSize:9, fontFamily:T.fM, color:T.textSub, marginTop:2 }}>{e.category} · {e.date}</div>
                  </div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
                  <span style={{ fontSize:13, fontFamily:T.fM, fontWeight:600, color:T.rose }}>-{cur}{fmtN(e.amount)}</span>
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
        </div>
      )}

      {tab==='debts' && (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            <Btn onClick={()=>setModal('debt')} color={T.rose}>+ Add Debt</Btn>
            {debts.length>0 && <Btn onClick={()=>setModal('pay-debt')} color={T.emerald}>💸 Log Payment</Btn>}
          </div>
          {debts.length === 0 ? (
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
                <div style={{ fontSize:10, fontFamily:T.fM, color:T.textSub }}>→ Payoff in <span style={{ color:T.accent, fontWeight:600 }}>{payoffInfo.months} months</span>, saving <span style={{ color:T.emerald }}>{cur}{fmtN(debts.reduce((s,d)=>s+Number(d.balance||0)*Number(d.rate||0)/100,0)*payoffInfo.months/12)}</span> in interest</div>
              </div>
              <div style={{ fontSize:9, fontFamily:T.fM, color:T.textMuted, padding:'8px 12px', background:T.surface, borderRadius:T.r }}>
                <strong style={{ color:T.accent }}>Avalanche</strong> pays highest interest rate first — minimizes total interest paid.<br/>
                <strong style={{ color:T.violet }}>Snowball</strong> pays smallest balance first — builds momentum and motivation.
              </div>
            </GlassCard>
            <GlassCard style={{ padding:'20px 22px' }}>
              <SectionLabel>Debt Accounts</SectionLabel>
              {debts.map((d,i)=>{ const origBal=Number(d.originalBalance||d.balance||0); const curBal=Number(d.balance||0); const paidPct=origBal>0?((origBal-curBal)/origBal)*100:0; return (
                <div key={d.id||i} style={{ padding:'14px 0', borderBottom:i<debts.length-1?`1px solid ${T.border}`:'none' }}>
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
          {investments.length===0 ? (
            <GlassCard style={{ padding:40, textAlign:'center' }}><div style={{ fontSize:11, fontFamily:T.fM, color:T.textMuted }}>No investment positions yet. Add your first position.</div></GlassCard>
          ) : (<>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:12 }}>
              {[{ label:'Portfolio Value', val:`${cur}${fmtN(invVal)}`, color:T.violet }, { label:'Total Invested', val:`${cur}${fmtN(investments.reduce((s,i)=>s+Number(i.buyPrice||0)*Number(i.quantity||0),0))}`, color:T.text }, { label:'Total P&L', val:`${invVal-investments.reduce((s,i)=>s+Number(i.buyPrice||0)*Number(i.quantity||0),0)>=0?'+':''}${cur}${fmtN(invVal-investments.reduce((s,i)=>s+Number(i.buyPrice||0)*Number(i.quantity||0),0))}`, color:invVal>=investments.reduce((s,i)=>s+Number(i.buyPrice||0)*Number(i.quantity||0),0)?T.emerald:T.rose }].map((m,i)=>(
                <GlassCard key={i} style={{ padding:'16px 18px' }}>
                  <div style={{ fontSize:9, fontFamily:T.fM, color:T.textSub, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:6 }}>{m.label}</div>
                  <div style={{ fontSize:18, fontFamily:T.fD, fontWeight:700, color:m.color }}>{m.val}</div>
                </GlassCard>
              ))}
            </div>
            <GlassCard style={{ padding:'20px 22px' }}>
              <SectionLabel>Positions</SectionLabel>
              {investments.map((inv,i)=>{ const cp=inv.currentPrice??inv.buyPrice??0; const val=Number(cp)*Number(inv.quantity||0); const cost=Number(inv.buyPrice||0)*Number(inv.quantity||0); const pnl=val-cost; const pnlPct=cost>0?(pnl/cost)*100:0; return (
                <div key={inv.id||i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:i<investments.length-1?`1px solid ${T.border}`:'none' }}>
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


      {tab==='goals' && (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div style={{ display:'flex', justifyContent:'flex-end' }}><Btn onClick={()=>setModal('goal')} color={T.amber}>+ New Goal</Btn></div>
          {goals.length===0 ? (
            <GlassCard style={{ padding:40, textAlign:'center' }}><div style={{ fontSize:11, fontFamily:T.fM, color:T.textMuted }}>No goals yet. Create your first financial goal.</div></GlassCard>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:12 }}>
              {goals.map((goal,i)=>{ const pct=Math.min(100,Math.round(((goal.current||0)/Math.max(1,goal.target))*100)); const catColors={finance:T.accent,health:T.sky,growth:T.violet,career:T.amber}; const c=catColors[goal.cat]||T.accent;
                const remaining = Math.max(0, Number(goal.target||0) - Number(goal.current||0));
                const monthsLeft = goal.deadline ? Math.max(1, Math.round((new Date(goal.deadline)-new Date())/(1000*60*60*24*30.4))) : null;
                const monthlyNeeded = monthsLeft ? (remaining / monthsLeft) : null;
                return (
                <GlassCard key={goal.id||i} style={{ padding:'18px 20px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                    <div><div style={{ fontSize:20, marginBottom:6 }}>{goal.emoji||'🎯'}</div><div style={{ fontSize:13, fontFamily:T.fD, fontWeight:700, color:T.text }}>{goal.name}</div><Badge color={c} style={{ marginTop:4 }}>{goal.cat||'goal'}</Badge></div>
                    <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                      <div style={{ width:46, height:46, borderRadius:'50%', background:`conic-gradient(${c} ${pct*3.6}deg,${T.border} 0deg)`, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:`0 0 12px ${c}33` }}><div style={{ width:34, height:34, borderRadius:'50%', background:T.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontFamily:T.fM, fontWeight:600, color:c }}>{pct}%</div></div>
                    </div>
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
      )}

      {tab==='assets' && (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ display:'flex', gap:10 }}><Btn onClick={()=>setModal('asset')} color={T.accent}>+ Add Asset</Btn></div>
          {assets.length===0 ? (
            <GlassCard style={{ padding:40, textAlign:'center' }}><div style={{ fontSize:11, fontFamily:T.fM, color:T.textMuted }}>No assets yet. Add your cash, property, and other assets.</div></GlassCard>
          ) : (
            <GlassCard style={{ padding:'20px 22px' }}>
              <SectionLabel>Assets · Total {cur}{fmtN(assetVal)}</SectionLabel>
              {assets.map((a,i)=>(
                <div key={a.id||i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:i<assets.length-1?`1px solid ${T.border}`:'none' }}>
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
        const combinedMonthly = monthlySubTotal + billTotal;
        return (
          <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
            {/* Summary bar */}
            {(subscriptions.length>0||billsArr.length>0) && (
              <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                <div style={{ flex:1, minWidth:140, padding:'10px 14px', background:T.skyDim, borderRadius:T.r, border:`1px solid ${T.sky}22` }}>
                  <div style={{ fontSize:9, fontFamily:T.fM, color:T.textSub, letterSpacing:'0.08em', marginBottom:4 }}>TOTAL RECURRING / MONTH</div>
                  <div style={{ fontSize:18, fontFamily:T.fD, fontWeight:700, color:T.sky }}>{cur}{fmtN(combinedMonthly)}</div>
                  <div style={{ fontSize:10, fontFamily:T.fM, color:T.textSub, marginTop:2 }}>{cur}{fmtN(combinedMonthly*12)}/year{monthInc>0?` · ${((combinedMonthly/monthInc)*100).toFixed(1)}% of income`:''}</div>
                </div>
                <div style={{ flex:1, minWidth:120, padding:'10px 14px', background:T.surface, borderRadius:T.r, border:`1px solid ${T.border}` }}>
                  <div style={{ fontSize:9, fontFamily:T.fM, color:T.textSub, letterSpacing:'0.08em', marginBottom:4 }}>SUBSCRIPTIONS</div>
                  <div style={{ fontSize:16, fontFamily:T.fD, fontWeight:700, color:T.accent }}>{subscriptions.length} · {cur}{fmtN(monthlySubTotal)}/mo</div>
                </div>
                <div style={{ flex:1, minWidth:120, padding:'10px 14px', background:T.surface, borderRadius:T.r, border:`1px solid ${T.border}` }}>
                  <div style={{ fontSize:9, fontFamily:T.fM, color:T.textSub, letterSpacing:'0.08em', marginBottom:4 }}>BILLS</div>
                  <div style={{ fontSize:16, fontFamily:T.fD, fontWeight:700, color:T.amber }}>{billsArr.filter(b=>!b.paid).length} pending · {cur}{fmtN(billTotal)}/mo</div>
                </div>
              </div>
            )}

            {/* Subscriptions section */}
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                <div style={{ fontSize:11, fontFamily:T.fM, color:T.textSub, fontWeight:600, letterSpacing:'0.08em' }}>🔄 SUBSCRIPTIONS</div>
                <Btn onClick={()=>setModal('subscription')} color={T.sky} style={{ padding:'4px 12px', fontSize:11 }}>+ Add</Btn>
              </div>
              {subscriptions.length===0 ? (
                <GlassCard style={{ padding:24, textAlign:'center' }}>
                  <div style={{ fontSize:22, marginBottom:8 }}>🔄</div>
                  <div style={{ fontSize:12, fontFamily:T.fM, color:T.textMuted }}>No subscriptions tracked yet</div>
                </GlassCard>
              ) : (
                <GlassCard style={{ padding:'14px 18px' }}>
                  {subscriptions.map((sub,i)=>{ const monthly=sub.cycle==='yearly'?Number(sub.amount)/12:sub.cycle==='weekly'?Number(sub.amount)*4.33:Number(sub.amount); return (
                    <div key={sub.id||i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:i<subscriptions.length-1?`1px solid ${T.border}`:'none' }}>
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
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ── HEALTH PAGE ───────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
function HealthPage({ data, actions }) {
  const [modal, setModal] = useState(null);
  const [focusActive, setFocusActive] = useState(false);
  const [focusTime, setFocusTime] = useState(25*60);
  const [elapsed, setElapsed] = useState(0);
  const [focusHabitId, setFocusHabitId] = useState('');
  const [focusComplete, setFocusComplete] = useState(false);
  const { vitals, habits, habitLogs } = data;

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
      <LogVitalsModal open={modal==='vitals'} onClose={()=>setModal(null)} onSave={e=>{actions.addVitals(e);setModal(null);}} />
      <div style={{ marginBottom:22 }}><SectionLabel>Health Domain</SectionLabel><h1 style={{ fontSize:26, fontFamily:T.fD, fontWeight:800, color:T.text }}>Health & Vitals</h1></div>
      <div style={{ display:'flex', gap:10, marginBottom:18 }}><Btn onClick={()=>setModal('vitals')} color={T.sky}>+ Log Vitals</Btn></div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(170px,1fr))', gap:12, marginBottom:18 }}>
        {[
          { label:'Avg Sleep (7d)', val:`${avgSleep}h`, sub:avgSleepQ?`Quality: ${avgSleepQ}/5 ⭐`:Number(avgSleep)>=7?'Great rest!':'Aim for 7-8h', color:T.sky },
          { label:'Avg Mood (7d)',  val:`${avgMood}/10`, sub:'Emotional wellbeing', color:T.violet },
          { label:'Avg Energy (7d)',val:`${avgEnergy}/10`, sub:'Vitality level', color:T.accent },
          { label:'Current Weight', val:latestWeight?`${latestWeight.weight} lbs`:'—', sub:latestWeight?latestWeight.date:'Not logged', color:T.emerald }
        ].map((m,i)=>(
          <GlassCard key={i} style={{ padding:'16px 18px' }}>
            <div style={{ fontSize:9, fontFamily:T.fM, color:T.textSub, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:6 }}>{m.label}</div>
            <div style={{ fontSize:20, fontFamily:T.fD, fontWeight:700, color:m.color, marginBottom:4 }}>{m.val}</div>
            <div style={{ fontSize:10, fontFamily:T.fM, color:T.textSub }}>{m.sub}</div>
          </GlassCard>
        ))}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(min(300px,100%),1fr))', gap:14 }}>
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
          <GlassCard style={{ padding:'20px 22px' }}>
            <SectionLabel>Recent Vitals</SectionLabel>
            {sorted.slice(0,8).map((v,i)=>(
              <div key={v.id||i} style={{ display:'flex', gap:14, justifyContent:'space-between', padding:'8px 0', borderBottom:i<7?`1px solid ${T.border}`:'none', fontSize:11, fontFamily:T.fM, alignItems:'center' }}>
                <span style={{ color:T.textSub, flexShrink:0 }}>{v.date}</span>
                <div style={{ display:'flex', gap:12, flexWrap:'wrap', justifyContent:'flex-end', alignItems:'center' }}>
                  {v.sleep>0&&<span style={{ color:T.sky }}>😴 {v.sleep}h</span>}
                  {v.sleepQuality>0&&<span style={{ color:STAR_COLORS[v.sleepQuality]||T.amber, fontSize:10 }}>{'⭐'.repeat(v.sleepQuality)} <span style={{ fontSize:9, color:T.textSub }}>quality</span></span>}
                  {v.mood>0&&<span style={{ color:T.violet }}>😊 {v.mood}/10</span>}
                  {v.energy>0&&<span style={{ color:T.accent }}>⚡ {v.energy}/10</span>}
                  {v.weight>0&&<span style={{ color:T.emerald }}>⚖️ {v.weight}</span>}
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
              {habits.length > 0 && (
                <div style={{ width:'100%' }}>
                  <div style={{ fontSize:10, fontFamily:T.fM, color:T.textSub, marginBottom:6 }}>Log a habit for this session?</div>
                  <Select value={focusHabitId} onChange={e=>setFocusHabitId(e.target.value)} style={{ marginBottom:8 }}>
                    <option value="">Skip</option>
                    {habits.map(h=><option key={h.id} value={h.id}>{h.emoji||'🔥'} {h.name}</option>)}
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
            {habits.length > 0 && (
              <div style={{ width:'100%', marginBottom:10 }}>
                <div style={{ fontSize:10, fontFamily:T.fM, color:T.textSub, marginBottom:5 }}>Link habit (logged on complete)</div>
                <Select value={focusHabitId} onChange={e=>setFocusHabitId(e.target.value)}>
                  <option value="">None</option>
                  {habits.map(h=><option key={h.id} value={h.id}>{h.emoji||'🔥'} {h.name}</option>)}
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
      </div>
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
  const [chronicleModal, setChronicleModal] = useState(false);
  const { habits, habitLogs, goals, totalXP, settings, chronicles, challenges } = data;
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
    { label:'Financial', val:Math.min(100,Math.round(goals.filter(g=>g.cat==='finance').length*25)), color:T.emerald },
    { label:'Health',    val:Math.min(100,data.vitals.length*8), color:T.sky },
    { label:'Habits',    val:Math.min(100,habits.length*12), color:T.accent },
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
      <AddChronicleModal open={chronicleModal} onClose={()=>setChronicleModal(false)} onSave={c=>{actions.addChronicle(c);setChronicleModal(false);}} />
      <div style={{ marginBottom:22 }}><SectionLabel>Growth Domain</SectionLabel><h1 style={{ fontSize:26, fontFamily:T.fD, fontWeight:800, color:T.text }}>Character · Habits · Goals</h1></div>
      <div style={{ display:'flex', gap:2, marginBottom:22, background:T.surface, borderRadius:T.r, padding:3, width:'fit-content', border:`1px solid ${T.border}`, flexWrap:'wrap' }}>
        {['character','habits','goals','achievements','chronicles','challenges','vision'].map(t=>(
          <button key={t} className="los-tab" onClick={()=>setTab(t)} style={{ padding:'5px 14px', borderRadius:8, fontSize:9, fontFamily:T.fM, textTransform:'uppercase', letterSpacing:'0.06em', background:tab===t?T.violetDim:'transparent', color:tab===t?T.violet:T.textSub, border:`1px solid ${tab===t?T.violet+'33':'transparent'}`, transition:'all 0.15s', position:'relative' }}>
            {t}{t==='achievements'&&<span style={{ marginLeft:4, fontSize:8, background:T.violet, color:T.bg, borderRadius:99, padding:'0px 5px', fontWeight:700 }}>{unlockedAchievements.length}</span>}
            {t==='chronicles'&&chronicles.length>0&&<span style={{ marginLeft:4, fontSize:8, background:T.amber, color:T.bg, borderRadius:99, padding:'0px 5px', fontWeight:700 }}>{chronicles.length}</span>}
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

      {tab==='habits' && (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ display:'flex', justifyContent:'flex-end' }}>
            <Btn onClick={()=>setModal('habit')} color={T.accent}>+ Log / Add Habit</Btn>
          </div>
          {habits.length > 0 && (
            <GlassCard style={{ padding:'20px 22px' }}>
              <SectionLabel>Activity Heatmap — Last 18 Weeks</SectionLabel>
              <HabitHeatmap habitLogs={stableHabitLogs} habits={habits} />
            </GlassCard>
          )}
          {habits.length===0 ? (
            <GlassCard style={{ padding:40, textAlign:'center' }}><div style={{ fontSize:11, fontFamily:T.fM, color:T.textMuted }}>No habits yet. Create your first habit to start building streaks.</div></GlassCard>
          ) : (
            habits.map((habit,i)=>{ const streak=getStreak(habit.id,habitLogs); const done=(habitLogs[habit.id]||[]).includes(d); const HCOLORS=[T.accent,T.violet,T.sky,T.amber,T.rose,T.emerald]; const hc=HCOLORS[i%HCOLORS.length]; return (
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
          {goals.length===0 ? (
            <GlassCard style={{ padding:40, textAlign:'center' }}><div style={{ fontSize:11, fontFamily:T.fM, color:T.textMuted }}>No goals yet. Create your first goal to start tracking progress.</div></GlassCard>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:12 }}>
              {goals.map((goal,i)=>{ const pct=Math.min(100,Math.round(((goal.current||0)/Math.max(1,goal.target))*100)); const catColors={finance:T.accent,health:T.sky,growth:T.violet,career:T.amber}; const c=catColors[goal.cat]||T.violet; const ms=goal.milestones||[]; return (
                <GlassCard key={goal.id||i} style={{ padding:'18px 20px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                    <div style={{ fontSize:20, marginBottom:6 }}>{goal.emoji||'🎯'}</div>
                    <button onClick={()=>actions.removeGoal(goal.id)} style={{ padding:4, borderRadius:6, background:T.surface, border:`1px solid ${T.border}`, opacity:0.4 }}><IcoTrash size={11} stroke={T.rose} /></button>
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
          {chronicles.length===0 ? (
            <GlassCard style={{ padding:40, textAlign:'center' }}>
              <div style={{ fontSize:32, marginBottom:12 }}>✨</div>
              <div style={{ fontSize:13, fontFamily:T.fD, fontWeight:600, color:T.text, marginBottom:6 }}>No chronicles yet</div>
              <div style={{ fontSize:11, fontFamily:T.fM, color:T.textMuted }}>Start logging your life wins — big and small.</div>
            </GlassCard>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {[...chronicles].sort((a,b)=>a.date<b.date?1:-1).map((c,i)=>(
                <GlassCard key={c.id} style={{ padding:'18px 22px', borderLeft:`3px solid ${T.amber}44`, animation:`fadeUp 0.3s ease ${i*0.06}s both` }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                    <div style={{ display:'flex', gap:12, alignItems:'flex-start', flex:1 }}>
                      <div style={{ fontSize:28, flexShrink:0 }}>{c.emoji}</div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:13, fontFamily:T.fD, fontWeight:700, color:T.text, marginBottom:4 }}>{c.title}</div>
                        {c.body && <div style={{ fontSize:11, fontFamily:T.fM, color:T.textSub, lineHeight:1.5 }}>{c.body}</div>}
                        <div style={{ fontSize:9, fontFamily:T.fM, color:T.textMuted, marginTop:6 }}>{c.date}</div>
                      </div>
                    </div>
                    <button onClick={()=>actions.removeChronicle(c.id)} style={{ padding:4, borderRadius:6, background:T.surface, border:`1px solid ${T.border}`, opacity:0.4, flexShrink:0 }}><IcoTrash size={10} stroke={T.rose} /></button>
                  </div>
                </GlassCard>
              ))}
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
              const active = challenges.find(c=>c.challengeId===ch.id);
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

      {tab==='vision' && (
        <VisionBoardTab />
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
  const { notes, expenses, incomes, habits, habitLogs, goals, vitals, totalXP, assets, investments, debts, settings, quickNotes } = data;
  const cur = settings.currency||'$';
  useEffect(()=>{ endRef.current?.scrollIntoView({behavior:'smooth'}); },[messages]);
  const buildContext = () => {
    const m=today().slice(0,7); const mInc=incomes.filter(i=>i.date?.startsWith(m)).reduce((s,i)=>s+Number(i.amount||0),0); const mExp=expenses.filter(e=>e.date?.startsWith(m)).reduce((s,e)=>s+Number(e.amount||0),0); const invVal=investments.reduce((s,i)=>s+Number((i.currentPrice??i.buyPrice)||0)*Number(i.quantity||0),0); const nw=assets.reduce((s,a)=>s+Number(a.value||0),0)+invVal-debts.reduce((s,d)=>s+Number(d.balance||0),0); const sr=mInc>0?((mInc-mExp)/mInc*100).toFixed(1):0; const habitSum=habits.map(h=>`${h.name} (streak:${getStreak(h.id,habitLogs)}d)`).join(', ')||'none'; const goalSum=goals.map(g=>`${g.name}: ${Math.round(((g.current||0)/Math.max(1,g.target))*100)}%`).join(', ')||'none'; const v7=vitals.slice(-7); const avgSlp=v7.length?(v7.reduce((s,v)=>s+Number(v.sleep||0),0)/v7.length).toFixed(1):'N/A';
    return `USER'S REAL LIFE DATA:\nNet Worth: ${cur}${fmtN(nw)}\nThis Month: income ${cur}${fmtN(mInc)}, expenses ${cur}${fmtN(mExp)}, savings rate ${sr}%\nInvestments: ${cur}${fmtN(invVal)}\nLevel: ${Math.floor(Math.sqrt(Number(totalXP)/100))+1}, ${totalXP} XP\nHabits: ${habitSum}\nGoals: ${goalSum}\nAvg Sleep (7d): ${avgSlp}h\nDebts: ${debts.length} totaling ${cur}${fmtN(debts.reduce((s,d)=>s+Number(d.balance||0),0))}`;
  };
  const apiKey = settings.aiApiKey || '';
  const send = async () => {
    if (!input.trim()||loading) return;
    if (!apiKey) {
      setMessages(p=>[...p,{role:'assistant',content:'⚠️ No API key configured. Go to Settings → AI Provider and enter your Anthropic API key. Your key is stored locally and never sent anywhere except Anthropic\'s API.'}]);
      return;
    }
    const um={role:'user',content:input}; setMessages(p=>[...p,um]); setInput(''); setLoading(true);
    try {
      const res=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json','x-api-key':apiKey,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:1000,system:`You are a Life Intelligence Engine for a personal Life OS. ${buildContext()} Give insightful, data-driven advice. Be concise and direct. Reference the user's real data.`,messages:[...messages,um].filter(m=>m.role!=='system').map(m=>({role:m.role,content:m.content}))})});
      const d=await res.json();
      if (d.error) throw new Error(d.error.message||'API error');
      const text=d.content?.map(b=>b.text||'').join('')||'Unable to respond.'; setMessages(p=>[...p,{role:'assistant',content:text}]);
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
  return (
    <div style={{ animation:'fadeUp 0.4s ease' }}>
      <AddNoteModal open={modal==='note'} onClose={()=>setModal(null)} onSave={e=>{actions.addNote(e);setModal(null);}} />
      <AddQuickNoteModal open={modal==='qnote'} onClose={()=>setModal(null)} onSave={e=>{actions.addQuickNote(e);setModal(null);}} />
      <EditNoteModal open={!!editingNote} onClose={()=>setEditingNote(null)} note={editingNote} onSave={(id,patch)=>{actions.updateNote(id,patch);setEditingNote(null);}} />
      <div style={{ marginBottom:22 }}><SectionLabel>Knowledge Domain</SectionLabel><h1 style={{ fontSize:26, fontFamily:T.fD, fontWeight:800, color:T.text }}>Knowledge Base</h1></div>
      <div style={{ display:'flex', gap:2, marginBottom:22, background:T.surface, borderRadius:T.r, padding:3, width:'fit-content', border:`1px solid ${T.border}` }}>
        {['notes','quick notes','courses','capsule','ai assistant'].map(t=>(
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
                <GlassCard key={note.id||i} style={{ padding:'18px', cursor:'pointer', borderLeft:`3px solid ${tc}55`, animation:`fadeUp 0.3s ease ${i*0.08}s both`, opacity:note.done?0.65:1 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                    <div style={{ display:'flex', gap:5, alignItems:'center', flexWrap:'wrap' }}>
                      <Badge color={tc}>{note.tag||'General'}</Badge>
                      {note.type && note.type!=='note' && <Badge color={note.type==='task'?T.sky:note.type==='idea'?T.violet:T.amber}>{note.type}</Badge>}
                      {note.priority && note.priority===1 && <span style={{ fontSize:9, color:T.rose }}>🔴</span>}
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
        </div>
      )}
      {tab==='quick notes' && (
        <div>
          <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:14 }}>
            <Btn onClick={()=>setModal('qnote')} color={T.amber}>📌 New Quick Note</Btn>
          </div>
          {qn.length===0 ? (
            <GlassCard style={{ padding:40, textAlign:'center' }}><div style={{ fontSize:11, fontFamily:T.fM, color:T.textMuted }}>No quick notes yet. Capture fleeting thoughts and ideas.</div></GlassCard>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:12 }}>
              {[...qn].sort((a,b)=>a.date<b.date?1:-1).map((qn,i)=>(
                <div key={qn.id||i} style={{ padding:'16px', borderRadius:T.r, background:`${qn.color||T.amber}11`, border:`1px solid ${(qn.color||T.amber)}33`, position:'relative', animation:`fadeUp 0.3s ease ${i*0.06}s both` }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                    <div style={{ width:10, height:10, borderRadius:'50%', background:qn.color||T.amber, flexShrink:0, marginTop:2 }} />
                    <button onClick={()=>actions.removeQuickNote(qn.id)} style={{ padding:3, borderRadius:5, background:'rgba(255,255,255,0.06)', border:`1px solid rgba(255,255,255,0.08)`, opacity:0.6 }}><IcoTrash size={10} stroke={T.rose} /></button>
                  </div>
                  <div style={{ fontSize:12, fontFamily:T.fM, color:T.text, lineHeight:1.6, wordBreak:'break-word' }}>{qn.text}</div>
                  <div style={{ fontSize:9, fontFamily:T.fM, color:T.textMuted, marginTop:10 }}>{qn.date}</div>
                </div>
              ))}
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

      {tab==='ai assistant' && (
        <GlassCard style={{ display:'flex', flexDirection:'column', height:540 }}>
          {!apiKey && (
            <div style={{ padding:'10px 18px', background:T.amberDim, borderBottom:`1px solid ${T.amber}33`, display:'flex', alignItems:'center', gap:10, fontSize:11, fontFamily:T.fM, color:T.amber }}>
              <span>⚠️</span>
              <span>AI Assistant requires an Anthropic API key. <strong onClick={()=>{}} style={{cursor:'pointer',textDecoration:'underline'}} >Go to Settings → AI Provider to add yours.</strong></span>
            </div>
          )}
          <div style={{ flex:1, overflowY:'auto', padding:'18px', display:'flex', flexDirection:'column', gap:12 }}>
            {messages.map((msg,i)=>(
              <div key={i} style={{ display:'flex', gap:9, flexDirection:msg.role==='user'?'row-reverse':'row', animation:'fadeUp 0.25s ease' }}>
                {msg.role==='assistant' && <div style={{ width:30, height:30, borderRadius:'50%', flexShrink:0, background:`linear-gradient(135deg,#c084fc,${T.sky})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13 }}>⬡</div>}
                <div style={{ maxWidth:'72%', padding:'10px 14px', borderRadius:T.rL, background:msg.role==='user'?T.accentDim:T.surfaceHi, border:`1px solid ${msg.role==='user'?T.accent+'33':T.border}`, fontSize:12, fontFamily:T.fM, color:T.text, lineHeight:1.6, borderBottomRightRadius:msg.role==='user'?4:T.rL, borderBottomLeftRadius:msg.role==='assistant'?4:T.rL }}>{msg.content}</div>
              </div>
            ))}
            {loading && <div style={{ display:'flex', gap:9 }}><div style={{ width:30, height:30, borderRadius:'50%', flexShrink:0, background:`linear-gradient(135deg,#c084fc,${T.sky})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13 }}>⬡</div><div style={{ padding:'10px 14px', borderRadius:T.rL, borderBottomLeftRadius:4, background:T.surfaceHi, border:`1px solid ${T.border}`, display:'flex', gap:4, alignItems:'center' }}>{[0,1,2].map(d=><div key={d} style={{ width:5, height:5, borderRadius:'50%', background:'#c084fc', animation:`dotPulse 1.2s ease ${d*0.2}s infinite` }} />)}</div></div>}
            <div ref={endRef} />
          </div>
          <div style={{ padding:'14px 18px', borderTop:`1px solid ${T.border}`, display:'flex', gap:9 }}>
            <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&send()} placeholder="Ask about your finances, habits, goals..." style={{ flex:1, background:T.surface, border:`1px solid ${T.border}`, borderRadius:T.r, padding:'9px 14px', fontFamily:T.fM, fontSize:12, color:T.text }} />
            <button className="los-btn" onClick={send} disabled={!input.trim()||loading} style={{ width:38, height:38, borderRadius:T.r, flexShrink:0, background:input.trim()?T.accentDim:T.surface, border:`1px solid ${input.trim()?T.accent+'44':T.border}`, display:'flex', alignItems:'center', justifyContent:'center' }}><IcoSend size={13} stroke={input.trim()?T.accent:T.textMuted} /></button>
          </div>
        </GlassCard>
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

// ── INTELLIGENCE PAGE ─────────────────────────────────────────────────────────
function IntelligencePage({ data }) {
  const { expenses, incomes, habits, habitLogs, vitals, goals, assets, investments, debts, totalXP, settings } = data;
  const cur = settings.currency||'$';
  // Use pre-computed values from App root
  const { monthExp, monthInc, invVal, nw, savRate, thisMonth, topCatEntry, level: lvl } = data.computed;
  const topCat = topCatEntry; // from data.computed
  const avgSleep7 = useMemo(()=>{ const v=vitals.slice(-7); return v.length?(v.reduce((s,x)=>s+Number(x.sleep||0),0)/v.length).toFixed(1):'?'; },[vitals]);
  const level = lvl; // from data.computed
  const todayDone = habits.filter(h=>(habitLogs[h.id]||[]).includes(today())).length;
  const bestStreak = habits.reduce((mx,h)=>{const s=getStreak(h.id,habitLogs);return s>mx?s:mx;},0);
  const insights = [
    monthInc>0&&savRate<20 && { title:'Low Savings Rate', body:`You're saving ${savRate.toFixed(0)}% this month. Target 20-35% to build long-term wealth. Reduce spending by ${cur}${fmtN(0.2*monthInc-(monthInc-monthExp))} to hit 20%.`, color:T.amber, icon:'⚠️', type:'warning' },
    monthInc>0&&savRate>=35 && { title:'Excellent Savings Rate', body:`${savRate.toFixed(0)}% savings rate — you're outperforming most. ${cur}${fmtN(monthInc-monthExp)} saved this month. On track for financial independence.`, color:T.emerald, icon:'📈', type:'positive' },
    topCat && { title:`Top Spending: ${topCat[0]}`, body:`${topCat[0]} is your largest expense at ${cur}${fmtN(topCat[1])} this month (${monthInc>0?((topCat[1]/monthInc)*100).toFixed(0):0}% of income).`, color:T.violet, icon:'💳', type:'insight' },
    Number(avgSleep7)>0&&Number(avgSleep7)<7 && { title:'Sleep Deficit Detected', body:`Average sleep of ${avgSleep7}h is below optimal 7-8h. Poor sleep correlates with reduced productivity and worse financial decisions.`, color:T.sky, icon:'😴', type:'insight' },
    Number(avgSleep7)>=7 && { title:'Sleep Health Strong', body:`${avgSleep7}h average sleep over 7 days — within optimal range. Research shows well-rested individuals make better financial decisions.`, color:T.sky, icon:'🌙', type:'positive' },
    bestStreak>=7 && { title:`Habit Momentum — ${bestStreak} Day Streak`, body:`Your longest active streak is ${bestStreak} days. Habits compound like investments — you're building powerful life capital.`, color:T.accent, icon:'🔥', type:'positive' },
    habits.length>0&&todayDone===0 && { title:'No Habits Logged Today', body:`You have ${habits.length} habits but haven't logged any today. Consistency drives your XP and life score.`, color:T.amber, icon:'🎯', type:'warning' },
    debts.length>0 && { title:'Active Debt Tracking', body:`${debts.length} debt(s) totaling ${cur}${fmtN(debts.reduce((s,d)=>s+Number(d.balance||0),0))}. Use the avalanche method (highest rate first) to minimize interest paid.`, color:T.rose, icon:'💳', type:'insight' },
    goals.length===0 && { title:'Set Your First Goal', body:'No goals defined yet. Users with written goals are 42% more likely to achieve them. Set a financial target to unlock projection tools.', color:'#c084fc', icon:'🎯', type:'coach' },
    goals.length>0 && { title:'Goal Progress', body:`${goals.filter(g=>(g.current||0)>=g.target).length} of ${goals.length} goals completed. Average progress: ${Math.round(goals.reduce((s,g)=>s+((g.current||0)/Math.max(1,g.target))*100,0)/Math.max(1,goals.length))}%.`, color:T.amber, icon:'🏆', type:'positive' },
  ].filter(Boolean).slice(0,6);
  const LIFE_STATS = [
    { label:'Financial', val:Math.min(100,Math.round((savRate*0.5)+(nw>0?30:0)+(debts.length===0?20:0))), color:T.emerald },
    { label:'Health',    val:Math.min(100,vitals.length*8), color:T.sky },
    { label:'Habits',    val:Math.min(100,habits.length*15+bestStreak*2), color:T.accent },
    { label:'Growth',    val:Math.min(100,Math.round(Number(totalXP)/50)), color:T.violet },
    { label:'Focus',     val:Math.min(100,data.focusSessions.length*5), color:T.rose },
    { label:'Knowledge', val:Math.min(100,data.notes.length*10), color:T.amber },
  ];
  return (
    <div style={{ animation:'fadeUp 0.4s ease' }}>
      <div style={{ marginBottom:22 }}><SectionLabel>Intelligence Layer</SectionLabel><h1 style={{ fontSize:26, fontFamily:T.fD, fontWeight:800, color:T.text }}>Life Intelligence</h1><div style={{ fontSize:11, fontFamily:T.fM, color:T.textSub, marginTop:4 }}>AI-powered insights · <span style={{ color:'#c084fc' }}>●</span> {insights.length} active insights</div></div>
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

        {/* Emergency Fund Tracker */}
        {(() => {
          const cashAssets = assets.filter(a=>a.type==='Cash').reduce((s,a)=>s+Number(a.value||0),0);
          const avgMonthExp = monthExp > 0 ? monthExp : expenses.reduce((s,e)=>s+Number(e.amount||0),0) / Math.max(1, [...new Set(expenses.map(e=>e.date?.slice(0,7)))].length);
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

        {/* Recurring Transactions Detector */}
        {expenses.length >= 4 && (() => {
          const freq = {};
          expenses.forEach(e => {
            const k = `${e.category}|${Math.round(Number(e.amount)/5)*5}`;
            if (!freq[k]) freq[k] = { cat:e.category, amount:Math.round(Number(e.amount)/5)*5, count:0 };
            freq[k].count++;
          });
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

      </div>
    </div>
  );
}

// ── ARCHIVE PAGE ──────────────────────────────────────────────────────────────
function ArchivePage({ data }) {
  const { netWorthHistory, expenses, incomes, habits, habitLogs, vitals, settings } = data;
  const cur = settings.currency||'$'; const thisMonth = today().slice(0,7);
  const monthExp = expenses.filter(e=>e.date?.startsWith(thisMonth)).reduce((s,e)=>s+Number(e.amount||0),0);
  const monthInc = incomes.filter(i=>i.date?.startsWith(thisMonth)).reduce((s,i)=>s+Number(i.amount||0),0);
  const bestStreak = habits.reduce((mx,h)=>{const s=getStreak(h.id,habitLogs);return s>mx?s:mx;},0);
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
          {[{ label:'Income logged', val:`${cur}${fmtN(monthInc)}`, color:T.emerald }, { label:'Expenses logged', val:`${cur}${fmtN(monthExp)}`, color:T.rose }, { label:'Net saved', val:`${cur}${fmtN(monthInc-monthExp)}`, color:T.accent }, { label:'Vitals logged', val:`${vitals.filter(v=>v.date?.startsWith(thisMonth)).length} days`, color:T.sky }, { label:'Habits tracked', val:`${habits.length} habits`, color:T.violet }, { label:'Best streak', val:`🔥 ${bestStreak} days`, color:T.amber }].map((item,i)=>(
            <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'9px 0', borderBottom:i<5?`1px solid ${T.border}`:'none', fontSize:11, fontFamily:T.fM }}>
              <span style={{ color:T.textSub }}>{item.label}</span><span style={{ color:item.color, fontWeight:600 }}>{item.val}</span>
            </div>
          ))}
        </GlassCard>
        {expenses.length>0 && (
          <GlassCard style={{ padding:'20px 22px', gridColumn:'span 2' }}>
            <SectionLabel>All-Time Summary</SectionLabel>
            <div style={{ display:'flex', gap:20, flexWrap:'wrap' }}>
              {[{ label:'TOTAL EXPENSES', val:`${cur}${fmtN(expenses.reduce((s,e)=>s+Number(e.amount||0),0))}`, color:T.rose }, { label:'TOTAL INCOME', val:`${cur}${fmtN(incomes.reduce((s,i)=>s+Number(i.amount||0),0))}`, color:T.emerald }, { label:'HABIT LOGS', val:Object.values(habitLogs).flat().length, color:T.accent }, { label:'VITALS DAYS', val:vitals.length, color:T.sky }, { label:'BEST STREAK', val:`🔥 ${bestStreak}d`, color:T.amber }].map((item,i)=>(
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
  const { settings } = data;
  const [name, setName] = useState(settings.name||'');
  const [currency, setCurrency] = useState(settings.currency||'$');
  const [incomeTarget, setIncomeTarget] = useState(settings.incomeTarget||'');
  const [savingsTarget, setSavingsTarget] = useState(settings.savingsTarget||'');
  const [theme, setTheme] = useState(settings.theme||'dark');
  const [language, setLanguage] = useState(settings.language||'en');
  const [pin, setPin] = useState(settings.pin||'');
  const [aiProvider, setAiProvider] = useState(settings.aiProvider||'claude');
  const [aiApiKey, setAiApiKey] = useState(settings.aiApiKey||'');

  const save = () => {
    actions.updateSettings({ ...settings, name, currency, incomeTarget:Number(incomeTarget), savingsTarget:Number(savingsTarget), theme, language, aiProvider, aiApiKey, pin:pin.length===4?pin:'' });
    // Apply theme immediately
    Object.assign(T, THEMES[theme] || THEMES.dark);
    currentLang = language;
  };
  const exportCSV = () => {
    const headers = ['Date','Amount','Category','Note'];
    const rows = [...(data.expenses||[])].sort((a,b)=>a.date<b.date?1:-1).map(e=>[e.date, e.amount, e.category, (e.note||'').replace(/,/g,' ')]);
    const csvContent = [headers, ...rows].map(r=>r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type:'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download=`lifeos-expenses-${today()}.csv`; a.click(); URL.revokeObjectURL(url);
  };
  const exportData = () => {
    const d = { los_habits:data.habits, los_habitlogs:data.habitLogs, los_expenses:data.expenses, los_incomes:data.incomes, los_debts:data.debts, los_goals:data.goals, los_assets:data.assets, los_investments:data.investments, los_vitals:data.vitals, los_notes:data.notes, los_xp:data.totalXP, los_nwhistory:data.netWorthHistory, los_settings:settings, los_focus:data.focusSessions, los_subs:data.subscriptions, los_budgets:data.budgets, los_chronicles:data.chronicles, los_challenges:data.challenges };
    const blob=new Blob([JSON.stringify(d,null,2)],{type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=`lifeos_backup_${today()}.json`; a.click(); URL.revokeObjectURL(url);
  };
  const importData = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const d = JSON.parse(ev.target.result);
        Object.entries(d).forEach(([key, val]) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} });
        window.location.reload();
      } catch { alert('Invalid backup file'); }
    };
    reader.readAsText(file);
  };
  return (
    <div style={{ animation:'fadeUp 0.4s ease' }}>
      <div style={{ marginBottom:22 }}><SectionLabel>System</SectionLabel><h1 style={{ fontSize:26, fontFamily:T.fD, fontWeight:800, color:T.text }}>Settings</h1></div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:14 }}>
        <GlassCard style={{ padding:'24px' }}>
          <SectionLabel>Profile</SectionLabel>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <Input value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" />
            <Select value={currency} onChange={e=>setCurrency(e.target.value)}>{['$','€','£','¥','₹','₩','Fr','A$','C$'].map(c=><option key={c}>{c}</option>)}</Select>
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
                <button key={lang.id} onClick={()=>{ setLanguage(lang.id); currentLang=lang.id; }} style={{ flex:1, padding:'8px', borderRadius:8, background:language===lang.id?T.accentDim:T.surface, border:`1px solid ${language===lang.id?T.accent+'55':T.border}`, cursor:'pointer', fontSize:11, fontFamily:T.fM, color:language===lang.id?T.accent:T.text }}>
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
              <Input value={aiApiKey} onChange={e=>setAiApiKey(e.target.value)} placeholder={`${aiProvider==='openai'?'OpenAI':'Anthropic'} API Key (optional)`} type="password" />
            )}
            {aiProvider === 'ollama' && (
              <div style={{ fontSize:9, fontFamily:T.fM, color:T.textSub, padding:'8px 10px', borderRadius:T.r, background:T.surface, border:`1px solid ${T.border}` }}>Make sure Ollama is running at <code style={{ color:T.accent }}>localhost:11434</code></div>
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
            <Btn full onClick={exportData} color={T.sky}>📦 Export All Data (JSON)</Btn>
            <Btn full onClick={exportCSV} color={T.emerald}>📊 Export Expenses CSV</Btn>
            <label style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'10px 20px', borderRadius:T.r, background:T.violetDim, color:T.violet, border:`1px solid ${T.violet}44`, fontSize:12, fontFamily:T.fM, fontWeight:600, cursor:'pointer' }}>
              📥 Import Backup (JSON)
              <input type="file" accept=".json" onChange={importData} style={{ display:'none' }} />
            </label>
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
            <div style={{ fontSize:11, fontFamily:T.fM, color:T.accent, fontWeight:600, marginBottom:4 }}>✓ Enhanced LifeOS v7 — S4 + S5 Upgrades Active</div>
            <div style={{ fontSize:11, fontFamily:T.fM, color:T.textSub, lineHeight:1.5 }}>S4: Career Hub (Kanban + REX), Calendar view, What-If Simulator, Live Crypto Prices, Global Undo. S5: 4 Themes (Dark/Light/AMOLED/Solarized), AI Provider selection (Claude/Ollama/GPT-4o), i18n (EN/FR), Recurring auto-log.</div>
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
  const { expenses, habits, habitLogs, bills, goals, settings } = data;
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

  expenses.filter(e=>e.date?.startsWith(monthStr)).forEach(e => {
    const d = parseInt(e.date.slice(8));
    if (!expByDay[d]) expByDay[d] = 0;
    expByDay[d] += Number(e.amount||0);
  });

  habits.forEach(h => {
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

  goals.forEach(g => {
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
      <div style={{ marginBottom:22 }}><SectionLabel>Calendar Domain</SectionLabel><h1 style={{ fontSize:26, fontFamily:T.fD, fontWeight:800, color:T.text }}>Monthly Overview</h1></div>

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
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ── S4: WHAT-IF FINANCIAL SIMULATOR ──────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
function WhatIfSimulator({ data }) {
  const { expenses, incomes, debts, assets, investments, settings } = data;
  const cur = settings.currency || '$';
  const thisMonth = today().slice(0,7);
  const baseInc = incomes.filter(i=>i.date?.startsWith(thisMonth)).reduce((s,i)=>s+Number(i.amount||0),0) || Number(settings.incomeTarget||0) || 5000;
  const baseExp = expenses.filter(e=>e.date?.startsWith(thisMonth)).reduce((s,e)=>s+Number(e.amount||0),0) || 3000;
  const baseDebt = debts.reduce((s,d)=>s+Number(d.balance||0),0);
  const baseNW = assets.reduce((s,a)=>s+Number(a.value||0),0) + investments.reduce((s,i)=>s+Number((i.currentPrice??i.buyPrice)||0)*Number(i.quantity||0),0) - baseDebt;

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

  const cryptoInvs = investments.filter(i => i.type === 'Crypto' && CRYPTO_IDS[i.symbol?.toUpperCase()]);
  const stockInvs  = investments.filter(i => STOCK_TYPES.includes(i.type) && i.symbol);
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
function OnboardingWizard({ onComplete, actions, settings }) {
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
        <div style={{display:'flex',gap:4,marginBottom:28}}>
          {STEPS.map((_,i)=><div key={i} style={{flex:1,height:3,borderRadius:99,background:i<=step?T.accent:T.border,transition:'background 0.3s'}} />)}
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
function MonthlyReviewModal({ open, onClose, data, actions }) {
  const {expenses,incomes,habits,habitLogs,vitals,goals,settings}=data;
  const cur=settings.currency||'$';
  const m=today().slice(0,7);
  const prevDate=new Date(m+'-01'); prevDate.setMonth(prevDate.getMonth()-1);
  const prevM=prevDate.toISOString().slice(0,7);
  const mExp=expenses.filter(e=>e.date?.startsWith(m)).reduce((s,e)=>s+Number(e.amount||0),0);
  const mInc=incomes.filter(i=>i.date?.startsWith(m)).reduce((s,i)=>s+Number(i.amount||0),0);
  const pExp=expenses.filter(e=>e.date?.startsWith(prevM)).reduce((s,e)=>s+Number(e.amount||0),0);
  const pInc=incomes.filter(i=>i.date?.startsWith(prevM)).reduce((s,i)=>s+Number(i.amount||0),0);
  const habitScore=habits.length>0?Math.round((habits.filter(h=>(habitLogs[h.id]||[]).some(d=>d.startsWith(m))).length/habits.length)*100):0;
  const mVitals=vitals.filter(v=>v.date?.startsWith(m));
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
            {label:'Habit Score',val:`${habitScore}%`,sub:`${habits.filter(h=>(habitLogs[h.id]||[]).some(d=>d.startsWith(m))).length}/${habits.length} active`,color:T.violet},
            {label:'Avg Sleep',val:`${avgSleep}h`,sub:'this month',color:T.sky},
            {label:'Goals',val:goals.length,sub:`${goals.filter(g=>Number(g.current||0)>=Number(g.target||1)).length} completed`,color:T.amber},
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
  const {investments,settings}=data;
  const cur=settings.currency||'$';
  const [profile,setProfile]=useLocalStorage('los_investor_profile',{risk:'moderate',horizon:'long',style:'passive',target_return:8,notes:''});
  const typeBreakdown=investments.reduce((acc,inv)=>{ acc[inv.type]=(acc[inv.type]||0)+Number(inv.quantity||0)*Number(inv.currentPrice||inv.buyPrice||0); return acc; },{});
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
  const {assets,settings}=data;
  const cur=settings.currency||'$';
  const depAssets=assets.filter(a=>['Vehicle','Other'].includes(a.type));
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
  const {focusSessions,settings}=data;
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

export default function LifeOS() {
  const [page, setPage] = useState('home');
  const [cmdOpen, setCmdOpen] = useState(false);
  const [globalModal, setGlobalModal] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [pinUnlocked, setPinUnlocked] = useState(false);

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
  const [challenges,    setChallenges    ] = useLocalStorage('los_challenges',   []);

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
    setToasts(p => p.map(t => t.id === toastId ? { ...t, undone: true } : t));
    const t = toasts.find(t => t.id === toastId);
    if (t?.onUndo) t.onUndo();
    dismissToast(toastId);
  }, [toasts, dismissToast]);

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
    const already = netWorthHistory.some(h => h.month === month);
    if (already) return;
    const invVal = investments.reduce((s,i)=>s+Number((i.currentPrice??i.buyPrice)||0)*Number(i.quantity||0),0);
    const nw = assets.reduce((s,a)=>s+Number(a.value||0),0)+invVal-debts.reduce((s,d)=>s+Number(d.balance||0),0);
    if (nw !== 0 || assets.length > 0 || investments.length > 0) {
      setNetWorthHistory(p => [...p, { month, value: nw }].slice(-24)); // Keep 24 months
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
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // ── S5: Apply theme + language reactively on settings change ─────────────────
  useEffect(() => {
    const savedTheme = settings.theme || 'dark';
    Object.assign(T, THEMES[savedTheme] || THEMES.dark);
    currentLang = settings.language || 'en';
  }, [settings.theme, settings.language]);

  // ── S5: Recurring Expense Auto-log ────────────────────────────────────────
  useEffect(() => {
    const todayStr = today();
    const toAutoLog = (subscriptions || []).filter(sub => {
      if (!sub.nextDate || sub.paused) return false;
      return sub.nextDate <= todayStr;
    });
    if (!toAutoLog.length) return;
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

  const addHabit = useCallback((name, opts={}) => {
    const h = { id: Date.now(), name, frequency:opts.frequency||'daily', emoji:opts.emoji||'🔥', xp:opts.xp||10, category:opts.category||'' };
    setHabits(p => [...p, h]);
    pushEvent({ type:'habit_created', title:`New habit: ${name}`, value:'+XP', color:T.accent, domain:'growth' });
  }, [pushEvent]);

  const logHabit = useCallback((habitId) => {
    const d = today();
    setHabitLogs(prev => {
      const logs = prev[habitId] || [];
      if (logs.includes(d)) return prev;
      return { ...prev, [habitId]: [...logs, d] };
    });
    setTotalXP(x => Number(x) + 10);
    const habit = habits.find(h => h.id === habitId);
    pushEvent({ type:'habit', title:`${habit?.name||'Habit'} completed`, value:'+10 XP', color:T.accent, domain:'growth' });
  }, [habits, pushEvent]);

  const removeHabit = useCallback((habitId) => {
    const h = habits.find(x => x.id === habitId);
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

  const addChronicle = useCallback((c) => {
    setChronicles(p => [c, ...p]);
  }, []);
  const removeChronicle = useCallback((id) => {
    setChronicles(p => p.filter(c => c.id !== id));
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
    const g = goals.find(x => x.id === goalId);
    setGoals(p => p.filter(x => x.id !== goalId));
    pushEvent({ type:'goal_removed', title:'Goal removed', value:'', color:T.textSub, domain:'growth' });
    if (g) addToast(`Goal "${g.name}" deleted`, () => setGoals(p => [...p, g]));
  }, [goals, pushEvent, addToast]);

  const addAsset = useCallback((a) => {
    setAssets(p => [...p, a]);
    setTotalXP(x => Number(x) + 15);
    pushEvent({ type:'asset', title:`Asset added: ${a.name}`, value:`${settings.currency||'$'}${a.value}`, color:T.accent, domain:'money' });
  }, [pushEvent, settings.currency]);

  const updateGoalProgress = useCallback((goalId, amount) => {
    setGoals(p => p.map(g => g.id === goalId ? { ...g, current: Number(g.current||0) + amount, updatedAt: today() } : g));
    setTotalXP(x => Number(x) + 25);
    const goal = goals.find(g => g.id === goalId);
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
    const debt = debts.find(d => d.id === debtId);
    pushEvent({ type:'debt_payment', title:`Payment: ${debt?.name||'Debt'}`, value:`-${settings.currency||'$'}${amount}`, color:T.emerald, domain:'money' });
  }, [debts, pushEvent, settings.currency]);

  const removeDebt = useCallback((debtId) => {
    const d = debts.find(x => x.id === debtId);
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
    const inv = investments.find(i => i.id === invId);
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
    const exp = expenses.find(e => e.id === expId);
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
    const note = notes.find(n => n.id === noteId);
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
    const bill = bills.find(b => b.id === billId);
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

  const updateSettings = useCallback((s) => { setSettings(s); }, []);

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
    const monthInc = incomes.filter(i=>i.date?.startsWith(_thisMonth)).reduce((s,i)=>s+Number(i.amount||0),0);
    const monthExp = expenses.filter(e=>e.date?.startsWith(_thisMonth)).reduce((s,e)=>s+Number(e.amount||0),0);
    const invVal   = investments.reduce((s,i)=>s+Number((i.currentPrice??i.buyPrice)||0)*Number(i.quantity||0),0);
    const assetVal = assets.reduce((s,a)=>s+Number(a.value||0),0);
    const debtVal  = debts.reduce((s,d)=>s+Number(d.balance||0),0);
    const nw       = assetVal + invVal - debtVal;
    const savRate  = monthInc>0?((monthInc-monthExp)/monthInc)*100:0;
    // Pre-compute per-category spend for current month (used by MoneyPage + IntelPage)
    const spendByCatMap = expenses
      .filter(e=>e.date?.startsWith(_thisMonth))
      .reduce((m,e)=>{ m[e.category]=(m[e.category]||0)+Number(e.amount||0); return m; }, {});
    const topCatEntry = Object.entries(spendByCatMap).sort((a,b)=>b[1]-a[1])[0] || null;
    // Level / XP helpers (used by Home + Intel)
    const level     = Math.floor(Math.sqrt(Number(totalXP)/100))+1;
    return { monthInc, monthExp, invVal, assetVal, debtVal, nw, savRate, thisMonth:_thisMonth,
             spendByCatMap, topCatEntry, level };
  }, [incomes, expenses, investments, assets, debts, _thisMonth, totalXP]);

  const actions = {
    addExpense, addIncome, addHabit, logHabit, removeHabit,
    addVitals, addNote, addGoal, removeGoal, addAsset,
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
    addChronicle, removeChronicle, joinChallenge, toggleChallengeDay, leaveChallenge,
  };

  const isMobile = useMobile();
  const data = {
    expenses, incomes, assets, investments, debts, goals,
    habits, habitLogs, vitals, notes, totalXP, settings,
    netWorthHistory, eventLog, focusSessions, quickNotes,
    subscriptions, budgets, bills, career,
    chronicles, challenges,  // ← required by GrowthPage
    computed, // ← centralised derived stats
    isMobile,  // ← passed to all pages for responsive layouts
  };

  // ── DERIVED STATS for status bar — uses centralised computed ─────────────────
  const level = Math.floor(Math.sqrt(Number(totalXP)/100))+1;
  const bestStreak = habits.reduce((mx,h)=>{const s=getStreak(h.id,habitLogs);return s>mx?s:mx;},0);
  const cur = settings.currency||'$';
  const { monthInc, monthExp, invVal, nw, savRate, thisMonth } = computed;

  // ── S3: Smart Alerts — computed centrally for TopBar bell ────────────────────
  const smartAlerts = useMemo(() => computeSmartAlerts({
    bills, budgets, expenses, habits, habitLogs, vitals,
    thisMonth, monthInc, savRate,
  }), [bills, budgets, expenses, habits, habitLogs, vitals, thisMonth, monthInc, savRate]);

  // ── S2: XP Pop notifications ────────────────────────────────────────────────
  const [xpPops, setXPPops] = useState([]);
  const addXPPop = useCallback((label, color=T.violet) => {
    const id = Date.now() + Math.random();
    setXPPops(p => [...p, { id, label, color }]);
    setTimeout(() => setXPPops(p => p.filter(x => x.id !== id)), 1900);
  }, []);

  // Hook XP pops onto key actions (called after each XP-earning event)
  const logHabitWithPop = useCallback((habitId) => {
    logHabit(habitId);
    const h = habits.find(x => x.id === habitId);
    addXPPop(`+${h?.xp||10} XP — ${h?.name||'Habit'} ✓`, T.accent);
  }, [logHabit, habits, addXPPop]);

  const addGoalWithPop = useCallback((g) => {
    addGoal(g); addXPPop('+20 XP — Goal Created 🎯', T.violet);
  }, [addGoal, addXPPop]);

  const addNoteWithPop = useCallback((n) => {
    addNote(n); addXPPop('+5 XP — Note Saved 📝', T.amber);
  }, [addNote, addXPPop]);

  // Achievement unlock detection
  const [prevUnlocked, setPrevUnlocked] = useState(() => new Set());
  useEffect(() => {
    const newly = ACHIEVEMENTS.filter(a => a.check(data) && !prevUnlocked.has(a.id));
    if (newly.length) {
      newly.forEach((a, i) => setTimeout(() => addXPPop(`🏆 ${a.name} unlocked!`, a.color), i * 700));
      setPrevUnlocked(prev => new Set([...prev, ...newly.map(a => a.id)]));
    }
  }, [data]);

  // ── S2: Mobile state ────────────────────────────────────────────────────────
  const eb = (child) => <ErrorBoundary key={page}>{child}</ErrorBoundary>;
  const VIEW = {
    home:      eb(<HomePage      data={data} actions={{...actions, logHabit:logHabitWithPop}} onNav={setPage} />),
    timeline:  eb(<TimelinePage  data={data} />),
    money:     eb(<MoneyPage     data={data} actions={actions} />),
    health:    eb(<HealthPage    data={data} actions={actions} />),
    growth:    eb(<GrowthPage    data={data} actions={{...actions, logHabit:logHabitWithPop, addGoal:addGoalWithPop}} />),
    knowledge: eb(<KnowledgePage data={data} actions={{...actions, addNote:addNoteWithPop}} />),
    career:    eb(<CareerPage    data={data} actions={actions} />),
    calendar:  eb(<CalendarPage  data={data} />),
    intel:     eb(<IntelligencePage data={data} />),
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
    {showOnboarding && <OnboardingWizard onComplete={()=>setShowOnboarding(false)} actions={actions} settings={settings} />}
    <div style={{ minHeight:'100vh', background:T.bg, color:T.text, fontFamily:T.fD, display:'flex' }}>
      {/* Ambient glow */}
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0, overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-200, left:T.sw, width:600, height:600, borderRadius:'50%', background:`radial-gradient(circle,${T.accent}05 0%,transparent 70%)` }} />
        <div style={{ position:'absolute', bottom:-200, right:100, width:500, height:500, borderRadius:'50%', background:`radial-gradient(circle,${T.violet}04 0%,transparent 70%)` }} />
      </div>

      {/* Command Palette — Phase 1 */}
      <CommandPalette open={cmdOpen} onClose={()=>setCmdOpen(false)} data={data} onNav={(p)=>{setPage(p);setCmdOpen(false);}} onModal={handleGlobalModal} />

      {/* Toast/Undo notifications — S1 */}
      <ToastContainer toasts={toasts} onUndo={handleUndo} onDismiss={dismissToast} />

      {/* XP Pop notifications — S2 */}
      <XPPopContainer pops={xpPops} />

      {/* Quick Capture FAB — S2 */}
      <QuickCaptureFAB onAction={handleGlobalModal} isMobile={isMobile} />

      {/* Bottom Nav — S2 mobile */}
      <BottomNav active={page} onNav={setPage} />

      {/* Global modals triggered from Command Palette / FAB */}
      <LogExpenseModal open={globalModal==='expense'} onClose={()=>setGlobalModal(null)} onSave={e=>{actions.addExpense(e);setGlobalModal(null);}} />
      <LogIncomeModal open={globalModal==='income'} onClose={()=>setGlobalModal(null)} onSave={e=>{actions.addIncome(e);setGlobalModal(null);}} />
      <LogHabitModal open={globalModal==='habit'} onClose={()=>setGlobalModal(null)} habits={habits} habitLogs={habitLogs} onLog={logHabitWithPop} onAddHabit={actions.addHabit} />
      <LogVitalsModal open={globalModal==='vitals'} onClose={()=>setGlobalModal(null)} onSave={e=>{actions.addVitals(e);setGlobalModal(null);}} />
      <AddNoteModal open={globalModal==='note'} onClose={()=>setGlobalModal(null)} onSave={e=>{addNoteWithPop(e);setGlobalModal(null);}} />
      <AddGoalModal open={globalModal==='goal'} onClose={()=>setGlobalModal(null)} onSave={e=>{addGoalWithPop(e);setGlobalModal(null);}} />
      <AddDebtModal open={globalModal==='debt'} onClose={()=>setGlobalModal(null)} onSave={e=>{actions.addDebt(e);setGlobalModal(null);}} />
      <AddInvestmentModal open={globalModal==='investment'} onClose={()=>setGlobalModal(null)} onSave={e=>{actions.addInvestment(e);setGlobalModal(null);}} />
      <AddSubscriptionModal open={globalModal==='subscription'} onClose={()=>setGlobalModal(null)} onSave={e=>{actions.addSubscription(e);setGlobalModal(null);}} />

      <Sidebar active={page} onNav={setPage} userName={settings.name} />

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
            <SmartAlertsButton alerts={smartAlerts} />
            {!isMobile && <div style={{ fontSize:9, fontFamily:T.fM, color:T.textMuted }}>{new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'})}</div>}
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
              { label:'HABITS',  val:`${habits.length} tracked`,     color:T.sky     },
              { label:'DEBTS',   val:`${debts.length} · ${cur}${fmtN(debts.reduce((s,d)=>s+Number(d.balance||0),0))}`, color:debts.length>0?T.rose:T.textMuted },
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
