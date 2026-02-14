/**
 * Génère progress_summary.txt pour alimenter l'issue "Avancement en temps réel".
 * - Aucune dépendance externe (Node 20+)
 * - Utilise l'API GitHub via fetch
 *
 * Vars:
 *  - GITHUB_REPOSITORY (auto dans Actions) ex: owner/repo
 *  - GH_TOKEN ou GITHUB_TOKEN (dans Actions: secrets.GITHUB_TOKEN)
 */

const fs = require("fs");

function mustEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

const repoFull = process.env.GITHUB_REPOSITORY || mustEnv("REPO_FULL_NAME");
const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
if (!token) throw new Error("Missing token: set GH_TOKEN or GITHUB_TOKEN");

const [owner, repo] = repoFull.split("/");
const apiBase = "https://api.github.com";

async function gh(path) {
  const res = await fetch(`${apiBase}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      Accept: "application/vnd.github+json",
      "User-Agent": "opennova-realtime-progress-bot",
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub API error ${res.status} on ${path}: ${body}`);
  }
  return res.json();
}

function fmtUtcNow() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} UTC`;
}

function mdLink(text, url) {
  return `[${text}](${url})`;
}

(async () => {
  // Data
  const commits = await gh(`/repos/${owner}/${repo}/commits?per_page=10`);
  const pulls = await gh(`/repos/${owner}/${repo}/pulls?state=open&per_page=10&sort=updated&direction=desc`);
  const issuesAll = await gh(`/repos/${owner}/${repo}/issues?state=open&per_page=30&sort=updated&direction=desc`);

  // Filter out PRs from issues endpoint
  const issues = issuesAll.filter((x) => !x.pull_request);

  const repoUrl = `https://github.com/${owner}/${repo}`;
  const pullsUrl = `${repoUrl}/pulls`;
  const issuesUrl = `${repoUrl}/issues`;

  const lines = [];

  // Marker for "find-comment"
  lines.push("<!-- OPENNOVA_REALTIME_PROGRESS -->");
  lines.push(`# OpenNova-Finance — Avancement en temps réel`);
  lines.push("");
  lines.push(`**Dernière mise à jour:** ${fmtUtcNow()}`);
  lines.push(`**Repo:** ${mdLink(`${owner}/${repo}`, repoUrl)}`);
  lines.push("");

  lines.push("## Résumé");
  lines.push(`- **PRs ouvertes:** ${pulls.length} (${mdLink("voir", pullsUrl)})`);
  lines.push(`- **Issues ouvertes (hors PR):** ${issues.length} (${mdLink("voir", issuesUrl)})`);
  lines.push(`- **Derniers commits (top 10):** ${commits.length}`);
  lines.push("");

  if (pulls.length) {
    lines.push("## PRs ouvertes (triées par update)");
    for (const pr of pulls.slice(0, 10)) {
      lines.push(
        `- ${mdLink(`#${pr.number}`, pr.html_url)} — **${pr.title}** (par @${pr.user?.login ?? "?"}) — updated: ${new Date(pr.updated_at).toISOString()}`
      );
    }
    lines.push("");
  } else {
    lines.push("## PRs ouvertes");
    lines.push("- (aucune)");
    lines.push("");
  }

  if (issues.length) {
    lines.push("## Issues ouvertes (hors PR, triées par update)");
    for (const it of issues.slice(0, 10)) {
      lines.push(
        `- ${mdLink(`#${it.number}`, it.html_url)} — **${it.title}** (par @${it.user?.login ?? "?"}) — updated: ${new Date(it.updated_at).toISOString()}`
      );
    }
    lines.push("");
  } else {
    lines.push("## Issues ouvertes (hors PR)");
    lines.push("- (aucune)");
    lines.push("");
  }

  if (commits.length) {
    lines.push("## Derniers commits");
    for (const c of commits.slice(0, 10)) {
      const sha = c.sha.slice(0, 7);
      const msg = (c.commit?.message || "").split("\n")[0].slice(0, 120);
      lines.push(`- ${mdLink(sha, c.html_url)} — ${msg}`);
    }
    lines.push("");
  }

  lines.push("## Prochaines étapes (manuel)");
  lines.push("- Mets à jour cette section dans l’issue #47 si tu veux une feuille de route “humain readable”.");
  lines.push("- Utilise les commentaires de PR comme canal principal pour le détail technique.");
  lines.push("");

  fs.writeFileSync("progress_summary.txt", lines.join("\n"), "utf8");
  console.log("Generated progress_summary.txt");
})();
