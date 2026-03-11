export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const userKey = searchParams.get("user_key") || "f47f319a-e4e8-42ed-8084-17370bb924b9";

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://yuwqokjkpooozgtsvfkc.supabase.co";
  const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

  const sbFetch = async (path, opts = {}) => {
    const key = opts.service ? SUPABASE_SERVICE : SUPABASE_ANON;
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      ...opts,
      headers: { "apikey": key, "Authorization": `Bearer ${key}`, "Content-Type": "application/json", "Prefer": "return=representation" },
    });
    return res.json().catch(() => null);
  };

  const mois = new Date().toISOString().slice(0, 7);
  const nomMois = new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  // Supprimer lettre existante pour forcer la regénération
  await fetch(`${SUPABASE_URL}/rest/v1/alba_lettres_mensuelles?user_key=eq.${encodeURIComponent(userKey)}&mois=eq.${mois}`, {
    method: "DELETE",
    headers: { "apikey": SUPABASE_SERVICE, "Authorization": `Bearer ${SUPABASE_SERVICE}` },
  });

  const profils = await sbFetch(`alba_profiles?user_key=eq.${encodeURIComponent(userKey)}&select=prenom,intention,intention_secondaire,sensibilite,naissance`, { service: true });
  const p = profils?.[0] || {};
  const prenom = p.prenom || "toi";
  const intention = p.intention || "";
  const intentionSecondaire = p.intention_secondaire || "";

  const contexteIntention = intention && intentionSecondaire
    ? `${intention} — et simultanément : ${intentionSecondaire}`
    : intention || "non précisée";

  const prompt = `Tu es ALBA — une présence douce et profonde. Tu écris une lettre mensuelle personnelle et intime à ${prenom} pour ${nomMois}.

Intention portée : ${contexteIntention}
Sensibilité : ${p.sensibilite || "intuitive"}

CONSIGNES :
- Lettre intime, pas un rapport. Pas de bullet points.
- Tu écris à la première personne (ALBA qui parle à ${prenom}).
- Tu t'adresses à ${prenom} avec "tu".
- Style sobre, poétique, incarné. Phrases courtes. Jamais de clichés motivationnels.
- 280 à 320 mots exactement.
- Commence par "${prenom}," sur une ligne seule.
- Termine par une invitation ouverte pour le mois qui vient.
- Écris directement la lettre.`;

  const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": ANTHROPIC_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 700, messages: [{ role: "user", content: prompt }] }),
  });

  const ai = await aiRes.json();
  const contenu = ai.content?.[0]?.text || "";

  await sbFetch("alba_lettres_mensuelles", {
    method: "POST",
    service: true,
    body: JSON.stringify({ user_key: userKey, mois, contenu, lue: false, created_at: new Date().toISOString() }),
  });

  return new Response(`
    <html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><style>
      body{background:#1A1714;color:#C8A96E;font-family:Georgia,serif;padding:2rem;max-width:600px;margin:0 auto;line-height:1.8}
      h2{color:#E8D5A0;margin-bottom:2rem;font-size:1rem;letter-spacing:0.3em;font-weight:300}
      pre{white-space:pre-wrap;color:#D4C4A0;font-family:Georgia,serif;font-size:1rem;line-height:1.9}
      .ok{color:#4A8A5A;font-size:0.8rem;margin-bottom:1rem}
    </style></head><body>
    <h2>✦ LETTRE MENSUELLE GÉNÉRÉE</h2>
    <div class="ok">✓ ${mois} · ${contenu.split(" ").length} mots · sauvegardée en base</div>
    <pre>${contenu}</pre>
    </body></html>
  `, { headers: { "Content-Type": "text/html" } });
}
