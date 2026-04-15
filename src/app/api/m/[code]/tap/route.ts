import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { tapArrival } from "@/lib/live-session";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "not_signed_in" }, { status: 401 });
  const { code } = await params;

  const result = await tapArrival(code.toUpperCase(), user.id);
  if ("error" in result) {
    const status = result.error === "not_found" ? 404 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }
  return NextResponse.json(result);
}
