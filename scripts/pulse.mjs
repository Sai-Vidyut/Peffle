#!/usr/bin/env node
const [npm, gh] = await Promise.all([
  fetch("https://api.npmjs.org/downloads/point/last-week/peffle").then((r) => r.json()),
  fetch("https://api.github.com/repos/Sai-Vidyut/Peffle", {
    headers: { "User-Agent": "peffle-pulse" },
  }).then((r) => r.json()),
]);

console.log({
  npm_last_week: npm.downloads ?? 0,
  stars: gh.stargazers_count ?? 0,
  forks: gh.forks_count ?? 0,
  open_issues: gh.open_issues_count ?? 0,
  watchers: gh.subscribers_count ?? 0,
});
