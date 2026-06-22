import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createProposalIssue, listOpenProposals } from "@/lib/github-app";
import type { ProposalPayload } from "@/domain/proposals/types";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const proposals = await listOpenProposals({});
    return NextResponse.json({ ok: true, proposals });
  } catch (error) {
    console.error("Failed to list proposals:", error);
    return NextResponse.json(
      { error: "Failed to fetch proposals." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { payload: ProposalPayload; author: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { payload, author } = body;

  if (!payload?.type) {
    return NextResponse.json({ error: "Missing proposal payload" }, { status: 400 });
  }

  try {
    const result = await createProposalIssue({
      title: `[${payload.type}] ${author}'s proposal`,
      body: formatProposalBody(payload),
      labels: [],
      proposalType: payload.type,
      author: author || session.user.name || session.user.id,
    });

    return NextResponse.json({
      ok: true,
      issueNumber: result.issueNumber,
      issueUrl: result.issueUrl,
    });
  } catch (error) {
    console.error("Failed to create proposal issue:", error);
    return NextResponse.json(
      { error: "Failed to create proposal. Check GitHub App configuration." },
      { status: 500 },
    );
  }
}

function formatProposalBody(payload: ProposalPayload): string {
  const lines: string[] = [];

  lines.push(`## Proposal: ${payload.type}`);
  lines.push("");

  // Format payload fields as a table or list
  const entries = Object.entries(payload).filter(
    ([key]) => key !== "version" && key !== "type",
  );

  for (const [key, value] of entries) {
    if (typeof value === "object" && value !== null) {
      lines.push(`### ${key}`);
      for (const [subKey, subValue] of Object.entries(value as Record<string, unknown>)) {
        lines.push(`- **${subKey}**: ${JSON.stringify(subValue)}`);
      }
    } else {
      lines.push(`- **${key}**: ${value}`);
    }
  }

  return lines.join("\n");
}
