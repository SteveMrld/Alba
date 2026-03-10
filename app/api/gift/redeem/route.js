import { NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://yuwqokjkpooozgtsvfkc.supabase.co";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function POST(req) {
  try {
    const { code, userKey } = await req.json();

    if (!code || !userKey) {
      return NextResponse.json({ error: "Code ou utilisateur manquant" }, { status: 400 });
    }

    const cleanCode = code.trim().toUpperCase();

    // Chercher le code
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/alba_gift_codes?code=eq.${cleanCode}&limit=1`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
    );
    const rows = await r.json();

    if (!rows?.length) {
      return NextResponse.json({ error: "Code introuvable" }, { status: 404 });
    }

    const gift = rows[0];

    if (gift.status === "used") {
      return NextResponse.json({ error: "Ce code a déjà été utilisé" }, { status: 400 });
    }

    if (gift.status === "pending") {
      return NextResponse.json({ error: "Ce code n'est pas encore activé" }, { status: 400 });
    }

    if (gift.status !== "active") {
      return NextResponse.json({ error: "Code invalide" }, { status: 400 });
    }

    // Calculer la date d'expiration
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (gift.duration_days || 31));

    // Marquer le code comme utilisé
    await fetch(`${SUPABASE_URL}/rest/v1/alba_gift_codes?code=eq.${cleanCode}`, {
      method: "PATCH",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        status: "used",
        used_by: userKey,
        used_at: new Date().toISOString(),
      }),
    });

    // Activer le premium dans alba_subscriptions
    await fetch(`${SUPABASE_URL}/rest/v1/alba_subscriptions`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates",
      },
      body: JSON.stringify({
        user_key: userKey,
        status: "active",
        gift_code: cleanCode,
        gift_expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      }),
    });

    return NextResponse.json({
      success: true,
      expiresAt: expiresAt.toISOString(),
      durationLabel: gift.duration_label,
      recipientName: gift.recipient_name,
    });
  } catch (err) {
    console.error("Gift redeem error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
