import { useState, useCallback, useEffect } from "react";

const FEEDS = [
  // ARQUITECTURA (8 fuentes)
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

// Múltiples proxies CORS para fallback
const PROXIES = [
  { url: "https://corsproxy.io/?", type: "direct" },  // Devuelve contenido directo
  { url: "https://api.allorigins.win/raw?url=", type: "direct" },  // Devuelve XML directo
  { url: "https://api.allorigins.win/get?url=", type: "json" }  // Devuelve JSON con .contents
];

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const extractImage = (item) => {
  // 1. Media content (YouTube, etc)
  const media = item.querySelector("media\\:content, content");
  if (media?.getAttribute("url")) return media.getAttribute("url");
  
  // 2. Enclosure
  const enclosure = item.querySelector("enclosure");
  if (enclosure?.getAttribute("url")) return enclosure.getAttribute("url");
  
  // 3. Imagen en description/content
  const desc = item.querySelector("description, content\\:encoded, content")?.textContent || "";
  const imgMatch = desc.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imgMatch) return imgMatch[1];
  
  return null;
};

const parseXML = (xmlText) => {
  const parser = new DOMParser();
  const xml = parser.parseFromString(xmlText, "text/xml");
  
  // Verificar error de parsing
  if (xml.querySelector("parsererror")) {
    throw new Error("XML parse error");
  }
  
  const items = xml.querySelectorAll("item, entry");
  
  return Array.from(items).slice(0, 8).map(item => {
    const title = item.querySelector("title")?.textContent?.trim() || "Sin título";
    const linkEl = item.querySelector("link");
    const link = linkEl?.textContent || linkEl?.getAttribute("href") || "#";
    const pubDate = item.querySelector("pubDate, updated, published")?.textContent || new Date().toISOString();
    const desc = (item.querySelector("description, summary")?.textContent || "").replace(/<[^>]*>/g, '').slice(0, 120);
    
    return {
      title,
      link,
      desc,
      pubDate,
      image: extractImage(item)
    };
  });
};

const fetchFeed = async (feed, index) => {
  // Delay escalonado para evitar rate limits (300ms entre cada feed)
  await delay(index * 300);
  
  for (const proxy of PROXIES) {
    try {
      const proxyUrl = `${proxy.url}${encodeURIComponent(feed.url)}`;
      const res = await fetch(proxyUrl, { 
        signal: AbortSignal.timeout(10000) // 10 segundos timeout
      });
      
      if (!res.ok) continue;
      
      let xmlText;
      if (proxy.type === "json") {
        const data = await res.json();
        xmlText = data.contents;
      } else {
        xmlText = await res.text();
      }
      
      if (!xmlText || xmlText.length < 50) continue;
      
      const items = parseXML(xmlText);
      
      if (items.length > 0) {
        console.log(`✅ ${feed.label}: ${items.length} noticias`);
        return items.map(item => ({
          ...item,
          source: feed.label,
          cat: feed.cat
        }));
      }
      
    } catch (err) {
      console.warn(`⚠️ ${feed.label} - ${proxy.url.slice(0, 20)}: ${err.message}`);
      continue;
    }
  }
  
  console.error(`❌ ${feed.label}: Todos los proxies fallaron`);
  return [];
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
      // Cargar feeds secuencialmente con delay
      const results = [];
      for (let i = 0; i < FEEDS.length; i++) {
        const feed = FEEDS[i];
        const items = await fetchFeed(feed, i);
        results.push({ feed: feed.label, items });
      }
      
      const failed = results.filter(r => r.items.length === 0).map(r => r.feed);
      if (failed.length > 0) setErrors(failed);
      
      const allItems = results.flatMap(r => r.items);
      
      const sorted = allItems
        .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
        .slice(0, 60);
      
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
    const interval = setInterval(loadFeeds, 20 * 60 * 1000); // 20 minutos
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
      <div style={{ fontSize: '0.7rem', color: '#ccc' }}>Esto puede tomar unos segundos...</div>
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
            ⚠️ No cargaron ({errors.length}): {errors.slice(0, 5).join(", ")}{errors.length > 5 ? "..." : ""}
          </p>
        )}
      </header>

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
            {cat === 'all' ? `Todas (${items.length})` : `${cat} (${items.filter(i => i.cat === cat).length})`}
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
          <button 
            onClick={loadFeeds} 
            style={{ 
              display: 'block', 
              margin: '1rem auto', 
              padding: '0.75rem 1.5rem',
              background: '#000',
              color: '#fff',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Reintentar carga
          </button>
        </div>
      )}
    </div>
  );
}
