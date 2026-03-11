import { NextResponse } from "next/server";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const userKey = searchParams.get("user_key");

  if (!userKey) return NextResponse.json({ premium: false, step: "no_key" });

  // Vérifier dans alba_profiles directement (colonne is_premium)
  const SUPABASE_URL = "https://yuwqokjkpooozgtsvfkc.supabase.co";
  const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1d3Fva2prcG9vb3pndHN2ZmtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5Njk4MjIsImV4cCI6MjA4ODU0NTgyMn0.5IHYvE6lnwl-PTAhcpT9c2lkhlxSu6w9rGksfCEfCPc";

  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/alba_profiles?user_key=eq.${userKey}&select=is_premium&limit=1`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
    );
    const text = await r.text();
    const premium = text.includes('"is_premium":true') || text.includes('"is_premium": true');
    return NextResponse.json({ premium, raw: text, status: r.status });
  } catch (e) {
    return NextResponse.json({ premium: false, error: e.message });
  }
}
