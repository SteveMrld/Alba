import { NextResponse } from "next/server";

const SUPABASE_URL         = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://yuwqokjkpooozgtsvfkc.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY    = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const STRIPE_SECRET        = process.env.STRIPE_SECRET_KEY;
const SETUP_SECRET         = process.env.SETUP_SECRET || "alba-setup-2026";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get("secret") !== SETUP_SECRET) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const results = {};
  const key = SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY;

  // ── 1. Créer la table alba_subscriptions ──
  try {
    const sql = `
      create table if not exists alba_subscriptions (
        user_key text primary key,
        status text default 'inactive',
        stripe_customer_id text,
        stripe_subscription_id text,
        updated_at timestamptz default now()
      );
    `;
    const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: sql }),
    });
    // Essayer via pg directement
    results.supabase_table = r.ok ? "created" : `status ${r.status} — crée manuellement dans Supabase SQL Editor`;
  } catch (e) {
    results.supabase_table = `error: ${e.message}`;
  }

  // ── 2. Créer le produit Stripe si clé dispo ──
  if (STRIPE_SECRET) {
    try {
      // Créer le produit
      const prodParams = new URLSearchParams({
        name: "ALBA — Accès complet",
        description: "Le Miroir, les Lettres des Portes et les Lettres hebdomadaires.",
      });
      const prodR = await fetch("https://api.stripe.com/v1/products", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${STRIPE_SECRET}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: prodParams.toString(),
      });
      const prod = await prodR.json();
      results.stripe_product = prod.id || prod.error?.message;

      // Créer le price 9€/mois
      if (prod.id) {
        const priceParams = new URLSearchParams({
          product: prod.id,
          unit_amount: "900",
          currency: "eur",
          "recurring[interval]": "month",
        });
        const priceR = await fetch("https://api.stripe.com/v1/prices", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${STRIPE_SECRET}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: priceParams.toString(),
        });
        const price = await priceR.json();
        results.stripe_price_id = price.id || price.error?.message;
        results.stripe_note = `Ajoute STRIPE_PRICE_ID=${price.id} dans Vercel env vars`;
      }
    } catch (e) {
      results.stripe = `error: ${e.message}`;
    }
  } else {
    results.stripe = "STRIPE_SECRET_KEY manquant — ajoute-la dans Vercel";
  }

  return NextResponse.json({ ok: true, results }, { status: 200 });
}
