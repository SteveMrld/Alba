export const maxDuration = 15;

export async function POST(req) {
  const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
  
  if (!ANTHROPIC_KEY) {
    console.error("ANTHROPIC_API_KEY manquante");
    return Response.json({ error: "clé manquante" }, { status: 500 });
  }

  let body;
  try { body = await req.json(); } catch(e) {
    return Response.json({ error: "body invalide: " + e.message }, { status: 400 });
  }

  const { system, messages, max_tokens = 150 } = body;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens,
        system,
        messages,
      }),
    });

    const text = await res.text();
    console.log("Anthropic status:", res.status, "body:", text.slice(0, 200));
    
    if (!res.ok) {
      return Response.json({ error: text }, { status: res.status });
    }

    return Response.json(JSON.parse(text));
  } catch(err) {
    console.error("Fetch error:", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
