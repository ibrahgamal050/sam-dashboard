import { promises as fs } from "node:fs"
import path from "node:path"
import { spawn } from "node:child_process"

const TEST_DIR = path.resolve(".tests-dist", "tests")

async function main() {
  const files = await collectTests(TEST_DIR)
  if (!files.length) {
    console.warn("No tests found")
    return
  }
  const child = spawn(process.execPath, ["--test", ...files], {
    stdio: "inherit",
  })
  child.on("exit", (code) => {
    process.exitCode = code ?? 1
  })
}

async function collectTests(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await collectTests(fullPath)))
    } else if (entry.isFile() && entry.name.endsWith(".test.js")) {
      files.push(fullPath)
    }
  }
  return files
}

main()
