const fs = require('fs');
const { marked } = require('marked');

// Configure marked to render IDs on headers for the Table of Contents anchor links
marked.setOptions({
  headerIds: true,
  gfm: true,
  breaks: true
});

const docs = [
  {
    src: 'system_documentation.md',
    dest: 'system_documentation.html',
    title: 'AeroLink — Enterprise System Documentation',
    activeTab: 'system'
  },
  {
    src: 'frontend_architecture.md',
    dest: 'frontend_architecture.html',
    title: 'AeroLink — Frontend Architecture Blueprint',
    activeTab: 'frontend'
  },
  {
    src: 'walkthrough.md',
    dest: 'walkthrough.html',
    title: 'AeroLink — AWS Master Walkthrough & Evidence',
    activeTab: 'walkthrough'
  }
];

docs.forEach((doc) => {
  if (!fs.existsSync(doc.src)) {
    console.warn(`⚠️ Source file ${doc.src} not found, skipping.`);
    return;
  }

  const md = fs.readFileSync(doc.src, 'utf-8');
  const bodyHtml = marked.parse(md);

  const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${doc.title}</title>
  
  <!-- Premium Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  
  <!-- Prism.js Tomorrow Night Syntax Highlighting Theme -->
  <link href="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/themes/prism-tomorrow.min.css" rel="stylesheet" />
  
  <!-- Mermaid.js for sequence / flow diagrams -->
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
  <script>
    mermaid.initialize({
      startOnLoad: true,
      theme: 'base',
      themeVariables: {
        primaryColor: '#e0f2fe',
        primaryTextColor: '#0369a1',
        primaryBorderColor: '#7dd3fc',
        lineColor: '#94a3b8',
        secondaryColor: '#f8fafc',
        tertiaryColor: '#f1f5f9',
        fontFamily: 'Inter, sans-serif',
        fontSize: '13px'
      }
    });
  </script>

  <style>
    /* ===== CSS Reset & Design System Tokens ===== */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg-body: #f8fafc;
      --bg-surface: #ffffff;
      --text-primary: #0f172a;
      --text-secondary: #334155;
      --text-muted: #64748b;
      --accent-blue: #2563eb;
      --accent-blue-hover: #1d4ed8;
      --accent-blue-light: #eff6ff;
      --border-color: #e2e8f0;
      --border-table: #cbd5e1;
      --shadow-sm: 0 1px 3px rgba(0,0,0,0.05);
      --shadow-md: 0 4px 18px rgba(0,0,0,0.04);
      --shadow-lg: 0 10px 30px rgba(0,0,0,0.06);
      --radius: 12px;
      --radius-sm: 8px;
    }

    html { scroll-behavior: smooth; }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: var(--bg-body);
      color: var(--text-primary);
      line-height: 1.75;
      font-size: 15px;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    /* ===== Sticky Top Navigation Bar ===== */
    .nav-bar {
      position: sticky;
      top: 0;
      width: 100%;
      background: rgba(255, 255, 255, 0.85);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border-color);
      z-index: 1000;
      box-shadow: var(--shadow-sm);
    }

    .nav-container {
      max-width: 1280px;
      margin: 0 auto;
      padding: 14px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .nav-brand {
      font-family: 'Outfit', sans-serif;
      font-weight: 800;
      font-size: 1.15rem;
      color: var(--text-primary);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .nav-brand span {
      background: linear-gradient(135deg, #2563eb 0%, #0891b2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .nav-links {
      display: flex;
      gap: 8px;
    }

    .nav-btn {
      font-family: 'Inter', sans-serif;
      font-weight: 600;
      font-size: 0.85rem;
      padding: 8px 16px;
      border-radius: 20px;
      text-decoration: none;
      color: var(--text-secondary);
      border: 1px solid transparent;
      transition: all 0.2s ease;
    }

    .nav-btn:hover {
      background: #f1f5f9;
      color: var(--text-primary);
    }

    .nav-btn.active {
      background: var(--accent-blue-light);
      color: var(--accent-blue);
      border-color: rgba(37, 99, 235, 0.15);
    }

    .nav-badges {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .status-badge {
      font-size: 0.72rem;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 12px;
      letter-spacing: 0.02em;
    }

    .badge-grade {
      background: linear-gradient(135deg, #059669 0%, #10b981 100%);
      color: #ffffff;
      box-shadow: 0 2px 8px rgba(5, 150, 105, 0.2);
    }

    .badge-status {
      background: #eff6ff;
      color: #2563eb;
      border: 1px solid #bfdbfe;
    }

    /* ===== Layout Grid & Wrapper ===== */
    .doc-wrapper {
      max-width: 1280px;
      margin: 0 auto;
      padding: 48px 24px 120px;
      display: grid;
      grid-template-columns: 240px 1fr;
      gap: 40px;
    }

    @media (max-width: 1200px) {
      .doc-wrapper {
        grid-template-columns: 1fr;
        padding-top: 24px;
      }
    }

    /* ===== Page Content Container ===== */
    .doc-content {
      background: var(--bg-surface);
      border-radius: 16px;
      border: 1px solid var(--border-color);
      box-shadow: var(--shadow-lg);
      padding: 56px 64px;
      overflow-x: hidden;
      position: relative;
    }

    @media (max-width: 768px) {
      .doc-content {
        padding: 32px 20px;
        border-radius: 12px;
      }
    }

    /* ===== Typographical Enhancements ===== */
    .doc-content > h1:first-child {
      font-family: 'Outfit', sans-serif;
      font-size: 2.6rem;
      font-weight: 900;
      letter-spacing: -0.03em;
      line-height: 1.15;
      color: var(--text-primary);
      margin-bottom: 6px;
      padding-bottom: 0;
      border: none;
      background: linear-gradient(135deg, #0f172a 0%, #1e40af 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .doc-content > h1:first-child + h2 {
      font-family: 'Inter', sans-serif;
      font-size: 1.05rem;
      font-weight: 600;
      color: var(--text-muted);
      letter-spacing: -0.01em;
      border: none;
      margin-top: 0;
      padding: 0 0 20px 0;
      border-bottom: 2px solid var(--border-color);
      margin-bottom: 36px;
    }

    h1, h2, h3, h4 {
      font-family: 'Outfit', sans-serif;
      color: var(--text-primary);
      letter-spacing: -0.02em;
    }

    h1 {
      font-size: 2rem;
      font-weight: 800;
      margin: 56px 0 20px;
      line-height: 1.25;
    }

    h2 {
      font-size: 1.55rem;
      font-weight: 800;
      margin: 48px 0 18px;
      padding-bottom: 12px;
      border-bottom: 2px solid var(--border-color);
      position: relative;
    }

    h2::before {
      content: '';
      position: absolute;
      bottom: -2px;
      left: 0;
      width: 60px;
      height: 2px;
      background: linear-gradient(90deg, var(--accent-blue), #0891b2);
      border-radius: 2px;
    }

    h3 {
      font-size: 1.2rem;
      font-weight: 700;
      margin: 36px 0 12px;
    }

    h4 {
      font-size: 1.05rem;
      font-weight: 700;
      color: var(--accent-blue);
      margin: 28px 0 10px;
    }

    h5 {
      font-family: 'Inter', sans-serif;
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--text-secondary);
      margin: 24px 0 8px;
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }

    p {
      margin: 0 0 18px;
      color: var(--text-secondary);
      line-height: 1.8;
    }

    strong {
      font-weight: 700;
      color: var(--text-primary);
    }

    em { font-style: italic; color: var(--text-secondary); }

    a {
      color: var(--accent-blue);
      text-decoration: none;
      font-weight: 500;
      border-bottom: 1px solid transparent;
      transition: all 0.2s;
    }
    a:hover {
      border-bottom-color: var(--accent-blue);
      color: var(--accent-blue-hover);
    }

    /* ===== Markdown Horizontal Rules ===== */
    hr {
      border: none;
      height: 1px;
      background: linear-gradient(90deg, transparent, #cbd5e1, transparent);
      margin: 48px 0;
    }

    /* ===== Lists ===== */
    ul, ol {
      margin: 0 0 24px;
      padding-left: 24px;
    }

    li {
      margin-bottom: 8px;
      color: var(--text-secondary);
      line-height: 1.7;
    }

    li strong { color: var(--text-primary); }

    ul ul, ol ol, ul ol, ol ul {
      margin-top: 6px;
      margin-bottom: 6px;
    }

    /* ===== Tables (Fully Responsive) ===== */
    .table-container {
      width: 100%;
      overflow-x: auto;
      margin: 24px 0 32px;
      border-radius: var(--radius);
      border: 1px solid var(--border-table);
      box-shadow: var(--shadow-sm);
    }

    table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      font-size: 0.88rem;
    }

    thead {
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    }

    thead th {
      padding: 14px 18px;
      text-align: left;
      font-weight: 700;
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--text-muted);
      border-bottom: 2px solid var(--border-table);
      white-space: nowrap;
    }

    tbody td {
      padding: 12px 18px;
      border-bottom: 1px solid #f1f5f9;
      color: var(--text-secondary);
      vertical-align: top;
      line-height: 1.6;
    }

    tbody tr:last-child td { border-bottom: none; }

    tbody tr:hover { background: #fafbfd; }

    tbody td:first-child {
      font-weight: 600;
      color: var(--text-primary);
      white-space: nowrap;
    }

    /* ===== Inline Code Labels ===== */
    code {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.82em;
      background: #f1f5f9;
      color: #be185d;
      padding: 2px 6px;
      border-radius: 5px;
      border: 1px solid #e2e8f0;
      font-weight: 500;
    }

    /* ===== Prism.js Dark Pre/Code Blocks ===== */
    pre[class*="language-"] {
      background: #0f172a !important;
      border-radius: var(--radius) !important;
      padding: 24px 28px !important;
      margin: 20px 0 32px !important;
      border: 1px solid #1e293b !important;
      box-shadow: inset 0 2px 8px rgba(0,0,0,0.3) !important;
      position: relative;
      overflow-x: auto;
    }

    pre[class*="language-"] code {
      background: none !important;
      border: none !important;
      padding: 0 !important;
      color: #e2e8f0 !important;
      font-family: 'JetBrains Mono', monospace !important;
      font-size: 0.82rem !important;
      line-weight: 1.7 !important;
      text-shadow: none !important;
    }

    /* Code Block Copy Button */
    .copy-btn {
      position: absolute;
      top: 10px;
      right: 12px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 6px;
      color: #94a3b8;
      font-family: 'Inter', sans-serif;
      font-size: 0.68rem;
      font-weight: 600;
      padding: 4px 10px;
      cursor: pointer;
      opacity: 0;
      transition: all 0.2s ease;
      z-index: 10;
    }

    pre[class*="language-"]:hover .copy-btn {
      opacity: 1;
    }

    .copy-btn:hover {
      background: rgba(255, 255, 255, 0.18);
      color: #ffffff;
    }

    /* ===== Mermaid Custom Wrapper ===== */
    .mermaid {
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: var(--radius);
      box-shadow: var(--shadow-sm);
      text-align: center;
      padding: 36px 20px;
      margin: 24px 0 36px;
      overflow-x: auto;
    }

    /* ===== Markdown Images & Figure Captions ===== */
    .img-wrapper {
      margin: 24px 0 32px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    img {
      max-width: 100%;
      height: auto;
      border-radius: var(--radius);
      border: 1px solid var(--border-color);
      box-shadow: var(--shadow-md);
      display: block;
      transition: transform 0.2s ease;
    }

    img:hover {
      transform: scale(1.005);
    }

    .img-caption {
      text-align: center;
      font-size: 0.82rem;
      color: var(--text-muted);
      margin-top: 8px;
      font-style: italic;
    }

    /* ===== Custom Page Section Badges (H5 with Component) ===== */
    h5:has(+ p), h5 {
      background: linear-gradient(135deg, #eff6ff 0%, #f0f9ff 100%);
      border: 1px solid #bfdbfe;
      border-radius: 8px;
      padding: 12px 18px;
      font-size: 0.88rem;
      color: #1e40af;
      letter-spacing: 0.015em;
      margin: 24px 0 16px;
    }

    /* ===== Dynamic GitHub-Style Alerts ===== */
    .alert-block {
      padding: 16px 20px;
      border-left: 4px solid;
      border-radius: 0 var(--radius) var(--radius) 0;
      margin: 20px 0 28px;
      font-size: 0.92rem;
    }

    .alert-block p {
      margin: 0;
      color: inherit;
    }

    .alert-title {
      display: block;
      font-weight: 800;
      margin-bottom: 6px;
      text-transform: uppercase;
      font-size: 0.78rem;
      letter-spacing: 0.06em;
    }

    .alert-note {
      background: #eff6ff;
      border-left-color: #3b82f6;
      color: #1e3a8a;
    }

    .alert-tip {
      background: #ecfdf5;
      border-left-color: #10b981;
      color: #065f46;
    }

    .alert-warning {
      background: #fffbeb;
      border-left-color: #f59e0b;
      color: #78350f;
    }

    .alert-important {
      background: #fdf2f8;
      border-left-color: #ec4899;
      color: #9d174d;
    }

    .alert-caution {
      background: #fef2f2;
      border-left-color: #ef4444;
      color: #7f1d1d;
    }

    /* ===== Fixed Right Table of Contents (TOC) Sidebar ===== */
    .toc-sidebar {
      position: sticky;
      top: 100px;
      height: calc(100vh - 140px);
      overflow-y: auto;
      padding-right: 12px;
      border-right: 1px solid var(--border-color);
    }

    .toc-sidebar::-webkit-scrollbar {
      width: 4px;
    }

    .toc-sidebar::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 4px;
    }

    .toc-title {
      font-family: 'Outfit', sans-serif;
      font-weight: 700;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--text-primary);
      padding-bottom: 8px;
      margin-bottom: 12px;
      border-bottom: 1px solid var(--border-color);
    }

    .toc-links {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .toc-link {
      display: block;
      font-size: 0.76rem;
      padding: 4px 8px;
      border-radius: 6px;
      color: var(--text-muted);
      text-decoration: none;
      transition: all 0.2s;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      font-weight: 500;
    }

    .toc-link:hover {
      background: #f1f5f9;
      color: var(--accent-blue);
      border-bottom: none;
    }

    .toc-link.active {
      background: var(--accent-blue-light);
      color: var(--accent-blue);
      font-weight: 600;
    }

    @media (max-width: 1200px) {
      .toc-sidebar { display: none; }
    }

    /* ===== Scroll to Top Floating Button ===== */
    .back-to-top {
      position: fixed;
      bottom: 32px;
      right: 32px;
      width: 44px;
      height: 44px;
      background: var(--accent-blue);
      color: #fff;
      border: none;
      border-radius: 12px;
      cursor: pointer;
      font-size: 1.2rem;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 16px rgba(37,99,235,0.3);
      opacity: 0;
      transform: translateY(12px);
      transition: all 0.3s;
      z-index: 200;
    }

    .back-to-top.visible {
      opacity: 1;
      transform: translateY(0);
    }

    .back-to-top:hover {
      background: var(--accent-blue-hover);
      transform: translateY(-2px);
    }

    /* ===== Checklist Checkboxes ===== */
    li:has(> input[type="checkbox"]) {
      list-style: none;
      margin-left: -20px;
    }

    input[type="checkbox"] {
      appearance: none;
      -webkit-appearance: none;
      width: 16px;
      height: 16px;
      border: 2px solid #cbd5e1;
      border-radius: 4px;
      vertical-align: middle;
      margin-right: 8px;
      position: relative;
      cursor: pointer;
    }

    input[type="checkbox"]:checked {
      background: #059669;
      border-color: #059669;
    }

    input[type="checkbox"]:checked::after {
      content: '✓';
      position: absolute;
      top: -2px;
      left: 2px;
      color: #fff;
      font-size: 11px;
      font-weight: 800;
    }

    /* ===== Print Layout Override ===== */
    @media print {
      body { background: #fff; font-size: 12px; }
      .nav-bar, .toc-sidebar, .back-to-top { display: none !important; }
      .doc-wrapper { grid-template-columns: 1fr; padding: 0; }
      .doc-content { box-shadow: none; border: none; padding: 0; }
      pre[class*="language-"] { background: #f8f9fa !important; border: 1px solid #ddd; box-shadow: none; }
      pre[class*="language-"] code { color: #333 !important; }
      h2 { page-break-after: avoid; }
      table { page-break-inside: avoid; }
      img { max-width: 80%; }
    }
  </style>
</head>
<body>

  <!-- Sticky Top Navigation Bar -->
  <header class="nav-bar">
    <div class="nav-container">
      <div class="nav-brand">
        ✈️ <span>AeroLink Docs Portal</span>
      </div>
      <nav class="nav-links">
        <a href="system_documentation.html" class="nav-btn ${doc.activeTab === 'system' ? 'active' : ''}">1. System Runbook</a>
        <a href="frontend_architecture.html" class="nav-btn ${doc.activeTab === 'frontend' ? 'active' : ''}">2. Frontend Blueprint</a>
        <a href="walkthrough.html" class="nav-btn ${doc.activeTab === 'walkthrough' ? 'active' : ''}">3. AWS Master Walkthrough</a>
      </nav>
      <div class="nav-badges">
        <div class="status-badge badge-grade">Target: 100% / HD</div>
        <div class="status-badge badge-status">VPC: Active</div>
      </div>
    </div>
  </header>

  <!-- Main Grid Layout -->
  <div class="doc-wrapper">
    
    <!-- Table of Contents Sidebar -->
    <aside class="toc-sidebar">
      <div class="toc-title">ON THIS PAGE</div>
      <div class="toc-links" id="toc-container">
        <!-- Generated on the fly by Javascript -->
      </div>
    </aside>

    <!-- Markdown Content Surface -->
    <main class="doc-content">
      ${bodyHtml}
    </main>

  </div>

  <!-- Scroll to Top Trigger -->
  <button class="back-to-top" onclick="window.scrollTo({top:0,behavior:'smooth'})" title="Back to top">↑</button>

  <!-- Prism.js Core & Plugins -->
  <script src="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/components/prism-core.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/plugins/autoloader/prism-autoloader.min.js"></script>
  
  <script>
    // 1. Scroll-to-top button appearance
    const btn = document.querySelector('.back-to-top');
    window.addEventListener('scroll', () => {
      btn.classList.toggle('visible', window.scrollY > 400);
    });

    // 2. Wrap standard markdown tables in scrollable divs to make them beautifully responsive
    document.querySelectorAll('.doc-content table').forEach((table) => {
      const container = document.createElement('div');
      container.className = 'table-container';
      table.parentNode.insertBefore(container, table);
      container.appendChild(table);
    });

    // 3. Format figures / images and inject clean caption descriptors
    document.querySelectorAll('.doc-content img').forEach((img) => {
      const parent = img.parentElement;
      
      // If the image is inside a paragraph tag, wrap it nicely
      if (parent && parent.tagName === 'P') {
        const wrapper = document.createElement('div');
        wrapper.className = 'img-wrapper';
        
        parent.parentNode.insertBefore(wrapper, parent);
        wrapper.appendChild(img);
        
        // Locate adjacent text representing the image observation caption
        const captionText = parent.textContent.trim();
        if (captionText) {
          const caption = document.createElement('div');
          caption.className = 'img-caption';
          caption.textContent = captionText;
          wrapper.appendChild(caption);
        }
        
        // Remove empty residual paragraph tag
        parent.parentNode.removeChild(parent);
      }
    });

    // 4. Translate raw Markdown triple-backtick mermaid blocks into structured mermaid divs
    document.querySelectorAll('pre code.language-mermaid').forEach((block) => {
      const pre = block.parentElement;
      const div = document.createElement('div');
      div.className = 'mermaid';
      div.textContent = block.textContent;
      pre.parentElement.replaceChild(div, pre);
    });

    // 5. Build dynamic interactive "Copy Code" hover overlays on code blocks
    document.querySelectorAll('pre[class*="language-"]').forEach((pre) => {
      const button = document.createElement('button');
      button.className = 'copy-btn';
      button.textContent = 'Copy';
      pre.appendChild(button);

      button.addEventListener('click', () => {
        const codeElement = pre.querySelector('code');
        if (!codeElement) return;
        const codeText = codeElement.innerText;

        navigator.clipboard.writeText(codeText).then(() => {
          button.textContent = 'Copied!';
          button.style.background = '#059669';
          button.style.borderColor = '#059669';
          button.style.color = '#ffffff';

          setTimeout(() => {
            button.textContent = 'Copy';
            button.style.background = '';
            button.style.borderColor = '';
            button.style.color = '';
          }, 2000);
        });
      });
    });

    // 6. Translate raw blockquote tags with standard alerts into styled GitHub alert panels
    document.querySelectorAll('blockquote').forEach((bq) => {
      const htmlContent = bq.innerHTML;
      
      if (htmlContent.includes('[!NOTE]')) {
        bq.className = 'alert-block alert-note';
        bq.innerHTML = htmlContent.replace(/\[!NOTE\]/g, '<span class="alert-title">💡 Note</span>');
      } else if (htmlContent.includes('[!TIP]')) {
        bq.className = 'alert-block alert-tip';
        bq.innerHTML = htmlContent.replace(/\[!TIP\]/g, '<span class="alert-title">✨ Tip</span>');
      } else if (htmlContent.includes('[!WARNING]')) {
        bq.className = 'alert-block alert-warning';
        bq.innerHTML = htmlContent.replace(/\[!WARNING\]/g, '<span class="alert-title">⚠️ Warning</span>');
      } else if (htmlContent.includes('[!IMPORTANT]')) {
        bq.className = 'alert-block alert-important';
        bq.innerHTML = htmlContent.replace(/\[!IMPORTANT\]/g, '<span class="alert-title">🔥 Important</span>');
      } else if (htmlContent.includes('[!CAUTION]')) {
        bq.className = 'alert-block alert-caution';
        bq.innerHTML = htmlContent.replace(/\[!CAUTION\]/g, '<span class="alert-title">🚨 Caution</span>');
      }
    });

    // 7. Auto-scrape headers to populate the Right-hand Table of Contents sidebar
    const headings = document.querySelectorAll('.doc-content h2, .doc-content h3');
    const tocContainer = document.getElementById('toc-container');
    
    if (headings.length > 2 && tocContainer) {
      headings.forEach((heading, idx) => {
        if (!heading.id) {
          // Generate uniform anchor IDs from text
          heading.id = heading.textContent
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
        }

        const link = document.createElement('a');
        link.href = '#' + heading.id;
        link.className = 'toc-link';
        link.textContent = heading.textContent.replace(/^[\d.]+\s*/, '');
        
        // Add indent for H3 nested sections
        if (heading.tagName === 'H3') {
          link.style.paddingLeft = '20px';
          link.style.fontSize = '0.72rem';
        }

        tocContainer.appendChild(link);
      });
      
      // Highlight the active heading in TOC as the user scrolls
      const observerOptions = {
        root: null,
        rootMargin: '0px 0px -60% 0px',
        threshold: 0.1
      };

      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const activeId = entry.target.id;
            document.querySelectorAll('.toc-link').forEach((link) => {
              const matched = link.getAttribute('href') === '#' + activeId;
              link.classList.toggle('active', matched);
            });
          }
        });
      }, observerOptions);

      headings.forEach((heading) => observer.observe(heading));
    } else if (tocContainer) {
      // Hide sidebar if there are no significant headings to navigate
      const sidebar = document.querySelector('.toc-sidebar');
      if (sidebar) sidebar.style.display = 'none';
      const wrapper = document.querySelector('.doc-wrapper');
      if (wrapper) wrapper.style.gridTemplateColumns = '1fr';
    }
  </script>
</body>
</html>`;

  fs.writeFileSync(doc.dest, fullHtml, 'utf-8');
  console.log(`✅ Compiled ${doc.src} ➔ ${doc.dest} (${Math.round(fullHtml.length / 1024)} KB)`);
});

console.log('🎉 All documents successfully built into premium styled HTML!');
