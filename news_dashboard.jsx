import { useState, useCallback, useEffect } from "react";

const FEEDS = [
  { url: "https://feeds.feedburner.com/ArchDaily", label: "ArchDaily", cat: "arquitectura" },
  { url: "https://www.dezeen.com/feed/", label: "Dezeen", cat: "arquitectura" },
  { url: "https://www.yankodesign.com/feed/", label: "Yanko Design", cat: "diseño" },
  { url: "https://www.artificialintelligence-news.com/feed/", label: "AI News", cat: "ai" },
  { url: "https://hnrss.org/frontpage", label: "Hacker News", cat: "tech" }
];

const PROXY = "https://api.allorigins.win/get?url=";

const BADGE_STYLES = {
  arquitectura: { bg: "#000", color: "#fff" },
  diseño: { bg: "#fff", color: "#000", border: "1px solid #000" },
  tech: { bg: "#f0f0f0", color: "#666" },
  ai: { bg: "#5e5ce6", color: "#fff" }
};

export default function NewsDashboard() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadFeeds = useCallback(async () => {
    setLoading(true);
    try {
      const results = await Promise.all(
        FEEDS.map(async (f) => {
          try {
            const res = await fetch(`${PROXY}${encodeURIComponent(f.url)}&t=${Date.now()}`);
            const data = await res.json();
            const parser = new DOMParser();
            const xml = parser.parseFromString(data.contents, "text/xml");
            const entries = Array.from(xml.querySelectorAll("item, entry")).slice(0, 5);
            
            return entries.map(e => ({
              title: e.querySelector("title")?.textContent || "Sin título",
              link: e.querySelector("link")?.textContent || e.querySelector("link")?.getAttribute("href") || "#",
              desc: (e.querySelector("description, summary, content")?.textContent || "").replace(/<[^>]*>/g, '').slice(0, 150),
              pubDate: e.querySelector("pubDate, updated, published")?.textContent || new Date().toISOString(),
              source: f.label,
              cat: f.cat
            }));
          } catch (err) { return []; }
        })
      );
      setItems(results.flat().sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate)));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadFeeds(); }, [loadFeeds]);

  if (loading) return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>CURANDO VOC CEL...</div>;

  return (
    <div style={{ padding: "4rem 2rem", maxWidth: 1200, margin: "0 auto", fontFamily: 'sans-serif' }}>
      <header style={{ marginBottom: "4rem", borderBottom: "3px solid #000", paddingBottom: "1.5rem" }}>
        <h1 style={{ fontSize: 50, fontWeight: 800, margin: 0, letterSpacing: "-3px" }}>VOC <span style={{ fontWeight: 200 }}>CEL</span></h1>
        <p style={{ margin: "10px 0 0 0", color: "#999", fontSize: 11, textTransform: 'uppercase', letterSpacing: '2px' }}>Curaduría de Arquitectura y Diseño</p>
      </header>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "3rem" }}>
        {items.map((it, i) => (
          <article key={i} style={{ borderTop: "1px solid #eee", paddingTop: "1rem" }}>
            <div style={{ fontSize: 9, fontWeight: 800, marginBottom: 8, textTransform: 'uppercase' }}>
              <span style={{ backgroundColor: BADGE_STYLES[it.cat]?.bg || "#eee", color: BADGE_STYLES[it.cat]?.color || "#000", padding: "2px 5px", border: BADGE_STYLES[it.cat]?.border || "none" }}>{it.cat}</span>
              <span style={{ marginLeft: 10, color: "#ccc" }}>{it.source}</span>
            </div>
            <a href={it.link} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', color: '#000' }}>
              <h2 style={{ fontSize: 20, margin: "0 0 10px 0", lineHeight: 1.2 }}>{it.title}</h2>
            </a>
            <p style={{ fontSize: 14, color: "#666", lineHeight: 1.5 }}>{it.desc}...</p>
          </article>
        ))}
      </div>
    </div>
  );
}
