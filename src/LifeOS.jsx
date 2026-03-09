import { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
    @keyframes fadeUp { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
    @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
    @keyframes slideR { from { opacity:0; transform:translateX(-14px); } to { opacity:1; transform:translateX(0); } }
    @keyframes glowPulse { 0%,100% { box-shadow:0 0 8px rgba(0,245,212,0.25); } 50% { box-shadow:0 0 28px rgba(0,245,212,0.65),0 0 50px rgba(0,245,212,0.15); } }
    @keyframes dotPulse { 0%,100% { transform:scale(1); opacity:1; } 50% { transform:scale(1.5); opacity:0.6; } }
    @keyframes scan { 0% { transform:translateY(-100%); opacity:0.05; } 100% { transform:translateY(200%); opacity:0; } }
    @keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
    @keyframes shimmer { 0% { background-position:-200% 0; } 100% { background-position:200% 0; } }
    @keyframes countUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
    @keyframes borderGlow { 0%,100% { border-color:rgba(0,245,212,0.2); } 50% { border-color:rgba(0,245,212,0.55); } }
    @keyframes barFill { from { width:0; } to { width:var(--w); } }
    @keyframes radarSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    @keyframes nodeEnter { from { opacity:0; transform:scale(0.7) translateX(-10px); } to { opacity:1; transform:scale(1) translateX(0); } }
    .lifeos-btn:hover { filter: brightness(1.15); transform: translateY(-1px); }
    .lifeos-card:hover { border-color: rgba(0,245,212,0.2) !important; }
    .lifeos-nav-item:hover { background: rgba(0,245,212,0.08) !important; }
    .lifeos-quick-action:hover { background: rgba(255,255,255,0.07) !important; transform: translateY(-2px); }
    .lifeos-tl-event:hover { background: rgba(255,255,255,0.04) !important; }
    .lifeos-tab:hover { background: rgba(255,255,255,0.05) !important; }
    input, textarea { outline: none; }
    input:focus, textarea:focus { border-color: rgba(0,245,212,0.5) !important; }
    button { cursor: pointer; border: none; background: none; font-family: inherit; transition: all 0.18s ease; }
  `;
  document.head.appendChild(style);
})();

// ── DESIGN TOKENS ─────────────────────────────────────────────────────────────
const T = {
  bg:       '#040408',
  bg1:      '#070710',
  bg2:      '#0b0b1a',
  surface:  'rgba(255,255,255,0.028)',
  surfaceHi:'rgba(255,255,255,0.055)',
  glass:    'rgba(8,8,18,0.92)',
  border:   'rgba(255,255,255,0.07)',
  borderLit:'rgba(0,245,212,0.3)',

  accent:   '#00f5d4',
  accentDim:'rgba(0,245,212,0.12)',
  accentLo: 'rgba(0,245,212,0.06)',

  violet:   '#8b5cf6',
  violetDim:'rgba(139,92,246,0.12)',

  amber:    '#fbbf24',
  amberDim: 'rgba(251,191,36,0.12)',

  rose:     '#fb7185',
  roseDim:  'rgba(251,113,133,0.12)',

  emerald:  '#34d399',
  emeraldDim:'rgba(52,211,153,0.12)',

  sky:      '#38bdf8',
  skyDim:   'rgba(56,189,248,0.12)',

  text:     '#dde0f2',
  textSub:  '#6b6b90',
  textMuted:'#36364e',

  fD: 'Syne, sans-serif',
  fM: '"IBM Plex Mono", monospace',
  r:  '10px',
  rL: '16px',
  rX: '24px',
  sw: 72,
};

const CAT = {
  expense:    { color:T.rose,    dim:T.roseDim,    label:'Expense',    icon:'💳', emoji:'💳' },
  income:     { color:T.emerald, dim:T.emeraldDim, label:'Income',     icon:'💰', emoji:'💰' },
  investment: { color:T.violet,  dim:T.violetDim,  label:'Investment', icon:'📈', emoji:'📈' },
  habit:      { color:T.accent,  dim:T.accentDim,  label:'Habit',      icon:'🔥', emoji:'🔥' },
  health:     { color:T.sky,     dim:T.skyDim,     label:'Health',     icon:'❤️', emoji:'❤️' },
  goal:       { color:T.amber,   dim:T.amberDim,   label:'Goal',       icon:'🎯', emoji:'🎯' },
  insight:    { color:'#c084fc', dim:'rgba(192,132,252,0.1)', label:'AI Insight', icon:'✨', emoji:'✨' },
  career:     { color:T.amber,   dim:T.amberDim,   label:'Career',     icon:'🚀', emoji:'🚀' },
  workout:    { color:T.sky,     dim:T.skyDim,     label:'Workout',    icon:'💪', emoji:'💪' },
  note:       { color:T.textSub, dim:'rgba(107,107,144,0.1)', label:'Note', icon:'📝', emoji:'📝' },
};

// ── MOCK DATA ─────────────────────────────────────────────────────────────────
const TIMELINE_EVENTS = [
  { id:1,  ts:'2026-03-09 09:14', type:'habit',      title:'Morning Meditation', sub:'21-day streak 🔥', value:'+12 XP', cat:'habit'      },
  { id:2,  ts:'2026-03-09 08:52', type:'health',     title:'Sleep Logged',       sub:'7h 42m · 94% quality', value:'⚡ High Energy', cat:'health' },
  { id:3,  ts:'2026-03-09 08:30', type:'expense',    title:'Whole Foods',        sub:'Groceries', value:'-$87.40', cat:'expense'   },
  { id:4,  ts:'2026-03-08 22:10', type:'insight',    title:'AI Insight Generated',sub:'Spending 18% above avg', value:'⚠️ Alert', cat:'insight'  },
  { id:5,  ts:'2026-03-08 18:00', type:'workout',    title:'Strength Training',  sub:'45 min · 380 cal', value:'+25 XP', cat:'workout'  },
  { id:6,  ts:'2026-03-08 15:30', type:'investment', title:'NVDA — BUY 3 shares',sub:'Portfolio +2.4%', value:'+$184', cat:'investment'},
  { id:7,  ts:'2026-03-08 12:00', type:'income',     title:'Salary Deposited',   sub:'March 2026', value:'+$6,200', cat:'income'    },
  { id:8,  ts:'2026-03-07 20:00', type:'goal',       title:'Emergency Fund 80%', sub:'Goal milestone reached', value:'🏆 +50 XP', cat:'goal'     },
  { id:9,  ts:'2026-03-07 10:00', type:'career',     title:'Project APEX Shipped',sub:'Q1 delivery', value:'🚀 Milestone', cat:'career'   },
  { id:10, ts:'2026-03-06 19:15', type:'habit',      title:'Reading — 30 min',   sub:'48-day streak', value:'+8 XP', cat:'habit'     },
  { id:11, ts:'2026-03-06 14:00', type:'expense',    title:'Netflix / Spotify',  sub:'Subscriptions', value:'-$29.98', cat:'expense'  },
  { id:12, ts:'2026-03-05 09:00', type:'health',     title:'Weight Logged',      sub:'173 lbs (-0.4)', value:'↓ Trending', cat:'health'   },
  { id:13, ts:'2026-03-04 16:30', type:'investment', title:'ETF Auto-Invest',    sub:'VTI $500', value:'+$12.50', cat:'investment'},
  { id:14, ts:'2026-03-03 11:00', type:'note',       title:'Saved Research',     sub:'AI Investment thesis', value:'📝 Saved', cat:'note'     },
  { id:15, ts:'2026-03-01 00:00', type:'income',     title:'Freelance Payment',  sub:'UX Audit — Acme Co.', value:'+$1,400', cat:'income'   },
];

const NETWORTH_TREND = [
  { m:'Sep', v:187000 }, { m:'Oct', v:192000 }, { m:'Nov', v:195500 },
  { m:'Dec', v:188000 }, { m:'Jan', v:201000 }, { m:'Feb', v:208400 },
  { m:'Mar', v:214700 },
];

const SPENDING_DATA = [
  { name:'Housing',    value:1800, color:'#8b5cf6' },
  { name:'Food',       value:620,  color:'#34d399' },
  { name:'Transport',  value:280,  color:'#38bdf8' },
  { name:'Health',     value:150,  color:'#fb7185' },
  { name:'Subs',       value:95,   color:'#fbbf24' },
  { name:'Other',      value:310,  color:'#6b6b90' },
];

const CASHFLOW_DATA = [
  { m:'Oct', inc:7400, exp:3200 }, { m:'Nov', inc:7400, exp:3600 },
  { m:'Dec', inc:8800, exp:4100 }, { m:'Jan', inc:7400, exp:2900 },
  { m:'Feb', inc:7400, exp:3400 }, { m:'Mar', inc:7600, exp:3255 },
];

const PORTFOLIO_DATA = [
  { name:'US Equities', pct:52, val:64200, color:'#8b5cf6', change:2.4 },
  { name:'Intl Stocks',  pct:18, val:22100, color:'#38bdf8', change:-0.8 },
  { name:'Bonds',        pct:12, val:14800, color:'#34d399', change:0.2 },
  { name:'Real Estate',  pct:10, val:12300, color:'#fbbf24', change:1.1 },
  { name:'Crypto',       pct:5,  val:6150,  color:'#fb7185', change:8.4 },
  { name:'Cash',         pct:3,  val:3690,  color:'#6b6b90', change:0 },
];

const SLEEP_DATA = [
  { d:'Mon', h:6.8 }, { d:'Tue', h:7.5 }, { d:'Wed', h:8.1 },
  { d:'Thu', h:6.2 }, { d:'Fri', h:7.9 }, { d:'Sat', h:8.8 }, { d:'Sun', h:7.7 },
];

const HABITS = [
  { id:1, name:'Meditation',  streak:21, goal:30, done:true,  color:T.accent,  emoji:'🧘' },
  { id:2, name:'Reading',     streak:48, goal:60, done:true,  color:T.violet,  emoji:'📚' },
  { id:3, name:'Exercise',    streak:12, goal:30, done:false, color:T.sky,     emoji:'💪' },
  { id:4, name:'Journaling',  streak:7,  goal:21, done:false, color:T.amber,   emoji:'✍️' },
  { id:5, name:'Cold Shower', streak:3,  goal:14, done:true,  color:T.rose,    emoji:'🚿' },
  { id:6, name:'No Alcohol',  streak:18, goal:30, done:true,  color:T.emerald, emoji:'🌿' },
];

const LIFE_STATS = [
  { label:'Financial',  val:82, color:T.emerald },
  { label:'Health',     val:74, color:T.sky     },
  { label:'Growth',     val:68, color:T.violet  },
  { label:'Focus',      val:91, color:T.accent  },
  { label:'Social',     val:55, color:T.amber   },
  { label:'Purpose',    val:78, color:T.rose    },
];

const RADAR_DATA = LIFE_STATS.map(s => ({ subject: s.label, A: s.val }));

const GOALS = [
  { id:1, name:'Emergency Fund',      target:15000, current:12000, cat:'finance', color:T.emerald, emoji:'🛡️' },
  { id:2, name:'Run Half-Marathon',   target:100,   current:68,    cat:'health',  color:T.sky,     emoji:'🏃' },
  { id:3, name:'Invest $20k by Q3',   target:20000, current:12400, cat:'finance', color:T.violet,  emoji:'📊' },
  { id:4, name:'Finish Online Course',target:40,    current:28,    cat:'growth',  color:T.amber,   emoji:'🎓' },
];

const INSIGHTS_DATA = [
  { id:1, type:'warning',  title:'Spending Spike Detected',       body:'Restaurant spending +44% vs last month. Trending $180 over budget.', color:T.amber,   icon:'⚠️', time:'2h ago' },
  { id:2, type:'positive', title:'Investment Momentum',           body:'Portfolio up 6.2% YTD. Your ETF allocation is outperforming SP500 by 1.4%.', color:T.emerald, icon:'📈', time:'6h ago' },
  { id:3, type:'insight',  title:'Habit-Energy Correlation',      body:'You sleep 22% better on days you exercise. 3 missed workouts this week.', color:T.sky,     icon:'🔗', time:'1d ago' },
  { id:4, type:'coach',    title:'Wealth Coach Recommendation',   body:'Increase savings rate to 35% to hit $500k net worth by 2031 (3 yrs ahead of plan).', color:'#c084fc', icon:'🧠', time:'2d ago' },
  { id:5, type:'positive', title:'21-Day Meditation Milestone',   body:'Consistent practice correlates with your highest-focus workdays. Keep going.', color:T.accent,  icon:'✨', time:'3d ago' },
];

const NOTES = [
  { id:1, title:'Investment Thesis — AI Infra',  preview:'Key players: NVDA, MSFT Azure, AWS. Moat analysis...', tag:'Finance', ts:'Mar 8', color:T.violet },
  { id:2, title:'Q2 Career Goals',               preview:'1. Ship APEX v2. 2. Lead system design review. 3...', tag:'Career',  ts:'Mar 6', color:T.amber  },
  { id:3, title:'Morning Routine Optimization',  preview:'5:30 wake, 10 min cold, 20 min meditate, journal...', tag:'Health',  ts:'Mar 4', color:T.sky    },
  { id:4, title:'Books Reading List 2026',        preview:'- The Almanack of Naval (done) - Poor Charlies...', tag:'Growth',  ts:'Mar 1', color:T.emerald},
];

const AI_MESSAGES = [
  { role:'assistant', content:'Hello. I\'m your Life Intelligence Engine. I have a complete view of your finances, health, habits, and goals. How can I help you optimize your life today?' },
];

// ── ICON COMPONENTS ────────────────────────────────────────────────────────────
const Ico = ({ d, size=18, stroke='currentColor', fill='none', sw=1.8, style={}, vb='0 0 24 24' }) => (
  <svg width={size} height={size} viewBox={vb} fill={fill} stroke={stroke}
    strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
    style={{display:'inline-block',flexShrink:0,...style}}>
    {d}
  </svg>
);

const IconHome      = (p) => <Ico {...p} d={<><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>} />;
const IconTimeline  = (p) => <Ico {...p} d={<><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></>} />;
const IconMoney     = (p) => <Ico {...p} d={<><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></>} />;
const IconHealth    = (p) => <Ico {...p} d={<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>} />;
const IconGrowth    = (p) => <Ico {...p} d={<><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></>} />;
const IconKnowledge = (p) => <Ico {...p} d={<><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></>} />;
const IconBrain     = (p) => <Ico {...p} d={<><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24A2.5 2.5 0 0 0 14.5 2Z"/></>} />;
const IconArchive   = (p) => <Ico {...p} d={<><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></>} />;
const IconSettings  = (p) => <Ico {...p} d={<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></>} />;
const IconPlus      = (p) => <Ico {...p} d={<><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>} />;
const IconChevR     = (p) => <Ico {...p} d={<polyline points="9 18 15 12 9 6"/>} />;
const IconFilter    = (p) => <Ico {...p} d={<><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></>} />;
const IconSend      = (p) => <Ico {...p} d={<><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></>} />;
const IconZap       = (p) => <Ico {...p} d={<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>} />;
const IconTarget    = (p) => <Ico {...p} d={<><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></>} />;
const IconStar      = (p) => <Ico {...p} d={<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>} />;
const IconX         = (p) => <Ico {...p} d={<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>} />;

// ── SHARED COMPONENTS ─────────────────────────────────────────────────────────

function GlassCard({ children, style={}, className='', onClick }) {
  return (
    <div className={`lifeos-card ${className}`} onClick={onClick} style={{
      background: T.surface,
      border: `1px solid ${T.border}`,
      borderRadius: T.rL,
      backdropFilter: 'blur(20px)',
      transition: 'border-color 0.2s, box-shadow 0.2s',
      ...style
    }}>
      {children}
    </div>
  );
}

function Badge({ children, color = T.accent, bg }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 99,
      background: bg || color + '18',
      color: color,
      fontSize: 10, fontFamily: T.fM, fontWeight: 600, letterSpacing: '0.05em',
      border: `1px solid ${color}28`,
    }}>
      {children}
    </span>
  );
}

function ProgressBar({ pct, color = T.accent, height = 4, animated = false }) {
  return (
    <div style={{
      width: '100%', height, borderRadius: 99,
      background: 'rgba(255,255,255,0.06)', overflow: 'hidden',
    }}>
      <div style={{
        height: '100%', width: `${Math.min(pct, 100)}%`, borderRadius: 99,
        background: `linear-gradient(90deg, ${color}aa, ${color})`,
        boxShadow: `0 0 8px ${color}55`,
        transition: 'width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
        animation: animated ? 'glowPulse 2.5s infinite' : 'none',
      }} />
    </div>
  );
}

function StatCard({ label, value, sub, color = T.text, trend, icon, style = {} }) {
  return (
    <GlassCard style={{ padding: '18px 20px', ...style }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, fontFamily: T.fM, color: T.textSub, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>{label}</div>
          <div style={{ fontSize: 22, fontFamily: T.fD, fontWeight: 700, color, animation: 'countUp 0.5s ease forwards', lineHeight: 1 }}>{value}</div>
          {sub && <div style={{ fontSize: 11, fontFamily: T.fM, color: T.textSub, marginTop: 6 }}>{sub}</div>}
        </div>
        {icon && <div style={{ fontSize: 20, opacity: 0.7 }}>{icon}</div>}
      </div>
      {trend !== undefined && (
        <div style={{ marginTop: 12 }}>
          <ProgressBar pct={trend} color={color} />
        </div>
      )}
    </GlassCard>
  );
}

const CHART_TOOLTIP = ({ active, payload, label, prefix = '', suffix = '' }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: T.bg2, border: `1px solid ${T.border}`,
      borderRadius: 8, padding: '8px 12px',
      fontFamily: T.fM, fontSize: 11, color: T.text,
    }}>
      {label && <div style={{ color: T.textSub, marginBottom: 4 }}>{label}</div>}
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || T.accent }}>
          {p.name}: <strong>{prefix}{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}{suffix}</strong>
        </div>
      ))}
    </div>
  );
};

// ── SIDEBAR ────────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: 'home',         label: 'Home',         Icon: IconHome      },
  { id: 'timeline',     label: 'Timeline',     Icon: IconTimeline  },
  { id: 'money',        label: 'Money',        Icon: IconMoney     },
  { id: 'health',       label: 'Health',       Icon: IconHealth    },
  { id: 'growth',       label: 'Growth',       Icon: IconGrowth    },
  { id: 'knowledge',    label: 'Knowledge',    Icon: IconKnowledge },
  { id: 'intelligence', label: 'Intelligence', Icon: IconBrain     },
  { id: 'archive',      label: 'Archive',      Icon: IconArchive   },
  { id: 'settings',     label: 'Settings',     Icon: IconSettings  },
];

function Sidebar({ active, onNav }) {
  const [hovered, setHovered] = useState(null);
  return (
    <div style={{
      width: T.sw, minHeight: '100vh', flexShrink: 0,
      background: `linear-gradient(180deg, ${T.bg} 0%, ${T.bg1} 100%)`,
      borderRight: `1px solid ${T.border}`,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '16px 0', gap: 4, position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 100,
    }}>
      {/* Logo */}
      <div style={{
        width: 38, height: 38, borderRadius: 10, marginBottom: 16,
        background: `linear-gradient(135deg, ${T.accent}22, ${T.violet}22)`,
        border: `1px solid ${T.accent}44`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'glowPulse 3s infinite',
      }}>
        <span style={{ fontSize: 16 }}>⬡</span>
      </div>

      {/* Nav items */}
      {NAV_ITEMS.map(({ id, label, Icon }) => {
        const isActive = active === id;
        return (
          <div key={id} style={{ position: 'relative', width: '100%' }}
            onMouseEnter={() => setHovered(id)} onMouseLeave={() => setHovered(null)}>
            <button className="lifeos-nav-item" onClick={() => onNav(id)} style={{
              width: '100%', height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 0,
              background: isActive ? T.accentDim : 'transparent',
              color: isActive ? T.accent : T.textSub,
              position: 'relative', transition: 'all 0.18s',
              borderLeft: `2px solid ${isActive ? T.accent : 'transparent'}`,
            }}>
              {isActive && (
                <div style={{
                  position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
                  width: 2, height: 20, background: T.accent,
                  boxShadow: `0 0 8px ${T.accent}`,
                  borderRadius: '0 2px 2px 0',
                }} />
              )}
              <Icon size={16} stroke={isActive ? T.accent : T.textSub} />
            </button>
            {hovered === id && (
              <div style={{
                position: 'absolute', left: '100%', top: '50%', transform: 'translateY(-50%)',
                background: T.bg2, border: `1px solid ${T.border}`,
                borderRadius: 6, padding: '5px 10px', zIndex: 200,
                fontSize: 11, fontFamily: T.fM, color: T.text, whiteSpace: 'nowrap',
                marginLeft: 6, pointerEvents: 'none',
                animation: 'fadeIn 0.15s ease',
              }}>
                {label}
              </div>
            )}
          </div>
        );
      })}

      <div style={{ flex: 1 }} />

      {/* User avatar */}
      <div style={{
        width: 34, height: 34, borderRadius: '50%',
        background: `linear-gradient(135deg, ${T.violet}, ${T.accent})`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 13, fontWeight: 700, color: T.bg, fontFamily: T.fD,
        border: `2px solid ${T.border}`, marginBottom: 8,
      }}>A</div>

      {/* Online dot */}
      <div style={{
        width: 6, height: 6, borderRadius: '50%', background: T.emerald,
        boxShadow: `0 0 6px ${T.emerald}`, animation: 'dotPulse 2s infinite',
        marginBottom: 8,
      }} />
    </div>
  );
}

// ── HOME PAGE ──────────────────────────────────────────────────────────────────
function HomePage({ onNav }) {
  const todayEvents = TIMELINE_EVENTS.slice(0, 5);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const QUICK_ACTIONS = [
    { label:'Log Expense',       emoji:'💳', color:T.rose    },
    { label:'Add Investment',    emoji:'📈', color:T.violet  },
    { label:'Log Habit',         emoji:'🔥', color:T.accent  },
    { label:'Start Focus',       emoji:'⏱️', color:T.sky     },
    { label:'Add Note',          emoji:'📝', color:T.amber   },
    { label:'Log Workout',       emoji:'💪', color:T.emerald },
  ];

  return (
    <div style={{ animation: 'fadeUp 0.4s ease' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 11, fontFamily: T.fM, color: T.textSub, letterSpacing: '0.1em', marginBottom: 6 }}>
          {greeting.toUpperCase()} · {new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})}
        </div>
        <h1 style={{ fontSize: 28, fontFamily: T.fD, fontWeight: 800, color: T.text, lineHeight: 1.1 }}>
          Command Center
        </h1>
        <div style={{ fontSize: 12, fontFamily: T.fM, color: T.textSub, marginTop: 4 }}>
          All systems nominal · <span style={{ color: T.emerald }}>●</span> 6 habits active · <span style={{ color: T.accent }}>●</span> Portfolio up 2.4%
        </div>
      </div>

      {/* Hero Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
        <StatCard label="Net Worth" value="$214,700" sub="↑ $6,300 this month" color={T.accent} icon="💎" style={{ gridColumn: 'span 1' }} />
        <StatCard label="Financial Health" value="82/100" sub="Top 15% of peers" color={T.emerald} trend={82} icon="📊" />
        <StatCard label="Life XP Level" value="Lv 34 · 2,840 XP" sub="360 XP to next level" color={T.violet} trend={72} icon="⚡" />
        <StatCard label="Savings Rate" value="38%" sub="Goal: 35% · +3% ahead" color={T.sky} trend={76} icon="🎯" />
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 16 }}>
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* AI Daily Brief */}
          <GlassCard style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#c084fc', animation: 'dotPulse 2s infinite' }} />
              <span style={{ fontSize: 10, fontFamily: T.fM, letterSpacing: '0.1em', color: '#c084fc', textTransform: 'uppercase' }}>AI Daily Brief</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              {[
                { icon:'💰', label:'Finance', msg:'Savings rate hit 38% — best month since October. Review restaurant spend.' },
                { icon:'❤️', label:'Health',  msg:'Sleep consistency improved. Aim for 3 workouts this week to maintain streak.' },
                { icon:'🔥', label:'Habits',  msg:'Meditation on 21-day streak. Don\'t break it — 9 days to personal best.' },
              ].map((item, i) => (
                <div key={i} style={{
                  background: T.accentLo, borderRadius: T.r, padding: '14px 16px',
                  border: `1px solid ${T.border}`,
                  animation: `fadeUp 0.4s ease ${i * 0.1 + 0.2}s both`,
                }}>
                  <div style={{ fontSize: 18, marginBottom: 6 }}>{item.icon}</div>
                  <div style={{ fontSize: 10, fontFamily: T.fM, color: T.textSub, letterSpacing: '0.08em', marginBottom: 4 }}>{item.label.toUpperCase()}</div>
                  <div style={{ fontSize: 12, fontFamily: T.fM, color: T.text, lineHeight: 1.5 }}>{item.msg}</div>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Net Worth Chart */}
          <GlassCard style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 10, fontFamily: T.fM, color: T.textSub, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 2 }}>Net Worth Trajectory</div>
                <div style={{ fontSize: 20, fontFamily: T.fD, fontWeight: 700, color: T.accent }}>$214,700</div>
              </div>
              <Badge color={T.emerald}>+14.8% YTD</Badge>
            </div>
            <ResponsiveContainer width="100%" height={120}>
              <AreaChart data={NETWORTH_TREND} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="nwGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={T.accent} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={T.accent} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="m" tick={{ fill: T.textSub, fontSize: 10, fontFamily: T.fM }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip content={<CHART_TOOLTIP prefix="$" />} />
                <Area type="monotone" dataKey="v" stroke={T.accent} strokeWidth={2} fill="url(#nwGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </GlassCard>

          {/* Quick Actions */}
          <GlassCard style={{ padding: '20px 24px' }}>
            <div style={{ fontSize: 10, fontFamily: T.fM, color: T.textSub, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>Quick Actions</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
              {QUICK_ACTIONS.map((a, i) => (
                <button key={i} className="lifeos-quick-action" style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  padding: '12px 8px', borderRadius: T.r,
                  background: T.surface, border: `1px solid ${T.border}`,
                  color: T.textSub, transition: 'all 0.18s',
                  animation: `fadeUp 0.3s ease ${i * 0.06}s both`,
                }}>
                  <span style={{ fontSize: 20 }}>{a.emoji}</span>
                  <span style={{ fontSize: 9, fontFamily: T.fM, color: T.textSub, textAlign: 'center', lineHeight: 1.3 }}>{a.label}</span>
                </button>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Right Column — Today's Timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Life Radar */}
          <GlassCard style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontSize: 10, fontFamily: T.fM, color: T.textSub, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Life Score</div>
              <Badge color={T.accent}>74.7 avg</Badge>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <RadarChart data={RADAR_DATA} margin={{ top: 0, right: 20, bottom: 0, left: 20 }}>
                <PolarGrid stroke={T.border} />
                <PolarAngleAxis dataKey="subject" tick={{ fill: T.textSub, fontSize: 9, fontFamily: T.fM }} />
                <Radar dataKey="A" stroke={T.accent} fill={T.accent} fillOpacity={0.12} strokeWidth={1.5} dot={{ fill: T.accent, r: 2 }} />
              </RadarChart>
            </ResponsiveContainer>
          </GlassCard>

          {/* Today Feed */}
          <GlassCard style={{ padding: '20px', flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontSize: 10, fontFamily: T.fM, color: T.textSub, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Today's Feed</div>
              <button onClick={() => onNav('timeline')} style={{ fontSize: 10, fontFamily: T.fM, color: T.accent, display: 'flex', alignItems: 'center', gap: 2 }}>
                All <IconChevR size={10} stroke={T.accent} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {todayEvents.map((ev, i) => {
                const c = CAT[ev.cat] || CAT.note;
                return (
                  <div key={ev.id} className="lifeos-tl-event" style={{
                    display: 'flex', alignItems: 'flex-start', gap: 10,
                    padding: '10px 8px', borderRadius: 8, cursor: 'pointer',
                    transition: 'background 0.15s',
                    animation: `fadeUp 0.3s ease ${i * 0.07}s both`,
                    borderBottom: i < todayEvents.length - 1 ? `1px solid ${T.border}` : 'none',
                  }}>
                    <div style={{
                      width: 7, height: 7, borderRadius: '50%', marginTop: 5, flexShrink: 0,
                      background: c.color, boxShadow: `0 0 6px ${c.color}`,
                    }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: 12, fontFamily: T.fD, fontWeight: 600, color: T.text, truncate: true }}>{ev.title}</div>
                        <div style={{ fontSize: 10, fontFamily: T.fM, color: c.color, whiteSpace: 'nowrap', marginLeft: 8 }}>{ev.value}</div>
                      </div>
                      <div style={{ fontSize: 10, fontFamily: T.fM, color: T.textSub, marginTop: 2 }}>{ev.sub}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

// ── TIMELINE PAGE ──────────────────────────────────────────────────────────────
function TimelinePage() {
  const [filter, setFilter] = useState('all');
  const [zoom, setZoom] = useState('week');
  const categories = ['all', 'expense', 'income', 'investment', 'habit', 'health', 'goal', 'career', 'insight'];

  const filtered = useMemo(() =>
    filter === 'all' ? TIMELINE_EVENTS : TIMELINE_EVENTS.filter(e => e.cat === filter),
    [filter]
  );

  const groupByDate = useMemo(() => {
    const groups = {};
    filtered.forEach(ev => {
      const date = ev.ts.split(' ')[0];
      if (!groups[date]) groups[date] = [];
      groups[date].push(ev);
    });
    return groups;
  }, [filtered]);

  return (
    <div style={{ animation: 'fadeUp 0.4s ease' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontFamily: T.fM, color: T.textSub, letterSpacing: '0.1em', marginBottom: 6, textTransform: 'uppercase' }}>Core System</div>
        <h1 style={{ fontSize: 28, fontFamily: T.fD, fontWeight: 800, color: T.text }}>Life Timeline</h1>
        <div style={{ fontSize: 12, fontFamily: T.fM, color: T.textSub, marginTop: 4 }}>
          Every action. Every moment. Your complete life history.
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Zoom */}
        <div style={{ display: 'flex', gap: 2, background: T.surface, borderRadius: T.r, padding: 3, border: `1px solid ${T.border}` }}>
          {['day','week','month','year'].map(z => (
            <button key={z} className="lifeos-tab" onClick={() => setZoom(z)} style={{
              padding: '5px 12px', borderRadius: 7, fontSize: 10, fontFamily: T.fM,
              background: zoom === z ? T.accentDim : 'transparent',
              color: zoom === z ? T.accent : T.textSub,
              border: `1px solid ${zoom === z ? T.accent + '33' : 'transparent'}`,
              transition: 'all 0.15s',
            }}>{z.toUpperCase()}</button>
          ))}
        </div>

        {/* Category Filter */}
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {categories.map(cat => {
            const c = cat === 'all' ? { color: T.textSub, dim: T.surface } : CAT[cat];
            const active = filter === cat;
            return (
              <button key={cat} onClick={() => setFilter(cat)} style={{
                padding: '4px 10px', borderRadius: 99, fontSize: 10, fontFamily: T.fM,
                background: active ? (c?.dim || T.accentDim) : 'transparent',
                color: active ? (c?.color || T.accent) : T.textSub,
                border: `1px solid ${active ? (c?.color || T.accent) + '44' : T.border}`,
                transition: 'all 0.15s',
              }}>
                {cat === 'all' ? '⬡ ALL' : `${CAT[cat]?.emoji || ''} ${cat.toUpperCase()}`}
              </button>
            );
          })}
        </div>
      </div>

      {/* Timeline */}
      <div style={{ position: 'relative' }}>
        {/* Vertical line */}
        <div style={{
          position: 'absolute', left: 20, top: 0, bottom: 0, width: 1,
          background: `linear-gradient(180deg, ${T.accent}44 0%, ${T.border} 40%, transparent 100%)`,
        }} />

        {Object.entries(groupByDate).map(([date, events], gi) => (
          <div key={date} style={{ marginBottom: 28, animation: `fadeUp 0.4s ease ${gi * 0.1}s both` }}>
            {/* Date label */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, paddingLeft: 40 }}>
              <div style={{
                fontSize: 11, fontFamily: T.fM, fontWeight: 600, color: T.textSub,
                letterSpacing: '0.1em', textTransform: 'uppercase',
              }}>
                {new Date(date).toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})}
              </div>
              <div style={{ flex: 1, height: 1, background: T.border }} />
            </div>

            {/* Events */}
            {events.map((ev, i) => {
              const c = CAT[ev.cat] || CAT.note;
              const time = ev.ts.split(' ')[1];
              return (
                <div key={ev.id} className="lifeos-tl-event" style={{
                  display: 'flex', alignItems: 'flex-start', gap: 16,
                  paddingLeft: 40, paddingRight: 4, paddingBottom: 14,
                  cursor: 'pointer', borderRadius: 10, transition: 'background 0.15s',
                  animation: `nodeEnter 0.3s ease ${i * 0.06}s both`,
                }}>
                  {/* Node */}
                  <div style={{
                    position: 'absolute', left: 14, width: 13, height: 13,
                    borderRadius: '50%', background: T.bg,
                    border: `2px solid ${c.color}`,
                    boxShadow: `0 0 8px ${c.color}66`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginTop: 14,
                  }} />

                  {/* Card */}
                  <GlassCard style={{
                    flex: 1, padding: '14px 18px',
                    borderLeft: `3px solid ${c.color}66`,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 14 }}>{c.emoji}</span>
                          <span style={{ fontSize: 13, fontFamily: T.fD, fontWeight: 700, color: T.text }}>{ev.title}</span>
                          <Badge color={c.color}>{c.label}</Badge>
                        </div>
                        <div style={{ fontSize: 11, fontFamily: T.fM, color: T.textSub }}>{ev.sub}</div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: 13, fontFamily: T.fM, fontWeight: 600, color: c.color }}>{ev.value}</div>
                        <div style={{ fontSize: 10, fontFamily: T.fM, color: T.textMuted, marginTop: 2 }}>{time}</div>
                      </div>
                    </div>
                  </GlassCard>
                </div>
              );
            })}
          </div>
        ))}

        {/* Load more */}
        <div style={{ paddingLeft: 40, paddingBottom: 20 }}>
          <button style={{
            padding: '8px 20px', borderRadius: 99, fontSize: 11, fontFamily: T.fM,
            background: T.surface, border: `1px solid ${T.border}`, color: T.textSub,
            transition: 'all 0.15s',
          }}>Load more history →</button>
        </div>
      </div>
    </div>
  );
}

// ── MONEY PAGE ─────────────────────────────────────────────────────────────────
function MoneyPage() {
  const [tab, setTab] = useState('overview');
  const tabs = ['overview', 'spending', 'investments', 'strategy'];

  return (
    <div style={{ animation: 'fadeUp 0.4s ease' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontFamily: T.fM, color: T.textSub, letterSpacing: '0.1em', marginBottom: 6, textTransform: 'uppercase' }}>Financial Domain</div>
        <h1 style={{ fontSize: 28, fontFamily: T.fD, fontWeight: 800, color: T.text }}>Money Hub</h1>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 24, background: T.surface, borderRadius: T.r, padding: 3, width: 'fit-content', border: `1px solid ${T.border}` }}>
        {tabs.map(t => (
          <button key={t} className="lifeos-tab" onClick={() => setTab(t)} style={{
            padding: '6px 16px', borderRadius: 8, fontSize: 10, fontFamily: T.fM, textTransform: 'uppercase',
            background: tab === t ? T.accentDim : 'transparent',
            color: tab === t ? T.accent : T.textSub,
            border: `1px solid ${tab === t ? T.accent + '33' : 'transparent'}`,
            transition: 'all 0.15s', letterSpacing: '0.06em',
          }}>{t}</button>
        ))}
      </div>

      {tab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Top metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            <StatCard label="Net Worth" value="$214,700" sub="↑ $6,300 this month" color={T.accent} icon="💎" />
            <StatCard label="Monthly Income" value="$7,600" sub="Base + Freelance" color={T.emerald} icon="💰" />
            <StatCard label="Monthly Spend" value="$3,255" sub="-$145 vs budget" color={T.rose} icon="💳" />
            <StatCard label="Savings" value="$4,345" sub="38% savings rate" color={T.violet} icon="🏦" />
          </div>

          {/* Cash Flow Chart */}
          <GlassCard style={{ padding: '20px 24px' }}>
            <div style={{ fontSize: 10, fontFamily: T.fM, color: T.textSub, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>Cash Flow — 6 Months</div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={CASHFLOW_DATA} barGap={4} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 4" stroke={T.border} vertical={false} />
                <XAxis dataKey="m" tick={{ fill: T.textSub, fontSize: 10, fontFamily: T.fM }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip content={<CHART_TOOLTIP prefix="$" />} />
                <Bar dataKey="inc" name="Income" fill={T.emerald} opacity={0.85} radius={[4,4,0,0]} />
                <Bar dataKey="exp" name="Expenses" fill={T.rose} opacity={0.7} radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </GlassCard>

          {/* Goals progress */}
          <GlassCard style={{ padding: '20px 24px' }}>
            <div style={{ fontSize: 10, fontFamily: T.fM, color: T.textSub, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>Financial Goals</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {GOALS.filter(g => g.cat === 'finance').map(goal => {
                const pct = Math.round((goal.current / goal.target) * 100);
                return (
                  <div key={goal.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span>{goal.emoji}</span>
                        <span style={{ fontSize: 12, fontFamily: T.fD, fontWeight: 600, color: T.text }}>{goal.name}</span>
                      </div>
                      <div style={{ fontSize: 11, fontFamily: T.fM, color: goal.color }}>
                        ${goal.current.toLocaleString()} / ${goal.target.toLocaleString()} · {pct}%
                      </div>
                    </div>
                    <ProgressBar pct={pct} color={goal.color} height={6} />
                  </div>
                );
              })}
            </div>
          </GlassCard>
        </div>
      )}

      {tab === 'spending' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <GlassCard style={{ padding: '20px 24px' }}>
            <div style={{ fontSize: 10, fontFamily: T.fM, color: T.textSub, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>Spending Breakdown</div>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={SPENDING_DATA} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value">
                  {SPENDING_DATA.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip content={<CHART_TOOLTIP prefix="$" />} />
              </PieChart>
            </ResponsiveContainer>
          </GlassCard>

          <GlassCard style={{ padding: '20px 24px' }}>
            <div style={{ fontSize: 10, fontFamily: T.fM, color: T.textSub, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>Categories</div>
            {SPENDING_DATA.map((cat, i) => (
              <div key={i} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontFamily: T.fM, color: T.text }}>{cat.name}</span>
                  <span style={{ fontSize: 12, fontFamily: T.fM, color: cat.color, fontWeight: 600 }}>${cat.value}</span>
                </div>
                <ProgressBar pct={(cat.value / 3255) * 100} color={cat.color} height={4} />
              </div>
            ))}
          </GlassCard>
        </div>
      )}

      {tab === 'investments' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <StatCard label="Portfolio Value" value="$123,240" sub="All assets" color={T.violet} icon="📊" />
            <StatCard label="Total Return" value="+$18,400" sub="+17.6% lifetime" color={T.emerald} icon="📈" />
            <StatCard label="YTD Return" value="+$6,200" sub="+6.2% vs 4.8% SP500" color={T.accent} icon="⚡" />
          </div>

          <GlassCard style={{ padding: '20px 24px' }}>
            <div style={{ fontSize: 10, fontFamily: T.fM, color: T.textSub, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>Asset Allocation</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {PORTFOLIO_DATA.map((asset, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: asset.color, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontFamily: T.fM, color: T.text }}>{asset.name}</span>
                      <div style={{ display: 'flex', gap: 12 }}>
                        <span style={{ fontSize: 12, fontFamily: T.fM, color: T.textSub }}>${asset.val.toLocaleString()}</span>
                        <span style={{ fontSize: 11, fontFamily: T.fM, color: asset.change >= 0 ? T.emerald : T.rose }}>
                          {asset.change >= 0 ? '↑' : '↓'} {Math.abs(asset.change)}%
                        </span>
                      </div>
                    </div>
                    <ProgressBar pct={asset.pct} color={asset.color} height={5} />
                  </div>
                  <span style={{ fontSize: 11, fontFamily: T.fM, color: T.textSub, width: 32, textAlign: 'right' }}>{asset.pct}%</span>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      )}

      {tab === 'strategy' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <GlassCard style={{ padding: '24px' }}>
            <div style={{ fontSize: 10, fontFamily: T.fM, color: T.textSub, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>Wealth Projection</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { yr:'2027', val:'$285,000', color:T.text },
                { yr:'2028', val:'$362,000', color:T.text },
                { yr:'2029', val:'$448,000', color:T.textSub },
                { yr:'2030', val:'$545,000', color:T.textSub },
                { yr:'2031', val:'$655,000', color:T.accent },
              ].map((proj, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${T.border}` }}>
                  <div style={{ fontSize: 13, fontFamily: T.fM, color: T.textSub }}>{proj.yr}</div>
                  <div style={{ fontSize: 15, fontFamily: T.fD, fontWeight: 700, color: proj.color }}>{proj.val}</div>
                </div>
              ))}
            </div>
          </GlassCard>
          <GlassCard style={{ padding: '24px' }}>
            <div style={{ fontSize: 10, fontFamily: T.fM, color: T.textSub, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>Scenarios</div>
            {[
              { label:'Conservative (5%)',  val:'$510k', color:T.textSub },
              { label:'Base Case (8%)',      val:'$655k', color:T.text },
              { label:'Optimistic (12%)',    val:'$830k', color:T.emerald },
              { label:'Aggressive (15%)',    val:'$1.02M', color:T.accent },
            ].map((s, i) => (
              <div key={i} style={{ padding: '12px', borderRadius: T.r, background: T.surface, marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, fontFamily: T.fM, color: T.textSub }}>{s.label}</span>
                <span style={{ fontSize: 13, fontFamily: T.fD, fontWeight: 700, color: s.color }}>{s.val}</span>
              </div>
            ))}
          </GlassCard>
        </div>
      )}
    </div>
  );
}

