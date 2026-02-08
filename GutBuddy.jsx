import { useState, useEffect, useRef } from "react";

// ─── Constants ───
const COLORS = {
  gold: "#D4AF37",
  goldLight: "#F5E6B8",
  goldDark: "#B8960F",
  mint: "#A8E6CF",
  mintLight: "#D4F5E6",
  mintDark: "#6BCF9F",
  cream: "#FFF9F0",
  creamDark: "#FFF0D6",
  white: "#FFFFFF",
  black: "#1A1A1A",
  gray: "#8E8E93",
  grayLight: "#C7C7CC",
  grayUltraLight: "#F2F2F7",
  red: "#FF3B30",
  green: "#34C759",
  blue: "#007AFF",
  orange: "#FF9500",
};

const MOODS = ["😄", "😊", "😐", "😣", "😫"];
const MOOD_LABELS = ["Great", "Good", "Okay", "Bad", "Awful"];

const BRISTOL_SCALE = [
  { type: 1, emoji: "🫘", desc: "Hard lumps", meaning: "Constipation" },
  { type: 2, emoji: "🥜", desc: "Lumpy sausage", meaning: "Mild constipation" },
  { type: 3, emoji: "🌭", desc: "Cracked sausage", meaning: "Normal" },
  { type: 4, emoji: "🍌", desc: "Smooth & soft", meaning: "Ideal" },
  { type: 5, emoji: "🫓", desc: "Soft blobs", meaning: "Low fiber" },
  { type: 6, emoji: "🍜", desc: "Mushy", meaning: "Mild diarrhea" },
  { type: 7, emoji: "💧", desc: "Watery", meaning: "Diarrhea" },
];

const BADGES = [
  { id: 1, emoji: "🌱", name: "First Log", desc: "Log your first meal", unlocked: true },
  { id: 2, emoji: "🔥", name: "3-Day Streak", desc: "Log 3 days in a row", unlocked: true },
  { id: 3, emoji: "💧", name: "Hydration Hero", desc: "Log water 7 days", unlocked: false },
  { id: 4, emoji: "🥗", name: "Veggie Lover", desc: "Log 10 salads", unlocked: false },
  { id: 5, emoji: "🧘", name: "Mindful Eater", desc: "Rate mood 14 days", unlocked: false },
  { id: 6, emoji: "🏆", name: "Monthly Master", desc: "Complete a full month", unlocked: false },
];

const LEVELS = [
  { name: "Seed", emoji: "🌱", minExp: 0 },
  { name: "Sprout", emoji: "🌿", minExp: 100 },
  { name: "Sapling", emoji: "🌳", minExp: 300 },
  { name: "Flower", emoji: "🌸", minExp: 600 },
  { name: "Bloom", emoji: "🌺", minExp: 1000 },
];

const DAYS_IN_MONTH = 31;
const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// ─── Utility Components ───

function CircularProgress({ value, size = 120, strokeWidth = 10, color = COLORS.gold, bgColor = COLORS.goldLight, children }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={bgColor} strokeWidth={strokeWidth} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s ease" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        {children}
      </div>
    </div>
  );
}

function ProgressBar({ value, max, color = COLORS.gold, bg = COLORS.goldLight, height = 8, label, showValue }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div style={{ width: "100%" }}>
      {label && <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 12, color: COLORS.gray }}>
        <span>{label}</span>
        {showValue && <span>{value}/{max}</span>}
      </div>}
      <div style={{ width: "100%", height, borderRadius: height, backgroundColor: bg, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", borderRadius: height, backgroundColor: color, transition: "width 0.8s ease" }} />
      </div>
    </div>
  );
}

function Card({ children, style, onClick }) {
  return (
    <div onClick={onClick} style={{
      backgroundColor: COLORS.white, borderRadius: 16, padding: 16,
      boxShadow: "0 2px 12px rgba(0,0,0,0.06)", ...style,
      cursor: onClick ? "pointer" : "default",
    }}>
      {children}
    </div>
  );
}

function Button({ children, variant = "primary", style, onClick, disabled }) {
  const base = {
    padding: "12px 24px", borderRadius: 12, border: "none", fontSize: 15, fontWeight: 600,
    cursor: disabled ? "not-allowed" : "pointer", transition: "all 0.2s", display: "flex",
    alignItems: "center", justifyContent: "center", gap: 8, opacity: disabled ? 0.5 : 1,
    fontFamily: "'SF Pro Display', -apple-system, sans-serif",
  };
  const variants = {
    primary: { backgroundColor: COLORS.gold, color: COLORS.white },
    secondary: { backgroundColor: COLORS.mintLight, color: COLORS.mintDark },
    outline: { backgroundColor: "transparent", color: COLORS.gold, border: `2px solid ${COLORS.gold}` },
    ghost: { backgroundColor: "transparent", color: COLORS.gray },
  };
  return <button onClick={onClick} disabled={disabled} style={{ ...base, ...variants[variant], ...style }}>{children}</button>;
}

// ─── Onboarding ───

