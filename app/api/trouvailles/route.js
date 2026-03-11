const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://yuwqokjkpooozgtsvfkc.supabase.co";
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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

// GET — récupérer les trouvailles approuvées (publiques)
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const categorie = searchParams.get("categorie");
    const limit = parseInt(searchParams.get("limit") || "50");

    let filter = `statut=eq.approuve&order=created_at.desc&limit=${limit}`;
    if (categorie && categorie !== "tout") {
      filter += `&categorie=eq.${encodeURIComponent(categorie)}`;
    }

    const rows = await sbFetch(`alba_trouvailles?${filter}&select=id,categorie,titre,pourquoi,created_at`, { service: true });

    // Calculer les "jours depuis" côté serveur
    const now = Date.now();
    const trouvailles = (rows || []).map(r => ({
      ...r,
      jours: Math.max(1, Math.round((now - new Date(r.created_at).getTime()) / 86400000)),
    }));

    return Response.json({ trouvailles });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// POST — déposer une nouvelle trouvaille (statut en_attente)
export async function POST(req) {
  try {
    const body = await req.json();
    const { categorie, titre, pourquoi, user_key } = body;

    if (!categorie || !titre || !pourquoi) {
      return Response.json({ error: "Champs manquants" }, { status: 400 });
    }
    if (titre.length > 120 || pourquoi.length > 400) {
      return Response.json({ error: "Contenu trop long" }, { status: 400 });
    }

    await sbFetch("alba_trouvailles", {
      method: "POST",
      service: true,
      body: JSON.stringify({
        user_key: user_key || null,
        categorie,
        titre: titre.trim(),
        pourquoi: pourquoi.trim(),
        statut: "en_attente",
        created_at: new Date().toISOString(),
      }),
    });

    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
