/**
 * Neon Black Portfolio Engine
 * Asynchronous Visitor Tracking, Interactive Resume Tabs,
 * Project Demo Modals & Dynamic Python AST Client Integration.
 */

document.addEventListener('DOMContentLoaded', () => {
  initVisitorCounter();
  initResumeTabs();
  initNavbarScroll();
  initMobileNav();
  initModals();
  initSnippetManager();
  initGraphStudio();
  initAstVisualizer();
  initContactForm();
});

/* ==========================================================================
   1. VISITOR COUNTER CLIENT (Asynchronous JSON Polling)
   ========================================================================== */
async function initVisitorCounter() {
  const counterElement = document.getElementById('liveVisitorCount');
  if (!counterElement) return;

  try {
    const response = await fetch('counter.php?action=hit', {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    if (response.ok) {
      const data = await response.json();
      if (data && data.total_visits !== undefined) {
        animateCounterValue(counterElement, data.total_visits);
        const uniqueElement = document.getElementById('uniqueVisitorCount');
        if (uniqueElement && data.unique_visitors !== undefined) {
          uniqueElement.textContent = Number(data.unique_visitors).toLocaleString();
        }
      }
    } else {
      // Fallback display if not served via PHP server
      animateCounterValue(counterElement, 1250);
    }
  } catch (error) {
    // Graceful fallback for file:// or static preview
    console.info('Visitor counter running in local simulation mode:', error.message);
    animateCounterValue(counterElement, 1250);
  }
}

function animateCounterValue(element, targetValue) {
  const start = 0;
  const duration = 1200;
  const startTime = performance.now();

  function updateNumber(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Smooth ease-out cubic
    const easeProgress = 1 - Math.pow(1 - progress, 3);
    const currentVal = Math.floor(start + (targetValue - start) * easeProgress);
    element.textContent = currentVal.toLocaleString();

    if (progress < 1) {
      requestAnimationFrame(updateNumber);
    } else {
      element.textContent = targetValue.toLocaleString();
    }
  }

  requestAnimationFrame(updateNumber);
}

/* ==========================================================================
   2. INTERACTIVE RESUME TABS
   ========================================================================== */
function initResumeTabs() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const targetTabId = button.getAttribute('data-tab');

      // Update button active state
      tabButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');

      // Switch active pane
      tabPanes.forEach(pane => {
        if (pane.id === targetTabId) {
          pane.classList.add('active');
          // Trigger progress bar animations if entering skills tab
          if (targetTabId === 'tab-skills') {
            triggerSkillBars();
          }
        } else {
          pane.classList.remove('active');
        }
      });
    });
  });

  // Initial trigger for skill bars
  triggerSkillBars();
}

function triggerSkillBars() {
  const bars = document.querySelectorAll('.skill-bar-fill');
  bars.forEach(bar => {
    const width = bar.getAttribute('data-width') || '85%';
    bar.style.width = '0%';
    setTimeout(() => {
      bar.style.width = width;
    }, 50);
  });
}

/* ==========================================================================
   3. NAVBAR & SMOOTH SCROLLING
   ========================================================================== */
