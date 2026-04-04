import { useState, useCallback, useEffect } from "react";

const FEEDS = [
  // ARQUITECTURA GLOBAL (8 fuentes)
  { url: "https://feeds.feedburner.com/ArchDaily", label: "ArchDaily", cat: "arquitectura" },
  { url: "https://www.dezeen.com/feed/", label: "Dezeen", cat: "arquitectura" },
  { url: "https://www.designboom.com/feed/", label: "Designboom", cat: "arquitectura" },
  { url: "https://www.contemporist.com/feed/", label: "Contemporist", cat: "arquitectura" },
  { url: "https://archinect.com/news/feed", label: "Archinect", cat: "arquitectura" },
  { url: "https://www.architecturalrecord.com/rss", label: "Arch Record", cat: "arquitectura" },
  { url: "https://architizer.com/blog/feed/", label: "Architizer", cat: "arquitectura" },
  { url: "https://www.archdaily.com/country/japan/feed/", label: "ArchDaily Japan", cat: "arquitectura" },
  
  // DISEÑO (4 fuentes)
  { url: "https://www.yankodesign.com/feed/", label: "Yanko Design", cat: "diseño" },
  { url: "https://www.architecturaldigest.com/feed/rss", label: "Arch Digest", cat: "diseño" },
  { url: "https://www.uncrate.com/index.xml", label: "Uncrate", cat: "diseño" },
  { url: "https://www.fastcompany.com/co-design/rss", label: "Fast Co Design", cat: "diseño" },
  
  // TECNOLOGÍA (4 fuentes)
  { url: "https://hnrss.org/frontpage", label: "Hacker News", cat: "tech" },
  { url: "https://www.theverge.com/rss/index.xml", label: "The Verge", cat: "tech" },
  { url: "https://techcrunch.com/feed/", label: "TechCrunch", cat: "tech" },
  { url: "https://wired.com/feed/", label: "Wired", cat: "tech" },
  
  // AI (4 fuentes)
  { url: "https://www.artificialintelligence-news.com/feed/", label: "AI News", cat: "ai" },
  { url: "https://venturebeat.com/feed/", label: "VentureBeat", cat: "ai" },
  { url: "https://www.technologyreview.com/feed/", label: "MIT Tech Review", cat: "ai" },
  { url: "https://www.ai-journal.com/feed/", label: "AI Journal", cat: "ai" }
];

const BADGE_STYLES = {
  arquitectura: { bg: "#000", color: "#fff" },
  diseño: { bg: "#fff", color: "#000", border: "1px solid #000" },
  tech: { bg: "#f0f0f0", color: "#666" },
  ai: { bg: "#5e5ce6", color: "#fff" }
};

const extractImage = (item) => {
  if (item.enclosure?.link && item.enclosure.type?.startsWith('image/')) {
    return item.enclosure.link;
  }
  if (item.thumbnail) return item.thumbnail;
  const imgMatch = item.content?.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imgMatch) return imgMatch[1];
  const descMatch = item.description?.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (descMatch) return descMatch[1];
  return null;
};

const fetchFeed = async (feed) => {
  try {
    const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}&count=8`;
    
    const res = await fetch(apiUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
    const data = await res.json();
    if (data.status !== "ok") throw new Error(data.message || "RSS error");
    
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
  const [activeFilter, setActiveFilter] = useState('all');

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
        .slice(0, 60); // Aumentado a 60 noticias
      
      console.log(`📰 Total: ${sorted.length} noticias de ${FEEDS.length - failed.length} fuentes`);
      setItems(sorted);
      
    } catch (e) {
      console.error("Error general:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { 
    loadFeeds(); 
    const interval = setInterval(loadFeeds, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadFeeds]);

  const filteredItems = activeFilter === 'all' 
    ? items 
    : items.filter(i => i.cat === activeFilter);

  const categories = ['all', 'arquitectura', 'diseño', 'tech', 'ai'];

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
      <div style={{ fontSize: '0.8rem', color: '#999' }}>Cargando {FEEDS.length} feeds RSS</div>
    </div>
  );

  return (
    <div style={{ padding: "3rem 2rem", maxWidth: 1600, margin: "0 auto", fontFamily: 'sans-serif' }}>
      <header style={{ marginBottom: "3rem", borderBottom: "3px solid #000", paddingBottom: "1.5rem" }}>
        <h1 style={{ fontSize: 50, fontWeight: 800, margin: 0, letterSpacing: "-3px" }}>
          VOC <span style={{ fontWeight: 200 }}>CEL</span>
        </h1>
        <p style={{ margin: "10px 0 0 0", color: "#999", fontSize: 11, textTransform: 'uppercase', letterSpacing: '2px' }}>
          Curaduría Global de Arquitectura y Diseño
        </p>
        {errors.length > 0 && (
          <p style={{ margin: "10px 0 0 0", color: "#e74c3c", fontSize: 11 }}>
            ⚠️ No cargaron: {errors.join(", ")}
          </p>
        )}
      </header>

      {/* Filtros */}
      <div style={{ 
        display: 'flex', 
        gap: '0.5rem', 
        marginBottom: '2rem',
        flexWrap: 'wrap'
      }}>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveFilter(cat)}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid #000',
              background: activeFilter === cat ? '#000' : '#fff',
              color: activeFilter === cat ? '#fff' : '#000',
              cursor: 'pointer',
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              fontWeight: 600
            }}
          >
            {cat === 'all' ? 'Todas' : cat}
          </button>
        ))}
      </div>
      
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", 
        gap: "2rem" 
      }}>
        {filteredItems.map((it, i) => (
          <article key={`${it.source}-${i}`} style={{ 
            borderTop: "1px solid #eee", 
            paddingTop: "1rem",
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}>
            {it.image ? (
              <a href={it.link} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                <div style={{
                  width: '100%',
                  height: '180px',
                  overflow: 'hidden',
                  backgroundColor: '#f5f5f5',
                  borderRadius: '4px'
                }}>
                  <img 
                    src={it.image} 
                    alt={it.title}
                    loading="lazy"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transition: 'transform 0.3s ease'
                    }}
                    onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                    onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                    onError={(e) => e.target.parentElement.style.display = 'none'}
                  />
                </div>
              </a>
            ) : (
              <div style={{
                width: '100%',
                height: '100px',
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
            
            <a href={it.link} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', color: '#000' }}>
              <h2 style={{ fontSize: 17, margin: 0, lineHeight: 1.3, fontWeight: 600 }}>{it.title}</h2>
            </a>
            
            <p style={{ fontSize: 13, color: "#666", lineHeight: 1.5, margin: 0 }}>{it.desc}...</p>
          </article>
        ))}
      </div>
      
      {filteredItems.length === 0 && (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#999' }}>
          No hay noticias en esta categoría.
        </div>
      )}
    </div>
  );
}
