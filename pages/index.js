import { useState, useRef, useEffect } from "react";
import Head from "next/head";

const FORMATS = [
  { id: "reel", label: "Script Reel", icon: "▶", desc: "Script vidéo percutant", color: "#FF6B35" },
  { id: "thread", label: "Thread X", icon: "✦", desc: "Thread engageant", color: "#1DA1F2" },
  { id: "linkedin", label: "LinkedIn", icon: "◈", desc: "Post professionnel", color: "#7CFC5E" },
];

const TONES = [
  { id: "educatif", label: "Éducatif", icon: "📚" },
  { id: "storytelling", label: "Story", icon: "🎭" },
  { id: "controverse", label: "Controversé", icon: "⚡" },
  { id: "inspirationnel", label: "Inspirant", icon: "🔥" },
];

const STORAGE_KEY = "idee-contenu-history";

function TypewriterText({ text, speed = 8 }) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    setDisplayed(""); setDone(false);
    if (!text) return;
    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) { setDisplayed(text.slice(0, i + 1)); i++; }
      else { setDone(true); clearInterval(interval); }
    }, speed);
    return () => clearInterval(interval);
  }, [text]);
  return <span>{displayed}{!done && <span className="cursor">|</span>}</span>;
}

export default function Home() {
  const [idea, setIdea] = useState("");
  const [format, setFormat] = useState("reel");
  const [tone, setTone] = useState("educatif");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [copied, setCopied] = useState(false);
  const [activeHistory, setActiveHistory] = useState(null);
  const [error, setError] = useState("");
  const outputRef = useRef(null);
  const lastParamsRef = useRef({ idea: "", format: "reel", tone: "educatif" });

  const selectedFormat = FORMATS.find((f) => f.id === format);
  const selectedTone = TONES.find((t) => t.id === tone);

  useEffect(() => {
    try { const saved = localStorage.getItem(STORAGE_KEY); if (saved) setHistory(JSON.parse(saved)); } catch (e) {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(history)); } catch (e) {}
  }, [history]);

  async function transform(isRegenerate = false) {
    const p = isRegenerate ? lastParamsRef.current : { idea, format, tone };
    if (!p.idea.trim()) return;
    lastParamsRef.current = p;
    setLoading(true); setOutput(""); setError(""); setActiveHistory(null);
    const fmt = FORMATS.find((f) => f.id === p.format);
    const toneFmt = TONES.find((t) => t.id === p.tone);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea: p.idea, format: p.format, tone: p.tone, isRegenerate }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erreur");
      setOutput(data.result);
      const entry = {
        id: Date.now(),
        idea: p.idea.slice(0, 60) + (p.idea.length > 60 ? "…" : ""),
        format: fmt.label, formatId: p.format,
        tone: toneFmt?.label || "", toneId: p.tone,
        output: data.result, color: fmt.color,
        date: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      };
      setHistory((h) => [entry, ...h.slice(0, 19)]);
      setTimeout(() => outputRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (e) { setError(e.message || "Erreur de connexion."); }
    setLoading(false);
  }

  function copy() {
    navigator.clipboard.writeText(activeHistory ? activeHistory.output : output).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    });
  }

  function loadHistory(entry) {
    setActiveHistory(entry); setFormat(entry.formatId); setTone(entry.toneId || "educatif"); setOutput("");
    setTimeout(() => outputRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }

  const displayOutput = activeHistory ? activeHistory.output : output;
  const canRegenerate = !loading && output && lastParamsRef.current.idea;

  return (
    <>
      <Head>
        <title>idée→contenu</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </Head>
      <style jsx global>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #080A0E; color: #E8E6E0; font-family: 'Syne', sans-serif; min-height: 100vh; }
        .app { display: grid; grid-template-columns: 1fr 280px; max-width: 1100px; margin: 0 auto; padding: 32px 24px; gap: 32px; }
        .header { grid-column: 1/-1; display: flex; align-items: baseline; gap: 16px; padding-bottom: 24px; border-bottom: 1px solid #1A1D24; margin-bottom: 8px; }
        .logo { font-size: 22px; font-weight: 800; }
        .logo span { color: #C8F53A; }
        .tagline { font-size: 13px; color: #4A4D56; font-family: 'JetBrains Mono', monospace; }
        .main { display: flex; flex-direction: column; gap: 20px; }
        .section-label { font-size: 11px; font-family: 'JetBrains Mono', monospace; color: #4A4D56; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: -10px; }
        .input-box { background: #0D1017; border: 1px solid #1A1D24; border-radius: 16px; overflow: hidden; }
        .input-box:focus-within { border-color: #2A2D38; }
        .input-label { padding: 16px 20px 0; font-size: 11px; font-family: 'JetBrains Mono', monospace; color: #4A4D56; text-transform: uppercase; letter-spacing: 1.5px; }
        textarea { width: 100%; background: transparent; border: none; outline: none; color: #E8E6E0; font-family: 'Syne', sans-serif; font-size: 16px; line-height: 1.7; padding: 12px 20px 16px; resize: none; min-height: 120px; }
        textarea::placeholder { color: #2A2D38; }
        .char-count { padding: 0 20px 12px; font-size: 11px; font-family: 'JetBrains Mono', monospace; color: #2A2D38; text-align: right; }
        .tones { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
        .tone-btn { background: #0D1017; border: 1px solid #1A1D24; border-radius: 10px; padding: 12px 8px; cursor: pointer; transition: all 0.2s; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 5px; }
        .tone-btn:hover { border-color: #2A2D38; background: #111420; }
        .tone-btn.active { border-color: #C8F53A; background: #111f06; }
        .tone-icon { font-size: 18px; }
        .tone-name { font-size: 11px; font-weight: 700; color: #E8E6E0; }
        .tone-btn.active .tone-name { color: #C8F53A; }
        .formats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
        .format-btn { background: #0D1017; border: 1px solid #1A1D24; border-radius: 12px; padding: 14px 12px; cursor: pointer; transition: all 0.2s; text-align: left; display: flex; flex-direction: column; gap: 6px; }
        .format-btn:hover { border-color: #2A2D38; background: #111420; }
        .format-btn.active { border-color: var(--accent); background: #111420; }
        .format-icon { font-size: 18px; }
        .format-name { font-size: 13px; font-weight: 700; color: #E8E6E0; }
        .format-desc { font-size: 11px; color: #4A4D56; font-family: 'JetBrains Mono', monospace; }
        .action-row { display: grid; grid-template-columns: 1fr auto; gap: 10px; }
        .transform-btn { background: #C8F53A; color: #080A0E; border: none; border-radius: 12px; padding: 16px 24px; font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 800; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 10px; }
        .transform-btn:hover:not(:disabled) { background: #D9FF4A; transform: translateY(-1px); }
        .transform-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .regen-btn { background: #1A1D24; color: #E8E6E0; border: 1px solid #2A2D38; border-radius: 12px; padding: 16px 18px; font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 8px; white-space: nowrap; }
        .regen-btn:hover:not(:disabled) { background: #22252F; }
        .regen-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        .regen-icon { display: inline-block; transition: transform 0.4s; font-size: 16px; }
        .regen-btn:hover:not(:disabled) .regen-icon { transform: rotate(180deg); }
        .spinner { width: 16px; height: 16px; border: 2px solid #080A0E; border-top-color: transparent; border-radius: 50%; animation: spin 0.7s linear infinite; }
        .spinner-sm { width: 14px; height: 14px; border: 2px solid #E8E6E0; border-top-color: transparent; border-radius: 50%; animation: spin 0.7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .output-box { background: #0D1017; border: 1px solid #1A1D24; border-radius: 16px; overflow: hidden; animation: fadeIn 0.3s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; } }
        .output-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 20px; border-bottom: 1px solid #1A1D24; }
        .output-meta { display: flex; align-items: center; gap: 10px; }
        .output-tag { font-size: 11px; font-family: 'JetBrains Mono', monospace; color: #4A4D56; text-transform: uppercase; letter-spacing: 1.5px; display: flex; align-items: center; gap: 8px; }
        .output-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent, #C8F53A); }
        .tone-badge { font-size: 10px; font-family: 'JetBrains Mono', monospace; color: #4A4D56; background: #1A1D24; padding: 3px 8px; border-radius: 4px; }
        .copy-btn { background: #1A1D24; border: none; border-radius: 8px; padding: 6px 14px; color: #E8E6E0; font-family: 'Syne', sans-serif; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
        .copy-btn:hover { background: #22252F; }
        .copy-btn.copied { background: #1A2E12; color: #C8F53A; }
        .output-content { padding: 20px; font-family: 'JetBrains Mono', monospace; font-size: 13.5px; line-height: 1.8; color: #C8C5BC; white-space: pre-wrap; min-height: 80px; }
        .cursor { animation: blink 1s step-end infinite; color: #C8F53A; }
        @keyframes blink { 50% { opacity: 0; } }
        .error { color: #FF6B6B; font-size: 13px; font-family: 'JetBrains Mono', monospace; padding: 12px 20px; background: #1A0D0D; border: 1px solid #3A1515; border-radius: 12px; }
        .sidebar { display: flex; flex-direction: column; gap: 12px; padding-top: 60px; }
        .sidebar-header { display: flex; align-items: center; justify-content: space-between; padding: 0 4px; }
        .sidebar-title { font-size: 11px; font-family: 'JetBrains Mono', monospace; color: #4A4D56; text-transform: uppercase; letter-spacing: 1.5px; }
        .clear-btn { font-size: 10px; font-family: 'JetBrains Mono', monospace; color: #3A3D48; background: none; border: none; cursor: pointer; }
        .clear-btn:hover { color: #FF6B6B; }
        .history-list { display: flex; flex-direction: column; gap: 8px; max-height: 70vh; overflow-y: auto; }
        .history-item { background: #0D1017; border: 1px solid #1A1D24; border-radius: 10px; padding: 12px 14px; cursor: pointer; transition: all 0.2s; display: flex; flex-direction: column; gap: 6px; }
        .history-item:hover { border-color: #2A2D38; background: #111420; }
        .history-top { display: flex; align-items: center; justify-content: space-between; }
        .history-format { display: flex; align-items: center; gap: 6px; font-size: 10px; font-family: 'JetBrains Mono', monospace; color: #4A4D56; text-transform: uppercase; }
        .history-dot { width: 5px; height: 5px; border-radius: 50%; }
        .history-tone { font-size: 9px; font-family: 'JetBrains Mono', monospace; color: #3A3D48; background: #1A1D24; padding: 2px 5px; border-radius: 3px; }
        .history-idea { font-size: 12px; color: #8A8780; line-height: 1.4; font-weight: 600; }
        .history-time { font-size: 10px; font-family: 'JetBrains Mono', monospace; color: #2A2D38; }
        .empty-history { font-size: 12px; font-family: 'JetBrains Mono', monospace; color: #2A2D38; text-align: center; padding: 28px 12px; border: 1px dashed #1A1D24; border-radius: 10px; line-height: 1.8; }
        @media (max-width: 768px) { .app { grid-template-columns: 1fr; padding: 20px 16px; } .sidebar { order: -1; padding-top: 0; } .tones { grid-template-columns: repeat(2, 1fr); } .action-row { grid-template-columns: 1fr; } }
      `}</style>

      <div className="app">
        <header className="header">
          <div className="logo">idée<span>→</span>contenu</div>
          <div className="tagline">// transforme tes idées brutes en contenu prêt à publier</div>
        </header>
        <main className="main">
          <div className="input-box">
            <div className="input-label">// ton idée brute</div>
            <textarea value={idea} onChange={(e) => setIdea(e.target.value)} placeholder="Jette ton idée ici, même floue, même incomplète…" maxLength={500} />
            <div className="char-count">{idea.length}/500</div>
          </div>
          <div className="section-label">// niveau de viralité</div>
          <div className="tones">
            {TONES.map((t) => (
              <button key={t.id} className={`tone-btn ${tone === t.id ? "active" : ""}`} onClick={() => setTone(t.id)}>
                <div className="tone-icon">{t.icon}</div>
                <div className="tone-name">{t.label}</div>
              </button>
            ))}
          </div>
          <div className="section-label">// format de sortie</div>
          <div className="formats">
            {FORMATS.map((f) => (
              <button key={f.id} className={`format-btn ${format === f.id ? "active" : ""}`} style={{"--accent": f.color}} onClick={() => setFormat(f.id)}>
                <div className="format-icon" style={{color: f.color}}>{f.icon}</div>
                <div className="format-name">{f.label}</div>
                <div className="format-desc">{f.desc}</div>
              </button>
            ))}
          </div>
          <div className="action-row">
            <button className="transform-btn" onClick={() => transform(false)} disabled={loading || !idea.trim()}>
              {loading ? <><div className="spinner" />Génération…</> : <>⚡ Transformer en {selectedFormat?.label}</>}
            </button>
            <button className="regen-btn" onClick={() => transform(true)} disabled={loading || !canRegenerate}>
              {loading ? <div className="spinner-sm" /> : <span className="regen-icon">↻</span>}
              Réessayer
            </button>
          </div>
          {error && <div className="error">⚠ {error}</div>}
          {(displayOutput || loading) && (
            <div className="output-box" ref={outputRef} style={{"--accent": selectedFormat?.color}}>
              <div className="output-header">
                <div className="output-meta">
                  <div className="output-tag"><div className="output-dot" />{activeHistory ? activeHistory.format : selectedFormat?.label}</div>
                  <div className="tone-badge">{activeHistory ? activeHistory.tone : selectedTone?.label}</div>
                </div>
                {displayOutput && <button className={`copy-btn ${copied ? "copied" : ""}`} onClick={copy}>{copied ? "✓ Copié !" : "Copier"}</button>}
              </div>
              <div className="output-content">
                {loading ? <TypewriterText text="Génération en cours…" speed={40} /> : activeHistory ? activeHistory.output : <TypewriterText text={output} speed={6} />}
              </div>
            </div>
          )}
        </main>
        <aside className="sidebar">
          <div className="sidebar-header">
            <div className="sidebar-title">// historique</div>
            {history.length > 0 && <button className="clear-btn" onClick={() => { setHistory([]); localStorage.removeItem(STORAGE_KEY); }}>effacer</button>}
          </div>
          {history.length === 0 ? (
            <div className="empty-history">Tes transformations<br />apparaîtront ici</div>
          ) : (
            <div className="history-list">
              {history.map((entry) => (
                <div key={entry.id} className="history-item" onClick={() => loadHistory(entry)}>
                  <div className="history-top">
                    <div className="history-format"><div className="history-dot" style={{background: entry.color}} />{entry.format}</div>
                    {entry.tone && <div className="history-tone">{entry.tone}</div>}
                  </div>
                  <div className="history-idea">{entry.idea}</div>
                  <div className="history-time">{entry.date}</div>
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>
    </>
  );
}
