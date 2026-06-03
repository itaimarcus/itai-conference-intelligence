import { NextResponse } from "next/server";
import { Lead } from "@/lib/clientStore";
import { syncLeadsToHubSpot } from "@/lib/hubspotSync";

export async function POST(request: Request) {
  const token =
    request.headers.get("x-hubspot-token")?.trim() ||
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();

  if (!token) {
    return NextResponse.json(
      { error: "HubSpot token missing. Add it in Settings." },
      { status: 401 },
    );
  }

  let leads: Lead[];
  try {
    const body = (await request.json()) as { leads?: Lead[] };
    if (!Array.isArray(body.leads)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    leads = body.leads;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const result = await syncLeadsToHubSpot(token, leads);
    if (result.errors.length > 0 && result.synced === 0) {
      return NextResponse.json(result, { status: 502 });
    }
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "HubSpot sync failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
