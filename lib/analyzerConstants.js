/**
 * lib/analyzerConstants.js
 * All static data for the AI Exposure Analyzer.
 * Extracted from AIJobAnalyzer.jsx for tree-shaking + cleaner imports.
 */
import { Laptop, Headphones, Keyboard, Phone, PenTool, Receipt, BarChart2, Stethoscope, Scale, FileText, Monitor, Globe, Shield, TrendingUp, Calculator, Building2, Megaphone, Newspaper, Users, Palette, Home, Hospital, School, Landmark, Pill, Brain, ShieldAlert, PawPrint, Bone, ChefHat, Zap, Wrench, Flame, Beer, LifeBuoy, Bike, Wheat, HeartHandshake, AlertTriangle, Eye, Check } from "lucide-react";

/* ─── Leaderboard data ────────────────────────────────────────────────────────
 * Scores = Anthropic "observed exposure" % — Massenkoff & McCrory (2026)
 * Bands: 75-100 Very High | 50-74 High | 20-49 Moderate | 5-19 Low | 0-4 Minimal
 */
export const LB_DATA = [
  { rank: 1,  title: "Computer Programmer",      score: 92, level: "Very High", category: "Computer & Math",    coverage: "92%", blsGrowth: -10, blsDir: "Declining",     icon: <Laptop size={18} /> },
  { rank: 2,  title: "Customer Service Rep",      score: 88, level: "Very High", category: "Office & Admin",     coverage: "88%", blsGrowth: -2,  blsDir: "Declining",     icon: <Headphones size={18} /> },
  { rank: 3,  title: "Data Entry Keyer",          score: 87, level: "Very High", category: "Office & Admin",     coverage: "87%", blsGrowth: -8,  blsDir: "Declining",     icon: <Keyboard size={18} /> },
  { rank: 4,  title: "Telemarketer",              score: 85, level: "Very High", category: "Sales",              coverage: "65%", blsGrowth: -14, blsDir: "Declining",     icon: <Phone size={18} /> },
  { rank: 5,  title: "Proofreader",               score: 84, level: "Very High", category: "Arts & Media",       coverage: "63%", blsGrowth: -9,  blsDir: "Declining",     icon: <PenTool size={18} /> },
  { rank: 6,  title: "Tax Preparer",              score: 82, level: "Very High", category: "Business & Finance", coverage: "62%", blsGrowth: -4,  blsDir: "Declining",     icon: <Receipt size={18} /> },
  { rank: 7,  title: "Financial Analyst",         score: 80, level: "Very High", category: "Business & Finance", coverage: "60%", blsGrowth: 8,   blsDir: "Growing",       icon: <BarChart2 size={18} /> },
  { rank: 8,  title: "Paralegal",                 score: 78, level: "Very High", category: "Legal",              coverage: "58%", blsGrowth: 4,   blsDir: "Growing",       icon: <Scale size={18} /> },
  { rank: 9,  title: "Medical Transcriptionist",  score: 77, level: "Very High", category: "Healthcare",         coverage: "57%", blsGrowth: -7,  blsDir: "Declining",     icon: <Stethoscope size={18} /> },
  { rank: 10, title: "Bookkeeping Clerk",         score: 75, level: "Very High", category: "Business & Finance", coverage: "55%", blsGrowth: -3,  blsDir: "Flat",          icon: <BarChart2 size={18} /> },
  { rank: 11, title: "Technical Writer",          score: 64, level: "High",      category: "Arts & Media",       coverage: "52%", blsGrowth: 4,   blsDir: "Growing",       icon: <FileText size={18} /> },
  { rank: 12, title: "Software Developer",        score: 65, level: "High",      category: "Computer & Math",    coverage: "52%", blsGrowth: 17,  blsDir: "Strong Growth", icon: <Monitor size={18} /> },
  { rank: 13, title: "Translator",                score: 60, level: "High",      category: "Arts & Media",       coverage: "48%", blsGrowth: 4,   blsDir: "Growing",       icon: <Globe size={18} /> },
  { rank: 14, title: "Market Research Analyst",   score: 56, level: "High",      category: "Business & Finance", coverage: "48%", blsGrowth: 10,  blsDir: "Strong Growth", icon: <TrendingUp size={18} /> },
  { rank: 15, title: "Insurance Underwriter",     score: 58, level: "High",      category: "Business & Finance", coverage: "46%", blsGrowth: -4,  blsDir: "Declining",     icon: <Shield size={18} /> },
  { rank: 16, title: "Accountant / Auditor",      score: 55, level: "High",      category: "Business & Finance", coverage: "45%", blsGrowth: 4,   blsDir: "Growing",       icon: <Calculator size={18} /> },
  { rank: 17, title: "Lawyer / Attorney",         score: 45, level: "Moderate",  category: "Legal",              coverage: "35%", blsGrowth: 5,   blsDir: "Growing",       icon: <Scale size={18} /> },
  { rank: 18, title: "Management Consultant",     score: 48, level: "Moderate",  category: "Management",         coverage: "35%", blsGrowth: 11,  blsDir: "Strong Growth", icon: <Building2 size={18} /> },
  { rank: 19, title: "Marketing Manager",         score: 40, level: "Moderate",  category: "Management",         coverage: "32%", blsGrowth: 6,   blsDir: "Growing",       icon: <Megaphone size={18} /> },
  { rank: 20, title: "HR Specialist",             score: 38, level: "Moderate",  category: "Management",         coverage: "30%", blsGrowth: 6,   blsDir: "Growing",       icon: <Users size={18} /> },
  { rank: 21, title: "Graphic Designer",          score: 35, level: "Moderate",  category: "Arts & Media",       coverage: "30%", blsGrowth: 3,   blsDir: "Growing",       icon: <Palette size={18} /> },
  { rank: 22, title: "Journalist / Reporter",     score: 30, level: "Moderate",  category: "Arts & Media",       coverage: "28%", blsGrowth: -5,  blsDir: "Declining",     icon: <Newspaper size={18} /> },
  { rank: 23, title: "Registered Nurse",          score: 28, level: "Moderate",  category: "Healthcare",         coverage: "28%", blsGrowth: 6,   blsDir: "Growing",       icon: <Hospital size={18} /> },
  { rank: 24, title: "Architect",                 score: 25, level: "Moderate",  category: "Management",         coverage: "25%", blsGrowth: 2,   blsDir: "Flat",          icon: <Landmark size={18} /> },
  { rank: 25, title: "High School Teacher",       score: 22, level: "Moderate",  category: "Education",          coverage: "22%", blsGrowth: 1,   blsDir: "Flat",          icon: <School size={18} /> },
  { rank: 26, title: "Pharmacist",                score: 35, level: "Moderate",  category: "Healthcare",         coverage: "22%", blsGrowth: -2,  blsDir: "Flat",          icon: <Pill size={18} /> },
  { rank: 27, title: "Real Estate Agent",         score: 18, level: "Low",       category: "Sales",              coverage: "18%", blsGrowth: 3,   blsDir: "Growing",       icon: <Home size={18} /> },
  { rank: 28, title: "Social Worker",             score: 18, level: "Low",       category: "Community & Social", coverage: "18%", blsGrowth: 7,   blsDir: "Growing",       icon: <HeartHandshake size={18} /> },
  { rank: 29, title: "Psychologist",              score: 15, level: "Low",       category: "Healthcare",         coverage: "15%", blsGrowth: 7,   blsDir: "Growing",       icon: <Brain size={18} /> },
  { rank: 30, title: "Police Officer",            score: 12, level: "Low",       category: "Protective Service", coverage: "12%", blsGrowth: 3,   blsDir: "Growing",       icon: <ShieldAlert size={18} /> },
  { rank: 31, title: "Veterinarian",              score: 12, level: "Low",       category: "Healthcare",         coverage: "12%", blsGrowth: 19,  blsDir: "Strong Growth", icon: <PawPrint size={18} /> },
  { rank: 32, title: "Physical Therapist",        score: 10, level: "Low",       category: "Healthcare",         coverage: "10%", blsGrowth: 15,  blsDir: "Strong Growth", icon: <Bone size={18} /> },
  { rank: 33, title: "Chef / Cook",               score: 6,  level: "Low",       category: "Food Service",       coverage: "6%",  blsGrowth: 6,   blsDir: "Growing",       icon: <ChefHat size={18} /> },
  { rank: 34, title: "Electrician",               score: 6,  level: "Low",       category: "Construction",       coverage: "6%",  blsGrowth: 11,  blsDir: "Strong Growth", icon: <Zap size={18} /> },
  { rank: 35, title: "Plumber",                   score: 5,  level: "Low",       category: "Construction",       coverage: "5%",  blsGrowth: 7,   blsDir: "Growing",       icon: <Wrench size={18} /> },
  { rank: 36, title: "Firefighter",               score: 4,  level: "Minimal",   category: "Protective Service", coverage: "4%",  blsGrowth: 4,   blsDir: "Growing",       icon: <Flame size={18} /> },
  { rank: 37, title: "Bartender",                 score: 3,  level: "Minimal",   category: "Food Service",       coverage: "3%",  blsGrowth: 2,   blsDir: "Flat",          icon: <Beer size={18} /> },
  { rank: 38, title: "Lifeguard",                 score: 2,  level: "Minimal",   category: "Protective Service", coverage: "2%",  blsGrowth: 8,   blsDir: "Growing",       icon: <LifeBuoy size={18} /> },
  { rank: 39, title: "Bicycle Mechanic",          score: 2,  level: "Minimal",   category: "Construction",       coverage: "2%",  blsGrowth: 5,   blsDir: "Growing",       icon: <Bike size={18} /> },
  { rank: 40, title: "Agricultural Worker",       score: 1,  level: "Minimal",   category: "Agriculture",        coverage: "1%",  blsGrowth: -2,  blsDir: "Declining",     icon: <Wheat size={18} /> },
];

