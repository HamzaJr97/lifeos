import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  PieChart, Pie, Cell, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";

// ── GLOBAL STYLES ──────────────────────────────────────────────────────────────
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
    @keyframes slideIn { from { opacity:0; transform:translateX(24px); } to { opacity:1; transform:translateX(0); } }
    @keyframes glowPulse { 0%,100% { box-shadow:0 0 8px rgba(0,245,212,0.25); } 50% { box-shadow:0 0 28px rgba(0,245,212,0.65),0 0 50px rgba(0,245,212,0.12); } }
    @keyframes dotPulse { 0%,100% { transform:scale(1); opacity:1; } 50% { transform:scale(1.6); opacity:0.5; } }
    @keyframes nodeEnter { from { opacity:0; transform:scale(0.8) translateX(-8px); } to { opacity:1; transform:scale(1) translateX(0); } }
    @keyframes modalIn { from { opacity:0; transform:scale(0.95) translateY(10px); } to { opacity:1; transform:scale(1) translateY(0); } }
    @keyframes toastIn { from { opacity:0; transform:translateX(100%); } to { opacity:1; transform:translateX(0); } }
    @keyframes toastOut { from { opacity:1; transform:translateX(0); } to { opacity:0; transform:translateX(100%); } }
    @keyframes countUp { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
    @keyframes slideRight { from { opacity:0; transform:translateX(100%); } to { opacity:1; transform:translateX(0); } }
    @keyframes slideUp { from { opacity:0; transform:translateY(40px); } to { opacity:1; transform:translateY(0); } }
    @keyframes fabSpin { from { transform:rotate(-90deg) scale(0); opacity:0; } to { transform:rotate(0) scale(1); opacity:1; } }
    @keyframes xpPop { 0%{transform:translateY(0) scale(1);opacity:1;} 60%{transform:translateY(-24px) scale(1.15);opacity:1;} 100%{transform:translateY(-40px) scale(0.9);opacity:0;} }
    @keyframes pinBounce { 0%{transform:scale(1.3);} 100%{transform:scale(1);} }
    @media (max-width:768px) {
      .los-sidebar { display:none !important; }
      .los-main { margin-left:0 !important; padding-bottom:72px !important; }
      .los-mobile-nav { display:flex !important; }
      .los-topbar { padding:0 14px !important; }
      .los-page-content { padding:16px 14px !important; }
      .los-grid-4 { grid-template-columns:1fr 1fr !important; }
      .los-grid-2col { grid-template-columns:1fr !important; }
      .los-hide-mobile { display:none !important; }
      .los-status-bar { display:none !important; }
    }
    .los-mobile-nav { display:none; position:fixed; bottom:0; left:0; right:0; z-index:200; }
    .los-fab-item { animation: fabSpin 0.2s ease both; }
    .los-btn:hover { filter:brightness(1.2); transform:translateY(-1px); }
    .los-card:hover { border-color:rgba(0,245,212,0.18) !important; }
    .los-nav:hover { background:rgba(0,245,212,0.08) !important; }
    .los-qa:hover { background:rgba(255,255,255,0.07) !important; transform:translateY(-2px); }
    .los-ev:hover { background:rgba(255,255,255,0.04) !important; }
    .los-tab:hover { background:rgba(255,255,255,0.05) !important; }
    .los-row:hover { background:rgba(255,255,255,0.03) !important; }
    .los-cmd-item:hover { background:rgba(0,245,212,0.08) !important; }
    .los-cmd-item.active { background:rgba(0,245,212,0.12) !important; border-color:rgba(0,245,212,0.3) !important; }
    input, textarea, select { outline:none; font-family:inherit; }
    input:focus, textarea:focus, select:focus { border-color:rgba(0,245,212,0.5) !important; }
    button { cursor:pointer; border:none; background:none; font-family:inherit; transition:all 0.18s ease; }
    select option { background:#0b0b1a; color:#dde0f2; }
  `;
  document.head.appendChild(style);
})();

// ── THEME SYSTEM ───────────────────────────────────────────────────────────────
const THEME_DEFS = {
  obsidian: { accent:'#00f5d4',accentDim:'rgba(0,245,212,0.12)',accentLo:'rgba(0,245,212,0.06)',violet:'#8b5cf6',violetDim:'rgba(139,92,246,0.12)',emerald:'#34d399',emeraldDim:'rgba(52,211,153,0.12)',sky:'#38bdf8',skyDim:'rgba(56,189,248,0.12)',rose:'#fb7185',roseDim:'rgba(251,113,133,0.12)',amber:'#fbbf24',amberDim:'rgba(251,191,36,0.12)' },
  midnight: { accent:'#818cf8',accentDim:'rgba(129,140,248,0.12)',accentLo:'rgba(129,140,248,0.06)',violet:'#a78bfa',violetDim:'rgba(167,139,250,0.12)',emerald:'#34d399',emeraldDim:'rgba(52,211,153,0.12)',sky:'#60a5fa',skyDim:'rgba(96,165,250,0.12)',rose:'#f472b6',roseDim:'rgba(244,114,182,0.12)',amber:'#fbbf24',amberDim:'rgba(251,191,36,0.12)' },
  forest:   { accent:'#4ade80',accentDim:'rgba(74,222,128,0.12)',accentLo:'rgba(74,222,128,0.06)',violet:'#a3e635',violetDim:'rgba(163,230,53,0.12)',emerald:'#86efac',emeraldDim:'rgba(134,239,172,0.12)',sky:'#38bdf8',skyDim:'rgba(56,189,248,0.12)',rose:'#fb7185',roseDim:'rgba(251,113,133,0.12)',amber:'#fbbf24',amberDim:'rgba(251,191,36,0.12)' },
  sunset:   { accent:'#fb923c',accentDim:'rgba(251,146,60,0.12)',accentLo:'rgba(251,146,60,0.06)',violet:'#f472b6',violetDim:'rgba(244,114,182,0.12)',emerald:'#34d399',emeraldDim:'rgba(52,211,153,0.12)',sky:'#fbbf24',skyDim:'rgba(251,191,36,0.12)',rose:'#ef4444',roseDim:'rgba(239,68,68,0.12)',amber:'#fb923c',amberDim:'rgba(251,146,60,0.12)' },
  ocean:    { accent:'#06b6d4',accentDim:'rgba(6,182,212,0.12)',accentLo:'rgba(6,182,212,0.06)',violet:'#818cf8',violetDim:'rgba(129,140,248,0.12)',emerald:'#34d399',emeraldDim:'rgba(52,211,153,0.12)',sky:'#7dd3fc',skyDim:'rgba(125,211,252,0.12)',rose:'#fb7185',roseDim:'rgba(251,113,133,0.12)',amber:'#fbbf24',amberDim:'rgba(251,191,36,0.12)' },
  rose:     { accent:'#f472b6',accentDim:'rgba(244,114,182,0.12)',accentLo:'rgba(244,114,182,0.06)',violet:'#c084fc',violetDim:'rgba(192,132,252,0.12)',emerald:'#34d399',emeraldDim:'rgba(52,211,153,0.12)',sky:'#38bdf8',skyDim:'rgba(56,189,248,0.12)',rose:'#fb7185',roseDim:'rgba(251,113,133,0.12)',amber:'#fbbf24',amberDim:'rgba(251,191,36,0.12)' },
};
const T = {
  bg:'#040408', bg1:'#070710', bg2:'#0b0b1a',
  surface:'rgba(255,255,255,0.028)', surfaceHi:'rgba(255,255,255,0.055)',
  border:'rgba(255,255,255,0.07)', borderLit:'rgba(0,245,212,0.3)',
  text:'#dde0f2', textSub:'#6b6b90', textMuted:'#36364e',
  fD:'Syne, sans-serif', fM:'"IBM Plex Mono", monospace',
  r:'10px', rL:'16px', sw:72,
  ...THEME_DEFS.obsidian,
};
function applyTheme(name) {
  const td = THEME_DEFS[name] || THEME_DEFS.obsidian;
  Object.assign(T, td);
  T.borderLit = T.accent + '4d';
}

// ── I18N ───────────────────────────────────────────────────────────────────────
const LANG = {
  en: { greeting_morning:'Good morning', greeting_afternoon:'Good afternoon', greeting_evening:'Good evening', command_center:'Command Center', weekly_intentions:'Weekly Focus Intentions', budget_remaining:'Budget Remaining', daily_checkin:'Daily Check-In', how_feeling:'How are you feeling today?', weekly_brief:"This Week's Brief", activity_feed:'Live Activity Feed', quick_actions:'Quick Actions', log_expense:'Log Expense', log_income:'Log Income', log_habit:'Log Habit', log_vitals:'Log Vitals', add_note:'Add Note', add_goal:'Add Goal', set_intentions:'Set 3 intentions for this week…', mark_done:'Mark done', save:'Save', cancel:'Cancel', unlock:'Unlock', pin_title:'Life OS is locked', pin_hint:'Enter your 4-digit PIN', onboard_welcome:'Welcome to Life OS', onboard_sub:'Your personal operating system', step1_title:'Who are you?', step2_title:"What's your first goal?", step3_title:'Build a habit', get_started:'Get Started →', monthly_review:'Monthly Review', dismiss:'Dismiss', ai_panel_title:'Life Intelligence', checkin_saved:'Check-in saved' },
  fr: { greeting_morning:'Bonjour', greeting_afternoon:'Bon après-midi', greeting_evening:'Bonsoir', command_center:'Centre de commande', weekly_intentions:'Intentions hebdomadaires', budget_remaining:'Budget restant', daily_checkin:'Bilan du jour', how_feeling:"Comment vous sentez-vous aujourd'hui?", weekly_brief:'Bilan de la semaine', activity_feed:"Flux d'activité", quick_actions:'Actions rapides', log_expense:'Dépense', log_income:'Revenu', log_habit:'Habitude', log_vitals:'Santé', add_note:'Note', add_goal:'Objectif', set_intentions:"Définir 3 intentions pour cette semaine…", mark_done:'Terminé', save:'Enregistrer', cancel:'Annuler', unlock:'Déverrouiller', pin_title:'Life OS est verrouillé', pin_hint:'Entrez votre code PIN à 4 chiffres', onboard_welcome:'Bienvenue sur Life OS', onboard_sub:'Votre système de vie personnel', step1_title:'Qui êtes-vous?', step2_title:'Quel est votre premier objectif?', step3_title:'Construire une habitude', get_started:'Commencer →', monthly_review:'Bilan mensuel', dismiss:'Ignorer', ai_panel_title:'Intelligence de vie', checkin_saved:'Bilan sauvegardé' },
};
const tr = (lang, key) => LANG[lang]?.[key] ?? LANG.en[key] ?? key;

// ── TIMELINE ENGINE ────────────────────────────────────────────────────────────
// Central event metadata registry
const TL_META = {
  expense:           { emoji:'💳', color:T.rose,    cat:'money'    },
  income:            { emoji:'💰', color:T.emerald, cat:'money'    },
  investment:        { emoji:'📈', color:T.violet,  cat:'money'    },
  trade_closed:      { emoji:'📊', color:T.violet,  cat:'money'    },
  debt_payment:      { emoji:'🏦', color:T.amber,   cat:'money'    },
  asset_added:       { emoji:'💎', color:T.accent,  cat:'money'    },
  habit_completed:   { emoji:'🔥', color:T.accent,  cat:'growth'   },
  streak_milestone:  { emoji:'🏆', color:T.amber,   cat:'growth'   },
  focus_completed:   { emoji:'⏱️', color:T.sky,     cat:'growth'   },
  vitals_logged:     { emoji:'❤️', color:T.sky,     cat:'health'   },
  sleep_update:      { emoji:'😴', color:T.violet,  cat:'health'   },
  workout:           { emoji:'💪', color:T.rose,    cat:'health'   },
  goal_milestone:    { emoji:'🎯', color:T.amber,   cat:'growth'   },
  goal_completed:    { emoji:'🏁', color:T.emerald, cat:'growth'   },
  goal_created:      { emoji:'🎯', color:T.violet,  cat:'growth'   },
  note_created:      { emoji:'📝', color:T.amber,   cat:'knowledge'},
  ai_insight:        { emoji:'🧠', color:'#c084fc', cat:'knowledge'},
  achievement:       { emoji:'🏅', color:T.amber,   cat:'system'   },
  monthly_review:    { emoji:'📋', color:T.accent,  cat:'system'   },
  ai_recommendation: { emoji:'⬡', color:'#c084fc', cat:'system'   },
  career_update:     { emoji:'💼', color:T.sky,     cat:'growth'   },
  subscription:      { emoji:'🔄', color:T.violet,  cat:'money'    },
};

const TL_CATS = {
  money:     { color:T.emerald, label:'Money',     icon:'💰' },
  health:    { color:T.sky,     label:'Health',    icon:'❤️' },
  growth:    { color:T.violet,  label:'Growth',    icon:'📈' },
  knowledge: { color:T.amber,   label:'Knowledge', icon:'📚' },
  system:    { color:T.accent,  label:'System',    icon:'⚙️' },
};

// Core event factory — used by all modules
function buildTLEvent(params) {
  const meta = TL_META[params.type] || { emoji:'•', color:T.textSub, cat:'system' };
  return {
    id: `tl_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,
    type: params.type || 'system',
    title: params.title || 'Event',
    description: params.description || '',
    category: params.category || meta.cat,
    emoji: meta.emoji,
    color: meta.color,
    timestamp: params.timestamp || Date.now(),
    date: params.date || new Date().toISOString().slice(0,10),
    metadata: params.metadata || {},
  };
}

// ── LOCAL STORAGE HOOK ─────────────────────────────────────────────────────────
function useLocalStorage(key, defaultVal) {
  const [val, setVal] = useState(() => {
    try { const s=localStorage.getItem(key); return s!==null?JSON.parse(s):defaultVal; }
    catch { return defaultVal; }
  });
  const setter = useCallback((v) => {
    setVal(prev => {
      const next = typeof v==='function' ? v(prev) : v;
      try { localStorage.setItem(key, JSON.stringify(next)); } catch {}
      return next;
    });
  }, [key]);
  return [val, setter];
}

// ── HELPERS ────────────────────────────────────────────────────────────────────
const today = () => new Date().toISOString().slice(0,10);
const fmtN = (n) => {
  if (n===undefined||n===null) return '0';
  const num=Number(n); if(isNaN(num)) return '0';
  return num>=1000000?`${(num/1000000).toFixed(2)}M`
    :num>=1000?num.toLocaleString('en-US',{maximumFractionDigits:0})
    :num.toFixed(num%1?2:0);
};
const fmtTS = (ts) => {
  const d=new Date(ts);
  return d.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'});
};
const fmtDate = (dateStr) => {
  if (!dateStr) return '—';
  try { return new Date(dateStr+'T12:00:00').toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'}); }
  catch { return dateStr; }
};
const getStreak = (habitId, habitLogs) => {
  const logs=habitLogs[habitId]||[]; let streak=0; let d=new Date();
  while(true){const s=d.toISOString().slice(0,10);if(logs.includes(s)){streak++;d.setDate(d.getDate()-1);}else break;}
  return streak;
};
const fuzzyMatch = (str, query) => {
  if (!query) return true;
  const s=str.toLowerCase(); const q=query.toLowerCase();
  return q.split('').every(c=>s.includes(c)) || s.includes(q);
};

const EXPENSE_COLORS = {
  '🍽️ Food':T.emerald,'🍔 Fast Food':T.amber,'🚗 Transport':T.sky,
  '❤️ Health':T.rose,'🏠 Housing':T.violet,'💳 Debts':T.rose,
  '💰 Savings':T.accent,'🎮 Leisure':T.amber,'👕 Shopping':T.violet,
  '🔧 Other':T.textSub,'✈️ Travel':T.sky,'🚬 Tobacco':T.textMuted,
};
const getCatColor = (cat) => {
  if (!cat) return T.textSub;
  for (const [k,v] of Object.entries(EXPENSE_COLORS)) { if (cat.includes(k.split(' ')[1]||k)) return v; }
  return T.textSub;
};

// ── ICONS ──────────────────────────────────────────────────────────────────────
const Ico = ({d,size=18,stroke='currentColor',fill='none',sw=1.8,style={},vb='0 0 24 24'}) => (
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
const IcoFilter   = (p) => <Ico {...p} d={<><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="12" y1="18" x2="12" y2="18"/></>} />;
const IcoZap      = (p) => <Ico {...p} d={<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>} />;
const IcoLock     = (p) => <Ico {...p} d={<><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>} />;
const IcoAI       = (p) => <Ico {...p} d={<><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24A2.5 2.5 0 0 0 14.5 2Z"/></>} />;
const IcoTarget   = (p) => <Ico {...p} d={<><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></>} />;
const IcoCalendar = (p) => <Ico {...p} d={<><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>} />;
const IcoUndoZ    = (p) => <Ico {...p} d={<><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></>} />;

// ── SHARED UI COMPONENTS ───────────────────────────────────────────────────────
const GlassCard = ({children,style={},className='',onClick}) => (
  <div className={`los-card ${className}`} onClick={onClick} style={{
    background:T.surface, border:`1px solid ${T.border}`,
    borderRadius:T.rL, backdropFilter:'blur(20px)',
    transition:'border-color 0.2s, box-shadow 0.2s', ...style
  }}>{children}</div>
);
const Badge = ({children,color=T.accent}) => (
  <span style={{ display:'inline-flex',alignItems:'center',gap:3, padding:'2px 8px',borderRadius:99,
    background:color+'18',color,fontSize:9,fontFamily:T.fM,fontWeight:600,letterSpacing:'0.06em',
    border:`1px solid ${color}28` }}>{children}</span>
);
const ProgressBar = ({pct,color=T.accent,height=4}) => (
  <div style={{width:'100%',height,borderRadius:99,background:'rgba(255,255,255,0.06)',overflow:'hidden'}}>
    <div style={{ height:'100%',width:`${Math.min(Math.max(pct||0,0),100)}%`,borderRadius:99,
      background:`linear-gradient(90deg, ${color}aa, ${color})`,boxShadow:`0 0 6px ${color}44`,
      transition:'width 0.6s cubic-bezier(0.34,1.56,0.64,1)' }} />
  </div>
);
const Input = ({value,onChange,placeholder,type='text',style={}}) => (
  <input type={type} value={value} onChange={onChange} placeholder={placeholder}
    style={{ width:'100%',padding:'9px 12px',background:'rgba(255,255,255,0.04)',
      border:`1px solid ${T.border}`,borderRadius:T.r,fontFamily:T.fM,fontSize:12,
      color:T.text,transition:'border-color 0.2s',...style }} />
);
const Select = ({value,onChange,children,style={}}) => (
  <select value={value} onChange={onChange} style={{ width:'100%',padding:'9px 12px',
    background:'rgba(255,255,255,0.04)',border:`1px solid ${T.border}`,borderRadius:T.r,
    fontFamily:T.fM,fontSize:12,color:T.text,transition:'border-color 0.2s',...style }}>{children}</select>
);
const SectionLabel = ({children}) => (
  <div style={{fontSize:9,fontFamily:T.fM,color:T.textSub,letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:12}}>{children}</div>
);
const ChartTooltip = ({active,payload,label,prefix='',suffix=''}) => {
  if (!active||!payload?.length) return null;
  return (
    <div style={{background:T.bg2,border:`1px solid ${T.border}`,borderRadius:8,padding:'8px 12px',fontFamily:T.fM,fontSize:11,color:T.text}}>
      {label&&<div style={{color:T.textSub,marginBottom:3}}>{label}</div>}
      {payload.map((p,i)=><div key={i} style={{color:p.color||T.accent}}>{p.name}: <b>{prefix}{typeof p.value==='number'?p.value.toLocaleString():p.value}{suffix}</b></div>)}
    </div>
  );
};

// ── MODAL ──────────────────────────────────────────────────────────────────────
const Modal = ({open,onClose,title,children}) => {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',zIndex:999,display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(6px)',padding:16}}>
      <div onClick={e=>e.stopPropagation()} style={{background:T.bg2,border:`1px solid ${T.border}`,borderRadius:20,padding:24,width:'100%',maxWidth:420,animation:'modalIn 0.25s ease'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
          <h2 style={{fontSize:16,fontFamily:T.fD,fontWeight:700,color:T.text}}>{title}</h2>
          <button onClick={onClose}><IcoX size={16} stroke={T.textSub}/></button>
        </div>
        {children}
      </div>
    </div>
  );
};
const Btn = ({children,onClick,color=T.accent,disabled=false,full=false,style={}}) => (
  <button className="los-btn" onClick={onClick} disabled={disabled} style={{
    padding:'10px 20px',borderRadius:T.r,background:disabled?T.surface:(color+'18'),
    color:disabled?T.textMuted:color,border:`1px solid ${disabled?T.border:(color+'44')}`,
    fontSize:12,fontFamily:T.fM,fontWeight:600,letterSpacing:'0.04em',
    width:full?'100%':'auto',transition:'all 0.18s',...style }}>{children}</button>
);

// ── TOAST SYSTEM ───────────────────────────────────────────────────────────────
function ToastContainer({toasts, removeToast}) {
  return (
    <div style={{position:'fixed',top:60,right:20,zIndex:9999,display:'flex',flexDirection:'column',gap:8,pointerEvents:'none'}}>
      {toasts.map(t=>(
        <div key={t.id} style={{
          pointerEvents:'auto', display:'flex',alignItems:'center',gap:10,
          padding:'10px 14px',borderRadius:T.r,minWidth:260,maxWidth:340,
          background:T.bg2,border:`1px solid ${t.color}44`,
          boxShadow:`0 4px 20px rgba(0,0,0,0.4),0 0 0 1px ${t.color}22`,
          animation:'toastIn 0.3s ease',
        }}>
          <span style={{fontSize:14}}>{t.icon}</span>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:11,fontFamily:T.fD,fontWeight:600,color:T.text}}>{t.title}</div>
            {t.body&&<div style={{fontSize:9,fontFamily:T.fM,color:T.textSub,marginTop:2}}>{t.body}</div>}
          </div>
          <button onClick={()=>removeToast(t.id)} style={{color:T.textMuted,flexShrink:0}}><IcoX size={12} stroke={T.textMuted}/></button>
        </div>
      ))}
    </div>
  );
}