function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState({ name: "", gender: "", goals: [], symptoms: [], frequency: "", alarmTime: "08:00" });

  const GOALS = [
    { label: "Improve Digestion", icon: "🫄", desc: "Better breakdown & absorption" },
    { label: "Reduce Bloating", icon: "🎈", desc: "Less discomfort after meals" },
    { label: "Better Regularity", icon: "📅", desc: "Consistent bowel habits" },
    { label: "Weight Management", icon: "⚖️", desc: "Healthy weight through gut" },
    { label: "Food Sensitivity", icon: "🔍", desc: "Identify trigger foods" },
    { label: "Overall Wellness", icon: "✨", desc: "General gut happiness" },
  ];
  const SYMPTOMS = [
    { label: "Bloating", icon: "🎈" },
    { label: "Gas", icon: "💨" },
    { label: "Constipation", icon: "🧱" },
    { label: "Diarrhea", icon: "💧" },
    { label: "Heartburn", icon: "🔥" },
    { label: "Cramping", icon: "⚡" },
    { label: "Nausea", icon: "🤢" },
    { label: "None", icon: "✅" },
  ];
  const FREQUENCIES = [
    { label: "Multiple times/day", icon: "⚡", sub: "3+ times daily" },
    { label: "Once a day", icon: "☀️", sub: "Regular daily" },
    { label: "Every other day", icon: "🔄", sub: "Alternating days" },
    { label: "2-3 times/week", icon: "📊", sub: "A few per week" },
    { label: "Once a week", icon: "📌", sub: "Weekly" },
    { label: "Less than weekly", icon: "🐌", sub: "Irregular" },
  ];
  const GENDERS = [
    { label: "Male", icon: "👨" },
    { label: "Female", icon: "👩" },
    { label: "Other", icon: "🧑" },
  ];

  const totalSteps = 5;
  const canNext = step === 0 || (step === 1 && data.name) || (step === 2 && data.goals.length > 0) || (step === 3 && data.symptoms.length > 0) || (step === 4 && data.frequency);

  // ── Step Header with illustration ──
  const StepHeader = ({ icon, title, subtitle }) => (
    <div style={{ textAlign: "center", marginBottom: 28 }}>
      <div style={{
        width: 80, height: 80, borderRadius: 24, margin: "0 auto 16px",
        background: `linear-gradient(135deg, ${COLORS.goldLight} 0%, ${COLORS.mintLight} 100%)`,
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 38,
        boxShadow: "0 8px 24px rgba(212,175,55,0.15)",
      }}>
        {icon}
      </div>
      <h2 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 6px", color: COLORS.black, fontFamily: "'SF Pro Display', -apple-system, sans-serif", letterSpacing: "-0.3px" }}>{title}</h2>
      <p style={{ fontSize: 15, color: COLORS.gray, margin: 0, lineHeight: 1.4 }}>{subtitle}</p>
    </div>
  );

  // ── Navigation bar ──
  const NavBar = () => (
    <div style={{ padding: "14px 24px 10px", display: "flex", alignItems: "center", gap: 14 }}>
      <button onClick={() => setStep(step - 1)}
        style={{
          width: 36, height: 36, borderRadius: 12, border: "none", cursor: "pointer",
          backgroundColor: COLORS.white, display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 18, color: COLORS.black, boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        }}>
        ‹
      </button>
      <div style={{ flex: 1, display: "flex", gap: 6 }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{
            flex: 1, height: 5, borderRadius: 3, transition: "all 0.4s ease",
            backgroundColor: i <= step ? COLORS.gold : "rgba(0,0,0,0.06)",
            boxShadow: i <= step ? "0 1px 4px rgba(212,175,55,0.3)" : "none",
          }} />
        ))}
      </div>
      <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.gold, minWidth: 28, textAlign: "right" }}>{step}/4</span>
    </div>
  );

  // ── Bottom CTA ──
  const BottomCTA = ({ label = "Continue" }) => (
    <div style={{ padding: "12px 24px 20px" }}>
      <button onClick={() => step < totalSteps - 1 ? setStep(step + 1) : onComplete(data)} disabled={!canNext}
        style={{
          width: "100%", padding: "16px 24px", borderRadius: 16, border: "none", fontSize: 17, fontWeight: 700,
          cursor: canNext ? "pointer" : "not-allowed", transition: "all 0.3s",
          fontFamily: "'SF Pro Display', -apple-system, sans-serif",
          background: canNext ? `linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 100%)` : COLORS.grayLight,
          color: canNext ? COLORS.white : COLORS.gray,
          boxShadow: canNext ? "0 6px 20px rgba(212,175,55,0.35)" : "none",
          transform: canNext ? "translateY(0)" : "none",
        }}>
        {label}
      </button>
    </div>
  );

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", backgroundColor: COLORS.cream }}>

      {/* ══════ Step 0: Welcome ══════ */}
      {step === 0 && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 28px", textAlign: "center" }}>
          {/* Floating orbs background */}
          <div style={{ position: "absolute", top: 40, left: 30, width: 120, height: 120, borderRadius: "50%", background: COLORS.mintLight, opacity: 0.4, filter: "blur(40px)" }} />
          <div style={{ position: "absolute", bottom: 120, right: 20, width: 160, height: 160, borderRadius: "50%", background: COLORS.goldLight, opacity: 0.4, filter: "blur(50px)" }} />
          <div style={{ position: "absolute", top: 160, right: 40, width: 80, height: 80, borderRadius: "50%", background: COLORS.goldLight, opacity: 0.3, filter: "blur(30px)" }} />

          <div style={{ position: "relative", zIndex: 1 }}>
            {/* Logo mark */}
            <div style={{
              width: 110, height: 110, borderRadius: 32, margin: "0 auto 28px",
              background: `linear-gradient(145deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 100%)`,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 56,
              boxShadow: "0 12px 40px rgba(212,175,55,0.3)",
            }}>
              🌱
            </div>

            <h1 style={{ fontSize: 32, fontWeight: 800, color: COLORS.black, margin: "0 0 10px", fontFamily: "'SF Pro Display', -apple-system, sans-serif", letterSpacing: "-0.5px" }}>
              GutBuddy
            </h1>
            <p style={{ fontSize: 17, color: COLORS.gray, margin: "0 0 8px", lineHeight: 1.5 }}>
              Your personal gut health companion
            </p>
            <p style={{ fontSize: 14, color: COLORS.grayLight, margin: "0 0 44px", lineHeight: 1.4 }}>
              Track meals, monitor patterns,<br/>and feel your best every day.
            </p>

            {/* Feature highlights */}
            <div style={{ display: "flex", justifyContent: "center", gap: 20, marginBottom: 44 }}>
              {[
                { icon: "📊", label: "Track" },
                { icon: "🧠", label: "Analyze" },
                { icon: "🌟", label: "Improve" },
              ].map(f => (
                <div key={f.label} style={{ textAlign: "center" }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: 16, backgroundColor: COLORS.white,
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24,
                    margin: "0 auto 6px", boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                  }}>
                    {f.icon}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.gray }}>{f.label}</span>
                </div>
              ))}
            </div>

            <button onClick={() => setStep(1)}
              style={{
                width: "100%", padding: "17px 24px", borderRadius: 16, border: "none", fontSize: 17, fontWeight: 700,
                cursor: "pointer", fontFamily: "'SF Pro Display', -apple-system, sans-serif",
                background: `linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 100%)`,
                color: COLORS.white, boxShadow: "0 8px 24px rgba(212,175,55,0.35)",
              }}>
              Get Started
            </button>
            <p style={{ fontSize: 12, color: COLORS.grayLight, marginTop: 14 }}>Takes less than 2 minutes</p>
          </div>
        </div>
      )}

      {/* ══════ Step 1: Name & Gender ══════ */}
      {step === 1 && (
        <>
          <NavBar />
          <div style={{ flex: 1, overflow: "auto", padding: "10px 24px 0" }}>
            <StepHeader icon="👋" title="About You" subtitle="Let's start with the basics" />

            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: COLORS.black, display: "block", marginBottom: 8 }}>What should we call you?</label>
              <input value={data.name} onChange={e => setData({ ...data, name: e.target.value })}
                placeholder="Your name"
                style={{
                  width: "100%", padding: "16px 18px", borderRadius: 14, fontSize: 17,
                  border: `2px solid ${data.name ? COLORS.gold : COLORS.grayLight}`,
                  backgroundColor: COLORS.white, boxSizing: "border-box", outline: "none",
                  fontFamily: "'SF Pro Display', -apple-system, sans-serif",
                  transition: "border-color 0.3s",
                }} />
            </div>

            <label style={{ fontSize: 13, fontWeight: 600, color: COLORS.black, display: "block", marginBottom: 10 }}>Gender</label>
            <div style={{ display: "flex", gap: 10 }}>
              {GENDERS.map(g => (
                <button key={g.label} onClick={() => setData({ ...data, gender: g.label })}
                  style={{
                    flex: 1, padding: "18px 8px", borderRadius: 16, cursor: "pointer",
                    border: `2px solid ${data.gender === g.label ? COLORS.gold : "rgba(0,0,0,0.06)"}`,
                    backgroundColor: data.gender === g.label ? COLORS.goldLight : COLORS.white,
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                    transition: "all 0.2s", boxShadow: data.gender === g.label ? "0 4px 14px rgba(212,175,55,0.18)" : "0 2px 8px rgba(0,0,0,0.04)",
                    fontFamily: "'SF Pro Display', -apple-system, sans-serif",
                  }}>
                  <span style={{ fontSize: 30 }}>{g.icon}</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: data.gender === g.label ? COLORS.goldDark : COLORS.gray }}>{g.label}</span>
                </button>
              ))}
            </div>
          </div>
          <BottomCTA />
        </>
      )}

      {/* ══════ Step 2: Health Goals ══════ */}
      {step === 2 && (
        <>
          <NavBar />
          <div style={{ flex: 1, overflow: "auto", padding: "10px 24px 0" }}>
            <StepHeader icon="🎯" title="Your Goals" subtitle="Select all that apply to you" />

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {GOALS.map(g => {
                const sel = data.goals.includes(g.label);
                return (
                  <button key={g.label}
                    onClick={() => setData({ ...data, goals: sel ? data.goals.filter(x => x !== g.label) : [...data.goals, g.label] })}
                    style={{
                      display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 16,
                      border: `2px solid ${sel ? COLORS.mint : "rgba(0,0,0,0.05)"}`,
                      backgroundColor: sel ? COLORS.mintLight : COLORS.white,
                      cursor: "pointer", transition: "all 0.2s", textAlign: "left",
                      boxShadow: sel ? "0 4px 14px rgba(168,230,207,0.25)" : "0 2px 8px rgba(0,0,0,0.03)",
                    }}>
                    <div style={{
                      width: 46, height: 46, borderRadius: 14, flexShrink: 0,
                      backgroundColor: sel ? "rgba(255,255,255,0.7)" : COLORS.cream,
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
                    }}>
                      {g.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.black, fontFamily: "'SF Pro Display', -apple-system, sans-serif" }}>{g.label}</div>
                      <div style={{ fontSize: 12, color: COLORS.gray, marginTop: 2 }}>{g.desc}</div>
                    </div>
                    <div style={{
                      width: 24, height: 24, borderRadius: 12, flexShrink: 0,
                      border: `2px solid ${sel ? COLORS.mintDark : COLORS.grayLight}`,
                      backgroundColor: sel ? COLORS.mintDark : "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "all 0.2s",
                    }}>
                      {sel && <span style={{ color: COLORS.white, fontSize: 13, fontWeight: 700 }}>✓</span>}
                    </div>
                  </button>
                );
              })}
            </div>
            {data.goals.length > 0 && (
              <p style={{ textAlign: "center", fontSize: 13, color: COLORS.mintDark, fontWeight: 600, marginTop: 14 }}>
                {data.goals.length} goal{data.goals.length > 1 ? "s" : ""} selected
              </p>
            )}
          </div>
          <BottomCTA />
        </>
      )}

      {/* ══════ Step 3: Symptoms ══════ */}
      {step === 3 && (
        <>
          <NavBar />
          <div style={{ flex: 1, overflow: "auto", padding: "10px 24px 0" }}>
            <StepHeader icon="🩺" title="Current Symptoms" subtitle="What are you experiencing? Select all." />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {SYMPTOMS.map(s => {
                const sel = data.symptoms.includes(s.label);
                return (
                  <button key={s.label}
                    onClick={() => setData({ ...data, symptoms: sel ? data.symptoms.filter(x => x !== s.label) : [...data.symptoms, s.label] })}
                    style={{
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                      padding: "18px 10px", borderRadius: 16, cursor: "pointer",
                      border: `2px solid ${sel ? COLORS.gold : "rgba(0,0,0,0.05)"}`,
                      backgroundColor: sel ? COLORS.goldLight : COLORS.white,
                      transition: "all 0.2s",
                      boxShadow: sel ? "0 4px 14px rgba(212,175,55,0.18)" : "0 2px 8px rgba(0,0,0,0.03)",
                    }}>
                    <span style={{ fontSize: 30 }}>{s.icon}</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: sel ? COLORS.goldDark : COLORS.black, fontFamily: "'SF Pro Display', -apple-system, sans-serif" }}>
                      {s.label}
                    </span>
                  </button>
                );
              })}
            </div>
            {data.symptoms.length > 0 && (
              <p style={{ textAlign: "center", fontSize: 13, color: COLORS.goldDark, fontWeight: 600, marginTop: 14 }}>
                {data.symptoms.length} selected
              </p>
            )}
          </div>
          <BottomCTA />
        </>
      )}

      {/* ══════ Step 4: Frequency & Alarm ══════ */}
      {step === 4 && (
        <>
          <NavBar />
          <div style={{ flex: 1, overflow: "auto", padding: "10px 24px 0" }}>
            <StepHeader icon="📋" title="Bowel Habits" subtitle="How often do you typically go?" />

            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 28 }}>
              {FREQUENCIES.map(f => {
                const sel = data.frequency === f.label;
                return (
                  <button key={f.label} onClick={() => setData({ ...data, frequency: f.label })}
                    style={{
                      display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 16,
                      border: `2px solid ${sel ? COLORS.mint : "rgba(0,0,0,0.05)"}`,
                      backgroundColor: sel ? COLORS.mintLight : COLORS.white,
                      cursor: "pointer", textAlign: "left", transition: "all 0.2s",
                      boxShadow: sel ? "0 4px 14px rgba(168,230,207,0.25)" : "0 2px 8px rgba(0,0,0,0.03)",
                    }}>
                    <div style={{
                      width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                      backgroundColor: sel ? "rgba(255,255,255,0.7)" : COLORS.cream,
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
                    }}>
                      {f.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.black, fontFamily: "'SF Pro Display', -apple-system, sans-serif" }}>{f.label}</div>
                      <div style={{ fontSize: 12, color: COLORS.gray, marginTop: 1 }}>{f.sub}</div>
                    </div>
                    <div style={{
                      width: 22, height: 22, borderRadius: 11, flexShrink: 0,
                      border: `2px solid ${sel ? COLORS.mintDark : COLORS.grayLight}`,
                      backgroundColor: sel ? COLORS.mintDark : "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s",
                    }}>
                      {sel && <div style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.white }} />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Alarm time picker */}
            <div style={{
              padding: "18px 20px", borderRadius: 16, backgroundColor: COLORS.white,
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)", display: "flex", alignItems: "center", gap: 14,
            }}>
              <div style={{
                width: 46, height: 46, borderRadius: 14, backgroundColor: COLORS.goldLight,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
              }}>
                ⏰
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.black, fontFamily: "'SF Pro Display', -apple-system, sans-serif" }}>Daily Reminder</div>
                <div style={{ fontSize: 12, color: COLORS.gray, marginTop: 1 }}>We'll nudge you to log</div>
              </div>
              <input type="time" value={data.alarmTime} onChange={e => setData({ ...data, alarmTime: e.target.value })}
                style={{
                  padding: "8px 12px", borderRadius: 10, border: `1px solid ${COLORS.grayLight}`,
                  fontSize: 16, fontWeight: 600, color: COLORS.gold, width: 110,
                  fontFamily: "'SF Pro Display', -apple-system, sans-serif", textAlign: "center",
                }} />
            </div>
          </div>
          <BottomCTA label="Start My Journey 🚀" />
        </>
      )}
    </div>
  );
}

