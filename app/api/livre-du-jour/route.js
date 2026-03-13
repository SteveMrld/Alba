import { CHAPITRES, THEMES_SEMAINES, TYPES_PAR_JOUR, PROMPTS } from "../../../lib/livre-alba";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

export async function GET() {
  const today = new Date().toISOString().split("T")[0];

  // Cache Supabase
  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/alba_livre_pages?date=eq.${today}&select=*&limit=1`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
    );
    if (r.ok) {
      const rows = await r.json();
      if (rows.length > 0) return Response.json(rows[0]);
    }
  } catch {}

  // Calcul du jour
  const now = new Date();
  const semaine = getWeekNumber(now);
  const jourSemaine = now.getDay();
  const mois = now.getMonth() + 1;

  const theme = THEMES_SEMAINES[(semaine - 1) % THEMES_SEMAINES.length];
  const type = TYPES_PAR_JOUR[jourSemaine];
  const chapitre = CHAPITRES.find(c => c.mois === mois) || CHAPITRES[0];
  const prompt = PROMPTS[type](theme, chapitre.titre);

  let contenu = "", titre_page = "";

  // Appel Anthropic via fetch direct
  try {
    const titreRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": ANTHROPIC_KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 30,
        messages: [{ role: "user", content: `Titre court (3-6 mots, sans ponctuation finale) pour une page sur "${theme}", type "${type}". Juste le titre.` }]
      })
    });
    const td = await titreRes.json();
    titre_page = td.content?.[0]?.text?.trim().replace(/["«»]/g, "") || theme;

    const contenuRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": ANTHROPIC_KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 400,
        system: "Tu écris pour un livre de bien-être intérieur. Style sobre, dense. Prose uniquement — jamais de tiret, de liste, de #, de ** ou de toute mise en forme markdown. Pas de sous-titres. Commence directement par le contenu. Voix directe, humaine, sans formule générique.",
        messages: [{ role: "user", content: prompt }]
      })
    });
    const cd = await contenuRes.json();
    contenu = cd.content?.[0]?.text?.trim() || "";
  } catch(e) {
    return Response.json({ error: e.message }, { status: 500 });
  }

  const page = { date: today, type, theme, titre_page, contenu, chapitre_num: chapitre.num, chapitre_titre: chapitre.titre, chapitre_couleur: chapitre.couleur };

  try {
    await fetch(`${SUPABASE_URL}/rest/v1/alba_livre_pages`, {
      method: "POST",
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify(page),
    });
  } catch {}

  return Response.json(page);
}

function getWeekNumber(d) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
}
