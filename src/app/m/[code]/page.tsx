import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getLiveSession } from "@/lib/live-session";
import { LiveSession } from "@/components/LiveSession";

export const dynamic = "force-dynamic";
export const metadata = { title: "Live session" };

export default async function LiveSessionPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const user = await getCurrentUser();
  const state = await getLiveSession(code.toUpperCase(), user?.id ?? null);
  if (!state) notFound();
  return <LiveSession initial={state} />;
}
