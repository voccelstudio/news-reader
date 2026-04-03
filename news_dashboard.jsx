import { useState, useCallback, useEffect } from "react";

const FEEDS = [
  { url: "https://feeds.feedburner.com/ArchDaily", label: "ArchDaily", cat: "arquitectura" },
  { url: "https://www.dezeen.com/feed/", label: "Dezeen", cat: "arquitectura" },
  { url: "https://www.yankodesign.com/feed/", label: "Yanko Design", cat: "diseño" },
  { url: "https://www.artificialintelligence-news.com/feed/", label: "AI News", cat: "ai" },
  { url: "https://hnrss.org/frontpage", label: "Hacker News", cat: "tech" }
];

// Cambiamos a un proxy que suele ser más robusto para contenido pesado
const PROXY = "https://api.allorigins.win/get?url=";

export default function NewsDashboard() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadFeeds = useCallback(async () => {
    setLoading(true);
    try {
      const results = await Promise.all(
        FEEDS.map(async (f) => {
          try {
            // Agregamos un timestamp para evitar que el proxy nos dé datos viejos (cache)
            const res = await fetch(`${PROXY}${encodeURIComponent(f.url)}&timestamp=${Date.now()}`);
            const data = await res.json();
            
            const parser = new DOMParser();
            const xml = parser.parseFromString(data.contents, "text/xml");
            
            // Buscamos items (RSS) o entries (Atom)
            const entries = Array.from(xml.querySelectorAll("item, entry")).slice(0, 5);
            
            return entries.map(e => {
              const title = e.querySelector("title")?.textContent || "Sin título";
              const link = e.querySelector("link")?.textContent || e.querySelector("link")?.getAttribute("href") || "#";
              let desc = e.querySelector("description, summary, content")?.textContent || "";
              desc = desc.replace(/<[^>]*>/g, '').slice(0, 150);
              const pubDate = e.querySelector("pubDate, updated, published")?.textContent || new Date().toISOString();

              return { title, link, desc, pubDate, source: f.label, cat: f.cat };
            });
          } catch (err) {
            console.warn("Fallo en:", f.label);
            return [];
          }
        })
      );
      
      const combined = results.flat().sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
      setItems(combined);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadFeeds(); }, [loadFeeds]);

  if (loading) return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', letterSpacing: '2px' }}>
      CURANDO CONTENIDO VOC CEL...
    </div>
  );

  return (
    <div style={{ padding: "4rem 2rem", maxWidth: 1200, margin: "0 auto", fontFamily: 'sans-serif' }}>
      <header style={{ marginBottom: "4rem", borderBottom: "3px solid #000", paddingBottom: "1.5rem" }}>
        <h1 style={{ fontSize: 60, fontWeight: 800, margin: 0, letterSpacing: "-3px" }}>
          VOC <span style={{ fontWeight: 200 }}>CEL</span>
        </h1>
        <p style={{ margin: "10px 0 0 0", color: "#999", fontSize: 11, textTransform: 'uppercase', letterSpacing: '2px' }}>
          Arquitectura, Diseño e Inteligencia
        </p>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "4rem 2rem" }}>
        {items.map((it, i) => (
          <article key={i} style={{ display: "flex", flexDirection: "column", borderTop: "1px solid #eee", paddingTop: "1.5rem" }}>
            <div style={{ fontSize: 9, fontWeight: 800, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
              {it.cat} <span style={{ color: '#ccc', margin: '0 5px' }}>|</span> {it.source}
            </div>
            <a href={it.link} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', color: '#000' }}>
              <h2 style={{ fontSize: 20, margin: "0 0 10px 0", lineHeight: 1.2 }}>{it.title}</h2>
            </a>
            <p style={{ fontSize: 14, color: "#666", lineHeight: 1.5 }}>{it.desc}...</p>
            <div style={{ marginTop: "auto", fontSize: 10, color: "#999", fontWeight: 600 }}>
              {new Date(it.pubDate).toLocaleDateString()}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
