import { synchronizeFundingProviders } from "@/features/funding/sync";

export async function GET(request: Request) {
  const token = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;

  if (secret) {
    const normalized = token?.replace(/^Bearer\s+/i, "")?.trim();
    if (!normalized || normalized !== secret) {
      return Response.json({ message: "Nicht autorisiert." }, { status: 401 });
    }
  }

  return Response.json({ ok: true, report: await synchronizeFundingProviders(), updatedAt: new Date().toISOString() });
}

