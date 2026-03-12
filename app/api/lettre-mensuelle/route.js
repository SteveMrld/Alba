export const maxDuration = 30;

const SB_URL = "https://yuwqokjkpooozgtsvfkc.supabase.co";
const SB_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1d3Fva2prcG9vb3pndHN2ZmtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5Njk4MjIsImV4cCI6MjA4ODU0NTgyMn0.5IHYvE6lnwl-PTAhcpT9c2lkhlxSu6w9rGksfCEfCPc";
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

const sb = async (path, opts = {}) => {
  const method = opts.method || "GET";
  const res = await fetch(`${SB_URL}/rest/v1/${path}`, {
    method,
    headers: {
      "apikey": SB_ANON,
      "Authorization": `Bearer ${SB_ANON}`,
      "Content-Type": "application/json",
      "Prefer": opts.prefer || "return=representation",
    },
    ...(opts.body ? { body: opts.body } : {}),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`SB ${method} ${path}: ${txt}`);
  }
  return res.json().catch(() => null);
};

export async function POST(req) {
  try {
    const { searchParams } = new URL(req.url);
    const uk = searchParams.get("user_key");
    if (!uk) return Response.json({ error: "user_key requis" }, { status: 400 });
    if (!ANTHROPIC_KEY) return Response.json({ error: "ANTHROPIC_API_KEY manquante" }, { status: 500 });

    const mois = new Date().toISOString().slice(0, 7);
    const nomMois = new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

    // Déjà générée ce mois ?
    const existante = await sb(`alba_lettres_mensuelles?user_key=eq.${encodeURIComponent(uk)}&mois=eq.${mois}&select=id`).catch(() => []);
    if (existante?.length > 0) return Response.json({ ok: true, status: "already_done" });

    const debutMois = `${mois}-01T00:00:00Z`;

    const [profils, postits, cairn] = await Promise.allSettled([
      sb(`alba_profiles?user_key=eq.${encodeURIComponent(uk)}&select=prenom,intention,intention_secondaire,sensibilite,cle_active&limit=1`),
      sb(`alba_postits?user_key=eq.${encodeURIComponent(uk)}&created_at=gte.${debutMois}&select=texte&order=created_at.desc&limit=20`),
      sb(`alba_cairn?user_key=eq.${encodeURIComponent(uk)}&created_at=gte.${debutMois}&select=etat&order=created_at.desc&limit=30`),
    ]);

    const p = profils.value?.[0] || {};
    const prenom = p.prenom || "toi";
    const intention = p.intention || "";
    const intentionSecondaire = p.intention_secondaire || "";
    const sensibilite = p.sensibilite || "";
    const cleActive = p.cle_active || 1;
    const NOMS_PORTES = ["","Reconnaître","Comprendre","Ressentir","Lâcher","Recevoir","Devenir","Créer","Relier","Protéger","Transmettre","Habiter","Être"];
    const nomPorte = NOMS_PORTES[Math.min(cleActive, 12)] || "Reconnaître";
    const contexteIntention = intention && intentionSecondaire ? `${intention} — et simultanément : ${intentionSecondaire}` : intention || "non précisée";
    const fragments = (postits.value || []).map(x => x.texte).filter(Boolean).slice(0, 8).join("\n—\n");
    const etats = (cairn.value || []).map(x => x.etat).filter(Boolean);
    const etatsFreq = etats.reduce((acc, e) => { acc[e] = (acc[e]||0)+1; return acc; }, {});
    const etatsTexte = Object.entries(etatsFreq).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([e,n])=>`${e} (${n} fois)`).join(", ");

    const prompt = `Tu es ALBA — une présence douce, profonde, qui a accompagné ${prenom} tout au long de ce mois de ${nomMois}. Tu lui écris une lettre mensuelle personnelle et intime.

DONNÉES DU MOIS :
- Prénom : ${prenom}
- Intention portée : ${contexteIntention}
- Sensibilité dominante : ${sensibilite || "non précisée"}
- Porte traversée : Porte ${cleActive} — ${nomPorte}
- États intérieurs déposés dans le Cairn : ${etatsTexte || "peu de données ce mois"}
- Fragments écrits sur l'Ardoise :
${fragments || "(aucun fragment ce mois — respecte ce silence dans ta lettre)"}

CONSIGNES ABSOLUES :
- C'est une lettre, pas un rapport. Pas de bullet points, pas de titres, pas d'analyse.
- Tu t'adresses à ${prenom} avec "tu" — proche, jamais condescendant.
- Style : sobre, poétique, incarné. Phrases courtes. Respirations. Jamais de clichés motivationnels.
- 280 à 340 mots exactement.
- Commence par "${prenom}," sur une ligne seule.
- Termine par une invitation pour le mois qui vient — une phrase ouverte, pas un objectif.
- Écris directement la lettre. Rien avant, rien après.`;

    const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": ANTHROPIC_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 700, messages: [{ role: "user", content: prompt }] }),
    });

    if (!aiRes.ok) {
      const errTxt = await aiRes.text();
      console.error("Anthropic error:", errTxt);
      return Response.json({ error: "Génération échouée", detail: errTxt }, { status: 500 });
    }

    const ai = await aiRes.json();
    const contenu = ai.content?.[0]?.text || "";
    if (!contenu) return Response.json({ error: "Contenu vide" }, { status: 500 });

    await sb("alba_lettres_mensuelles", {
      method: "POST",
      prefer: "resolution=merge-duplicates",
      body: JSON.stringify({ user_key: uk, mois, contenu, lue: false }),
    });

    return Response.json({ ok: true, status: "generated" });
  } catch (err) {
    console.error("lettre POST error:", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userKey = searchParams.get("user_key");
    const mois = searchParams.get("mois") || new Date().toISOString().slice(0, 7);
    if (!userKey) return Response.json({ lettre: null });

    const data = await sb(`alba_lettres_mensuelles?user_key=eq.${encodeURIComponent(userKey)}&mois=eq.${mois}&select=*`).catch(() => []);
    const lettre = data?.[0] || null;

    if (lettre && !lettre.lue) {
      sb(`alba_lettres_mensuelles?id=eq.${lettre.id}`, {
        method: "PATCH", prefer: "return=minimal",
        body: JSON.stringify({ lue: true }),
      }).catch(() => {});
    }
    return Response.json({ lettre });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
