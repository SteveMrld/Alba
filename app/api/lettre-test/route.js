export async function GET(req) {
  const userKey = "f47f319a-e4e8-42ed-8084-17370bb924b9";
  const SUPABASE_URL = "https://yuwqokjkpooozgtsvfkc.supabase.co";
  const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1d3Fva2prcG9vb3pndHN2ZmtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5Njk4MjIsImV4cCI6MjA4ODU0NTgyMn0.5IHYvE6lnwl-PTAhcpT9c2lkhlxSu6w9rGksfCEfCPc";

  const r = await fetch(`${SUPABASE_URL}/rest/v1/alba_profiles?user_key=eq.${userKey}&select=prenom,intention,intention_secondaire,sensibilite`, {
    headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` },
  });
  const raw = await r.text();

  return new Response(`
    <html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>
      body{background:#1A1714;color:#C8A96E;font-family:monospace;padding:2rem;word-break:break-all}
      pre{color:#D4C4A0;white-space:pre-wrap;font-size:0.85rem}
    </style></head><body>
    <pre>STATUS: ${r.status}\nRESPONSE:\n${raw}</pre>
    </body></html>
  `, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