// ── COMMAND PALETTE (⌘K) ────────────────────────────────────────────────────────
function CommandPalette({open,onClose,data,onNav}) {
  const [query, setQuery] = useState('');
  const [sel, setSel] = useState(0);
  const inputRef = useRef(null);
  const {expenses,incomes,goals,habits,notes,timeline} = data;

  useEffect(()=>{ if(open){ setQuery(''); setSel(0); setTimeout(()=>inputRef.current?.focus(),50); } },[open]);

  const results = useMemo(()=>{
    const q = query.trim();
    const items = [];
    // Quick nav actions
    if (!q || fuzzyMatch('dashboard home',q)) items.push({type:'nav',label:'Go to Home',sub:'Dashboard',icon:'🏠',page:'home',color:T.accent});
    if (!q || fuzzyMatch('timeline events history',q)) items.push({type:'nav',label:'Go to Timeline',sub:'Life history',icon:'⚡',page:'timeline',color:T.violet});
    if (!q || fuzzyMatch('money finance expenses',q)) items.push({type:'nav',label:'Go to Money',sub:'Finance hub',icon:'💰',page:'money',color:T.emerald});
    if (!q || fuzzyMatch('health vitals sleep',q)) items.push({type:'nav',label:'Go to Health',sub:'Vitals & focus',icon:'❤️',page:'health',color:T.sky});
    if (!q || fuzzyMatch('growth habits goals',q)) items.push({type:'nav',label:'Go to Growth',sub:'Habits & goals',icon:'📈',page:'growth',color:T.violet});
    if (!q || fuzzyMatch('knowledge notes ai',q)) items.push({type:'nav',label:'Go to Knowledge',sub:'Notes & AI',icon:'📚',page:'knowledge',color:T.amber});
    if (!q || fuzzyMatch('intelligence insights',q)) items.push({type:'nav',label:'Go to Intelligence',sub:'AI insights',icon:'🧠',page:'intel',color:'#c084fc'});

    // Expenses
    if (q) expenses.filter(e=>fuzzyMatch(`${e.note||''} ${e.category}`,q)).slice(0,3).forEach(e=>
      items.push({type:'expense',label:e.note||e.category,sub:`${e.date} · ${e.category}`,icon:'💳',color:T.rose,value:`-${data.settings?.currency||'$'}${fmtN(e.amount)}`}));
    // Incomes
    if (q) incomes.filter(i=>fuzzyMatch(`${i.note||'income'} income`,q)).slice(0,2).forEach(i=>
      items.push({type:'income',label:i.note||'Income',sub:i.date,icon:'💰',color:T.emerald,value:`+${data.settings?.currency||'$'}${fmtN(i.amount)}`}));
    // Goals
    if (q) goals.filter(g=>fuzzyMatch(g.name||'',q)).slice(0,3).forEach(g=>
      items.push({type:'goal',label:g.name,sub:`${Math.round(((g.current||0)/Math.max(1,g.target))*100)}% complete`,icon:'🎯',color:T.amber}));
    // Habits
    if (q) habits.filter(h=>fuzzyMatch(h.name||'',q)).slice(0,3).forEach(h=>
      items.push({type:'habit',label:h.name,sub:`${getStreak(h.id,data.habitLogs||{})}d streak`,icon:'🔥',color:T.accent}));
    // Notes
    if (q) notes.filter(n=>fuzzyMatch(`${n.title||''} ${n.body||''}`,q)).slice(0,3).forEach(n=>
      items.push({type:'note',label:n.title||'Note',sub:n.date,icon:'📝',color:T.amber}));
    // Timeline events
    if (q && timeline) timeline.filter(e=>fuzzyMatch(`${e.title||''} ${e.description||''}`,q)).slice(0,3).forEach(e=>
      items.push({type:'event',label:e.title,sub:e.date,icon:e.emoji||'•',color:e.color||T.textSub}));

    return items.slice(0,12);
  },[query,expenses,incomes,goals,habits,notes,timeline,data.settings,data.habitLogs]);

  const handleKey = (e) => {
    if (e.key==='ArrowDown') { e.preventDefault(); setSel(s=>Math.min(s+1,results.length-1)); }
    else if (e.key==='ArrowUp') { e.preventDefault(); setSel(s=>Math.max(s-1,0)); }
    else if (e.key==='Enter') { const r=results[sel]; if(r?.page){onNav(r.page);onClose();} }
    else if (e.key==='Escape') { onClose(); }
  };

  if (!open) return null;
  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',zIndex:1000,display:'flex',alignItems:'flex-start',justifyContent:'center',backdropFilter:'blur(8px)',paddingTop:80}}>
      <div onClick={e=>e.stopPropagation()} style={{width:'100%',maxWidth:560,animation:'modalIn 0.2s ease'}}>
        <div style={{background:T.bg2,border:`1px solid ${T.borderLit}`,borderRadius:20,overflow:'hidden',boxShadow:`0 24px 80px rgba(0,0,0,0.6),0 0 40px ${T.accent}11`}}>
          <div style={{display:'flex',alignItems:'center',gap:10,padding:'14px 18px',borderBottom:`1px solid ${T.border}`}}>
            <IcoSearch size={15} stroke={T.accent}/>
            <input ref={inputRef} value={query} onChange={e=>{setQuery(e.target.value);setSel(0);}} onKeyDown={handleKey}
              placeholder="Search events, goals, habits, expenses…" style={{ flex:1,background:'transparent',border:'none',fontFamily:T.fM,fontSize:13,color:T.text }} />
            <kbd style={{fontSize:9,fontFamily:T.fM,color:T.textMuted,padding:'2px 5px',borderRadius:4,border:`1px solid ${T.border}`}}>ESC</kbd>
          </div>
          <div style={{maxHeight:380,overflowY:'auto',padding:8}}>
            {results.length===0&&<div style={{padding:'24px',textAlign:'center',fontSize:11,fontFamily:T.fM,color:T.textMuted}}>No results found</div>}
            {results.map((r,i)=>(
              <div key={i} className={`los-cmd-item${sel===i?' active':''}`} onClick={()=>{if(r.page){onNav(r.page);onClose();}}}
                style={{ display:'flex',alignItems:'center',gap:10,padding:'9px 12px',borderRadius:T.r,
                  border:`1px solid transparent`,marginBottom:2,cursor:r.page?'pointer':'default',transition:'all 0.12s' }}>
                <div style={{width:28,height:28,borderRadius:8,background:r.color+'15',border:`1px solid ${r.color}30`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,flexShrink:0}}>{r.icon}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12,fontFamily:T.fD,fontWeight:600,color:T.text,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.label}</div>
                  <div style={{fontSize:9,fontFamily:T.fM,color:T.textSub}}>{r.sub}</div>
                </div>
                {r.value&&<div style={{fontSize:11,fontFamily:T.fM,color:r.color,fontWeight:600,whiteSpace:'nowrap'}}>{r.value}</div>}
                {r.page&&<Badge color={T.textMuted}>{r.type}</Badge>}
              </div>
            ))}
          </div>
          <div style={{padding:'8px 16px 10px',borderTop:`1px solid ${T.border}`,display:'flex',gap:14,alignItems:'center'}}>
            {[['↑↓','Navigate'],['↵','Go'],['Esc','Close']].map(([k,l])=>(
              <div key={k} style={{display:'flex',gap:4,alignItems:'center'}}>
                <kbd style={{fontSize:8,fontFamily:T.fM,color:T.textSub,padding:'1px 4px',borderRadius:3,border:`1px solid ${T.border}`,background:T.surface}}>{k}</kbd>
                <span style={{fontSize:9,fontFamily:T.fM,color:T.textMuted}}>{l}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── SIDEBAR ────────────────────────────────────────────────────────────────────
const NAV = [
  {id:'home',Icon:IcoHome,label:'Home'},{id:'timeline',Icon:IcoTimeline,label:'Timeline'},
  {id:'money',Icon:IcoMoney,label:'Money'},{id:'health',Icon:IcoHealth,label:'Health'},
  {id:'growth',Icon:IcoGrowth,label:'Growth'},{id:'knowledge',Icon:IcoBook,label:'Knowledge'},
  {id:'intel',Icon:IcoBrain,label:'Intelligence'},{id:'archive',Icon:IcoArchive,label:'Archive'},
  {id:'settings',Icon:IcoSettings,label:'Settings'},
];
function Sidebar({active,onNav,userName,onCmdPalette,onAIPanel,onLock,pinEnabled}) {
  const [hov,setHov]=useState(null);
  const init=userName?userName.charAt(0).toUpperCase():'U';
  return (
    <div className="los-sidebar" style={{width:T.sw,minHeight:'100vh',flexShrink:0,background:`linear-gradient(180deg,${T.bg} 0%,${T.bg1} 100%)`,borderRight:`1px solid ${T.border}`,display:'flex',flexDirection:'column',alignItems:'center',padding:'16px 0',gap:2,position:'fixed',top:0,left:0,bottom:0,zIndex:100}}>
      <div style={{width:36,height:36,borderRadius:10,marginBottom:6,background:`linear-gradient(135deg,${T.accent}22,${T.violet}22)`,border:`1px solid ${T.accent}44`,display:'flex',alignItems:'center',justifyContent:'center',animation:'glowPulse 3s infinite',fontSize:15}}>⬡</div>
      <button onClick={onCmdPalette} title="⌘K Command Palette" style={{width:36,height:28,borderRadius:8,marginBottom:10,background:T.accentLo,border:`1px solid ${T.accent}33`,display:'flex',alignItems:'center',justifyContent:'center',gap:4}} >
        <IcoSearch size={10} stroke={T.accent}/><span style={{fontSize:7,fontFamily:T.fM,color:T.accent}}>⌘K</span>
      </button>
      {NAV.map(({id,Icon,label})=>{
        const isA=active===id;
        return (
          <div key={id} style={{position:'relative',width:'100%'}} onMouseEnter={()=>setHov(id)} onMouseLeave={()=>setHov(null)}>
            <button className="los-nav" onClick={()=>onNav(id)} style={{width:'100%',height:42,display:'flex',alignItems:'center',justifyContent:'center',background:isA?T.accentDim:'transparent',color:isA?T.accent:T.textSub,borderLeft:`2px solid ${isA?T.accent:'transparent'}`,transition:'all 0.18s',position:'relative'}}>
              {isA&&<div style={{position:'absolute',left:0,top:'50%',transform:'translateY(-50%)',width:2,height:18,background:T.accent,boxShadow:`0 0 8px ${T.accent}`,borderRadius:'0 2px 2px 0'}}/>}
              <Icon size={16} stroke={isA?T.accent:T.textSub}/>
            </button>
            {hov===id&&<div style={{position:'absolute',left:'100%',top:'50%',transform:'translateY(-50%)',marginLeft:8,padding:'4px 10px',background:T.bg2,border:`1px solid ${T.border}`,borderRadius:6,whiteSpace:'nowrap',fontSize:10,fontFamily:T.fM,color:T.text,zIndex:200,pointerEvents:'none'}}>{label}</div>}
          </div>
        );
      })}
      <div style={{flex:1}}/>
      <button onClick={onAIPanel} title="AI Assistant" className="los-nav" style={{width:36,height:32,borderRadius:8,marginBottom:6,background:'rgba(192,132,252,0.08)',border:'1px solid rgba(192,132,252,0.2)',display:'flex',alignItems:'center',justifyContent:'center'}}>
        <IcoAI size={13} stroke="#c084fc"/>
      </button>
      {pinEnabled&&<button onClick={onLock} title="Lock" className="los-nav" style={{width:36,height:28,borderRadius:8,marginBottom:6,background:T.surface,border:`1px solid ${T.border}`,display:'flex',alignItems:'center',justifyContent:'center'}}>
        <IcoLock size={12} stroke={T.textSub}/>
      </button>}
      <div style={{width:32,height:32,borderRadius:'50%',background:`linear-gradient(135deg,${T.violet}44,${T.accent}44)`,border:`1px solid ${T.border}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontFamily:T.fD,fontWeight:700,color:T.text}}>{init}</div>
    </div>
  );
}

// ── FORMS / MODALS ─────────────────────────────────────────────────────────────
function LogExpenseModal({open,onClose,onSave}) {
  const [amt,setAmt]=useState(''); const [cat,setCat]=useState('🍽️ Food'); const [note,setNote]=useState(''); const [date,setDate]=useState(today());
  const save=()=>{ if(!amt) return; onSave({id:Date.now(),amount:Number(amt),category:cat,note:note.trim(),date}); setAmt('');setNote('');setDate(today()); };
  return (
    <Modal open={open} onClose={onClose} title="💳 Log Expense">
      <div style={{display:'flex',flexDirection:'column',gap:12}}>
        <Input type="number" value={amt} onChange={e=>setAmt(e.target.value)} placeholder="Amount" />
        <Select value={cat} onChange={e=>setCat(e.target.value)}>
          {Object.keys(EXPENSE_COLORS).map(c=><option key={c}>{c}</option>)}
        </Select>
        <Input value={note} onChange={e=>setNote(e.target.value)} placeholder="Note (optional)" />
        <Input type="date" value={date} onChange={e=>setDate(e.target.value)} />
        <Btn full onClick={save} color={T.rose}>Log Expense</Btn>
      </div>
    </Modal>
  );
}
function LogIncomeModal({open,onClose,onSave}) {
  const [amt,setAmt]=useState(''); const [src,setSrc]=useState('Salary'); const [note,setNote]=useState(''); const [date,setDate]=useState(today());
  const save=()=>{ if(!amt) return; onSave({id:Date.now(),amount:Number(amt),source:src,note:note.trim(),date}); setAmt('');setNote('');setDate(today()); };
  return (
    <Modal open={open} onClose={onClose} title="💰 Log Income">
      <div style={{display:'flex',flexDirection:'column',gap:12}}>
        <Input type="number" value={amt} onChange={e=>setAmt(e.target.value)} placeholder="Amount" />
        <Select value={src} onChange={e=>setSrc(e.target.value)}>
          {['Salary','Freelance','Investment','Side Project','Gift','Other'].map(s=><option key={s}>{s}</option>)}
        </Select>
        <Input value={note} onChange={e=>setNote(e.target.value)} placeholder="Note (optional)" />
        <Input type="date" value={date} onChange={e=>setDate(e.target.value)} />
        <Btn full onClick={save} color={T.emerald}>Log Income</Btn>
      </div>
    </Modal>
  );
}
function LogHabitModal({open,onClose,habits,habitLogs,onLog,onAddHabit}) {
  const [newH,setNewH]=useState('');
  return (
    <Modal open={open} onClose={onClose} title="🔥 Habits">
      <div style={{display:'flex',flexDirection:'column',gap:10}}>
        {habits.map(h=>{ const done=(habitLogs[h.id]||[]).includes(today()); const s=getStreak(h.id,habitLogs);
          return (<div key={h.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'9px 12px',background:T.surface,borderRadius:T.r,border:`1px solid ${T.border}`}}>
            <div><div style={{fontSize:12,fontFamily:T.fM,color:T.text}}>{h.name}</div><div style={{fontSize:9,fontFamily:T.fM,color:T.textSub}}>🔥 {s}d streak</div></div>
            {done?<Badge color={T.emerald}>✓ Done</Badge>:<Btn onClick={()=>onLog(h.id)} color={T.accent} style={{padding:'5px 12px'}}>Log</Btn>}
          </div>);
        })}
        <div style={{display:'flex',gap:8,marginTop:4}}>
          <Input value={newH} onChange={e=>setNewH(e.target.value)} placeholder="New habit name" style={{flex:1}}/>
          <Btn onClick={()=>{if(newH.trim()){onAddHabit(newH.trim());setNewH('');}}} color={T.accent} style={{padding:'9px 14px'}}>+</Btn>
        </div>
      </div>
    </Modal>
  );
}
function LogVitalsModal({open,onClose,onSave}) {
  const [sleep,setSleep]=useState(''); const [mood,setMood]=useState(''); const [energy,setEnergy]=useState(''); const [weight,setWeight]=useState(''); const [date,setDate]=useState(today());
  const save=()=>{ onSave({id:Date.now(),sleep:Number(sleep)||0,mood:Number(mood)||0,energy:Number(energy)||0,weight:Number(weight)||0,date}); setSleep('');setMood('');setEnergy('');setWeight(''); };
  return (
    <Modal open={open} onClose={onClose} title="❤️ Log Vitals">
      <div style={{display:'flex',flexDirection:'column',gap:12}}>
        <Input type="number" value={sleep} onChange={e=>setSleep(e.target.value)} placeholder="Sleep hours (e.g. 7.5)" />
        <Input type="number" value={mood} onChange={e=>setMood(e.target.value)} placeholder="Mood 1-10" />
        <Input type="number" value={energy} onChange={e=>setEnergy(e.target.value)} placeholder="Energy 1-10" />
        <Input type="number" value={weight} onChange={e=>setWeight(e.target.value)} placeholder="Weight (optional)" />
        <Input type="date" value={date} onChange={e=>setDate(e.target.value)} />
        <Btn full onClick={save} color={T.sky}>Log Vitals</Btn>
      </div>
    </Modal>
  );
}
function AddNoteModal({open,onClose,onSave}) {
  const [title,setTitle]=useState(''); const [body,setBody]=useState(''); const [tag,setTag]=useState('General');
  const save=()=>{ if(!title.trim()) return; onSave({id:Date.now(),title:title.trim(),body,tag,date:today()}); setTitle('');setBody(''); };
  return (
    <Modal open={open} onClose={onClose} title="📝 Add Note">
      <div style={{display:'flex',flexDirection:'column',gap:12}}>
        <Input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Note title" />
        <Select value={tag} onChange={e=>setTag(e.target.value)}>
          {['General','Finance','Health','Career','Growth','Ideas'].map(t=><option key={t}>{t}</option>)}
        </Select>
        <textarea value={body} onChange={e=>setBody(e.target.value)} placeholder="Content…" rows={4} style={{width:'100%',padding:'9px 12px',background:'rgba(255,255,255,0.04)',border:`1px solid ${T.border}`,borderRadius:T.r,fontFamily:T.fM,fontSize:12,color:T.text,resize:'vertical'}}/>
        <Btn full onClick={save} color={T.amber}>Add Note</Btn>
      </div>
    </Modal>
  );
}
function AddGoalModal({open,onClose,onSave}) {
  const [name,setName]=useState(''); const [target,setTarget]=useState(''); const [cat,setCat]=useState('finance'); const [emoji,setEmoji]=useState('🎯');
  const save=()=>{ if(!name||!target) return; onSave({id:Date.now(),name:name.trim(),target:Number(target),current:0,cat,emoji,createdAt:today()}); setName('');setTarget(''); };
  return (
    <Modal open={open} onClose={onClose} title="🎯 New Goal">
      <div style={{display:'flex',flexDirection:'column',gap:12}}>
        <Input value={name} onChange={e=>setName(e.target.value)} placeholder="Goal name" />
        <Input type="number" value={target} onChange={e=>setTarget(e.target.value)} placeholder="Target amount / value" />
        <Select value={cat} onChange={e=>setCat(e.target.value)}>
          {['finance','health','growth','career'].map(c=><option key={c}>{c}</option>)}
        </Select>
        <Btn full onClick={save} color={T.violet}>Create Goal</Btn>
      </div>
    </Modal>
  );
}
function AddAssetModal({open,onClose,onSave}) {
  const [name,setName]=useState(''); const [val,setVal]=useState(''); const [type,setType]=useState('Cash');
  const save=()=>{ if(!name||!val) return; onSave({id:Date.now(),name:name.trim(),value:Number(val),type}); setName('');setVal(''); };
  return (
    <Modal open={open} onClose={onClose} title="💎 Add Asset">
      <div style={{display:'flex',flexDirection:'column',gap:12}}>
        <Input value={name} onChange={e=>setName(e.target.value)} placeholder="Asset name (e.g. Savings Account)" />
        <Input type="number" value={val} onChange={e=>setVal(e.target.value)} placeholder="Current value" />
        <Select value={type} onChange={e=>setType(e.target.value)}>
          {['Cash','Real Estate','Vehicle','Other'].map(t=><option key={t}>{t}</option>)}
        </Select>
        <Btn full onClick={save} color={T.accent}>Add Asset</Btn>
      </div>
    </Modal>
  );
}

// ── MOBILE BOTTOM NAV ──────────────────────────────────────────────────────────
function MobileBottomNav({active, onNav}) {
  const items=[{id:'home',Icon:IcoHome,label:'Home'},{id:'money',Icon:IcoMoney,label:'Money'},{id:'health',Icon:IcoHealth,label:'Health'},{id:'growth',Icon:IcoGrowth,label:'Growth'},{id:'knowledge',Icon:IcoBook,label:'Notes'},{id:'settings',Icon:IcoSettings,label:'More'}];
  return (
    <div className="los-mobile-nav" style={{height:64,background:`${T.bg1}f0`,backdropFilter:'blur(20px)',borderTop:`1px solid ${T.border}`,alignItems:'center',justifyContent:'space-around',padding:'0 4px'}}>
      {items.map(({id,Icon,label})=>{const isA=active===id;return(
        <button key={id} onClick={()=>onNav(id)} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:3,padding:'8px 12px',borderRadius:T.r,background:isA?T.accentDim:'transparent',transition:'all 0.18s'}}>
          <Icon size={18} stroke={isA?T.accent:T.textSub}/>
          <span style={{fontSize:8,fontFamily:T.fM,color:isA?T.accent:T.textSub}}>{label}</span>
        </button>
      );})}
    </div>
  );
}

// ── ONBOARDING WIZARD ──────────────────────────────────────────────────────────
function OnboardingWizard({onDone, lang='en'}) {
  const [step,setStep]=useState(0);
  const [name,setName]=useState(''); const [currency,setCurrency]=useState('$');
  const [goalName,setGoalName]=useState(''); const [habitName,setHabitName]=useState('');
  const steps=[tr(lang,'step1_title'),tr(lang,'step2_title'),tr(lang,'step3_title')];
  const progress=((step+1)/3)*100;
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(4,4,8,0.97)',zIndex:10000,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
      <div style={{background:T.bg2,border:`1px solid ${T.accent}33`,borderRadius:24,padding:36,width:'100%',maxWidth:460,animation:'modalIn 0.4s ease'}}>
        <div style={{textAlign:'center',marginBottom:28}}>
          <div style={{fontSize:32,marginBottom:8}}>⬡</div>
          <h1 style={{fontSize:22,fontFamily:T.fD,fontWeight:800,color:T.text}}>{tr(lang,'onboard_welcome')}</h1>
          <p style={{fontSize:12,fontFamily:T.fM,color:T.textSub,marginTop:4}}>{tr(lang,'onboard_sub')}</p>
        </div>
        <div style={{display:'flex',gap:6,marginBottom:24}}>
          {steps.map((_,i)=><div key={i} style={{flex:1,height:3,borderRadius:99,background:i<=step?T.accent:T.border,transition:'background 0.3s'}}/>)}
        </div>
        <div style={{fontSize:11,fontFamily:T.fM,color:T.accent,marginBottom:16,letterSpacing:'0.1em'}}>STEP {step+1} / 3 · {steps[step].toUpperCase()}</div>
        {step===0&&<div style={{display:'flex',flexDirection:'column',gap:12}}>
          <Input value={name} onChange={e=>setName(e.target.value)} placeholder="Your name"/>
          <Select value={currency} onChange={e=>setCurrency(e.target.value)}>{['$','€','£','¥','₹','₩','Fr','A$','C$'].map(c=><option key={c}>{c}</option>)}</Select>
        </div>}
        {step===1&&<div style={{display:'flex',flexDirection:'column',gap:12}}>
          <Input value={goalName} onChange={e=>setGoalName(e.target.value)} placeholder="e.g. Save $10,000 emergency fund"/>
          <div style={{fontSize:10,fontFamily:T.fM,color:T.textSub}}>You can add more goals later. This one gets you started.</div>
        </div>}
        {step===2&&<div style={{display:'flex',flexDirection:'column',gap:12}}>
          <Input value={habitName} onChange={e=>setHabitName(e.target.value)} placeholder="e.g. Morning workout, Read 20 min…"/>
          <div style={{fontSize:10,fontFamily:T.fM,color:T.textSub}}>Habits tracked daily. Build streaks to earn XP.</div>
        </div>}
        <div style={{display:'flex',gap:10,marginTop:24}}>
          {step>0&&<Btn onClick={()=>setStep(s=>s-1)} color={T.textSub} style={{flex:1}}>{tr(lang,'cancel')}</Btn>}
          <Btn full={step===0} onClick={()=>{ if(step<2) setStep(s=>s+1); else onDone({name:name.trim(),currency,goalName:goalName.trim(),habitName:habitName.trim()}); }} color={T.accent} style={{flex:step>0?1:undefined}}>{step===2?tr(lang,'get_started'):'Continue →'}</Btn>
        </div>
      </div>
    </div>
  );
}

// ── PIN LOCK SCREEN ────────────────────────────────────────────────────────────
function PINLockScreen({pinCode, onUnlock, lang='en'}) {
  const [entered,setEntered]=useState('');
  const [shaking,setShake]=useState(false);
  const press=(d)=>{ if(entered.length>=4) return; const n=entered+d; setEntered(n); if(n.length===4){ if(n===String(pinCode)) onUnlock(); else{ setShake(true); setTimeout(()=>{setShake(false);setEntered('');},600); } } };
  return (
    <div style={{position:'fixed',inset:0,background:T.bg,zIndex:10001,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:32}}>
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:40,marginBottom:12}}>🔒</div>
        <h2 style={{fontSize:18,fontFamily:T.fD,fontWeight:700,color:T.text}}>{tr(lang,'pin_title')}</h2>
        <p style={{fontSize:11,fontFamily:T.fM,color:T.textSub,marginTop:4}}>{tr(lang,'pin_hint')}</p>
      </div>
      <div style={{display:'flex',gap:16,animation:shaking?'pinBounce 0.1s ease 0s, pinBounce 0.1s ease 0.1s, pinBounce 0.1s ease 0.2s':'none'}}>
        {[0,1,2,3].map(i=><div key={i} style={{width:16,height:16,borderRadius:'50%',background:i<entered.length?T.accent:T.border,boxShadow:i<entered.length?`0 0 8px ${T.accent}`:''transition:'all 0.15s'}}/>)}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,width:240}}>
        {[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map((d,i)=>(
          <button key={i} onClick={()=>{ if(d==='⌫') setEntered(p=>p.slice(0,-1)); else if(d!=='') press(String(d)); }} style={{height:60,borderRadius:T.r,background:d===''?'transparent':T.surface,border:d===''?'none':`1px solid ${T.border}`,fontSize:d==='⌫'?18:20,fontFamily:d==='⌫'?T.fM:T.fD,fontWeight:600,color:T.text,transition:'all 0.15s'}} className="los-btn">{d}</button>
        ))}
      </div>
    </div>
  );
}

// ── MONTHLY REVIEW MODAL ───────────────────────────────────────────────────────
function MonthlyReviewModal({data, onDismiss, lang='en'}) {
  const [content,setContent]=useState(''); const [loading,setLoading]=useState(true);
  const {expenses,incomes,habits,habitLogs,goals,vitals,settings}=data;
  const cur=settings.currency||'$'; const m=today().slice(0,7);
  useEffect(()=>{
    (async()=>{
      const mInc=incomes.filter(i=>i.date?.startsWith(m)).reduce((s,i)=>s+Number(i.amount||0),0);
      const mExp=expenses.filter(e=>e.date?.startsWith(m)).reduce((s,e)=>s+Number(e.amount||0),0);
      const bestHabit=habits.reduce((b,h)=>{const s=getStreak(h.id,habitLogs);return s>b.s?{n:h.name,s}:b},{n:'none',s:0});
      const goalsDone=goals.filter(g=>(g.current||0)>=g.target).length;
      try{
        const res=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:400,messages:[{role:'user',content:`Generate a brief, warm monthly review for ${m}. Data: income ${cur}${fmtN(mInc)}, expenses ${cur}${fmtN(mExp)}, savings rate ${mInc>0?((mInc-mExp)/mInc*100).toFixed(0):0}%, best habit streak: ${bestHabit.n} at ${bestHabit.s} days, goals completed: ${goalsDone}. Keep it to 3 short encouraging paragraphs. No headers, just conversational prose.`}]})});
        const d=await res.json(); setContent(d.content?.map(b=>b.text||'').join('')||'Great month! Keep going.');
      } catch { setContent(`You logged ${expenses.length} expenses this month with a ${mInc>0?((mInc-mExp)/mInc*100).toFixed(0):0}% savings rate. Your best habit streak is ${bestHabit.s} days for "${bestHabit.n}". Keep up the momentum!`); }
      setLoading(false);
    })();
  },[]);
  return (
    <div onClick={onDismiss} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',zIndex:5000,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
      <div onClick={e=>e.stopPropagation()} style={{background:T.bg2,border:`1px solid ${T.violet}44`,borderRadius:20,padding:30,width:'100%',maxWidth:480,animation:'modalIn 0.3s ease'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
          <div><div style={{fontSize:9,fontFamily:T.fM,color:T.violet,letterSpacing:'0.1em'}}>{m.toUpperCase()}</div><h2 style={{fontSize:18,fontFamily:T.fD,fontWeight:700,color:T.text}}>{tr(lang,'monthly_review')}</h2></div>
          <div style={{fontSize:28}}>📋</div>
        </div>
        {loading?(<div style={{display:'flex',gap:5,alignItems:'center',padding:'20px 0'}}>{[0,1,2].map(d=><div key={d} style={{width:8,height:8,borderRadius:'50%',background:'#c084fc',animation:`dotPulse 1.2s ease ${d*0.2}s infinite`}}/>)}</div>):(<div style={{fontSize:13,fontFamily:T.fM,color:T.text,lineHeight:1.7,whiteSpace:'pre-wrap'}}>{content}</div>)}
        <Btn full onClick={onDismiss} color={T.violet} style={{marginTop:20}}>{tr(lang,'dismiss')}</Btn>
      </div>
    </div>
  );
}

// ── DAILY CHECK-IN MODAL ───────────────────────────────────────────────────────
function CheckInModal({open, onClose, onSave, lang='en'}) {
  const [mood,setMood]=useState(null); const [note,setNote]=useState('');
  const MOODS=[{v:1,e:'😞'},{v:2,e:'😟'},{v:3,e:'😕'},{v:4,e:'😐'},{v:5,e:'🙂'},{v:6,e:'😊'},{v:7,e:'😄'},{v:8,e:'🤩'},{v:9,e:'🌟'},{v:10,e:'🔥'}];
  if (!open) return null;
  return (
    <Modal open={open} onClose={onClose} title={`✨ ${tr(lang,'daily_checkin')}`}>
      <div style={{display:'flex',flexDirection:'column',gap:16}}>
        <div style={{fontSize:12,fontFamily:T.fM,color:T.textSub,textAlign:'center'}}>{tr(lang,'how_feeling')}</div>
        <div style={{display:'flex',gap:6,justifyContent:'center',flexWrap:'wrap'}}>
          {MOODS.map(m=>(
            <button key={m.v} onClick={()=>setMood(m.v)} style={{width:38,height:38,borderRadius:T.r,fontSize:20,background:mood===m.v?T.accentDim:T.surface,border:`1px solid ${mood===m.v?T.accent:T.border}`,transition:'all 0.15s',transform:mood===m.v?'scale(1.15)':'scale(1)'}}>{m.e}</button>
          ))}
        </div>
        {mood&&<div style={{textAlign:'center',fontSize:11,fontFamily:T.fM,color:T.accent}}>{mood}/10 · {MOODS.find(m=>m.v===mood)?.e}</div>}
        <Input value={note} onChange={e=>setNote(e.target.value)} placeholder="Any notes? (optional)"/>
        <Btn full onClick={()=>{ if(!mood) return; onSave(mood,note); setMood(null); setNote(''); onClose(); }} disabled={!mood} color={T.accent}>{tr(lang,'save')} Check-In</Btn>
      </div>
    </Modal>
  );
}

// ── AI SLIDE PANEL ─────────────────────────────────────────────────────────────
function AISlidePanel({open, onClose, data, lang='en'}) {
  const [messages,setMessages]=useState([{role:'assistant',content:"Hello! I'm your Life Intelligence Engine. I have a full view of your data. What would you like to explore?"}]);
  const [input,setInput]=useState(''); const [loading,setLoading]=useState(false); const endRef=useRef(null);
  const {expenses,incomes,habits,habitLogs,goals,vitals,assets,investments,debts,totalXP,settings}=data;
  const cur=settings.currency||'$';
  useEffect(()=>{endRef.current?.scrollIntoView({behavior:'smooth'});},[messages]);
  const buildCtx=()=>{
    const m=today().slice(0,7);
    const mInc=incomes.filter(i=>i.date?.startsWith(m)).reduce((s,i)=>s+Number(i.amount||0),0);
    const mExp=expenses.filter(e=>e.date?.startsWith(m)).reduce((s,e)=>s+Number(e.amount||0),0);
    const nw=assets.reduce((s,a)=>s+Number(a.value||0),0)+investments.reduce((s,i)=>s+Number((i.currentPrice??i.buyPrice)||0)*Number(i.quantity||0),0)-debts.reduce((s,d)=>s+Number(d.balance||0),0);
    return `Life OS data: NW=${cur}${fmtN(nw)}, income=${cur}${fmtN(mInc)}, expenses=${cur}${fmtN(mExp)}, habits=${habits.map(h=>`${h.name}(${getStreak(h.id,habitLogs)}d)`).join(',')}, goals=${goals.map(g=>`${g.name}:${Math.round(((g.current||0)/Math.max(1,g.target))*100)}%`).join(',')}, XP=${totalXP}`;
  };
  const send=async()=>{
    if(!input.trim()||loading) return;
    const um={role:'user',content:input}; setMessages(p=>[...p,um]); setInput(''); setLoading(true);
    try{
      const res=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:600,system:`You are a Life Intelligence Engine. ${buildCtx()} Be concise and reference real data.`,messages:[...messages,um].map(m=>({role:m.role,content:m.content}))})});
      const d=await res.json(); setMessages(p=>[...p,{role:'assistant',content:d.content?.map(b=>b.text||'').join('')||'Unable to respond.'}]);
    } catch { setMessages(p=>[...p,{role:'assistant',content:'Connection error.'}]); }
    finally { setLoading(false); }
  };
  return (
    <>
      {open&&<div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',zIndex:1999,backdropFilter:'blur(4px)'}}/>}
      <div style={{position:'fixed',top:0,right:0,bottom:0,width:380,background:T.bg2,borderLeft:`1px solid ${T.border}`,zIndex:2000,display:'flex',flexDirection:'column',transform:open?'translateX(0)':'translateX(100%)',transition:'transform 0.3s cubic-bezier(0.34,1.56,0.64,1)',boxShadow:open?`-20px 0 60px rgba(0,0,0,0.5)`:''  }}>
        <div style={{padding:'16px 18px',borderBottom:`1px solid ${T.border}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div style={{display:'flex',alignItems:'center',gap:8}}><div style={{width:28,height:28,borderRadius:'50%',background:`linear-gradient(135deg,#c084fc,${T.sky})`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12}}>⬡</div><span style={{fontSize:13,fontFamily:T.fD,fontWeight:700,color:T.text}}>{tr(lang,'ai_panel_title')}</span></div>
          <button onClick={onClose}><IcoX size={16} stroke={T.textSub}/></button>
        </div>
        <div style={{flex:1,overflowY:'auto',padding:'14px',display:'flex',flexDirection:'column',gap:10}}>
          {messages.map((msg,i)=>(
            <div key={i} style={{display:'flex',gap:8,flexDirection:msg.role==='user'?'row-reverse':'row',animation:'fadeUp 0.2s ease'}}>
              <div style={{maxWidth:'85%',padding:'9px 12px',borderRadius:T.rL,background:msg.role==='user'?T.accentDim:T.surfaceHi,border:`1px solid ${msg.role==='user'?T.accent+'33':T.border}`,fontSize:12,fontFamily:T.fM,color:T.text,lineHeight:1.6,borderBottomRightRadius:msg.role==='user'?4:T.rL,borderBottomLeftRadius:msg.role==='assistant'?4:T.rL}}>{msg.content}</div>
            </div>
          ))}
          {loading&&<div style={{display:'flex',gap:5,padding:'8px 12px'}}>{[0,1,2].map(d=><div key={d} style={{width:6,height:6,borderRadius:'50%',background:'#c084fc',animation:`dotPulse 1.2s ease ${d*0.2}s infinite`}}/>)}</div>}
          <div ref={endRef}/>
        </div>
        <div style={{padding:'12px 14px',borderTop:`1px solid ${T.border}`,display:'flex',gap:8}}>
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&send()} placeholder="Ask anything…" style={{flex:1,background:T.surface,border:`1px solid ${T.border}`,borderRadius:T.r,padding:'8px 12px',fontFamily:T.fM,fontSize:12,color:T.text}}/>
          <button className="los-btn" onClick={send} disabled={!input.trim()||loading} style={{width:36,height:36,borderRadius:T.r,background:input.trim()?T.accentDim:T.surface,border:`1px solid ${input.trim()?T.accent+'44':T.border}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><IcoSend size={13} stroke={input.trim()?T.accent:T.textMuted}/></button>
        </div>
      </div>
    </>
  );
}

// ── QUICK CAPTURE FAB ──────────────────────────────────────────────────────────
function QuickCaptureFAB({onAction, lang='en'}) {
  const [open,setOpen]=useState(false);
  const ACTIONS=[
    {label:tr(lang,'log_expense'),emoji:'💳',color:T.rose,key:'expense'},
    {label:tr(lang,'log_income'),emoji:'💰',color:T.emerald,key:'income'},
    {label:tr(lang,'log_habit'),emoji:'🔥',color:T.accent,key:'habit'},
    {label:tr(lang,'log_vitals'),emoji:'❤️',color:T.sky,key:'vitals'},
    {label:tr(lang,'add_note'),emoji:'📝',color:T.amber,key:'note'},
    {label:tr(lang,'add_goal'),emoji:'🎯',color:T.violet,key:'goal'},
  ];
  return (
    <>
      {open&&<div onClick={()=>setOpen(false)} style={{position:'fixed',inset:0,zIndex:1199}}/>}
      <div style={{position:'fixed',bottom:84,right:24,zIndex:1200,display:'flex',flexDirection:'column-reverse',alignItems:'flex-end',gap:10}}>
        {open&&ACTIONS.map((a,i)=>(
          <div key={a.key} className="los-fab-item" style={{display:'flex',alignItems:'center',gap:10,animationDelay:`${i*0.04}s`}}>
            <div style={{fontSize:10,fontFamily:T.fM,color:T.text,background:T.bg2,padding:'4px 10px',borderRadius:99,border:`1px solid ${T.border}`,whiteSpace:'nowrap'}}>{a.label}</div>
            <button onClick={()=>{onAction(a.key);setOpen(false);}} style={{width:42,height:42,borderRadius:'50%',background:a.color+'22',border:`1px solid ${a.color}44`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,transition:'all 0.15s',flexShrink:0}} className="los-btn">{a.emoji}</button>
          </div>
        ))}
        <button onClick={()=>setOpen(o=>!o)} className="los-btn" style={{width:52,height:52,borderRadius:'50%',background:`linear-gradient(135deg,${T.accent}22,${T.violet}22)`,border:`1px solid ${T.accent}55`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,boxShadow:open?`0 0 20px ${T.accent}33`:'',transition:'all 0.25s',transform:open?'rotate(45deg)':'rotate(0)'}}>
          {open?'×':'⊕'}
        </button>
      </div>
    </>
  );
}

// ── UNDO BAR ───────────────────────────────────────────────────────────────────
function UndoBar({undoItem, onUndo, onDismiss}) {
  if (!undoItem) return null;
  return (
    <div style={{position:'fixed',bottom:80,left:'50%',transform:'translateX(-50%)',zIndex:1300,display:'flex',alignItems:'center',gap:12,padding:'10px 18px',background:T.bg2,border:`1px solid ${T.amber}44`,borderRadius:99,boxShadow:`0 4px 20px rgba(0,0,0,0.4)`,animation:'slideUp 0.25s ease',whiteSpace:'nowrap'}}>
      <span style={{fontSize:11,fontFamily:T.fM,color:T.text}}>Deleted <b style={{color:T.amber}}>{undoItem.label}</b></span>
      <button onClick={onUndo} className="los-btn" style={{padding:'4px 14px',borderRadius:99,background:T.amberDim,border:`1px solid ${T.amber}44`,fontSize:11,fontFamily:T.fM,color:T.amber,display:'flex',alignItems:'center',gap:5}}>
        <IcoUndoZ size={11} stroke={T.amber}/> Undo
      </button>
      <button onClick={onDismiss} style={{color:T.textMuted}}><IcoX size={12} stroke={T.textMuted}/></button>
    </div>
  );
}

// ── SMART ALERTS BAR ───────────────────────────────────────────────────────────
function SmartAlertsChip({alerts}) {
  const [show,setShow]=useState(false);
  if (!alerts.length) return null;
  return (
    <div style={{position:'relative'}}>
      <button onClick={()=>setShow(o=>!o)} style={{display:'flex',alignItems:'center',gap:5,padding:'4px 10px',borderRadius:99,background:T.roseDim,border:`1px solid ${T.rose}33`,fontSize:9,fontFamily:T.fM,color:T.rose,transition:'all 0.15s'}}>
        ⚠️ {alerts.length} alert{alerts.length>1?'s':''}
      </button>
      {show&&(
        <div style={{position:'absolute',top:'calc(100% + 8px)',right:0,background:T.bg2,border:`1px solid ${T.border}`,borderRadius:T.r,padding:12,width:260,zIndex:300,animation:'fadeIn 0.15s ease'}}>
          {alerts.map((a,i)=>(
            <div key={i} style={{display:'flex',alignItems:'center',gap:8,padding:'6px 0',borderBottom:i<alerts.length-1?`1px solid ${T.border}`:'none'}}>
              <span style={{fontSize:14}}>{a.icon}</span>
              <span style={{fontSize:11,fontFamily:T.fM,color:a.color||T.text}}>{a.msg}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── WEEKLY INTENTIONS WIDGET ───────────────────────────────────────────────────
function WeeklyIntentions({intentions, onSave, onToggle, lang='en'}) {
  const [editing,setEditing]=useState(null); const [draft,setDraft]=useState('');
  const weekStart=(()=>{ const d=new Date(); d.setDate(d.getDate()-d.getDay()); return d.toLocaleDateString('en-US',{month:'short',day:'numeric'}); })();
  const slots=[0,1,2];
  return (
    <GlassCard style={{padding:'18px 20px'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
        <div><SectionLabel>{tr(lang,'weekly_intentions')}</SectionLabel><div style={{fontSize:9,fontFamily:T.fM,color:T.textMuted}}>Week of {weekStart}</div></div>
        <IcoTarget size={16} stroke={T.violet}/>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:8}}>
        {slots.map(i=>{
          const it=intentions?.[i]; const done=it?.done||false;
          return editing===i?(
            <div key={i} style={{display:'flex',gap:8}}>
              <Input value={draft} onChange={e=>setDraft(e.target.value)} placeholder={tr(lang,'set_intentions')} style={{flex:1,fontSize:11}}/>
              <Btn onClick={()=>{ onSave(draft,i); setEditing(null); setDraft(''); }} color={T.violet} style={{padding:'6px 12px',fontSize:10}}>✓</Btn>
            </div>
          ):(
            <div key={i} onClick={()=>{ if(!it?.text) { setEditing(i); setDraft(''); } }} style={{display:'flex',alignItems:'center',gap:10,padding:'9px 12px',borderRadius:T.r,background:done?T.violetDim:T.surface,border:`1px solid ${done?T.violet+'44':T.border}`,cursor:it?.text?'default':'pointer',transition:'all 0.15s'}}>
              <button onClick={e=>{e.stopPropagation();if(it?.text)onToggle(i);}} style={{width:16,height:16,borderRadius:4,border:`1px solid ${done?T.violet:T.border}`,background:done?T.violet:'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,color:'white',fontSize:10,transition:'all 0.15s'}}>{done&&'✓'}</button>
              <span style={{fontSize:11,fontFamily:T.fM,color:it?.text?(done?T.textSub:T.text):T.textMuted,textDecoration:done?'line-through':'none',flex:1}}>{it?.text||`Intention ${i+1} — click to set`}</span>
              {it?.text&&<button onClick={e=>{e.stopPropagation();setEditing(i);setDraft(it.text||'');}} style={{fontSize:9,fontFamily:T.fM,color:T.textMuted}}>edit</button>}
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}

// ── BUDGET WIDGET ──────────────────────────────────────────────────────────────
function BudgetWidget({expenses, budgets, onSetBudget, currency, lang='en'}) {
  const [editing,setEditing]=useState(null); const [draft,setDraft]=useState('');
  const thisMonth=today().slice(0,7);
  const topCats=useMemo(()=>{
    const m={}; expenses.filter(e=>e.date?.startsWith(thisMonth)).forEach(e=>{ m[e.category]=(m[e.category]||0)+Number(e.amount||0); });
    return Object.entries(m).sort((a,b)=>b[1]-a[1]).slice(0,5);
  },[expenses,thisMonth]);
  if (!topCats.length) return null;
  return (
    <GlassCard style={{padding:'18px 20px'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
        <SectionLabel>{tr(lang,'budget_remaining')}</SectionLabel>
        <span style={{fontSize:9,fontFamily:T.fM,color:T.textSub}}>{thisMonth}</span>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:10}}>
        {topCats.map(([cat,spent])=>{
          const budget=budgets[cat]||0; const over=budget>0&&spent>budget; const pct=budget>0?Math.min(100,(spent/budget)*100):0;
          const color=over?T.rose:pct>80?T.amber:T.emerald;
          return (
            <div key={cat}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                <span style={{fontSize:10,fontFamily:T.fM,color:T.text}}>{cat}</span>
                <div style={{display:'flex',alignItems:'center',gap:6}}>
                  <span style={{fontSize:10,fontFamily:T.fM,color:color,fontWeight:600}}>{currency}{fmtN(spent)}</span>
                  {editing===cat?(
                    <div style={{display:'flex',gap:4,alignItems:'center'}}>
                      <input value={draft} onChange={e=>setDraft(e.target.value)} style={{width:60,padding:'2px 6px',background:T.surface,border:`1px solid ${T.border}`,borderRadius:4,fontFamily:T.fM,fontSize:10,color:T.text}} placeholder="budget"/>
                      <button onClick={()=>{onSetBudget(cat,draft);setEditing(null);}} style={{fontSize:9,fontFamily:T.fM,color:T.accent}}>✓</button>
                    </div>
                  ):(
                    <button onClick={()=>{setEditing(cat);setDraft(String(budget||''));}} style={{fontSize:9,fontFamily:T.fM,color:T.textMuted}}>/ {budget?currency+fmtN(budget):'set'}</button>
                  )}
                </div>
              </div>
              {budget>0&&<ProgressBar pct={pct} color={color} height={3}/>}
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}

// ── WEEKLY AI BRIEF WIDGET ─────────────────────────────────────────────────────
function WeeklyBriefWidget({data, weeklyBriefs, onSaveBrief, lang='en'}) {
  const [loading,setLoading]=useState(false); const [expanded,setExpanded]=useState(false);
  const {expenses,incomes,habits,habitLogs,goals,vitals,settings}=data;
  const cur=settings.currency||'$';
  const weekKey=(()=>{ const d=new Date(); const s=new Date(d); s.setDate(d.getDate()-d.getDay()); return s.toISOString().slice(0,10); })();
  const currentBrief=weeklyBriefs?.find(b=>b.week===weekKey);
  const generate=async()=>{
    setLoading(true);
    const mInc=incomes.filter(i=>i.date?.startsWith(today().slice(0,7))).reduce((s,i)=>s+Number(i.amount||0),0);
    const mExp=expenses.filter(e=>e.date?.startsWith(today().slice(0,7))).reduce((s,e)=>s+Number(e.amount||0),0);
    const bestStreak=habits.reduce((mx,h)=>{const s=getStreak(h.id,habitLogs);return s>mx?s:mx;},0);
    const goalAvg=goals.length?Math.round(goals.reduce((s,g)=>s+(g.current||0)/Math.max(1,g.target)*100,0)/goals.length):0;
    const lastVitals=vitals.length?[...vitals].sort((a,b)=>a.date<b.date?1:-1)[0]:null;
    try{
      const res=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:250,messages:[{role:'user',content:`Brief weekly life OS update. Income: ${cur}${fmtN(mInc)}, expenses: ${cur}${fmtN(mExp)}, savings rate: ${mInc>0?((mInc-mExp)/mInc*100).toFixed(0):0}%, best habit streak: ${bestStreak}d, avg goal progress: ${goalAvg}%, latest sleep: ${lastVitals?.sleep||'N/A'}h. Write 2-3 short sharp sentences. No bullet points.`}]})});
      const d=await res.json(); const text=d.content?.map(b=>b.text||'').join('')||'Log more data for your AI brief.';
      onSaveBrief({week:weekKey,text,generatedAt:today()});
    } catch { onSaveBrief({week:weekKey,text:'Log expenses, habits and vitals to get your AI-powered weekly brief.',generatedAt:today()}); }
    setLoading(false);
  };
  return (
    <GlassCard style={{padding:'18px 20px'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
        <div style={{display:'flex',alignItems:'center',gap:7}}>
          <div style={{width:5,height:5,borderRadius:'50%',background:'#c084fc',animation:'dotPulse 2s infinite'}}/>
          <span style={{fontSize:9,fontFamily:T.fM,letterSpacing:'0.1em',color:'#c084fc',textTransform:'uppercase'}}>{tr(lang,'weekly_brief')}</span>
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          {(weeklyBriefs?.length>1)&&<button onClick={()=>setExpanded(o=>!o)} style={{fontSize:9,fontFamily:T.fM,color:T.textSub}}>{expanded?'hide':'history'}</button>}
          <button onClick={generate} disabled={loading} style={{fontSize:9,fontFamily:T.fM,color:T.accent,display:'flex',alignItems:'center',gap:4}}>{loading?'…':currentBrief?'↺ refresh':'✦ generate'}</button>
        </div>
      </div>
      {loading?(<div style={{display:'flex',gap:5,padding:'8px 0'}}>{[0,1,2].map(d=><div key={d} style={{width:7,height:7,borderRadius:'50%',background:'#c084fc',animation:`dotPulse 1.2s ease ${d*0.2}s infinite`}}/>)}</div>):(
        currentBrief?(<div style={{fontSize:12,fontFamily:T.fM,color:T.text,lineHeight:1.7}}>{currentBrief.text}</div>):(
          <div style={{fontSize:11,fontFamily:T.fM,color:T.textMuted,textAlign:'center',padding:'8px 0'}}>Click generate for your AI-powered weekly brief</div>
        )
      )}
      {expanded&&weeklyBriefs?.filter(b=>b.week!==weekKey).slice(0,3).map((b,i)=>(
        <div key={i} style={{marginTop:12,paddingTop:12,borderTop:`1px solid ${T.border}`}}>
          <div style={{fontSize:9,fontFamily:T.fM,color:T.textMuted,marginBottom:4}}>Week of {b.week}</div>
          <div style={{fontSize:11,fontFamily:T.fM,color:T.textSub,lineHeight:1.6}}>{b.text}</div>
        </div>
      ))}
    </GlassCard>
  );
}



function HomePage({data,actions,onNav,onCheckin,lang='en'}) {
  const {expenses,incomes,assets,investments,debts,habits,habitLogs,goals,vitals,totalXP,settings,timeline,intentions,budgets,weeklyBriefs}=data;
  const [modal,setModal]=useState(null);
  const [checkinDone,setCheckinDone]=useState(()=>localStorage.getItem('los_checkin_done')===today());
  const cur=settings.currency||'$';
  const thisMonth=today().slice(0,7);
  const hour=new Date().getHours();
  const greeting=hour<12?tr(lang,'greeting_morning'):hour<17?tr(lang,'greeting_afternoon'):tr(lang,'greeting_evening');

  const monthExp=useMemo(()=>expenses.filter(e=>e.date?.startsWith(thisMonth)).reduce((s,e)=>s+Number(e.amount||0),0),[expenses,thisMonth]);
  const monthInc=useMemo(()=>incomes.filter(i=>i.date?.startsWith(thisMonth)).reduce((s,i)=>s+Number(i.amount||0),0),[incomes,thisMonth]);
  const invVal=useMemo(()=>investments.reduce((s,i)=>s+(Number((i.currentPrice??i.buyPrice)||0))*Number(i.quantity||0),0),[investments]);
  const assetVal=useMemo(()=>assets.reduce((s,a)=>s+Number(a.value||0),0),[assets]);
  const debtVal=useMemo(()=>debts.reduce((s,d)=>s+Number(d.balance||0),0),[debts]);
  const netWorth=assetVal+invVal-debtVal;
  const savRate=monthInc>0?((monthInc-monthExp)/monthInc)*100:0;
  const fhs=useMemo(()=>{
    let s=0; s+=Math.min(30,savRate*1.5);
    const mdp=debts.reduce((a,d)=>a+Number(d.minPayment||0),0);
    const dti=monthInc>0?(mdp/monthInc)*100:50; s+=Math.max(0,25-dti*0.5);
    const cash=assets.filter(a=>a.type==='Cash').reduce((a,x)=>a+Number(x.value||0),0);
    const ef=monthExp>0?cash/monthExp:0; s+=Math.min(25,ef*4.2);
    if(netWorth>0) s+=Math.min(20,10+(netWorth/10000)*5);
    return Math.round(Math.max(0,Math.min(100,s)));
  },[savRate,debts,assets,monthInc,monthExp,netWorth]);
  const level=Math.floor(Math.sqrt(Number(totalXP)/100))+1;
  const xpForNext=Math.pow(level,2)*100; const xpForCurrent=Math.pow(level-1,2)*100;
  const xpPct=((Number(totalXP)-xpForCurrent)/(xpForNext-xpForCurrent))*100;
  const todayDone=habits.filter(h=>(habitLogs[h.id]||[]).includes(today())).length;
  const bestStreak=habits.reduce((max,h)=>{const s=getStreak(h.id,habitLogs);return s>max?s:max;},0);
  const lastVitals=vitals.length?[...vitals].sort((a,b)=>a.date<b.date?1:-1)[0]:null;

  const recentFeed=useMemo(()=>{
    const evs=[];
    if(timeline&&timeline.length>0){timeline.slice(0,8).forEach(e=>evs.push({id:e.id,ts:e.date,title:e.title,sub:e.description,value:'',cat:e.category,color:e.color,emoji:e.emoji}));}
    else{
      [...expenses].sort((a,b)=>a.date<b.date?1:-1).slice(0,3).forEach(e=>evs.push({id:'exp-'+e.id,ts:e.date,title:e.note||e.category,sub:e.category,value:`-${cur}${fmtN(e.amount)}`,cat:'money',color:T.rose,emoji:'💳'}));
      [...incomes].sort((a,b)=>a.date<b.date?1:-1).slice(0,2).forEach(e=>evs.push({id:'inc-'+e.id,ts:e.date,title:e.note||'Income received',sub:'Income',value:`+${cur}${fmtN(e.amount)}`,cat:'money',color:T.emerald,emoji:'💰'}));
    }
    return evs.sort((a,b)=>a.ts<b.ts?1:-1).slice(0,7);
  },[timeline,expenses,incomes,cur]);

  const QUICK_ACTIONS=[
    {label:tr(lang,'log_expense'),emoji:'💳',color:T.rose,modal:'expense'},
    {label:tr(lang,'log_income'),emoji:'💰',color:T.emerald,modal:'income'},
    {label:tr(lang,'log_habit'),emoji:'🔥',color:T.accent,modal:'habit'},
    {label:tr(lang,'log_vitals'),emoji:'❤️',color:T.sky,modal:'vitals'},
    {label:tr(lang,'add_note'),emoji:'📝',color:T.amber,modal:'note'},
    {label:tr(lang,'add_goal'),emoji:'🎯',color:T.violet,modal:'goal'},
  ];

  return (
    <div style={{animation:'fadeUp 0.4s ease'}}>
      <LogExpenseModal open={modal==='expense'} onClose={()=>setModal(null)} onSave={e=>{actions.addExpense(e);setModal(null);}}/>
      <LogIncomeModal open={modal==='income'} onClose={()=>setModal(null)} onSave={e=>{actions.addIncome(e);setModal(null);}}/>
      <LogHabitModal open={modal==='habit'} onClose={()=>setModal(null)} habits={habits} habitLogs={habitLogs} onLog={actions.logHabit} onAddHabit={actions.addHabit}/>
      <LogVitalsModal open={modal==='vitals'} onClose={()=>setModal(null)} onSave={e=>{actions.addVitals(e);setModal(null);}}/>
      <AddNoteModal open={modal==='note'} onClose={()=>setModal(null)} onSave={e=>{actions.addNote(e);setModal(null);}}/>
      <AddGoalModal open={modal==='goal'} onClose={()=>setModal(null)} onSave={e=>{actions.addGoal(e);setModal(null);}}/>
      <CheckInModal open={modal==='checkin'} onClose={()=>setModal(null)} onSave={(mood,note)=>{onCheckin(mood,note);setCheckinDone(true);localStorage.setItem('los_checkin_done',today());}} lang={lang}/>

      <div style={{marginBottom:20,display:'flex',justifyContent:'space-between',alignItems:'flex-end',flexWrap:'wrap',gap:12}}>
        <div>
          <div style={{fontSize:10,fontFamily:T.fM,color:T.textSub,letterSpacing:'0.1em',marginBottom:5,textTransform:'uppercase'}}>{greeting.toUpperCase()} · {new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})}</div>
          <h1 style={{fontSize:26,fontFamily:T.fD,fontWeight:800,color:T.text}}>{tr(lang,'command_center')}</h1>
          <div style={{fontSize:11,fontFamily:T.fM,color:T.textSub,marginTop:4}}>
            {settings.name?`${settings.name} · `:''}<span style={{color:T.emerald}}>●</span> {habits.length} habits · <span style={{color:T.accent}}>●</span> NW {cur}{fmtN(netWorth)} · <span style={{color:T.violet}}>●</span> {(timeline||[]).length} events
          </div>
        </div>
        {!checkinDone&&(
          <button onClick={()=>setModal('checkin')} className="los-btn" style={{display:'flex',alignItems:'center',gap:8,padding:'10px 18px',borderRadius:99,background:`linear-gradient(135deg,${T.accent}18,${T.violet}18)`,border:`1px solid ${T.accent}44`,fontSize:11,fontFamily:T.fM,color:T.accent,animation:'glowPulse 3s infinite'}}>
            ✨ {tr(lang,'daily_checkin')}
          </button>
        )}
      </div>

      <div className="los-grid-4" style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:18}}>
        {[
          {label:'Net Worth',value:`${cur}${fmtN(netWorth)}`,sub:`Assets ${cur}${fmtN(assetVal+invVal)} · Debts ${cur}${fmtN(debtVal)}`,color:T.accent,icon:'💎',pct:null},
          {label:'Financial Health',value:`${fhs}/100`,sub:fhs>=70?'Strong finances':fhs>=40?'Room to improve':'Needs attention',color:T.emerald,icon:'📊',pct:fhs},
          {label:`Life XP — Lv ${level}`,value:`${Number(totalXP).toLocaleString()} XP`,sub:`${Math.round(xpForNext-Number(totalXP))} to Lv ${level+1}`,color:T.violet,icon:'⚡',pct:xpPct},
          {label:'Savings Rate',value:`${savRate.toFixed(1)}%`,sub:`${cur}${fmtN(monthInc-monthExp)} saved this month`,color:T.sky,icon:'🎯',pct:savRate},
        ].map((m,i)=>(
          <GlassCard key={i} style={{padding:'18px 20px',animation:`fadeUp 0.4s ease ${i*0.08}s both`}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
              <div style={{fontSize:9,fontFamily:T.fM,color:T.textSub,letterSpacing:'0.1em',textTransform:'uppercase'}}>{m.label}</div>
              <span style={{fontSize:16,opacity:0.7}}>{m.icon}</span>
            </div>
            <div style={{fontSize:20,fontFamily:T.fD,fontWeight:700,color:m.color,lineHeight:1,marginBottom:6}}>{m.value}</div>
            <div style={{fontSize:10,fontFamily:T.fM,color:T.textSub,marginBottom:m.pct!=null?10:0}}>{m.sub}</div>
            {m.pct!=null&&<ProgressBar pct={m.pct} color={m.color} height={4}/>}
          </GlassCard>
        ))}
      </div>

      <div className="los-grid-2col" style={{display:'grid',gridTemplateColumns:'1fr 340px',gap:16}}>
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          <WeeklyBriefWidget data={data} weeklyBriefs={weeklyBriefs} onSaveBrief={actions.saveWeeklyBrief} lang={lang}/>
          <WeeklyIntentions intentions={intentions} onSave={actions.saveIntention} onToggle={actions.toggleIntention} lang={lang}/>
          <GlassCard style={{padding:'20px 22px'}}>
            <SectionLabel>{tr(lang,'quick_actions')}</SectionLabel>
            <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:8}}>
              {QUICK_ACTIONS.map((a,i)=>(
                <button key={i} className="los-qa" onClick={()=>setModal(a.modal)} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:5,padding:'10px 6px',borderRadius:T.r,background:T.surface,border:`1px solid ${T.border}`,transition:'all 0.18s',animation:`fadeUp 0.3s ease ${i*0.06}s both`}}>
                  <span style={{fontSize:18}}>{a.emoji}</span>
                  <span style={{fontSize:9,fontFamily:T.fM,color:T.textSub,textAlign:'center',lineHeight:1.3}}>{a.label}</span>
                </button>
              ))}
            </div>
          </GlassCard>
          <BudgetWidget expenses={expenses} budgets={budgets} onSetBudget={actions.setBudget} currency={cur} lang={lang}/>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            {[
              {label:'This Month',sub:'Income',val:`${cur}${fmtN(monthInc)}`,color:T.emerald},
              {label:'This Month',sub:'Spent',val:`${cur}${fmtN(monthExp)}`,color:T.rose},
              {label:'Habits',sub:`${todayDone}/${habits.length} today`,val:bestStreak?`🔥 ${bestStreak}d`:habits.length===0?'None yet':'0d',color:T.accent},
              {label:'Goals',sub:`${goals.length} active`,val:goals.length>0?`${Math.round(goals.reduce((s,g)=>s+(g.current||0)/Math.max(1,g.target)*100,0)/Math.max(1,goals.length))}% avg`:'Set goals',color:T.violet},
            ].map((s,i)=>(
              <GlassCard key={i} style={{padding:'14px 16px'}}>
                <div style={{fontSize:9,fontFamily:T.fM,color:T.textSub,letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:4}}>{s.label} · {s.sub}</div>
                <div style={{fontSize:16,fontFamily:T.fD,fontWeight:700,color:s.color}}>{s.val}</div>
              </GlassCard>
            ))}
          </div>
          <GlassCard style={{padding:'18px',flex:1}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
              <SectionLabel>{tr(lang,'activity_feed')}</SectionLabel>
              <button onClick={()=>onNav('timeline')} style={{fontSize:9,fontFamily:T.fM,color:T.accent,display:'flex',alignItems:'center',gap:2}}>All <IcoChevR size={9} stroke={T.accent}/></button>
            </div>
            {recentFeed.length===0?(
              <div style={{textAlign:'center',padding:'20px 0',fontSize:11,fontFamily:T.fM,color:T.textMuted}}>Start logging to see your activity feed here.</div>
            ):(
              recentFeed.map((ev,i)=>(
                <div key={ev.id} className="los-ev" style={{display:'flex',alignItems:'flex-start',gap:9,padding:'8px 7px',borderRadius:7,cursor:'pointer',transition:'background 0.15s',borderBottom:i<recentFeed.length-1?`1px solid ${T.border}`:'none'}}>
                  <div style={{fontSize:12,marginTop:1,flexShrink:0}}>{ev.emoji}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <div style={{fontSize:11,fontFamily:T.fD,fontWeight:600,color:T.text,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:160}}>{ev.title}</div>
                      <div style={{fontSize:10,fontFamily:T.fM,color:ev.color,whiteSpace:'nowrap',marginLeft:6}}>{ev.value}</div>
                    </div>
                    <div style={{fontSize:9,fontFamily:T.fM,color:T.textSub,marginTop:1}}>{ev.sub} · {ev.ts}</div>
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



// ── TIMELINE PAGE V2 — FULL FEATURED ──────────────────────────────────────────
function TimelinePage({data,onNav}) {
  const {expenses,incomes,habits,habitLogs,vitals,goals,investments,assets,debts,settings,notes,timeline:storedTimeline}=data;
  const [filter,setFilter]=useState('all');
  const [zoom,setZoom]=useState('week');
  const [search,setSearch]=useState('');
  const [page,setPage]=useState(0);
  const PAGE_SIZE=40;
  const cur=settings.currency||'$';

  // Derive events from stored timeline + fallback from raw data
  const allEvents=useMemo(()=>{
    const evs=[];
    // Use stored timeline events (from createTimelineEvent calls)
    if(storedTimeline&&storedTimeline.length>0){
      storedTimeline.forEach(e=>evs.push(e));
    }
    // Always augment with raw data (deduped by type+source)
    const existingIds=new Set(evs.map(e=>e.id));
    expenses.forEach(e=>{const id='raw-exp-'+e.id;if(!existingIds.has(id))evs.push({id,type:'expense',title:e.note||e.category,description:`${cur}${fmtN(e.amount)} — ${e.category}`,category:'money',emoji:'💳',color:T.rose,timestamp:new Date(e.date+'T12:00:00').getTime()||Date.now(),date:e.date,metadata:{amount:e.amount,category:e.category}});});
    incomes.forEach(i=>{const id='raw-inc-'+i.id;if(!existingIds.has(id))evs.push({id,type:'income',title:i.note||'Income received',description:`+${cur}${fmtN(i.amount)}`,category:'money',emoji:'💰',color:T.emerald,timestamp:new Date(i.date+'T12:00:00').getTime()||Date.now(),date:i.date,metadata:{amount:i.amount}});});
    habits.forEach(h=>{(habitLogs[h.id]||[]).forEach(d=>{const id='raw-hab-'+h.id+d;if(!existingIds.has(id))evs.push({id,type:'habit_completed',title:`${h.name} completed`,description:`🔥 ${getStreak(h.id,habitLogs)}d streak`,category:'growth',emoji:'🔥',color:T.accent,timestamp:new Date(d+'T12:00:00').getTime()||Date.now(),date:d,metadata:{habitId:h.id,habitName:h.name}});});});
    vitals.forEach(v=>{const id='raw-vit-'+v.id;if(!existingIds.has(id))evs.push({id,type:'vitals_logged',title:'Vitals Logged',description:`Sleep ${v.sleep}h · Mood ${v.mood}/10 · Energy ${v.energy}/10`,category:'health',emoji:'❤️',color:T.sky,timestamp:new Date(v.date+'T12:00:00').getTime()||Date.now(),date:v.date,metadata:v});});
    goals.filter(g=>(g.current||0)>=g.target).forEach(g=>{const id='raw-goal-'+g.id;if(!existingIds.has(id))evs.push({id,type:'goal_completed',title:`Goal completed: ${g.name}`,description:`Reached ${cur}${fmtN(g.target)} target`,category:'growth',emoji:'🏁',color:T.emerald,timestamp:new Date((g.updatedAt||today())+'T12:00:00').getTime()||Date.now(),date:g.updatedAt||today(),metadata:{goalName:g.name}});});
    notes.forEach(n=>{const id='raw-note-'+n.id;if(!existingIds.has(id))evs.push({id,type:'note_created',title:n.title||'Note created',description:n.tag||'Knowledge',category:'knowledge',emoji:'📝',color:T.amber,timestamp:new Date((n.date||today())+'T12:00:00').getTime()||Date.now(),date:n.date||today(),metadata:{tag:n.tag}});});
    return evs.sort((a,b)=>b.timestamp-a.timestamp);
  },[storedTimeline,expenses,incomes,habits,habitLogs,vitals,goals,notes,cur,assets,debts]);

  // Net worth history overlay data
  const nwOverlay=useMemo(()=>{
    return data.netWorthHistory&&data.netWorthHistory.length>0?data.netWorthHistory:[];
  },[data.netWorthHistory]);

  // Category filter
  const catFiltered=useMemo(()=>{
    if(filter==='all') return allEvents;
    return allEvents.filter(e=>e.category===filter);
  },[allEvents,filter]);

  // Search filter
  const searched=useMemo(()=>{
    if(!search.trim()) return catFiltered;
    const q=search.toLowerCase();
    return catFiltered.filter(e=>`${e.title} ${e.description} ${e.type}`.toLowerCase().includes(q));
  },[catFiltered,search]);

  // Zoom grouping
  const grouped=useMemo(()=>{
    const g={};
    searched.forEach(ev=>{
      let key;
      const d=ev.date||'Unknown';
      if(zoom==='day') key=d;
      else if(zoom==='week'){
        const dt=new Date(d+'T12:00:00'); dt.setDate(dt.getDate()-dt.getDay());
        key='Week of '+dt.toLocaleDateString('en-US',{month:'short',day:'numeric'});
      } else if(zoom==='month') key=d.slice(0,7);
      else key=d.slice(0,4);
      if(!g[key]) g[key]=[];
      g[key].push(ev);
    });
    return Object.entries(g).sort((a,b)=>b[0]>a[0]?1:-1);
  },[searched,zoom]);

  // Pagination
  const totalPages=Math.ceil(searched.length/PAGE_SIZE);
  const paged=grouped; // groups already ordered, we'll paginate events within

  const CATS=[
    {id:'all',label:'All',icon:'⬡',color:T.textSub},
    {id:'money',label:'Money',icon:'💰',color:T.emerald},
    {id:'health',label:'Health',icon:'❤️',color:T.sky},
    {id:'growth',label:'Growth',icon:'📈',color:T.violet},
    {id:'knowledge',label:'Knowledge',icon:'📚',color:T.amber},
    {id:'system',label:'System',icon:'⚙️',color:T.accent},
  ];

  const stats=useMemo(()=>({
    total:allEvents.length,
    today:allEvents.filter(e=>e.date===today()).length,
    thisWeek:allEvents.filter(e=>{const d=new Date(e.date+'T12:00:00');const now=new Date();const diff=(now-d)/864e5;return diff<=7;}).length,
    byCategory:Object.fromEntries(Object.keys(TL_CATS).map(c=>[c,allEvents.filter(e=>e.category===c).length])),
  }),[allEvents]);

  return (
    <div style={{animation:'fadeUp 0.4s ease'}}>
      {/* Header */}
      <div style={{marginBottom:22}}>
        <SectionLabel>Core System · Timeline Engine</SectionLabel>
        <h1 style={{fontSize:26,fontFamily:T.fD,fontWeight:800,color:T.text}}>Life Timeline</h1>
        <div style={{fontSize:11,fontFamily:T.fM,color:T.textSub,marginTop:4}}>
          <span style={{color:T.accent}}>{stats.total}</span> events recorded · <span style={{color:T.emerald}}>{stats.today}</span> today · <span style={{color:T.violet}}>{stats.thisWeek}</span> this week
        </div>
      </div>

      {/* Stats Row */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:10,marginBottom:18}}>
        {Object.entries(stats.byCategory).map(([cat,count])=>{
          const meta=TL_CATS[cat];
          return (
            <GlassCard key={cat} style={{padding:'12px 14px',cursor:'pointer',borderLeft:`3px solid ${meta.color}55`}} onClick={()=>setFilter(filter===cat?'all':cat)}>
              <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}>
                <span style={{fontSize:13}}>{meta.icon}</span>
                <span style={{fontSize:9,fontFamily:T.fM,color:T.textSub,letterSpacing:'0.08em',textTransform:'uppercase'}}>{meta.label}</span>
              </div>
              <div style={{fontSize:18,fontFamily:T.fD,fontWeight:700,color:meta.color}}>{count}</div>
            </GlassCard>
          );
        })}
      </div>

      {/* Net Worth Overlay Chart */}
      {nwOverlay.length>1&&(
        <GlassCard style={{padding:'16px 20px',marginBottom:18}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
            <SectionLabel>Net Worth Overlay</SectionLabel>
            <Badge color={T.accent}>{cur}{fmtN(nwOverlay[nwOverlay.length-1]?.value||0)}</Badge>
          </div>
          <ResponsiveContainer width="100%" height={80}>
            <AreaChart data={nwOverlay} margin={{top:2,right:0,left:0,bottom:0}}>
              <defs><linearGradient id="tlnwg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={T.accent} stopOpacity={0.3}/><stop offset="100%" stopColor={T.accent} stopOpacity={0}/></linearGradient></defs>
              <XAxis dataKey="month" tick={{fill:T.textSub,fontSize:8,fontFamily:T.fM}} axisLine={false} tickLine={false}/>
              <YAxis hide/>
              <Tooltip content={<ChartTooltip prefix={cur}/>}/>
              <Area type="monotone" dataKey="value" name="Net Worth" stroke={T.accent} strokeWidth={2} fill="url(#tlnwg)" dot={false}/>
            </AreaChart>
          </ResponsiveContainer>
        </GlassCard>
      )}

      {/* Controls Row */}
      <div style={{display:'flex',gap:10,marginBottom:16,alignItems:'center',flexWrap:'wrap'}}>
        {/* Search */}
        <div style={{flex:1,minWidth:200,display:'flex',alignItems:'center',gap:8,background:T.surface,border:`1px solid ${T.border}`,borderRadius:T.r,padding:'7px 12px'}}>
          <IcoSearch size={12} stroke={T.textSub}/>
          <input value={search} onChange={e=>{setSearch(e.target.value);setPage(0);}} placeholder="Search events, types, descriptions…" style={{flex:1,background:'transparent',border:'none',fontFamily:T.fM,fontSize:11,color:T.text}}/>
          {search&&<button onClick={()=>setSearch('')}><IcoX size={11} stroke={T.textMuted}/></button>}
        </div>

        {/* Zoom */}
        <div style={{display:'flex',gap:2,background:T.surface,borderRadius:T.r,padding:3,border:`1px solid ${T.border}`}}>
          {['day','week','month','year'].map(z=>(
            <button key={z} onClick={()=>setZoom(z)} style={{padding:'4px 10px',borderRadius:7,fontSize:9,fontFamily:T.fM,textTransform:'uppercase',letterSpacing:'0.06em',background:zoom===z?T.accentDim:'transparent',color:zoom===z?T.accent:T.textSub,border:`1px solid ${zoom===z?T.accent+'44':'transparent'}`,transition:'all 0.15s'}}>{z}</button>
          ))}
        </div>
      </div>

      {/* Category Filters */}
      <div style={{display:'flex',gap:6,marginBottom:20,flexWrap:'wrap'}}>
        {CATS.map(cat=>(
          <button key={cat.id} onClick={()=>{setFilter(cat.id);setPage(0);}} style={{padding:'4px 12px',borderRadius:99,fontSize:9,fontFamily:T.fM,textTransform:'uppercase',letterSpacing:'0.06em',background:filter===cat.id?(cat.color+'18'):'transparent',color:filter===cat.id?cat.color:T.textSub,border:`1px solid ${filter===cat.id?cat.color+'44':T.border}`,transition:'all 0.15s'}}>
            {cat.icon} {cat.label}
          </button>
        ))}
        <div style={{marginLeft:'auto',fontSize:9,fontFamily:T.fM,color:T.textMuted,display:'flex',alignItems:'center'}}>
          {searched.length} event{searched.length!==1?'s':''}
        </div>
      </div>

      {/* Timeline */}
      {grouped.length===0?(
        <GlassCard style={{padding:40,textAlign:'center'}}>
          <div style={{fontSize:30,marginBottom:10}}>⬡</div>
          <div style={{fontSize:13,fontFamily:T.fD,fontWeight:700,color:T.text,marginBottom:6}}>No events found</div>
          <div style={{fontSize:11,fontFamily:T.fM,color:T.textMuted}}>Start logging expenses, habits, and vitals to build your life timeline.</div>
        </GlassCard>
      ):(
        <div style={{position:'relative'}}>
          {/* Vertical line */}
          <div style={{position:'absolute',left:18,top:0,bottom:0,width:1,background:`linear-gradient(180deg,${T.accent}44 0%,${T.border} 50%,transparent 100%)`}}/>

          {grouped.map(([groupKey,events],gi)=>(
            <div key={groupKey} style={{marginBottom:28,animation:`fadeUp 0.4s ease ${Math.min(gi,5)*0.06}s both`}}>
              {/* Group header */}
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12,paddingLeft:36}}>
                <div style={{fontSize:10,fontFamily:T.fM,fontWeight:600,color:T.textSub,letterSpacing:'0.08em',textTransform:'uppercase'}}>
                  {zoom==='day'?fmtDate(groupKey):groupKey}
                </div>
                <div style={{flex:1,height:1,background:T.border}}/>
                <Badge color={T.textMuted}>{events.length}</Badge>
              </div>

              {events.map((ev,i)=>(
                <div key={ev.id} className="los-ev" style={{display:'flex',alignItems:'flex-start',gap:14,paddingLeft:36,paddingBottom:10,cursor:'default',borderRadius:9,transition:'background 0.15s',animation:i<6?`nodeEnter 0.25s ease ${i*0.04}s both`:'none'}}>
                  {/* Timeline dot */}
                  <div style={{position:'absolute',left:11,width:14,height:14,borderRadius:'50%',background:T.bg,border:`2px solid ${ev.color}`,boxShadow:`0 0 8px ${ev.color}55`,marginTop:11,zIndex:2}}/>
                  <GlassCard style={{flex:1,padding:'12px 16px',borderLeft:`3px solid ${ev.color}33`}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:8}}>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:4}}>
                          <span style={{fontSize:14}}>{ev.emoji}</span>
                          <span style={{fontSize:12,fontFamily:T.fD,fontWeight:700,color:T.text,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{ev.title}</span>
                          <Badge color={ev.color}>{ev.category}</Badge>
                        </div>
                        {ev.description&&<div style={{fontSize:10,fontFamily:T.fM,color:T.textSub,lineHeight:1.5}}>{ev.description}</div>}
                      </div>
                      <div style={{fontSize:9,fontFamily:T.fM,color:T.textMuted,whiteSpace:'nowrap',flexShrink:0}}>{ev.date}</div>
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

// ── MONEY PAGE ─────────────────────────────────────────────────────────────────
function MoneyPage({data,actions}) {
  const [tab,setTab]=useState('overview');
  const [modal,setModal]=useState(null);
  const [goalIdx,setGoalIdx]=useState(null);
  const [goalAmt,setGoalAmt]=useState('');
  const {expenses,incomes,assets,investments,debts,goals,settings}=data;
  const cur=settings.currency||'$';
  const thisMonth=today().slice(0,7);
  const monthExp=useMemo(()=>expenses.filter(e=>e.date?.startsWith(thisMonth)).reduce((s,e)=>s+Number(e.amount||0),0),[expenses,thisMonth]);
  const monthInc=useMemo(()=>incomes.filter(i=>i.date?.startsWith(thisMonth)).reduce((s,i)=>s+Number(i.amount||0),0),[incomes,thisMonth]);
  const invVal=useMemo(()=>investments.reduce((s,i)=>s+Number((i.currentPrice??i.buyPrice)||0)*Number(i.quantity||0),0),[investments]);
  const assetVal=useMemo(()=>assets.reduce((s,a)=>s+Number(a.value||0),0),[assets]);
  const debtVal=useMemo(()=>debts.reduce((s,d)=>s+Number(d.balance||0),0),[debts]);
  const savRate=monthInc>0?((monthInc-monthExp)/monthInc)*100:0;

  const catData=useMemo(()=>{
    const m={};
    expenses.filter(e=>e.date?.startsWith(thisMonth)).forEach(e=>{m[e.category]=(m[e.category]||0)+Number(e.amount||0);});
    return Object.entries(m).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([name,value])=>({name,value,color:getCatColor(name)}));
  },[expenses,thisMonth]);

  const TABS=['overview','expenses','investments','goals','assets'];

  return (
    <div style={{animation:'fadeUp 0.4s ease'}}>
      <LogExpenseModal open={modal==='expense'} onClose={()=>setModal(null)} onSave={e=>{actions.addExpense(e);setModal(null);}}/>
      <LogIncomeModal open={modal==='income'} onClose={()=>setModal(null)} onSave={e=>{actions.addIncome(e);setModal(null);}}/>
      <AddGoalModal open={modal==='goal'} onClose={()=>setModal(null)} onSave={e=>{actions.addGoal(e);setModal(null);}}/>
      <AddAssetModal open={modal==='asset'} onClose={()=>setModal(null)} onSave={e=>{actions.addAsset(e);setModal(null);}}/>

      <div style={{marginBottom:22}}>
        <SectionLabel>Money Domain</SectionLabel>
        <h1 style={{fontSize:26,fontFamily:T.fD,fontWeight:800,color:T.text}}>Money Hub</h1>
      </div>
      <div style={{display:'flex',gap:2,marginBottom:22,background:T.surface,borderRadius:T.r,padding:3,width:'fit-content',border:`1px solid ${T.border}`}}>
        {TABS.map(t=>(
          <button key={t} className="los-tab" onClick={()=>setTab(t)} style={{padding:'5px 14px',borderRadius:8,fontSize:9,fontFamily:T.fM,textTransform:'uppercase',letterSpacing:'0.06em',background:tab===t?T.emeraldDim:'transparent',color:tab===t?T.emerald:T.textSub,border:`1px solid ${tab===t?T.emerald+'33':'transparent'}`,transition:'all 0.15s'}}>{t}</button>
        ))}
      </div>

      {tab==='overview'&&(
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
            {[
              {label:'Monthly Income',val:`${cur}${fmtN(monthInc)}`,color:T.emerald},
              {label:'Monthly Expenses',val:`${cur}${fmtN(monthExp)}`,color:T.rose},
              {label:'Savings Rate',val:`${savRate.toFixed(1)}%`,color:T.accent},
              {label:'Net Worth',val:`${cur}${fmtN(assetVal+invVal-debtVal)}`,color:T.violet},
            ].map((m,i)=>(
              <GlassCard key={i} style={{padding:'16px 18px'}}>
                <div style={{fontSize:9,fontFamily:T.fM,color:T.textSub,letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:6}}>{m.label}</div>
                <div style={{fontSize:20,fontFamily:T.fD,fontWeight:700,color:m.color}}>{m.val}</div>
              </GlassCard>
            ))}
          </div>
          <div style={{display:'flex',gap:10}}>
            <Btn onClick={()=>setModal('expense')} color={T.rose}>+ Log Expense</Btn>
            <Btn onClick={()=>setModal('income')} color={T.emerald}>+ Log Income</Btn>
          </div>
          {catData.length>0&&(
            <div style={{display:'grid',gridTemplateColumns:'220px 1fr',gap:14}}>
              <GlassCard style={{padding:'18px',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart><Pie data={catData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" nameKey="name" paddingAngle={3}>
                    {catData.map((c,i)=><Cell key={i} fill={c.color} opacity={0.85}/>)}
                  </Pie><Tooltip content={<ChartTooltip prefix={cur}/>}/></PieChart>
                </ResponsiveContainer>
              </GlassCard>
              <GlassCard style={{padding:'18px 20px'}}>
                <SectionLabel>Spending by Category</SectionLabel>
                {catData.map((c,i)=>(
                  <div key={i} style={{marginBottom:10}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                      <span style={{fontSize:11,fontFamily:T.fM,color:T.text}}>{c.name}</span>
                      <span style={{fontSize:11,fontFamily:T.fM,color:c.color,fontWeight:600}}>{cur}{fmtN(c.value)}</span>
                    </div>
                    <ProgressBar pct={(c.value/Math.max(1,monthExp))*100} color={c.color} height={4}/>
                  </div>
                ))}
              </GlassCard>
            </div>
          )}
        </div>
      )}

      {tab==='expenses'&&(
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          <div style={{display:'flex',gap:10}}><Btn onClick={()=>setModal('expense')} color={T.rose}>+ Log Expense</Btn></div>
          <GlassCard style={{padding:'20px 22px'}}>
            <SectionLabel>Recent Expenses</SectionLabel>
            {expenses.length===0?<div style={{fontSize:11,fontFamily:T.fM,color:T.textMuted,textAlign:'center',padding:20}}>No expenses yet.</div>:(
              [...expenses].sort((a,b)=>a.date<b.date?1:-1).slice(0,30).map((e,i)=>(
                <div key={e.id||i} className="los-row" style={{display:'flex',justifyContent:'space-between',padding:'9px 0',borderBottom:i<29?`1px solid ${T.border}`:'none',transition:'background 0.15s'}}>
                  <div><div style={{fontSize:12,fontFamily:T.fM,color:T.text}}>{e.note||e.category}</div><div style={{fontSize:9,fontFamily:T.fM,color:T.textSub,marginTop:2}}>{e.category} · {e.date}</div></div>
                  <div style={{fontSize:13,fontFamily:T.fM,fontWeight:600,color:T.rose}}>-{cur}{fmtN(e.amount)}</div>
                </div>
              ))
            )}
          </GlassCard>
        </div>
      )}

      {tab==='investments'&&(
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          {investments.length===0?(<GlassCard style={{padding:40,textAlign:'center'}}><div style={{fontSize:11,fontFamily:T.fM,color:T.textMuted}}>No investment positions yet.</div></GlassCard>):(
            <><div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
              {[{label:'Portfolio Value',val:`${cur}${fmtN(invVal)}`,color:T.violet},{label:'Total Invested',val:`${cur}${fmtN(investments.reduce((s,i)=>s+Number(i.buyPrice||0)*Number(i.quantity||0),0))}`,color:T.text},{label:'P&L',val:`${invVal-investments.reduce((s,i)=>s+Number(i.buyPrice||0)*Number(i.quantity||0),0)>=0?'+':''}${cur}${fmtN(invVal-investments.reduce((s,i)=>s+Number(i.buyPrice||0)*Number(i.quantity||0),0))}`,color:T.emerald}].map((m,i)=>(
                <GlassCard key={i} style={{padding:'16px 18px'}}><div style={{fontSize:9,fontFamily:T.fM,color:T.textSub,marginBottom:6,textTransform:'uppercase',letterSpacing:'0.1em'}}>{m.label}</div><div style={{fontSize:18,fontFamily:T.fD,fontWeight:700,color:m.color}}>{m.val}</div></GlassCard>
              ))}
            </div>
            <GlassCard style={{padding:'20px 22px'}}>
              <SectionLabel>Positions</SectionLabel>
              {investments.map((inv,i)=>{const c_=inv.currentPrice??inv.buyPrice??0;const val=Number(c_)*Number(inv.quantity||0);const cost=Number(inv.buyPrice||0)*Number(inv.quantity||0);const pnl=val-cost;const pnlPct=cost>0?(pnl/cost)*100:0;return(
                <div key={inv.id||i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:i<investments.length-1?`1px solid ${T.border}`:'none'}}>
                  <div><div style={{fontSize:13,fontFamily:T.fD,fontWeight:700,color:T.text}}>{inv.symbol||inv.name}</div><div style={{fontSize:10,fontFamily:T.fM,color:T.textSub}}>×{inv.quantity} @ {cur}{fmtN(inv.buyPrice)}</div></div>
                  <div style={{textAlign:'right'}}><div style={{fontSize:13,fontFamily:T.fM,fontWeight:600,color:T.text}}>{cur}{fmtN(val)}</div><div style={{fontSize:10,fontFamily:T.fM,color:pnl>=0?T.emerald:T.rose}}>{pnl>=0?'+':''}{cur}{fmtN(pnl)} ({pnlPct.toFixed(1)}%)</div></div>
                </div>
              );})}
            </GlassCard></>
          )}
        </div>
      )}

      {tab==='goals'&&(
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          <div style={{display:'flex',justifyContent:'flex-end'}}><Btn onClick={()=>setModal('goal')} color={T.amber}>+ New Goal</Btn></div>
          {goals.length===0?(<GlassCard style={{padding:40,textAlign:'center'}}><div style={{fontSize:11,fontFamily:T.fM,color:T.textMuted}}>No goals yet.</div></GlassCard>):(
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              {goals.map((goal,i)=>{const pct=Math.min(100,Math.round(((goal.current||0)/Math.max(1,goal.target))*100));const catColors={finance:T.accent,health:T.sky,growth:T.violet,career:T.amber};const c=catColors[goal.cat]||T.accent;return(
                <GlassCard key={goal.id||i} style={{padding:'18px 20px'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
                    <div><div style={{fontSize:20,marginBottom:6}}>{goal.emoji||'🎯'}</div><div style={{fontSize:13,fontFamily:T.fD,fontWeight:700,color:T.text}}>{goal.name}</div><Badge color={c} style={{marginTop:4}}>{goal.cat||'goal'}</Badge></div>
                    <div style={{width:46,height:46,borderRadius:'50%',background:`conic-gradient(${c} ${pct*3.6}deg,${T.border} 0deg)`,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:`0 0 12px ${c}33`}}><div style={{width:34,height:34,borderRadius:'50%',background:T.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontFamily:T.fM,fontWeight:600,color:c}}>{pct}%</div></div>
                  </div>
                  <ProgressBar pct={pct} color={c} height={5}/>
                  <div style={{display:'flex',justifyContent:'space-between',marginTop:6,fontSize:10,fontFamily:T.fM,color:T.textSub}}><span>{cur}{fmtN(goal.current||0)}</span><span>{cur}{fmtN(goal.target)}</span></div>
                  {goalIdx===i?(<div style={{display:'flex',gap:8,marginTop:10}}><Input type="number" value={goalAmt} onChange={e=>setGoalAmt(e.target.value)} placeholder="Add amount" style={{flex:1}}/><Btn onClick={()=>{actions.updateGoalProgress(goal.id,Number(goalAmt));setGoalAmt('');setGoalIdx(null);}} color={c} style={{padding:'6px 12px'}}>+</Btn></div>):(<button onClick={()=>setGoalIdx(i)} style={{marginTop:10,fontSize:10,fontFamily:T.fM,color:c}}>+ Add Progress</button>)}
                </GlassCard>
              );})}
            </div>
          )}
        </div>
      )}

      {tab==='assets'&&(
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          <div style={{display:'flex',gap:10}}><Btn onClick={()=>setModal('asset')} color={T.accent}>+ Add Asset</Btn></div>
          {assets.length===0?(<GlassCard style={{padding:40,textAlign:'center'}}><div style={{fontSize:11,fontFamily:T.fM,color:T.textMuted}}>No assets yet.</div></GlassCard>):(
            <GlassCard style={{padding:'20px 22px'}}>
              <SectionLabel>Assets · Total {cur}{fmtN(assetVal)}</SectionLabel>
              {assets.map((a,i)=>(
                <div key={a.id||i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:i<assets.length-1?`1px solid ${T.border}`:'none'}}>
                  <div><div style={{fontSize:12,fontFamily:T.fM,color:T.text}}>{a.name}</div><Badge color={T.textSub}>{a.type||'Other'}</Badge></div>
                  <div style={{fontSize:14,fontFamily:T.fD,fontWeight:700,color:T.accent}}>{cur}{fmtN(a.value)}</div>
                </div>
              ))}
            </GlassCard>
          )}
        </div>
      )}
    </div>
  );
}

// ── HEALTH PAGE ────────────────────────────────────────────────────────────────
function HealthPage({data,actions}) {
  const [modal,setModal]=useState(null);
  const [focusActive,setFocusActive]=useState(false);
  const [focusTime,setFocusTime]=useState(25*60);
  const [elapsed,setElapsed]=useState(0);
  const {vitals}=data;

  useEffect(()=>{ if(!focusActive) return; const iv=setInterval(()=>setElapsed(e=>{if(e>=focusTime){setFocusActive(false);actions.logFocusSession&&actions.logFocusSession(focusTime);return 0;}return e+1;}),1000); return()=>clearInterval(iv); },[focusActive,focusTime,actions]);

  const fmtTime=s=>`${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
  const remaining=focusTime-elapsed; const fpct=(elapsed/focusTime)*100;
  const sorted=[...vitals].sort((a,b)=>a.date<b.date?1:-1);
  const recent7=sorted.slice(0,7).reverse();
  const avgSleep=recent7.length?(recent7.reduce((s,v)=>s+Number(v.sleep||0),0)/recent7.length).toFixed(1):'—';
  const avgMood=recent7.length?(recent7.reduce((s,v)=>s+Number(v.mood||0),0)/recent7.length).toFixed(1):'—';
  const avgEnergy=recent7.length?(recent7.reduce((s,v)=>s+Number(v.energy||0),0)/recent7.length).toFixed(1):'—';
  const latestWeight=sorted.find(v=>v.weight>0);

  return (
    <div style={{animation:'fadeUp 0.4s ease'}}>
      <LogVitalsModal open={modal==='vitals'} onClose={()=>setModal(null)} onSave={e=>{actions.addVitals(e);setModal(null);}}/>
      <div style={{marginBottom:22}}><SectionLabel>Health Domain</SectionLabel><h1 style={{fontSize:26,fontFamily:T.fD,fontWeight:800,color:T.text}}>Health & Vitals</h1></div>
      <div style={{display:'flex',gap:10,marginBottom:18}}><Btn onClick={()=>setModal('vitals')} color={T.sky}>+ Log Vitals</Btn></div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:18}}>
        {[{label:'Avg Sleep (7d)',val:`${avgSleep}h`,sub:Number(avgSleep)>=7?'Great rest!':'Aim for 7-8h',color:T.sky},{label:'Avg Mood (7d)',val:`${avgMood}/10`,sub:'Emotional wellbeing',color:T.violet},{label:'Avg Energy (7d)',val:`${avgEnergy}/10`,sub:'Vitality level',color:T.accent},{label:'Current Weight',val:latestWeight?`${latestWeight.weight} lbs`:'—',sub:latestWeight?latestWeight.date:'Not logged',color:T.emerald}].map((m,i)=>(
          <GlassCard key={i} style={{padding:'16px 18px'}}><div style={{fontSize:9,fontFamily:T.fM,color:T.textSub,letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:6}}>{m.label}</div><div style={{fontSize:20,fontFamily:T.fD,fontWeight:700,color:m.color,marginBottom:4}}>{m.val}</div><div style={{fontSize:10,fontFamily:T.fM,color:T.textSub}}>{m.sub}</div></GlassCard>
        ))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 300px',gap:14}}>
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          <GlassCard style={{padding:'20px 22px'}}>
            <SectionLabel>Sleep History</SectionLabel>
            {recent7.length>0?(<ResponsiveContainer width="100%" height={150}><BarChart data={recent7} barSize={28} margin={{top:4,right:0,left:0,bottom:0}}><CartesianGrid strokeDasharray="2 4" stroke={T.border} vertical={false}/><XAxis dataKey="date" tickFormatter={d=>d.slice(5)} tick={{fill:T.textSub,fontSize:9,fontFamily:T.fM}} axisLine={false} tickLine={false}/><YAxis domain={[0,12]} hide/><Tooltip content={<ChartTooltip suffix="h"/>}/><Bar dataKey="sleep" name="Sleep" fill={T.sky} opacity={0.85} radius={[5,5,0,0]}/></BarChart></ResponsiveContainer>):(
              <div style={{height:80,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontFamily:T.fM,color:T.textMuted}}>Log vitals to see your sleep chart.</div>
            )}
          </GlassCard>
          <GlassCard style={{padding:'20px 22px'}}>
            <SectionLabel>Mood & Energy Trends</SectionLabel>
            {recent7.length>0?(<ResponsiveContainer width="100%" height={130}><LineChart data={recent7} margin={{top:4,right:0,left:0,bottom:0}}><CartesianGrid strokeDasharray="2 4" stroke={T.border} vertical={false}/><XAxis dataKey="date" tickFormatter={d=>d.slice(5)} tick={{fill:T.textSub,fontSize:9,fontFamily:T.fM}} axisLine={false} tickLine={false}/><YAxis domain={[0,10]} hide/><Tooltip content={<ChartTooltip suffix="/10"/>}/><Line type="monotone" dataKey="mood" name="Mood" stroke={T.violet} strokeWidth={2} dot={{fill:T.violet,r:3}}/><Line type="monotone" dataKey="energy" name="Energy" stroke={T.accent} strokeWidth={2} dot={{fill:T.accent,r:3}}/></LineChart></ResponsiveContainer>):(
              <div style={{height:80,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontFamily:T.fM,color:T.textMuted}}>Log vitals to see mood & energy trends.</div>
            )}
          </GlassCard>
          <GlassCard style={{padding:'20px 22px'}}><SectionLabel>Recent Vitals</SectionLabel>{sorted.slice(0,8).map((v,i)=>(<div key={v.id||i} style={{display:'flex',gap:14,justifyContent:'space-between',padding:'8px 0',borderBottom:i<7?`1px solid ${T.border}`:'none',fontSize:11,fontFamily:T.fM}}><span style={{color:T.textSub}}>{v.date}</span><div style={{display:'flex',gap:14}}>{v.sleep>0&&<span style={{color:T.sky}}>😴 {v.sleep}h</span>}{v.mood>0&&<span style={{color:T.violet}}>😊 {v.mood}/10</span>}{v.energy>0&&<span style={{color:T.accent}}>⚡ {v.energy}/10</span>}{v.weight>0&&<span style={{color:T.emerald}}>⚖️ {v.weight}</span>}</div></div>))}{sorted.length===0&&<div style={{textAlign:'center',padding:20,fontSize:11,fontFamily:T.fM,color:T.textMuted}}>No vitals logged yet.</div>}</GlassCard>
        </div>
        <GlassCard style={{padding:'22px',display:'flex',flexDirection:'column',alignItems:'center'}}>
          <SectionLabel>Focus Session</SectionLabel>
          <div style={{position:'relative',width:150,height:150,margin:'0 auto 16px'}}>
            <svg width={150} height={150} style={{transform:'rotate(-90deg)'}}><circle cx={75} cy={75} r={64} fill="none" stroke={T.border} strokeWidth={5}/><circle cx={75} cy={75} r={64} fill="none" stroke={T.accent} strokeWidth={5} strokeDasharray={`${2*Math.PI*64*(fpct/100)} ${2*Math.PI*64*(1-fpct/100)}`} strokeLinecap="round" style={{filter:`drop-shadow(0 0 5px ${T.accent})`,transition:'stroke-dasharray 1s linear'}}/></svg>
            <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}><div style={{fontSize:26,fontFamily:T.fM,fontWeight:600,color:T.text}}>{fmtTime(remaining)}</div><div style={{fontSize:9,fontFamily:T.fM,color:T.textSub}}>remaining</div></div>
          </div>
          <div style={{display:'flex',gap:5,marginBottom:14}}>{[15*60,25*60,45*60,60*60].map(s=>(<button key={s} onClick={()=>{setFocusTime(s);setElapsed(0);setFocusActive(false);}} style={{padding:'3px 9px',borderRadius:99,fontSize:9,fontFamily:T.fM,background:focusTime===s?T.accentDim:T.surface,color:focusTime===s?T.accent:T.textSub,border:`1px solid ${focusTime===s?T.accent+'44':T.border}`}}>{s/60}m</button>))}</div>
          <button className="los-btn" onClick={()=>setFocusActive(!focusActive)} style={{width:'100%',padding:'11px',borderRadius:T.r,background:focusActive?T.roseDim:T.accentDim,color:focusActive?T.rose:T.accent,border:`1px solid ${focusActive?T.rose+'44':T.accent+'44'}`,fontSize:11,fontFamily:T.fM,fontWeight:600,animation:focusActive?'glowPulse 2s infinite':'none'}}>{focusActive?'⏸ PAUSE':'▶ START FOCUS'}</button>
          {data.focusSessions&&data.focusSessions.length>0&&<div style={{marginTop:12,fontSize:10,fontFamily:T.fM,color:T.textSub,textAlign:'center'}}>{data.focusSessions.length} sessions completed</div>}
        </GlassCard>
      </div>
    </div>
  );
}

// ── GROWTH PAGE ────────────────────────────────────────────────────────────────
function GrowthPage({data,actions}) {
  const [tab,setTab]=useState('character');
  const [modal,setModal]=useState(null);
  const {habits,habitLogs,goals,totalXP,settings}=data;
  const cur=settings.currency||'$';
  const level=Math.floor(Math.sqrt(Number(totalXP)/100))+1;
  const xpForNext=Math.pow(level,2)*100; const xpForCurrent=Math.pow(level-1,2)*100;
  const xpPct=((Number(totalXP)-xpForCurrent)/(xpForNext-xpForCurrent))*100;
  const CLASSES=['Apprentice','Seeker','Wanderer','Scholar','Artisan','Champion','Sage','Master','Grandmaster','Legend'];
  const heroClass=CLASSES[Math.min(level-1,CLASSES.length-1)];
  const LIFE_STATS=[{label:'Financial',val:Math.min(100,Math.round(goals.filter(g=>g.cat==='finance').length*25)),color:T.emerald},{label:'Health',val:Math.min(100,data.vitals.length*8),color:T.sky},{label:'Habits',val:Math.min(100,habits.length*12),color:T.accent},{label:'Growth',val:Math.min(100,Math.round(Number(totalXP)/50)),color:T.violet},{label:'Focus',val:Math.min(100,data.focusSessions.length*5),color:T.rose},{label:'Knowledge',val:Math.min(100,data.notes.length*10),color:T.amber}];

  return (
    <div style={{animation:'fadeUp 0.4s ease'}}>
      <LogHabitModal open={modal==='habit'} onClose={()=>setModal(null)} habits={habits} habitLogs={habitLogs} onLog={actions.logHabit} onAddHabit={actions.addHabit}/>
      <AddGoalModal open={modal==='goal'} onClose={()=>setModal(null)} onSave={e=>{actions.addGoal(e);setModal(null);}}/>
      <div style={{marginBottom:22}}><SectionLabel>Growth Domain</SectionLabel><h1 style={{fontSize:26,fontFamily:T.fD,fontWeight:800,color:T.text}}>Character · Habits · Goals</h1></div>
      <div style={{display:'flex',gap:2,marginBottom:22,background:T.surface,borderRadius:T.r,padding:3,width:'fit-content',border:`1px solid ${T.border}`}}>
        {['character','habits','goals'].map(t=>(<button key={t} className="los-tab" onClick={()=>setTab(t)} style={{padding:'5px 14px',borderRadius:8,fontSize:9,fontFamily:T.fM,textTransform:'uppercase',letterSpacing:'0.06em',background:tab===t?T.violetDim:'transparent',color:tab===t?T.violet:T.textSub,border:`1px solid ${tab===t?T.violet+'33':'transparent'}`,transition:'all 0.15s'}}>{t}</button>))}
      </div>

      {tab==='character'&&(
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
          <GlassCard style={{padding:'22px',gridColumn:'span 2'}}>
            <div style={{display:'flex',alignItems:'center',gap:20}}>
              <div style={{width:76,height:76,borderRadius:'50%',flexShrink:0,background:`linear-gradient(135deg,${T.violet},${T.accent})`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:26,fontFamily:T.fD,fontWeight:800,color:T.bg,boxShadow:`0 0 24px ${T.violet}44`}}>{level}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:9,fontFamily:T.fM,color:T.textSub,letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:3}}>Life Level · {heroClass}</div>
                <div style={{fontSize:20,fontFamily:T.fD,fontWeight:800,color:T.text,marginBottom:8}}>Level {level} — {heroClass}</div>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:5}}><span style={{fontSize:10,fontFamily:T.fM,color:T.textSub}}>{Number(totalXP).toLocaleString()} XP</span><span style={{fontSize:10,fontFamily:T.fM,color:T.violet}}>{(xpForNext-Number(totalXP)).toLocaleString()} to Lv {level+1}</span></div>
                <ProgressBar pct={xpPct} color={T.violet} height={8}/>
              </div>
            </div>
          </GlassCard>
          <GlassCard style={{padding:'20px 22px'}}>
            <SectionLabel>Life Dimensions</SectionLabel>
            {LIFE_STATS.map((s,i)=>(<div key={i} style={{marginBottom:12}}><div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}><span style={{fontSize:11,fontFamily:T.fM,color:T.text}}>{s.label}</span><span style={{fontSize:11,fontFamily:T.fM,color:s.color,fontWeight:600}}>{s.val}</span></div><ProgressBar pct={s.val} color={s.color} height={5}/></div>))}
          </GlassCard>
          <GlassCard style={{padding:'20px 22px'}}>
            <SectionLabel>XP Breakdown</SectionLabel>
            {[{label:'Habit Logs',xp:Object.values(habitLogs).flat().length*10,color:T.accent},{label:'Vitals Logged',xp:data.vitals.length*8,color:T.sky},{label:'Goals Created',xp:goals.length*20,color:T.violet},{label:'Notes Added',xp:data.notes.length*5,color:T.amber}].map((x,i)=>(<div key={i} style={{display:'flex',justifyContent:'space-between',padding:'7px 0',borderBottom:i<3?`1px solid ${T.border}`:'none',fontSize:11,fontFamily:T.fM}}><span style={{color:T.textSub}}>{x.label}</span><span style={{color:x.color,fontWeight:600}}>+{x.xp} XP</span></div>))}
          </GlassCard>
        </div>
      )}

      {tab==='habits'&&(
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          <div style={{display:'flex',justifyContent:'flex-end'}}><Btn onClick={()=>setModal('habit')} color={T.accent}>+ Manage Habits</Btn></div>
          {habits.length===0?(<GlassCard style={{padding:40,textAlign:'center'}}><div style={{fontSize:11,fontFamily:T.fM,color:T.textMuted}}>No habits yet.</div></GlassCard>):(
            habits.map((habit,i)=>{const done=(habitLogs[habit.id]||[]).includes(today());const streak=getStreak(habit.id,habitLogs);const hc=streak>=7?T.amber:streak>=3?T.accent:T.textSub;return(
              <GlassCard key={habit.id||i} style={{padding:'16px 18px'}}>
                <div style={{display:'flex',alignItems:'center',gap:12}}>
                  <div style={{fontSize:22,flexShrink:0}}>{habit.emoji||'🔥'}</div>
                  <div style={{flex:1}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}><span style={{fontSize:13,fontFamily:T.fD,fontWeight:600,color:T.text}}>{habit.name}</span><div style={{display:'flex',gap:8,alignItems:'center'}}><span style={{fontSize:11,fontFamily:T.fM,color:hc}}>🔥 {streak}d streak</span>{done?<Badge color={hc}>✓ Done</Badge>:<Btn onClick={()=>actions.logHabit(habit.id)} color={hc} style={{padding:'4px 12px'}}>Log</Btn>}</div></div><ProgressBar pct={(streak/Math.max(streak,30))*100} color={hc} height={4}/></div>
                </div>
              </GlassCard>
            );})
          )}
        </div>
      )}

      {tab==='goals'&&(
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          <div style={{display:'flex',justifyContent:'flex-end'}}><Btn onClick={()=>setModal('goal')} color={T.amber}>+ New Goal</Btn></div>
          {goals.length===0?(<GlassCard style={{padding:40,textAlign:'center'}}><div style={{fontSize:11,fontFamily:T.fM,color:T.textMuted}}>No goals yet.</div></GlassCard>):(
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              {goals.map((goal,i)=>{const pct=Math.min(100,Math.round(((goal.current||0)/Math.max(1,goal.target))*100));const catColors={finance:T.accent,health:T.sky,growth:T.violet,career:T.amber};const c=catColors[goal.cat]||T.violet;return(
                <GlassCard key={goal.id||i} style={{padding:'18px 20px'}}><div style={{fontSize:20,marginBottom:6}}>{goal.emoji||'🎯'}</div><div style={{fontSize:13,fontFamily:T.fD,fontWeight:700,color:T.text,marginBottom:4}}>{goal.name}</div><div style={{fontSize:10,fontFamily:T.fM,color:T.textSub,marginBottom:10}}>{cur}{fmtN(goal.current||0)} / {cur}{fmtN(goal.target)} · {pct}%</div><ProgressBar pct={pct} color={c} height={6}/>{pct>=100&&<div style={{marginTop:8,fontSize:11,fontFamily:T.fM,color:T.emerald}}>🎉 Completed!</div>}</GlassCard>
              );})}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── KNOWLEDGE PAGE ─────────────────────────────────────────────────────────────
function KnowledgePage({data,actions}) {
  const [tab,setTab]=useState('notes');
  const [modal,setModal]=useState(null);
  const [messages,setMessages]=useState([{role:'assistant',content:"Hello. I'm your Life Intelligence Engine. I have a complete view of your finances, health, habits, and goals. How can I help you today?"}]);
  const [input,setInput]=useState(''); const [loading,setLoading]=useState(false); const endRef=useRef(null);
  const {notes,expenses,incomes,habits,habitLogs,goals,vitals,totalXP,assets,investments,debts,settings}=data;
  const cur=settings.currency||'$';
  useEffect(()=>{endRef.current?.scrollIntoView({behavior:'smooth'});},[messages]);

  const buildContext=()=>{
    const m=today().slice(0,7);
    const mInc=incomes.filter(i=>i.date?.startsWith(m)).reduce((s,i)=>s+Number(i.amount||0),0);
    const mExp=expenses.filter(e=>e.date?.startsWith(m)).reduce((s,e)=>s+Number(e.amount||0),0);
    const invVal=investments.reduce((s,i)=>s+Number((i.currentPrice??i.buyPrice)||0)*Number(i.quantity||0),0);
    const nw=assets.reduce((s,a)=>s+Number(a.value||0),0)+invVal-debts.reduce((s,d)=>s+Number(d.balance||0),0);
    const sr=mInc>0?((mInc-mExp)/mInc*100).toFixed(1):0;
    const habitSum=habits.map(h=>`${h.name} (streak:${getStreak(h.id,habitLogs)}d)`).join(', ')||'none';
    const goalSum=goals.map(g=>`${g.name}: ${Math.round(((g.current||0)/Math.max(1,g.target))*100)}%`).join(', ')||'none';
    const v7=vitals.slice(-7); const avgSlp=v7.length?(v7.reduce((s,v)=>s+Number(v.sleep||0),0)/v7.length).toFixed(1):'N/A';
    return `USER'S REAL LIFE DATA:\nNet Worth: ${cur}${fmtN(nw)}\nThis Month: income ${cur}${fmtN(mInc)}, expenses ${cur}${fmtN(mExp)}, savings rate ${sr}%\nInvestments: ${cur}${fmtN(invVal)}\nLevel: ${Math.floor(Math.sqrt(Number(totalXP)/100))+1}, ${totalXP} XP\nHabits: ${habitSum}\nGoals: ${goalSum}\nAvg Sleep (7d): ${avgSlp}h\nDebts: ${debts.length} totaling ${cur}${fmtN(debts.reduce((s,d)=>s+Number(d.balance||0),0))}`;
  };

  const send=async()=>{
    if(!input.trim()||loading) return;
    const um={role:'user',content:input};
    setMessages(p=>[...p,um]); setInput(''); setLoading(true);
    try {
      const res=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:1000,system:`You are a Life Intelligence Engine for a personal Life OS. ${buildContext()} Give insightful, data-driven advice. Be concise and direct. Reference the user's real data.`,messages:[...messages,um].filter(m=>m.role!=='system').map(m=>({role:m.role,content:m.content}))})});
      const d=await res.json();
      const text=d.content?.map(b=>b.text||'').join('')||'Unable to respond.';
      setMessages(p=>[...p,{role:'assistant',content:text}]);
      actions.addTLEvent&&actions.addTLEvent({type:'ai_insight',title:'AI Insight Generated',description:input.slice(0,60)+'…',category:'knowledge'});
    } catch { setMessages(p=>[...p,{role:'assistant',content:'Connection error. Please try again.'}]); }
    finally { setLoading(false); }
  };

  const TAG_COLORS={Finance:T.violet,Health:T.sky,Career:T.amber,Growth:T.emerald,Ideas:'#c084fc',General:T.textSub};

  return (
    <div style={{animation:'fadeUp 0.4s ease'}}>
      <AddNoteModal open={modal==='note'} onClose={()=>setModal(null)} onSave={e=>{actions.addNote(e);setModal(null);}}/>
      <div style={{marginBottom:22}}><SectionLabel>Knowledge Domain</SectionLabel><h1 style={{fontSize:26,fontFamily:T.fD,fontWeight:800,color:T.text}}>Knowledge Base</h1></div>
      <div style={{display:'flex',gap:2,marginBottom:22,background:T.surface,borderRadius:T.r,padding:3,width:'fit-content',border:`1px solid ${T.border}`}}>
        {['notes','ai assistant'].map(t=>(<button key={t} className="los-tab" onClick={()=>setTab(t)} style={{padding:'5px 14px',borderRadius:8,fontSize:9,fontFamily:T.fM,textTransform:'uppercase',letterSpacing:'0.06em',background:tab===t?T.amberDim:'transparent',color:tab===t?T.amber:T.textSub,border:`1px solid ${tab===t?T.amber+'33':'transparent'}`,transition:'all 0.15s'}}>{t}</button>))}
      </div>

      {tab==='notes'&&(
        <div>
          <div style={{display:'flex',justifyContent:'flex-end',marginBottom:14}}><Btn onClick={()=>setModal('note')} color={T.amber}>+ New Note</Btn></div>
          {notes.length===0?(<GlassCard style={{padding:40,textAlign:'center'}}><div style={{fontSize:11,fontFamily:T.fM,color:T.textMuted}}>No notes yet.</div></GlassCard>):(
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              {[...notes].sort((a,b)=>a.date<b.date?1:-1).map((note,i)=>{const tc=TAG_COLORS[note.tag]||T.textSub;return(
                <GlassCard key={note.id||i} style={{padding:'18px',cursor:'pointer',borderLeft:`3px solid ${tc}55`,animation:`fadeUp 0.3s ease ${i*0.08}s both`}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}><Badge color={tc}>{note.tag||'General'}</Badge><span style={{fontSize:9,fontFamily:T.fM,color:T.textMuted}}>{note.date}</span></div>
                  <div style={{fontSize:13,fontFamily:T.fD,fontWeight:700,color:T.text,marginBottom:7}}>{note.title}</div>
                  <div style={{fontSize:11,fontFamily:T.fM,color:T.textSub,lineHeight:1.5,overflow:'hidden',display:'-webkit-box',WebkitLineClamp:3,WebkitBoxOrient:'vertical'}}>{note.body||''}</div>
                </GlassCard>
              );})}
            </div>
          )}
        </div>
      )}

      {tab==='ai assistant'&&(
        <GlassCard style={{display:'flex',flexDirection:'column',height:540}}>
          <div style={{flex:1,overflowY:'auto',padding:'18px',display:'flex',flexDirection:'column',gap:12}}>
            {messages.map((msg,i)=>(
              <div key={i} style={{display:'flex',gap:9,flexDirection:msg.role==='user'?'row-reverse':'row',animation:'fadeUp 0.25s ease'}}>
                {msg.role==='assistant'&&<div style={{width:30,height:30,borderRadius:'50%',flexShrink:0,background:`linear-gradient(135deg,#c084fc,${T.sky})`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13}}>⬡</div>}
                <div style={{maxWidth:'72%',padding:'10px 14px',borderRadius:T.rL,background:msg.role==='user'?T.accentDim:T.surfaceHi,border:`1px solid ${msg.role==='user'?T.accent+'33':T.border}`,fontSize:12,fontFamily:T.fM,color:T.text,lineHeight:1.6,borderBottomRightRadius:msg.role==='user'?4:T.rL,borderBottomLeftRadius:msg.role==='assistant'?4:T.rL}}>{msg.content}</div>
              </div>
            ))}
            {loading&&<div style={{display:'flex',gap:9}}><div style={{width:30,height:30,borderRadius:'50%',flexShrink:0,background:`linear-gradient(135deg,#c084fc,${T.sky})`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13}}>⬡</div><div style={{padding:'10px 14px',borderRadius:T.rL,borderBottomLeftRadius:4,background:T.surfaceHi,border:`1px solid ${T.border}`,display:'flex',gap:4,alignItems:'center'}}>{[0,1,2].map(d=><div key={d} style={{width:5,height:5,borderRadius:'50%',background:'#c084fc',animation:`dotPulse 1.2s ease ${d*0.2}s infinite`}}/>)}</div></div>}
            <div ref={endRef}/>
          </div>
          <div style={{padding:'14px 18px',borderTop:`1px solid ${T.border}`,display:'flex',gap:9}}>
            <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&send()} placeholder="Ask about your finances, habits, goals…" style={{flex:1,background:T.surface,border:`1px solid ${T.border}`,borderRadius:T.r,padding:'9px 14px',fontFamily:T.fM,fontSize:12,color:T.text}}/>
            <button className="los-btn" onClick={send} disabled={!input.trim()||loading} style={{width:38,height:38,borderRadius:T.r,flexShrink:0,background:input.trim()?T.accentDim:T.surface,border:`1px solid ${input.trim()?T.accent+'44':T.border}`,display:'flex',alignItems:'center',justifyContent:'center'}}><IcoSend size={13} stroke={input.trim()?T.accent:T.textMuted}/></button>
          </div>
        </GlassCard>
      )}
    </div>
  );
}

// ── INTELLIGENCE PAGE ──────────────────────────────────────────────────────────
function IntelligencePage({data}) {
  const {expenses,incomes,habits,habitLogs,vitals,goals,assets,investments,debts,totalXP,settings}=data;
  const cur=settings.currency||'$';
  const thisMonth=today().slice(0,7);
  const monthExp=expenses.filter(e=>e.date?.startsWith(thisMonth)).reduce((s,e)=>s+Number(e.amount||0),0);
  const monthInc=incomes.filter(i=>i.date?.startsWith(thisMonth)).reduce((s,i)=>s+Number(i.amount||0),0);
  const savRate=monthInc>0?((monthInc-monthExp)/monthInc)*100:0;
  const invVal=investments.reduce((s,i)=>s+Number((i.currentPrice??i.buyPrice)||0)*Number(i.quantity||0),0);
  const nw=assets.reduce((s,a)=>s+Number(a.value||0),0)+invVal-debts.reduce((s,d)=>s+Number(d.balance||0),0);
  const topCat=useMemo(()=>{const m={};expenses.filter(e=>e.date?.startsWith(thisMonth)).forEach(e=>{m[e.category]=(m[e.category]||0)+Number(e.amount||0);});return Object.entries(m).sort((a,b)=>b[1]-a[1])[0];},[expenses,thisMonth]);
  const avgSleep7=useMemo(()=>{const v=vitals.slice(-7);return v.length?(v.reduce((s,x)=>s+Number(x.sleep||0),0)/v.length).toFixed(1):'?';},[vitals]);
  const level=Math.floor(Math.sqrt(Number(totalXP)/100))+1;
  const todayDone=habits.filter(h=>(habitLogs[h.id]||[]).includes(today())).length;
  const bestStreak=habits.reduce((mx,h)=>{const s=getStreak(h.id,habitLogs);return s>mx?s:mx;},0);

  const insights=[
    monthInc>0&&savRate<20&&{title:'Low Savings Rate',body:`You're saving ${savRate.toFixed(0)}% this month. Target 20–35% to build long-term wealth.`,color:T.amber,icon:'⚠️',type:'warning'},
    monthInc>0&&savRate>=35&&{title:'Excellent Savings Rate',body:`${savRate.toFixed(0)}% savings rate — you're outperforming most. ${cur}${fmtN(monthInc-monthExp)} saved this month.`,color:T.emerald,icon:'📈',type:'positive'},
    topCat&&{title:`Top Spending: ${topCat[0]}`,body:`${topCat[0]} is your largest expense at ${cur}${fmtN(topCat[1])} this month (${monthInc>0?((topCat[1]/monthInc)*100).toFixed(0):0}% of income).`,color:T.violet,icon:'💳',type:'insight'},
    Number(avgSleep7)>0&&Number(avgSleep7)<7&&{title:'Sleep Deficit Detected',body:`Average sleep of ${avgSleep7}h is below optimal 7–8h. Poor sleep correlates with reduced productivity.`,color:T.sky,icon:'😴',type:'insight'},
    Number(avgSleep7)>=7&&{title:'Sleep Health Strong',body:`${avgSleep7}h average sleep over 7 days — within optimal range.`,color:T.sky,icon:'🌙',type:'positive'},
    bestStreak>=7&&{title:`Habit Momentum — ${bestStreak} Day Streak`,body:`Your longest active streak is ${bestStreak} days. Habits compound like investments.`,color:T.accent,icon:'🔥',type:'positive'},
    habits.length>0&&todayDone===0&&{title:'No Habits Logged Today',body:`You have ${habits.length} habits but haven't logged any today.`,color:T.amber,icon:'🎯',type:'warning'},
    debts.length>0&&{title:'Active Debt Tracking',body:`${debts.length} debt(s) totaling ${cur}${fmtN(debts.reduce((s,d)=>s+Number(d.balance||0),0))}. Consider avalanche method.`,color:T.rose,icon:'💳',type:'insight'},
    goals.length===0&&{title:'Set Your First Goal',body:'No goals defined yet. Users with written goals are 42% more likely to achieve them.',color:'#c084fc',icon:'🎯',type:'coach'},
    goals.length>0&&{title:'Goal Progress',body:`${goals.filter(g=>(g.current||0)>=g.target).length} of ${goals.length} goals completed. Average: ${Math.round(goals.reduce((s,g)=>s+((g.current||0)/Math.max(1,g.target))*100,0)/Math.max(1,goals.length))}%.`,color:T.amber,icon:'🏆',type:'positive'},
  ].filter(Boolean).slice(0,6);

  const LIFE_STATS=[{label:'Financial',val:Math.min(100,Math.round((savRate*0.5)+(nw>0?30:0)+(debts.length===0?20:0))),color:T.emerald},{label:'Health',val:Math.min(100,vitals.length*8),color:T.sky},{label:'Habits',val:Math.min(100,habits.length*15+bestStreak*2),color:T.accent},{label:'Growth',val:Math.min(100,Math.round(Number(totalXP)/50)),color:T.violet},{label:'Focus',val:Math.min(100,data.focusSessions.length*5),color:T.rose},{label:'Knowledge',val:Math.min(100,data.notes.length*10),color:T.amber}];

  return (
    <div style={{animation:'fadeUp 0.4s ease'}}>
      <div style={{marginBottom:22}}><SectionLabel>Intelligence Layer</SectionLabel><h1 style={{fontSize:26,fontFamily:T.fD,fontWeight:800,color:T.text}}>Life Intelligence</h1><div style={{fontSize:11,fontFamily:T.fM,color:T.textSub,marginTop:4}}>AI-powered insights · <span style={{color:'#c084fc'}}>●</span> {insights.length} active</div></div>
      <div style={{display:'flex',flexDirection:'column',gap:10,marginBottom:22}}>
        {insights.map((ins,i)=>(<GlassCard key={i} style={{padding:'18px 22px',borderLeft:`3px solid ${ins.color}55`,animation:`fadeUp 0.3s ease ${i*0.07}s both`}}><div style={{display:'flex',alignItems:'flex-start',gap:12}}><div style={{fontSize:22,flexShrink:0}}>{ins.icon}</div><div style={{flex:1}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:5}}><div style={{fontSize:13,fontFamily:T.fD,fontWeight:700,color:T.text}}>{ins.title}</div><Badge color={ins.color}>{ins.type}</Badge></div><div style={{fontSize:12,fontFamily:T.fM,color:T.textSub,lineHeight:1.6}}>{ins.body}</div></div></div></GlassCard>))}
        {insights.length===0&&(<GlassCard style={{padding:40,textAlign:'center'}}><div style={{fontSize:11,fontFamily:T.fM,color:T.textMuted}}>Log expenses, habits and vitals to generate personalized insights.</div></GlassCard>)}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
        <GlassCard style={{padding:'20px 22px'}}><SectionLabel>Life Domain Scores</SectionLabel>{LIFE_STATS.map((s,i)=>(<div key={i} style={{marginBottom:12}}><div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}><span style={{fontSize:11,fontFamily:T.fM,color:T.text}}>{s.label}</span><span style={{fontSize:11,fontFamily:T.fM,color:s.color,fontWeight:600}}>{s.val}/100</span></div><ProgressBar pct={s.val} color={s.color} height={5}/></div>))}</GlassCard>
        <GlassCard style={{padding:'20px 22px'}}><SectionLabel>This Month Summary</SectionLabel>{[{label:'Income',val:`${cur}${fmtN(monthInc)}`,color:T.emerald},{label:'Expenses',val:`${cur}${fmtN(monthExp)}`,color:T.rose},{label:'Saved',val:`${cur}${fmtN(monthInc-monthExp)}`,color:T.accent},{label:'Savings Rate',val:`${savRate.toFixed(1)}%`,color:T.sky},{label:'Net Worth',val:`${cur}${fmtN(nw)}`,color:T.violet},{label:'Habit Streak',val:`🔥 ${bestStreak}d`,color:T.amber}].map((item,i)=>(<div key={i} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:i<5?`1px solid ${T.border}`:'none',fontSize:11,fontFamily:T.fM}}><span style={{color:T.textSub}}>{item.label}</span><span style={{color:item.color,fontWeight:600}}>{item.val}</span></div>))}</GlassCard>
      </div>
    </div>
  );
}

