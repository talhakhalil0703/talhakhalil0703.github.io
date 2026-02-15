import { marked } from "marked";
import { readdir, mkdir, rm, cp, readFile, writeFile, exists } from "fs/promises";
import { join, basename, extname } from "path";

// ── Config ──────────────────────────────────────────────────────────
const CONTENT_DIR = "./content";
const TEMPLATE_DIR = "./templates";
const ASSETS_DIR = "./assets";
const OUTPUT_DIR = "./docs";

// ── Types ───────────────────────────────────────────────────────────
interface TopicMeta {
    slug: string;
    title: string;
}

interface SectionMeta {
    name: string;
    topics: TopicMeta[];
}

interface ContentMeta {
    pillar: string;
    sections: SectionMeta[];
}

interface TocItem {
    id: string;
    text: string;
    level: number;
}

// ── Helpers ─────────────────────────────────────────────────────────
async function readTemplate(name: string): Promise<string> {
    return await readFile(join(TEMPLATE_DIR, name), "utf-8");
}

function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
}

function extractToc(html: string): TocItem[] {
    const toc: TocItem[] = [];
    const headingRegex = /<h([23])\s+id="([^"]*)"[^>]*>(.*?)<\/h[23]>/gi;
    let match;
    while ((match = headingRegex.exec(html)) !== null) {
        toc.push({
            level: parseInt(match[1]),
            id: match[2],
            text: match[3].replace(/<[^>]*>/g, ""),
        });
    }
    return toc;
}

function renderToc(items: TocItem[]): string {
    if (items.length === 0) return "";
    return items
        .map(
            (item) =>
                `<a href="#${item.id}" class="toc-link ${item.level === 3 ? "toc-sub" : ""}">${item.text}</a>`
        )
        .join("\n");
}

function renderSidebar(
    meta: ContentMeta,
    currentSlug: string,
    pillarSlug: string
): string {
    let html = `<div class="sidebar-pillar">PILLAR</div>\n`;
    html += `<div class="sidebar-pillar-name">${meta.pillar}</div>\n`;

    for (const section of meta.sections) {
        html += `<div class="sidebar-section">\n`;
        html += `  <div class="sidebar-section-header">\n`;
        html += `    <span>${section.name}</span>\n`;
        html += `    <button class="sidebar-toggle" aria-label="Toggle section">−</button>\n`;
        html += `  </div>\n`;
        html += `  <div class="sidebar-section-items">\n`;

        for (const topic of section.topics) {
            const isActive = topic.slug === currentSlug;
            html += `    <a href="/${pillarSlug}/${topic.slug}.html" class="sidebar-item${isActive ? " active" : ""}">${topic.title}</a>\n`;
        }

        html += `  </div>\n`;
        html += `</div>\n`;
    }
    return html;
}

function renderBreadcrumb(
    pillar: string,
    section: string,
    topic: string,
    pillarSlug: string
): string {
    return `<nav class="breadcrumb">
    <a href="/">LIBRARY</a>
    <span class="breadcrumb-sep">›</span>
    <a href="/${pillarSlug}/">${pillar.toUpperCase()}</a>
    <span class="breadcrumb-sep">›</span>
    <span>${section.toUpperCase()}</span>
    <span class="breadcrumb-sep">›</span>
    <span class="breadcrumb-current">${topic.toUpperCase()}</span>
  </nav>`;
}

function getReadTime(content: string): string {
    const words = content.split(/\s+/).length;
    const minutes = Math.max(1, Math.round(words / 200));
    return `${minutes} min read`;
}

// ── Configure marked ────────────────────────────────────────────────
marked.use({
    renderer: {
        heading({ text, depth }: { text: string; depth: number }) {
            const id = slugify(text.replace(/<[^>]*>/g, ""));
            return `<h${depth} id="${id}">${text}</h${depth}>`;
        },
        code({ text, lang }: { text: string; lang?: string }) {
            return `<pre><code class="language-${lang || "text"}">${text
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")}</code></pre>`;
        },
    },
});

// ── Build Steps ─────────────────────────────────────────────────────
async function clean() {
    if (await exists(OUTPUT_DIR)) {
        await rm(OUTPUT_DIR, { recursive: true });
    }
    await mkdir(OUTPUT_DIR, { recursive: true });
}

async function copyAssets() {
    const dest = join(OUTPUT_DIR, "assets");
    await mkdir(dest, { recursive: true });
    await cp(ASSETS_DIR, dest, { recursive: true });
}

async function buildHomepage() {
    const baseTemplate = await readTemplate("base.html");
    const homeTemplate = await readTemplate("home.html");

    const html = baseTemplate
        .replace("{{content}}", homeTemplate)
        .replace("{{title}}", "Talha Khalil — Software Engineer")
        .replace("{{description}}", "Personal website of Talha Khalil. System Design, Embedded Systems, and Software Engineering.")
        .replace("{{nav-active-home}}", "active")
        .replace(/\{\{nav-active-[^}]+\}\}/g, "");

    await writeFile(join(OUTPUT_DIR, "index.html"), html);
    console.log("  ✓ index.html");
}

