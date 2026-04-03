import { useState, useCallback } from "react";

const FEEDS = [
  { url: "https://feeds.feedburner.com/ArchDaily", label: "ArchDaily", cat: "arquitectura" },
  { url: "https://www.dezeen.com/feed/", label: "Dezeen", cat: "arquitectura" },
  { url: "https://www.yankodesign.com/feed/", label: "Yanko Design", cat: "diseño" },
  { url: "https://feeds.feedburner.com/smashingmagazine", label: "Smashing Mag", cat: "tech" },
  { url: "https://css-tricks.com/feed/", label: "CSS-Tricks", cat: "tech" },
  { url: "https://hnrss.org/frontpage", label: "Hacker News", cat: "tech" },
  { url: "https://www.artificialintelligence-news.com/feed/", label: "AI News", cat: "ai" },
];

const PROXY = "https://api.rss2json.com/v1/api.json?rss_url=";

const CAT_LABELS = { arquitectura: "Arquitectura", diseño: "Diseño", tech: "Tech / Dev", ai: "AI" };
const BADGE_STYLES = {
  arquitectura: { background: "#E1F5EE", color: "#0F6E56" },
  diseño: { background: "#FBEAF0", color: "#993556" },
  tech: { background: "#E6F1FB", color: "#185FA5" },
  ai: { background: "#EEEDFE", color: "#534AB7" },
};

function stripHtml(h = "") {
  const tmp = document.createElement("div");
  tmp.innerHTML = h;
  const t = tmp.textContent || "";
  return t.length > 140 ? t.slice(0, 140) + "…" : t;
}

function fmtDate(str) {
  if (!str) return "";
  const d = new Date(str);
  if (isNaN(d)) return "";
  return d.toLocaleDateString("es-PY", { day: "numeric", month: "short" });
}

async function fetchFeed(feed) {
  try {
    const res = await fetch(`${PROXY}${encodeURIComponent(feed.url)}&count=8`);
    const data = await res.json();
    if (data.status !== "ok") return [];
    return (data.items || []).slice(0, 6).map((it) => ({
      title: it.title || "Sin título",
      desc: stripHtml(it.description || it.content),
      link: it.link,
      pubDate: it.pubDate,
      source: feed.label,
      cat: feed.cat,
    }));
  } catch {
    return [];
  }
}

export default function NewsDashboard() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all");
  const [lastUpdate, setLastUpdate] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const results = await Promise.allSettled(FEEDS.map((f) => fetchFeed(f)));
    const all = results
      .flatMap((r) => (r.status === "fulfilled" ? r.value : []))
      .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
    if (!all.length) setError("No se pudieron cargar los feeds. Revisá tu conexión.");
    setItems(all);
    setLastUpdate(new Date().toLocaleTimeString("es-PY", { hour: "2-digit", minute: "2-digit" }));
    setLoading(false);
  }, []);

  const visible = filter === "all" ? items : items.filter((i) => i.cat === filter);
  const counts = {
    arch: items.filter((i) => i.cat === "arquitectura").length,
    design: items.filter((i) => i.cat === "diseño").length,
    tech: items.filter((i) => i.cat === "tech" || i.cat === "ai").length,
  };

  const filters = [
    { key: "all", label: "Todos" },
    { key: "arquitectura", label: "Arquitectura" },
    { key: "diseño", label: "Diseño industrial" },
    { key: "tech", label: "Tech / Dev" },
    { key: "ai", label: "AI" },
  ];

  return (
    <div style={{ fontFamily: "var(--font-sans, sans-serif)", padding: "0 0 2rem" }}>
      {/* Header */}
      <div style={{ borderBottom: "0.5px solid var(--color-border-tertiary, #e5e5e5)", paddingBottom: "1rem", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1rem" }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 500 }}>Feed de noticias</div>
            <div style={{ fontSize: 13, color: "var(--color-text-secondary, #666)", marginTop: 2 }}>
              {lastUpdate ? `Última actualización: ${lastUpdate}` : "No actualizado aún"}
            </div>
          </div>
          <button
            onClick={load}
            disabled={loading}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "6px 14px", fontSize: 13,
              border: "0.5px solid var(--color-border-secondary, #ccc)",
              borderRadius: 8, background: "transparent",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.5 : 1,
            }}
          >
            {loading ? "⏳" : "↻"} Actualizar
          </button>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                padding: "4px 12px", fontSize: 12, borderRadius: 999,
                border: "0.5px solid var(--color-border-tertiary, #e5e5e5)",
                background: filter === f.key ? "var(--color-text-primary, #000)" : "transparent",
                color: filter === f.key ? "var(--color-background-primary, #fff)" : "var(--color-text-secondary, #666)",
                cursor: "pointer",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      {items.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: "1.5rem" }}>
          {[
            { n: items.length, l: "artículos" },
            { n: counts.arch, l: "arquitectura" },
            { n: counts.design, l: "diseño" },
            { n: counts.tech, l: "tech / AI" },
          ].map((s, i) => (
            <div key={i} style={{ background: "var(--color-background-secondary, #f5f5f5)", borderRadius: 8, padding: "0.75rem 1rem" }}>
              <div style={{ fontSize: 22, fontWeight: 500 }}>{s.n}</div>
              <div style={{ fontSize: 12, color: "var(--color-text-secondary, #666)", marginTop: 2 }}>{s.l}</div>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ fontSize: 13, color: "var(--color-text-danger, #c00)", background: "var(--color-background-danger, #fee)", borderRadius: 8, padding: "0.75rem 1rem", marginBottom: "1rem" }}>
          {error}
        </div>
      )}

      {/* Grid */}
      {!items.length && !loading ? (
        <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--color-text-secondary, #666)", fontSize: 14 }}>
          Presioná "Actualizar" para cargar las últimas noticias.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
          {visible.map((it, i) => (
            <div key={i} style={{
              background: "var(--color-background-primary, #fff)",
              border: "0.5px solid var(--color-border-tertiary, #e5e5e5)",
              borderRadius: 12, padding: "1rem 1.25rem",
              display: "flex", flexDirection: "column", gap: 8,
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{
                  fontSize: 11, padding: "2px 8px", borderRadius: 999, fontWeight: 500,
                  ...(BADGE_STYLES[it.cat] || BADGE_STYLES.tech),
                }}>
                  {CAT_LABELS[it.cat] || it.cat}
                </span>
                <span style={{ fontSize: 11, color: "var(--color-text-tertiary, #999)" }}>{fmtDate(it.pubDate)}</span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.4 }}>{it.title}</div>
              <div style={{ fontSize: 13, color: "var(--color-text-secondary, #666)", lineHeight: 1.5, flexGrow: 1 }}>{it.desc}</div>
              <div style={{ fontSize: 11, color: "var(--color-text-tertiary, #999)" }}>{it.source}</div>
              <a href={it.link} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: "var(--color-text-info, #185FA5)", textDecoration: "none", marginTop: "auto" }}>
                Leer artículo →
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