function initNavbarScroll() {
  const header = document.querySelector('.site-header');
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('section[id]');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }

    // Active link highlighting
    let currentSection = '';
    sections.forEach(section => {
      const sectionTop = section.offsetTop - 120;
      if (window.scrollY >= sectionTop) {
        currentSection = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${currentSection}`) {
        link.classList.add('active');
      }
    });
  });
}

function initMobileNav() {
  const toggleBtn = document.querySelector('.mobile-nav-toggle');
  const navLinks = document.querySelector('.nav-links');

  if (!toggleBtn || !navLinks) return;

  toggleBtn.addEventListener('click', () => {
    navLinks.classList.toggle('open');
    toggleBtn.innerHTML = navLinks.classList.contains('open') ? '✕' : '☰';
  });

  // Close mobile nav on link click
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      toggleBtn.innerHTML = '☰';
    });
  });
}

/* ==========================================================================
   4. MODAL MANAGEMENT SYSTEM
   ========================================================================== */
function initModals() {
  const openButtons = document.querySelectorAll('[data-open-modal]');
  const closeButtons = document.querySelectorAll('.modal-close-btn');
  const modalOverlays = document.querySelectorAll('.modal-overlay');

  openButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const modalId = btn.getAttribute('data-open-modal');
      const targetModal = document.getElementById(modalId);
      if (targetModal) {
        targetModal.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Trigger specific sub-system resize if applicable
        if (modalId === 'modal-graph-studio') {
          setTimeout(resizeGraphCanvas, 100);
        }
      }
    });
  });

  closeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const modal = btn.closest('.modal-overlay');
      if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  });

  modalOverlays.forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  });

  // Escape key to close active modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const activeModal = document.querySelector('.modal-overlay.active');
      if (activeModal) {
        activeModal.classList.remove('active');
        document.body.style.overflow = '';
      }
    }
  });
}

/* ==========================================================================
   5. PROJECT 1: INTERACTIVE CODE SNIPPET MANAGER
   ========================================================================== */
const SNIPPET_DATABASE = [
  {
    id: 1,
    title: 'Atomic File-Locked Counter (PHP 8.4)',
    category: 'php',
    language: 'php',
    code: `<?php
// High-concurrency safe increment using flock
$fp = fopen('metrics.json', 'c+');
if ($fp && flock($fp, LOCK_EX)) {
    $data = json_decode(stream_get_contents($fp), true) ?? ['hits' => 0];
    $data['hits']++;
    ftruncate($fp, 0);
    rewind($fp);
    fwrite($fp, json_encode($data, JSON_PRETTY_PRINT));
    flock($fp, LOCK_UN);
    fclose($fp);
}`
  },
  {
    id: 2,
    title: 'Safe Subprocess Dispatch Gateway (PHP -> Python)',
    category: 'php',
    language: 'php',
    code: `<?php
// Secure execution with escaped arguments and timeout pipe
$pyBin = escapeshellcmd('python3');
$script = escapeshellarg(__DIR__ . '/analyzer.py');
$payload = escapeshellarg($tmpFilePath);

exec("{$pyBin} {$script} --file {$payload} 2>&1", $output, $status);
$analysis = json_decode(implode("\\n", $output), true);`
  },
  {
    id: 3,
    title: 'McCabe Complexity Calculator (Python AST)',
    category: 'python',
    language: 'python',
    code: `import ast

class ComplexityVisitor(ast.NodeVisitor):
    def __init__(self):
        self.complexity = 1
    def visit_If(self, node):
        self.complexity += 1
        self.generic_visit(node)
    def visit_For(self, node):
        self.complexity += 1
        self.generic_visit(node)`
  },
  {
    id: 4,
    title: 'Glassmorphism Dynamic Backdrop (Vanilla CSS)',
    category: 'css',
    language: 'css',
    code: `.neon-glass-card {
  background: rgba(18, 18, 26, 0.75);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(0, 240, 255, 0.25);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5),
              0 0 20px rgba(0, 240, 255, 0.15);
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}`
  },
  {
    id: 5,
    title: 'Kinetic Particle Spring Node (ES6 Canvas)',
    category: 'js',
    language: 'javascript',
    code: `class GraphNode {
  constructor(x, y, radius, color) {
    this.x = x; this.y = y;
    this.vx = (Math.random() - 0.5) * 1.5;
    this.vy = (Math.random() - 0.5) * 1.5;
    this.color = color;
  }
  update(width, height) {
    this.x += this.vx; this.y += this.vy;
    if (this.x < 0 || this.x > width) this.vx *= -1;
    if (this.y < 0 || this.y > height) this.vy *= -1;
  }
}`
  },
  {
    id: 6,
    title: 'PPO Dynamic Pricing Policy Network (Python)',
    category: 'python',
    language: 'python',
    code: `import torch
import torch.nn as nn

class DynamicPricingPolicy(nn.Module):
    def __init__(self, state_dim=12, action_dim=1):
        super().__init__()
        self.actor = nn.Sequential(
            nn.Linear(state_dim, 64),
            nn.ReLU(),
            nn.Linear(64, action_dim),
            nn.Sigmoid() # Markup scalar [0.0, 1.0]
        )
    def forward(self, market_tensor):
        return self.actor(market_tensor)`
  },
  {
    id: 7,
    title: 'Z-Podcasting High-Concurrency Media Stream (PHP 8 & MySQL)',
    category: 'php',
    language: 'php',
    code: `<?php
// High-concurrency media stream with byte-range chunking
function streamPodcastChunk(PDO $db, string $mediaId, int $start, int $length): void {
    $stmt = $db->prepare("SELECT file_path, mime_type FROM episodes WHERE id = ?");
    $stmt->execute([$mediaId]);
    $episode = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$episode) return;
    
    header("Content-Type: " . $episode['mime_type']);
    header("Accept-Ranges: bytes");
    $fp = fopen($episode['file_path'], 'rb');
    fseek($fp, $start);
    echo fread($fp, $length);
    fclose($fp);
}`
  }
];

function initSnippetManager() {
  const container = document.getElementById('snippetsListContainer');
  const searchInput = document.getElementById('snippetSearchInput');
  const filterBtns = document.querySelectorAll('.snippet-filter-btn');

  if (!container) return;

  let activeCategory = 'all';
  let searchQuery = '';

  function renderSnippets() {
    const filtered = SNIPPET_DATABASE.filter(item => {
      const matchCat = (activeCategory === 'all' || item.category === activeCategory);
      const matchSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.code.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });

    if (filtered.length === 0) {
      container.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 30px;">No code snippets found matching your query.</div>`;
      return;
    }

    container.innerHTML = filtered.map(item => `
      <div class="snippet-item-card">
        <div class="snippet-card-top">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="tech-tag" style="color: var(--neon-cyan);">${item.category.toUpperCase()}</span>
            <span class="snippet-title">${escapeHtml(item.title)}</span>
          </div>
          <button class="btn-copy-code" data-code="${encodeURIComponent(item.code)}">
            Copy Code
          </button>
        </div>
        <pre class="code-display-block"><code>${escapeHtml(item.code)}</code></pre>
      </div>
    `).join('');

    // Attach copy button handlers
    container.querySelectorAll('.btn-copy-code').forEach(btn => {
      btn.addEventListener('click', () => {
        const rawCode = decodeURIComponent(btn.getAttribute('data-code'));
        navigator.clipboard.writeText(rawCode).then(() => {
          const original = btn.textContent;
          btn.textContent = 'Copied! ✨';
          btn.style.borderColor = 'var(--neon-green)';
          btn.style.color = 'var(--neon-green)';
          setTimeout(() => {
            btn.textContent = original;
            btn.style.borderColor = '';
            btn.style.color = '';
          }, 1800);
        });
      });
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      renderSnippets();
    });
  }

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeCategory = btn.getAttribute('data-category');
      renderSnippets();
    });
  });

  renderSnippets();
}

