import { synchronizeFundingProviders } from "@/features/funding/sync";

export async function GET(request: Request) {
  const token = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || token !== `Bearer ${process.env.CRON_SECRET}`) return Response.json({ message: "Nicht autorisiert." }, { status: 401 });
  return Response.json({ ok: true, report: await synchronizeFundingProviders(), updatedAt: new Date().toISOString() });
}
