// Checks paintings.json and art/ before a deploy. If anything is wrong, the deploy stops and
// the live site keeps showing the last good version. Errors are written for whoever is
// editing paintings.json on github.com, not for a programmer.
import { readFileSync, existsSync } from "node:fs";

const CATEGORIES = ["figure", "abstract"];
const STATUSES = ["available", "wip"];
const FIELDS = ["id", "title", "category", "medium", "tag", "status", "price", "image", "alt"];
const problems = [];

let list;
try {
  list = JSON.parse(readFileSync("paintings.json", "utf8"));
} catch (e) {
  console.error(
    "paintings.json could not be read. This is usually a missing comma between two { } blocks,\n" +
      "a comma after the last block, or a missing quote mark.\n\n" + e.message,
  );
  process.exit(1);
}

if (!Array.isArray(list)) problems.push("paintings.json must start with [ and end with ].");
else {
  if (list.length < 2) problems.push("The site needs at least 2 paintings (the first two show in the hero).");
  const seen = new Set();
  list.forEach((p, i) => {
    const name = `Painting #${i + 1}${p && p.title ? ` ("${p.title}")` : ""}`;
    for (const f of FIELDS) {
      if (typeof p?.[f] !== "string" || !p[f].trim()) problems.push(`${name}: "${f}" is missing or empty.`);
    }
    if (p?.id && !/^[a-z0-9-]+$/.test(p.id)) problems.push(`${name}: "id" can only use lowercase letters, numbers and dashes.`);
    if (p?.id && seen.has(p.id)) problems.push(`${name}: the id "${p.id}" is already used by another painting.`);
    if (p?.id) seen.add(p.id);
    if (p?.category && !CATEGORIES.includes(p.category)) problems.push(`${name}: "category" must be one of: ${CATEGORIES.join(", ")}.`);
    if (p?.status && !STATUSES.includes(p.status)) problems.push(`${name}: "status" must be one of: ${STATUSES.join(", ")}.`);
    if (p?.image && !existsSync(`art/${p.image}`)) problems.push(`${name}: there is no file called "${p.image}" in the art folder (names are case-sensitive).`);
  });
}

if (problems.length) {
  console.error("paintings.json has problems, so the site was not updated:\n\n- " + problems.join("\n- "));
  process.exit(1);
}
console.log(`paintings.json looks good: ${list.length} paintings.`);
