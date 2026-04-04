import { useState, useCallback, useEffect } from "react";

const FEEDS = [
  { url: "https://feeds.feedburner.com/ArchDaily", label: "ArchDaily", cat: "arquitectura" },
  { url: "https://www.dezeen.com/feed/", label: "Dezeen", cat: "arquitectura" },
  { url: "https://www.yankodesign.com/feed/", label: "Yanko Design", cat: "diseño" },
  { url: "https://www.artificialintelligence-news.com/feed/", label: "AI News", cat: "ai" },
  { url: "https://hnrss.org/frontpage", label: "Hacker News", cat: "tech" }
];

const BADGE_STYLES = {
  arquitectura: { bg: "#000", color: "#fff" },
  diseño: { bg: "#fff", color: "#000", border: "1px solid #000" },
  tech: { bg: "#f0f0f0", color: "#666" },
  ai: { bg: "#5e5ce6", color: "#fff" }
};

// Usar rss2json API - más confiable que proxies CORS
const fetchFeed = async (feed) => {
  try {
    const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}&count=10`;
    
    const res = await fetch(apiUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
    const data = await res.json();
    
    if (data.status !== "ok") {
      throw new Error(data.message || "RSS parse error");
    }
    
    console.log(`✅ ${feed.label}: ${data.items?.length || 0} noticias`);
    
    return (data.items || []).map(item => ({
      title: item.title || "Sin título",
      link: item.link || "#",
      desc: (item.description || item.content || "").replace(/<[^>]*>/g, '').slice(0, 150),
      pubDate: item.pubDate || new Date().toISOString(),
      source: feed.label,
      cat: feed.cat
    }));
    
  } catch (err) {
    console.error(`❌ ${feed.label}:`, err.message);
    return [];
  }
};

export default function NewsDashboard() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState([]);

  const loadFeeds = useCallback(async () => {
    setLoading(true);
    setErrors([]);
    
    try {
      // Cargar todos los feeds en paralelo
      const results = await Promise.all(
        FEEDS.map(async (feed) => {
          const items = await fetchFeed(feed);
          return { feed: feed.label, items };
        })
      );
      
      const failed = results.filter(r => r.items.length === 0).map(r => r.feed);
      if (failed.length > 0) setErrors(failed);
      
      const allItems = results.flatMap(r => r.items);
      
      // Ordenar por fecha (más recientes primero) y tomar 30
      const sorted = allItems
        .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
        .slice(0, 30);
      
      console.log(`📰 Total: ${sorted.length} noticias`);
      setItems(sorted);
      
    } catch (e) {
      console.error("Error general:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { 
    loadFeeds(); 
    // Recargar cada 10 minutos (rss2json cachea 1 hora en plan gratis)
    const interval = setInterval(loadFeeds, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadFeeds]);

  if (loading) return (
    <div style={{ 
      display: 'flex', 
      height: '100vh', 
      alignItems: 'center', 
      justifyContent: 'center', 
      fontFamily: 'sans-serif',
      flexDirection: 'column',
      gap: '1rem'
    }}>
      <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>CURANDO VOC CEL...</div>
      <div style={{ fontSize: '0.8rem', color: '#999' }}>Cargando feeds RSS</div>
    </div>
  );

  return (
    <div style={{ padding: "4rem 2rem", maxWidth: 1200, margin: "0 auto", fontFamily: 'sans-serif' }}>
      <header style={{ marginBottom: "4rem", borderBottom: "3px solid #000", paddingBottom: "1.5rem" }}>
        <h1 style={{ fontSize: 50, fontWeight: 800, margin: 0, letterSpacing: "-3px" }}>
          VOC <span style={{ fontWeight: 200 }}>CEL</span>
        </h1>
        <p style={{ margin: "10px 0 0 0", color: "#999", fontSize: 11, textTransform: 'uppercase', letterSpacing: '2px' }}>
          Curaduría de Arquitectura y Diseño
        </p>
        {errors.length > 0 && (
          <p style={{ margin: "10px 0 0 0", color: "#e74c3c", fontSize: 11 }}>
            ⚠️ No se pudieron cargar: {errors.join(", ")}
          </p>
        )}
      </header>
      
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", 
        gap: "3rem" 
      }}>
        {items.map((it, i) => (
          <article key={`${it.source}-${i}`} style={{ borderTop: "1px solid #eee", paddingTop: "1rem" }}>
            <div style={{ fontSize: 9, fontWeight: 800, marginBottom: 8, textTransform: 'uppercase' }}>
              <span style={{ 
                backgroundColor: BADGE_STYLES[it.cat]?.bg || "#eee", 
                color: BADGE_STYLES[it.cat]?.color || "#000", 
                padding: "2px 5px", 
                border: BADGE_STYLES[it.cat]?.border || "none",
                borderRadius: "2px"
              }}>
                {it.cat}
              </span>
              <span style={{ marginLeft: 10, color: "#ccc" }}>{it.source}</span>
            </div>
            <a href={it.link} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', color: '#000' }}>
              <h2 style={{ fontSize: 20, margin: "0 0 10px 0", lineHeight: 1.2 }}>{it.title}</h2>
            </a>
            <p style={{ fontSize: 14, color: "#666", lineHeight: 1.5 }}>{it.desc}...</p>
          </article>
        ))}
      </div>
      
      {items.length === 0 && (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#999' }}>
          No se pudieron cargar noticias. 
          <button onClick={loadFeeds} style={{ marginLeft: '1rem', padding: '0.5rem 1rem' }}>
            Reintentar
          </button>
        </div>
      )}
    </div>
  );
}
