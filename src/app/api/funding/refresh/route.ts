import { synchronizeFundingProviders } from "@/features/funding/sync";

export const maxDuration = 300;

export async function GET(request: Request) {
  const token = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET?.trim();

  if (!secret) return Response.json({ message: "Funding-Cron ist nicht konfiguriert." }, { status: 503 });
  const normalized = token?.replace(/^Bearer\s+/i, "")?.trim();
  if (!normalized || normalized !== secret) {
    return Response.json({ message: "Nicht autorisiert." }, { status: 401 });
  }

  try {
    const result = await synchronizeFundingProviders();
    console.info("funding.refresh", JSON.stringify(result));
    return Response.json({ ...result, updatedAt: new Date().toISOString() }, { status: result.ok ? 200 : 502 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Funding-Refresh fehlgeschlagen.";
    console.error("funding.refresh.failed", message);
    return Response.json({ ok: false, message }, { status: 503 });
  }
}

