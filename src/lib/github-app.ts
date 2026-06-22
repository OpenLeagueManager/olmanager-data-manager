import { createAppAuth } from "@octokit/auth-app";
import { Octokit } from "@octokit/rest";
import { cache } from "react";

const DATA_REPO = "OpenLeagueManager/olmanager-data";
const APP_REPO = "OpenLeagueManager/olmanager-data-manager";

function getAppCredentials() {
  const appId = process.env.GITHUB_APP_ID;
  const privateKey = process.env.GITHUB_APP_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!appId || !privateKey) {
    throw new Error("Missing GITHUB_APP_ID or GITHUB_APP_PRIVATE_KEY");
  }

  return { appId, privateKey };
}

/**
 * Get an authenticated Octokit instance for the GitHub App installation.
 * Uses React cache() for deduplication within a single request.
 */
export const getInstallationOctokit = cache(async (): Promise<Octokit> => {
  const { appId, privateKey } = getAppCredentials();

  const appOctokit = new Octokit({
    authStrategy: createAppAuth,
    auth: { appId, privateKey },
  });

  // Get the installation ID for the data repo
  const { data: installation } =
    await appOctokit.apps.getRepoInstallation({
      owner: DATA_REPO.split("/")[0],
      repo: DATA_REPO.split("/")[1],
    });

  // Create an installation-authenticated client
  return new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId,
      privateKey,
      installationId: installation.id,
    },
  });
});

/**
 * Create a GitHub Issue for a proposal.
 */
export async function createProposalIssue(params: {
  title: string;
  body: string;
  labels: string[];
  proposalType: string;
  author: string;
}): Promise<{ issueNumber: number; issueUrl: string }> {
  const octokit = await getInstallationOctokit();

  const { data: issue } = await octokit.issues.create({
    owner: APP_REPO.split("/")[0],
    repo: APP_REPO.split("/")[1],
    title: params.title,
    body: [
      params.body,
      "",
      `---`,
      `**Author**: ${params.author}`,
      `**Type**: ${params.proposalType}`,
    ].join("\n"),
    labels: ["proposal", params.proposalType, ...params.labels],
  });

  return {
    issueNumber: issue.number,
    issueUrl: issue.html_url,
  };
}

/**
 * Commit file changes directly to the data repo's main branch.
 */
export async function commitToDataRepo(params: {
  message: string;
  files: Array<{ path: string; content: string }>;
}): Promise<{ commitSha: string }> {
  const octokit = await getInstallationOctokit();
  const [owner, repo] = DATA_REPO.split("/");

  // Get the current main branch SHA
  const { data: ref } = await octokit.git.getRef({
    owner,
    repo,
    ref: "heads/main",
  });

  // Get the current tree
  const { data: baseCommit } = await octokit.git.getCommit({
    owner,
    repo,
    commit_sha: ref.object.sha,
  });

  // Create blobs for each file
  const treeItems = await Promise.all(
    params.files.map(async (file) => {
      const { data: blob } = await octokit.git.createBlob({
        owner,
        repo,
        content: file.content,
        encoding: "utf-8",
      });
      return {
        path: file.path,
        mode: "100644" as const,
        type: "blob" as const,
        sha: blob.sha,
      };
    }),
  );

  // Create a new tree
  const { data: tree } = await octokit.git.createTree({
    owner,
    repo,
    base_tree: baseCommit.tree.sha,
    tree: treeItems,
  });

  // Create a commit
  const { data: commit } = await octokit.git.createCommit({
    owner,
    repo,
    message: params.message,
    tree: tree.sha,
    parents: [ref.object.sha],
  });

  // Update main to point to the new commit
  await octokit.git.updateRef({
    owner,
    repo,
    ref: "heads/main",
    sha: commit.sha,
  });

  return { commitSha: commit.sha };
}

/**
 * List open proposal issues from the app repo.
 */
export async function listOpenProposals(params: {
  labels?: string[];
}): Promise<Array<{
  number: number;
  title: string;
  body: string;
  url: string;
  author: string;
  createdAt: string;
  labels: string[];
}>> {
  const octokit = await getInstallationOctokit();
  const [owner, repo] = APP_REPO.split("/");

  const { data: issues } = await octokit.issues.listForRepo({
    owner,
    repo,
    state: "open",
    labels: params.labels?.join(",") ?? "proposal",
    sort: "created",
    direction: "desc",
    per_page: 50,
  });

  // Filter out pull requests (GitHub API returns PRs in issues endpoint)
  return issues
    .filter((issue) => !issue.pull_request)
    .map((issue) => ({
      number: issue.number,
      title: issue.title,
      body: issue.body ?? "",
      url: issue.html_url,
      author: issue.user?.login ?? "unknown",
      createdAt: issue.created_at,
      labels: issue.labels.map((l) => (typeof l === "string" ? l : l.name ?? "")).filter(Boolean),
    }));
}

/**
 * Close an issue (mark proposal as approved/rejected).
 */
export async function closeProposalIssue(
  issueNumber: number,
  outcome: "approved" | "rejected",
  reviewer: string,
): Promise<void> {
  const octokit = await getInstallationOctokit();
  const [owner, repo] = APP_REPO.split("/");

  const label = outcome === "approved" ? "approved" : "rejected";

  await octokit.issues.update({
    owner,
    repo,
    issue_number: issueNumber,
    state: "closed",
    labels: ["proposal", label],
  });

  await octokit.issues.createComment({
    owner,
    repo,
    issue_number: issueNumber,
    body: `**${outcome === "approved" ? "Approved" : "Rejected"}** by ${reviewer}.`,
  });
}

export { DATA_REPO, APP_REPO };
