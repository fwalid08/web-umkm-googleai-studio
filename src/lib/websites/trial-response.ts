import { NextResponse } from "next/server";
import { trialBlockMessage } from "./limits";

/**
 * Blokir trial expired → 402 + upgrade_url (satu sumber kebenaran pesan di limits.ts).
 * Dipakai: PUT /api/user/website (reason 'edit'), POST /api/websites (reason 'create').
 */
export function trialBlockResponse(reason: "edit" | "create") {
  return NextResponse.json(
    {
      success: false,
      error: trialBlockMessage(reason),
      upgrade_url: "/dashboard/settings/billing",
    },
    { status: 402 }
  );
}
