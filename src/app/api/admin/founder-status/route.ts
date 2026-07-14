import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/admin/founder-status
 * Grant founder status to a user
 *
 * Body: {
 *   "email": "founder@example.com",
 *   "name": "Founder Name"
 * }
 *
 * Requires ADMIN_SECRET_KEY in Authorization header
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    const expectedSecret = process.env.ADMIN_SECRET_KEY;

    if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid admin secret" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { email, name } = body;

    if (!email || !name) {
      return NextResponse.json(
        { error: "Missing required fields: email, name" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const result = await admin.rpc("grant_founder_status", {
      founder_email: email,
      founder_name: name,
    });

    if (result.error) {
      return NextResponse.json(
        { error: `Failed to grant founder status: ${result.error.message}` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: `Founder status granted to ${email}`,
        email,
        name,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error granting founder status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/founder-status
 * List all founders or check founder status
 *
 * Query params:
 * - userId: Check if specific user is founder
 *
 * Requires ADMIN_SECRET_KEY in Authorization header
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    const expectedSecret = process.env.ADMIN_SECRET_KEY;

    if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid admin secret" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    const admin = createAdminClient();

    if (userId) {
      const isFounder = await admin.rpc("is_founder", { user_id: userId });

      return NextResponse.json(
        {
          userId,
          isFounder: isFounder.data === true,
        },
        { status: 200 }
      );
    }

    // List all founders
    const { data: founders, error } = await admin
      .from("founder_users")
      .select("*")
      .order("verified_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: `Failed to list founders: ${error.message}` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        count: founders?.length || 0,
        founders: founders || [],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching founder status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/founder-status
 * Remove founder status from a user
 *
 * Body: {
 *   "userId": "user-uuid"
 * }
 *
 * Requires ADMIN_SECRET_KEY in Authorization header
 */
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    const expectedSecret = process.env.ADMIN_SECRET_KEY;

    if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid admin secret" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "Missing required field: userId" },
        { status: 400 }
      );
    }

    const { error } = await createAdminClient().rpc("revoke_founder_status", {
      target_user_id: userId,
    });

    if (error) {
      return NextResponse.json(
        { error: `Failed to remove founder status: ${error.message}` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Founder status removed",
        userId,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error removing founder status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
