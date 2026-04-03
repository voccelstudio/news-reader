import { useState, useCallback, useEffect } from "react";

const FEEDS = [
  { url: "https://feeds.feedburner.com/ArchDaily", label: "ArchDaily", cat: "arquitectura" },
  { url: "https://www.dezeen.com/feed/", label: "Dezeen", cat: "arquitectura" },
  { url: "https://www.yankodesign.com/feed/", label: "Yanko Design", cat: "diseño" },
  { url: "https://www.artificialintelligence-news.com/feed/", label: "AI News", cat: "ai" },
  { url: "https://hnrss.org/frontpage", label: "Hacker News", cat: "tech" },
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
      const allData = await Promise.all(
        FEEDS.map(async (f) => {
          const res = await fetch(`${PROXY}${encodeURIComponent(f.url)}`);
          const data = await res.json();
          const parser = new DOMParser();
          const xml = parser.parseFromString(data.contents, "text/xml");
          const entries = Array.from(xml.querySelectorAll("item, entry")).slice(0, 5);
          
          return entries.map(e => ({
            title: e.querySelector("title")?.textContent || "Sin título",
            link: e.querySelector("link")?.textContent || e.querySelector("link")?.getAttribute("href") || "#",
            desc: e.querySelector("description, summary")?.textContent?.replace(/<[^>]*>/g, '').slice(0, 150) || "",
            pubDate: e.querySelector("pubDate, updated, published")?.textContent || new Date().toISOString(),
            source: f.label,
            cat: f.cat
          }));
        })
      );
      setItems(allData.flat().sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate)));
    } catch (e) {
      console.error("Error cargando feeds:", e);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadFeeds(); }, [loadFeeds]);

  if (loading) return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', letterSpacing: '3px' }}>
      CURADURÍA VOC CEL...
    </div>
  );

  return (
    <div style={{ padding: "4rem 2rem", maxWidth: 1200, margin: "0 auto", fontFamily: 'sans-serif' }}>
      <header style={{ marginBottom: "5rem", borderBottom: "2px solid #000", paddingBottom: "1.5rem", display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div>
          <h1 style={{ fontSize: 56, fontWeight: 800, margin: 0, letterSpacing: "-3px", lineHeight: 0.8 }}>VOC <span style={{fontWeight: 200}}>CEL</span></h1>
          <p style={{ margin: "10px 0 0 0", color: "#999", fontSize: 12, textTransform: 'uppercase', letterSpacing: '2px' }}>Intelligence & Design Feed</p>
        </div>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "4rem 3rem" }}>
        {items.map((it, i) => (
          <article key={i} style={{ display: "flex", flexDirection: "column", gap: 15 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
               <span style={{ 
                fontSize: 9, fontWeight: 900, padding: "3px 8px", textTransform: 'uppercase',
                backgroundColor: BADGE_STYLES[it.cat]?.bg || "#eee", 
                color: BADGE_STYLES[it.cat]?.color || "#000", 
                border: BADGE_STYLES[it.cat]?.border || 'none'
              }}>{it.cat}</span>
               <span style={{ fontSize: 10, color: "#aaa", fontWeight: 600 }}>{it.source}</span>
            </div>
            
            <a href={it.link} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', color: '#000' }}>
              <h2 style={{ fontSize: 24, margin: 0, lineHeight: 1.1, fontWeight: 600 }}>{it.title}</h2>
            </a>

            <p style={{ fontSize: 15, color: "#555", lineHeight: 1.6, margin: 0 }}>{it.desc}...</p>

            <div style={{ marginTop: "auto", paddingTop: 15, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <span style={{ fontSize: 11, color: "#bbb" }}>{new Date(it.pubDate).toLocaleDateString()}</span>
               <a href={it.link} target="_blank" rel="noreferrer" style={{ color: '#000', textDecoration: 'none', fontSize: 12, fontWeight: 800, borderBottom: '2px solid #000' }}>LEER</a>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
