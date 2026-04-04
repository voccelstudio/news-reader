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

// Extraer imagen del feed (rss2json la pone en enclosure o content)
const extractImage = (item) => {
  // 1. Imagen del enclosure
  if (item.enclosure?.link && item.enclosure.type?.startsWith('image/')) {
    return item.enclosure.link;
  }
  // 2. Imagen en thumbnail (rss2json la extrae automáticamente)
  if (item.thumbnail) {
    return item.thumbnail;
  }
  // 3. Buscar primera imagen en el contenido HTML
  const imgMatch = item.content?.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imgMatch) return imgMatch[1];
  // 4. Buscar en description
  const descMatch = item.description?.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (descMatch) return descMatch[1];
  
  return null;
};

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
      desc: (item.description || "").replace(/<[^>]*>/g, '').slice(0, 120),
      pubDate: item.pubDate || new Date().toISOString(),
      source: feed.label,
      cat: feed.cat,
      image: extractImage(item)
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
      const results = await Promise.all(
        FEEDS.map(async (feed) => {
          const items = await fetchFeed(feed);
          return { feed: feed.label, items };
        })
      );
      
      const failed = results.filter(r => r.items.length === 0).map(r => r.feed);
      if (failed.length > 0) setErrors(failed);
      
      const allItems = results.flatMap(r => r.items);
      
      const sorted = allItems
        .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
        .slice(0, 30);
      
      console.log(`📰 Total: ${sorted.length} noticias, ${sorted.filter(i => i.image).length} con imagen`);
      setItems(sorted);
      
    } catch (e) {
      console.error("Error general:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { 
    loadFeeds(); 
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
    <div style={{ padding: "4rem 2rem", maxWidth: 1400, margin: "0 auto", fontFamily: 'sans-serif' }}>
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
        gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", 
        gap: "2.5rem" 
      }}>
        {items.map((it, i) => (
          <article key={`${it.source}-${i}`} style={{ 
            borderTop: "1px solid #eee", 
            paddingTop: "1rem",
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}>
            {/* Imagen */}
            {it.image ? (
              <a href={it.link} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                <div style={{
                  width: '100%',
                  height: '200px',
                  overflow: 'hidden',
                  backgroundColor: '#f5f5f5',
                  borderRadius: '4px'
                }}>
                  <img 
                    src={it.image} 
                    alt={it.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transition: 'transform 0.3s ease'
                    }}
                    onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                    onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.style.display = 'none';
                    }}
                  />
                </div>
              </a>
            ) : (
              <div style={{
                width: '100%',
                height: '120px',
                backgroundColor: '#f5f5f5',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ccc',
                fontSize: '0.75rem'
              }}>
                Sin imagen
              </div>
            )}
            
            {/* Meta info */}
            <div style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase' }}>
              <span style={{ 
                backgroundColor: BADGE_STYLES[it.cat]?.bg || "#eee", 
                color: BADGE_STYLES[it.cat]?.color || "#000", 
                padding: "2px 6px", 
                border: BADGE_STYLES[it.cat]?.border || "none",
                borderRadius: '2px'
              }}>
                {it.cat}
              </span>
              <span style={{ marginLeft: 10, color: "#999" }}>{it.source}</span>
            </div>
            
            {/* Título */}
            <a href={it.link} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', color: '#000' }}>
              <h2 style={{ fontSize: 18, margin: 0, lineHeight: 1.3, fontWeight: 600 }}>{it.title}</h2>
            </a>
            
            {/* Descripción */}
            <p style={{ fontSize: 13, color: "#666", lineHeight: 1.5, margin: 0 }}>{it.desc}...</p>
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
