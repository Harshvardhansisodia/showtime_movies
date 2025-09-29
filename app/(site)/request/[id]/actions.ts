// app/(site)/request/[id]/actions.ts
"use server";

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE || "").replace(/\/+$/, "");

function buildUrl(path: string) {
  const p = path.startsWith("/") ? path : `/${path}`;
  return API_BASE ? `${API_BASE}${p}` : p;
}

// Probe catalog: try movies and series by id, returns boolean
export async function checkFeaturedOnServer(id: string): Promise<boolean> {
  const urls = [buildUrl(`/api/movies?id=${encodeURIComponent(id)}`), buildUrl(`/api/series?id=${encodeURIComponent(id)}`)];
  const results = await Promise.allSettled(
    urls.map((u) => fetch(u, { cache: "no-store", headers: { "accept": "application/json" } }))
  );
  for (const r of results) {
    if (r.status === "fulfilled" && r.value.ok) {
      const body = await r.value.json().catch(() => null);
      const exists =
        (body && typeof body === "object" && "id" in body && String(body.id) === String(id)) ||
        (Array.isArray(body) && body.some((x: any) => String(x?.id) === String(id))) ||
        (Array.isArray(body?.results) && body.results.some((x: any) => String(x?.id) === String(id)));
      if (exists) return true;
    }
  }
  return false;
}

// Send request (movie/series) by id+name+table
export async function sendRequestOnServer(payload: { type_id: string | number; name: string; type: "movies" | "series" }) {
  const res = await fetch(buildUrl("/api/request"), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Request failed (${res.status})`);
  }
  return true;
}
