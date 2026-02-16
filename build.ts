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
    title: string;
    tags: string[];
}

interface DiscoveredPost {
    slug: string;
    title: string;
    tags: string[];
    publishedDate: Date;
    editedDate: Date;
    mdPath: string;
    body: string;
}

interface DiscoveredSection {
    name: string;
    posts: DiscoveredPost[];
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
    pillarName: string,
    sections: DiscoveredSection[],
    currentSlug: string,
    pillarSlug: string
): string {
    let html = `<div class="sidebar-pillar">PILLAR</div>\n`;
    html += `<div class="sidebar-pillar-name">${pillarName}</div>\n`;

    for (const section of sections) {
        html += `<div class="sidebar-section">\n`;
        html += `  <div class="sidebar-section-header">\n`;
        html += `    <span>${section.name}</span>\n`;
        html += `    <button class="sidebar-toggle" aria-label="Toggle section">−</button>\n`;
        html += `  </div>\n`;
        html += `  <div class="sidebar-section-items">\n`;

        for (const post of section.posts) {
            const isActive = post.slug === currentSlug;
            html += `    <a href="/${pillarSlug}/${post.slug}.html" class="sidebar-item${isActive ? " active" : ""}">${post.title}</a>\n`;
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
    if (!match) return { frontmatter: { title: '', tags: [] }, body: content };

    const raw = match[1];
    const body = content.slice(match[0].length);
    const frontmatter: Frontmatter = { title: '', tags: [] };

    // Parse title: "Some Title" or title: Some Title
    const titleMatch = raw.match(/title:\s*"([^"]*)"|title:\s*(.+)/);
    if (titleMatch) {
        frontmatter.title = (titleMatch[1] || titleMatch[2] || '').trim();
    }

    // Parse tags: [Tag1, Tag2]
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
    const pillarDirs = contentEntries.filter((e: any) => e.isDirectory());

    for (const pillarDir of pillarDirs) {
        const pillarPath = join(CONTENT_DIR, pillarDir.name);
        const pillarSlug = pillarDir.name;
        const outputPillarDir = join(OUTPUT_DIR, pillarSlug);
        await mkdir(outputPillarDir, { recursive: true });

        // Get pillar name from _meta.json if it exists, otherwise use folder name
        const metaPath = join(pillarPath, "_meta.json");
        let pillarName = pillarSlug.charAt(0).toUpperCase() + pillarSlug.slice(1);
        if (await exists(metaPath)) {
            const meta = JSON.parse(await readFile(metaPath, "utf-8"));
            pillarName = meta.pillar || pillarName;
        }

        // Auto-discover all .md files in this pillar
        const files = await readdir(pillarPath);
        const mdFiles = files.filter((f: string) => f.endsWith('.md'));

        // Parse all posts
        const discoveredPosts: DiscoveredPost[] = [];
        for (const file of mdFiles) {
            const mdPath = join(pillarPath, file);
            const rawContent = await readFile(mdPath, "utf-8");
            const { frontmatter, body } = parseFrontmatter(rawContent);
            const slug = file.replace('.md', '');
            // Title: from frontmatter, or derive from slug
            const title = frontmatter.title || slug.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            const tags = frontmatter.tags.length > 0 ? frontmatter.tags : ['General'];
            const publishedDate = getGitCreatedDate(mdPath);
            const editedDate = getGitLastModifiedDate(mdPath);

            discoveredPosts.push({ slug, title, tags, publishedDate, editedDate, mdPath, body });
        }

        // Group posts by tag into sections (a post can appear in multiple sections)
        const tagMap = new Map<string, DiscoveredPost[]>();
        for (const post of discoveredPosts) {
            for (const tag of post.tags) {
                if (!tagMap.has(tag)) tagMap.set(tag, []);
                tagMap.get(tag)!.push(post);
            }
        }
        const sections: DiscoveredSection[] = Array.from(tagMap.entries()).map(([name, posts]) => ({ name, posts }));

        // Build each topic page
        for (const post of discoveredPosts) {
            const htmlContent = await marked(post.body);
            const toc = extractToc(htmlContent);
            const readTime = getReadTime(post.body);
            const primaryTag = post.tags[0] || 'General';

            allBlogPosts.push({
                slug: post.slug,
                title: post.title,
                pillarSlug,
                publishedDate: post.publishedDate,
                editedDate: post.editedDate,
                tags: post.tags,
            });

            const sidebar = renderSidebar(pillarName, sections, post.slug, pillarSlug);
            const breadcrumb = renderBreadcrumb(
                pillarName,
                primaryTag,
                post.title,
                pillarSlug
            );
            const tocHtml = renderToc(toc);

            const pageContent = topicTemplate
                .replace("{{sidebar}}", sidebar)
                .replace("{{breadcrumb}}", breadcrumb)
                .replace("{{pillar}}", pillarName.toUpperCase())
                .replace("{{title}}", post.title)
                .replace("{{date}}", formatDate(post.publishedDate))
                .replace("{{editDate}}", formatDate(post.editedDate))
                .replace("{{readTime}}", readTime)
                .replace("{{content}}", htmlContent)
                .replace("{{toc}}", tocHtml);

            const fullHtml = baseTemplate
                .replace("{{content}}", pageContent)
                .replace("{{title}}", `${post.title} — ${pillarName} — Talha Khalil`)
                .replace("{{description}}", `${post.title} — ${pillarName} — Talha Khalil.`)
                .replace(`{{nav-active-${pillarSlug}}}`, "active")
                .replace(/\{\{nav-active-[^}]+\}\}/g, "");

            await writeFile(join(outputPillarDir, `${post.slug}.html`), fullHtml);
            console.log(`  ✓ ${pillarSlug}/${post.slug}.html`);
        }

        // Build pillar index with discovered post data
        const pillarPosts = discoveredPosts.map(p => ({
            topic: { slug: p.slug, title: p.title },
            section: p.tags[0] || 'General',
            tags: p.tags,
            publishedDate: p.publishedDate,
            editedDate: p.editedDate,
        }));
        const pillarIndexHtml = baseTemplate
            .replace("{{content}}", buildPillarIndex(pillarName, pillarSlug, sections, pillarPosts))
            .replace("{{title}}", `${pillarName} — Talha Khalil`)
            .replace("{{description}}", `${pillarName} — Talha Khalil's posts and articles.`)
            .replace(`{{nav-active-${pillarSlug}}}`, "active")
            .replace(/\{\{nav-active-[^}]+\}\}/g, "");
        await writeFile(join(outputPillarDir, "index.html"), pillarIndexHtml);
        console.log(`  ✓ ${pillarSlug}/index.html`);
    }

    return allBlogPosts;
}

