// app/api/health/route.ts
export async function GET() {
  return Response.json({ ok: true, uptime: process.uptime() }, { status: 200 });
}
