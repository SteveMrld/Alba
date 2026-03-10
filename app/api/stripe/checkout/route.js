import { NextResponse } from "next/server";

const STRIPE_SECRET   = process.env.STRIPE_SECRET_KEY;
const PRICE_MONTHLY   = process.env.STRIPE_PRICE_ID;         // 9€/mois
const PRICE_ANNUAL    = process.env.STRIPE_ANNUAL_PRICE_ID;  // 79€/an
const APP_URL         = process.env.NEXT_PUBLIC_APP_URL || "https://alba-gamma.vercel.app";

export async function POST(req) {
  try {
    const { userKey, email, plan } = await req.json();
    const priceId = plan === "annual" ? PRICE_ANNUAL : PRICE_MONTHLY;

    if (!STRIPE_SECRET || !priceId) {
      return NextResponse.json({ error: "Stripe non configuré" }, { status: 500 });
    }

    const params = new URLSearchParams({
      "mode": "subscription",
      "payment_method_types[0]": "card",
      "line_items[0][price]": priceId,
      "line_items[0][quantity]": "1",
      "success_url": `${APP_URL}?session_id={CHECKOUT_SESSION_ID}&subscribed=1`,
      "cancel_url":  `${APP_URL}?cancelled=1`,
      "customer_email": email || "",
      "metadata[user_key]": userKey,
      "allow_promotion_codes": "true",
    });

    const r = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const session = await r.json();
    if (!r.ok) throw new Error(session.error?.message || "Stripe error");

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
