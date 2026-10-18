import { Doc } from "../../../../convex/_generated/dataModel";
import { getFilePath } from "./file-tree";

type FileDoc = Doc<"files">;

export type ProjectRuntime =
  // package.json projects and loose .js/.ts scripts, run in the WebContainer.
  // dependencyKey changes when dependencies change, so the preview knows to reinstall.
  | { kind: "node"; label: string; install: string | null; start: string; web: boolean; dependencyKey: string }
  // A plain index.html site, served with Vite
  | { kind: "static"; label: string; start: string }
  // Python runs in the browser with Pyodide (WebAssembly), console only
  | { kind: "python"; label: string; entry: string; webFramework: string | null }
  | { kind: "none" };

// Dependency → label, most specific first
const JS_FRAMEWORKS: [string, string][] = [
  ["next", "Next.js"],
  ["@angular/core", "Angular"],
  ["nuxt", "Nuxt"],
  ["@sveltejs/kit", "SvelteKit"],
  ["astro", "Astro"],
  ["@remix-run/react", "Remix"],
  ["react-scripts", "React"],
  ["@nestjs/core", "NestJS"],
  ["express", "Express"],
  ["fastify", "Fastify"],
  ["hono", "Hono"],
  ["koa", "Koa"],
];

const VITE_FLAVORS: [string, string][] = [
  ["react", "React + Vite"],
  ["vue", "Vue + Vite"],
  ["svelte", "Svelte + Vite"],
  ["solid-js", "Solid + Vite"],
  ["preact", "Preact + Vite"],
];

const PYTHON_WEB_FRAMEWORKS: [RegExp, string][] = [
  [/\b(from|import)\s+flask\b/i, "Flask"],
  [/\b(from|import)\s+fastapi\b/i, "FastAPI"],
  [/\b(from|import)\s+django\b/i, "Django"],
  [/\b(from|import)\s+streamlit\b/i, "Streamlit"],
  [/\b(from|import)\s+gradio\b/i, "Gradio"],
];

const NODE_ENTRIES = ["index.js", "main.js", "app.js", "server.js", "index.mjs", "main.mjs", "src/index.js"];
const TS_ENTRIES = ["index.ts", "main.ts", "app.ts", "server.ts", "src/index.ts", "src/main.ts"];
const PYTHON_ENTRIES = ["main.py", "app.py", "__main__.py", "run.py", "src/main.py"];

const runScript = (path: string) =>
  path.endsWith(".ts") ? `npx --yes tsx ${path}` : `node ${path}`;

const parseJson = (content: string | undefined) => {
  try {
    return content ? JSON.parse(content) : null;
  } catch {
    return null;
  }
};

const detectJsLabel = (deps: Record<string, unknown>) => {
  for (const [dep, label] of JS_FRAMEWORKS) {
    if (dep in deps) return label;
  }
  if ("vite" in deps) {
    for (const [dep, label] of VITE_FLAVORS) {
      if (dep in deps) return label;
    }
    return "Vite";
  }
  return "typescript" in deps ? "TypeScript" : "Node.js";
};

// Decides how the preview runs a project, from its files
export const detectRuntime = (files: FileDoc[]): ProjectRuntime => {
  const byId = new Map(files.map((f) => [f._id, f]));
  const textFiles = new Map<string, string>();

  for (const file of files) {
    if (file.type === "file" && file.content !== undefined && !file.storageId) {
      textFiles.set(getFilePath(file, byId), file.content);
    }
  }

  const paths = [...textFiles.keys()].sort();
  const rootFiles = paths.filter((path) => !path.includes("/"));

  // 1. package.json: a Node.js project (web app, server or script)
  if (textFiles.has("package.json")) {
    const pkg = parseJson(textFiles.get("package.json")) ?? {};
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    const scripts: Record<string, string> = pkg.scripts ?? {};
    const label = detectJsLabel(deps);

    const entry =
      (typeof pkg.main === "string" && textFiles.has(pkg.main) ? pkg.main : null) ??
      [...NODE_ENTRIES, ...TS_ENTRIES].find((path) => textFiles.has(path)) ??
      null;

    const start = scripts.dev
      ? "npm run dev"
      : scripts.start
        ? "npm start"
        : entry
          ? runScript(entry)
          : "npm start";

    const dependencyKey = JSON.stringify(
      Object.entries(deps).sort(([a], [b]) => a.localeCompare(b))
    );

    return {
      kind: "node",
      label,
      install: "npm install",
      start,
      web: label !== "Node.js" && label !== "TypeScript",
      dependencyKey,
    };
  }

  // 2. A static website
  if (textFiles.has("index.html")) {
    return { kind: "static", label: "HTML", start: "npx --yes vite --host" };
  }

  // 3. Python
  const pythonFiles = paths.filter((path) => path.endsWith(".py"));
  if (pythonFiles.length > 0) {
    const entry =
      PYTHON_ENTRIES.find((path) => textFiles.has(path)) ??
      rootFiles.find((path) => path.endsWith(".py")) ??
      pythonFiles[0];

    const sources = [
      ...pythonFiles.map((path) => textFiles.get(path) ?? ""),
      textFiles.get("requirements.txt") ?? "",
    ].join("\n");
    const webFramework =
      PYTHON_WEB_FRAMEWORKS.find(([pattern]) => pattern.test(sources))?.[1] ?? null;

    return { kind: "python", label: "Python", entry, webFramework };
  }

  // 4. A loose JavaScript or TypeScript script
  const scriptEntry =
    [...NODE_ENTRIES, ...TS_ENTRIES].find((path) => textFiles.has(path)) ??
    rootFiles.find((path) => /\.(m?js|ts)$/.test(path));

  if (scriptEntry) {
    return {
      kind: "node",
      label: scriptEntry.endsWith(".ts") ? "TypeScript" : "Node.js",
      install: null,
      start: runScript(scriptEntry),
      web: false,
      dependencyKey: "",
    };
  }

  return { kind: "none" };
};

// Text files keyed by path, used to hand a project to Pyodide
export const getTextFilesByPath = (files: FileDoc[]) => {
  const byId = new Map(files.map((f) => [f._id, f]));
  const result: Record<string, string> = {};

  for (const file of files) {
    if (file.type === "file" && file.content !== undefined && !file.storageId) {
      result[getFilePath(file, byId)] = file.content;
    }
  }

  return result;
};
