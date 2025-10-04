import { promises as fs } from "node:fs"
import path from "node:path"

const ROOT = path.resolve(".tests-dist", "src")

async function main() {
  try {
    await processDir(ROOT)
  } catch (error) {
    console.error("Failed to rewrite test paths", error)
    process.exitCode = 1
  }
}

async function processDir(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      await processDir(fullPath)
      continue
    }
    if (entry.isFile() && entry.name.endsWith(".js")) {
      await rewriteFile(fullPath)
    }
  }
}

async function rewriteFile(filePath) {
  const pattern = /((?:from|import)\s*\(?")@\/([^"]+)("\)?)/g
  const contents = await fs.readFile(filePath, "utf8")
  if (!pattern.test(contents)) {
    return
  }
  pattern.lastIndex = 0
  const updated = contents.replace(pattern, (_match, prefix, specifier, suffix) => {
    const absoluteTarget = path.join(ROOT, `${specifier}.js`)
    const relative = path.relative(path.dirname(filePath), absoluteTarget)
    const normalized = relative.split(path.sep).join("/")
    return `${prefix}${normalized}${suffix}`
  })
  await fs.writeFile(filePath, updated)
}

main()
