import { useState, useCallback, useEffect } from "react";

const FEEDS = [
  { url: "https://feeds.feedburner.com/ArchDaily", label: "ArchDaily", cat: "arquitectura" },
  { url: "https://www.dezeen.com/feed/", label: "Dezeen", cat: "arquitectura" },
  { url: "https://www.yankodesign.com/feed/", label: "Yanko Design", cat: "diseño" },
  { url: "https://www.artificialintelligence-news.com/feed/", label: "AI News", cat: "ai" },
  { url: "https://hnrss.org/frontpage", label: "Hacker News", cat: "tech" }
];

// Múltiples proxies para fallback
const PROXIES = [
  "https://api.allorigins.win/get?url=",
  "https://api.codetabs.com/v1/proxy?quest=",
  "https://corsproxy.io/?"
];

const BADGE_STYLES = {
  arquitectura: { bg: "#000", color: "#fff" },
  diseño: { bg: "#fff", color: "#000", border: "1px solid #000" },
  tech: { bg: "#f0f0f0", color: "#666" },
  ai: { bg: "#5e5ce6", color: "#fff" }
};

// Función para obtener feed con reintentos y fallback de proxies
const fetchFeedWithFallback = async (feed, maxRetries = 2) => {
  for (let proxy of PROXIES) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const res = await fetch(`${proxy}${encodeURIComponent(feed.url)}&t=${Date.now()}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        
        const data = await res.json();
        const contents = data.contents || data;
        
        const parser = new DOMParser();
        const xml = parser.parseFromString(contents, "text/xml");
        
        // Verificar si es un error de parsing
        if (xml.querySelector("parsererror")) {
          throw new Error("XML parse error");
        }
        
        const entries = Array.from(xml.querySelectorAll("item, entry"));
        
        console.log(`✅ ${feed.label}: ${entries.length} entradas encontradas`);
        
        return entries.slice(0, 10).map(e => ({
          title: e.querySelector("title")?.textContent?.trim() || "Sin título",
          link: e.querySelector("link")?.textContent || e.querySelector("link")?.getAttribute("href") || "#",
          desc: (e.querySelector("description, summary, content")?.textContent || "").replace(/<[^>]*>/g, '').slice(0, 150),
          pubDate: e.querySelector("pubDate, updated, published")?.textContent || new Date().toISOString(),
          source: feed.label,
          cat: feed.cat
        }));
      } catch (err) {
        console.warn(`⚠️ ${feed.label} - Proxy ${proxy} - Intento ${attempt + 1}: ${err.message}`);
        if (attempt < maxRetries) {
          await new Promise(r => setTimeout(r, 500 * (attempt + 1))); // Backoff exponencial
        }
      }
    }
  }
  
  console.error(`❌ ${feed.label}: Todos los proxies fallaron`);
  return [];
};

export default function NewsDashboard() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState([]);

  const loadFeeds = useCallback(async () => {
    setLoading(true);
    setErrors([]);
    
    try {
      // Procesar feeds secuencialmente para evitar rate limits
      const allItems = [];
      const failedFeeds = [];
      
      for (const feed of FEEDS) {
        const feedItems = await fetchFeedWithFallback(feed);
        if (feedItems.length === 0) {
          failedFeeds.push(feed.label);
        } else {
          allItems.push(...feedItems);
        }
      }
      
      if (failedFeeds.length > 0) {
        setErrors(failedFeeds);
      }
      
      // Ordenar por fecha y tomar las 30 más recientes
      const sorted = allItems
        .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
        .slice(0, 30);
      
      console.log(`📰 Total: ${sorted.length} noticias cargadas`);
      setItems(sorted);
      
    } catch (e) {
      console.error("Error general:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { 
    loadFeeds(); 
    // Recargar cada 5 minutos
    const interval = setInterval(loadFeeds, 5 * 60 * 1000);
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
          No se pudieron cargar noticias. Intenta recargar la página.
        </div>
      )}
    </div>
  );
}