async function buildTopicPages() {
    const baseTemplate = await readTemplate("base.html");
    const topicTemplate = await readTemplate("topic.html");

    // Find all pillar directories
    const contentEntries = await readdir(CONTENT_DIR, { withFileTypes: true });
    const pillarDirs = contentEntries.filter((e) => e.isDirectory());

    for (const pillarDir of pillarDirs) {
        const pillarPath = join(CONTENT_DIR, pillarDir.name);
        const metaPath = join(pillarPath, "_meta.json");

        if (!(await exists(metaPath))) continue;

        const meta: ContentMeta = JSON.parse(await readFile(metaPath, "utf-8"));
        const pillarSlug = pillarDir.name;
        const outputPillarDir = join(OUTPUT_DIR, pillarSlug);
        await mkdir(outputPillarDir, { recursive: true });

        // Build index page for pillar
        const pillarIndexHtml = baseTemplate
            .replace("{{content}}", buildPillarIndex(meta, pillarSlug))
            .replace("{{title}}", `${meta.pillar} — Talha Khalil`)
            .replace("{{description}}", `${meta.pillar} topics for interview preparation.`)
            .replace("{{nav-active-learn}}", "active")
            .replace(/\{\{nav-active-[^}]+\}\}/g, "");
        await writeFile(join(outputPillarDir, "index.html"), pillarIndexHtml);
        console.log(`  ✓ ${pillarSlug}/index.html`);

        // Build each topic page
        for (const section of meta.sections) {
            for (const topic of section.topics) {
                const mdPath = join(pillarPath, `${topic.slug}.md`);
                if (!(await exists(mdPath))) {
                    console.log(`  ⚠ Missing: ${mdPath}`);
                    continue;
                }

                const mdContent = await readFile(mdPath, "utf-8");
                const htmlContent = await marked(mdContent);
                const toc = extractToc(htmlContent);
                const readTime = getReadTime(mdContent);
                const today = new Date().toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                });

                const sidebar = renderSidebar(meta, topic.slug, pillarSlug);
                const breadcrumb = renderBreadcrumb(
                    meta.pillar,
                    section.name,
                    topic.title,
                    pillarSlug
                );
                const tocHtml = renderToc(toc);

                const pageContent = topicTemplate
                    .replace("{{sidebar}}", sidebar)
                    .replace("{{breadcrumb}}", breadcrumb)
                    .replace("{{pillar}}", meta.pillar.toUpperCase())
                    .replace("{{title}}", topic.title)
                    .replace("{{date}}", today)
                    .replace("{{readTime}}", readTime)
                    .replace("{{content}}", htmlContent)
                    .replace("{{toc}}", tocHtml);

                const fullHtml = baseTemplate
                    .replace("{{content}}", pageContent)
                    .replace("{{title}}", `${topic.title} — ${meta.pillar} — Talha Khalil`)
                    .replace("{{description}}", `Learn about ${topic.title} in ${meta.pillar}.`)
                    .replace("{{nav-active-learn}}", "active")
                    .replace(/\{\{nav-active-[^}]+\}\}/g, "");

                await writeFile(join(outputPillarDir, `${topic.slug}.html`), fullHtml);
                console.log(`  ✓ ${pillarSlug}/${topic.slug}.html`);
            }
        }
    }
}

function buildPillarIndex(meta: ContentMeta, pillarSlug: string): string {
    let html = `<div class="pillar-index">`;
    html += `<h1>${meta.pillar}</h1>`;
    html += `<p class="pillar-description">Explore topics in ${meta.pillar} for interview preparation and deep learning.</p>`;

    for (const section of meta.sections) {
        html += `<div class="pillar-section">`;
        html += `<h2>${section.name}</h2>`;
        html += `<div class="pillar-topics-grid">`;
        for (const topic of section.topics) {
            html += `<a href="/${pillarSlug}/${topic.slug}.html" class="pillar-topic-card">
        <span class="pillar-topic-title">${topic.title}</span>
        <span class="pillar-topic-arrow">→</span>
      </a>`;
        }
        html += `</div></div>`;
    }

    html += `</div>`;
    return html;
}

// ── Main ────────────────────────────────────────────────────────────
async function build() {
    console.log("🔨 Building site...\n");

    console.log("Cleaning output...");
    await clean();

    console.log("Copying assets...");
    await copyAssets();

    console.log("Building homepage...");
    await buildHomepage();

    console.log("Building topic pages...");
    await buildTopicPages();

    console.log("\n✅ Build complete! Output in ./docs/");
}

build().catch((err) => {
    console.error("❌ Build failed:", err);
    process.exit(1);
});
