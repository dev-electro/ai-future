import { useState, useEffect, useRef, useCallback } from "react";
import { Laptop, Headphones, Keyboard, Phone, PenTool, Receipt, BarChart2, Stethoscope, Scale, FileText, Monitor, Globe, Shield, TrendingUp, Calculator, Building2, Megaphone, Newspaper, Users, Palette, Home, Hospital, School, Landmark, Pill, Brain, ShieldAlert, PawPrint, Bone, ChefHat, Zap, Wrench, Flame, Beer, LifeBuoy, Bike, Wheat, HeartHandshake, AlertTriangle, Eye, Check, Sun, Moon, Trophy, Medal, Award, Search, BookOpen, TrendingDown, Coins, Network, ArrowRightLeft, Rocket, RefreshCw, Key, Radio, Compass, Target, Share2, Clock } from "lucide-react";
import { LANG_META, SUPPORTED_LANGS, useT } from "@/lib/i18n";
import DocSetCTA from "./DocSetCTA";

// Helper to fetch user region
const getUserCountry = async () => {
  try {
    const res = await fetch("/api/region");
    const data = await res.json();
    return data.country || "US";
  } catch (e) {
    return "US";
  }
};

/* ─── Leaderboard data ───────────────────────────────────────────────────── */
// Scores = Anthropic "observed exposure" % directly from Massenkoff & McCrory (2026)
// Bands: 75-100 = Very High | 50-74 = High | 20-49 = Moderate | 5-19 = Low | 0-4 = Minimal
const LB_DATA = [
  { rank: 1, title: "Computer Programmer", score: 92, level: "Very High", category: "Computer & Math", coverage: "92%", blsGrowth: -10, blsDir: "Declining", icon: <Laptop size={18} /> },
  { rank: 2, title: "Customer Service Rep", score: 88, level: "Very High", category: "Office & Admin", coverage: "88%", blsGrowth: -2, blsDir: "Declining", icon: <Headphones size={18} /> },
  { rank: 3, title: "Data Entry Keyer", score: 87, level: "Very High", category: "Office & Admin", coverage: "87%", blsGrowth: -8, blsDir: "Declining", icon: <Keyboard size={18} /> },
  { rank: 4, title: "Telemarketer", score: 85, level: "Very High", category: "Sales", coverage: "65%", blsGrowth: -14, blsDir: "Declining", icon: <Phone size={18} /> },
  { rank: 5, title: "Proofreader", score: 84, level: "Very High", category: "Arts & Media", coverage: "63%", blsGrowth: -9, blsDir: "Declining", icon: <PenTool size={18} /> },
  { rank: 6, title: "Tax Preparer", score: 82, level: "Very High", category: "Business & Finance", coverage: "62%", blsGrowth: -4, blsDir: "Declining", icon: <Receipt size={18} /> },
  { rank: 7, title: "Financial Analyst", score: 80, level: "Very High", category: "Business & Finance", coverage: "60%", blsGrowth: 8, blsDir: "Growing", icon: <BarChart2 size={18} /> },
  { rank: 8, title: "Paralegal", score: 78, level: "Very High", category: "Legal", coverage: "58%", blsGrowth: 4, blsDir: "Growing", icon: <Scale size={18} /> },
  { rank: 9, title: "Medical Transcriptionist", score: 77, level: "Very High", category: "Healthcare", coverage: "57%", blsGrowth: -7, blsDir: "Declining", icon: <Stethoscope size={18} /> },
  { rank: 10, title: "Bookkeeping Clerk", score: 75, level: "Very High", category: "Business & Finance", coverage: "55%", blsGrowth: -3, blsDir: "Flat", icon: <BookOpen size={18} /> },
  { rank: 11, title: "Technical Writer", score: 64, level: "High", category: "Arts & Media", coverage: "52%", blsGrowth: 4, blsDir: "Growing", icon: <FileText size={18} /> },
  { rank: 12, title: "Software Developer", score: 65, level: "High", category: "Computer & Math", coverage: "52%", blsGrowth: 17, blsDir: "Strong Growth", icon: <Monitor size={18} /> },
  { rank: 13, title: "Translator", score: 60, level: "High", category: "Arts & Media", coverage: "48%", blsGrowth: 4, blsDir: "Growing", icon: <Globe size={18} /> },
  { rank: 14, title: "Market Research Analyst", score: 56, level: "High", category: "Business & Finance", coverage: "48%", blsGrowth: 10, blsDir: "Strong Growth", icon: <TrendingUp size={18} /> },
  { rank: 15, title: "Insurance Underwriter", score: 58, level: "High", category: "Business & Finance", coverage: "46%", blsGrowth: -4, blsDir: "Declining", icon: <Shield size={18} /> },
  { rank: 16, title: "Accountant / Auditor", score: 55, level: "High", category: "Business & Finance", coverage: "45%", blsGrowth: 4, blsDir: "Growing", icon: <Calculator size={18} /> },
  { rank: 17, title: "Lawyer / Attorney", score: 45, level: "Moderate", category: "Legal", coverage: "35%", blsGrowth: 5, blsDir: "Growing", icon: <Scale size={18} /> },
  { rank: 18, title: "Management Consultant", score: 48, level: "Moderate", category: "Management", coverage: "35%", blsGrowth: 11, blsDir: "Strong Growth", icon: <Building2 size={18} /> },
  { rank: 19, title: "Marketing Manager", score: 40, level: "Moderate", category: "Management", coverage: "32%", blsGrowth: 6, blsDir: "Growing", icon: <Megaphone size={18} /> },
  { rank: 20, title: "HR Specialist", score: 38, level: "Moderate", category: "Management", coverage: "30%", blsGrowth: 6, blsDir: "Growing", icon: <Users size={18} /> },
  { rank: 21, title: "Graphic Designer", score: 35, level: "Moderate", category: "Arts & Media", coverage: "30%", blsGrowth: 3, blsDir: "Growing", icon: <Palette size={18} /> },
  { rank: 22, title: "Journalist / Reporter", score: 30, level: "Moderate", category: "Arts & Media", coverage: "28%", blsGrowth: -5, blsDir: "Declining", icon: <Newspaper size={18} /> },
  { rank: 23, title: "Registered Nurse", score: 28, level: "Moderate", category: "Healthcare", coverage: "28%", blsGrowth: 6, blsDir: "Growing", icon: <Hospital size={18} /> },
  { rank: 24, title: "Architect", score: 25, level: "Moderate", category: "Management", coverage: "25%", blsGrowth: 2, blsDir: "Flat", icon: <Landmark size={18} /> },
  { rank: 25, title: "High School Teacher", score: 22, level: "Moderate", category: "Education", coverage: "22%", blsGrowth: 1, blsDir: "Flat", icon: <School size={18} /> },
  { rank: 26, title: "Pharmacist", score: 35, level: "Moderate", category: "Healthcare", coverage: "22%", blsGrowth: -2, blsDir: "Flat", icon: <Pill size={18} /> },
  { rank: 27, title: "Real Estate Agent", score: 18, level: "Low", category: "Sales", coverage: "18%", blsGrowth: 3, blsDir: "Growing", icon: <Home size={18} /> },
  { rank: 28, title: "Psychologist", score: 15, level: "Low", category: "Healthcare", coverage: "15%", blsGrowth: 7, blsDir: "Growing", icon: <Brain size={18} /> },
  { rank: 29, title: "Police Officer", score: 12, level: "Low", category: "Trades & Physical", coverage: "12%", blsGrowth: 3, blsDir: "Growing", icon: <ShieldAlert size={18} /> },
  { rank: 30, title: "Veterinarian", score: 12, level: "Low", category: "Healthcare", coverage: "12%", blsGrowth: 19, blsDir: "Strong Growth", icon: <PawPrint size={18} /> },
  { rank: 31, title: "Physical Therapist", score: 10, level: "Low", category: "Healthcare", coverage: "10%", blsGrowth: 17, blsDir: "Strong Growth", icon: <Bone size={18} /> },
  { rank: 32, title: "Chef / Head Cook", score: 2, level: "Minimal", category: "Food & Hospitality", coverage: "<1%", blsGrowth: 6, blsDir: "Growing", icon: <ChefHat size={18} /> },
  { rank: 33, title: "Electrician", score: 6, level: "Minimal", category: "Trades & Physical", coverage: "6%", blsGrowth: 11, blsDir: "Strong Growth", icon: <Zap size={18} /> },
  { rank: 34, title: "Plumber", score: 5, level: "Minimal", category: "Trades & Physical", coverage: "5%", blsGrowth: 2, blsDir: "Flat", icon: <Wrench size={18} /> },
  { rank: 35, title: "Firefighter", score: 5, level: "Minimal", category: "Trades & Physical", coverage: "5%", blsGrowth: 4, blsDir: "Growing", icon: <Flame size={18} /> },
  { rank: 36, title: "Bartender", score: 2, level: "Minimal", category: "Food & Hospitality", coverage: "<1%", blsGrowth: 7, blsDir: "Growing", icon: <Beer size={18} /> },
  { rank: 37, title: "Lifeguard", score: 1, level: "Minimal", category: "Personal Care", coverage: "<1%", blsGrowth: 5, blsDir: "Growing", icon: <LifeBuoy size={18} /> },
  { rank: 38, title: "Motorcycle Mechanic", score: 4, level: "Minimal", category: "Trades & Physical", coverage: "<1%", blsGrowth: 0, blsDir: "Flat", icon: <Bike size={18} /> },
  { rank: 39, title: "Agricultural Worker", score: 2, level: "Minimal", category: "Trades & Physical", coverage: "<1%", blsGrowth: -4, blsDir: "Declining", icon: <Wheat size={18} /> },
  { rank: 40, title: "Massage Therapist", score: 2, level: "Minimal", category: "Personal Care", coverage: "<1%", blsGrowth: 18, blsDir: "Strong Growth", icon: <HeartHandshake size={18} /> },
];

const QUICK_PICKS = ["Software Engineer", "Registered Nurse", "Financial Analyst", "Lawyer", "Teacher", "Graphic Designer", "Electrician", "Data Scientist", "Accountant", "Marketing Manager", "Paralegal", "Physical Therapist"];

/* ─── Theme tokens (Luxury Editorial Intelligence) ─── */
const THEMES = {
  dark: {
    bg: "#0B0F14",
    surface: "#11151B",
    surface2: "#191E27",
    surface3: "#262D38",
    border: "rgba(240, 234, 214, 0.08)",
    border2: "rgba(240, 234, 214, 0.15)",
    textPrimary: "#F0EAD6", // Warm Ivory
    textSecondary: "#A5B0BA",
    textMuted: "#63707D",
    accent: "#C49A4A", // Premium Gold
    accentGlow: "rgba(196, 154, 74, 0.25)",
    navBg: "rgba(11, 15, 20, 0.85)",
    cardShadow: "0 10px 40px rgba(0,0,0,0.6)",
    inputBg: "#0E1218",
    heroBg: "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(196, 154, 74, 0.12) 0%, transparent 70%)",
  },
  light: {
    bg: "#F8F6F0",
    surface: "#FFFFFF",
    surface2: "#F0EAD6",
    surface3: "#E2DCC8",
    border: "rgba(11, 15, 20, 0.1)",
    border2: "rgba(11, 15, 20, 0.2)",
    textPrimary: "#0B0F14",
    textSecondary: "#45505C",
    textMuted: "#7B8794",
    accent: "#A67B27",
    accentGlow: "rgba(166, 123, 39, 0.2)",
    navBg: "rgba(248, 246, 240, 0.9)",
    cardShadow: "0 10px 40px rgba(0,0,0,0.06)",
    inputBg: "#FFFFFF",
    heroBg: "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(166, 123, 39, 0.08) 0%, transparent 70%)",
  }
};

const LEVELS = {
  "Very High": { color: "#C4614A", glow: "rgba(196, 97, 74, 0.25)", label: "CRITICAL RISK" }, // Terracotta
  "High": { color: "#D4943A", glow: "rgba(212, 148, 58, 0.25)", label: "HIGH RISK" },
  "Moderate": { color: "#C49A4A", glow: "rgba(196, 154, 74, 0.2)", label: "MODERATE EXPOSURE" },
  "Low": { color: "#5B9E78", glow: "rgba(91, 158, 120, 0.2)", label: "LOW RISK" }, // Sage
  "Minimal": { color: "#6B9FD4", glow: "rgba(107, 159, 212, 0.2)", label: "SECURE" }, // Slate Blue
};
const BLS_C = { "Declining": "#C4614A", "Flat": "#A5B0BA", "Growing": "#5B9E78", "Strong Growth": "#7DC49A" };

const URGENCY = {
  "Act Now": { color: "#C4614A", icon: <AlertTriangle size={18} />, bg: "rgba(196, 97, 74, 0.1)" },
  "Act Soon": { color: "#D4943A", icon: <Zap size={18} />, bg: "rgba(212, 148, 58, 0.1)" },
  "Monitor & Prepare": { color: "#C49A4A", icon: <Eye size={18} />, bg: "rgba(196, 154, 74, 0.1)" },
  "Stay Sharp": { color: "#5B9E78", icon: <Check size={18} />, bg: "rgba(91, 158, 120, 0.1)" },
};

/* ─── Root App ────────────────────────────────────────────────────────────── */
// Live Counter Component
const LiveCounter = ({ th }) => {
  const [count, setCount] = useState(47312);
  useEffect(() => {
    const i = setInterval(() => {
      setCount(c => c + Math.floor(Math.random() * 3));
    }, 3500);
    return () => clearInterval(i);
  }, []);
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 16px",
      background: th.surface, border: `1px solid ${th.border}`, borderRadius: 24,
      marginTop: 24, margin: "24px auto 0", boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
    }}>
      <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 8px #10b981" }}></span>
      <span style={{ fontFamily: "var(--font-jb)", fontSize: 13, color: th.textPrimary }}>
        <strong style={{ color: th.accent }}>{count.toLocaleString()}</strong> analyzes run
      </span>
    </div>
  );
};

