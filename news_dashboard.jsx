import { useState, useCallback, useEffect } from "react";

const FEEDS = [
  { url: "https://feeds.feedburner.com/ArchDaily", label: "ArchDaily", cat: "arquitectura" },
  { url: "https://www.dezeen.com/feed/", label: "Dezeen", cat: "arquitectura" },
  { url: "https://www.yankodesign.com/feed/", label: "Yanko Design", cat: "diseño" },
  { url: "https://feeds.feedburner.com/smashingmagazine", label: "Smashing Mag", cat: "tech" },
  { url: "https://css-tricks.com/feed/", label: "CSS-Tricks", cat: "tech" },
  { url: "https://hnrss.org/frontpage", label: "Hacker News", cat: "tech" },
  { url: "https://www.artificialintelligence-news.com/feed/", label: "AI News", cat: "ai" },
];

// Usamos un proxy más abierto
const PROXY = "https://api.allorigins.win/get?url=";

const CAT_LABELS = { arquitectura: "Arquitectura", diseño: "Diseño", tech: "Tech / Dev", ai: "AI" };
const BADGE_STYLES = {
  arquitectura: { background: "#E1F5EE", color: "#0F6E56" },
  diseño: { background: "#FBEAF0", color: "#993556" },
  tech: { background: "#E6F1FB", color: "#185FA5" },
  ai: { background: "#F3E8FF", color: "#6B21A8" }
};

export default function NewsDashboard() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadFeeds = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const allData = await Promise.all(
        FEEDS.map(async (feed) => {
          // AllOrigins devuelve un JSON con el contenido en 'contents'
          const res = await fetch(`${PROXY}${encodeURIComponent(feed.url)}`);
          const data = await res.json();
          
          // Parseamos el XML que devuelve el proxy
          const parser = new DOMParser();
          const xml = parser.parseFromString(data.contents, "text/xml");
          const entries = Array.from(xml.querySelectorAll("item, entry")).slice(0, 5);

          return entries.map(entry => ({
            title: entry.querySelector("title")?.textContent,
            link: entry.querySelector("link")?.textContent || entry.querySelector("link")?.getAttribute("href"),
            desc: entry.querySelector("description, summary")?.textContent?.replace(/<[^>]*>/g, '').slice(0, 150) + "...",
            pubDate: entry.querySelector("pubDate, updated, published")?.textContent,
            source: feed.label,
            cat: feed.cat
          }));
        })
      );
      setItems(allData.flat().sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate)));
    } catch (err) {
      console.error(err);
      setError("Error al conectar con los servidores de noticias.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFeeds();
  }, [loadFeeds]);

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString() : "";

  if (loading) return <div style={{ padding: 40, textAlign: 'center', fontFamily: 'sans-serif' }}>Cargando últimas noticias de arquitectura y diseño...</div>;
  if (error) return <div style={{ padding: 40, textAlign: 'center', color: 'red', fontFamily: 'sans-serif' }}>{error} <br/><button onClick={loadFeeds} style={{marginTop: 10}}>Reintentar</button></div>;

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "2rem", fontFamily: 'system-ui, sans-serif' }}>
      <header style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>News Feed</h1>
        <p style={{ color: "#666" }}>Inspiración diaria para arquitectos y diseñadores</p>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.5rem" }}>
        {items.map((it, i) => (
          <div key={i} style={{
            background: "#fff",
            border: "1px solid #eee",
            borderRadius: 12,
            padding: "1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: 10,
            transition: "transform 0.2s",
            cursor: "default"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{
                fontSize: 10, padding: "3px 8px", borderRadius: 20, fontWeight: 600, textTransform: 'uppercase',
                ...(BADGE_STYLES[it.cat] || BADGE_STYLES.tech)
              }}>
                {CAT_LABELS[it.cat]}
              </span>
              <span style={{ fontSize: 11, color: "#999" }}>{fmtDate(it.pubDate)}</span>
            </div>
            <h3 style={{ fontSize: 16, margin: 0, lineHeight: 1.3 }}>{it.title}</h3>
            <p style={{ fontSize: 13, color: "#555", margin: 0, flexGrow: 1 }}>{it.desc}</p>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#888" }}>{it.source}</span>
              <a href={it.link} target="_blank" rel="noopener noreferrer" style={{
                fontSize: 12, color: "#000", fontWeight: 700, textDecoration: 'none', borderBottom: '1px solid #000'
              }}>Leer más</a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