/* ==========================================================================
   6. PROJECT 2: GRAPH & DATA VISUALIZATION STUDIO (HTML5 Canvas)
   ========================================================================== */
let graphAnimId = null;
let graphNodes = [];
let isGraphSimRunning = true;
let draggedNode = null;

function resizeGraphCanvas() {
  const canvas = document.getElementById('graphStudioCanvas');
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * window.devicePixelRatio;
  canvas.height = rect.height * window.devicePixelRatio;
  const ctx = canvas.getContext('2d');
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
}

function initGraphStudio() {
  const canvas = document.getElementById('graphStudioCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const addNodeBtn = document.getElementById('btnAddGraphNode');
  const resetGraphBtn = document.getElementById('btnResetGraph');
  const toggleSimBtn = document.getElementById('btnToggleGraphSim');

  const neonColors = ['#00F0FF', '#FF007A', '#7000FF', '#00FF9D', '#FFD000'];

  function createRandomNode() {
    const rect = canvas.getBoundingClientRect();
    const w = rect.width || 600;
    const h = rect.height || 400;
    return {
      x: 40 + Math.random() * (w - 80),
      y: 40 + Math.random() * (h - 80),
      vx: (Math.random() - 0.5) * 1.8,
      vy: (Math.random() - 0.5) * 1.8,
      radius: 6 + Math.random() * 6,
      color: neonColors[Math.floor(Math.random() * neonColors.length)],
      pulse: Math.random() * Math.PI * 2
    };
  }

  function resetGraph() {
    graphNodes = [];
    for (let i = 0; i < 18; i++) {
      graphNodes.push(createRandomNode());
    }
  }

  resetGraph();
  resizeGraphCanvas();
  window.addEventListener('resize', resizeGraphCanvas);

  // Mouse drag support
  canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    draggedNode = graphNodes.find(n => {
      const dist = Math.hypot(n.x - mouseX, n.y - mouseY);
      return dist <= n.radius + 10;
    });
  });

  window.addEventListener('mousemove', (e) => {
    if (!draggedNode) return;
    const rect = canvas.getBoundingClientRect();
    draggedNode.x = Math.max(10, Math.min(rect.width - 10, e.clientX - rect.left));
    draggedNode.y = Math.max(10, Math.min(rect.height - 10, e.clientY - rect.top));
    draggedNode.vx = 0;
    draggedNode.vy = 0;
  });

  window.addEventListener('mouseup', () => {
    draggedNode = null;
  });

  if (addNodeBtn) {
    addNodeBtn.addEventListener('click', () => {
      graphNodes.push(createRandomNode());
    });
  }

  if (resetGraphBtn) {
    resetGraphBtn.addEventListener('click', resetGraph);
  }

  if (toggleSimBtn) {
    toggleSimBtn.addEventListener('click', () => {
      isGraphSimRunning = !isGraphSimRunning;
      toggleSimBtn.textContent = isGraphSimRunning ? 'Pause Physics' : 'Resume Physics';
    });
  }

  function renderGraphLoop() {
    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    ctx.clearRect(0, 0, width, height);

    // Draw connecting edges
    const maxDistance = 140;
    for (let i = 0; i < graphNodes.length; i++) {
      for (let j = i + 1; j < graphNodes.length; j++) {
        const n1 = graphNodes[i];
        const n2 = graphNodes[j];
        const dx = n2.x - n1.x;
        const dy = n2.y - n1.y;
        const dist = Math.hypot(dx, dy);

        if (dist < maxDistance) {
          const alpha = 1 - (dist / maxDistance);
          ctx.beginPath();
          ctx.moveTo(n1.x, n1.y);
          ctx.lineTo(n2.x, n2.y);
          ctx.strokeStyle = `rgba(0, 240, 255, ${alpha * 0.35})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }

    // Draw and update nodes
    for (let node of graphNodes) {
      if (isGraphSimRunning && node !== draggedNode) {
        node.x += node.vx;
        node.y += node.vy;

        if (node.x <= node.radius || node.x >= width - node.radius) node.vx *= -1;
        if (node.y <= node.radius || node.y >= height - node.radius) node.vy *= -1;
      }

      node.pulse += 0.04;
      const glowSize = node.radius + Math.sin(node.pulse) * 3;

      // Outer glow
      ctx.beginPath();
      ctx.arc(node.x, node.y, glowSize * 1.8, 0, Math.PI * 2);
      ctx.fillStyle = hexToRgba(node.color, 0.2);
      ctx.fill();

      // Node core
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      ctx.fillStyle = node.color;
      ctx.fill();
    }

    graphAnimId = requestAnimationFrame(renderGraphLoop);
  }

  if (graphAnimId) cancelAnimationFrame(graphAnimId);
  renderGraphLoop();
}

/* ==========================================================================
   7. PROJECT 3: PYTHON AST & COMPLEXITY VISUALIZER (Backend Integration)
   ========================================================================== */
const SAMPLE_PYTHON_PRESETS = {
  sorting: `def hybrid_tim_sort(arr: list[int]) -> list[int]:
    """Optimized hybrid sorting routine with insertion threshold."""
    if len(arr) <= 1:
        return arr
    
    threshold = 16
    if len(arr) < threshold:
        for i in range(1, len(arr)):
            key = arr[i]
            j = i - 1
            while j >= 0 and arr[j] > key:
                arr[j + 1] = arr[j]
                j -= 1
            arr[j + 1] = key
        return arr
    return sorted(arr)`,

  graph: `import collections

class NetworkFlowSolver:
    def __init__(self, node_count: int):
        self.adj = collections.defaultdict(list)
        self.capacity = {}
        
    def find_augmenting_path(self, source: int, sink: int) -> list:
        queue = collections.deque([source])
        parents = {source: None}
        while queue:
            curr = queue.popleft()
            if curr == sink:
                break
            for neighbor in self.adj[curr]:
                if neighbor not in parents and self.capacity.get((curr, neighbor), 0) > 0:
                    parents[neighbor] = curr
                    queue.append(neighbor)
        return parents`,

  tft_pricing: `import math

def calculate_dynamic_markup(demand_index: float, supply_ratio: float, elasticity: float = -1.25) -> float:
    """Computes dynamic price multiplier using elastic demand equilibrium."""
    if demand_index <= 0 or supply_ratio <= 0:
        return 1.0
    
    # Calculate market pressure coefficient
    pressure = math.log1p(demand_index) / (supply_ratio ** 0.5)
    
    # Bound adjustment between -15% discount and +45% surge
    raw_adjustment = pressure * (1.0 / abs(elasticity))
    clipped_multiplier = max(0.85, min(1.45, 1.0 + raw_adjustment * 0.1))
    
    return round(clipped_multiplier, 3)`,

  syntax_err: `def broken_matrix_loop():
    # Demonstrating Python SyntaxError interception
    for row in matrix
        print(row)
    return True`
};

function initAstVisualizer() {
  const codeInput = document.getElementById('pythonCodeInput');
  const runBtn = document.getElementById('btnRunAstAnalyze');
  const presetSelect = document.getElementById('astPresetSelect');
  const treeViewer = document.getElementById('astTreeViewer');
  const complexityVal = document.getElementById('metricComplexityVal');
  const miVal = document.getElementById('metricMiVal');
  const locVal = document.getElementById('metricLocVal');
  const execTimeVal = document.getElementById('metricExecTimeVal');
  const statusBadge = document.getElementById('astStatusBadge');

  if (!codeInput || !runBtn) return;

  if (presetSelect) {
    presetSelect.addEventListener('change', () => {
      const selected = presetSelect.value;
      if (SAMPLE_PYTHON_PRESETS[selected]) {
        codeInput.value = SAMPLE_PYTHON_PRESETS[selected];
      }
    });
  }

  runBtn.addEventListener('click', async () => {
    const sourceCode = codeInput.value.trim();
    if (!sourceCode) {
      alert('Please provide Python source code to analyze.');
      return;
    }

    runBtn.disabled = true;
    runBtn.innerHTML = `<span>⚡</span> Analyzing AST...`;
    statusBadge.textContent = 'RUNNING';
    statusBadge.style.color = 'var(--neon-green)';

    try {
      const response = await fetch('execute_python.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: sourceCode })
      });

      if (response.ok) {
        const result = await response.json();
        renderAstResults(result);
      } else {
        const errorData = await response.json().catch(() => null);
        renderAstError(errorData || { message: 'HTTP ' + response.status });
      }
    } catch (networkError) {
      console.warn('Backend unavailable, running client-side simulated AST parser:', networkError);
      // Fallback parser so interactive preview never fails
      const fallbackData = simulateClientAst(sourceCode);
      renderAstResults(fallbackData);
    } finally {
      runBtn.disabled = false;
      runBtn.innerHTML = `<span>⚡</span> Analyze via Python Backend`;
    }
  });

  function renderAstResults(data) {
    if (!data.success) {
      renderAstError(data);
      return;
    }

    const metrics = data.metrics || {};
    const meta = data.runtime_meta || {};

    if (complexityVal) complexityVal.textContent = metrics.cyclomatic_complexity || 1;
    if (miVal) miVal.textContent = `${metrics.maintainability_index || 80}/100`;
    if (locVal) locVal.textContent = `${metrics.logical_loc || 0} / ${metrics.loc || 0}`;
    if (execTimeVal) execTimeVal.textContent = `${meta.execution_ms || 4} ms`;

    if (statusBadge) {
      statusBadge.textContent = metrics.complexity_rating || 'COMPLETED';
      statusBadge.style.color = metrics.complexity_badge_color || 'var(--neon-cyan)';
    }

    if (treeViewer && data.ast_tree) {
      treeViewer.innerHTML = `<div style="color: var(--neon-cyan); margin-bottom: 8px;">// Abstract Syntax Tree (Depth-3 Hierarchy)</div>` +
        renderTreeHtml(data.ast_tree, 0);
    }
  }

  function renderAstError(err) {
    if (statusBadge) {
      statusBadge.textContent = err.error_type || 'Syntax Error';
      statusBadge.style.color = 'var(--neon-pink)';
    }
    if (treeViewer) {
      treeViewer.innerHTML = `
        <div style="color: var(--neon-pink); padding: 10px; background: rgba(255, 0, 122, 0.1); border-radius: 6px; border: 1px solid var(--neon-pink);">
          <strong>🚨 [${escapeHtml(err.error_type || 'Error')}]:</strong> ${escapeHtml(err.message || 'Execution error')}
          ${err.line ? `<br>Line: ${err.line}, Column: ${err.offset || 0}` : ''}
          ${err.text ? `<br><code style="color: #fff; background: #000; padding: 2px 6px; border-radius: 4px;">${escapeHtml(err.text)}</code>` : ''}
        </div>
      `;
    }
  }

  function renderTreeHtml(node, depth) {
    const indent = '&nbsp;&nbsp;'.repeat(depth * 2);
    let html = `<div>${indent}<span style="color: var(--neon-purple); font-weight: 600;">${escapeHtml(node.name)}</span>`;

    if (node.label) {
      html += ` <span style="color: var(--neon-green); font-weight: 500;">"${escapeHtml(node.label)}"</span>`;
    }

    html += `</div>`;

    if (node.children && node.children.length > 0) {
      node.children.forEach(child => {
        html += renderTreeHtml(child, depth + 1);
      });
    }
    return html;
  }

  // Trigger initial analysis on load
  setTimeout(() => {
    if (runBtn) runBtn.click();
  }, 400);
}

function simulateClientAst(code) {
  const lines = code.split('\n');
  const loc = lines.length;
  const logicalLoc = lines.filter(l => l.trim() && !l.trim().startsWith('#')).length;
  const branches = (code.match(/\b(if|elif|else|for|while|try|except)\b/g) || []).length;
  const complexity = Math.max(1, branches + 1);

  return {
    success: true,
    metrics: {
      loc: loc,
      logical_loc: logicalLoc,
      cyclomatic_complexity: complexity,
      complexity_rating: complexity > 6 ? "Moderate Complexity" : "Clean / Low Risk",
      complexity_badge_color: complexity > 6 ? "#7000FF" : "#00F0FF",
      maintainability_index: Math.max(40, 100 - complexity * 5),
    },
    ast_tree: {
      name: "Module",
      children: [
        { name: "FunctionDef", label: "client_parsed_routine", children: [
          { name: "Arguments", children: [] },
          { name: "Body", children: [
            { name: "ControlFlowBranch", label: `${branches} Branch Nodes Identified` },
            { name: "ReturnStatement" }
          ]}
        ]}
      ]
    },
    runtime_meta: {
      execution_ms: 3.2,
      mode: 'Client-Side Simulation (Backend Offline)'
    }
  };
}

/* ==========================================================================
   8. CONTACT FORM INTERACTION (Database Persistence)
   ========================================================================== */
function initContactForm() {
  const form = document.getElementById('contactPortfolioForm');
  const notification = document.getElementById('contactFormNotice');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector('.btn-submit-form');
    const originalText = submitBtn.innerHTML;

    const nameInput = document.getElementById('contactName');
    const emailInput = document.getElementById('contactEmail');
    const scopeInput = document.getElementById('contactScope');
    const messageInput = document.getElementById('contactMessage');

    const formData = {
      name: nameInput ? nameInput.value.trim() : '',
      email: emailInput ? emailInput.value.trim() : '',
      scope: scopeInput ? scopeInput.value : '',
      message: messageInput ? messageInput.value.trim() : ''
    };

    if (!formData.name || !formData.email || !formData.message) {
      if (notification) {
        notification.className = 'form-notification';
        notification.style.display = 'block';
        notification.style.background = 'rgba(255, 0, 122, 0.15)';
        notification.style.borderColor = 'var(--neon-pink)';
        notification.style.color = 'var(--neon-pink)';
        notification.textContent = '⚠️ Please fill out all required fields before sending.';
      }
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span>⏳</span> Ingesting into Database...`;

    try {
      const response = await fetch('contact_submit.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (response.ok && result.status === 'success') {
        form.reset();
        if (notification) {
          notification.className = 'form-notification success';
          notification.style.display = 'block';
          notification.style.background = 'rgba(0, 255, 157, 0.15)';
          notification.style.borderColor = 'var(--neon-green)';
          notification.style.color = 'var(--neon-green)';
          notification.innerHTML = `🚀 <strong>Transmission Received!</strong> Stored in database (Entry #${result.entry_id || 'OK'}). I will respond within 24 hours.`;
          setTimeout(() => {
            notification.style.display = 'none';
          }, 8000);
        }
      } else {
        throw new Error(result.message || 'Submission error');
      }
    } catch (err) {
      if (notification) {
        notification.className = 'form-notification';
        notification.style.display = 'block';
        notification.style.background = 'rgba(255, 0, 122, 0.15)';
        notification.style.borderColor = 'var(--neon-pink)';
        notification.style.color = 'var(--neon-pink)';
        notification.textContent = `⚠️ Error: ${err.message || 'Unable to reach contact endpoint.'}`;
      }
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  });
}

/* ==========================================================================
   HELPER UTILITIES
   ========================================================================== */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function hexToRgba(hex, alpha) {
  let c = hex.substring(1);
  if (c.length === 3) {
    c = c.split('').map(x => x + x).join('');
  }
  const num = parseInt(c, 16);
  return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${alpha})`;
}
