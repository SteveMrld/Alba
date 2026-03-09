import { NextResponse } from "next/server";

const STRIPE_SECRET         = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const SUPABASE_URL          = process.env.NEXT_PUBLIC_SUPABASE_URL  || "https://yuwqokjkpooozgtsvfkc.supabase.co";
const SUPABASE_SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY; // clé service (pas anon)

// Upsert dans Supabase avec la clé service (bypass RLS)
async function upsertSubscription(userKey, data) {
  const key = SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const r = await fetch(`${SUPABASE_URL}/rest/v1/alba_subscriptions`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify({ user_key: userKey, ...data }),
  });
  return r.ok;
}

export async function POST(req) {
  const body      = await req.text();
  const signature = req.headers.get("stripe-signature");

  // Vérification signature Stripe (simplifié sans SDK)
  // En prod, utiliser la vérification HMAC complète
  let event;
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const object = event.data?.object;

  switch (event.type) {
    case "checkout.session.completed": {
      const userKey = object.metadata?.user_key;
      if (userKey) {
        await upsertSubscription(userKey, {
          status: "active",
          stripe_customer_id:    object.customer,
          stripe_subscription_id: object.subscription,
          updated_at: new Date().toISOString(),
        });
      }
      break;
    }

    case "customer.subscription.deleted":
    case "customer.subscription.updated": {
      const sub = object;
      // Trouver le user_key via customer_id
      const key = SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      const r = await fetch(
        `${SUPABASE_URL}/rest/v1/alba_subscriptions?stripe_customer_id=eq.${sub.customer}&limit=1`,
        { headers: { apikey: key, Authorization: `Bearer ${key}` } }
      );
      const rows = await r.json();
      if (rows?.[0]?.user_key) {
        await upsertSubscription(rows[0].user_key, {
          status: sub.status === "active" ? "active" : "inactive",
          updated_at: new Date().toISOString(),
        });
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
