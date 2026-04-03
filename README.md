# news-reader

News feed agregador de RSS para arquitectura, diseño, tech y AI.

## Stack
- React 18 + Vite
- [rss2json API](https://rss2json.com/) como proxy RSS → JSON (sin CORS)

## Desarrollo local

```bash
npm install
npm run dev
```

## Deploy (Vercel)

Push a `main` → Vercel despliega automáticamente.

## Notas

- El plan gratuito de rss2json permite 10.000 requests/día. Para mayor volumen, migrá a la Vercel Serverless Function (`/api/feed.js`).
