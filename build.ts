import { marked } from "marked";
import { readdir, mkdir, rm, cp, readFile, writeFile, exists } from "fs/promises";
import { join, basename, extname } from "path";
import { execSync } from "child_process";

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

interface BlogPostInfo {
    slug: string;
    title: string;
    pillarSlug: string;
    publishedDate: Date;
    editedDate: Date;
    tags: string[];
}

interface Frontmatter {
    tags: string[];
    [key: string]: unknown;
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
    <a href="/">HOME</a>
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

function formatDate(date: Date): string {
    return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}

// ── Git Date Helpers ────────────────────────────────────────────────
function getGitCreatedDate(filePath: string): Date {
    try {
        const result = execSync(
            `git log --diff-filter=A --format=%aI -- "${filePath}"`,
            { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] }
        ).trim();
        if (result) {
            // May return multiple lines if file was added multiple times; take the last (oldest)
            const lines = result.split("\n");
            return new Date(lines[lines.length - 1]);
        }
    } catch { }
    return new Date();
}

function getGitLastModifiedDate(filePath: string): Date {
    try {
        const result = execSync(
            `git log -1 --format=%aI -- "${filePath}"`,
            { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] }
        ).trim();
        if (result) return new Date(result);
    } catch { }
    return new Date();
}

// ── Frontmatter Parser ──────────────────────────────────────────────
function parseFrontmatter(content: string): { frontmatter: Frontmatter; body: string } {
    const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
    if (!match) return { frontmatter: { tags: [] }, body: content };

    const raw = match[1];
    const body = content.slice(match[0].length);
    const frontmatter: Frontmatter = { tags: [] };

    // Simple YAML-like parser for tags: [Tag1, Tag2]
    const tagsMatch = raw.match(/tags:\s*\[([^\]]*)]/);
    if (tagsMatch) {
        frontmatter.tags = tagsMatch[1].split(',').map(t => t.trim()).filter(Boolean);
    }

    return { frontmatter, body };
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

async function buildHomepage(allBlogPosts: BlogPostInfo[]) {
    const baseTemplate = await readTemplate("base.html");
    const homeTemplate = await readTemplate("home.html");

    // Sort by published date descending, take top 6
    const recentPosts = [...allBlogPosts]
        .sort((a, b) => b.publishedDate.getTime() - a.publishedDate.getTime())
        .slice(0, 6);

    const recentBlogsHtml = recentPosts
        .map(
            (post) => `<a href="/${post.pillarSlug}/${post.slug}.html" class="recent-post-card">
                <div class="recent-post-date">${formatDate(post.publishedDate)}</div>
                <h3 class="recent-post-title">${post.title}</h3>
                <span class="recent-post-arrow">→</span>
            </a>`
        )
        .join("\n");

    const html = baseTemplate
        .replace("{{content}}", homeTemplate)
        .replace("{{title}}", "Talha Khalil — Software Engineer")
        .replace("{{description}}", "Personal website of Talha Khalil. Embedded Systems, Software Engineering, and more.")
        .replace("{{nav-active-home}}", "active")
        .replace("{{recent-blogs}}", recentBlogsHtml)
        .replace(/\{\{nav-active-[^}]+\}\}/g, "");

    await writeFile(join(OUTPUT_DIR, "index.html"), html);
    console.log("  ✓ index.html");
}

async function buildTopicPages(): Promise<BlogPostInfo[]> {
    const baseTemplate = await readTemplate("base.html");
    const topicTemplate = await readTemplate("topic.html");
    const allBlogPosts: BlogPostInfo[] = [];

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

        // Collect all posts for this pillar first (for the index page)
        const pillarPosts: { topic: TopicMeta; section: string; tags: string[]; publishedDate: Date; editedDate: Date }[] = [];

        // Build each topic page
        for (const section of meta.sections) {
            for (const topic of section.topics) {
                const mdPath = join(pillarPath, `${topic.slug}.md`);
                if (!(await exists(mdPath))) {
                    console.log(`  ⚠ Missing: ${mdPath}`);
                    continue;
                }

                const rawContent = await readFile(mdPath, "utf-8");
                const { frontmatter, body: mdBody } = parseFrontmatter(rawContent);
                const htmlContent = await marked(mdBody);
                const toc = extractToc(htmlContent);
                const readTime = getReadTime(mdBody);

                const publishedDate = getGitCreatedDate(mdPath);
                const editedDate = getGitLastModifiedDate(mdPath);
                const tags = frontmatter.tags.length > 0 ? frontmatter.tags : [section.name];

                pillarPosts.push({ topic, section: section.name, tags, publishedDate, editedDate });

                allBlogPosts.push({
                    slug: topic.slug,
                    title: topic.title,
                    pillarSlug,
                    publishedDate,
                    editedDate,
                    tags,
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
                    .replace("{{date}}", formatDate(publishedDate))
                    .replace("{{editDate}}", formatDate(editedDate))
                    .replace("{{readTime}}", readTime)
                    .replace("{{content}}", htmlContent)
                    .replace("{{toc}}", tocHtml);

                const fullHtml = baseTemplate
                    .replace("{{content}}", pageContent)
                    .replace("{{title}}", `${topic.title} — ${meta.pillar} — Talha Khalil`)
                    .replace("{{description}}", `${topic.title} — ${meta.pillar} — Talha Khalil.`)
                    .replace(`{{nav-active-${pillarSlug}}}`, "active")
                    .replace(/\{\{nav-active-[^}]+\}\}/g, "");

                await writeFile(join(outputPillarDir, `${topic.slug}.html`), fullHtml);
                console.log(`  ✓ ${pillarSlug}/${topic.slug}.html`);
            }
        }

        // Now build pillar index with collected post data
        const pillarIndexHtml = baseTemplate
            .replace("{{content}}", buildPillarIndex(meta, pillarSlug, pillarPosts))
            .replace("{{title}}", `${meta.pillar} — Talha Khalil`)
            .replace("{{description}}", `${meta.pillar} — Talha Khalil's posts and articles.`)
            .replace(`{{nav-active-${pillarSlug}}}`, "active")
            .replace(/\{\{nav-active-[^}]+\}\}/g, "");
        await writeFile(join(outputPillarDir, "index.html"), pillarIndexHtml);
        console.log(`  ✓ ${pillarSlug}/index.html`);
    }

    return allBlogPosts;
}

