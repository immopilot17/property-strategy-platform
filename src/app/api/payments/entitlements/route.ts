import { getAccountAccess } from "@/features/payments/server";

export async function GET() {
  const access = await getAccountAccess();
  return Response.json({
    tier: access.tier,
    role: access.role,
    signedIn: Boolean(access.user),
    tokenBalance: access.tokenBalance,
    tokensUsed: access.tokensUsed,
    unlimited: access.unlimited
  });
}
