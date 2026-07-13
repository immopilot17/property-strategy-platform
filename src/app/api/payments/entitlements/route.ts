import { getAccountAccess } from "@/features/payments/server";

export async function GET() {
  const access = await getAccountAccess();
  return Response.json({
    tier: access.tier,
    signedIn: Boolean(access.user),
    tokenBalance: access.tokenBalance,
    tokensUsed: access.tokensUsed
  });
}
