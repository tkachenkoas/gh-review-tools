import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const releaseTag = /^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const conventionalHeader = /^[a-z]+(?:\([^\r\n)]+\))?(!)?:\s+\S/i;

export function nextReleaseTag(previousTag, commitMessages) {
  const match = releaseTag.exec(previousTag);
  if (!match) throw new Error(`Invalid release tag: ${previousTag}`);

  let [major, minor, patch] = match.slice(1).map(Number);
  const headers = commitMessages.flatMap((message) => {
    const [subject, ...body] = message.trim().split(/\r?\n/);
    return /^Merge pull request #\d+ from /.test(subject)
      ? [body.find((line) => line.trim()) ?? ""]
      : [subject];
  });

  if (headers.some((header) => conventionalHeader.exec(header)?.[1]) ||
      commitMessages.some((message) => /^BREAKING[ -]CHANGE:[ \t]+\S/m.test(message))) {
    major += 1;
    minor = 0;
    patch = 0;
  } else if (headers.some((header) => /^feat(?:\([^\r\n)]+\))?:\s+\S/i.test(header))) {
    minor += 1;
    patch = 0;
  } else {
    patch += 1;
  }

  if ([major, minor, patch].some((part) => part > 65535)) {
    throw new Error("Chrome extension version components cannot exceed 65535");
  }
  return `v${major}.${minor}.${patch}`;
}

function git(...args) {
  return execFileSync("git", args, { encoding: "utf8" }).trim();
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  // Start counting automatic releases after the last merge before automation.
  const baseline = "db741b38ae94cb5c7e5d5fbd98b5e6a70aad2e77";
  const commits = git("rev-list", "--first-parent", "--reverse", `${baseline}..HEAD`);
  if (!commits) throw new Error("No commits to release after the automation baseline");

  let tag = "v1.1.0";
  for (const commit of commits.split("\n")) {
    const messages = git("log", "--format=%B%x00", `${commit}^1..${commit}`);
    tag = nextReleaseTag(tag, messages.split("\0"));
  }

  if (git("tag", "--list", tag) && git("rev-list", "-1", tag) !== git("rev-parse", "HEAD")) {
    throw new Error(`Release tag ${tag} already points to a different commit`);
  }

  process.stdout.write(`${tag}\n`);
}