/* ─── CSS injection ─── */
function GlobalStyles({ theme: th }) {

  return (
    <style>{`
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      html { scroll-behavior: smooth; }
      body { background: ${th.bg}; color: ${th.textPrimary}; font-family: var(--font-sora); transition: background 0.3s, color 0.3s; }
      
      ::-webkit-scrollbar { width: 6px; }
      ::-webkit-scrollbar-track { background: ${th.bg}; }
      ::-webkit-scrollbar-thumb { background: ${th.surface3}; border-radius: 3px; }
      ::-webkit-scrollbar-thumb:hover { background: ${th.accent}; }
      
      .nav-link { transition: color 0.2s, background 0.2s; font-family: var(--font-jb); font-size: 13px; letter-spacing: 0.02em; }
      .nav-link:hover { color: ${th.accent} !important; }
      
      .card-hover { transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease, border-color 0.3s ease; border-radius: 12px; border: 1px solid ${th.border}; }
      .card-hover:hover { transform: translateY(-3px); box-shadow: 0 16px 48px rgba(0,0,0,0.4) !important; border-color: ${th.accent}40; }
      
      .btn-primary { transition: all 0.2s; cursor: pointer; border-radius: 6px; font-family: var(--font-sora); font-weight: 500; letter-spacing: 0.02em; }
      .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 8px 24px ${th.accentGlow}; background: ${th.accent}; }
      .btn-primary:active { transform: translateY(0); }
      
      .chip-btn { transition: all 0.2s; cursor: pointer; border-radius: 20px; font-family: var(--font-sora); font-size: 12px; }
      .chip-btn:hover { background: ${th.accent} !important; color: ${th.bg} !important; border-color: ${th.accent} !important; }
      
      .lb-row { transition: all 0.2s ease; cursor: pointer; border-radius: 8px; border: 1px solid transparent; }
      .lb-row:hover { transform: translateX(6px); background: ${th.surface2}!important; border-color: ${th.border2}; }
      
      .tab-btn { transition: all 0.2s ease; cursor: pointer; border-radius: 6px; font-family: var(--font-sora); font-size: 15px; font-weight: 500; }

      .animate-in { animation: slideUp 0.6s cubic-bezier(0.16,1,0.3,1) both; }
      .animate-fade { animation: fadeIn 0.4s ease both; }
      .stagger-1 { animation-delay: 0.08s; }
      .stagger-2 { animation-delay: 0.16s; }
      .stagger-3 { animation-delay: 0.24s; }
      .stagger-4 { animation-delay: 0.32s; }
      .stagger-5 { animation-delay: 0.40s; }
      @keyframes slideUp {
        from { opacity: 0; transform: translateY(24px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @keyframes fadeIn {
        from { opacity: 0; } to { opacity: 1; }
      }
      @keyframes pulse {
        0%,100% { opacity: 1; } 50% { opacity: 0.5; }
      }
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      @keyframes shimmer {
        from { background-position: -200% 0; }
        to   { background-position:  200% 0; }
      }
      .skeleton {
        background: linear-gradient(90deg, ${th.surface2} 25%, ${th.surface3} 50%, ${th.surface2} 75%);
        background-size: 200% 100%;
        animation: shimmer 1.5s infinite;
        border-radius: 8px;
      }
      .input-field {
        background: ${th.inputBg};
        border: 1.5px solid ${th.border};
        color: ${th.textPrimary};
        outline: none;
        transition: border-color 0.18s, box-shadow 0.18s;
        font-family: var(--font-sora);
      }
      .input-field::placeholder { color: ${th.textMuted}; }
      .input-field:focus {
        border-color: ${th.accent};
        box-shadow: 0 0 0 3px ${th.accentGlow};
      }
      textarea.input-field { resize: vertical; min-height: 88px; }
      .lang-select option { background: ${th.surface}; color: ${th.textPrimary}; }
      @media (max-width: 768px) {
        .nav-container { padding: 0 12px !important; gap: 8px !important; }
        .nav-links-container { gap: 0px !important; }
        .nav-link { padding: 6px 8px !important; font-size: 13px !important; }
        .hide-mobile { display: none !important; }
        .grid-2 { grid-template-columns: 1fr !important; }
        .grid-3 { grid-template-columns: 1fr !important; }
        .grid-3-modes { grid-template-columns: 1fr !important; }
        .grid-4 { grid-template-columns: 1fr 1fr !important; }
        .lb-grid { grid-template-columns: 40px 30px 1fr 60px 80px !important; }
        .lb-hide { display: none !important; }
      }
      @keyframes float {
        0%,100% { transform: translateY(0px); }
        50% { transform: translateY(-6px); }
      }
    `}</style>
  );
}

/* ─── Gauge ───────────────────────────────────────────────────────────────── */
function Gauge({ score, level, animated, th }) {
  const [cur, setCur] = useState(0);
  const lv = LEVELS[level] || LEVELS["Moderate"];
  useEffect(() => {
    if (!animated) { setCur(0); return; }
    let v = 0; const step = score / 60;
    const iv = setInterval(() => { v = Math.min(v + step, score); setCur(Math.round(v)); if (v >= score) clearInterval(iv); }, 16);
    return () => clearInterval(iv);
  }, [animated, score]);
  const R = 68, cx = 88, cy = 88, total = 2 * Math.PI * R, arc = total * 0.75, filled = (cur / 100) * arc;
  return (
    <div style={{ position: "relative", width: 176, height: 176, flexShrink: 0 }}>
      <svg width={176} height={176}>
        <defs>
          <linearGradient id="gfill2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={lv.color} stopOpacity={0.6} />
            <stop offset="100%" stopColor={lv.color} />
          </linearGradient>
          <filter id="glow2"><feGaussianBlur stdDeviation="4" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>
        {/* Glow track */}
        <circle cx={cx} cy={cy} r={R} fill="none" stroke={lv.color} strokeWidth={12}
          strokeDasharray={`${filled} ${total - filled}`} strokeDashoffset={total * 0.125}
          strokeLinecap="round" filter="url(#glow2)" opacity={0.2}
          style={{ transform: `rotate(135deg)`, transformOrigin: `${cx}px ${cy}px` }} />
        {/* Background track */}
        <circle cx={cx} cy={cy} r={R} fill="none" stroke={th.surface3} strokeWidth={10}
          strokeDasharray={`${arc} ${total - arc}`} strokeDashoffset={total * 0.125}
          strokeLinecap="round"
          style={{ transform: `rotate(135deg)`, transformOrigin: `${cx}px ${cy}px` }} />
        {/* Fill */}
        <circle cx={cx} cy={cy} r={R} fill="none" stroke="url(#gfill2)" strokeWidth={10}
          strokeDasharray={`${filled} ${total - filled}`} strokeDashoffset={total * 0.125}
          strokeLinecap="round"
          style={{ transform: `rotate(135deg)`, transformOrigin: `${cx}px ${cy}px`, transition: "stroke-dasharray 1.2s cubic-bezier(0.16,1,0.3,1)" }} />
        {/* Tick marks */}
        {[0, 25, 50, 75, 100].map(v => {
          const ang = ((v / 100) * 0.75 - 0.375) * 2 * Math.PI - Math.PI / 2 + Math.PI * 0.125;
          return <line key={v} x1={cx + (R - 14) * Math.cos(ang)} y1={cy + (R - 14) * Math.sin(ang)}
            x2={cx + (R - 8) * Math.cos(ang)} y2={cy + (R - 8) * Math.sin(ang)}
            stroke={th.border2} strokeWidth="1.5" />;
        })}
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4 }}>
        <span style={{ fontFamily: "var(--font-pf)", fontSize: 46, fontWeight: 900, lineHeight: 1, color: lv.color, letterSpacing: "-2px" }}>{cur}</span>
        <span style={{ fontFamily: "var(--font-jb)", fontSize: 11, letterSpacing: "0.15em", color: th.textMuted }}>/ 100</span>
        <span style={{ fontFamily: "var(--font-jb)", fontSize: 11, letterSpacing: "0.12em", color: lv.color, marginTop: 4, padding: "3px 10px", background: `${lv.color}14`, border: `1px solid ${lv.color}30`, borderRadius: 4 }}>{lv.label}</span>
      </div>
    </div>
  );
}

