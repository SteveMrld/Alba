export async function GET() {
  const key = process.env.ANTHROPIC_API_KEY;
  return Response.json({ 
    hasKey: !!key, 
    prefix: key ? key.slice(0, 14) + "..." : "absente"
  });
}
