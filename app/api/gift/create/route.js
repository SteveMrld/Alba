import { NextResponse } from "next/server";

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY;
const APP_URL       = process.env.NEXT_PUBLIC_APP_URL || "https://alba-gamma.vercel.app";
const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://yuwqokjkpooozgtsvfkc.supabase.co";
const SUPABASE_KEY  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const GIFT_PRICES = {
  "1month": process.env.STRIPE_GIFT_1M_PRICE_ID,
  "1year":  process.env.STRIPE_GIFT_1Y_PRICE_ID,
};

const GIFT_DURATIONS = {
  "1month": 31,
  "1year":  366,
};

export async function POST(req) {
  try {
    const { duration, senderEmail, recipientName, message } = await req.json();

    if (!GIFT_PRICES[duration]) {
      return NextResponse.json({ error: "Durée invalide" }, { status: 400 });
    }

    // Code unique lisible
    const part = () => Math.random().toString(36).substring(2, 6).toUpperCase();
    const code = `ALBA-${part()}-${part()}`;

    // Session Stripe one-time payment
    const params = new URLSearchParams({
      "mode": "payment",
      "payment_method_types[0]": "card",
      "line_items[0][price]": GIFT_PRICES[duration],
      "line_items[0][quantity]": "1",
      "success_url": `${APP_URL}?gift_success=1&code=${code}&recipient=${encodeURIComponent(recipientName || "")}`,
      "cancel_url": `${APP_URL}?gift_cancelled=1`,
      "customer_email": senderEmail || "",
      "metadata[gift_code]": code,
      "metadata[duration]": duration,
      "metadata[recipient_name]": recipientName || "",
      "metadata[gift_message]": message || "",
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

    // Pré-enregistrer le code (status pending — validé par webhook)
    await fetch(`${SUPABASE_URL}/rest/v1/alba_gift_codes`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        code,
        duration_days: GIFT_DURATIONS[duration],
        duration_label: duration,
        status: "pending",
        sender_email: senderEmail || null,
        recipient_name: recipientName || null,
        gift_message: message || null,
        created_at: new Date().toISOString(),
      }),
    });

    return NextResponse.json({ url: session.url, code });
  } catch (err) {
    console.error("Gift create error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
