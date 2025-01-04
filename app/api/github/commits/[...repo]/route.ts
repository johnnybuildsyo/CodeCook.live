import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

interface GitHubFile {
  filename: string;
  additions: number;
  deletions: number;
  patch?: string;
}

interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      date: string;
    };
  };
  files?: GitHubFile[];
}

export async function GET(
  request: NextRequest,
  context: { params: { repo: string[] } }
) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.provider_token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { repo } = context.params;
  const [owner, repository, action, ...rest] = repo;
  const fullName = `${owner}/${repository}`;
  const { searchParams } = new URL(request.url);

  if (!action) {
    // Default: Get a paginated list of commits
    const page = searchParams.get("page") || "1";
    const per_page = searchParams.get("per_page") || "30";

    const apiUrl = `https://api.github.com/repos/${fullName}/commits?page=${page}&per_page=${per_page}`;
    const response = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${session.provider_token}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch commits" }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  }

  if (action === "latest") {
    // Get the latest commit
    const response = await fetch(`https://api.github.com/repos/${fullName}/commits`, {
      headers: {
        Authorization: `Bearer ${session.provider_token}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch commits" }, { status: response.status });
    }

    const commits = (await response.json()) as GitHubCommit[];
    if (commits && commits.length > 0) {
      return NextResponse.json(commits[0]);
    }
    return NextResponse.json(null);
  }

  if (action === "diff") {
    // Get the diff for a specific commit
    const sha = rest[0];
    const response = await fetch(`https://api.github.com/repos/${fullName}/commits/${sha}`, {
      headers: {
        Authorization: `Bearer ${session.provider_token}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch commit" }, { status: response.status });
    }

    const commit = (await response.json()) as GitHubCommit;
    const files = commit.files || [];

    return NextResponse.json(
      files.map((file) => ({
        filename: file.filename,
        additions: file.additions,
        deletions: file.deletions,
        patch: file.patch,
      }))
    );
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
