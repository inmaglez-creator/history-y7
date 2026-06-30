import { useState, useRef, useEffect } from "react";

const TOPICS = [
  {
    id: "medieval",
    label: "Medieval World",
    icon: "🏰",
    color: "#92400E",
    light: "#FFFBEB",
    description: "Feudal system, crusades & medieval life",
    topics: ["The feudal system", "The Crusades", "The Black Death", "Medieval towns & trade"],
  },
  {
    id: "renaissance",
    label: "Renaissance & Reformation",
    icon: "🎨",
    color: "#7C3AED",
    light: "#F5F3FF",
    description: "Renaissance ideas, Reformation & exploration",
    topics: ["The Renaissance", "The Reformation", "Age of Exploration", "The printing press & ideas"],
  },
  {
    id: "british",
    label: "British History",
    icon: "👑",
    color: "#B91C1C",
    light: "#FEF2F2",
    description: "Tudors, Stuarts & early modern Britain",
    topics: ["The Tudors", "Henry VIII & the Church", "Elizabeth I", "The Civil War"],
  },
  {
    id: "skills",
    label: "History Skills",
    icon: "📜",
    color: "#0F766E",
    light: "#F0FDFA",
    description: "Sources, evidence, causation & significance",
    topics: ["Analysing sources", "Causation & consequence", "Significance", "Writing historically"],
  },
];

const SYSTEM_PROMPT = `You are an engaging KS3 History tutor for a Year 7 student at a British curriculum school. Make history come alive!

Your role:
1. Set history exercises tailored to KS3 Y7 content.
2. Use correct historical terminology and British spelling.
3. Develop historical thinking: causation, consequence, significance, change & continuity.
4. Make history vivid with real people, stories and details.
5. Correct answers with clear historical explanations and context.

When generating questions:
- ONE question at a time (vary: knowledge, causation/consequence, evaluation). After the student answers, give feedback, then ask the next.
- Number clearly: 1. 2. 3.
- 💡 Hints with key vocabulary or dates

When correcting:
- ✅ or ❌ per answer
- Explain with historical context and specific examples
- For evaluation questions, reward balanced arguments even if conclusion differs
- End with a "Did you know?" historical fact related to the topic

For History Skills exercises:
- Provide a primary source extract (quote or description)
- Ask source analysis questions using GCSE-prep language (provenance, reliability, utility)

IMPORTANT FORMATTING RULE: Never use markdown. No asterisks, no hashtags, no backticks. Plain text only. Use numbered lists and emoji where helpful.`;

