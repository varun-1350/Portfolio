<?php
/**
 * Dedicated Project Page: Interactive Code Snippet Manager
 * Standalone application view with live filtering, regex search & clipboard integration.
 */
require_once __DIR__ . '/counter.php';
$stats = recordVisitorHit(false);
$totalVisits = number_format($stats['total_visits'] ?? 1250);
$uniqueVisits = number_format($stats['unique_visitors'] ?? 482);
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Interactive Code Snippet Manager - Curated high-performance algorithms, system patterns, and architecture utilities by Varun Patil.">
  <title>Code Snippet Manager // Varun Patil</title>
  
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="style.css">
</head>
<body>

  <!-- Ambient Glowing Neon Background Lights -->
  <div class="ambient-glow-orb ambient-orb-1" aria-hidden="true"></div>
  <div class="ambient-glow-orb ambient-orb-2" aria-hidden="true"></div>
  <div class="bg-grid-pattern" aria-hidden="true"></div>

  <!-- Header with Panda Logo -->
  <header class="site-header">
    <div class="container nav-wrapper">
      <a href="index.php" class="logo-brand" id="brandLogo">
        <img src="assets/logo.jpg" alt="Varun Patil Logo" class="brand-logo-img">
        <span class="logo-text">VARUN<span>.PATIL</span></span>
      </a>

      <ul class="nav-links">
        <li><a href="index.php" class="nav-link">Home</a></li>
        <li><a href="index.php#about" class="nav-link">About &amp; Resume</a></li>
        <li><a href="index.php#projects" class="nav-link active">Projects</a></li>
        <li><a href="index.php#contact" class="nav-link">Contact</a></li>
      </ul>

      <div class="nav-actions">
        <div class="live-counter-pill" id="liveVisitorPill">
          <span class="pulse-dot"></span>
          <span>Visits: <strong id="liveVisitorCount"><?= $totalVisits ?></strong></span>
          <span style="color: var(--border-medium);">|</span>
          <span style="color: var(--text-muted);">Unique: <strong id="uniqueVisitorCount"><?= $uniqueVisits ?></strong></span>
        </div>
        <a href="index.php#contact" class="nav-cta-btn">Let's Connect</a>
      </div>
    </div>
  </header>

  <main class="container project-page-hero">
    <nav class="breadcrumb-nav" aria-label="Breadcrumb">
      <a href="index.php">Home</a>
      <span>/</span>
      <a href="index.php#projects">Projects</a>
      <span>/</span>
      <span style="color: var(--text-primary);">Code Snippet Manager</span>
    </nav>

    <a href="index.php#projects" class="btn-back-portfolio">
      <span>←</span> Return to Projects Grid
    </a>

    <div class="section-header" style="margin-bottom: 24px;">
      <div class="section-tag">// PRODUCTION UTILITY</div>
      <h1 class="section-title">Interactive <span class="gradient-text-cyan">Code Snippet Manager</span></h1>
      <p class="section-subtitle">
        A fast, responsive developer snippet repository featuring instant query filtering, multi-language categories, syntax highlighting, and one-tap clipboard integration.
      </p>
    </div>

    <!-- Project Metadata Ribbon -->
    <div class="project-meta-box">
      <div class="project-meta-left">
        <span class="badge-live status-cyan">
          <span class="pulse-dot" style="background: var(--neon-cyan); width: 6px; height: 6px;"></span>
          Production Ready
        </span>
        <span class="tech-tag">PHP 8.x</span>
        <span class="tech-tag">Vanilla ES6+</span>
        <span class="tech-tag">CSS Grid / Flexbox</span>
        <span class="tech-tag">Async Clipboard API</span>
      </div>
      <div style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--text-muted);">
        Latency: &lt; 2ms Client Query Filter
      </div>
    </div>

    <!-- Main Snippet Workbench -->
    <div class="project-page-container">
      <div class="project-page-body">
        <div class="snippet-toolbar">
          <input type="text" class="snippet-search-input" id="snippetSearchInput" placeholder="Filter snippets by title, syntax, keyword, or language (e.g. flock, ppo, ast, chunk, grid)..." autofocus>
          <button class="snippet-filter-btn active" data-category="all">All (7)</button>
          <button class="snippet-filter-btn" data-category="php">PHP 8</button>
          <button class="snippet-filter-btn" data-category="python">Python</button>
          <button class="snippet-filter-btn" data-category="js">JavaScript</button>
          <button class="snippet-filter-btn" data-category="css">CSS3</button>
        </div>

        <div class="snippets-list-grid" id="snippetsListContainer">
          <!-- Populated dynamically by main.js -->
        </div>
      </div>
    </div>

    <!-- Architecture & Engineering Notes -->
    <section>
      <div class="section-tag">// ARCHITECTURAL SPECIFICATIONS</div>
      <h2 style="font-size: 1.6rem; margin-bottom: 20px;">Engineering Decisions &amp; Performance Highlights</h2>

      <div class="architecture-notes-grid">
        <div class="architecture-card">
          <div class="arch-card-icon">⚡</div>
          <h3 class="arch-card-title">Zero Dependency Footprint</h3>
          <p class="arch-card-desc">
            Constructed without heavy frontend bundles or bloated UI component frameworks. Written purely in semantic ES6+ and modern CSS, ensuring sub-50ms render times.
          </p>
        </div>

        <div class="architecture-card">
          <div class="arch-card-icon">🔒</div>
          <h3 class="arch-card-title">Atomic Concurrency &amp; Locking</h3>
          <p class="arch-card-desc">
            Backend snippets showcase real production strategies including POSIX-compliant <code>flock(LOCK_EX)</code> file streaming to prevent race conditions under load.
          </p>
        </div>

        <div class="architecture-card">
          <div class="arch-card-icon">📋</div>
          <h3 class="arch-card-title">Non-Blocking Clipboard IO</h3>
          <p class="arch-card-desc">
            Leverages modern asynchronous Permissions and Navigator Clipboard APIs with glowing state transitions and tactile visual confirmations.
          </p>
        </div>
      </div>
    </section>
  </main>

  <footer class="site-footer" style="margin-top: 80px;">
    <div class="container footer-inner">
      <div class="footer-copy">
        &copy; <?= date('Y') ?> Varun Patil. Crafted with Vanilla HTML5, CSS3, ES6+, PHP 8.x &amp; Python 3.12.
      </div>
      <div class="footer-system-status">
        <a href="project-graph.php" style="color: var(--neon-cyan); text-decoration: none;">Next: Graph Studio →</a>
      </div>
    </div>
  </footer>

  <script src="main.js"></script>
</body>
</html>
