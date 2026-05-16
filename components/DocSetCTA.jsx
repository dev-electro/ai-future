import { ArrowRight, FileText, Settings, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useT } from "@/lib/i18n";

export default function DocSetCTA({ th, isIndian, t, lang }) {
    if (!t) {
        // Fallback or use standard hook if not passed
        t = useT ? useT(lang || "en") : {};
    }

    if (!th) {
        // Fallback theme if not provided
        th = {
            surface: "#11151B",
            surface2: "#191E27",
            border: "rgba(240, 234, 214, 0.08)",
            accent: "#C49A4A",
            textPrimary: "#FFFFFF",
            textSecondary: "#A5B0BA",
            textMuted: "#63707D",
            bg: "#0B0F14",
            cardShadow: "0 10px 40px rgba(0,0,0,0.6)"
        };
    }

    return (
        <div style={{
            background: `linear-gradient(135deg, ${th.surface}, ${th.surface2})`,
            border: `1px solid ${th.border}`,
            borderRadius: 16,
            padding: "24px 32px",
            marginTop: 24,
            display: "flex",
            flexDirection: "column",
            gap: 16,
            boxShadow: th.cardShadow,
            position: "relative",
            overflow: "hidden"
        }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${th.accent}, transparent)` }} />

            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: `${th.accent}12`, border: `1px solid ${th.accent}30`, display: "flex", alignItems: "center", justifyContent: "center", color: th.accent, flexShrink: 0 }}>
                    <FileText size={24} />
                </div>
                <div>
                    <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 800, color: th.textPrimary, letterSpacing: "-0.3px", marginBottom: 6, lineHeight: 1.2 }}>
                        {isIndian ? (t.docset_indian_q || "Thinking of an AI Pivot in India?") : (t.docset_global_q || "Thinking of an AI Pivot?")}
                    </h3>
                    <p style={{ fontFamily: "'Sora', sans-serif", fontSize: 13, color: th.textSecondary, margin: 0, lineHeight: 1.6 }}>
                        {isIndian ? (t.docset_indian_a || "DocSet's local models ensure your data never leaves your devices while analyzing Indian job markets.") : (t.docset_global_a || "DocSet's local models ensure your data never leaves your devices while analyzing job markets.")}
                    </p>
                </div>
            </div>

            <div style={{ display: "flex", gap: 16, marginTop: 4, flexWrap: "wrap" }}>
                {[
                    { icon: <ShieldCheck size={14} />, text: t.docset_private || "100% Private" },
                    { icon: <Settings size={14} />, text: t.docset_local || "Local Browser Processing" },
                    { icon: <FileText size={14} />, text: t.docset_free || "Free Forever" }
                ].map((item, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: th.textMuted }}>
                        <span style={{ color: th.accent }}>{item.icon}</span> {item.text}
                    </div>
                ))}
            </div>

            <a
                href="https://docset.in"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
                    background: `linear-gradient(135deg, ${th.accent}, #cca13a)`,
                    color: ((th.surface === "#FFFFFF") ? "#FFFFFF" : th.bg), // Ensure high contrast text on the button
                    padding: "12px 28px", borderRadius: 12,
                    fontFamily: "'Sora', sans-serif", fontWeight: 600, fontSize: 14,
                    textDecoration: "none", alignSelf: "flex-start", marginTop: 4,
                    transition: "transform 0.2s, box-shadow 0.2s"
                }}
                onMouseEnter={e => {
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.boxShadow = `0 8px 24px ${th.accent}30`;
                }}
                onMouseLeave={e => {
                    e.currentTarget.style.transform = "none";
                    e.currentTarget.style.boxShadow = "none";
                }}
            >
                {t.docset_visit || "Visit DocSet.in"} <ArrowRight size={16} />
            </a>
        </div>
    );
}