export default function HistoryApp() {
  const [activeTopic, setActiveTopic] = useState(null);
  const [activeSubtopic, setActiveSubtopic] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("home");
  const [visitas, setVisitas] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  useEffect(() => {
    fetch("/api/visitas")
      .then((r) => r.json())
      .then((d) => setVisitas(d.visitas))
      .catch(() => {});
  }, []);

  const startPractice = async (topic, subtopic) => {
    setActiveTopic(topic); setActiveSubtopic(subtopic); setMessages([]); setMode("chat"); setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 1000, system: SYSTEM_PROMPT, messages: [{ role: "user", content: `Generate 1 KS3 History question on: "${subtopic}" (${topic.label}). Y7 level, bright engaged student. Make it interesting!` }] }),
      });
      const data = await res.json();
      setMessages([{ role: "assistant", content: data.content?.[0]?.text || "Error. Try again." }]);
    } catch { setMessages([{ role: "assistant", content: "Connection error." }]); }
    setLoading(false);
  };

  const sendMessage = async (text) => {
    const userMsg = (typeof text === "string" ? text : input).trim(); setInput("");
    if (!userMsg || loading) return;
    const newMessages = [...messages, { role: "user", content: userMsg }]; setMessages(newMessages); setLoading(true);
    const apiMessages = newMessages.map((m) => ({ role: m.role, content: m.content }));
    apiMessages[0] = { role: "user", content: `History: ${activeTopic?.label} — ${activeSubtopic}\n\n${apiMessages[0].content}` };
    try {
      const res = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 1000, system: SYSTEM_PROMPT, messages: apiMessages }),
      });
      const data = await res.json();
      setMessages([...newMessages, { role: "assistant", content: data.content?.[0]?.text || "Error." }]);
    } catch { setMessages([...newMessages, { role: "assistant", content: "Connection error." }]); }
    setLoading(false);
  };

  if (mode === "home") return (
    <div style={{ minHeight: "100vh", background: "#FFFBEB", fontFamily: "'Segoe UI', system-ui, sans-serif", padding: "24px 16px" }}>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>📜</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#451A03", margin: 0 }}>History Y7</h1>
          <p style={{ color: "#6B7280", marginTop: 6, fontSize: 15 }}>Discover the past with your AI History tutor</p>
        </div>
        {TOPICS.map((topic) => (
          <div key={topic.id} style={{ background: "#fff", borderRadius: 16, marginBottom: 16, border: `2px solid ${topic.light}`, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
            <div style={{ background: topic.light, padding: "16px 20px", display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 28 }}>{topic.icon}</span>
              <div><div style={{ fontWeight: 700, fontSize: 17, color: topic.color }}>{topic.label}</div><div style={{ fontSize: 13, color: "#6B7280" }}>{topic.description}</div></div>
            </div>
            <div style={{ padding: "12px 20px 16px", display: "flex", flexWrap: "wrap", gap: 8 }}>
              {topic.topics.map((sub) => (<button key={sub} onClick={() => startPractice(topic, sub)} style={{ background: topic.color, color: "#fff", border: "none", borderRadius: 20, padding: "7px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>{sub}</button>))}
            </div>
          </div>
        ))}
        {visitas !== null && (
          <div style={{ textAlign: "center", marginTop: 24, fontSize: 12, color: "#9CA3AF" }}>
            Visitas: {visitas}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#FFFBEB", fontFamily: "'Segoe UI', system-ui, sans-serif", display: "flex", flexDirection: "column" }}>
      <div style={{ background: activeTopic.color, padding: "14px 20px", display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0, zIndex: 10 }}>
        <button onClick={() => setMode("home")} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontWeight: 600, fontSize: 14 }}>← Back</button>
        <div><div style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>{activeTopic.label}</div><div style={{ color: "rgba(255,255,255,0.8)", fontSize: 12 }}>{activeSubtopic}</div></div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px", maxWidth: 680, margin: "0 auto", width: "100%" }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ marginBottom: 16, display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
            {msg.role === "assistant" && <div style={{ width: 32, height: 32, borderRadius: "50%", background: activeTopic.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, marginRight: 8, flexShrink: 0, alignSelf: "flex-end" }}>{activeTopic.icon}</div>}
            <div style={{ background: msg.role === "user" ? activeTopic.color : "#fff", color: msg.role === "user" ? "#fff" : "#1F2937", borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px", padding: "12px 16px", maxWidth: "80%", fontSize: 14, lineHeight: 1.6, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", whiteSpace: "pre-wrap" }}>{msg.content}</div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: activeTopic.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{activeTopic.icon}</div>
            <div style={{ background: "#fff", borderRadius: "18px 18px 18px 4px", padding: "12px 16px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
              <div style={{ display: "flex", gap: 4 }}>{[0, 1, 2].map((i) => (<div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: activeTopic.color, animation: "bounce 1s infinite", animationDelay: `${i * 0.2}s` }} />))}</div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div style={{ padding: "8px 16px 0", maxWidth: 680, margin: "0 auto", width: "100%", display: "flex", gap: 8, flexWrap: "wrap" }}>
        {["More questions", "Tell me more", "Hint", "Was this significant?"].map((q) => (
          <button key={q} onClick={() => sendMessage(q)} style={{ background: activeTopic.light, color: activeTopic.color, border: `1px solid ${activeTopic.color}30`, borderRadius: 16, padding: "5px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{q}</button>
        ))}
      </div>
      <div style={{ padding: "12px 16px 20px", maxWidth: 680, margin: "0 auto", width: "100%", display: "flex", gap: 8 }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMessage()} placeholder="Type your answers or questions..." style={{ flex: 1, border: "2px solid #E5E7EB", borderRadius: 24, padding: "10px 18px", fontSize: 14, outline: "none", fontFamily: "inherit" }} onFocus={(e) => (e.target.style.borderColor = activeTopic.color)} onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")} />
        <button onClick={sendMessage} disabled={loading || !input.trim()} style={{ background: activeTopic.color, color: "#fff", border: "none", borderRadius: "50%", width: 44, height: 44, fontSize: 20, cursor: loading ? "not-allowed" : "pointer", opacity: loading || !input.trim() ? 0.5 : 1, flexShrink: 0 }}>↑</button>
      </div>
      <style>{`@keyframes bounce { 0%, 80%, 100% { transform: translateY(0); } 40% { transform: translateY(-6px); } }`}</style>
    </div>
  );
}
