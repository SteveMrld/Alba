export async function GET() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return Response.json({ error: "pas de clé" });

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: 30,
        messages: [{ role: "user", content: "Dis juste: je fonctionne" }],
      }),
    });
    const text = await res.text();
    return Response.json({ status: res.status, body: text.slice(0, 300) });
  } catch(e) {
    return Response.json({ error: e.message });
  }
}
