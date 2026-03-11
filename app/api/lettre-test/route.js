export async function GET(req) {
  const userKey = "f47f319a-e4e8-42ed-8084-17370bb924b9";
  const SUPABASE_URL = "https://yuwqokjkpooozgtsvfkc.supabase.co";
  const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1d3Fva2prcG9vb3pndHN2ZmtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5Njk4MjIsImV4cCI6MjA4ODU0NTgyMn0.5IHYvE6lnwl-PTAhcpT9c2lkhlxSu6w9rGksfCEfCPc";
  const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
  const mois = new Date().toISOString().slice(0, 7);
  const nomMois = new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  // Récupérer profil — sans sensibilite
  const r = await fetch(`${SUPABASE_URL}/rest/v1/alba_profiles?user_key=eq.${userKey}&select=prenom,intention,intention_secondaire`, {
    headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` },
  });
  const profils = await r.json();
  const p = profils?.[0] || {};
  const prenom = p.prenom || "toi";
  const intention = p.intention || "";
  const intentionSecondaire = p.intention_secondaire || "";
  const contexte = intention && intentionSecondaire ? `${intention} — et aussi : ${intentionSecondaire}` : intention || "non précisée";

  // Supprimer lettre existante
  await fetch(`${SUPABASE_URL}/rest/v1/alba_lettres_mensuelles?user_key=eq.${userKey}&mois=eq.${mois}`, {
    method: "DELETE",
    headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` },
  });

  // Générer
  const prompt = `Tu es ALBA — une présence douce et profonde. Tu écris une lettre mensuelle personnelle et intime à ${prenom} pour ${nomMois}.

Intention portée : ${contexte}

CONSIGNES ABSOLUES :
- Une lettre intime. Pas de bullet points, pas de titres.
- Tu parles à la première personne (ALBA qui s'adresse à ${prenom}).
- Tu tutoies ${prenom} — proche, jamais condescendant.
- Style sobre, poétique, incarné. Phrases courtes. Zéro cliché motivationnel.
- 280 à 320 mots.
- Commence par "${prenom}," sur une ligne seule.
- Termine par une invitation ouverte pour le mois qui vient.
- Écris directement la lettre. Rien avant, rien après.`;

  const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": ANTHROPIC_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 700, messages: [{ role: "user", content: prompt }] }),
  });
  const ai = await aiRes.json();
  const contenu = ai.content?.[0]?.text || `Erreur: ${JSON.stringify(ai)}`;

  // Sauvegarder
  await fetch(`${SUPABASE_URL}/rest/v1/alba_lettres_mensuelles`, {
    method: "POST",
    headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", "Prefer": "return=minimal" },
    body: JSON.stringify({ user_key: userKey, mois, contenu, lue: false, created_at: new Date().toISOString() }),
  });

  return new Response(`<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>
    body{background:#1A1714;color:#C8A96E;font-family:Georgia,serif;padding:2rem;max-width:600px;margin:0 auto;line-height:1.8}
    h2{color:#E8D5A0;font-size:0.75rem;letter-spacing:0.4em;font-weight:300;text-transform:uppercase;margin-bottom:0.5rem}
    .meta{color:#4A8A5A;font-size:0.72rem;margin-bottom:2rem;font-family:sans-serif}
    pre{white-space:pre-wrap;color:#D4C4A0;font-family:Georgia,serif;font-size:1rem;line-height:2}
  </style></head><body>
  <h2>✦ Lettre ALBA — ${nomMois}</h2>
  <div class="meta">profil: ${prenom} · ${contexte} · ${contenu.split(" ").length} mots</div>
  <pre>${contenu}</pre>
  </body></html>`, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
