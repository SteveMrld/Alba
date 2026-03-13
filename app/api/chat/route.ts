export const maxDuration = 15;

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

export async function POST(req: Request) {
  try {
    if (!ANTHROPIC_KEY) return Response.json({ error: "ANTHROPIC_API_KEY manquante" }, { status: 500 });

    const body = await req.json();
    const { system, messages, max_tokens = 150 } = body;

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-3-5-20241022",
        max_tokens,
        system,
        messages,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return Response.json({ error: err }, { status: res.status });
    }

    const data = await res.json();
    return Response.json(data);
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
