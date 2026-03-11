import { NextResponse } from "next/server";

const SUPABASE_URL = "https://yuwqokjkpooozgtsvfkc.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1d3Fva2prcG9vb3pndHN2ZmtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5Njk4MjIsImV4cCI6MjA4ODU0NTgyMn0.5IHYvE6lnwl-PTAhcpT9c2lkhlxSu6w9rGksfCEfCPc";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const userKey = searchParams.get("user_key");

  if (!userKey) return NextResponse.json({ premium: false });

  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/alba_subscriptions?user_key=eq.${encodeURIComponent(userKey)}&limit=1`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
    );
    const rows = await r.json();
    const premium = rows?.[0]?.status === "active";
    return NextResponse.json({ premium });
  } catch {
    return NextResponse.json({ premium: false });
  }
}