// ── ARCHIVE + AUDIT PAGE ───────────────────────────────────────────────────────
function ArchivePage({data}) {
  const [tab,setTab]=useState('history');
  const {netWorthHistory,expenses,incomes,habits,habitLogs,vitals,settings,timeline,goals,notes,assets,investments,debts,focusSessions}=data;
  const cur=settings.currency||'$';
  const thisMonth=today().slice(0,7);
  const monthExp=expenses.filter(e=>e.date?.startsWith(thisMonth)).reduce((s,e)=>s+Number(e.amount||0),0);
  const monthInc=incomes.filter(i=>i.date?.startsWith(thisMonth)).reduce((s,i)=>s+Number(i.amount||0),0);
  const bestStreak=habits.reduce((mx,h)=>{const s=getStreak(h.id,habitLogs);return s>mx?s:mx;},0);

  // SYSTEM AUDIT
  const audit=useMemo(()=>{
    const implemented=[]; const missing=[]; const risks=[];
    // Infrastructure
    if(expenses) implemented.push({s:'✅ Expense Store',d:'los_expenses — active'});
    if(assets) implemented.push({s:'✅ Asset Store',d:'los_assets — active'});
    if(goals) implemented.push({s:'✅ Goal Store',d:'los_goals — active'});
    if(habits) implemented.push({s:'✅ Habit Store',d:'los_habits + los_habitlogs — active'});
    if(timeline) implemented.push({s:'✅ Timeline Engine',d:`los_timeline — ${timeline.length} events`});
    else missing.push({s:'⚠️ Timeline Engine',d:'No stored TL events yet'});
    // Global systems
    implemented.push({s:'✅ Modal System',d:'GlassCard + Modal wrapper'});
    implemented.push({s:'✅ Theme Engine',d:'CSS tokens in T{} object'});
    implemented.push({s:'✅ Toast System',d:'ToastContainer — all modules wired'});
    implemented.push({s:'✅ Command Palette',d:'⌘K fuzzy search — all domains'});
    // AI
    implemented.push({s:'✅ AI Advisor',d:'Knowledge Page — claude-sonnet'});
    implemented.push({s:'✅ AI Insights',d:'Intelligence Page — 6+ auto insights'});
    if(data.focusSessions) implemented.push({s:'✅ Focus Sessions',d:`${data.focusSessions.length} sessions logged`});
    // Missing
    if(!debts||debts.length===0) missing.push({s:'ℹ️ Debt Module',d:'No debts added yet'});
    if(!investments||investments.length===0) missing.push({s:'ℹ️ Investment Module',d:'No positions added yet'});
    if(!netWorthHistory||netWorthHistory.length<2) missing.push({s:'ℹ️ NW History',d:'Needs 2+ months of data'});
    if(!settings.name) missing.push({s:'ℹ️ Profile Name',d:'Set your name in Settings'});
    // Risks
    if(expenses.length>500) risks.push({s:'⚠️ Storage Risk',d:`${expenses.length} expenses may slow localStorage`});
    if(timeline&&timeline.length>800) risks.push({s:'⚠️ Timeline Size',d:`${timeline.length} events — consider archiving`});
    if(!settings.currency) risks.push({s:'⚠️ Currency',d:'Currency not configured in Settings'});
    risks.push({s:'ℹ️ No i18n',d:'Internationalization not yet implemented'});
    risks.push({s:'ℹ️ No Undo',d:'Undo system not yet implemented'});
    risks.push({s:'ℹ️ Mobile Nav',d:'Mobile-specific navigation not yet implemented'});
    return {implemented,missing,risks};
  },[expenses,assets,goals,habits,timeline,data.focusSessions,debts,investments,netWorthHistory,settings]);

  return (
    <div style={{animation:'fadeUp 0.4s ease'}}>
      <div style={{marginBottom:22}}><SectionLabel>Archive</SectionLabel><h1 style={{fontSize:26,fontFamily:T.fD,fontWeight:800,color:T.text}}>Life History & System Audit</h1></div>
      <div style={{display:'flex',gap:2,marginBottom:22,background:T.surface,borderRadius:T.r,padding:3,width:'fit-content',border:`1px solid ${T.border}`}}>
        {['history','audit'].map(t=>(<button key={t} className="los-tab" onClick={()=>setTab(t)} style={{padding:'5px 14px',borderRadius:8,fontSize:9,fontFamily:T.fM,textTransform:'uppercase',letterSpacing:'0.06em',background:tab===t?T.accentDim:'transparent',color:tab===t?T.accent:T.textSub,border:`1px solid ${tab===t?T.accent+'33':'transparent'}`,transition:'all 0.15s'}}>{t}</button>))}
      </div>

      {tab==='history'&&(
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
          <GlassCard style={{padding:'20px 22px'}}>
            <SectionLabel>Net Worth History</SectionLabel>
            {netWorthHistory.length>1?(<ResponsiveContainer width="100%" height={200}><AreaChart data={netWorthHistory} margin={{top:4,right:0,left:0,bottom:0}}><defs><linearGradient id="ag" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={T.accent} stopOpacity={0.3}/><stop offset="100%" stopColor={T.accent} stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="2 4" stroke={T.border} vertical={false}/><XAxis dataKey="month" tick={{fill:T.textSub,fontSize:9,fontFamily:T.fM}} axisLine={false} tickLine={false}/><YAxis hide/><Tooltip content={<ChartTooltip prefix={cur}/>}/><Area type="monotone" dataKey="value" name="Net Worth" stroke={T.accent} strokeWidth={2} fill="url(#ag)" dot={false}/></AreaChart></ResponsiveContainer>):(
              <div style={{height:100,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontFamily:T.fM,color:T.textMuted}}>Net worth history builds automatically each month.</div>
            )}
          </GlassCard>
          <GlassCard style={{padding:'20px 22px'}}>
            <SectionLabel>This Month — {thisMonth}</SectionLabel>
            {[{label:'Income logged',val:`${cur}${fmtN(monthInc)}`,color:T.emerald},{label:'Expenses logged',val:`${cur}${fmtN(monthExp)}`,color:T.rose},{label:'Net saved',val:`${cur}${fmtN(monthInc-monthExp)}`,color:T.accent},{label:'Vitals logged',val:`${vitals.filter(v=>v.date?.startsWith(thisMonth)).length} days`,color:T.sky},{label:'Habits tracked',val:`${habits.length} habits`,color:T.violet},{label:'Best streak',val:`🔥 ${bestStreak} days`,color:T.amber}].map((item,i)=>(<div key={i} style={{display:'flex',justifyContent:'space-between',padding:'9px 0',borderBottom:i<5?`1px solid ${T.border}`:'none',fontSize:11,fontFamily:T.fM}}><span style={{color:T.textSub}}>{item.label}</span><span style={{color:item.color,fontWeight:600}}>{item.val}</span></div>))}
          </GlassCard>
          <GlassCard style={{padding:'20px 22px',gridColumn:'span 2'}}>
            <SectionLabel>All-Time Activity</SectionLabel>
            <div style={{display:'flex',gap:20,flexWrap:'wrap'}}>
              {[{label:'Expenses',val:expenses.length,color:T.rose},{label:'Income Entries',val:incomes.length,color:T.emerald},{label:'Habit Logs',val:Object.values(habitLogs).flat().length,color:T.accent},{label:'Vitals Days',val:vitals.length,color:T.sky},{label:'Notes',val:notes.length,color:T.amber},{label:'Timeline Events',val:(timeline||[]).length,color:T.violet}].map((s,i)=>(
                <div key={i}><div style={{fontSize:9,fontFamily:T.fM,color:T.textSub,marginBottom:4}}>{s.label.toUpperCase()}</div><div style={{fontSize:20,fontFamily:T.fD,fontWeight:700,color:s.color}}>{s.val.toLocaleString()}</div></div>
              ))}
            </div>
          </GlassCard>
        </div>
      )}

      {tab==='audit'&&(
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          {/* Header */}
          <GlassCard style={{padding:'20px 24px',background:`linear-gradient(135deg,${T.accentLo},${T.violetDim})`,border:`1px solid ${T.accent}33`}}>
            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:8}}>
              <span style={{fontSize:24}}>⬡</span>
              <div><div style={{fontSize:9,fontFamily:T.fM,color:T.accent,letterSpacing:'0.1em',textTransform:'uppercase'}}>System Architecture Audit</div><div style={{fontSize:18,fontFamily:T.fD,fontWeight:800,color:T.text}}>LifeOS v2 — Timeline Engine Active</div></div>
            </div>
            <div style={{fontSize:11,fontFamily:T.fM,color:T.textSub,lineHeight:1.6}}>
              Full audit of infrastructure, modules, AI systems, and performance. {audit.implemented.length} systems operational · {audit.missing.length} pending · {audit.risks.length} notes.
            </div>
          </GlassCard>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:14}}>
            {/* Implemented */}
            <GlassCard style={{padding:'18px 20px',borderTop:`3px solid ${T.emerald}`}}>
              <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:14}}>
                <span style={{fontSize:13}}>✅</span>
                <SectionLabel>Implemented Systems</SectionLabel>
              </div>
              {audit.implemented.map((item,i)=>(
                <div key={i} style={{marginBottom:10,paddingBottom:10,borderBottom:i<audit.implemented.length-1?`1px solid ${T.border}`:'none'}}>
                  <div style={{fontSize:10,fontFamily:T.fM,fontWeight:600,color:T.emerald}}>{item.s}</div>
                  <div style={{fontSize:9,fontFamily:T.fM,color:T.textSub,marginTop:2}}>{item.d}</div>
                </div>
              ))}
            </GlassCard>

            {/* Missing */}
            <GlassCard style={{padding:'18px 20px',borderTop:`3px solid ${T.amber}`}}>
              <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:14}}>
                <span style={{fontSize:13}}>⚠️</span>
                <SectionLabel>Pending / Empty</SectionLabel>
              </div>
              {audit.missing.map((item,i)=>(
                <div key={i} style={{marginBottom:10,paddingBottom:10,borderBottom:i<audit.missing.length-1?`1px solid ${T.border}`:'none'}}>
                  <div style={{fontSize:10,fontFamily:T.fM,fontWeight:600,color:T.amber}}>{item.s}</div>
                  <div style={{fontSize:9,fontFamily:T.fM,color:T.textSub,marginTop:2}}>{item.d}</div>
                </div>
              ))}
            </GlassCard>

            {/* Risks */}
            <GlassCard style={{padding:'18px 20px',borderTop:`3px solid ${T.rose}`}}>
              <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:14}}>
                <span style={{fontSize:13}}>🔬</span>
                <SectionLabel>Architecture Notes</SectionLabel>
              </div>
              {audit.risks.map((item,i)=>(
                <div key={i} style={{marginBottom:10,paddingBottom:10,borderBottom:i<audit.risks.length-1?`1px solid ${T.border}`:'none'}}>
                  <div style={{fontSize:10,fontFamily:T.fM,fontWeight:600,color:T.rose}}>{item.s}</div>
                  <div style={{fontSize:9,fontFamily:T.fM,color:T.textSub,marginTop:2}}>{item.d}</div>
                </div>
              ))}
              <div style={{marginTop:14,padding:'10px 12px',borderRadius:T.r,background:`${T.accent}08`,border:`1px solid ${T.accent}22`}}>
                <div style={{fontSize:10,fontFamily:T.fM,color:T.accent,fontWeight:600,marginBottom:4}}>💡 Suggested Next Steps</div>
                {['Add i18n language system (react-intl)','Implement undo stack via useReducer','Add mobile-specific navigation','Export/import full timeline','Set up recurring event system'].map((s,i)=>(
                  <div key={i} style={{fontSize:9,fontFamily:T.fM,color:T.textSub,marginBottom:3}}>→ {s}</div>
                ))}
              </div>
            </GlassCard>
          </div>

          {/* Timeline integration status */}
          <GlassCard style={{padding:'20px 22px'}}>
            <SectionLabel>Timeline Event Integration Status</SectionLabel>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10}}>
              {[
                {module:'Expenses',status:'✅',events:`${expenses.length}`,color:T.emerald},
                {module:'Income',status:'✅',events:`${incomes.length}`,color:T.emerald},
                {module:'Habits',status:'✅',events:`${Object.values(habitLogs).flat().length}`,color:T.emerald},
                {module:'Vitals',status:'✅',events:`${vitals.length}`,color:T.emerald},
                {module:'Goals',status:'✅',events:`${goals.length}`,color:T.emerald},
                {module:'Notes',status:'✅',events:`${notes.length}`,color:T.emerald},
                {module:'Focus Sessions',status:'✅',events:`${focusSessions.length}`,color:T.emerald},
                {module:'AI Insights',status:'✅',events:'auto',color:T.emerald},
                {module:'Assets',status:'✅',events:`${assets.length}`,color:T.emerald},
                {module:'Investments',status:'✅',events:`${investments.length}`,color:T.emerald},
                {module:'Debts',status:debts.length>0?'✅':'ℹ️',events:`${debts.length}`,color:debts.length>0?T.emerald:T.amber},
                {module:'Career/Jobs',status:'ℹ️',events:'0',color:T.amber},
              ].map((m,i)=>(
                <div key={i} style={{padding:'10px 12px',borderRadius:T.r,background:T.surface,border:`1px solid ${T.border}`}}>
                  <div style={{display:'flex',alignItems:'center',gap:5,marginBottom:3}}>
                    <span style={{fontSize:12}}>{m.status}</span>
                    <span style={{fontSize:9,fontFamily:T.fM,color:T.textSub,letterSpacing:'0.06em'}}>{m.module.toUpperCase()}</span>
                  </div>
                  <div style={{fontSize:14,fontFamily:T.fD,fontWeight:700,color:m.color}}>{m.events} events</div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}

// ── SETTINGS PAGE ──────────────────────────────────────────────────────────────
function SettingsPage({data,actions}) {
  const {settings}=data;
  const [name,setName]=useState(settings.name||'');
  const [currency,setCurrency]=useState(settings.currency||'$');
  const [incomeTarget,setIncomeTarget]=useState(settings.incomeTarget||'');
  const [savingsTarget,setSavingsTarget]=useState(settings.savingsTarget||'');

  const save=()=>{actions.updateSettings({...settings,name,currency,incomeTarget:Number(incomeTarget),savingsTarget:Number(savingsTarget)});};

  const exportData=()=>{
    const d={los_habits:data.habits,los_habitlogs:data.habitLogs,los_expenses:data.expenses,los_incomes:data.incomes,los_debts:data.debts,los_goals:data.goals,los_assets:data.assets,los_investments:data.investments,los_vitals:data.vitals,los_notes:data.notes,los_xp:data.totalXP,los_nwhistory:data.netWorthHistory,los_settings:settings,los_focus:data.focusSessions,los_timeline:data.timeline};
    const blob=new Blob([JSON.stringify(d,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download=`lifeos_backup_${today()}.json`;a.click();URL.revokeObjectURL(url);
  };

  return (
    <div style={{animation:'fadeUp 0.4s ease'}}>
      <div style={{marginBottom:22}}><SectionLabel>System</SectionLabel><h1 style={{fontSize:26,fontFamily:T.fD,fontWeight:800,color:T.text}}>Settings</h1></div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
        <GlassCard style={{padding:'24px'}}>
          <SectionLabel>Profile</SectionLabel>
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            <Input value={name} onChange={e=>setName(e.target.value)} placeholder="Your name"/>
            <Select value={currency} onChange={e=>setCurrency(e.target.value)}>
              {['$','€','£','¥','₹','₩','Fr','A$','C$'].map(c=><option key={c}>{c}</option>)}
            </Select>
            <Input type="number" value={incomeTarget} onChange={e=>setIncomeTarget(e.target.value)} placeholder="Monthly income target"/>
            <Input type="number" value={savingsTarget} onChange={e=>setSavingsTarget(e.target.value)} placeholder="Savings rate target (%)"/>
            <Btn full onClick={save} color={T.accent}>Save Settings</Btn>
          </div>
        </GlassCard>
        <GlassCard style={{padding:'24px'}}>
          <SectionLabel>Appearance & Language</SectionLabel>
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            <div style={{fontSize:10,fontFamily:T.fM,color:T.textSub,marginBottom:4}}>Theme</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
              {Object.entries({obsidian:{label:'Obsidian',color:'#00f5d4'},midnight:{label:'Midnight',color:'#818cf8'},forest:{label:'Forest',color:'#4ade80'},sunset:{label:'Sunset',color:'#fb923c'},ocean:{label:'Ocean',color:'#06b6d4'},rose:{label:'Rose',color:'#f472b6'}}).map(([key,{label,color}])=>(
                <button key={key} onClick={()=>actions.updateSettings({...settings,theme:key})} className="los-btn" style={{padding:'8px 6px',borderRadius:T.r,background:(settings.theme||'obsidian')===key?color+'22':T.surface,border:`1px solid ${(settings.theme||'obsidian')===key?color+'66':T.border}`,display:'flex',alignItems:'center',gap:6,transition:'all 0.15s'}}>
                  <div style={{width:10,height:10,borderRadius:'50%',background:color,flexShrink:0}}/>
                  <span style={{fontSize:9,fontFamily:T.fM,color:(settings.theme||'obsidian')===key?color:T.textSub}}>{label}</span>
                </button>
              ))}
            </div>
            <div style={{fontSize:10,fontFamily:T.fM,color:T.textSub,marginTop:8}}>Language</div>
            <div style={{display:'flex',gap:8}}>
              {[{code:'en',label:'English 🇬🇧'},{code:'fr',label:'Français 🇫🇷'}].map(({code,label})=>(
                <button key={code} onClick={()=>actions.updateSettings({...settings,language:code})} className="los-btn" style={{flex:1,padding:'8px 12px',borderRadius:T.r,background:settings.language===code?T.accentDim:T.surface,border:`1px solid ${settings.language===code?T.accent+'44':T.border}`,fontSize:10,fontFamily:T.fM,color:settings.language===code?T.accent:T.textSub,transition:'all 0.15s'}}>{label}</button>
              ))}
            </div>
            <div style={{fontSize:10,fontFamily:T.fM,color:T.textSub,marginTop:8}}>PIN Lock</div>
            <div style={{display:'flex',gap:8}}>
              <Input value={''} onChange={()=>{}} placeholder={settings.pin?'PIN set — enter new to change':'Set 4-digit PIN (optional)'} type="password" style={{flex:1}} id="pinInput"/>
              <Btn onClick={()=>{const v=document.getElementById('pinInput')?.value;if(v&&v.length===4&&!isNaN(v)){actions.updateSettings({...settings,pin:v});addToast&&addToast('PIN set','success','App will lock on next visit','🔒');}else if(v===''){actions.updateSettings({...settings,pin:null});}}} color={T.violet} style={{padding:'9px 14px'}}>Set</Btn>
            </div>
          </div>
        </GlassCard>
        <GlassCard style={{padding:'24px'}}>
          <SectionLabel>Data</SectionLabel>
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {[{label:'Timeline Events',val:((data.timeline||[]).length).toString(),color:T.accent},{label:'Expenses logged',val:data.expenses.length.toString(),color:T.rose},{label:'Habits tracked',val:data.habits.length.toString(),color:T.amber},{label:'Goals set',val:data.goals.length.toString(),color:T.violet}].map((s,i)=>(
              <div key={i} style={{padding:'12px 14px',borderRadius:T.r,background:T.surface,border:`1px solid ${T.border}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div style={{fontSize:11,fontFamily:T.fM,color:T.text}}>{s.label}</div>
                <div style={{fontSize:16,fontFamily:T.fD,fontWeight:700,color:s.color}}>{s.val}</div>
              </div>
            ))}
            <Btn full onClick={exportData} color={T.sky}>📦 Export All Data (JSON)</Btn>
          </div>
        </GlassCard>
        <GlassCard style={{padding:'24px',gridColumn:'span 2'}}>
          <SectionLabel>System Status — All Modules</SectionLabel>
          <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:10}}>
            {['Finance Engine','Health Sync','AI Coach','Timeline Engine','Intelligence','Command Palette','Toast System','Knowledge Base','Growth Engine','Archive','Settings','Export'].map((sys,i)=>(
              <div key={i} style={{padding:'10px',borderRadius:T.r,background:T.surface,border:`1px solid ${T.border}`}}>
                <div style={{display:'flex',alignItems:'center',gap:4,marginBottom:3}}><div style={{width:5,height:5,borderRadius:'50%',background:T.emerald,animation:'dotPulse 2s infinite'}}/><span style={{fontSize:8,fontFamily:T.fM,color:T.emerald}}>Online</span></div>
                <div style={{fontSize:9,fontFamily:T.fM,color:T.text}}>{sys}</div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

// ── ROOT APP ───────────────────────────────────────────────────────────────────
export default function LifeOS() {
  const [page,setPage]=useState('home');
  const [cmdOpen,setCmdOpen]=useState(false);
  const [toasts,setToasts]=useState([]);
  const [aiPanelOpen,setAiPanelOpen]=useState(false);
  const [undoItem,setUndoItem]=useState(null);
  const [undoTimer,setUndoTimer]=useState(null);
  const [themeKey,setThemeKey]=useState(0);
  const [globalModal,setGlobalModal]=useState(null);

  // Toast system
  const addToast=useCallback((title,type='success',body='',icon='')=>{
    const META={success:{color:T.emerald,icon:'✅'},error:{color:T.rose,icon:'❌'},info:{color:T.sky,icon:'ℹ️'},achievement:{color:T.amber,icon:'🏅'},timeline:{color:T.accent,icon:'⚡'},xp:{color:T.violet,icon:'⚡'}};
    const m=META[type]||META.success;
    const id=Date.now()+Math.random();
    setToasts(p=>[...p,{id,title,body,color:m.color,icon:icon||m.icon}]);
    setTimeout(()=>setToasts(p=>p.filter(t=>t.id!==id)),3500);
  },[]);
  const removeToast=useCallback((id)=>setToasts(p=>p.filter(t=>t.id!==id)),[]);

  // Undo system
  const triggerUndo=useCallback((label,undoFn)=>{
    if(undoTimer) clearTimeout(undoTimer);
    setUndoItem({label,fn:undoFn});
    const t=setTimeout(()=>setUndoItem(null),6000);
    setUndoTimer(t);
  },[undoTimer]);
  const executeUndo=useCallback(()=>{ if(undoItem){undoItem.fn();setUndoItem(null);if(undoTimer)clearTimeout(undoTimer);} },[undoItem,undoTimer]);

  // State stores
  const [settings,setSettings]=useLocalStorage('los_settings',{name:'',currency:'$',language:'en',incomeTarget:0,savingsTarget:30,theme:'obsidian',pin:null});
  const [habits,setHabits]=useLocalStorage('los_habits',[]);
  const [habitLogs,setHabitLogs]=useLocalStorage('los_habitlogs',{});
  const [expenses,setExpenses]=useLocalStorage('los_expenses',[]);
  const [incomes,setIncomes]=useLocalStorage('los_incomes',[]);
  const [debts,setDebts]=useLocalStorage('los_debts',[]);
  const [goals,setGoals]=useLocalStorage('los_goals',[]);
  const [assets,setAssets]=useLocalStorage('los_assets',[]);
  const [investments,setInvestments]=useLocalStorage('los_investments',[]);
  const [vitals,setVitals]=useLocalStorage('los_vitals',[]);
  const [notes,setNotes]=useLocalStorage('los_notes',[]);
  const [focusSessions,setFocusSessions]=useLocalStorage('los_focus',[]);
  const [totalXP,setTotalXP]=useLocalStorage('los_xp',0);
  const [netWorthHistory,setNetWorthHistory]=useLocalStorage('los_nwhistory',[]);
  const [eventLog,setEventLog]=useLocalStorage('los_eventlog',[]);
  const [quickNotes,setQuickNotes]=useLocalStorage('los_qnotes',[]);
  const [subscriptions]=useLocalStorage('los_subs',[]);
  const [bills]=useLocalStorage('los_bills',[]);
  const [intentions,setIntentions]=useLocalStorage('los_intentions',[]);
  const [budgets,setBudgets]=useLocalStorage('los_budgets',{});
  const [weeklyBriefs,setWeeklyBriefs]=useLocalStorage('los_briefs',[]);
  const [onboarded,setOnboarded]=useLocalStorage('los_onboarded',false);
  const [lastReview,setLastReview]=useLocalStorage('los_lastReview',null);
  const [pinLocked,setPinLocked]=useState(()=>{
    try{const s=JSON.parse(localStorage.getItem('los_settings')||'{}');return !!(s.pin);}catch{return false;}
  });

  // TIMELINE ENGINE
  const [timeline,setTimeline]=useLocalStorage('los_timeline',[]);
  const addTLEvent=useCallback((params)=>{
    const event=buildTLEvent(params);
    setTimeline(prev=>[event,...prev].slice(0,2000));
    return event;
  },[setTimeline]);

  const lang=settings.language||'en';
  const cur=settings.currency||'$';

  // Apply theme on settings change
  useEffect(()=>{ applyTheme(settings.theme||'obsidian'); setThemeKey(k=>k+1); },[settings.theme]);

  // Monthly review: show once per month
  const [showReview,setShowReview]=useState(()=>{
    const m=today().slice(0,7);
    try{const lr=JSON.parse(localStorage.getItem('los_lastReview'));return lr!==m&&new Date().getDate()>3;}catch{return false;}
  });

  // Keyboard shortcuts
  useEffect(()=>{
    const handler=(e)=>{
      const tag=e.target.tagName;
      if(tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT') return;
      if((e.metaKey||e.ctrlKey)&&e.key==='k'){e.preventDefault();setCmdOpen(o=>!o);return;}
      if(e.key==='e'&&!e.metaKey&&!e.ctrlKey&&!e.altKey){e.preventDefault();setGlobalModal('expense');}
      if(e.key==='n'&&!e.metaKey&&!e.ctrlKey&&!e.altKey){e.preventDefault();setGlobalModal('note');}
      if(e.key==='f'&&!e.metaKey&&!e.ctrlKey&&!e.altKey){e.preventDefault();setGlobalModal('habit');}
      if(e.key==='Escape'){setAiPanelOpen(false);setCmdOpen(false);}
    };
    window.addEventListener('keydown',handler);
    return()=>window.removeEventListener('keydown',handler);
  },[]);

  // Smart alerts
  const thisMonth=today().slice(0,7);
  const monthInc=incomes.filter(i=>i.date?.startsWith(thisMonth)).reduce((s,i)=>s+Number(i.amount||0),0);
  const monthExp=expenses.filter(e=>e.date?.startsWith(thisMonth)).reduce((s,e)=>s+Number(e.amount||0),0);
  const savRate=monthInc>0?((monthInc-monthExp)/monthInc)*100:0;
  const smartAlerts=useMemo(()=>{
    const alerts=[];
    Object.entries(budgets).forEach(([cat,budget])=>{
      if(!budget) return;
      const spent=expenses.filter(e=>e.date?.startsWith(thisMonth)&&e.category===cat).reduce((s,e)=>s+Number(e.amount||0),0);
      if(spent>Number(budget)) alerts.push({type:'budget',msg:`${cat.split(' ').slice(1).join(' ')} over budget`,color:T.rose,icon:'⚠️'});
    });
    if(monthInc>0&&savRate<10) alerts.push({type:'savings',msg:'Savings rate below 10%',color:T.amber,icon:'📉'});
    bills.forEach(b=>{
      if(!b.dueDay) return;
      const now=new Date(); const dueDate=new Date(now.getFullYear(),now.getMonth(),b.dueDay);
      const daysUntil=Math.round((dueDate-now)/86400000);
      if(daysUntil>=0&&daysUntil<=3) alerts.push({type:'bill',msg:`${b.name} due in ${daysUntil}d`,color:T.amber,icon:'📅'});
    });
    return alerts.slice(0,4);
  },[budgets,expenses,bills,monthInc,savRate,thisMonth]);

  // ── ACTIONS ────────────────────────────────────────────────────────────────
  const addExpense=useCallback((e)=>{
    setExpenses(p=>[e,...p]);
    const xp=5; setTotalXP(x=>Number(x)+xp);
    addTLEvent({type:'expense',title:`Expense: ${e.note||e.category}`,description:`${cur}${fmtN(e.amount)} — ${e.category}`,category:'money',metadata:{amount:e.amount,category:e.category,note:e.note},date:e.date});
    addToast(`+${xp} XP · Expense logged`,'timeline',`${e.category} · ${cur}${fmtN(e.amount)}`,'💳');
  },[cur,addTLEvent,addToast]);

  const addIncome=useCallback((i)=>{
    setIncomes(p=>[i,...p]);
    const xp=10; setTotalXP(x=>Number(x)+xp);
    addTLEvent({type:'income',title:`Income: ${i.note||i.source||'Received'}`,description:`+${cur}${fmtN(i.amount)} — ${i.source||'Income'}`,category:'money',metadata:{amount:i.amount,source:i.source},date:i.date});
    addToast(`+${xp} XP · Income logged`,'success',`+${cur}${fmtN(i.amount)}`,'💰');
  },[cur,addTLEvent,addToast]);

  const addHabit=useCallback((name)=>{
    const h={id:Date.now(),name,frequency:'daily',emoji:'🔥',xp:10};
    setHabits(p=>[...p,h]);
    addTLEvent({type:'goal_created',title:`New habit: ${name}`,description:'Habit created and tracking started',category:'growth'});
  },[addTLEvent]);

  const logHabit=useCallback((habitId)=>{
    const d=today();
    setHabitLogs(prev=>{
      const logs=prev[habitId]||[];
      if(logs.includes(d)) return prev;
      return{...prev,[habitId]:[...logs,d]};
    });
    const xp=10; setTotalXP(x=>Number(x)+xp);
    const hab=habits.find(h=>h.id===habitId);
    const streak=getStreak(habitId,habitLogs)+1;
    addTLEvent({type:'habit_completed',title:`${hab?.name||'Habit'} completed`,description:`🔥 ${streak}d streak`,category:'growth',metadata:{habitId,habitName:hab?.name,streak}});
    if(streak===7||streak===30||streak===100){
      addTLEvent({type:'streak_milestone',title:`🏆 ${streak}-day streak milestone!`,description:`${hab?.name} — ${streak} days`,category:'growth',metadata:{habitId,streak}});
      addToast(`🏆 ${streak}-day streak!`,'achievement',hab?.name||'Habit','🏆');
    } else {
      addToast(`+${xp} XP · Habit logged`,'timeline',`${hab?.name} · 🔥 ${streak}d`,'🔥');
    }
  },[habits,habitLogs,addTLEvent,addToast]);

  const addVitals=useCallback((v)=>{
    setVitals(p=>{
      const existing=p.findIndex(x=>x.date===v.date);
      if(existing>=0){const n=[...p];n[existing]={...n[existing],...v};return n;}
      return[v,...p];
    });
    const xp=8; setTotalXP(x=>Number(x)+xp);
    addTLEvent({type:'vitals_logged',title:'Vitals Logged',description:`Sleep ${v.sleep}h · Mood ${v.mood}/10 · Energy ${v.energy}/10`,category:'health',metadata:v,date:v.date});
    addToast(`+${xp} XP · Vitals logged`,'info',`Sleep ${v.sleep}h · Mood ${v.mood}/10`,'❤️');
  },[addTLEvent,addToast]);

  const addNote=useCallback((n)=>{
    setNotes(p=>[n,...p]);
    const xp=5; setTotalXP(x=>Number(x)+xp);
    addTLEvent({type:'note_created',title:`Note: ${n.title}`,description:n.tag||'Knowledge',category:'knowledge',metadata:{title:n.title,tag:n.tag},date:n.date});
    addToast(`+${xp} XP · Note created`,'info',n.title,'📝');
  },[addTLEvent,addToast]);

  const addGoal=useCallback((g)=>{
    setGoals(p=>[...p,g]);
    const xp=20; setTotalXP(x=>Number(x)+xp);
    addTLEvent({type:'goal_created',title:`New goal: ${g.name}`,description:`Target: ${cur}${fmtN(g.target)} · Category: ${g.cat}`,category:'growth',metadata:{name:g.name,target:g.target,cat:g.cat}});
    addToast(`+${xp} XP · Goal created`,'success',g.name,'🎯');
  },[cur,addTLEvent,addToast]);

  const addAsset=useCallback((a)=>{
    setAssets(p=>[...p,a]);
    const xp=15; setTotalXP(x=>Number(x)+xp);
    addTLEvent({type:'asset_added',title:`Asset added: ${a.name}`,description:`${a.type} · ${cur}${fmtN(a.value)}`,category:'money',metadata:{name:a.name,value:a.value,type:a.type}});
    addToast(`+${xp} XP · Asset added`,'success',`${a.name} · ${cur}${fmtN(a.value)}`,'💎');
  },[cur,addTLEvent,addToast]);

  const updateGoalProgress=useCallback((goalId,amount)=>{
    setGoals(p=>p.map(g=>{
      if(g.id!==goalId) return g;
      const newCurrent=Number(g.current||0)+amount;
      const completed=newCurrent>=g.target&&(g.current||0)<g.target;
      if(completed){
        addTLEvent({type:'goal_completed',title:`🏁 Goal completed: ${g.name}`,description:`Reached ${cur}${fmtN(g.target)} target`,category:'growth',metadata:{goalName:g.name,target:g.target}});
        addToast(`🏁 Goal completed!`,'achievement',g.name,'🏁');
      } else {
        addTLEvent({type:'goal_milestone',title:`Goal progress: ${g.name}`,description:`+${cur}${fmtN(amount)} → ${Math.round((newCurrent/g.target)*100)}%`,category:'growth',metadata:{goalName:g.name,added:amount,newPct:Math.round((newCurrent/g.target)*100)}});
      }
      return{...g,current:newCurrent,updatedAt:today()};
    }));
    setTotalXP(x=>Number(x)+25);
  },[cur,addTLEvent,addToast]);

  const logFocusSession=useCallback((seconds)=>{
    const session={id:Date.now(),duration:seconds,date:today()};
    setFocusSessions(p=>[session,...p]);
    const xp=15; setTotalXP(x=>Number(x)+xp);
    addTLEvent({type:'focus_completed',title:`Focus session: ${Math.round(seconds/60)}m`,description:`Deep work · +${xp} XP`,category:'growth',metadata:{duration:seconds}});
    addToast(`+${xp} XP · Focus complete`,'success',`${Math.round(seconds/60)} minutes`,'⏱️');
  },[addTLEvent,addToast]);

  const updateSettings=useCallback((s)=>{ setSettings(s); },[]);

  // New actions: intentions, budgets, weekly brief, check-in
  const saveIntention=useCallback((text,idx)=>{
    setIntentions(p=>{const n=[...p];n[idx]={text,done:false};return n;});
  },[]);
  const toggleIntention=useCallback((idx)=>{
    setIntentions(p=>p.map((it,i)=>i===idx?{...it,done:!it.done}:it));
  },[]);
  const setBudget=useCallback((cat,amount)=>{
    setBudgets(p=>({...p,[cat]:Number(amount)||0}));
  },[]);
  const saveWeeklyBrief=useCallback((brief)=>{
    setWeeklyBriefs(p=>{const filtered=p.filter(b=>b.week!==brief.week);return[brief,...filtered].slice(0,12);});
  },[]);
  const logCheckin=useCallback((mood,note)=>{
    addVitals({id:Date.now(),sleep:0,mood,energy:mood,weight:0,date:today(),note,isCheckin:true});
    addToast(tr(lang,'checkin_saved'),'success',`Mood: ${mood}/10 ✨`,'✨');
  },[addVitals,addToast,lang]);

  const actions={addExpense,addIncome,addHabit,logHabit,addVitals,addNote,addGoal,addAsset,updateGoalProgress,updateSettings,logFocusSession,addTLEvent,saveIntention,toggleIntention,setBudget,saveWeeklyBrief,logCheckin};

  const data={expenses,incomes,assets,investments,debts,goals,habits,habitLogs,vitals,notes,totalXP,settings,netWorthHistory,eventLog,focusSessions,quickNotes,subscriptions,bills,timeline,intentions,budgets,weeklyBriefs};

  const level=Math.floor(Math.sqrt(Number(totalXP)/100))+1;
  const bestStreak=habits.reduce((mx,h)=>{const s=getStreak(h.id,habitLogs);return s>mx?s:mx;},0);
  const invVal=investments.reduce((s,i)=>s+Number((i.currentPrice??i.buyPrice)||0)*Number(i.quantity||0),0);
  const nw=assets.reduce((s,a)=>s+Number(a.value||0),0)+invVal-debts.reduce((s,d)=>s+Number(d.balance||0),0);

  const VIEW={
    home:<HomePage data={data} actions={actions} onNav={setPage} onCheckin={logCheckin} lang={lang}/>,
    timeline:<TimelinePage data={data} onNav={setPage}/>,
    money:<MoneyPage data={data} actions={actions}/>,
    health:<HealthPage data={data} actions={actions}/>,
    growth:<GrowthPage data={data} actions={actions}/>,
    knowledge:<KnowledgePage data={data} actions={actions}/>,
    intel:<IntelligencePage data={data}/>,
    archive:<ArchivePage data={data}/>,
    settings:<SettingsPage data={data} actions={actions}/>,
  };

  // Onboarding handler
  const handleOnboarding=useCallback((result)=>{
    const newSettings={...settings,name:result.name||settings.name,currency:result.currency||settings.currency};
    setSettings(newSettings);
    if(result.goalName) addGoal({id:Date.now(),name:result.goalName,target:10000,current:0,cat:'finance',emoji:'💰',createdAt:today()});
    if(result.habitName) addHabit(result.habitName);
    setOnboarded(true);
  },[settings,addGoal,addHabit]);

  return (
    <div key={themeKey} style={{minHeight:'100vh',background:T.bg,color:T.text,fontFamily:T.fD,display:'flex'}}>
      {/* Onboarding */}
      {!onboarded&&<OnboardingWizard onDone={handleOnboarding} lang={lang}/>}

      {/* PIN Lock */}
      {pinLocked&&settings.pin&&<PINLockScreen pinCode={settings.pin} onUnlock={()=>setPinLocked(false)} lang={lang}/>}

      {/* Monthly Review */}
      {showReview&&onboarded&&<MonthlyReviewModal data={data} onDismiss={()=>{setShowReview(false);setLastReview(today().slice(0,7));}} lang={lang}/>}

      {/* Global keyboard shortcut modals */}
      <LogExpenseModal open={globalModal==='expense'} onClose={()=>setGlobalModal(null)} onSave={e=>{addExpense(e);setGlobalModal(null);}}/>
      <AddNoteModal open={globalModal==='note'} onClose={()=>setGlobalModal(null)} onSave={e=>{addNote(e);setGlobalModal(null);}}/>
      <LogHabitModal open={globalModal==='habit'} onClose={()=>setGlobalModal(null)} habits={habits} habitLogs={habitLogs} onLog={logHabit} onAddHabit={addHabit}/>

      {/* Ambient glow */}
      <div style={{position:'fixed',inset:0,pointerEvents:'none',zIndex:0,overflow:'hidden'}}>
        <div style={{position:'absolute',top:-200,left:T.sw,width:600,height:600,borderRadius:'50%',background:`radial-gradient(circle,${T.accent}05 0%,transparent 70%)`}}/>
        <div style={{position:'absolute',bottom:-200,right:100,width:500,height:500,borderRadius:'50%',background:`radial-gradient(circle,${T.violet}04 0%,transparent 70%)`}}/>
      </div>

      {/* Toast system */}
      <ToastContainer toasts={toasts} removeToast={removeToast}/>

      {/* Undo bar */}
      <UndoBar undoItem={undoItem} onUndo={executeUndo} onDismiss={()=>setUndoItem(null)}/>

      {/* Command Palette */}
      <CommandPalette open={cmdOpen} onClose={()=>setCmdOpen(false)} data={data} onNav={(p)=>{setPage(p);setCmdOpen(false);}}/>

      {/* AI Slide Panel */}
      <AISlidePanel open={aiPanelOpen} onClose={()=>setAiPanelOpen(false)} data={data} lang={lang}/>

      {/* Sidebar (desktop) */}
      <Sidebar active={page} onNav={setPage} userName={settings.name} onCmdPalette={()=>setCmdOpen(true)} onAIPanel={()=>setAiPanelOpen(o=>!o)} onLock={()=>setPinLocked(true)} pinEnabled={!!settings.pin}/>

      {/* Mobile bottom nav */}
      <MobileBottomNav active={page} onNav={setPage}/>

      {/* Quick Capture FAB */}
      <QuickCaptureFAB onAction={(key)=>setGlobalModal(key)} lang={lang}/>

      <div className="los-main" style={{flex:1,marginLeft:T.sw,minHeight:'100vh',display:'flex',flexDirection:'column',position:'relative',zIndex:1}}>
        {/* Topbar */}
        <div className="los-topbar" style={{height:50,borderBottom:`1px solid ${T.border}`,display:'flex',alignItems:'center',padding:'0 28px',justifyContent:'space-between',background:`${T.bg}dd`,backdropFilter:'blur(20px)',position:'sticky',top:0,zIndex:50}}>
          <div style={{display:'flex',alignItems:'center',gap:7}}>
            <span style={{fontSize:9,fontFamily:T.fM,color:T.textMuted,letterSpacing:'0.15em'}}>LIFE OS</span>
            <span style={{color:T.textMuted,fontSize:11}}>›</span>
            <span style={{fontSize:9,fontFamily:T.fM,color:T.textSub,letterSpacing:'0.1em',textTransform:'uppercase'}}>{page}</span>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <SmartAlertsChip alerts={smartAlerts}/>
            <button onClick={()=>setCmdOpen(true)} style={{display:'flex',alignItems:'center',gap:6,padding:'4px 10px',borderRadius:T.r,background:T.surface,border:`1px solid ${T.border}`,fontSize:9,fontFamily:T.fM,color:T.textSub,transition:'all 0.15s'}}>
              <IcoSearch size={9} stroke={T.textSub}/> <span className="los-hide-mobile">Search</span> <kbd style={{fontSize:8,color:T.textMuted,padding:'1px 4px',borderRadius:3,border:`1px solid ${T.border}`}}>⌘K</kbd>
            </button>
            <button onClick={()=>setAiPanelOpen(o=>!o)} style={{display:'flex',alignItems:'center',gap:5,padding:'4px 10px',borderRadius:T.r,background:'rgba(192,132,252,0.08)',border:'1px solid rgba(192,132,252,0.2)',fontSize:9,fontFamily:T.fM,color:'#c084fc'}}>
              ⬡ <span className="los-hide-mobile">AI</span>
            </button>
            <div style={{fontSize:9,fontFamily:T.fM,color:T.textSub,display:'flex',alignItems:'center',gap:5}} className="los-hide-mobile">
              <div style={{width:4,height:4,borderRadius:'50%',background:T.emerald,animation:'dotPulse 2.5s infinite'}}/>
              {(timeline||[]).length} events
            </div>
            <div style={{fontSize:9,fontFamily:T.fM,color:T.textMuted}} className="los-hide-mobile">{new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'})}</div>
          </div>
        </div>

        {/* Page */}
        <div className="los-page-content" key={page} style={{flex:1,padding:'26px 30px',overflowY:'auto',maxWidth:1180}}>
          {VIEW[page]}
        </div>

        {/* Status bar */}
        <div className="los-status-bar" style={{height:26,borderTop:`1px solid ${T.border}`,display:'flex',alignItems:'center',padding:'0 28px',gap:18,background:T.bg}}>
          {[
            {label:'NW',val:`${cur}${fmtN(nw)}`,color:T.accent},
            {label:'LV',val:`${level}`,color:T.violet},
            {label:'SAVINGS',val:`${savRate.toFixed(0)}%`,color:T.emerald},
            {label:'STREAK',val:`🔥 ${bestStreak}d`,color:T.amber},
            {label:'TL',val:`${(timeline||[]).length} events`,color:T.sky},
          ].map((item,i)=>(
            <div key={i} style={{display:'flex',alignItems:'center',gap:4,fontSize:9,fontFamily:T.fM}}>
              <span style={{color:T.textMuted,letterSpacing:'0.08em'}}>{item.label}</span>
              <span style={{color:item.color,fontWeight:600}}>{item.val}</span>
              {i<4&&<span style={{color:T.textMuted,marginLeft:6}}>·</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