// ── HEALTH PAGE ────────────────────────────────────────────────────────────────
function HealthPage() {
  const [focusActive, setFocusActive] = useState(false);
  const [focusTime, setFocusTime] = useState(25 * 60);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!focusActive) return;
    const interval = setInterval(() => setElapsed(e => {
      if (e >= focusTime) { setFocusActive(false); return 0; }
      return e + 1;
    }), 1000);
    return () => clearInterval(interval);
  }, [focusActive, focusTime]);

  const fmtTime = (s) => `${String(Math.floor(s / 60)).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`;
  const remaining = focusTime - elapsed;
  const pct = (elapsed / focusTime) * 100;

  return (
    <div style={{ animation: 'fadeUp 0.4s ease' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontFamily: T.fM, color: T.textSub, letterSpacing: '0.1em', marginBottom: 6, textTransform: 'uppercase' }}>Health Domain</div>
        <h1 style={{ fontSize: 28, fontFamily: T.fD, fontWeight: 800, color: T.text }}>Health & Vitals</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        <StatCard label="Sleep Score" value="94%" sub="7h 42m last night" color={T.sky} icon="🌙" trend={94} />
        <StatCard label="Energy Level" value="High" sub="Top 20% for today" color={T.accent} icon="⚡" trend={80} />
        <StatCard label="Weight" value="173 lbs" sub="-2.4 lbs this month" color={T.emerald} icon="⚖️" trend={60} />
        <StatCard label="Steps Today" value="8,240" sub="Goal: 10,000" color={T.amber} icon="👟" trend={82} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Sleep Chart */}
          <GlassCard style={{ padding: '20px 24px' }}>
            <div style={{ fontSize: 10, fontFamily: T.fM, color: T.textSub, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>Sleep — This Week</div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={SLEEP_DATA} barSize={32} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 4" stroke={T.border} vertical={false} />
                <XAxis dataKey="d" tick={{ fill: T.textSub, fontSize: 10, fontFamily: T.fM }} axisLine={false} tickLine={false} />
                <YAxis domain={[4,10]} hide />
                <Tooltip content={<CHART_TOOLTIP suffix="h" />} />
                <Bar dataKey="h" name="Hours" fill={T.sky} opacity={0.8} radius={[6,6,0,0]}
                  label={{ fill: T.textSub, fontSize: 9, fontFamily: T.fM, position: 'top' }} />
              </BarChart>
            </ResponsiveContainer>
          </GlassCard>

          {/* Health metrics grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[
              { label:'Heart Rate',   value:'68 bpm',   sub:'Resting — optimal', color:T.rose,    icon:'❤️' },
              { label:'VO2 Max',      value:'48.2',     sub:'Good fitness level', color:T.sky,     icon:'🫁' },
              { label:'HRV',          value:'62 ms',    sub:'Good recovery',     color:T.emerald, icon:'📡' },
              { label:'Hydration',    value:'2.4L',     sub:'Goal: 3L',          color:T.accent,  icon:'💧' },
              { label:'Calories',     value:'2,180',    sub:'Target: 2,400',     color:T.amber,   icon:'🍎' },
              { label:'Active Min',   value:'38 min',   sub:'Goal: 30 min ✓',    color:T.violet,  icon:'🏃' },
            ].map((m, i) => (
              <StatCard key={i} {...m} />
            ))}
          </div>
        </div>

        {/* Focus Timer */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <GlassCard style={{ padding: '24px', textAlign: 'center' }}>
            <div style={{ fontSize: 10, fontFamily: T.fM, color: T.textSub, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 20 }}>Focus Session</div>
            
            {/* Circular timer */}
            <div style={{ position: 'relative', width: 160, height: 160, margin: '0 auto 20px' }}>
              <svg width={160} height={160} style={{ transform: 'rotate(-90deg)' }}>
                <circle cx={80} cy={80} r={68} fill="none" stroke={T.border} strokeWidth={6} />
                <circle cx={80} cy={80} r={68} fill="none" stroke={T.accent} strokeWidth={6}
                  strokeDasharray={`${2 * Math.PI * 68 * (pct / 100)} ${2 * Math.PI * 68 * (1 - pct / 100)}`}
                  strokeLinecap="round"
                  style={{ filter: `drop-shadow(0 0 6px ${T.accent})`, transition: 'stroke-dasharray 1s linear' }}
                />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontSize: 28, fontFamily: T.fM, fontWeight: 600, color: T.text }}>{fmtTime(remaining)}</div>
                <div style={{ fontSize: 10, fontFamily: T.fM, color: T.textSub }}>remaining</div>
              </div>
            </div>

            {/* Duration selector */}
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 16 }}>
              {[25*60, 45*60, 60*60, 90*60].map(s => (
                <button key={s} onClick={() => { setFocusTime(s); setElapsed(0); setFocusActive(false); }} style={{
                  padding: '4px 10px', borderRadius: 99, fontSize: 10, fontFamily: T.fM,
                  background: focusTime === s ? T.accentDim : T.surface,
                  color: focusTime === s ? T.accent : T.textSub,
                  border: `1px solid ${focusTime === s ? T.accent + '44' : T.border}`,
                }}>{s/60}m</button>
              ))}
            </div>

            <button className="lifeos-btn" onClick={() => setFocusActive(!focusActive)} style={{
              width: '100%', padding: '12px', borderRadius: T.r,
              background: focusActive ? T.roseDim : T.accentDim,
              color: focusActive ? T.rose : T.accent,
              border: `1px solid ${focusActive ? T.rose + '44' : T.accent + '44'}`,
              fontSize: 12, fontFamily: T.fM, fontWeight: 600,
              animation: focusActive ? 'glowPulse 2s infinite' : 'none',
            }}>
              {focusActive ? '⏸ PAUSE SESSION' : '▶ START FOCUS'}
            </button>
          </GlassCard>

          {/* AI Health Coach */}
          <GlassCard style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: T.sky, animation: 'dotPulse 2s infinite' }} />
              <span style={{ fontSize: 10, fontFamily: T.fM, color: T.sky, textTransform: 'uppercase', letterSpacing: '0.1em' }}>AI Health Coach</span>
            </div>
            {[
              'Sleep score 94% — excellent! Consistent bedtime routine detected.',
              'You have 3 missed workouts this week. Schedule one today?',
              'HRV trending up +8% over 2 weeks. Recovery improving significantly.',
            ].map((msg, i) => (
              <div key={i} style={{
                padding: '10px 12px', borderRadius: T.r, background: T.surface,
                marginBottom: 8, fontSize: 11, fontFamily: T.fM, color: T.text, lineHeight: 1.5,
                borderLeft: `2px solid ${T.sky}66`,
              }}>{msg}</div>
            ))}
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