function buildPillarIndex(
    pillarName: string,
    pillarSlug: string,
    sections: DiscoveredSection[],
    posts: { topic: { slug: string; title: string }; section: string; tags: string[]; publishedDate: Date; editedDate: Date }[]
): string {
    // Collect all unique tags
    const allTags = new Set<string>();
    posts.forEach(p => p.tags.forEach(t => allTags.add(t)));

    let html = `<div class="pillar-index">`;
    html += `<h1>${pillarName}</h1>`;
    html += `<p class="pillar-description">Explore topics in ${pillarName}.</p>`;

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
    for (const section of sections) {
        html += `<div class="pillar-section" data-section="${section.name}">`;
        html += `<h2>${section.name}</h2>`;
        html += `<div class="pillar-topics-grid">`;
        for (const post of section.posts) {
            html += `<a href="/${pillarSlug}/${post.slug}.html" class="pillar-topic-card" data-date="${post.publishedDate.toISOString()}" data-tags="${post.tags.join(',')}">
        <span class="pillar-topic-title">${post.title}</span>
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

    // Copy CNAME file if it exists (for GitHub Pages custom domain)
    if (await exists("./CNAME")) {
        await cp("./CNAME", join(OUTPUT_DIR, "CNAME"));
        console.log("Copied CNAME file.");
    }

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