// ─── Home Tab ───

function HomeTab({ userData }) {
  const gutScore = 78;
  const nutrients = [
    { name: "Fiber", value: 22, max: 30, color: COLORS.mint, unit: "g" },
    { name: "Water", value: 1.8, max: 2.5, color: COLORS.blue, unit: "L" },
    { name: "Probiotics", value: 2, max: 3, color: COLORS.gold, unit: "srv" },
  ];

  const tips = [
    { emoji: "🥦", text: "Add more fiber-rich foods today" },
    { emoji: "💧", text: "You need 700ml more water" },
    { emoji: "🚶", text: "A 15-min walk aids digestion" },
  ];

  return (
    <div style={{ padding: 20 }}>
      <div style={{ marginBottom: 24 }}>
        <p style={{ color: COLORS.gray, fontSize: 14, margin: 0 }}>Good morning,</p>
        <h1 style={{ fontSize: 26, margin: "4px 0 0", fontFamily: "'SF Pro Display', -apple-system, sans-serif", color: COLORS.black }}>
          {userData?.name || "Friend"} 👋
        </h1>
      </div>

      {/* Gut Health Score */}
      <Card style={{ marginBottom: 16, textAlign: "center", padding: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 24 }}>
          <CircularProgress value={gutScore} size={130} strokeWidth={12} color={gutScore > 70 ? COLORS.mint : gutScore > 40 ? COLORS.gold : COLORS.red}>
            <span style={{ fontSize: 36, fontWeight: 700, color: COLORS.black, fontFamily: "'SF Pro Display', -apple-system, sans-serif" }}>{gutScore}</span>
            <span style={{ fontSize: 11, color: COLORS.gray }}>GUT SCORE</span>
          </CircularProgress>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: 18, fontWeight: 600, color: COLORS.mintDark, marginBottom: 4 }}>Good 👍</div>
            <p style={{ fontSize: 13, color: COLORS.gray, margin: 0, lineHeight: 1.4 }}>Your gut health is improving! Keep up the fiber intake.</p>
            <div style={{ marginTop: 10, display: "flex", gap: 4 }}>
              <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 8, backgroundColor: COLORS.mintLight, color: COLORS.mintDark }}>+5 vs last week</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Nutrition Bars */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontFamily: "'SF Pro Display', -apple-system, sans-serif" }}>Today's Nutrition</h3>
          <span style={{ fontSize: 12, color: COLORS.gray }}>Updated 2h ago</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {nutrients.map(n => (
            <ProgressBar key={n.name} value={n.value} max={n.max} color={n.color} bg={n.color + "30"} height={10}
              label={`${n.name}`} showValue />
          ))}
        </div>
      </Card>

      {/* Quick Actions */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        <Card style={{ textAlign: "center", padding: 16, cursor: "pointer" }} onClick={() => {}}>
          <div style={{ fontSize: 28, marginBottom: 6 }}>📸</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.black }}>Quick Scan</div>
          <div style={{ fontSize: 12, color: COLORS.gray }}>Analyze your meal</div>
        </Card>
        <Card style={{ textAlign: "center", padding: 16, cursor: "pointer" }} onClick={() => {}}>
          <div style={{ fontSize: 28, marginBottom: 6 }}>🤖</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.black }}>Ask AI</div>
          <div style={{ fontSize: 12, color: COLORS.gray }}>Get gut advice</div>
        </Card>
      </div>

      {/* Tips */}
      <Card>
        <h3 style={{ margin: "0 0 12px", fontSize: 16, fontFamily: "'SF Pro Display', -apple-system, sans-serif" }}>Daily Tips 💡</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {tips.map((t, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 12, backgroundColor: COLORS.cream }}>
              <span style={{ fontSize: 22 }}>{t.emoji}</span>
              <span style={{ fontSize: 14, color: COLORS.black }}>{t.text}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── Log Tab ───

function LogTab() {
  const [mood, setMood] = useState(null);
  const [bowelCount, setBowelCount] = useState(0);
  const [mealPhoto, setMealPhoto] = useState(null);
  const [bowelPhoto, setBowelPhoto] = useState(null);
  const [logType, setLogType] = useState("meal");
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  return (
    <div style={{ padding: 20 }}>
      <h1 style={{ fontSize: 24, margin: "0 0 20px", fontFamily: "'SF Pro Display', -apple-system, sans-serif" }}>Log Entry 📝</h1>

      {/* Log Type Toggle */}
      <div style={{ display: "flex", gap: 0, marginBottom: 20, backgroundColor: COLORS.grayUltraLight, borderRadius: 12, padding: 3 }}>
        {["meal", "bowel"].map(t => (
          <button key={t} onClick={() => setLogType(t)}
            style={{
              flex: 1, padding: "10px", borderRadius: 10, border: "none", fontSize: 14, fontWeight: 600,
              backgroundColor: logType === t ? COLORS.white : "transparent", color: logType === t ? COLORS.black : COLORS.gray,
              cursor: "pointer", boxShadow: logType === t ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
              fontFamily: "'SF Pro Display', -apple-system, sans-serif",
            }}>
            {t === "meal" ? "🍽️ Meal" : "🚽 Bowel"}
          </button>
        ))}
      </div>

      {/* Photo Upload */}
      <Card style={{ marginBottom: 16, textAlign: "center", padding: 24, border: `2px dashed ${COLORS.grayLight}`, backgroundColor: COLORS.cream, cursor: "pointer" }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>{logType === "meal" ? "📷" : "📸"}</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.black, marginBottom: 4 }}>
          {logType === "meal" ? "Upload Meal Photo" : "Upload Photo"}
        </div>
        <div style={{ fontSize: 13, color: COLORS.gray }}>Tap to take or choose a photo</div>
      </Card>

      {/* Mood Selection */}
      <Card style={{ marginBottom: 16 }}>
        <h3 style={{ margin: "0 0 14px", fontSize: 16, fontFamily: "'SF Pro Display', -apple-system, sans-serif" }}>How are you feeling?</h3>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          {MOODS.map((m, i) => (
            <button key={i} onClick={() => setMood(i)}
              style={{
                width: 52, height: 64, borderRadius: 14, border: `2px solid ${mood === i ? COLORS.gold : "transparent"}`,
                backgroundColor: mood === i ? COLORS.goldLight : COLORS.cream, cursor: "pointer",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
                transition: "all 0.2s",
              }}>
              <span style={{ fontSize: 26 }}>{m}</span>
              <span style={{ fontSize: 9, color: mood === i ? COLORS.goldDark : COLORS.gray }}>{MOOD_LABELS[i]}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Bowel Counter */}
      {logType === "bowel" && (
        <Card style={{ marginBottom: 16 }}>
          <h3 style={{ margin: "0 0 14px", fontSize: 16, fontFamily: "'SF Pro Display', -apple-system, sans-serif" }}>Bowel Movements Today</h3>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 20 }}>
            <button onClick={() => setBowelCount(Math.max(0, bowelCount - 1))}
              style={{ width: 44, height: 44, borderRadius: 22, border: `2px solid ${COLORS.grayLight}`, backgroundColor: COLORS.white, fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              −
            </button>
            <span style={{ fontSize: 40, fontWeight: 700, color: COLORS.black, minWidth: 50, textAlign: "center", fontFamily: "'SF Pro Display', -apple-system, sans-serif" }}>
              {bowelCount}
            </span>
            <button onClick={() => setBowelCount(bowelCount + 1)}
              style={{ width: 44, height: 44, borderRadius: 22, border: "none", backgroundColor: COLORS.gold, color: COLORS.white, fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              +
            </button>
          </div>
        </Card>
      )}

      {/* Notes */}
      <Card style={{ marginBottom: 20 }}>
        <h3 style={{ margin: "0 0 10px", fontSize: 16, fontFamily: "'SF Pro Display', -apple-system, sans-serif" }}>Notes</h3>
        <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="How was your meal? Any symptoms?"
          style={{ width: "100%", padding: 12, borderRadius: 12, border: `1px solid ${COLORS.grayLight}`, fontSize: 14, resize: "none", height: 80, boxSizing: "border-box", fontFamily: "'SF Pro Display', -apple-system, sans-serif", outline: "none" }} />
      </Card>

      <Button onClick={handleSave} style={{ width: "100%" }}>
        {saved ? "✓ Saved!" : "Save Log Entry"}
      </Button>
    </div>
  );
}

// ─── History Tab ───

function HistoryTab() {
  const [selectedDay, setSelectedDay] = useState(15);
  const monthData = Array.from({ length: DAYS_IN_MONTH }, (_, i) => ({
    day: i + 1,
    score: Math.floor(Math.random() * 40 + 50),
    mood: MOODS[Math.floor(Math.random() * 5)],
    logged: Math.random() > 0.25,
  }));

  const barMax = 100;

  return (
    <div style={{ padding: 20 }}>
      <h1 style={{ fontSize: 24, margin: "0 0 4px", fontFamily: "'SF Pro Display', -apple-system, sans-serif" }}>History 📊</h1>
      <p style={{ color: COLORS.gray, fontSize: 14, margin: "0 0 20px" }}>January 2026</p>

      {/* Monthly Bar Chart */}
      <Card style={{ marginBottom: 16, padding: 16 }}>
        <h3 style={{ margin: "0 0 14px", fontSize: 15, fontFamily: "'SF Pro Display', -apple-system, sans-serif" }}>Weekly Gut Score</h3>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 120 }}>
          {["W1", "W2", "W3", "W4"].map((w, i) => {
            const val = [65, 72, 78, 82][i];
            return (
              <div key={w} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: COLORS.black }}>{val}</span>
                <div style={{
                  width: "100%", height: `${(val / barMax) * 100}px`, borderRadius: 8,
                  background: `linear-gradient(180deg, ${COLORS.gold} 0%, ${COLORS.goldLight} 100%)`,
                  transition: "height 0.6s ease",
                }} />
                <span style={{ fontSize: 11, color: COLORS.gray }}>{w}</span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Calendar with Emoji */}
      <Card style={{ marginBottom: 16, padding: 16 }}>
        <h3 style={{ margin: "0 0 14px", fontSize: 15, fontFamily: "'SF Pro Display', -apple-system, sans-serif" }}>Daily Mood Calendar</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 4 }}>
          {WEEK_DAYS.map(d => (
            <div key={d} style={{ textAlign: "center", fontSize: 10, color: COLORS.gray, padding: "4px 0" }}>{d}</div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
          {/* Offset for Jan 2026 starting on Thursday */}
          {[null, null, null].map((_, i) => <div key={`e${i}`} />)}
          {monthData.map((d) => (
            <button key={d.day} onClick={() => setSelectedDay(d.day)}
              style={{
                width: "100%", aspectRatio: "1", borderRadius: 10, border: selectedDay === d.day ? `2px solid ${COLORS.gold}` : "2px solid transparent",
                backgroundColor: selectedDay === d.day ? COLORS.goldLight : d.logged ? COLORS.cream : COLORS.grayUltraLight,
                cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                fontSize: 10, padding: 1, gap: 0, minHeight: 36,
              }}>
              <span style={{ fontSize: d.logged ? 14 : 0 }}>{d.logged ? d.mood : ""}</span>
              <span style={{ fontSize: 9, color: COLORS.gray }}>{d.day}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Monthly Stats */}
      <Card style={{ padding: 16 }}>
        <h3 style={{ margin: "0 0 14px", fontSize: 15, fontFamily: "'SF Pro Display', -apple-system, sans-serif" }}>Monthly Summary</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[
            { label: "Avg Score", value: "74", icon: "📈", color: COLORS.mintLight },
            { label: "Logs Made", value: "24", icon: "📝", color: COLORS.goldLight },
            { label: "Best Day", value: "Jan 22", icon: "⭐", color: COLORS.mintLight },
            { label: "Streak", value: "7 days", icon: "🔥", color: COLORS.goldLight },
          ].map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px", borderRadius: 12, backgroundColor: s.color }}>
              <span style={{ fontSize: 22 }}>{s.icon}</span>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.black }}>{s.value}</div>
                <div style={{ fontSize: 11, color: COLORS.gray }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── Insights Tab ───

function InsightsTab() {
  const [activeSection, setActiveSection] = useState("report");
  const [chatMessages, setChatMessages] = useState([
    { role: "bot", text: "Hi! I'm your GutBuddy AI 🤖 Ask me anything about gut health!" },
  ]);
  const [chatInput, setChatInput] = useState("");

  const handleSend = () => {
    if (!chatInput.trim()) return;
    setChatMessages(prev => [...prev, { role: "user", text: chatInput }]);
    const q = chatInput.toLowerCase();
    setTimeout(() => {
      let reply = "That's a great question! Based on your logs, I'd recommend focusing on increasing your fiber intake and staying hydrated. Would you like specific food suggestions?";
      if (q.includes("bloat")) reply = "Bloating can be caused by gas-producing foods like beans, cruciferous vegetables, or dairy. Try keeping a food diary and eliminating one food group at a time. Your recent logs show bloating peaks after lunch — consider smaller portions.";
      else if (q.includes("fiber")) reply = "Great question! Aim for 25-30g of fiber daily. Good sources include oats, lentils, berries, and chia seeds. Your current average is 22g — almost there! 🎉";
      else if (q.includes("probiotic")) reply = "Probiotics support gut flora diversity. Try yogurt, kefir, kimchi, or sauerkraut. Based on your profile, I'd recommend starting with a daily serving of plain yogurt.";
      setChatMessages(prev => [...prev, { role: "bot", text: reply }]);
    }, 800);
    setChatInput("");
  };

  const sections = [
    { id: "report", label: "Report", icon: "📋" },
    { id: "bristol", label: "Bristol", icon: "📊" },
    { id: "chat", label: "AI Chat", icon: "🤖" },
  ];

  return (
    <div style={{ padding: 20, display: "flex", flexDirection: "column", height: "calc(100% - 40px)" }}>
      <h1 style={{ fontSize: 24, margin: "0 0 16px", fontFamily: "'SF Pro Display', -apple-system, sans-serif" }}>Insights 🧠</h1>

      {/* Section Tabs */}
      <div style={{ display: "flex", gap: 0, marginBottom: 16, backgroundColor: COLORS.grayUltraLight, borderRadius: 12, padding: 3 }}>
        {sections.map(s => (
          <button key={s.id} onClick={() => setActiveSection(s.id)}
            style={{
              flex: 1, padding: "8px 4px", borderRadius: 10, border: "none", fontSize: 13, fontWeight: 600,
              backgroundColor: activeSection === s.id ? COLORS.white : "transparent", color: activeSection === s.id ? COLORS.black : COLORS.gray,
              cursor: "pointer", boxShadow: activeSection === s.id ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
              fontFamily: "'SF Pro Display', -apple-system, sans-serif",
            }}>
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflow: "auto" }}>
        {/* Daily Report */}
        {activeSection === "report" && (
          <div>
            <Card style={{ marginBottom: 12, borderLeft: `4px solid ${COLORS.mint}` }}>
              <div style={{ fontSize: 13, color: COLORS.gray, marginBottom: 4 }}>Today's Summary</div>
              <div style={{ fontSize: 15, color: COLORS.black, lineHeight: 1.5 }}>
                You logged <strong>3 meals</strong> and <strong>2 bowel movements</strong> today. Your fiber intake is at 73% of your goal. Mood has been mostly positive 😊. Hydration is slightly below target.
              </div>
            </Card>
            <Card style={{ marginBottom: 12, borderLeft: `4px solid ${COLORS.gold}` }}>
              <div style={{ fontSize: 13, color: COLORS.gray, marginBottom: 4 }}>Pattern Detected</div>
              <div style={{ fontSize: 15, color: COLORS.black, lineHeight: 1.5 }}>
                📌 You tend to feel <strong>bloated after dairy</strong> products. Consider trying lactose-free alternatives for 2 weeks and see if symptoms improve.
              </div>
            </Card>
            <Card style={{ borderLeft: `4px solid ${COLORS.blue}` }}>
              <div style={{ fontSize: 13, color: COLORS.gray, marginBottom: 4 }}>Recommendation</div>
              <div style={{ fontSize: 15, color: COLORS.black, lineHeight: 1.5 }}>
                🌟 Try adding <strong>fermented foods</strong> like kimchi or yogurt to your lunch. Your gut diversity score could improve by ~15% based on similar users.
              </div>
            </Card>
          </div>
        )}

        {/* Bristol Scale */}
        {activeSection === "bristol" && (
          <div>
            <Card style={{ marginBottom: 12 }}>
              <h3 style={{ margin: "0 0 4px", fontSize: 16, fontFamily: "'SF Pro Display', -apple-system, sans-serif" }}>Bristol Stool Chart</h3>
              <p style={{ margin: "0 0 14px", fontSize: 13, color: COLORS.gray }}>Classify your stool type for better tracking</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {BRISTOL_SCALE.map(b => (
                  <div key={b.type} style={{
                    display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 12,
                    backgroundColor: b.type === 4 ? COLORS.mintLight : COLORS.cream,
                    border: b.type === 4 ? `2px solid ${COLORS.mint}` : "2px solid transparent",
                  }}>
                    <span style={{ fontSize: 24 }}>{b.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.black }}>Type {b.type}: {b.desc}</div>
                      <div style={{ fontSize: 12, color: b.type === 4 ? COLORS.mintDark : COLORS.gray }}>{b.meaning}</div>
                    </div>
                    {b.type === 4 && <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 6, backgroundColor: COLORS.mint, color: COLORS.white, fontWeight: 600 }}>Ideal</span>}
                  </div>
                ))}
              </div>
            </Card>
            <Card>
              <h3 style={{ margin: "0 0 10px", fontSize: 15, fontFamily: "'SF Pro Display', -apple-system, sans-serif" }}>Your Recent Types</h3>
              <div style={{ display: "flex", gap: 8, justifyContent: "space-between" }}>
                {[4, 3, 4, 5, 4, 3, 4].map((t, i) => (
                  <div key={i} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 18 }}>{BRISTOL_SCALE[t - 1].emoji}</div>
                    <div style={{ fontSize: 10, color: COLORS.gray }}>Day {i + 1}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* AI Chatbot */}
        {activeSection === "chat" && (
          <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10, marginBottom: 12 }}>
              {chatMessages.map((m, i) => (
                <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                  <div style={{
                    maxWidth: "80%", padding: "10px 14px", borderRadius: 16,
                    backgroundColor: m.role === "user" ? COLORS.gold : COLORS.white,
                    color: m.role === "user" ? COLORS.white : COLORS.black,
                    fontSize: 14, lineHeight: 1.4,
                    borderBottomRightRadius: m.role === "user" ? 4 : 16,
                    borderBottomLeftRadius: m.role === "bot" ? 4 : 16,
                    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                  }}>
                    {m.text}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input value={chatInput} onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSend()}
                placeholder="Ask about gut health..."
                style={{ flex: 1, padding: "10px 14px", borderRadius: 20, border: `1px solid ${COLORS.grayLight}`, fontSize: 14, outline: "none", fontFamily: "'SF Pro Display', -apple-system, sans-serif" }} />
              <button onClick={handleSend}
                style={{ width: 40, height: 40, borderRadius: 20, border: "none", backgroundColor: COLORS.gold, color: COLORS.white, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                ↑
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Profile Tab ───

function ProfileTab({ userData }) {
  const exp = 340;
  const currentLevel = LEVELS.findIndex((l, i) => exp >= l.minExp && (i === LEVELS.length - 1 || exp < LEVELS[i + 1].minExp));
  const level = LEVELS[currentLevel];
  const nextLevel = LEVELS[currentLevel + 1];
  const expInLevel = exp - level.minExp;
  const expNeeded = nextLevel ? nextLevel.minExp - level.minExp : 1;
  const streak = 7;

  const [showPlans, setShowPlans] = useState(false);

  return (
    <div style={{ padding: 20 }}>
      {/* Profile Header */}
      <Card style={{ marginBottom: 16, textAlign: "center", padding: 24, background: `linear-gradient(135deg, ${COLORS.goldLight} 0%, ${COLORS.mintLight} 100%)` }}>
        <div style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: COLORS.white, margin: "0 auto 10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
          {level.emoji}
        </div>
        <h2 style={{ margin: "0 0 2px", fontSize: 20, fontFamily: "'SF Pro Display', -apple-system, sans-serif" }}>{userData?.name || "GutBuddy User"}</h2>
        <p style={{ margin: "0 0 14px", fontSize: 14, color: COLORS.gray }}>{level.name} Level</p>
        <ProgressBar value={expInLevel} max={expNeeded} color={COLORS.gold} bg="rgba(255,255,255,0.6)" height={10}
          label={`${exp} / ${nextLevel?.minExp || "MAX"} EXP`} />
        {nextLevel && <p style={{ margin: "8px 0 0", fontSize: 12, color: COLORS.gray }}>{expNeeded - expInLevel} EXP to {nextLevel.name} {nextLevel.emoji}</p>}
      </Card>

      {/* Streak */}
      <Card style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 50, height: 50, borderRadius: 14, backgroundColor: COLORS.goldLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>
          🔥
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.black, fontFamily: "'SF Pro Display', -apple-system, sans-serif" }}>{streak} Day Streak!</div>
          <div style={{ fontSize: 13, color: COLORS.gray }}>Keep logging daily to grow your streak</div>
        </div>
        <div style={{ display: "flex", gap: 3 }}>
          {[1, 2, 3, 4, 5, 6, 7].map(d => (
            <div key={d} style={{
              width: 8, height: 8, borderRadius: 4,
              backgroundColor: d <= streak ? COLORS.gold : COLORS.grayLight,
            }} />
          ))}
        </div>
      </Card>

      {/* Level Progression */}
      <Card style={{ marginBottom: 16 }}>
        <h3 style={{ margin: "0 0 14px", fontSize: 16, fontFamily: "'SF Pro Display', -apple-system, sans-serif" }}>Growth Journey</h3>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {LEVELS.map((l, i) => (
            <div key={l.name} style={{ textAlign: "center", opacity: i <= currentLevel ? 1 : 0.35 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 20, display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 20, backgroundColor: i <= currentLevel ? COLORS.goldLight : COLORS.grayUltraLight,
                border: i === currentLevel ? `2px solid ${COLORS.gold}` : "2px solid transparent",
                margin: "0 auto 4px",
              }}>
                {l.emoji}
              </div>
              <div style={{ fontSize: 10, color: i <= currentLevel ? COLORS.black : COLORS.gray, fontWeight: i === currentLevel ? 700 : 400 }}>{l.name}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Badges */}
      <Card style={{ marginBottom: 16 }}>
        <h3 style={{ margin: "0 0 14px", fontSize: 16, fontFamily: "'SF Pro Display', -apple-system, sans-serif" }}>Badges 🏅</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          {BADGES.map(b => (
            <div key={b.id} style={{
              textAlign: "center", padding: "12px 6px", borderRadius: 14,
              backgroundColor: b.unlocked ? COLORS.goldLight : COLORS.grayUltraLight,
              opacity: b.unlocked ? 1 : 0.5,
            }}>
              <div style={{ fontSize: 28, marginBottom: 4, filter: b.unlocked ? "none" : "grayscale(1)" }}>{b.emoji}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.black }}>{b.name}</div>
              <div style={{ fontSize: 9, color: COLORS.gray }}>{b.desc}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Subscription Plans */}
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: showPlans ? 14 : 0 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontFamily: "'SF Pro Display', -apple-system, sans-serif" }}>Subscription</h3>
          <button onClick={() => setShowPlans(!showPlans)} style={{ background: "none", border: "none", color: COLORS.gold, fontSize: 14, cursor: "pointer", fontWeight: 600 }}>
            {showPlans ? "Hide" : "View Plans"}
          </button>
        </div>
        {showPlans && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { name: "Free", price: "$0", features: ["Basic logging", "Daily tips", "7-day history"], current: true, ai: null },
              { name: "Pro", price: "$7.99/mo", features: ["AI insights", "Unlimited history", "Bristol tracking", "Export data"], current: false, ai: { model: "Haiku 4.5", desc: "Fast & lightweight AI", icon: "⚡" } },
              { name: "Premium", price: "$19.99/mo", features: ["Everything in Pro", "AI Chatbot", "Meal analysis", "Weekly Email Report", "Priority support"], current: false, highlight: true, ai: { model: "Sonnet 4.5", desc: "Advanced reasoning AI", icon: "🧠" } },
            ].map(p => (
              <div key={p.name} style={{
                padding: 14, borderRadius: 14,
                border: `2px solid ${p.current ? COLORS.mint : p.name === "Premium" ? COLORS.gold : COLORS.grayLight}`,
                backgroundColor: p.name === "Premium" ? COLORS.goldLight : COLORS.white,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div>
                    <span style={{ fontSize: 15, fontWeight: 700, color: COLORS.black }}>{p.name}</span>
                    {p.current && <span style={{ marginLeft: 6, fontSize: 10, padding: "2px 6px", borderRadius: 4, backgroundColor: COLORS.mint, color: COLORS.white }}>Current</span>}
                    {p.name === "Premium" && <span style={{ marginLeft: 6, fontSize: 10, padding: "2px 6px", borderRadius: 4, backgroundColor: COLORS.gold, color: COLORS.white }}>Popular</span>}
                  </div>
                  <span style={{ fontSize: 15, fontWeight: 700, color: COLORS.gold }}>{p.price}</span>
                </div>
                {/* AI Model Badge */}
                {p.ai && (
                  <div style={{
                    display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 10,
                    backgroundColor: p.name === "Premium" ? "rgba(212,175,55,0.15)" : COLORS.grayUltraLight,
                    marginBottom: 10,
                  }}>
                    <span style={{ fontSize: 18 }}>{p.ai.icon}</span>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.black }}>Powered by Claude {p.ai.model}</div>
                      <div style={{ fontSize: 11, color: COLORS.gray }}>{p.ai.desc}</div>
                    </div>
                  </div>
                )}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {p.features.map(f => (
                    <span key={f} style={{
                      fontSize: 11, padding: "2px 8px", borderRadius: 6,
                      backgroundColor: f === "Weekly Email Report" ? COLORS.gold : COLORS.cream,
                      color: f === "Weekly Email Report" ? COLORS.white : COLORS.gray,
                      fontWeight: f === "Weekly Email Report" ? 700 : 400,
                    }}>
                      {f === "Weekly Email Report" ? "📧 " : "✓ "}{f}
                    </span>
                  ))}
                </div>
                {p.highlight && (
                  <div style={{
                    marginTop: 10, padding: "8px 12px", borderRadius: 10,
                    backgroundColor: "rgba(212,175,55,0.12)", display: "flex", alignItems: "center", gap: 8,
                  }}>
                    <span style={{ fontSize: 16 }}>📬</span>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.goldDark }}>Weekly Progress Report</div>
                      <div style={{ fontSize: 11, color: COLORS.gray }}>Get a personalized email every Monday with your gut health score, patterns, and tips</div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── Main App ───

const TABS = [
  { id: "home", label: "Home", icon: "🏠" },
  { id: "log", label: "Log", icon: "✏️" },
  { id: "history", label: "History", icon: "📅" },
  { id: "insights", label: "Insights", icon: "💡" },
  { id: "profile", label: "Profile", icon: "👤" },
];

export default function GutBuddyApp() {
  const [onboarded, setOnboarded] = useState(false);
  const [userData, setUserData] = useState(null);
  const [activeTab, setActiveTab] = useState("home");

  const handleOnboardingComplete = (data) => {
    setUserData(data);
    setOnboarded(true);
  };

  const renderTab = () => {
    switch (activeTab) {
      case "home": return <HomeTab userData={userData} />;
      case "log": return <LogTab />;
      case "history": return <HistoryTab />;
      case "insights": return <InsightsTab />;
      case "profile": return <ProfileTab userData={userData} />;
      default: return <HomeTab userData={userData} />;
    }
  };

  return (
    <div style={{
      width: "100%", maxWidth: 430, margin: "0 auto", height: "100vh", display: "flex", flexDirection: "column",
      backgroundColor: COLORS.cream, fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      position: "relative", overflow: "hidden", borderLeft: `1px solid ${COLORS.grayLight}`, borderRight: `1px solid ${COLORS.grayLight}`,
    }}>
      {/* Status Bar */}
      <div style={{
        padding: "8px 20px", display: "flex", justifyContent: "space-between", alignItems: "center",
        fontSize: 12, fontWeight: 600, color: COLORS.black,
      }}>
        <span>9:41</span>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <span style={{ fontSize: 10 }}>●●●●○</span>
          <span>WiFi</span>
          <span>🔋</span>
        </div>
      </div>

      {!onboarded ? (
        <div style={{ flex: 1, overflow: "auto" }}>
          <Onboarding onComplete={handleOnboardingComplete} />
        </div>
      ) : (
        <>
          {/* Content */}
          <div style={{ flex: 1, overflow: "auto", paddingBottom: 10 }}>
            {renderTab()}
          </div>

          {/* Tab Bar */}
          <div style={{
            display: "flex", borderTop: `1px solid ${COLORS.grayLight}`, backgroundColor: "rgba(255,249,240,0.95)",
            backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", paddingBottom: 6,
          }}>
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                  padding: "8px 0 4px", border: "none", backgroundColor: "transparent", cursor: "pointer",
                }}>
                <span style={{ fontSize: 20, filter: activeTab === tab.id ? "none" : "grayscale(0.8) opacity(0.5)" }}>{tab.icon}</span>
                <span style={{
                  fontSize: 10, fontWeight: activeTab === tab.id ? 700 : 400,
                  color: activeTab === tab.id ? COLORS.gold : COLORS.gray,
                  fontFamily: "'SF Pro Display', -apple-system, sans-serif",
                }}>{tab.label}</span>
                {activeTab === tab.id && <div style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: COLORS.gold }} />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