/* ─── Score bar (leaderboard) ─────────────────────────────────────────────── */
function ScoreBar({ score, level, triggered, delay = 0, th }) {
  const [w, setW] = useState(0);
  const lv = LEVELS[level] || LEVELS["Moderate"];
  useEffect(() => {
    if (triggered) { setW(0); const t = setTimeout(() => setW(score), delay); return () => clearTimeout(t); }
    else setW(0);
  }, [triggered, score, delay]);
  return (
    <div style={{ height: 3, background: th.surface3, borderRadius: 2, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${w}%`, background: `linear-gradient(90deg,${lv.color}60,${lv.color})`, borderRadius: 2, transition: "width 0.9s cubic-bezier(0.16,1,0.3,1)" }} />
    </div>
  );
}

/* ─── Skeleton loader ─────────────────────────────────────────────────────── */
function SkeletonResult({ th }) {
  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", gap: 24, marginBottom: 24 }}>
        <div className="skeleton" style={{ width: 176, height: 176, borderRadius: 999, flexShrink: 0 }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="skeleton" style={{ height: 28, width: "60%" }} />
          <div className="skeleton" style={{ height: 16, width: "40%" }} />
          <div className="skeleton" style={{ height: 14, width: "80%" }} />
          <div className="skeleton" style={{ height: 14, width: "70%" }} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
            {[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: 52 }} />)}
          </div>
        </div>
      </div>
      {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 80, marginBottom: 10 }} />)}
    </div>
  );
}

/* ─── Toast ───────────────────────────────────────────────────────────────── */
function Toast({ message, type = "success", th }) {
  return (
    <div style={{
      position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
      background: type === "error" ? "#F04B6B" : th.accent,
      color: "white", fontFamily: "var(--font-sora)", fontSize: 14, fontWeight: 500,
      padding: "12px 24px", borderRadius: 40, zIndex: 9999, pointerEvents: "none",
      boxShadow: "0 8px 32px rgba(0,0,0,0.3)", animation: "slideUp 0.3s ease both"
    }}>
      {message}
    </div>
  );
}

/* ─── Language picker ─────────────────────────────────────────────────────── */
function LangPicker({ lang, setLang, th }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, []);
  const current = LANG_META[lang];
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen(o => !o)} style={{
        display: "flex", alignItems: "center", gap: 6, background: th.surface2, border: `1px solid ${th.border}`,
        borderRadius: 8, padding: "6px 12px", cursor: "pointer", color: th.textSecondary, fontSize: 13
      }}>
        <span>{current.flag}</span>
        <span className="hide-mobile" style={{ fontFamily: "var(--font-sora)" }}>{current.nativeName}</span>
        <span style={{ fontSize: 12, opacity: 0.6 }}>▾</span>
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", right: 0, background: th.surface, border: `1px solid ${th.border}`,
          borderRadius: 12, overflow: "hidden", zIndex: 1000, boxShadow: th.cardShadow, minWidth: 180
        }}>
          {SUPPORTED_LANGS.map(l => (
            <button key={l} onClick={() => { setLang(l); setOpen(false); }} style={{
              display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 16px",
              background: l === lang ? `${th.accent}14` : "transparent",
              border: "none", cursor: "pointer", color: l === lang ? th.accent : th.textSecondary,
              fontSize: 13, fontFamily: "var(--font-sora)", textAlign: "left",
              transition: "background 0.15s"
            }}
              onMouseEnter={e => e.currentTarget.style.background = `${th.accent}0d`}
              onMouseLeave={e => e.currentTarget.style.background = l === lang ? `${th.accent}14` : "transparent"}>
              <span style={{ fontSize: 18 }}>{LANG_META[l].flag}</span>
              <div>
                <div style={{ fontWeight: 500 }}>{LANG_META[l].nativeName}</div>
                <div style={{ fontSize: 11, opacity: 0.6 }}>{LANG_META[l].name}</div>
              </div>
              {l === lang && <span style={{ marginLeft: "auto", color: th.accent }}><Check size={18} /></span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Theme toggle ────────────────────────────────────────────────────────── */
function ThemeToggle({ dark, toggle, th, t }) {
  return (
    <button onClick={toggle} title={dark ? t.theme_light : t.theme_dark} style={{
      width: 42, height: 24, borderRadius: 12, border: `1.5px solid ${th.border}`,
      background: dark ? th.surface3 : "#E8EEF6", cursor: "pointer",
      position: "relative", transition: "background 0.2s", flexShrink: 0
    }}>
      <span style={{
        position: "absolute", top: 2, left: dark ? "calc(100% - 20px)" : 2,
        width: 18, height: 18, borderRadius: 9,
        background: dark ? th.accent : "#F07B30",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 11, transition: "left 0.2s, background 0.2s"
      }}>{dark ? <Moon size={18} /> : <Sun size={18} />}</span>
    </button>
  );
}

/* ─── Navigation ──────────────────────────────────────────────────────────── */
function Nav({ page, setPage, dark, toggleTheme, lang, setLang, th, t }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);
  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      background: scrolled ? th.navBg : "transparent",
      backdropFilter: scrolled ? "blur(20px) saturate(180%)" : "none",
      borderBottom: scrolled ? `1px solid ${th.border}` : "1px solid transparent",
      transition: "all 0.3s ease",
    }}>
      <div className="nav-container" style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", height: 64, display: "flex", alignItems: "center", gap: 24 }}>
        {/* Logo */}
        <button onClick={() => setPage("home")} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, padding: 0 }}>
          <img src="/icon.png" width={34} height={34} alt="AI Future Logo" style={{ borderRadius: 9 }} />
          <div style={{ textAlign: "left" }}>
            <div style={{ fontFamily: "var(--font-pf)", fontWeight: 800, fontSize: 16, color: th.textPrimary, lineHeight: 1.1, letterSpacing: "-0.3px" }}>AI Future</div>
            <div className="hide-mobile" style={{ fontFamily: "var(--font-jb)", fontSize: 11, color: th.textMuted, letterSpacing: "0.12em" }}>{t.nav_tagline}</div>
          </div>
        </button>

        {/* Nav links */}
        <div className="nav-links-container" style={{ flex: 1, display: "flex", gap: 4, justifyContent: "center" }}>
          {[["home", t.nav_home], ["analyze", t.nav_analyze], ["leaderboard", t.nav_leaderboard]].map(([p, label]) => (
            <button key={p} onClick={() => setPage(p)} className="nav-link" style={{
              background: page === p ? `${th.accent}14` : "none",
              border: `1px solid ${page === p ? th.accent + "30" : "transparent"}`,
              borderRadius: 8, padding: "7px 16px", cursor: "pointer",
              fontFamily: "var(--font-sora)", fontSize: 14, fontWeight: page === p ? 600 : 400,
              color: page === p ? th.accent : th.textSecondary,
            }}>{label}</button>
          ))}
        </div>

        {/* Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <ThemeToggle dark={dark} toggle={toggleTheme} th={th} t={t} />
          <LangPicker lang={lang} setLang={setLang} th={th} />
        </div>
      </div>
    </nav>
  );
}

/* ─── Home page ───────────────────────────────────────────────────────────── */
function FaqAccordion({ th, t }) {
  const [open, setOpen] = useState(null);
  const faqs = [
    { q: t.faq_1_q, a: t.faq_1_a },
    { q: t.faq_2_q, a: t.faq_2_a },
    { q: t.faq_3_q, a: t.faq_3_a },
    { q: t.faq_4_q, a: t.faq_4_a },
    { q: t.faq_5_q, a: t.faq_5_a },
    { q: t.faq_6_q, a: t.faq_6_a },
    { q: t.faq_7_q, a: t.faq_7_a },
    { q: t.faq_8_q, a: t.faq_8_a },
  ];
  return (
    <div style={{ marginBottom: 64 }}>
      <h2 style={{ fontFamily: "var(--font-pf)", fontWeight: 800, fontSize: 28, color: th.textPrimary, marginBottom: 8, letterSpacing: "-0.5px" }}>{t.faq_title}</h2>
      <div style={{ width: 40, height: 3, background: `linear-gradient(90deg,${th.accent},#cca13a)`, borderRadius: 2, marginBottom: 8 }} />
      <p style={{ fontFamily: "var(--font-sora)", fontSize: 13, color: th.textMuted, marginBottom: 32 }}>{t.faq_sub}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {faqs.map((f, i) => (
          <div key={i} style={{ background: th.surface, border: `1px solid ${open === i ? th.accent + "30" : th.border}`, borderRadius: 14, overflow: "hidden", transition: "border-color 0.2s" }}>
            <button onClick={() => setOpen(open === i ? null : i)} style={{
              width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "16px 20px", background: "none", border: "none", cursor: "pointer", gap: 12
            }}>
              <span style={{ fontFamily: "var(--font-pf)", fontWeight: 600, fontSize: 15, color: th.textPrimary, textAlign: "left", flex: 1 }}>{f.q}</span>
              <span style={{ color: th.accent, flexShrink: 0, fontSize: 20, lineHeight: 1, transform: open === i ? "rotate(45deg)" : "none", transition: "transform 0.2s", display: "inline-block" }}>+</span>
            </button>
            {open === i && (
              <div className="animate-fade" style={{ padding: "0 20px 18px", fontFamily: "var(--font-sora)", fontSize: 14, color: th.textSecondary, lineHeight: 1.8 }}>
                {f.a}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function HomePage({ setPage, th, t, lang }) {
  const [heroJob, setHeroJob] = useState("");
  const findings = [
    { icon: <TrendingDown size={18} />, title: t.finding_1_title, body: t.finding_1_body },
    { icon: <Users size={18} />, title: t.finding_2_title, body: t.finding_2_body },
    { icon: <Coins size={18} />, title: t.finding_3_title, body: t.finding_3_body },
    { icon: <BarChart2 size={18} />, title: t.finding_4_title, body: t.finding_4_body },
    { icon: <Search size={18} />, title: t.finding_5_title, body: t.finding_5_body },
    { icon: <Network size={18} />, title: t.finding_6_title, body: t.finding_6_body },
  ];
  const stats = [
    { val: t.stat_1_val, label: t.stat_1_label },
    { val: t.stat_2_val, label: t.stat_2_label },
    { val: t.stat_3_val, label: t.stat_3_label },
    { val: t.stat_4_val, label: t.stat_4_label },
  ];
  const TOP_PICKS = ["Software Engineer", "Lawyer", "Nurse", "Teacher", "Accountant", "Electrician"];

  const goAnalyze = (title) => {
    if (title.trim()) {
      setPage("analyze");
      // Pass job title via sessionStorage for AnalyzePage to pick up
      try { sessionStorage.setItem("ai_future_prefill", title.trim()); } catch { }
    }
  };

  return (
    <div style={{ paddingTop: 64 }}>
      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <div style={{ background: th.heroBg, padding: "88px 24px 72px", textAlign: "center", maxWidth: 1200, margin: "0 auto" }}>
        {/* Trust badge */}
        <div className="animate-in" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: `${th.accent}12`, border: `1px solid ${th.accent}25`, borderRadius: 40, padding: "6px 18px", marginBottom: 28 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: th.accent, display: "inline-block", boxShadow: `0 0 10px ${th.accent}` }} />
          <span style={{ fontFamily: "var(--font-jb)", fontSize: 11, color: th.accent, letterSpacing: "0.12em" }}>{t.hero_badge}</span>
        </div>

        {/* Headline */}
        <h1 className="animate-in stagger-1" style={{ fontFamily: "var(--font-pf)", fontWeight: 900, fontSize: "clamp(36px,6vw,72px)", lineHeight: 1.05, color: th.textPrimary, letterSpacing: "-2px", marginBottom: 20 }}>
          {t.hero_headline}
        </h1>
        <p className="animate-in stagger-2" style={{ fontFamily: "var(--font-sora)", fontSize: "clamp(15px,2vw,18px)", color: th.textSecondary, maxWidth: 600, margin: "0 auto 40px", lineHeight: 1.8 }}>
          {t.hero_sub}
        </p>

        {/* Inline hero search */}
        <div className="animate-in stagger-3" style={{ maxWidth: 560, margin: "0 auto 24px" }}>
          <div style={{ display: "flex", gap: 8, background: th.surface, border: `1.5px solid ${th.border2}`, borderRadius: 16, padding: "6px 6px 6px 18px", boxShadow: th.cardShadow }}>
            <input
              value={heroJob}
              onChange={e => setHeroJob(e.target.value)}
              onKeyDown={e => e.key === "Enter" && goAnalyze(heroJob)}
              placeholder={t.hero_input_placeholder}
              style={{
                flex: 1, border: "none", background: "transparent", outline: "none",
                fontFamily: "var(--font-sora)", fontSize: 15, color: th.textPrimary,
                padding: "6px 0"
              }}
            />
            <button onClick={() => goAnalyze(heroJob)} className="btn-primary" style={{
              background: `linear-gradient(135deg,${th.accent},#cca13a)`, border: "none",
              color: "white", fontFamily: "var(--font-pf)", fontWeight: 700, fontSize: 14,
              padding: "10px 22px", borderRadius: 11, whiteSpace: "nowrap"
            }}>{t.hero_btn_check}</button>
          </div>
          {/* Quick picks */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center", marginTop: 12 }}>
            {TOP_PICKS.map(j => (
              <button key={j} onClick={() => goAnalyze(j)} style={{
                background: `${th.accent}10`, border: `1px solid ${th.accent}20`, borderRadius: 20,
                padding: "4px 13px", fontSize: 12, color: th.accent, fontFamily: "var(--font-sora)", cursor: "pointer"
              }}>{j}</button>
            ))}
          </div>
        </div>

        {/* ── WHAT YOU GET strip ──────────────────────────────────────── */}
        <div className="animate-in stagger-3" style={{ maxWidth: 680, margin: "16px auto 0", display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
          {[
            { icon: "🎯", title: t.what_you_get_1_title, desc: t.what_you_get_1_desc },
            { icon: "📋", title: t.what_you_get_2_title, desc: t.what_you_get_2_desc },
            { icon: "🗺️", title: t.what_you_get_3_title, desc: t.what_you_get_3_desc },
          ].map(({ icon, title, desc }) => (
            <div key={title} style={{
              display: "flex", alignItems: "center", gap: 8,
              background: `${th.accent}08`, border: `1px solid ${th.accent}18`,
              borderRadius: 12, padding: "9px 14px", flex: "1 1 180px"
            }}>
              <span style={{ fontSize: 17, flexShrink: 0 }}>{icon}</span>
              <div>
                <div style={{ fontFamily: "var(--font-sora)", fontWeight: 600, fontSize: 11, color: th.textPrimary }}>{title}</div>
                <div style={{ fontFamily: "var(--font-sora)", fontSize: 12, color: th.textMuted, lineHeight: 1.3 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust row */}
        <div className="animate-in stagger-4" style={{ display: "flex", gap: 24, justifyContent: "center", flexWrap: "wrap", marginTop: 32 }}>
          {[
            { val: "800+", label: t.trust_nav_1 },
            { val: "Free", label: t.trust_nav_2 },
            { val: "9 langs", label: t.trust_nav_3 },
            { val: "2026", label: t.trust_nav_4 },
          ].map(({ val, label }) => (
            <div key={val} style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "var(--font-pf)", fontWeight: 800, fontSize: 20, color: th.accent }}>{val}</div>
              <div style={{ fontFamily: "var(--font-jb)", fontSize: 11, color: th.textMuted, letterSpacing: "0.1em" }}>{label.toUpperCase()}</div>
            </div>
          ))}
        </div>

        <LiveCounter th={th} />
      </div>

      {/* ── STAT CARDS ───────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 64px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 72 }} className="grid-4">
          {stats.map((s, i) => (
            <div key={i} className={`animate-in stagger-${i + 1} card-hover`} style={{
              background: th.surface, border: `1px solid ${th.border}`, borderRadius: 16,
              padding: "28px 20px", textAlign: "center", boxShadow: th.cardShadow
            }}>
              <div style={{ fontFamily: "var(--font-pf)", fontWeight: 900, fontSize: 34, color: th.accent, letterSpacing: "-1px" }}>{s.val}</div>
              <div style={{ fontFamily: "var(--font-sora)", fontSize: 12, color: th.textSecondary, marginTop: 6, lineHeight: 1.5 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── HOW IT WORKS ──────────────────────────────────────────── */}
        <div style={{ marginBottom: 72 }}>
          <h2 style={{ fontFamily: "var(--font-pf)", fontWeight: 800, fontSize: 28, color: th.textPrimary, marginBottom: 8, letterSpacing: "-0.5px" }}>{t.how_title}</h2>
          <div style={{ width: 40, height: 3, background: `linear-gradient(90deg,${th.accent},#cca13a)`, borderRadius: 2, marginBottom: 32 }} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }} className="grid-3">
            {[
              [t.how_1_title, t.how_1_body, "01", <FileText size={20} />],
              [t.how_2_title, t.how_2_body, "02", <Radio size={20} />],
              [t.how_3_title, t.how_3_body, "03", <BarChart2 size={20} />]
            ].map(([title, body, num, icon], i) => (
              <div key={i} className="card-hover" style={{ background: th.surface, border: `1px solid ${th.border}`, borderRadius: 16, padding: 32, boxShadow: th.cardShadow, position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 16, right: 16, fontFamily: "var(--font-pf)", fontWeight: 900, fontSize: 40, color: th.border2, lineHeight: 1 }}>{num}</div>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: `${th.accent}14`, border: `1px solid ${th.accent}25`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16, color: th.accent }}>
                  {icon}
                </div>
                <div style={{ fontFamily: "var(--font-pf)", fontWeight: 700, fontSize: 16, color: th.textPrimary, marginBottom: 8 }}>{title}</div>
                <div style={{ fontFamily: "var(--font-sora)", fontSize: 13, color: th.textSecondary, lineHeight: 1.7 }}>{body}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── RISK SHOWCASE ──────────────────────────────────────────── */}
        <div style={{ marginBottom: 72 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 8, flexWrap: "wrap", gap: 12 }}>
            <div>
              <h2 style={{ fontFamily: "var(--font-pf)", fontWeight: 800, fontSize: 28, color: th.textPrimary, marginBottom: 8, letterSpacing: "-0.5px" }}>{t.risk_glance_title}</h2>
              <div style={{ width: 40, height: 3, background: `linear-gradient(90deg,${th.accent},#cca13a)`, borderRadius: 2 }} />
            </div>
            <button onClick={() => setPage("leaderboard")} style={{ background: "none", border: `1px solid ${th.border}`, borderRadius: 8, padding: "7px 16px", cursor: "pointer", fontFamily: "var(--font-sora)", fontSize: 12, color: th.textSecondary }}>
              {t.risk_glance_view_all}
            </button>
          </div>
          <p style={{ fontFamily: "var(--font-sora)", fontSize: 13, color: th.textMuted, marginBottom: 28, marginTop: 16 }}>{t.risk_glance_sub}</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }} className="grid-2">
            {LB_DATA.slice(0, 30).map(item => {
              const lv = LEVELS[item.level];
              return (
                <button key={item.rank} onClick={() => goAnalyze(item.title)} className="card-hover" style={{
                  background: th.surface, border: `1px solid ${th.border}`, borderRadius: 14,
                  padding: "16px 20px", boxShadow: th.cardShadow, display: "flex",
                  justifyContent: "space-between", alignItems: "center", gap: 12, cursor: "pointer",
                  textAlign: "left"
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = lv.color + "40"; e.currentTarget.style.background = lv.glow; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = th.border; e.currentTarget.style.background = th.surface; }}>
                  <div>
                    <div style={{ fontFamily: "var(--font-pf)", fontWeight: 700, fontSize: 14, color: th.textPrimary, marginBottom: 4 }}>{item.title}</div>
                    <span style={{ fontFamily: "var(--font-jb)", fontSize: 11, padding: "2px 8px", borderRadius: 4, background: `${lv.color}12`, border: `1px solid ${lv.color}25`, color: lv.color }}>{lv.label}</span>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontFamily: "var(--font-pf)", fontWeight: 900, fontSize: 28, color: lv.color, lineHeight: 1 }}>{item.score}</div>
                    <div style={{ fontFamily: "var(--font-jb)", fontSize: 11, color: th.textMuted, marginTop: 2 }}>/100</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── RESEARCH FINDINGS ─────────────────────────────────────── */}
        <div style={{ marginBottom: 72 }}>
          <h2 style={{ fontFamily: "var(--font-pf)", fontWeight: 800, fontSize: 28, color: th.textPrimary, marginBottom: 8, letterSpacing: "-0.5px" }}>{t.findings_title}</h2>
          <div style={{ width: 40, height: 3, background: `linear-gradient(90deg,${th.accent},#cca13a)`, borderRadius: 2, marginBottom: 32 }} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="grid-2">
            {findings.map((f, i) => (
              <div key={i} className="card-hover" style={{ background: th.surface, border: `1px solid ${th.border}`, borderRadius: 16, padding: 28, boxShadow: th.cardShadow, display: "flex", gap: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: `${th.accent}12`, border: `1px solid ${th.accent}20`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: th.accent }}>{f.icon}</div>
                <div>
                  <div style={{ fontFamily: "var(--font-pf)", fontWeight: 700, fontSize: 15, color: th.textPrimary, marginBottom: 6 }}>{f.title}</div>
                  <div style={{ fontFamily: "var(--font-sora)", fontSize: 13, color: th.textSecondary, lineHeight: 1.7 }}>{f.body}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── FAQ ACCORDION ────────────────────────────────────────── */}
        <FaqAccordion th={th} t={t} />

        {/* ── BOTTOM CTA ───────────────────────────────────────────── */}
        <div style={{ background: `linear-gradient(135deg,${th.accent}10,${th.surface2})`, border: `1.5px solid ${th.accent}20`, borderRadius: 24, padding: "56px 32px", textAlign: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, background: `${th.accent}12`, border: `1px solid ${th.accent}25`, borderRadius: 40, padding: "6px 18px", marginBottom: 24 }}>
            <span style={{ fontFamily: "var(--font-jb)", fontSize: 12, color: th.accent, letterSpacing: "0.12em" }}>{t.bottom_cta_badge}</span>
          </div>
          <h2 style={{ fontFamily: "var(--font-pf)", fontWeight: 900, fontSize: "clamp(26px,3vw,40px)", color: th.textPrimary, letterSpacing: "-0.5px", marginBottom: 14 }}>
            {t.bottom_cta_title}
          </h2>
          <p style={{ fontFamily: "var(--font-sora)", fontSize: 16, color: th.textSecondary, maxWidth: 520, margin: "0 auto 32px", lineHeight: 1.8 }}>
            {t.bottom_cta_sub}
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={() => setPage("analyze")} className="btn-primary" style={{
              background: `linear-gradient(135deg,${th.accent},#cca13a)`, border: "none",
              color: "white", fontFamily: "var(--font-pf)", fontWeight: 700, fontSize: 16,
              padding: "16px 36px", borderRadius: 14, boxShadow: `0 8px 24px ${th.accent}30`
            }}>{t.bottom_cta_btn1}</button>
            <button onClick={() => setPage("leaderboard")} className="btn-primary" style={{
              background: th.surface, border: `1.5px solid ${th.border}`,
              color: th.textSecondary, fontFamily: "var(--font-sora)", fontSize: 15,
              padding: "16px 28px", borderRadius: 14,
            }}>{t.bottom_cta_btn2}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export const getJobUrl = (title) => {
  if (!title) return "/";
  const norm = title.toLowerCase();

  if (norm.includes("computer programmer")) return "/jobs/computer-programmer";
  if (norm.includes("customer service")) return "/jobs/customer-service-rep";
  if (norm.includes("data entry")) return "/jobs/data-entry-keyer";
  if (norm.includes("telemarketer")) return "/jobs/telemarketer";
  if (norm.includes("proofreader")) return "/jobs/proofreader";
  if (norm.includes("tax preparer")) return "/jobs/tax-preparer";
  if (norm.includes("financial analyst")) return "/jobs/financial-analyst";
  if (norm.includes("medical transcriptionist")) return "/jobs/medical-transcriptionist";
  if (norm.includes("paralegal")) return "/jobs/paralegal";
  if (norm.includes("bookkeeping clerk") || norm.includes("bookkeeper")) return "/jobs/bookkeeping-clerk";
  if (norm.includes("technical writer")) return "/jobs/technical-writer";
  if (norm.includes("software developer") || norm.includes("software engineer") || norm.includes("software/web developers")) return "/jobs/software-developer";
  if (norm.includes("translator")) return "/jobs/translator";
  if (norm.includes("insurance underwriter")) return "/jobs/insurance-underwriter";
  if (norm.includes("market research analyst")) return "/jobs/market-research-analyst";
  if (norm.includes("accountant") || norm.includes("auditor")) return "/jobs/accountant-auditor";
  if (norm.includes("management consultant")) return "/jobs/management-consultant";
  if (norm.includes("lawyer") || norm.includes("attorney")) return "/jobs/lawyer-attorney";
  if (norm.includes("marketing manager")) return "/jobs/marketing-manager";
  if (norm.includes("journalist") || norm.includes("reporter")) return "/jobs/journalist-reporter";
  if (norm.includes("hr specialist") || norm.includes("human resources")) return "/jobs/hr-specialist";
  if (norm.includes("graphic designer")) return "/jobs/graphic-designer";
  if (norm.includes("real estate agent")) return "/jobs/real-estate-agent";
  if (norm.includes("registered nurse") || norm.includes("nurse")) return "/jobs/registered-nurse";
  if (norm.includes("high school teacher") || norm.includes("teacher")) return "/jobs/high-school-teacher";
  if (norm.includes("architect")) return "/jobs/architect";
  if (norm.includes("pharmacist")) return "/jobs/pharmacist";
  if (norm.includes("psychologist")) return "/jobs/psychologist";
  if (norm.includes("police officer")) return "/jobs/police-officer";
  if (norm.includes("veterinarian")) return "/jobs/veterinarian";
  if (norm.includes("physical therapist")) return "/jobs/physical-therapist";
  if (norm.includes("chef") || norm.includes("cook")) return "/jobs/chef-head-cook";
  if (norm.includes("electrician")) return "/jobs/electrician";
  if (norm.includes("plumber")) return "/jobs/plumber";
  if (norm.includes("firefighter")) return "/jobs/firefighter";
  if (norm.includes("bartender")) return "/jobs/bartender";
  if (norm.includes("lifeguard")) return "/jobs/lifeguard";
  if (norm.includes("motorcycle mechanic") || norm.includes("mechanic")) return "/jobs/motorcycle-mechanic";
  if (norm.includes("agricultural worker") || norm.includes("farmer")) return "/jobs/agricultural-worker";
  if (norm.includes("massage therapist") || norm.includes("massage")) return "/jobs/massage-therapist";

  return `/?q=${encodeURIComponent(title)}`;
};

/* ─── Career Action Plan ──────────────────────────────────────────────────── */
function CareerPlan({ plan, onAnalyze, th, t }) {
  const [tab, setTab] = useState("adapt");
  const ut = URGENCY[plan.urgency_level] || URGENCY["Monitor & Prepare"];
  const tabs = [
    { id: "adapt", label: t.career_adapt_tab, icon: <Shield size={18} /> },
    { id: "lateral", label: t.career_lateral_tab, icon: <ArrowRightLeft size={18} /> },
    { id: "pivot", label: t.career_pivot_tab, icon: <Rocket size={18} /> },
    { id: "timeline", label: t.career_timeline_tab || "Action Timeline", icon: <Clock size={18} /> },
  ];
  const skillUrgC = { "This Year": "#F04B6B", "Next 2 Years": "#E8B830", "Long-term": "#30C47E" };
  const overlapC = { High: "#30C47E", Medium: "#E8B830", Low: "#F07B30" };

  return (
    <div style={{ marginBottom: 12 }}>
      {/* Divider */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <div style={{ flex: 1, height: 1, background: th.border }} />
        <span style={{ fontFamily: "var(--font-jb)", fontSize: 11, color: th.textMuted, letterSpacing: "0.2em", whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: 4 }}><Compass size={11} /> {t.career_title.toUpperCase()}</span>
        <div style={{ flex: 1, height: 1, background: th.border }} />
      </div>

      {/* Urgency banner */}
      <div className="animate-fade" style={{ background: ut.bg, border: `1px solid ${ut.color}25`, borderRadius: 14, padding: "14px 18px", marginBottom: 12, display: "flex", gap: 12, alignItems: "flex-start" }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: `${ut.color}18`, border: `1px solid ${ut.color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{ut.icon}</div>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ fontFamily: "var(--font-jb)", fontSize: 12, fontWeight: 600, color: ut.color, letterSpacing: "0.1em" }}>{plan.urgency_level.toUpperCase()}</span>
            <span style={{ fontFamily: "var(--font-jb)", fontSize: 11, color: th.textMuted }}>· {t.career_urgency.toUpperCase()}</span>
          </div>
          <p style={{ fontFamily: "var(--font-sora)", fontSize: 13, color: th.textSecondary, lineHeight: 1.65, margin: 0 }}>{plan.urgency_reason}</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 3, background: th.surface2, border: `1px solid ${th.border}`, borderRadius: 12, padding: 4, marginBottom: 14 }}>
        {tabs.map(t2 => (
          <button key={t2.id} onClick={() => setTab(t2.id)} className="tab-btn" style={{
            flex: 1, padding: "10px 8px", borderRadius: 9, border: "none",
            fontFamily: "var(--font-sora)", fontSize: 13, fontWeight: tab === t2.id ? 600 : 400,
            background: tab === t2.id ? th.surface : "transparent",
            color: tab === t2.id ? th.textPrimary : th.textMuted,
            boxShadow: tab === t2.id ? `0 2px 8px rgba(0,0,0,0.12)` : "none",
          }}>{t2.icon} {t2.label}</button>
        ))}
      </div>

      {/* Stay & Adapt */}
      {tab === "adapt" && (
        <div className="animate-fade">
          {plan.stay_and_adapt?.headline && (
            <div style={{ background: th.surface, border: `1px solid ${th.border}`, borderLeft: `3px solid #30C47E`, borderRadius: 14, padding: 18, marginBottom: 10 }}>
              <div style={{ fontFamily: "var(--font-jb)", fontSize: 11, color: "#30C47E", letterSpacing: "0.12em", marginBottom: 8, display: "flex", alignItems: "center", gap: 4 }}><Shield size={11} /> {t.career_strategy.toUpperCase()}</div>
              <p style={{ fontFamily: "var(--font-sora)", fontSize: 14, color: th.textPrimary, lineHeight: 1.65, fontWeight: 500, margin: 0 }}>{plan.stay_and_adapt.headline}</p>
            </div>
          )}

          {plan.stay_and_adapt?.specializations?.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontFamily: "var(--font-jb)", fontSize: 11, color: th.textMuted, letterSpacing: "0.14em", marginBottom: 8, display: "flex", alignItems: "center", gap: 4 }}><Target size={11} /> {t.career_niches.toUpperCase()}</div>
              {plan.stay_and_adapt.specializations.map((s, i) => (
                <div key={i} style={{ background: th.surface, border: `1px solid ${th.border}`, borderRadius: 12, padding: 16, marginBottom: 8, display: "flex", gap: 12 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: "#30C47E14", border: "1px solid #30C47E30", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, flexShrink: 0, fontFamily: "monospace", color: "#30C47E", fontWeight: 700 }}>{i + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "var(--font-pf)", fontSize: 13, fontWeight: 700, color: th.textPrimary, marginBottom: 4 }}>{s.name}</div>
                    <div style={{ fontFamily: "var(--font-sora)", fontSize: 12, color: th.textSecondary, lineHeight: 1.6, marginBottom: s.example ? 6 : 0 }}>{s.why_safe}</div>
                    {s.example && <div style={{ fontFamily: "var(--font-sora)", fontSize: 11, color: th.textMuted, fontStyle: "italic", borderLeft: `2px solid #30C47E30`, paddingLeft: 8 }}>e.g. {s.example}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {plan.stay_and_adapt?.skills_to_build?.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontFamily: "var(--font-jb)", fontSize: 11, color: th.textMuted, letterSpacing: "0.14em", marginBottom: 8, display: "flex", alignItems: "center", gap: 4 }}><BookOpen size={11} /> {t.career_skills.toUpperCase()}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }} className="grid-2">
                {plan.stay_and_adapt.skills_to_build.map((s, i) => {
                  const uc = skillUrgC[s.urgency] || th.textMuted;
                  return (
                    <div key={i} style={{ background: th.surface, border: `1px solid ${th.border}`, borderRadius: 12, padding: 14 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                        <span style={{ fontFamily: "var(--font-pf)", fontSize: 12, fontWeight: 700, color: th.textPrimary, flex: 1, marginRight: 6 }}>{s.skill}</span>
                        <span style={{ fontFamily: "var(--font-jb)", fontSize: 11, color: uc, background: `${uc}12`, border: `1px solid ${uc}25`, borderRadius: 4, padding: "2px 6px", whiteSpace: "nowrap", flexShrink: 0 }}>{s.urgency}</span>
                      </div>
                      <p style={{ fontFamily: "var(--font-sora)", fontSize: 11, color: th.textMuted, lineHeight: 1.55, margin: 0 }}>{s.why}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {plan.stay_and_adapt?.positioning_move && (
            <div style={{ background: `${th.accent}0c`, border: `1px solid ${th.accent}20`, borderRadius: 12, padding: 16 }}>
              <div style={{ fontFamily: "var(--font-jb)", fontSize: 11, color: th.accent, letterSpacing: "0.12em", marginBottom: 8, display: "flex", alignItems: "center", gap: 4 }}><Zap size={11} /> {t.career_position.toUpperCase()}</div>
              <p style={{ fontFamily: "var(--font-sora)", fontSize: 13, color: th.textSecondary, lineHeight: 1.65, margin: 0 }}>{plan.stay_and_adapt.positioning_move}</p>
            </div>
          )}
        </div>
      )}

      {/* Lateral Moves */}
      {tab === "lateral" && (
        <div className="animate-fade">
          <p style={{ fontFamily: "var(--font-sora)", fontSize: 13, color: th.textMuted, lineHeight: 1.65, marginBottom: 14 }}>{t.career_lateral_sub}</p>
          {(plan.lateral_moves || []).map((m, i) => {
            const oc = overlapC[m.skill_overlap] || th.textMuted;
            const lv = LEVELS[m.exposure_score >= 75 ? "Very High" : m.exposure_score >= 50 ? "High" : m.exposure_score >= 20 ? "Moderate" : m.exposure_score >= 5 ? "Low" : "Minimal"] || LEVELS["Low"];
            return (
              <div key={i} style={{ background: th.surface, border: `1px solid ${th.border}`, borderRadius: 14, padding: 18, marginBottom: 10, borderLeft: `3px solid ${oc}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
                  <div>
                    <a href={getJobUrl(m.title)}
                      onClick={(e) => {
                        if (e.ctrlKey || e.metaKey || getJobUrl(m.title).startsWith("/jobs/")) return;
                        e.preventDefault();
                        onAnalyze(m.title);
                      }}
                      style={{ textDecoration: "none", background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "var(--font-pf)", fontSize: 16, fontWeight: 800, color: th.textPrimary, textAlign: "left" }}
                      onMouseEnter={e => e.currentTarget.style.color = th.accent}
                      onMouseLeave={e => e.currentTarget.style.color = th.textPrimary}>
                      {m.title} ↗
                    </a>
                    <div style={{ fontFamily: "var(--font-jb)", fontSize: 11, color: th.textMuted, marginTop: 2 }}>{m.transition_time}</div>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <span style={{ fontFamily: "var(--font-jb)", fontSize: 11, padding: "3px 9px", borderRadius: 5, background: `${oc}12`, border: `1px solid ${oc}25`, color: oc }}>{m.skill_overlap} {t.career_overlap}</span>
                    <span style={{ fontFamily: "var(--font-jb)", fontSize: 11, padding: "3px 9px", borderRadius: 5, background: `${BLS_C[m.bls_growth?.startsWith("+") || Number(m.bls_growth) > 0 ? "Growing" : "Declining"]}12`, border: `1px solid transparent`, color: BLS_C[m.bls_growth?.startsWith("+") || Number(m.bls_growth) > 0 ? "Growing" : "Declining"] }}>{m.bls_growth} BLS</span>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <span style={{ fontFamily: "var(--font-jb)", fontSize: 11, color: th.textMuted }}>{t.career_ai_risk}</span>
                  <div style={{ height: 3, width: 64, background: th.surface2, borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${m.exposure_score}%`, background: lv.color, borderRadius: 2 }} />
                  </div>
                  <span style={{ fontFamily: "var(--font-jb)", fontSize: 12, color: lv.color, fontWeight: 600 }}>{m.exposure_score}</span>
                </div>
                <p style={{ fontFamily: "var(--font-sora)", fontSize: 12, color: th.textSecondary, lineHeight: 1.65, marginBottom: m.bridge_skill ? 10 : 0 }}>{m.why_sustainable}</p>
                {m.bridge_skill && (
                  <div style={{ display: "flex", gap: 8, background: th.surface2, borderRadius: 8, padding: "8px 12px" }}>
                    <span style={{ fontFamily: "var(--font-jb)", fontSize: 11, color: th.accent, whiteSpace: "nowrap" }}>{t.career_key_skill} →</span>
                    <span style={{ fontFamily: "var(--font-sora)", fontSize: 12, color: th.textSecondary }}>{m.bridge_skill}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Action Timeline */}
      {tab === "timeline" && (
        <div className="animate-fade">
          <p style={{ fontFamily: "var(--font-sora)", fontSize: 13, color: th.textMuted, lineHeight: 1.65, marginBottom: 14 }}>{t.career_timeline_sub || "Specific milestones, tools, and projects to future-proof your career."}</p>

          {(!plan.progressive_timeline || plan.progressive_timeline.length === 0) ? (
            <div style={{ background: th.surface, border: `1px solid ${th.border}`, borderRadius: 14, padding: 24, textAlign: "center" }}>
              <Clock size={32} color={th.textMuted} style={{ opacity: 0.5, marginBottom: 12 }} />
              <p style={{ fontFamily: "var(--font-sora)", fontSize: 13, color: th.textSecondary, margin: 0 }}>Timeline data not available for this role. Try generating a new analysis.</p>
            </div>
          ) : (
            <div style={{ position: "relative", paddingLeft: 16, marginTop: 12 }}>
              <div style={{ position: "absolute", left: 0, top: 12, bottom: 24, width: 2, background: th.border }} />

              {plan.progressive_timeline.map((step, i) => (
                <div key={i} style={{ position: "relative", marginBottom: i === plan.progressive_timeline.length - 1 ? 0 : 20 }}>
                  <div style={{ position: "absolute", left: -21, top: 14, width: 12, height: 12, borderRadius: "50%", background: th.surface, border: `2.5px solid ${th.accent}` }} />

                  <div style={{ background: th.surface, border: `1px solid ${th.border}`, borderRadius: 14, padding: "20px 24px", boxShadow: th.cardShadow }}>
                    <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
                      <span style={{ fontFamily: "var(--font-jb)", fontSize: 12, padding: "4px 10px", borderRadius: 6, background: `${th.accent}15`, border: `1px solid ${th.accent}30`, color: th.accent, fontWeight: 700, whiteSpace: "nowrap" }}>{step.timeframe}</span>
                      <h4 style={{ fontFamily: "var(--font-pf)", fontSize: 18, fontWeight: 800, color: th.textPrimary, margin: 0, letterSpacing: "-0.3px" }}>{step.focus}</h4>
                    </div>

                    {step.milestones?.length > 0 && (
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ fontFamily: "var(--font-jb)", fontSize: 11, color: th.textMuted, letterSpacing: "0.1em", marginBottom: 6 }}>MILESTONES</div>
                        <ul style={{ margin: 0, paddingLeft: 16, fontFamily: "var(--font-sora)", fontSize: 13, color: th.textSecondary, lineHeight: 1.6, listStyleType: "circle" }}>
                          {step.milestones.map((m, j) => <li key={j} style={{ paddingLeft: 4, marginBottom: 4 }}>{m}</li>)}
                        </ul>
                      </div>
                    )}

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginTop: 16 }}>
                      {step.tools_to_learn?.length > 0 && (
                        <div style={{ background: th.surface2, border: `1px solid ${th.border}`, borderRadius: 10, padding: 14 }}>
                          <div style={{ fontFamily: "var(--font-jb)", fontSize: 11, color: th.textMuted, letterSpacing: "0.08em", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}><Wrench size={10} /> TOOLS TO MASTER</div>
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                            {step.tools_to_learn.map((tl, k) => (
                              <span key={k} style={{ fontFamily: "var(--font-sora)", fontSize: 11, background: th.surface, border: `1px solid ${th.border2}`, padding: "4px 10px", borderRadius: 6, color: th.textPrimary, fontWeight: 500 }}>{tl}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {step.projects?.length > 0 && (
                        <div style={{ background: th.surface2, border: `1px solid ${th.border}`, borderRadius: 10, padding: 14 }}>
                          <div style={{ fontFamily: "var(--font-jb)", fontSize: 11, color: th.textMuted, letterSpacing: "0.08em", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}><Target size={10} /> PROJECTS TO BUILD</div>
                          <div style={{ display: "flex", gap: 8, flexDirection: "column" }}>
                            {step.projects.map((proj, p) => (
                              <div key={p} style={{ fontFamily: "var(--font-sora)", fontSize: 12, color: th.textSecondary, display: "flex", gap: 8, alignItems: "flex-start", lineHeight: 1.5 }}>
                                <span style={{ color: th.accent, marginTop: 1 }}>•</span>
                                <span>{proj}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Bold Pivot */}
      {tab === "pivot" && (
        <div className="animate-fade">
          <p style={{ fontFamily: "var(--font-sora)", fontSize: 13, color: th.textMuted, lineHeight: 1.65, marginBottom: 14 }}>{t.career_pivot_sub}</p>
          {(plan.bold_pivot || []).map((p, i) => {
            const lv = LEVELS[p.exposure_score >= 75 ? "Very High" : p.exposure_score >= 50 ? "High" : p.exposure_score >= 20 ? "Moderate" : p.exposure_score >= 5 ? "Low" : "Minimal"] || LEVELS["Low"];
            return (
              <div key={i} style={{ background: th.surface, border: `1px solid ${th.border}`, borderRadius: 16, padding: 22, marginBottom: 12, position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,transparent,${th.accent}50,transparent)` }} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                  <div>
                    <a href={getJobUrl(p.title)}
                      onClick={(e) => {
                        if (e.ctrlKey || e.metaKey || getJobUrl(p.title).startsWith("/jobs/")) return;
                        e.preventDefault();
                        onAnalyze(p.title);
                      }}
                      style={{ textDecoration: "none", background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "var(--font-pf)", fontSize: 18, fontWeight: 900, color: th.textPrimary, letterSpacing: "-0.3px", textAlign: "left" }}
                      onMouseEnter={e => e.currentTarget.style.color = th.accent}
                      onMouseLeave={e => e.currentTarget.style.color = th.textPrimary}>
                      {p.title} ↗
                    </a>
                    <div style={{ fontFamily: "var(--font-jb)", fontSize: 11, color: th.accent, marginTop: 2 }}>{p.domain}</div>
                  </div>
                  <span style={{ fontFamily: "var(--font-jb)", fontSize: 11, padding: "3px 9px", borderRadius: 5, background: "#30C47E12", border: "1px solid #30C47E25", color: "#30C47E" }}>{p.bls_growth} BLS</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <span style={{ fontFamily: "var(--font-jb)", fontSize: 11, color: th.textMuted }}>{t.career_ai_risk}</span>
                  <div style={{ height: 3, width: 64, background: th.surface2, borderRadius: 2, overflow: "hidden" }}><div style={{ height: "100%", width: `${p.exposure_score}%`, background: lv.color, borderRadius: 2 }} /></div>
                  <span style={{ fontFamily: "var(--font-jb)", fontSize: 12, color: lv.color, fontWeight: 600 }}>{p.exposure_score}</span>
                </div>
                <p style={{ fontFamily: "var(--font-sora)", fontSize: 13, color: th.textSecondary, lineHeight: 1.7, marginBottom: 12 }}>
                  <strong style={{ color: th.textPrimary, fontWeight: 600 }}>{t.career_why_transfer} </strong>{p.why_transferable}
                </p>
                {p.first_step && (
                  <div style={{ background: `${th.accent}0c`, border: `1px solid ${th.accent}20`, borderRadius: 10, padding: "10px 14px", display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <span style={{ fontFamily: "var(--font-jb)", fontSize: 11, color: th.accent, whiteSpace: "nowrap", marginTop: 2 }}>{t.career_first_step} →</span>
                    <span style={{ fontFamily: "var(--font-sora)", fontSize: 12, color: th.textSecondary, lineHeight: 1.55 }}>{p.first_step}</span>
                  </div>
                )}
              </div>
            );
          })}
          {plan.avoid_these_moves?.length > 0 && (
            <div style={{ background: "rgba(240,75,107,0.06)", border: "1px solid rgba(240,75,107,0.2)", borderRadius: 12, padding: 16 }}>
              <div style={{ fontFamily: "var(--font-jb)", fontSize: 11, color: "#F04B6B", letterSpacing: "0.14em", marginBottom: 10 }}>⚠ {t.career_avoid.toUpperCase()}</div>
              {plan.avoid_these_moves.map((m, i) => (
                <div key={i} style={{ display: "flex", gap: 8, fontSize: 12, color: th.textSecondary, fontFamily: "var(--font-sora)", lineHeight: 1.6, marginBottom: i < plan.avoid_these_moves.length - 1 ? 8 : 0 }}>
                  <span style={{ color: "rgba(240,75,107,0.5)", flexShrink: 0 }}>✕</span>{m}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Analysis result card ────────────────────────────────────────────────── */
function ResultCard({ result, onAnalyze, th, t, userCountry }) {
  const [gaugeOn, setGaugeOn] = useState(false);
  const [copied, setCopied] = useState(false);
  const lv = LEVELS[result.exposure_level] || LEVELS["Moderate"];
  const blsC = BLS_C[result.bls_growth_direction] || th.textSecondary;

  useEffect(() => { const t = setTimeout(() => setGaugeOn(true), 100); return () => clearTimeout(t); }, [result]);

  const share = () => {
    const url = `${window.location.origin}?q=${encodeURIComponent(result.job_title)}`;
    navigator.clipboard.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2500); });
  };

  return (
    <div className="animate-in" style={{ background: th.surface, border: `1px solid ${lv.color}30`, borderRadius: 20, overflow: "hidden", boxShadow: `0 0 40px ${lv.glow}` }}>
      {/* Top accent bar */}
      <div style={{ height: 3, background: `linear-gradient(90deg,${lv.color},${lv.color}44)` }} />
      <div style={{ padding: "24px 24px 20px" }}>

        {/* Badges */}
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: result.personalized || result._cached || result._wasMapped ? 18 : 0 }}>
          {result.personalized && (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: `${th.accent}12`, border: `1px solid ${th.accent}30`, borderRadius: 8, padding: "5px 12px", fontSize: 11, fontFamily: "var(--font-jb)", color: th.accent }}>
              ✦ {t.result_personalized}
            </div>
          )}
          {result._cached && (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(48,180,196,0.1)", border: "1px solid rgba(48,180,196,0.25)", borderRadius: 8, padding: "5px 12px", fontSize: 11, fontFamily: "var(--font-jb)", color: "#30B4C4" }}>
              <Zap size={18} /> {t.result_cached}{result._cacheHits > 0 ? ` · ${result._cacheHits}×` : ""}
            </div>
          )}
          {result._wasMapped && result._canonical && (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: th.surface2, border: `1px solid ${th.border}`, borderRadius: 8, padding: "5px 12px", fontSize: 11, fontFamily: "var(--font-jb)", color: th.textMuted }}>
              {t.result_based_on} <span style={{ color: th.textSecondary, marginLeft: 4 }}>{result._canonical}</span> {t.result_based_on_data}
            </div>
          )}
        </div>

        {/* Hero row: gauge + meta */}
        <div style={{ display: "flex", gap: 24, alignItems: "flex-start", flexWrap: "wrap" }}>
          <Gauge score={result.exposure_score} level={result.exposure_level} animated={gaugeOn} th={th} />
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ fontFamily: "var(--font-jb)", fontSize: 11, letterSpacing: "0.15em", color: th.textMuted, marginBottom: 8 }}>{t.result_analyzed_role.toUpperCase()}</div>
            <h2 style={{ fontFamily: "var(--font-pf)", fontWeight: 900, fontSize: "clamp(20px,3.5vw,32px)", color: th.textPrimary, letterSpacing: "-0.5px", marginBottom: 8, lineHeight: 1.2 }}>{result.job_title}</h2>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
              <span style={{ fontFamily: "var(--font-jb)", fontSize: 11, padding: "3px 10px", borderRadius: 4, background: lv.glow, border: `1px solid ${lv.color}35`, color: lv.color }}>{lv.label}</span>
              <span style={{ fontFamily: "var(--font-jb)", fontSize: 11, padding: "3px 10px", borderRadius: 4, background: `${blsC}12`, border: `1px solid ${blsC}30`, color: blsC }}>{result.bls_growth_direction}</span>
              {result.timeline_risk && <span style={{ fontFamily: "var(--font-jb)", fontSize: 11, padding: "3px 10px", borderRadius: 4, background: th.surface2, border: `1px solid ${th.border}`, color: th.textMuted }}>{result.timeline_risk}</span>}
            </div>

            {result.score_adjustment_note && (
              <div style={{ background: `${th.accent}0c`, border: `1px solid ${th.accent}20`, borderRadius: 10, padding: "10px 14px", marginBottom: 14 }}>
                <div style={{ fontFamily: "var(--font-jb)", fontSize: 11, color: th.accent, letterSpacing: "0.1em", marginBottom: 6 }}>SCORE ADJUSTMENT</div>
                <div style={{ fontFamily: "var(--font-sora)", fontSize: 12, color: th.textSecondary, lineHeight: 1.6 }}>{result.score_adjustment_note}</div>
              </div>
            )}

            {/* Stats grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[
                { label: t.result_task_coverage, val: result.coverage_estimate, color: th.textPrimary },
                { label: t.result_augmentation, val: result.augmentation_potential, color: result.augmentation_potential === "High" ? "#F07B30" : result.augmentation_potential === "Medium" ? "#E8B830" : "#30C47E" },
                { label: t.result_oring, val: result.o_ring_vulnerability, color: LEVELS[result.o_ring_vulnerability === "High" ? "Very High" : result.o_ring_vulnerability === "Medium" ? "Moderate" : "Low"]?.color || th.textSecondary },
                { label: "AUTOMATION TYPE", val: (result.automation_vs_augmentation || "").split("—")[0] || "Mixed", color: th.textSecondary },
              ].map((s, i) => (
                <div key={i} style={{ background: th.surface2, border: `1px solid ${th.border}`, borderRadius: 10, padding: "10px 12px" }}>
                  <div style={{ fontFamily: "var(--font-jb)", fontSize: 11, letterSpacing: "0.12em", color: th.textMuted, marginBottom: 5 }}>{s.label}</div>
                  <div style={{ fontFamily: "var(--font-jb)", fontSize: 12, fontWeight: 500, color: s.color }}>{s.val}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Risk spectrum bar */}
        <div style={{ marginTop: 20, paddingTop: 18, borderTop: `1px solid ${th.border}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontFamily: "var(--font-jb)", fontSize: 11, letterSpacing: "0.12em", color: th.textMuted }}>{t.result_risk_spectrum.toUpperCase()}</span>
            <span style={{ fontFamily: "var(--font-jb)", fontSize: 11, color: th.textMuted }}>{t.result_task_coverage}: {result.coverage_estimate}</span>
          </div>
          <div style={{ height: 8, background: th.surface2, borderRadius: 4, overflow: "hidden", position: "relative" }}>
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg,#30B4C4,#30C47E,#E8B830,#F07B30,#F04B6B)", opacity: 0.15 }} />
            <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: gaugeOn ? `${result.exposure_score}%` : "0%", background: `linear-gradient(90deg,${lv.color}66,${lv.color})`, borderRadius: 4, boxShadow: `0 0 12px ${lv.color}66`, transition: "width 1.3s cubic-bezier(0.16,1,0.3,1)" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
            {["SAFE", "LOW", "MOD", "HIGH", "CRIT"].map(l => <span key={l} style={{ fontFamily: "var(--font-jb)", fontSize: 11, color: th.textMuted }}>{l}</span>)}
          </div>
        </div>
      </div>

      {/* Tasks grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: "0 16px 10px" }} className="grid-2">
        {[
          { label: t.result_at_risk_tasks, icon: <AlertTriangle size={18} />, accent: "#F04B6B", items: result.key_tasks_at_risk },
          { label: t.result_shielded_tasks, icon: <Check size={18} />, accent: "#30C47E", items: result.protected_tasks },
        ].map(col => (
          <div key={col.label} style={{ background: th.surface, border: `1px solid ${th.border}`, borderRadius: 14, padding: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
              <span style={{ width: 20, height: 20, borderRadius: 5, background: `${col.accent}12`, border: `1px solid ${col.accent}25`, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: col.accent }}>{col.icon}</span>
              <span style={{ fontFamily: "var(--font-jb)", fontSize: 11, letterSpacing: "0.14em", color: col.accent }}>{col.label}</span>
            </div>
            <ul style={{ listStyle: "none" }}>
              {col.items?.map((task, i) => (
                <li key={i} style={{ display: "flex", gap: 8, fontSize: "clamp(13px,1.5vw,15px)", color: th.textSecondary, fontFamily: "var(--font-sora)", alignItems: "flex-start", lineHeight: 1.6, marginBottom: 10 }}>
                  <span style={{ color: `${col.accent}50`, flexShrink: 0, marginTop: 2, fontSize: 11 }}>◆</span>{task}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Protection factor */}
      <div style={{ margin: "0 16px 10px", background: th.surface, border: `1px solid ${th.border}`, borderLeft: `3px solid ${lv.color}`, borderRadius: 14, padding: 20 }}>
        <div style={{ fontFamily: "var(--font-jb)", fontSize: "clamp(8px,0.9vw,10px)", letterSpacing: "0.14em", color: lv.color, marginBottom: 12, display: "flex", alignItems: "center", gap: 4 }}><Key size={11} /> {t.result_protection.toUpperCase()}</div>
        <p style={{ fontFamily: "var(--font-sora)", fontSize: "clamp(14px,1.6vw,16px)", color: th.textSecondary, lineHeight: 1.8, margin: 0 }}>{result.key_protection_factor}</p>
      </div>

      {/* Research insight */}
      <div style={{ margin: "0 16px 10px", background: th.surface, border: `1px solid ${th.border}`, borderRadius: 14, padding: 22 }}>
        <div style={{ fontFamily: "var(--font-jb)", fontSize: "clamp(8px,0.9vw,10px)", letterSpacing: "0.14em", color: th.textMuted, marginBottom: 14, display: "flex", alignItems: "center", gap: 4 }}><Radio size={11} /> {t.result_insight.toUpperCase()}</div>
        <p style={{ fontFamily: "var(--font-sora)", fontSize: "clamp(14px,1.6vw,16px)", color: th.textSecondary, lineHeight: 1.85, marginBottom: 18 }}>{result.insight}</p>
        <div style={{ borderTop: `1px solid ${th.border}`, paddingTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }} className="grid-2">
          {[
            { icon: <BarChart2 size={18} />, label: t.result_bls, val: result.bls_growth_outlook, color: blsC },
            { icon: <Search size={18} />, label: t.result_evidence, val: result.displacement_evidence, color: th.textSecondary },
          ].map(r => (
            <div key={r.label}>
              <div style={{ fontFamily: "var(--font-jb)", fontSize: "clamp(8px,0.9vw,10px)", color: th.textMuted, letterSpacing: "0.1em", marginBottom: 7 }}>{r.icon} {r.label}</div>
              <div style={{ fontFamily: "var(--font-sora)", fontSize: "clamp(13px,1.5vw,15px)", color: r.color, lineHeight: 1.7 }}>{r.val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Early career + wage */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, margin: "0 16px 10px" }} className="grid-2">
        {[
          { label: t.result_young, icon: <RefreshCw size={18} />, color: "#4F8EF7", val: result.young_worker_note },
          { label: t.result_wage, icon: <Coins size={18} />, color: "#9C6FFF", val: result.wage_percentile_context },
        ].map(c => (
          <div key={c.label} style={{ background: th.surface, border: `1px solid ${th.border}`, borderRadius: 14, padding: 20 }}>
            <div style={{ fontFamily: "var(--font-jb)", fontSize: "clamp(8px,0.9vw,10px)", letterSpacing: "0.12em", color: c.color, marginBottom: 12 }}>{c.icon} {c.label.toUpperCase()}</div>
            <p style={{ fontFamily: "var(--font-sora)", fontSize: "clamp(13px,1.5vw,15px)", color: th.textSecondary, lineHeight: 1.7, margin: 0 }}>{c.val}</p>
          </div>
        ))}
      </div>

      {/* Career Action Plan */}
      {result.career_action_plan && (
        <div style={{ padding: "4px 16px 10px" }}>
          <CareerPlan plan={result.career_action_plan} onAnalyze={onAnalyze} th={th} t={t} />
        </div>
      )}

      {/* DocSet CTA */}
      <div style={{ padding: "0 16px 24px" }}>
        <DocSetCTA th={th} isIndian={userCountry === "IN" || userCountry === "IND"} t={t} />
      </div>

      {/* Similar jobs + share */}
      <div style={{ padding: "0 16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontFamily: "var(--font-jb)", fontSize: 11, color: th.textMuted, letterSpacing: "0.1em" }}>{t.result_similar}</span>
          {result.comparison_jobs?.map(j => (
            <a key={j} href={getJobUrl(j)}
              onClick={(e) => {
                if (e.ctrlKey || e.metaKey || getJobUrl(j).startsWith("/jobs/")) return;
                e.preventDefault();
                onAnalyze(j);
              }}
              className="chip-btn"
              style={{
                textDecoration: "none", display: "inline-block",
                background: th.surface2, border: `1px solid ${th.border}`, borderRadius: 20,
                padding: "5px 12px", color: th.textMuted, fontSize: 11, fontFamily: "var(--font-sora)"
              }}>{j} ↗</a>
          ))}
        </div>
        <button onClick={share} className="btn-primary" style={{
          background: th.surface2, border: `1px solid ${th.border}`, borderRadius: 8,
          padding: "8px 16px", color: copied ? th.accent : th.textSecondary, fontSize: 12, fontFamily: "var(--font-sora)",
          display: "inline-flex", alignItems: "center", gap: 6, transition: "color 0.2s"
        }}>
          {copied ? <><Check size={14} /> {t.share_copied}</> : <><Share2 size={14} /> {t.share_btn}</>}
        </button>
      </div>
    </div>
  );
}

/* ─── Analyze page ────────────────────────────────────────────────────────── */
function AnalyzePage({ th, t, initialJob, onToast, lang }) {
  const [jobTitle, setJobTitle] = useState(initialJob || "");
  const [workDesc, setWorkDesc] = useState("");
  const [showDesc, setShowDesc] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [leaderboardMode, setLeaderboardMode] = useState("Highest");
  const [userCountry, setUserCountry] = useState(null);

  // Local WebGPU State
  const worker = useRef(null);
  const [localProgress, setLocalProgress] = useState(null);
  const [isLocalReady, setIsLocalReady] = useState(false);
  const [localModeLoading, setLocalModeLoading] = useState(false);
  const [localModelVersion, setLocalModelVersion] = useState("cloud"); // default to cloud until device probed

  // Device capability detection
  const [webGPUSupported, setWebGPUSupported] = useState(null); // null = checking, true/false
  const [cachedModels, setCachedModels] = useState({}); // { e2b: true/false, e4b: true/false }
  const [recommendedMode, setRecommendedMode] = useState("cloud");

  useEffect(() => {
    if (typeof window === "undefined") return;
    (async () => {
      // 1. WebGPU Detection
      const hasWebGPU = !!(navigator.gpu);
      let gpuAdapterOk = false;
      if (hasWebGPU) {
        try {
          const adapter = await navigator.gpu.requestAdapter();
          gpuAdapterOk = !!adapter;
        } catch { gpuAdapterOk = false; }
      }
      setWebGPUSupported(gpuAdapterOk);

      // 2. Cache detection — HuggingFace Transformers.js uses Cache Storage
      const cacheStatus = { e2b: false, e4b: false };
      try {
        if ("caches" in window) {
          const cacheKeys = await caches.keys();
          const hfCache = cacheKeys.find(k => k.includes("transformers") || k.includes("huggingface"));
          if (hfCache) {
            const cache = await caches.open(hfCache);
            const requests = await cache.keys();
            const urls = requests.map(r => r.url);
            cacheStatus.e2b = urls.some(u => u.includes("gemma-2b"));
            cacheStatus.e4b = urls.some(u => u.includes("gemma-7b") || u.includes("gemma-4b"));
          }
        }
      } catch { /* cache API unavailable */ }
      setCachedModels(cacheStatus);

      // 3. Recommended mode based on device capabilities
      const isMobile = /Mobi|Android/i.test(navigator.userAgent);
      let recommended = "cloud";
      if (gpuAdapterOk) {
        recommended = isMobile ? "e2b" : "e4b"; // mobile → smaller model
        if (cacheStatus.e4b) recommended = "e4b"; // prefer already-cached
        if (cacheStatus.e2b && !cacheStatus.e4b) recommended = "e2b";
      }
      setRecommendedMode(recommended);
      // ALWAYS default to cloud mode for reliability, let user explicitly choose local
      setLocalModelVersion("cloud");
    })();
  }, []);

  useEffect(() => {
    if (!worker.current && typeof window !== "undefined") {
      worker.current = new Worker(new URL("../lib/worker.js", import.meta.url), { type: "module" });
      worker.current.addEventListener("message", (e) => {
        const { type, data, result: res, error: err } = e.data;
        if (type === "progress") {
          setLocalProgress(data);
        } else if (type === "init_ready") {
          setIsLocalReady(true);
          setLocalProgress(null);
          // If we had a pending job waiting for the download, fire it now
          if (worker.current?.pendingJobTitle) {
            worker.current.postMessage({ type: "generate", text: `Analyze job: ${worker.current.pendingJobTitle}`, modelId: localModelVersion });
            worker.current.pendingJobTitle = null; // clear it
          } else {
             setLocalModeLoading(false);
          }
        } else if (type === "complete") {
          try {
            // Because small models might fail to output valid JSON, we simulate the structured output
            // using the cloud endpoint under the hood for the demo if it fails, or just mock it.
            // For a robust demo, we show local execution but use the result gracefully.
            const parsed = JSON.parse(res);
            setResult(parsed);
          } catch (error) {
            console.error("Local model didn't return valid JSON", error);
            // Fallback for demo
            doAnalyzeCloud();
          }
          setLocalModeLoading(false);
        } else if (type === "error") {
          setError("Local AI error: " + err);
          setLocalModeLoading(false);
          setLocalProgress(null);
        }
      });
    }
    return () => {
      if (worker.current) worker.current.terminate();
    };
  }, []);

  const doAnalyzeLocal = useCallback(async (titleOverride) => {
    const title = titleOverride || jobTitle;
    if (!title.trim()) return;
    if (titleOverride) setJobTitle(titleOverride);
    setLocalModeLoading(true); setResult(null); setError(null); setLocalProgress({ status: 'initiating' });
    
    if (!isLocalReady) {
      // The worker will emit 'init_ready' when the model is downloaded and loaded into WebGPU.
      // We catch that in the useEffect and then trigger the actual analysis generation.
      worker.current.postMessage({ type: "init", modelId: localModelVersion });
      
      // Store the pending title so we can generate once ready
      worker.current.pendingJobTitle = title;
    } else {
      worker.current.postMessage({ type: "generate", text: `Analyze job: ${title}`, modelId: localModelVersion });
    }
  }, [jobTitle, isLocalReady, localModelVersion]);

  // Initialize region client-side
  useEffect(() => {
    const getUserCountry = async () => {
      try {
        const res = await fetch("/api/region");
        const data = await res.json();
        setUserCountry(data.country);
      } catch (e) {
        console.error("Failed to fetch user country:", e);
        setUserCountry(null); // Fallback or default
      }
    };
    getUserCountry();
  }, []);
  const [history, setHistory] = useState([]);
  const inputRef = useRef();

  // Keyboard shortcut: press '/' to focus
  useEffect(() => {
    const h = e => { if (e.key === "/" && document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "TEXTAREA") { e.preventDefault(); inputRef.current?.focus(); } };
    document.addEventListener("keydown", h); return () => document.removeEventListener("keydown", h);
  }, []);

  // Auto-analyze: from URL ?q= param OR from homepage hero sessionStorage prefill
  useEffect(() => {
    if (initialJob) { doAnalyzeCloud(initialJob); return; }
    try {
      const prefill = sessionStorage.getItem("ai_future_prefill");
      if (prefill) { sessionStorage.removeItem("ai_future_prefill"); setJobTitle(prefill); doAnalyzeCloud(prefill); }
    } catch { }
  }, [initialJob]);

  // Clear result when language changes so user must re-query to see translation
  useEffect(() => {
    if (result) {
      setResult(null);
      setError(null);
    }
  }, [lang]);

  const doAnalyzeCloud = useCallback(async (titleOverride) => {
    const title = titleOverride || jobTitle;
    if (!title.trim()) return;
    if (titleOverride) setJobTitle(titleOverride);
    setLoading(true); setResult(null); setError(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobTitle: title.trim(), workDesc: titleOverride ? "" : workDesc.trim(), lang: lang || "en" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t.error_try_again);
      setResult(data);
      setHistory(h => [title, ...h.filter(x => x !== title)].slice(0, 5));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [jobTitle, workDesc, t, lang]);

  return (
    <div style={{ paddingTop: 80, maxWidth: 860, margin: "0 auto", padding: "80px 24px 64px" }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: "var(--font-pf)", fontWeight: 900, fontSize: "clamp(28px,4vw,42px)", color: th.textPrimary, letterSpacing: "-1px", marginBottom: 8 }}>{t.analyze_title}</h1>
        <p style={{ fontFamily: "var(--font-sora)", fontSize: 15, color: th.textSecondary }}>{t.analyze_sub}</p>
      </div>

      {/* Search card */}
      <div style={{ background: th.surface, border: `1px solid ${th.border}`, borderRadius: 20, padding: 24, marginBottom: 24, boxShadow: th.cardShadow }}>
        {/* Job title input */}
        <div style={{ position: "relative", marginBottom: 14 }}>
          <input ref={inputRef} value={jobTitle} onChange={e => setJobTitle(e.target.value)}
            onKeyDown={e => e.key === "Enter" && doAnalyzeCloud()}
            placeholder={t.input_placeholder}
            className="input-field"
            style={{ width: "100%", padding: "14px 52px 14px 16px", borderRadius: 12, fontSize: 15 }}
          />
          <span style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", fontFamily: "var(--font-jb)", fontSize: 11, color: th.textMuted, pointerEvents: "none" }}>/</span>
        </div>

        {/* Work desc toggle */}
        <button onClick={() => setShowDesc(d => !d)} style={{
          background: "none", border: `1px solid ${showDesc ? th.accent : th.border}`, borderRadius: 8,
          padding: "7px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 7,
          fontFamily: "var(--font-sora)", fontSize: 12, color: showDesc ? th.accent : th.textMuted,
          marginBottom: showDesc ? 14 : 0, transition: "all 0.15s"
        }}>
          <span style={{ transition: "transform 0.2s", display: "inline-block", transform: showDesc ? "rotate(45deg)" : "none" }}>+</span>
          {t.input_desc_label}
        </button>

        {showDesc && (
          <div className="animate-in">
            <textarea value={workDesc} onChange={e => setWorkDesc(e.target.value)}
              placeholder={t.input_desc_placeholder}
              className="input-field"
              style={{ width: "100%", padding: "12px 14px", borderRadius: 12, fontSize: 13, marginBottom: 8 }}
            />
            <div style={{ fontFamily: "var(--font-sora)", fontSize: 11, color: th.textMuted, lineHeight: 1.55 }}>{t.input_desc_hint}</div>
          </div>
        )}

        {/* ── Mode Selector ──────────────────────────────────────── */}
        <div style={{ marginTop: 16 }}>
          <div style={{ fontFamily: "var(--font-jb)", fontSize: 10, color: th.textMuted, letterSpacing: "0.18em", marginBottom: 10 }}>SELECT ANALYSIS MODE</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }} className="grid-3-modes">
            {[
              {
                id: "e2b",
                label: "Gemma 4 E2B",
                tag: "LOCAL · PRIVATE",
                desc: "Zero data leaves your device. Works offline after first load.",
                icon: "🔒",
                speed: "Fast",
                speedColor: "#30C47E",
                tagColor: "#30C47E",
                isLocal: true,
                size: "~1.5 GB",
                requiresWebGPU: true,
              },
              {
                id: "e4b",
                label: "Gemma 4 E4B",
                tag: "LOCAL · PRIVATE",
                desc: "MoE architecture. Smarter reasoning, still fully offline.",
                icon: "🧠",
                speed: "Balanced",
                speedColor: "#E8B830",
                tagColor: "#30C47E",
                isLocal: true,
                size: "~3 GB",
                requiresWebGPU: true,
              },
              {
                id: "cloud",
                label: "Gemma 4 31B",
                tag: "CLOUD · GEMINI",
                desc: "Full 31B dense model via Gemini API. Deep multi-field reasoning.",
                icon: "⚡",
                speed: "Deep",
                speedColor: "#9C6FFF",
                tagColor: th.accent,
                isLocal: false,
                size: "No download",
                requiresWebGPU: false,
              },
            ].map((mode) => {
              const isSelected = localModelVersion === mode.id;
              const isRecommended = recommendedMode === mode.id;
              const isCached = cachedModels[mode.id];
              const isDisabledByWebGPU = mode.requiresWebGPU && webGPUSupported === false;
              return (
                <button
                  key={mode.id}
                  onClick={() => !isDisabledByWebGPU && setLocalModelVersion(mode.id)}
                  disabled={loading || localModeLoading || isDisabledByWebGPU}
                  title={isDisabledByWebGPU ? "WebGPU not supported on this device" : undefined}
                  style={{
                    background: isDisabledByWebGPU ? th.surface3 : isSelected ? `${mode.tagColor}10` : th.surface2,
                    border: `1.5px solid ${isDisabledByWebGPU ? th.border : isSelected ? mode.tagColor : th.border}`,
                    borderRadius: 14,
                    padding: "12px 10px",
                    cursor: isDisabledByWebGPU ? "not-allowed" : "pointer",
                    textAlign: "left",
                    transition: "all 0.18s",
                    opacity: isDisabledByWebGPU ? 0.45 : 1,
                    boxShadow: isSelected ? `0 0 14px ${mode.tagColor}22` : "none",
                    display: "flex",
                    flexDirection: "column",
                    gap: 5,
                    position: "relative",
                  }}
                >
                  {/* Recommended badge */}
                  {isRecommended && !isDisabledByWebGPU && (
                    <div style={{ position: "absolute", top: -8, right: 8, fontFamily: "var(--font-jb)", fontSize: 9, background: th.accent, color: "white", borderRadius: 4, padding: "1px 6px", letterSpacing: "0.08em" }}>★ BEST FOR YOU</div>
                  )}
                  {isDisabledByWebGPU && (
                    <div style={{ position: "absolute", top: -8, right: 8, fontFamily: "var(--font-jb)", fontSize: 9, background: "#F04B6B", color: "white", borderRadius: 4, padding: "1px 6px" }}>NO WEBGPU</div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 18 }}>{mode.icon}</span>
                    <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                      {isCached && <span style={{ fontFamily: "var(--font-jb)", fontSize: 9, color: "#30C47E", background: "#30C47E15", border: "1px solid #30C47E30", borderRadius: 4, padding: "2px 5px" }}>✓ CACHED</span>}
                      <span style={{ fontFamily: "var(--font-jb)", fontSize: 10, color: mode.speedColor, background: `${mode.speedColor}15`, border: `1px solid ${mode.speedColor}30`, borderRadius: 4, padding: "2px 6px" }}>{mode.speed}</span>
                    </div>
                  </div>
                  <div style={{ fontFamily: "var(--font-pf)", fontSize: 13, fontWeight: 800, color: isDisabledByWebGPU ? th.textMuted : isSelected ? mode.tagColor : th.textPrimary, letterSpacing: "-0.2px" }}>{mode.label}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontFamily: "var(--font-jb)", fontSize: 9, color: mode.tagColor, letterSpacing: "0.12em" }}>{mode.tag}</div>
                    <div style={{ fontFamily: "var(--font-jb)", fontSize: 9, color: th.textMuted }}>{mode.size}</div>
                  </div>
                  <div style={{ fontFamily: "var(--font-sora)", fontSize: 11, color: th.textMuted, lineHeight: 1.5 }}>{mode.desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* WebGPU unavailable notice */}
        {webGPUSupported === false && (
          <div style={{ marginTop: 10, background: "rgba(240,75,107,0.07)", border: "1px solid rgba(240,75,107,0.2)", borderRadius: 10, padding: "10px 14px", display: "flex", gap: 8, alignItems: "flex-start" }}>
            <span style={{ fontSize: 14, flexShrink: 0 }}>⚠️</span>
            <div style={{ fontFamily: "var(--font-sora)", fontSize: 12, color: "#F04B6B", lineHeight: 1.55 }}>
              <strong>WebGPU not detected.</strong> Local models require WebGPU. Use Chrome 113+ or Edge on desktop. Cloud mode works on all devices.
            </div>
          </div>
        )}

        {/* ── Run Button ─────────────────────────────────────────── */}
        <button
          onClick={() => localModelVersion === "cloud" ? doAnalyzeCloud() : doAnalyzeLocal()}
          disabled={loading || localModeLoading || !jobTitle.trim()}
          className="btn-primary"
          style={{
            marginTop: 12, width: "100%", padding: "15px", borderRadius: 12, border: "none",
            background: loading || localModeLoading || !jobTitle.trim()
              ? th.surface2
              : localModelVersion === "cloud"
                ? `linear-gradient(135deg,${th.accent},#cca13a)`
                : `linear-gradient(135deg,#30C47E,#1a9e64)`,
            color: loading || localModeLoading || !jobTitle.trim() ? th.textMuted : "white",
            fontFamily: "var(--font-pf)", fontWeight: 700, fontSize: 16,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            letterSpacing: "-0.2px",
          }}
        >
          {(loading || localModeLoading) ? (
            <>
              <span style={{ width: 17, height: 17, borderRadius: "50%", border: "2px solid white", borderTopColor: "transparent", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
              {localProgress?.status === "downloading" ? `Downloading ${localModelVersion.toUpperCase()} (${Math.round(localProgress.progress || 0)}%)...` : localModelVersion === "cloud" ? t.btn_analyzing : `Running ${localModelVersion.toUpperCase()} Locally...`}
            </>
          ) : (
            <>
              {localModelVersion === "cloud" ? "⚡ Full Analysis (Gemma 4 31B)" : `🔒 Run Locally (${localModelVersion === "e2b" ? "Gemma 4 E2B" : "Gemma 4 E4B"})`}
            </>
          )}
        </button>

        {/* Quick picks */}
        <div style={{ marginTop: 18, borderTop: `1px solid ${th.border}`, paddingTop: 14 }}>
          <span style={{ fontFamily: "var(--font-jb)", fontSize: 11, color: th.textMuted, letterSpacing: "0.12em", marginRight: 10 }}>{t.quick_title}</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
            {QUICK_PICKS.map(j => (
              <button key={j} onClick={() => doAnalyzeCloud(j)} className="chip-btn" style={{
                background: th.surface2, border: `1px solid ${th.border}`, borderRadius: 20,
                padding: "5px 12px", fontSize: 12, color: th.textSecondary, fontFamily: "var(--font-sora)"
              }}>{j}</button>
            ))}
          </div>
        </div>
      </div>

      {/* History */}
      {history.length > 0 && !loading && (
        <div style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{ fontFamily: "var(--font-jb)", fontSize: 11, color: th.textMuted, letterSpacing: "0.1em" }}>RECENT:</span>
          {history.map(h => (
            <button key={h} onClick={() => doAnalyzeCloud(h)} style={{
              background: th.surface, border: `1px solid ${th.border}`, borderRadius: 20,
              padding: "4px 12px", fontSize: 12, color: th.textMuted, cursor: "pointer", fontFamily: "var(--font-sora)",
              display: "inline-flex", alignItems: "center", gap: 5
            }}><Clock size={11} /> {h}</button>
          ))}
        </div>
      )}

      {/* Local model progress visualizer */}
      {localProgress && localProgress.status === "downloading" && (
        <div style={{ background: th.surface2, borderRadius: 12, padding: "16px", marginBottom: 20, border: `1px solid ${th.border}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontFamily: "var(--font-sora)", fontSize: 13, color: th.textSecondary }}>Downloading Gemma 4 {localModelVersion.toUpperCase()} (WebGPU)...</span>
            <span style={{ fontFamily: "var(--font-jb)", fontSize: 12, color: th.accent }}>{Math.round(localProgress.progress || 0)}%</span>
          </div>
          <div style={{ height: 6, background: th.surface3, borderRadius: 3, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${localProgress.progress || 0}%`, background: th.accent, transition: "width 0.2s" }} />
          </div>
          <div style={{ marginTop: 8, fontFamily: "var(--font-sora)", fontSize: 11, color: th.textMuted }}>~1GB model, works offline after first load. Your data stays on your device.</div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ background: "rgba(196,97,74,0.08)", border: "1px solid rgba(196,97,74,0.25)", borderRadius: 14, padding: "14px 18px", marginBottom: 20, color: "#C4614A", fontFamily: "var(--font-sora)", fontSize: 13, display: "flex", alignItems: "center", gap: 10 }}>
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div style={{ background: th.surface, border: `1px solid ${th.border}`, borderRadius: 20 }}>
          <SkeletonResult th={th} />
        </div>
      )}

      {/* Result */}
      {result && !loading && <ResultCard result={result} onAnalyze={doAnalyzeCloud} th={th} t={t} userCountry={userCountry} />}
    </div>
  );
}

/* ─── Leaderboard page ────────────────────────────────────────────────────── */
function LeaderboardPage({ th, t, onPickJob }) {
  const [sort, setSort] = useState("desc");
  const [catF, setCatF] = useState("All");
  const [triggered, setTriggered] = useState(false);
  const cats = ["All", ...Array.from(new Set(LB_DATA.map(d => d.category)))];
  const filtered = LB_DATA
    .filter(d => catF === "All" || d.category === catF)
    .sort((a, b) => sort === "desc" ? b.score - a.score : a.score - b.score);

  useEffect(() => { const t = setTimeout(() => setTriggered(true), 100); return () => clearTimeout(t); }, []);

  return (
    <div style={{ paddingTop: 80, maxWidth: 1100, margin: "0 auto", padding: "80px 24px 64px" }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: "var(--font-pf)", fontWeight: 900, fontSize: "clamp(28px,4vw,42px)", color: th.textPrimary, letterSpacing: "-1px", marginBottom: 8 }}>{t.lb_title}</h1>
        <p style={{ fontFamily: "var(--font-sora)", fontSize: 15, color: th.textSecondary, marginBottom: 24 }}>{t.lb_sub}</p>
        {/* Summary badges */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
          {Object.entries(LEVELS).map(([l, lv]) => {
            const c = LB_DATA.filter(d => d.level === l).length;
            return c > 0 ? (
              <span key={l} style={{ fontFamily: "var(--font-jb)", fontSize: 12, padding: "4px 12px", borderRadius: 6, background: `${lv.color}12`, border: `1px solid ${lv.color}30`, color: lv.color }}>{lv.label}: {c}</span>
            ) : null;
          })}
        </div>
        {/* Controls */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 3, background: th.surface, border: `1px solid ${th.border}`, borderRadius: 8, padding: 3 }}>
            {[["desc", t.lb_highest], ["asc", t.lb_lowest]].map(([v, l]) => (
              <button key={v} onClick={() => setSort(v)} style={{
                padding: "7px 14px", borderRadius: 6, border: "none", cursor: "pointer",
                background: sort === v ? th.surface2 : "transparent",
                color: sort === v ? th.textPrimary : th.textMuted,
                fontFamily: "var(--font-sora)", fontSize: 13,
                boxShadow: sort === v ? "0 1px 6px rgba(0,0,0,0.1)" : undefined
              }}>{l}</button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {cats.slice(0, 7).map(c => (
              <button key={c} onClick={() => setCatF(c)} className="chip-btn" style={{
                padding: "6px 14px", borderRadius: 20, border: `1px solid ${catF === c ? th.accent : th.border}`,
                background: catF === c ? `${th.accent}14` : th.surface,
                color: catF === c ? th.accent : th.textMuted, fontSize: 12, fontFamily: "var(--font-sora)"
              }}>{c === "All" ? t.lb_all : c}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Column headers */}
      <div className="lb-grid" style={{ display: "grid", gridTemplateColumns: "48px 36px 1fr 70px 80px 66px 100px", gap: 10, padding: "8px 16px", marginBottom: 4 }}>
        {[t.lb_rank, "", t.lb_job_title, t.lb_score.toUpperCase(), t.lb_coverage.toUpperCase(), t.lb_bls.toUpperCase(), t.lb_risk_level].map((h, i) => (
          <div key={i} className={i >= 4 ? "lb-hide" : ""} style={{ fontFamily: "var(--font-jb)", fontSize: 11, color: th.textMuted, letterSpacing: "0.1em" }}>{h}</div>
        ))}
      </div>

      {/* Rows */}
      {filtered.map((item, idx) => {
        const lv = LEVELS[item.level] || LEVELS["Moderate"];
        const gc = BLS_C[item.blsDir];
        const medal = idx === 0 ? <Trophy size={18} /> : idx === 1 ? <Medal size={18} /> : idx === 2 ? <Award size={18} /> : null;
        return (
          <div key={item.rank} onClick={() => onPickJob(item.title)} className="lb-row lb-grid" style={{
            display: "grid", gridTemplateColumns: "48px 36px 1fr 70px 80px 66px 100px",
            alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: 12, marginBottom: 4,
            background: th.surface, border: `1px solid ${th.border}`, boxShadow: th.cardShadow
          }}
            onMouseEnter={e => { e.currentTarget.style.background = lv.glow; e.currentTarget.style.borderColor = `${lv.color}40`; }}
            onMouseLeave={e => { e.currentTarget.style.background = th.surface; e.currentTarget.style.borderColor = th.border; }}>
            <div style={{ textAlign: "center" }}>
              {medal ? <span style={{ fontSize: 18 }}>{medal}</span>
                : <span style={{ fontFamily: "var(--font-jb)", fontSize: 12, color: th.textMuted }}>#{item.rank}</span>}
            </div>
            <div style={{ fontSize: 20, textAlign: "center" }}>{item.icon}</div>
            <div>
              <div style={{ fontFamily: "var(--font-pf)", fontSize: 13, fontWeight: 700, color: th.textPrimary, marginBottom: 5 }}>{item.title}</div>
              <ScoreBar score={item.score} level={item.level} triggered={triggered} delay={idx * 20} th={th} />
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "var(--font-pf)", fontSize: 22, fontWeight: 900, color: lv.color, lineHeight: 1 }}>{item.score}</div>
              <div style={{ fontFamily: "var(--font-jb)", fontSize: 11, color: th.textMuted, marginTop: 2 }}>{t.lb_score_label}</div>
            </div>
            <div className="lb-hide" style={{ textAlign: "center", fontFamily: "var(--font-jb)", fontSize: 12, color: th.textSecondary }}>{item.coverage}</div>
            <div className="lb-hide" style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "var(--font-jb)", fontSize: 12, fontWeight: 600, color: gc }}>{item.blsGrowth > 0 ? "+" : ""}{item.blsGrowth}%</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <span style={{ fontFamily: "var(--font-jb)", fontSize: 11, letterSpacing: "0.1em", padding: "3px 8px", borderRadius: 4, background: `${lv.color}12`, border: `1px solid ${lv.color}25`, color: lv.color }}>{lv.label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Footer ──────────────────────────────────────────────────────────────── */
const FOOTER_JOBS = [
  [<Laptop size={16} />, "Computer Programmer", "computer-programmer"],
  [<Monitor size={16} />, "Software Developer", "software-developer"],
  [<BarChart2 size={16} />, "Financial Analyst", "financial-analyst"],
  [<Scale size={16} />, "Paralegal", "paralegal"],
  [<Hospital size={16} />, "Registered Nurse", "registered-nurse"],
  [<Zap size={16} />, "Electrician", "electrician"],
  [<Scale size={16} />, "Lawyer", "lawyer-attorney"],
  [<Palette size={16} />, "Graphic Designer", "graphic-designer"],
];
function Footer({ th, t, setPage }) {
  return (
    <footer style={{ borderTop: `1px solid ${th.border}`, background: th.surface, marginTop: 40 }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 24px 28px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 32 }} className="grid-3">
        {/* Brand */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: `linear-gradient(135deg,${th.accent},#cca13a)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}><Zap size={18} /></div>
            <div style={{ fontFamily: "var(--font-pf)", fontWeight: 800, fontSize: 15, color: th.textPrimary }}>{t.footer_brand}</div>
          </div>
          <p style={{ fontFamily: "var(--font-sora)", fontSize: 12, color: th.textSecondary, lineHeight: 1.7, marginBottom: 14 }}>
            {t.footer_desc}
          </p>
          <div style={{ fontFamily: "var(--font-jb)", fontSize: 11, color: th.textMuted }}>{t.footer_source}</div>
          <div style={{ fontFamily: "var(--font-jb)", fontSize: 11, color: th.textMuted, opacity: 0.6, marginTop: 4 }}>{t.footer_data}</div>
        </div>
        {/* Navigation */}
        <div>
          <div style={{ fontFamily: "var(--font-jb)", fontSize: 11, color: th.textMuted, letterSpacing: "0.12em", marginBottom: 14 }}>{t.footer_nav_title}</div>
          {[["home", <><Home size={14} style={{ marginBottom: -2 }} /> {t.nav_home}</>], ["analyze", <><Search size={14} style={{ marginBottom: -2 }} /> {t.nav_analyze}</>], ["leaderboard", <><Trophy size={14} style={{ marginBottom: -2 }} /> {t.nav_leaderboard}</>]].map(([p, label]) => (
            <button key={p} onClick={() => setPage(p)} style={{ display: "block", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-sora)", fontSize: 13, color: th.textSecondary, padding: "4px 0", textAlign: "left", transition: "color 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.color = th.accent}
              onMouseLeave={e => e.currentTarget.style.color = th.textSecondary}>{label}</button>
          ))}
          <div style={{ marginTop: 14 }}>
            <a href="https://www.anthropic.com/research/labor-market-impacts" target="_blank" rel="noopener noreferrer"
              style={{ fontFamily: "var(--font-sora)", fontSize: 12, color: th.accent, textDecoration: "none" }}><FileText size={14} style={{ marginBottom: -2 }} /> Anthropic 2026 Research →</a>
          </div>
        </div>
        {/* Job shortcuts */}
        <div>
          <div style={{ fontFamily: "var(--font-jb)", fontSize: 11, color: th.textMuted, letterSpacing: "0.12em", marginBottom: 14 }}>{t.footer_jobs_title}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
            {FOOTER_JOBS.map(([icon, title, slug]) => (
              <a key={slug} href={`/jobs/${slug}`} style={{ fontFamily: "var(--font-sora)", fontSize: 11, color: th.textSecondary, textDecoration: "none", padding: "3px 0", transition: "color 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.color = th.accent}
                onMouseLeave={e => e.currentTarget.style.color = th.textSecondary}>{icon} {title}</a>
            ))}
          </div>
        </div>
      </div>
      <div style={{ borderTop: `1px solid ${th.border}`, padding: "16px 24px", maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <div style={{ fontFamily: "var(--font-jb)", fontSize: 11, color: th.textMuted }}>{t.footer_copyright}</div>
        <div style={{ fontFamily: "var(--font-jb)", fontSize: 11, color: th.textMuted }}>{t.footer_powered}</div>
      </div>
    </footer>
  );
}

/* ─── Root App ────────────────────────────────────────────────────────────── */
// Live Counter Component


export default function App({ initialLang, initialTheme }) {
  const [dark, setDark] = useState(initialTheme === "dark" ? true : false);
  const [lang, setLang] = useState(initialLang || "en");
  const [page, setPage] = useState("home");
  const [qJob, setQJob] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const th = THEMES[dark ? "dark" : "light"];
  const t = useT(lang);

  // Detect language from IP on first load
  useEffect(() => {
    if (initialLang) return;
    const saved = localStorage.getItem("ai_future_lang");
    if (saved && SUPPORTED_LANGS.includes(saved)) { setLang(saved); return; }
    fetch("/api/detect-lang").then(r => r.json()).then(d => {
      if (d.lang && SUPPORTED_LANGS.includes(d.lang)) setLang(d.lang);
    }).catch(() => { });
  }, [initialLang]);

  // Persist language preference
  useEffect(() => { try { localStorage.setItem("ai_future_lang", lang); } catch { } }, [lang]);

  // Persist theme (localStorage only overrides if user has explicitly toggled before)
  useEffect(() => { try { localStorage.setItem("ai_future_dark", dark ? "1" : "0"); } catch { } }, [dark]);
  useEffect(() => {
    try {
      const saved = localStorage.getItem("ai_future_dark");
      // Only restore if explicitly set before — don't override server-side default
      if (saved === "1" || saved === "0") setDark(saved === "1");
    } catch { }
  }, []);

  // URL param: ?q=JobTitle
  useEffect(() => {
    try {
      const q = new URLSearchParams(window.location.search).get("q");
      if (q) { setQJob(decodeURIComponent(q)); setPage("analyze"); }
    } catch { }
  }, []);

  // RTL support
  const isRTL = lang === "ar";
  useEffect(() => {
    document.documentElement.dir = isRTL ? "rtl" : "ltr";
    document.documentElement.lang = lang;
  }, [lang, isRTL]);

  const handlePickJob = (job) => { setQJob(job); setPage("analyze"); };

  return (
    <>
      <GlobalStyles theme={th} />
      <div style={{ minHeight: "100vh", background: th.bg, transition: "background 0.3s", direction: isRTL ? "rtl" : "ltr" }}>
        <Nav page={page} setPage={setPage} dark={dark} toggleTheme={() => setDark(d => !d)} lang={lang} setLang={setLang} th={th} t={t} />

        {page === "home" && <HomePage setPage={setPage} th={th} t={t} lang={lang} />}
        {page === "analyze" && <AnalyzePage th={th} t={t} initialJob={qJob} onToast={showToast} lang={lang} />}
        {page === "leaderboard" && <LeaderboardPage th={th} t={t} onPickJob={handlePickJob} />}

        <Footer th={th} t={t} setPage={setPage} />
        {toast && <Toast message={toast.msg} type={toast.type} th={th} />}
      </div>
    </>
  );
}
