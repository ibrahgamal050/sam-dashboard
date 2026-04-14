import fs from "node:fs";
import path from "node:path";

const dashboardRoot = path.resolve(process.cwd());
const sourceRoot = path.join(dashboardRoot, "src");
const scriptsRoot = path.join(dashboardRoot, "scripts");
const allowedRoots = [sourceRoot, scriptsRoot];
const sourceExtensions = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".json"];
const ignoredDirs = new Set(["node_modules", ".next", ".turbo", ".git"]);

const importRegex =
  /\b(?:import|export)\s+(?:[^"'`]+?\s+from\s+)?["'`]([^"'`]+)["'`]|(?:import|require)\s*\(\s*["'`]([^"'`]+)["'`]\s*\)/g;

const allFiles = [];

function collectFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (ignoredDirs.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectFiles(fullPath);
      continue;
    }
    if (sourceExtensions.includes(path.extname(entry.name))) {
      allFiles.push(fullPath);
    }
  }
}

function resolveImport(fromFile, specifier) {
  if (specifier.startsWith("@/")) {
    return path.resolve(sourceRoot, specifier.slice(2));
  }
  if (specifier.startsWith(".")) {
    return path.resolve(path.dirname(fromFile), specifier);
  }
  if (specifier.startsWith("/") || specifier.startsWith("@meelza/") || specifier.startsWith("packages/")) {
    return specifier;
  }
  return null;
}

function resolveExistingPath(basePath) {
  const candidates = [
    basePath,
    ...sourceExtensions.map((ext) => `${basePath}${ext}`),
    ...sourceExtensions.map((ext) => path.join(basePath, `index${ext}`)),
  ];
  return candidates.find((candidate) => fs.existsSync(candidate)) ?? basePath;
}

function isAllowedPath(resolvedPath) {
  return allowedRoots.some((root) => resolvedPath === root || resolvedPath.startsWith(`${root}${path.sep}`));
}

collectFiles(sourceRoot);
collectFiles(scriptsRoot);

const violations = [];

for (const filePath of allFiles) {
  const content = fs.readFileSync(filePath, "utf8");
  for (const match of content.matchAll(importRegex)) {
    const specifier = match[1] ?? match[2];
    if (!specifier) continue;

    const resolvedBase = resolveImport(filePath, specifier);
    if (!resolvedBase) continue;

    if (specifier.startsWith("@meelza/") || specifier.startsWith("packages/")) {
      violations.push(`${path.relative(dashboardRoot, filePath)} -> ${specifier}`);
      continue;
    }

    if (specifier.startsWith("/") && !specifier.startsWith("@/")) {
      violations.push(`${path.relative(dashboardRoot, filePath)} -> ${specifier}`);
      continue;
    }

    const existingPath = resolveExistingPath(resolvedBase);
    if (!isAllowedPath(existingPath)) {
      violations.push(`${path.relative(dashboardRoot, filePath)} -> ${specifier}`);
    }
  }
}

if (violations.length > 0) {
  console.error("Found imports that escape apps/dashboard:");
  violations.forEach((violation) => console.error(`- ${violation}`));
  process.exit(1);
}

console.log("All local imports stay داخل apps/dashboard.");