export const QUICK_PICKS = [
  "Software Engineer", "Registered Nurse", "Financial Analyst", "Lawyer",
  "Teacher", "Graphic Designer", "Electrician", "Data Scientist",
  "Accountant", "Marketing Manager", "Paralegal", "Physical Therapist",
];

/* ─── Theme tokens ────────────────────────────────────────────────────────── */
export const THEMES = {
  dark: {
    bg: "#0B0F14",
    surface: "#11151B",
    surface2: "#191E27",
    surface3: "#262D38",
    border: "rgba(240, 234, 214, 0.08)",
    border2: "rgba(240, 234, 214, 0.15)",
    textPrimary: "#F0EAD6",
    textSecondary: "#A5B0BA",
    textMuted: "#63707D",
    accent: "#C49A4A",
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
  },
};

export const LEVELS = {
  "Very High": { color: "#C4614A", glow: "rgba(196, 97, 74, 0.25)",  label: "CRITICAL RISK" },
  "High":      { color: "#D4943A", glow: "rgba(212, 148, 58, 0.25)", label: "HIGH RISK" },
  "Moderate":  { color: "#C49A4A", glow: "rgba(196, 154, 74, 0.2)",  label: "MODERATE EXPOSURE" },
  "Low":       { color: "#5B9E78", glow: "rgba(91, 158, 120, 0.2)",  label: "LOW RISK" },
  "Minimal":   { color: "#6B9FD4", glow: "rgba(107, 159, 212, 0.2)", label: "SECURE" },
};

