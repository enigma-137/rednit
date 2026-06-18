"use client";

import { useEffect, useState } from "react";
import { GitBranch, Star, Terminal, Loader2 } from "lucide-react";

type GitHubStatsProps = {
  username: string;
};

type StatsData = {
  repos: number;
  stars: number;
  languages: string[];
};

export function GitHubStats({ username }: GitHubStatsProps) {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!username) {
      setLoading(false);
      return;
    }

    const cleanUsername = username.trim().toLowerCase();

    // 1. Check Session Cache
    const cacheKey = `github-stats-${cleanUsername}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      try {
        setStats(JSON.parse(cached));
        setLoading(false);
        return;
      } catch {
        // Continue to fetch if json parse fails
      }
    }

    // 2. Mock Fallbacks for sandbox developer profiles
    const mocks: Record<string, StatsData> = {
      "ada-l": { repos: 42, stars: 1337, languages: ["Rust", "C", "Compiler Design"] },
      "grace-h": { repos: 38, stars: 942, languages: ["COBOL", "Fortran", "Assembly"] },
      "linus-t": { repos: 154, stars: 234850, languages: ["C", "Git", "Assembly"] },
      "your-github": { repos: 18, stars: 54, languages: ["TypeScript", "React", "Next.js"] },
      "dev-mock": { repos: 14, stars: 32, languages: ["TypeScript", "Node.js", "Python"] },
      "me": { repos: 12, stars: 45, languages: ["TypeScript", "React", "PostgreSQL"] }
    };

    if (mocks[cleanUsername]) {
      const mockData = mocks[cleanUsername];
      setStats(mockData);
      sessionStorage.setItem(cacheKey, JSON.stringify(mockData));
      setLoading(false);
      return;
    }

    // 3. Live public GitHub API fetches
    async function fetchGitHubStats() {
      setLoading(true);
      setError(null);
      try {
        // Fetch User profile details (for public repos count)
        const userRes = await fetch(`https://api.github.com/users/${username}`);
        if (!userRes.ok) {
          if (userRes.status === 403) {
            throw new Error("Rate limit exceeded");
          }
          throw new Error("GitHub profile not found");
        }
        const userData = await userRes.json();
        const reposCount = userData.public_repos ?? 0;

        // Fetch User repos list (for stars sum & language extraction)
        const reposRes = await fetch(`https://api.github.com/users/${username}/repos?per_page=100`);
        if (!reposRes.ok) {
          throw new Error("GitHub repositories fetch failed");
        }
        const reposData = await reposRes.json();

        // Calculate stars & languages
        let starsCount = 0;
        const languageCounts: Record<string, number> = {};

        if (Array.isArray(reposData)) {
          reposData.forEach((repo: any) => {
            starsCount += repo.stargazers_count ?? 0;
            if (repo.language) {
              languageCounts[repo.language] = (languageCounts[repo.language] ?? 0) + 1;
            }
          });
        }

        // Sort languages by frequency
        const sortedLanguages = Object.entries(languageCounts)
          .sort((a, b) => b[1] - a[1])
          .map((entry) => entry[0])
          .slice(0, 3);

        const fetchedStats: StatsData = {
          repos: reposCount,
          stars: starsCount,
          languages: sortedLanguages.length > 0 ? sortedLanguages : ["Markdown"]
        };

        setStats(fetchedStats);
        sessionStorage.setItem(cacheKey, JSON.stringify(fetchedStats));
      } catch (err: any) {
        console.warn(`GitHub stats query failed for user ${username}:`, err.message);
        setError(err.message === "Rate limit exceeded" ? "Limit" : "Unavailable");
      } finally {
        setLoading(false);
      }
    }

    void fetchGitHubStats();
  }, [username]);

  if (loading) {
    return (
      <div className="border border-black bg-white p-3 font-mono text-[10px] text-gray-400 flex items-center justify-center gap-2">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>fetching GitHub metrics...</span>
      </div>
    );
  }

  // If error and no stats are cached, collapse gracefully without breaking the layout
  if (error && !stats) {
    return (
      <div className="border border-gray-200 bg-gray-50 p-2.5 font-mono text-[9px] text-gray-500 flex justify-between items-center">
        <span>GitHub stats offline ({error})</span>
        <a 
          href={`https://github.com/${username}`} 
          target="_blank" 
          rel="noreferrer"
          className="underline uppercase font-bold text-black"
        >
          View GitHub
        </a>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="border border-black bg-white p-3.5 font-mono text-[10px] text-black">
      <div className="flex items-center justify-between border-b border-black pb-1.5 mb-2.5">
        <span className="font-bold uppercase tracking-wider flex items-center gap-1.5">
          <Terminal className="h-3.5 w-3.5" strokeWidth={2} />
          GitHub Summary
        </span>
        <span className="text-[9px] text-gray-500 uppercase">Status: Live</span>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        <div className="flex items-center gap-1.5">
          <GitBranch className="h-3 w-3 text-black shrink-0" />
          <span>Repos: </span>
          <span className="font-bold">{stats.repos}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Star className="h-3 w-3 text-black shrink-0" />
          <span>Stars: </span>
          <span className="font-bold">{stats.stars.toLocaleString()}</span>
        </div>
        <div className="col-span-2 border-t border-gray-100 pt-1.5 flex flex-wrap items-center gap-1">
          <span className="text-gray-500 mr-1">Stack:</span>
          {stats.languages.map((lang) => (
            <span 
              key={lang} 
              className="border border-gray-200 bg-gray-50 px-1.5 py-0.5 rounded-sm font-bold text-[9px] text-black"
            >
              {lang}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