function buildPillarIndex(
    meta: ContentMeta,
    pillarSlug: string,
    posts: { topic: TopicMeta; section: string; tags: string[]; publishedDate: Date; editedDate: Date }[]
): string {
    // Collect all unique tags
    const allTags = new Set<string>();
    posts.forEach(p => p.tags.forEach(t => allTags.add(t)));

    let html = `<div class="pillar-index">`;
    html += `<h1>${meta.pillar}</h1>`;
    html += `<p class="pillar-description">Explore topics in ${meta.pillar}.</p>`;

    // Sort/Filter controls
    html += `<div class="blog-controls">`;
    html += `  <div class="blog-view-toggle">`;
    html += `    <button class="blog-view-btn active" data-view="topic">By Topic</button>`;
    html += `    <button class="blog-view-btn" data-view="date">By Date</button>`;
    html += `  </div>`;
    html += `  <div class="blog-sort-toggle" style="display:none;">`;
    html += `    <button class="blog-sort-btn active" data-sort="newest">Newest</button>`;
    html += `    <button class="blog-sort-btn" data-sort="oldest">Oldest</button>`;
    html += `  </div>`;
    html += `  <div class="blog-tag-filter">`;
    html += `    <button class="blog-tag-btn active" data-tag="all">All</button>`;
    for (const tag of allTags) {
        html += `    <button class="blog-tag-btn" data-tag="${tag}">${tag}</button>`;
    }
    html += `  </div>`;
    html += `</div>`;

    // Topic view (grouped by section, default)
    html += `<div class="blog-topic-view">`;
    for (const section of meta.sections) {
        const sectionPosts = posts.filter(p => p.section === section.name);
        if (sectionPosts.length === 0) continue;
        html += `<div class="pillar-section" data-section="${section.name}">`;
        html += `<h2>${section.name}</h2>`;
        html += `<div class="pillar-topics-grid">`;
        for (const post of sectionPosts) {
            html += `<a href="/${pillarSlug}/${post.topic.slug}.html" class="pillar-topic-card" data-date="${post.publishedDate.toISOString()}" data-tags="${post.tags.join(',')}">
        <span class="pillar-topic-title">${post.topic.title}</span>
        <span class="pillar-topic-date">${formatDate(post.publishedDate)}</span>
        <span class="pillar-topic-arrow">→</span>
      </a>`;
        }
        html += `</div></div>`;
    }
    html += `</div>`;

    // Date view (flat list, sorted by date)
    const sortedPosts = [...posts].sort((a, b) => b.publishedDate.getTime() - a.publishedDate.getTime());
    html += `<div class="blog-date-view" style="display:none;">`;
    html += `<div class="pillar-topics-grid">`;
    for (const post of sortedPosts) {
        html += `<a href="/${pillarSlug}/${post.topic.slug}.html" class="pillar-topic-card" data-date="${post.publishedDate.toISOString()}" data-tags="${post.tags.join(',')}">
        <div class="pillar-topic-info">
          <span class="pillar-topic-title">${post.topic.title}</span>
          <span class="pillar-topic-tags">${post.tags.map(t => `<span class="pillar-tag">${t}</span>`).join('')}</span>
        </div>
        <span class="pillar-topic-date">${formatDate(post.publishedDate)}</span>
        <span class="pillar-topic-arrow">→</span>
      </a>`;
    }
    html += `</div></div>`;

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

    console.log("Building topic pages...");
    const allBlogPosts = await buildTopicPages();

    console.log("Building homepage...");
    await buildHomepage(allBlogPosts);

    console.log("\n✅ Build complete! Output in ./docs/");
}

build().catch((err) => {
    console.error("❌ Build failed:", err);
    process.exit(1);
});