export const BLS_C = {
  "Declining":     "#C4614A",
  "Flat":          "#A5B0BA",
  "Growing":       "#5B9E78",
  "Strong Growth": "#7DC49A",
};

export const URGENCY = {
  "Act Now":          { color: "#C4614A", icon: <AlertTriangle size={18} />, bg: "rgba(196, 97, 74, 0.1)" },
  "Act Soon":         { color: "#D4943A", icon: <Zap size={18} />,           bg: "rgba(212, 148, 58, 0.1)" },
  "Monitor & Prepare":{ color: "#C49A4A", icon: <Eye size={18} />,           bg: "rgba(196, 154, 74, 0.1)" },
  "Stay Sharp":       { color: "#5B9E78", icon: <Check size={18} />,         bg: "rgba(91, 158, 120, 0.1)" },
};

/* ─── localStorage helpers ────────────────────────────────────────────────── */
const LS_CACHE_KEY   = "aif_result_cache_v1";
const LS_HISTORY_KEY = "aif_history_v1";
const LS_TTL         = 7 * 24 * 60 * 60 * 1000; // 7 days

export function lsGet(title) {
  try {
    const raw = localStorage.getItem(LS_CACHE_KEY);
    if (!raw) return null;
    const cache = JSON.parse(raw);
    const key   = title.trim().toLowerCase();
    const entry = cache[key];
    if (!entry) return null;
    if (Date.now() - entry.ts > LS_TTL) {
      delete cache[key];
      localStorage.setItem(LS_CACHE_KEY, JSON.stringify(cache));
      return null;
    }
    return entry.result;
  } catch { return null; }
}

export function lsSet(title, result) {
  try {
    const raw   = localStorage.getItem(LS_CACHE_KEY);
    const cache = raw ? JSON.parse(raw) : {};
    const key   = title.trim().toLowerCase();
    cache[key]  = { result, ts: Date.now() };
    const entries = Object.entries(cache).sort((a, b) => b[1].ts - a[1].ts).slice(0, 50);
    localStorage.setItem(LS_CACHE_KEY, JSON.stringify(Object.fromEntries(entries)));
  } catch { /* storage full */ }
}

export function lsGetHistory() {
  try { return JSON.parse(localStorage.getItem(LS_HISTORY_KEY) || "[]"); } catch { return []; }
}

export function lsSaveHistory(h) {
  try { localStorage.setItem(LS_HISTORY_KEY, JSON.stringify(h)); } catch { }
}
