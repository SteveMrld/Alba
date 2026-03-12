const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://yuwqokjkpooozgtsvfkc.supabase.co";
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

const sbFetch = async (path, opts = {}) => {
  const key = opts.service ? SUPABASE_SERVICE : SUPABASE_ANON;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...opts,
    headers: {
      "apikey": key,
      "Authorization": `Bearer ${key}`,
      "Content-Type": "application/json",
      "Prefer": opts.prefer || "return=representation",
      ...(opts.headers || {}),
    },
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Supabase ${path}: ${txt}`);
  }
  return res.json().catch(() => null);
};

// POST — génère les lettres (cron ou test)
export async function POST(req) {
  try {
    const { searchParams } = new URL(req.url);
    const targetUserKey = searchParams.get("user_key") || null;
    const mois = new Date().toISOString().slice(0, 7);
    const nomMois = new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

    // BETA: générer pour l'utilisateur directement sans vérifier l'abonnement
    const subs = targetUserKey
      ? [{ user_key: targetUserKey }]
      : await sbFetch(`alba_subscriptions?status=eq.active&select=user_key`, { service: true });

    const resultats = [];

    for (const sub of subs || []) {
      const uk = sub.user_key;

      // Déjà générée ce mois ?
      const existante = await sbFetch(
        `alba_lettres_mensuelles?user_key=eq.${encodeURIComponent(uk)}&mois=eq.${mois}&select=id`,
        { service: true }
      ).catch(() => []);
      if (existante?.length > 0) { resultats.push({ uk, status: "already_done" }); continue; }

      const debutMois = `${mois}-01T00:00:00Z`;

      // Données parallèles
      const [profils, postits, cairn, progress] = await Promise.allSettled([
        sbFetch(`alba_profiles?user_key=eq.${encodeURIComponent(uk)}&select=prenom,intention,intention_secondaire,sensibilite,cle_active,naissance`, { service: true }),
        sbFetch(`alba_postits?user_key=eq.${encodeURIComponent(uk)}&created_at=gte.${debutMois}&select=texte,created_at&order=created_at.desc&limit=20`, { service: true }),
        sbFetch(`alba_cairn?user_key=eq.${encodeURIComponent(uk)}&created_at=gte.${debutMois}&select=etat&order=created_at.desc&limit=30`, { service: true }),
        sbFetch(`alba_progress?user_key=eq.${encodeURIComponent(uk)}&select=cle_active`, { service: true }),
      ]);

      const p = profils.value?.[0] || {};
      const prenom = p.prenom || "toi";
      const intention = p.intention || "";
      const intentionSecondaire = p.intention_secondaire || "";
      const sensibilite = p.sensibilite || "";
      const cleActive = progress.value?.[0]?.cle_active || p.cle_active || 1;

      const NOMS_PORTES = ["","Reconnaître","Comprendre","Ressentir","Lâcher","Recevoir","Devenir","Créer","Relier","Protéger","Transmettre","Habiter","Être"];
      const nomPorte = NOMS_PORTES[Math.min(cleActive, 12)] || "Reconnaître";

      // Contexte double intention
      let contexteIntention;
      if (intention && intentionSecondaire) {
        contexteIntention = `${intention} — et simultanément : ${intentionSecondaire}`;
      } else {
        contexteIntention = intention || "non précisée";
      }

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
- Tu écris à la première personne (ALBA qui parle à ${prenom}).
- Tu t'adresses à ${prenom} avec "tu" — proche, jamais condescendant.
- Tu t'appuies sur ce que tu as perçu — les mots des fragments, les états — mais tu ne les répètes pas verbatim. Tu en fais des images, des intuitions.
- Ton style : sobre, poétique, incarné. Phrases courtes. Respirations. Jamais de clichés motivationnels. Jamais de "tu es fort(e)", "tu as réussi", "bravo".
- 280 à 340 mots exactement. Pas plus.
- Commence par "${prenom}," sur une ligne seule.
- Termine par une simple invitation pour le mois qui vient — une phrase ouverte, pas un objectif.
- Écris directement la lettre. Rien avant, rien après.`;

      const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": ANTHROPIC_KEY,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 700,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (!aiRes.ok) { resultats.push({ uk, status: "api_error" }); continue; }
      const ai = await aiRes.json();
      const contenu = ai.content?.[0]?.text || "";

      await sbFetch("alba_lettres_mensuelles", {
        method: "POST",
        service: true,
        body: JSON.stringify({ user_key: uk, mois, contenu, lue: false, created_at: new Date().toISOString() }),
      });

      resultats.push({ uk, status: "generated", words: contenu.split(" ").length });
    }

    return Response.json({ ok: true, mois, resultats });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// GET — récupérer la lettre du mois pour l'utilisateur connecté
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userKey = searchParams.get("user_key");
    const mois = searchParams.get("mois") || new Date().toISOString().slice(0, 7);

    if (!userKey) return Response.json({ lettre: null });

    const data = await sbFetch(
      `alba_lettres_mensuelles?user_key=eq.${encodeURIComponent(userKey)}&mois=eq.${mois}&select=*`,
      { service: true }
    ).catch(() => []);

    const lettre = data?.[0] || null;

    // Marquer comme lue
    if (lettre && !lettre.lue) {
      sbFetch(`alba_lettres_mensuelles?id=eq.${lettre.id}`, {
        method: "PATCH",
        service: true,
        body: JSON.stringify({ lue: true }),
        prefer: "return=minimal",
      }).catch(() => {});
    }

    return Response.json({ lettre });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