// ── GROWTH PAGE ────────────────────────────────────────────────────────────────
function GrowthPage() {
  const [tab, setTab] = useState('character');
  const totalXP = 2840;
  const xpToNext = 360;
  const level = 34;

  return (
    <div style={{ animation: 'fadeUp 0.4s ease' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontFamily: T.fM, color: T.textSub, letterSpacing: '0.1em', marginBottom: 6, textTransform: 'uppercase' }}>Growth Domain</div>
        <h1 style={{ fontSize: 28, fontFamily: T.fD, fontWeight: 800, color: T.text }}>Character · Career · Goals</h1>
      </div>

      <div style={{ display: 'flex', gap: 2, marginBottom: 24, background: T.surface, borderRadius: T.r, padding: 3, width: 'fit-content', border: `1px solid ${T.border}` }}>
        {['character','habits','goals','career'].map(t => (
          <button key={t} className="lifeos-tab" onClick={() => setTab(t)} style={{
            padding: '6px 16px', borderRadius: 8, fontSize: 10, fontFamily: T.fM, textTransform: 'uppercase',
            background: tab === t ? T.violetDim : 'transparent',
            color: tab === t ? T.violet : T.textSub,
            border: `1px solid ${tab === t ? T.violet + '33' : 'transparent'}`,
            transition: 'all 0.15s', letterSpacing: '0.06em',
          }}>{t}</button>
        ))}
      </div>

      {tab === 'character' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* XP Card */}
          <GlassCard style={{ padding: '24px', gridColumn: 'span 2' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{
                width: 80, height: 80, borderRadius: '50%', flexShrink: 0,
                background: `linear-gradient(135deg, ${T.violet}, ${T.accent})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28, fontFamily: T.fD, fontWeight: 800, color: T.bg,
                boxShadow: `0 0 24px ${T.violet}44`,
              }}>{level}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, fontFamily: T.fM, color: T.textSub, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>Life Level</div>
                <div style={{ fontSize: 22, fontFamily: T.fD, fontWeight: 800, color: T.text, marginBottom: 8 }}>Level {level} — Achiever</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontFamily: T.fM, color: T.textSub }}>{totalXP.toLocaleString()} XP</span>
                  <span style={{ fontSize: 11, fontFamily: T.fM, color: T.violet }}>{xpToNext} to Level {level+1}</span>
                </div>
                <ProgressBar pct={(totalXP / (totalXP + xpToNext)) * 100} color={T.violet} height={8} animated />
              </div>
            </div>
          </GlassCard>

          {/* Life Stats */}
          <GlassCard style={{ padding: '20px 24px' }}>
            <div style={{ fontSize: 10, fontFamily: T.fM, color: T.textSub, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>Life Stats</div>
            {LIFE_STATS.map((stat, i) => (
              <div key={i} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontFamily: T.fM, color: T.text }}>{stat.label}</span>
                  <span style={{ fontSize: 12, fontFamily: T.fM, color: stat.color, fontWeight: 600 }}>{stat.val}</span>
                </div>
                <ProgressBar pct={stat.val} color={stat.color} height={5} />
              </div>
            ))}
          </GlassCard>

          {/* Radar */}
          <GlassCard style={{ padding: '20px 24px' }}>
            <div style={{ fontSize: 10, fontFamily: T.fM, color: T.textSub, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Life Balance</div>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={RADAR_DATA} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                <PolarGrid stroke={T.border} />
                <PolarAngleAxis dataKey="subject" tick={{ fill: T.textSub, fontSize: 9, fontFamily: T.fM }} />
                <PolarRadiusAxis domain={[0,100]} tick={false} axisLine={false} />
                <Radar dataKey="A" stroke={T.violet} fill={T.violet} fillOpacity={0.15} strokeWidth={1.5} dot={{ fill: T.violet, r: 3 }} />
              </RadarChart>
            </ResponsiveContainer>
          </GlassCard>
        </div>
      )}

      {tab === 'habits' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {HABITS.map((habit, i) => {
            const pct = (habit.streak / habit.goal) * 100;
            return (
              <GlassCard key={habit.id} style={{ padding: '16px 20px', animation: `fadeUp 0.3s ease ${i*0.06}s both` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: T.r, flexShrink: 0,
                    background: habit.color + '18', border: `1px solid ${habit.color}33`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
                  }}>{habit.emoji}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 13, fontFamily: T.fD, fontWeight: 600, color: T.text }}>{habit.name}</span>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ fontSize: 11, fontFamily: T.fM, color: habit.color }}>🔥 {habit.streak} day streak</span>
                        {habit.done && <Badge color={habit.color}>✓ Done today</Badge>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <ProgressBar pct={pct} color={habit.color} height={5} />
                      <span style={{ fontSize: 10, fontFamily: T.fM, color: T.textSub, whiteSpace: 'nowrap' }}>{habit.streak}/{habit.goal}</span>
                    </div>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      {tab === 'goals' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {GOALS.map((goal, i) => {
            const pct = Math.round((goal.current / goal.target) * 100);
            return (
              <GlassCard key={goal.id} style={{ padding: '20px 24px', animation: `fadeUp 0.3s ease ${i*0.1}s both` }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div>
                    <div style={{ fontSize: 22, marginBottom: 8 }}>{goal.emoji}</div>
                    <div style={{ fontSize: 14, fontFamily: T.fD, fontWeight: 700, color: T.text }}>{goal.name}</div>
                    <Badge color={goal.color} style={{ marginTop: 4 }}>{goal.cat.toUpperCase()}</Badge>
                  </div>
                  <div style={{
                    width: 48, height: 48, borderRadius: '50%',
                    background: `conic-gradient(${goal.color} ${pct * 3.6}deg, ${T.border} 0deg)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: `0 0 12px ${goal.color}33`,
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%', background: T.bg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontFamily: T.fM, fontWeight: 600, color: goal.color,
                    }}>{pct}%</div>
                  </div>
                </div>
                <ProgressBar pct={pct} color={goal.color} height={6} />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                  <span style={{ fontSize: 11, fontFamily: T.fM, color: T.textSub }}>{goal.current.toLocaleString()}</span>
                  <span style={{ fontSize: 11, fontFamily: T.fM, color: T.textSub }}>{goal.target.toLocaleString()}</span>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      {tab === 'career' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <StatCard label="Current Role" value="Sr. Engineer" sub="TechCorp Inc." color={T.amber} icon="💼" />
            <StatCard label="Base Salary" value="$148,000" sub="+22% vs 2 yrs ago" color={T.emerald} icon="💰" />
            <StatCard label="Career Score" value="78/100" sub="Top 25% trajectory" color={T.violet} icon="📈" trend={78} />
          </div>

          <GlassCard style={{ padding: '20px 24px' }}>
            <div style={{ fontSize: 10, fontFamily: T.fM, color: T.textSub, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>Career Timeline</div>
            {[
              { yr:'Mar 2026', event:'Project APEX shipped — on time delivery', type:'milestone', color:T.accent },
              { yr:'Jan 2026', event:'Promoted to Senior Engineer', type:'promotion', color:T.emerald },
              { yr:'Oct 2025', event:'Led team of 4 for Platform Redesign', type:'achievement', color:T.violet },
              { yr:'Jun 2025', event:'Completed System Design certification', type:'growth', color:T.sky },
            ].map((ev, i) => (
              <div key={i} style={{ display: 'flex', gap: 14, paddingBottom: 14, borderBottom: i < 3 ? `1px solid ${T.border}` : 'none', marginBottom: i < 3 ? 14 : 0 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: ev.color, flexShrink: 0, marginTop: 5, boxShadow: `0 0 6px ${ev.color}` }} />
                <div>
                  <div style={{ fontSize: 12, fontFamily: T.fD, fontWeight: 600, color: T.text }}>{ev.event}</div>
                  <div style={{ fontSize: 10, fontFamily: T.fM, color: T.textSub, marginTop: 2 }}>{ev.yr}</div>
                </div>
              </div>
            ))}
          </GlassCard>
        </div>
      )}
    </div>
  );
}

// ── KNOWLEDGE PAGE ─────────────────────────────────────────────────────────────
function KnowledgePage() {
  const [tab, setTab] = useState('notes');
  const [messages, setMessages] = useState(AI_MESSAGES);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: `You are a Life Intelligence Engine for a next-generation Life OS app. You have access to the user's life data:
- Net Worth: $214,700 (up $6,300 this month)
- Monthly income: $7,600, expenses: $3,255, savings rate: 38%
- Portfolio: $123,240 (up 6.2% YTD)
- Life XP Level: 34 with 2,840 XP
- Active habits: Meditation (21-day streak), Reading (48-day), No Alcohol (18-day)
- Sleep: 7h 42m, score 94%
- Goals: Emergency Fund at 80%, Half-Marathon training at 68%
Give insightful, data-driven advice as a brilliant life coach and financial advisor. Be concise and direct. Reference the user's data when relevant.`,
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      const text = data.content?.map(b => b.text || '').join('') || 'Unable to get response.';
      setMessages(prev => [...prev, { role: 'assistant', content: text }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection error. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ animation: 'fadeUp 0.4s ease' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontFamily: T.fM, color: T.textSub, letterSpacing: '0.1em', marginBottom: 6, textTransform: 'uppercase' }}>Knowledge Domain</div>
        <h1 style={{ fontSize: 28, fontFamily: T.fD, fontWeight: 800, color: T.text }}>Knowledge Base</h1>
      </div>

      <div style={{ display: 'flex', gap: 2, marginBottom: 24, background: T.surface, borderRadius: T.r, padding: 3, width: 'fit-content', border: `1px solid ${T.border}` }}>
        {['notes','ai assistant'].map(t => (
          <button key={t} className="lifeos-tab" onClick={() => setTab(t)} style={{
            padding: '6px 16px', borderRadius: 8, fontSize: 10, fontFamily: T.fM, textTransform: 'uppercase',
            background: tab === t ? T.amberDim : 'transparent',
            color: tab === t ? T.amber : T.textSub,
            border: `1px solid ${tab === t ? T.amber + '33' : 'transparent'}`,
            transition: 'all 0.15s', letterSpacing: '0.06em',
          }}>{t}</button>
        ))}
      </div>

      {tab === 'notes' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {NOTES.map((note, i) => (
            <GlassCard key={note.id} className="lifeos-card" style={{
              padding: '20px', cursor: 'pointer', transition: 'all 0.2s',
              animation: `fadeUp 0.3s ease ${i * 0.08}s both`,
              borderLeft: `3px solid ${note.color}66`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <Badge color={note.color}>{note.tag}</Badge>
                <span style={{ fontSize: 10, fontFamily: T.fM, color: T.textMuted }}>{note.ts}</span>
              </div>
              <div style={{ fontSize: 13, fontFamily: T.fD, fontWeight: 700, color: T.text, marginBottom: 8 }}>{note.title}</div>
              <div style={{ fontSize: 11, fontFamily: T.fM, color: T.textSub, lineHeight: 1.6 }}>{note.preview}</div>
            </GlassCard>
          ))}
          {/* Add note */}
          <GlassCard style={{
            padding: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 8, border: `1px dashed ${T.border}`, background: 'transparent',
            animation: `fadeUp 0.3s ease ${NOTES.length * 0.08}s both`,
          }}>
            <IconPlus size={16} stroke={T.textMuted} />
            <span style={{ fontSize: 12, fontFamily: T.fM, color: T.textMuted }}>New Note</span>
          </GlassCard>
        </div>
      )}

      {tab === 'ai assistant' && (
        <GlassCard style={{ display: 'flex', flexDirection: 'column', height: 540 }}>
          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {messages.map((msg, i) => (
              <div key={i} style={{
                display: 'flex', gap: 10,
                flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                animation: 'fadeUp 0.25s ease',
              }}>
                {msg.role === 'assistant' && (
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                    background: `linear-gradient(135deg, #c084fc, ${T.sky})`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
                  }}>⬡</div>
                )}
                <div style={{
                  maxWidth: '72%', padding: '12px 16px', borderRadius: T.rL,
                  background: msg.role === 'user' ? T.accentDim : T.surfaceHi,
                  border: `1px solid ${msg.role === 'user' ? T.accent + '33' : T.border}`,
                  fontSize: 12, fontFamily: T.fM, color: T.text, lineHeight: 1.6,
                  borderBottomRightRadius: msg.role === 'user' ? 4 : T.rL,
                  borderBottomLeftRadius: msg.role === 'assistant' ? 4 : T.rL,
                }}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, background: `linear-gradient(135deg, #c084fc, ${T.sky})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>⬡</div>
                <div style={{ padding: '12px 16px', borderRadius: T.rL, borderBottomLeftRadius: 4, background: T.surfaceHi, border: `1px solid ${T.border}`, display: 'flex', gap: 4, alignItems: 'center' }}>
                  {[0,1,2].map(d => (
                    <div key={d} style={{ width: 5, height: 5, borderRadius: '50%', background: '#c084fc', animation: `dotPulse 1.2s ease ${d*0.2}s infinite` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '16px 20px', borderTop: `1px solid ${T.border}`, display: 'flex', gap: 10 }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Ask your Life Intelligence Engine..."
              style={{
                flex: 1, background: T.surface, border: `1px solid ${T.border}`,
                borderRadius: T.r, padding: '10px 16px',
                fontFamily: T.fM, fontSize: 12, color: T.text,
                transition: 'border-color 0.2s',
              }}
            />
            <button className="lifeos-btn" onClick={sendMessage} disabled={!input.trim() || loading} style={{
              width: 40, height: 40, borderRadius: T.r, flexShrink: 0,
              background: input.trim() ? T.accentDim : T.surface,
              border: `1px solid ${input.trim() ? T.accent + '44' : T.border}`,
              color: input.trim() ? T.accent : T.textMuted,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <IconSend size={14} stroke={input.trim() ? T.accent : T.textMuted} />
            </button>
          </div>
        </GlassCard>
      )}
    </div>
  );
}

// ── INTELLIGENCE PAGE ──────────────────────────────────────────────────────────
function IntelligencePage() {
  return (
    <div style={{ animation: 'fadeUp 0.4s ease' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontFamily: T.fM, color: T.textSub, letterSpacing: '0.1em', marginBottom: 6, textTransform: 'uppercase' }}>Intelligence Layer</div>
        <h1 style={{ fontSize: 28, fontFamily: T.fD, fontWeight: 800, color: T.text }}>Life Intelligence</h1>
        <div style={{ fontSize: 12, fontFamily: T.fM, color: T.textSub, marginTop: 4 }}>
          AI-powered insights across all life domains · <span style={{ color: '#c084fc' }}>●</span> 5 new insights today
        </div>
      </div>

      {/* Insights Feed */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
        {INSIGHTS_DATA.map((insight, i) => (
          <GlassCard key={insight.id} style={{
            padding: '20px 24px', borderLeft: `3px solid ${insight.color}66`,
            animation: `fadeUp 0.3s ease ${i * 0.08}s both`,
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div style={{ fontSize: 24, flexShrink: 0 }}>{insight.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <div style={{ fontSize: 13, fontFamily: T.fD, fontWeight: 700, color: T.text }}>{insight.title}</div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                    <Badge color={insight.color}>{insight.type.toUpperCase()}</Badge>
                    <span style={{ fontSize: 10, fontFamily: T.fM, color: T.textMuted }}>{insight.time}</span>
                  </div>
                </div>
                <div style={{ fontSize: 12, fontFamily: T.fM, color: T.textSub, lineHeight: 1.6 }}>{insight.body}</div>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Life Analytics */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <GlassCard style={{ padding: '20px 24px' }}>
          <div style={{ fontSize: 10, fontFamily: T.fM, color: T.textSub, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>Habit-Productivity Correlation</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { habit:'Meditation', impact:'+34% focus score', color:T.accent, val:34 },
              { habit:'Exercise',   impact:'+28% energy level', color:T.sky,   val:28 },
              { habit:'Sleep 8h+',  impact:'+22% productivity', color:T.violet, val:22 },
              { habit:'Reading',    impact:'+18% decision quality', color:T.emerald, val:18 },
            ].map((item, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, fontFamily: T.fM, color: T.text }}>{item.habit}</span>
                  <span style={{ fontSize: 11, fontFamily: T.fM, color: item.color }}>{item.impact}</span>
                </div>
                <ProgressBar pct={item.val * 2.5} color={item.color} height={4} />
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard style={{ padding: '20px 24px' }}>
          <div style={{ fontSize: 10, fontFamily: T.fM, color: T.textSub, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>Life Domain Scores</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {LIFE_STATS.map((stat, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, fontFamily: T.fM, color: T.text }}>{stat.label}</span>
                  <span style={{ fontSize: 11, fontFamily: T.fM, color: stat.color, fontWeight: 600 }}>{stat.val}/100</span>
                </div>
                <ProgressBar pct={stat.val} color={stat.color} height={5} />
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

// ── ARCHIVE PAGE ───────────────────────────────────────────────────────────────
function ArchivePage() {
  return (
    <div style={{ animation: 'fadeUp 0.4s ease' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontFamily: T.fM, color: T.textSub, letterSpacing: '0.1em', marginBottom: 6, textTransform: 'uppercase' }}>Archive</div>
        <h1 style={{ fontSize: 28, fontFamily: T.fD, fontWeight: 800, color: T.text }}>Life History</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <GlassCard style={{ padding: '20px 24px' }}>
          <div style={{ fontSize: 10, fontFamily: T.fM, color: T.textSub, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>Net Worth History</div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={NETWORTH_TREND} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="archGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={T.accent} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={T.accent} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 4" stroke={T.border} vertical={false} />
              <XAxis dataKey="m" tick={{ fill: T.textSub, fontSize: 10, fontFamily: T.fM }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip content={<CHART_TOOLTIP prefix="$" />} />
              <Area type="monotone" dataKey="v" stroke={T.accent} strokeWidth={2} fill="url(#archGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </GlassCard>

        <GlassCard style={{ padding: '20px 24px' }}>
          <div style={{ fontSize: 10, fontFamily: T.fM, color: T.textSub, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>Monthly Summary — March 2026</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label:'Total Income',   val:'$7,600',  color:T.emerald },
              { label:'Total Expenses', val:'$3,255',  color:T.rose    },
              { label:'Net Saved',      val:'$4,345',  color:T.accent  },
              { label:'Habits Logged',  val:'38 days', color:T.violet  },
              { label:'Workouts',       val:'9 sessions', color:T.sky  },
              { label:'XP Earned',      val:'+380 XP', color:T.amber   },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < 5 ? `1px solid ${T.border}` : 'none' }}>
                <span style={{ fontSize: 12, fontFamily: T.fM, color: T.textSub }}>{item.label}</span>
                <span style={{ fontSize: 12, fontFamily: T.fM, color: item.color, fontWeight: 600 }}>{item.val}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

// ── SETTINGS PAGE ──────────────────────────────────────────────────────────────
function SettingsPage() {
  const [notifications, setNotifications] = useState(true);
  const [aiCoach, setAiCoach] = useState(true);
  const [weekStart, setWeekStart] = useState('monday');

  const Toggle = ({ val, onChange }) => (
    <button onClick={() => onChange(!val)} style={{
      width: 40, height: 22, borderRadius: 99, position: 'relative',
      background: val ? T.accentDim : T.surface,
      border: `1px solid ${val ? T.accent + '44' : T.border}`,
      transition: 'all 0.2s',
    }}>
      <div style={{
        position: 'absolute', top: 3, left: val ? 20 : 3,
        width: 14, height: 14, borderRadius: '50%',
        background: val ? T.accent : T.textMuted,
        transition: 'all 0.2s',
        boxShadow: val ? `0 0 6px ${T.accent}` : 'none',
      }} />
    </button>
  );

  return (
    <div style={{ animation: 'fadeUp 0.4s ease' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontFamily: T.fM, color: T.textSub, letterSpacing: '0.1em', marginBottom: 6, textTransform: 'uppercase' }}>System</div>
        <h1 style={{ fontSize: 28, fontFamily: T.fD, fontWeight: 800, color: T.text }}>Settings</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Profile */}
        <GlassCard style={{ padding: '24px' }}>
          <div style={{ fontSize: 10, fontFamily: T.fM, color: T.textSub, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>Profile</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: `linear-gradient(135deg, ${T.violet}, ${T.accent})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, fontWeight: 800, color: T.bg, fontFamily: T.fD,
            }}>A</div>
            <div>
              <div style={{ fontSize: 16, fontFamily: T.fD, fontWeight: 700, color: T.text }}>Alex Johnson</div>
              <div style={{ fontSize: 11, fontFamily: T.fM, color: T.textSub, marginTop: 2 }}>alex@example.com</div>
              <Badge color={T.violet} style={{ marginTop: 4 }}>Level 34 · Achiever</Badge>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {['Display Name','Email','Currency','Timezone'].map((f, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < 3 ? `1px solid ${T.border}` : 'none' }}>
                <span style={{ fontSize: 12, fontFamily: T.fM, color: T.textSub }}>{f}</span>
                <span style={{ fontSize: 12, fontFamily: T.fM, color: T.text }}>
                  {['Alex Johnson', 'alex@example.com', 'USD', 'Pacific (PT)'][i]}
                </span>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Preferences */}
        <GlassCard style={{ padding: '24px' }}>
          <div style={{ fontSize: 10, fontFamily: T.fM, color: T.textSub, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>Preferences</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { label:'AI Daily Brief', sub:'Personalized morning insights', val:true },
              { label:'AI Coach Alerts', sub:'Proactive life optimization tips', val:aiCoach, set:setAiCoach },
              { label:'Push Notifications', sub:'Habit reminders & alerts', val:notifications, set:setNotifications },
              { label:'Timeline Auto-log', sub:'Auto-detect financial events', val:true },
            ].map((pref, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 12, fontFamily: T.fM, color: T.text }}>{pref.label}</div>
                  <div style={{ fontSize: 10, fontFamily: T.fM, color: T.textSub, marginTop: 2 }}>{pref.sub}</div>
                </div>
                <Toggle val={pref.val} onChange={pref.set || (() => {})} />
              </div>
            ))}
          </div>
        </GlassCard>

        {/* System Status */}
        <GlassCard style={{ padding: '24px', gridColumn: 'span 2' }}>
          <div style={{ fontSize: 10, fontFamily: T.fM, color: T.textSub, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>System Status</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
            {[
              { module:'Finance Engine', status:'Online', color:T.emerald },
              { module:'Health Sync',    status:'Online', color:T.emerald },
              { module:'AI Coach',       status:'Online', color:T.emerald },
              { module:'Timeline',       status:'Online', color:T.emerald },
              { module:'Intelligence',   status:'Online', color:T.emerald },
            ].map((sys, i) => (
              <div key={i} style={{ padding: '12px', borderRadius: T.r, background: T.surface, border: `1px solid ${T.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: sys.color, animation: 'dotPulse 2s infinite' }} />
                  <span style={{ fontSize: 10, fontFamily: T.fM, color: sys.color }}>{sys.status}</span>
                </div>
                <div style={{ fontSize: 11, fontFamily: T.fM, color: T.text }}>{sys.module}</div>
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
  const [page, setPage] = useState('home');

  const VIEW_MAP = {
    home:         <HomePage onNav={setPage} />,
    timeline:     <TimelinePage />,
    money:        <MoneyPage />,
    health:       <HealthPage />,
    growth:       <GrowthPage />,
    knowledge:    <KnowledgePage />,
    intelligence: <IntelligencePage />,
    archive:      <ArchivePage />,
    settings:     <SettingsPage />,
  };

  return (
    <div style={{
      minHeight: '100vh', background: T.bg, color: T.text,
      fontFamily: T.fD, display: 'flex',
    }}>
      {/* Ambient background */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: -200, left: T.sw - 100, width: 600, height: 600,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${T.accent}06 0%, transparent 70%)`,
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: -200, right: 100, width: 500, height: 500,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${T.violet}05 0%, transparent 70%)`,
          pointerEvents: 'none',
        }} />
      </div>

      <Sidebar active={page} onNav={setPage} />

      {/* Main content */}
      <div style={{
        flex: 1, marginLeft: T.sw, minHeight: '100vh',
        display: 'flex', flexDirection: 'column',
        position: 'relative', zIndex: 1,
      }}>
        {/* Top bar */}
        <div style={{
          height: 54, borderBottom: `1px solid ${T.border}`,
          display: 'flex', alignItems: 'center', padding: '0 28px',
          justifyContent: 'space-between',
          background: `${T.bg}dd`,
          backdropFilter: 'blur(20px)',
          position: 'sticky', top: 0, zIndex: 50,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 10, fontFamily: T.fM, color: T.textMuted, letterSpacing: '0.15em' }}>LIFE OS</span>
            <span style={{ color: T.textMuted, fontSize: 12 }}>›</span>
            <span style={{ fontSize: 10, fontFamily: T.fM, color: T.textSub, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{page}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ fontSize: 10, fontFamily: T.fM, color: T.textSub, display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: T.emerald, animation: 'dotPulse 2.5s infinite' }} />
              All Systems Online
            </div>
            <div style={{ fontSize: 10, fontFamily: T.fM, color: T.textMuted }}>
              {new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'})}
            </div>
          </div>
        </div>

        {/* Page content */}
        <div key={page} style={{
          flex: 1, padding: '28px 32px', overflowY: 'auto', maxWidth: 1200,
        }}>
          {VIEW_MAP[page] || <HomePage onNav={setPage} />}
        </div>

        {/* Bottom status bar */}
        <div style={{
          height: 28, borderTop: `1px solid ${T.border}`,
          display: 'flex', alignItems: 'center', padding: '0 28px', gap: 20,
          background: T.bg,
        }}>
          {[
            { label:'NW', val:'$214,700', color:T.accent },
            { label:'XP', val:'Lv 34 · 2,840', color:T.violet },
            { label:'SAVINGS', val:'38%', color:T.emerald },
            { label:'STREAK', val:'21d Meditation 🔥', color:T.amber },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 9, fontFamily: T.fM }}>
              <span style={{ color: T.textMuted, letterSpacing: '0.08em' }}>{item.label}</span>
              <span style={{ color: item.color, fontWeight: 600 }}>{item.val}</span>
              {i < 3 && <span style={{ color: T.textMuted, marginLeft: 8 }}>·</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
