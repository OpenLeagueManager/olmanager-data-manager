import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { closeProposalIssue, commitToDataRepo } from "@/lib/github-app";
import { isMaintainer } from "@/lib/permissions";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isMaintainer(session)) {
    return NextResponse.json({ error: "Forbidden: maintainer only" }, { status: 403 });
  }

  const { id } = await params;
  const issueNumber = parseInt(id, 10);
  if (isNaN(issueNumber)) {
    return NextResponse.json({ error: "Invalid issue number" }, { status: 400 });
  }

  let body: { action: "approve" | "reject"; reviewer: string; files?: Array<{ path: string; content: string }> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.action || !["approve", "reject"].includes(body.action)) {
    return NextResponse.json({ error: "action must be 'approve' or 'reject'" }, { status: 400 });
  }

  try {
    const reviewer = body.reviewer || session.user.name || session.user.id;
    const outcome = body.action === "approve" ? "approved" : "rejected";

    await closeProposalIssue(issueNumber, outcome, reviewer);

    let commitSha: string | null = null;

    // On approve with files, commit directly to the data repo
    if (body.action === "approve" && body.files?.length) {
      const result = await commitToDataRepo({
        message: `Apply proposal #${issueNumber} (approved by ${reviewer})`,
        files: body.files,
      });
      commitSha = result.commitSha;
    }

    return NextResponse.json({
      ok: true,
      action: body.action,
      commitSha,
    });
  } catch (error) {
    console.error("Failed to process review:", error);
    return NextResponse.json(
      { error: "Failed to process review. Check GitHub App configuration." },
      { status: 500 },
    );
  }
}
