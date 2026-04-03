import { useState, useCallback, useEffect } from "react";

const FEEDS = [
  { url: "https://feeds.feedburner.com/ArchDaily", label: "ArchDaily", cat: "arquitectura" },
  { url: "https://www.dezeen.com/feed/", label: "Dezeen", cat: "arquitectura" },
  { url: "https://www.yankodesign.com/feed/", label: "Yanko Design", cat: "diseño" },
  { url: "https://www.artificialintelligence-news.com/feed/", label: "AI News", cat: "ai" },
  { url: "https://hnrss.org/frontpage", label: "Hacker News", cat: "tech" },
];

const PROXY = "https://api.rss2json.com/v1/api.json?rss_url=";

const BADGE_STYLES = {
  arquitectura: { bg: "#000", color: "#fff" },
  diseño: { bg: "#fff", color: "#000", border: "1px solid #000" },
  tech: { bg: "#eee", color: "#555" },
  ai: { bg: "#5e5ce6", color: "#fff" }
};

export default function NewsDashboard() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadFeeds = useCallback(async () => {
    setLoading(true);
    try {
      const allData = await Promise.all(
        FEEDS.map(async (f) => {
          const res = await fetch(`${PROXY}${encodeURIComponent(f.url)}`);
          const data = await res.json();
          return (data.items || []).slice(0, 6).map(it => ({ ...it, cat: f.cat, source: f.label }));
        })
      );
      setItems(allData.flat().sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate)));
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { loadFeeds(); }, [loadFeeds]);

  if (loading) return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', fontSize: 13, letterSpacing: '2px', textTransform: 'uppercase' }}>
      Cargando Curaduría...
    </div>
  );

  return (
    <div style={{ padding: "4rem 2rem", maxWidth: 1400, margin: "0 auto" }}>
      <header style={{ marginBottom: "5rem", borderBottom: "1px solid #000", paddingBottom: "1rem", display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: 48, fontWeight: 700, margin: 0, letterSpacing: "-2px" }}>VOC <span style={{fontWeight: 300}}>CEL</span></h1>
          <p style={{ margin: 0, color: "#999", fontSize: 14, textTransform: 'uppercase', letterSpacing: '1px' }}>Intelligence & Design Feed</p>
        </div>
        <div style={{ fontSize: 12, fontWeight: 600 }}>{new Date().toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "3rem" }}>
        {items.map((it, i) => (
          <article key={i} style={{ display: "flex", flexDirection: "column", gap: 15, group: "item" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <span style={{ 
                fontSize: 9, fontWeight: 800, padding: "2px 6px", 
                backgroundColor: BADGE_STYLES[it.cat]?.bg || "#eee", 
                color: BADGE_STYLES[it.cat]?.color || "#000",
                border: BADGE_STYLES[it.cat]?.border || "none",
                textTransform: 'uppercase'
              }}>
                {it.cat}
              </span>
              <span style={{ fontSize: 10, color: "#ccc", fontWeight: 600 }}>{it.source}</span>
            </div>
            
            <a href={it.link} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
              <h2 style={{ fontSize: 22, margin: 0, lineHeight: 1.1, fontWeight: 600, letterSpacing: "-0.5px" }}>
                {it.title}
              </h2>
            </a>

            <p style={{ fontSize: 14, color: "#666", lineHeight: 1.6, margin: 0 }}>
              {it.description.replace(/<[^>]*>/g, '').slice(0, 120)}...
            </p>

            <div style={{ marginTop: "auto", paddingTop: 10, fontSize: 11, color: "#aaa", display: 'flex', justifyContent: 'space-between' }}>
               <span>{new Date(it.pubDate).toLocaleDateString()}</span>
               <span style={{ fontWeight: 700, color: '#000' }}>→</span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
