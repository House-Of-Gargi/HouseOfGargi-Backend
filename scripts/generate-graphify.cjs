const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const outDir = path.join(rootDir, 'graphify-out');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// 1. Traverse all relevant backend files
const includeExts = ['.ts', '.js', '.cjs', '.mjs', '.sql', '.json', '.env'];
const ignoreDirs = ['node_modules', 'dist', '.git', 'graphify-out'];

function getAllFiles(dir, fileList = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(rootDir, fullPath).replace(/\\/g, '/');

    if (entry.isDirectory()) {
      if (!ignoreDirs.includes(entry.name)) {
        getAllFiles(fullPath, fileList);
      }
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if (includeExts.includes(ext) || entry.name === '.env') {
        fileList.push({ fullPath, relPath, name: entry.name, ext: ext || '.env' });
      }
    }
  }
  return fileList;
}

const files = getAllFiles(rootDir);

// 2. Classify nodes and communities
function getCommunity(relPath) {
  if (relPath.startsWith('src/routes')) return 'Fastify API Routes';
  if (relPath.startsWith('src/services')) return 'Domain Business Services';
  if (relPath.startsWith('src/plugins')) return 'Security & Auth Guards';
  if (relPath.startsWith('src/db')) return 'Database & Realtime Connectors';
  if (relPath.startsWith('src/config')) return 'Configuration & Env Validation';
  if (relPath.startsWith('src/lib')) return 'Infrastructure & Telemetry';
  if (relPath.startsWith('src/server') || relPath.startsWith('src/app')) return 'Gateway Core & Server Lifecycle';
  if (relPath.startsWith('migrations')) return 'Supabase PostgreSQL Migrations';
  if (relPath.startsWith('test')) return 'Test Suites & Verification';
  if (relPath.startsWith('scripts')) return 'Automation Scripts';
  return 'Configuration & Manifests';
}

function getNodeType(relPath) {
  if (relPath.startsWith('src/routes')) return 'route';
  if (relPath.startsWith('src/services')) return 'service';
  if (relPath.startsWith('src/plugins')) return 'plugin';
  if (relPath.startsWith('src/db')) return 'database';
  if (relPath.startsWith('src/config')) return 'config';
  if (relPath.endsWith('.sql')) return 'migration';
  if (relPath.startsWith('test')) return 'test';
  return 'module';
}

const nodes = [];
const nodeMap = new Map();

for (const file of files) {
  let content = '';
  try {
    content = fs.readFileSync(file.fullPath, 'utf8');
  } catch {
    content = '';
  }
  const lines = content.split('\n').length;
  const community = getCommunity(file.relPath);
  const type = getNodeType(file.relPath);

  // Extract export names
  const exportMatches = content.matchAll(/export\s+(?:default\s+)?(?:function|const|class|interface|type|enum)\s+([a-zA-Z0-9_]+)/g);
  const exports = [];
  for (const m of exportMatches) {
    exports.push(m[1]);
  }

  // Generate a concise description
  let description = `Module ${file.name} in ${community}`;
  if (file.relPath.includes('auth.routes.ts')) description = 'Authentication gateway for patron OTP and administrative email+password sessions';
  else if (file.relPath.includes('super-admin.routes.ts')) description = 'Executive Super Admin governance, admin privileges, password reset, and revenue';
  else if (file.relPath.includes('admin.routes.ts')) description = 'Operations curator dashboard, product approvals, and artisan lifecycle';
  else if (file.relPath.includes('products.routes.ts')) description = 'Curated luxury catalog retrieval, inventory checks, and product searches';
  else if (file.relPath.includes('orders.routes.ts')) description = 'Cart checkout sessions, Razorpay signatures, and patron order tracking';
  else if (file.relPath.includes('seller.routes.ts')) description = 'Artisan guild atelier telemetry, portfolio submissions, and payouts';
  else if (file.relPath.includes('categories.routes.ts')) description = 'Taxonomy, collection management, and storefront banner management';
  else if (file.relPath.includes('bespoke.routes.ts')) description = 'Heritage bespoke couture commission pipeline and artisan proposals';
  else if (file.relPath.includes('auth.service.ts')) description = 'Cryptographic HMAC OTP generation, validation, and Resend email client';
  else if (file.relPath.includes('password.service.ts')) description = 'bcrypt-based password hashing (12 rounds) and default credential verification';
  else if (file.relPath.includes('rbac.service.ts')) description = 'Authoritative multi-tier role resolution with hardcoded founder seeds';
  else if (file.relPath.includes('supabase.ts')) description = 'Supabase client singleton with service role key and WebSocket transport';
  else if (file.relPath.includes('auth.plugin.ts')) description = 'Fastify route decorators (requireRole, authenticate) for RBAC enforcement';
  else if (file.relPath.includes('server.ts')) description = 'Process entrypoint, HTTP server listener, and graceful shutdown handlers';
  else if (file.relPath.includes('app.ts')) description = 'Fastify application factory, Helmet security, rate limiter, and CORS';
  else if (file.relPath.includes('0018_admin_password_auth.sql')) description = 'SQL migration adding password_hash column and seeding default passwords';

  const node = {
    id: file.relPath,
    label: file.name,
    path: file.relPath,
    type,
    community,
    lines,
    size: Math.max(12, Math.min(48, Math.round(Math.sqrt(lines) * 2.5))),
    exports,
    imports: [],
    inDegree: 0,
    outDegree: 0,
    description,
  };

  nodes.push(node);
  nodeMap.set(file.relPath, node);
}

// 3. Resolve edges (Imports and References)
const edges = [];
const edgeSet = new Set();

for (const file of files) {
  let content = '';
  try {
    content = fs.readFileSync(file.fullPath, 'utf8');
  } catch {
    continue;
  }
  const sourceNode = nodeMap.get(file.relPath);

  // Match import statements
  const importMatches = content.matchAll(/from\s+['"]([^'"]+)['"]/g);
  for (const m of importMatches) {
    const importPath = m[1];
    let targetRel = null;

    if (importPath.startsWith('.')) {
      // In ESM, TypeScript imports often use .js extensions in import specifiers
      const resolved = path.normalize(path.join(path.dirname(file.relPath), importPath)).replace(/\\/g, '/');
      const candidateList = [
        resolved,
        resolved.replace(/\.js$/, '.ts'),
        resolved + '.ts',
        resolved + '.js',
        resolved + '/index.ts',
        resolved + '/index.js',
      ];

      for (const candidate of candidateList) {
        if (nodeMap.has(candidate)) {
          targetRel = candidate;
          break;
        }
      }
    }

    if (targetRel && targetRel !== file.relPath) {
      const edgeKey = `${file.relPath}->${targetRel}`;
      if (!edgeSet.has(edgeKey)) {
        edgeSet.add(edgeKey);
        edges.push({
          source: file.relPath,
          target: targetRel,
          type: 'imports',
        });

        sourceNode.imports.push(targetRel);
        sourceNode.outDegree++;
        const targetNode = nodeMap.get(targetRel);
        if (targetNode) targetNode.inDegree++;
      }
    }
  }
}

// 4. Communities mapping & color palette
const communityColors = {
  'Gateway Core & Server Lifecycle': '#7A2331', // Maroon
  'Fastify API Routes': '#C27803',              // Gold / Amber
  'Domain Business Services': '#059669',        // Emerald
  'Security & Auth Guards': '#DC2626',          // Crimson
  'Database & Realtime Connectors': '#0284C7',  // Sky Blue
  'Configuration & Env Validation': '#64748B',  // Slate
  'Infrastructure & Telemetry': '#7C3AED',      // Purple
  'Supabase PostgreSQL Migrations': '#D97706',  // Bronze Amber
  'Test Suites & Verification': '#475569',      // Dark Slate
  'Automation Scripts': '#0891B2',              // Cyan
  'Configuration & Manifests': '#94A3B8',       // Light Slate
};

const communities = {};
for (const node of nodes) {
  if (!communities[node.community]) {
    communities[node.community] = {
      name: node.community,
      color: communityColors[node.community] || '#64748B',
      count: 0,
    };
  }
  communities[node.community].count++;
}

// 5. Generate JSON artifact
const graphData = {
  project: 'House of Gargi - Backend Atelier API Gateway',
  version: '1.0.0',
  generatedAt: new Date().toISOString(),
  metrics: {
    totalFiles: nodes.length,
    totalDependencies: edges.length,
    communitiesCount: Object.keys(communities).length,
  },
  communities,
  nodes,
  edges,
};

fs.writeFileSync(path.join(outDir, 'graph.json'), JSON.stringify(graphData, null, 2), 'utf8');

// 6. Generate GRAPH_REPORT.md
let reportMd = `# House of Gargi Backend — System Topology & Architectural Graph (Graphify)\n\n`;
reportMd += `> Generated on ${new Date().toUTCString()} | Total Modules: **${nodes.length}** | Total Dependencies: **${edges.length}**\n\n`;
reportMd += `## Community Cluster Metrics\n\n`;
reportMd += `| Architectural Tier | Modules Count | Primary Responsibility |\n`;
reportMd += `| :--- | :---: | :--- |\n`;

for (const [name, comm] of Object.entries(communities)) {
  reportMd += `| **${name}** | \`${comm.count}\` | Clustered subsystems in ${name} |\n`;
}

reportMd += `\n## Top Hub Modules (Highest Degrees)\n\n`;
const topHubs = [...nodes].sort((a, b) => (b.inDegree + b.outDegree) - (a.inDegree + a.outDegree)).slice(0, 10);
reportMd += `| Module | In-Degree (Dependents) | Out-Degree (Dependencies) | Community |\n`;
reportMd += `| :--- | :---: | :---: | :--- |\n`;
for (const hub of topHubs) {
  reportMd += `| \`${hub.id}\` | ${hub.inDegree} | ${hub.outDegree} | ${hub.community} |\n`;
}

reportMd += `\n## Complete Component Inventory\n\n`;
for (const [commName] of Object.entries(communities)) {
  reportMd += `### ${commName}\n\n`;
  const commNodes = nodes.filter(n => n.community === commName);
  for (const n of commNodes) {
    reportMd += `- **\`${n.id}\`** (${n.lines} lines) — *${n.description}* [In: ${n.inDegree}, Out: ${n.outDegree}]\n`;
  }
  reportMd += `\n`;
}

fs.writeFileSync(path.join(outDir, 'GRAPH_REPORT.md'), reportMd, 'utf8');
fs.writeFileSync(path.join(rootDir, 'GRAPHIFY.md'), reportMd, 'utf8');

// 7. Generate Interactive HTML Graph View
const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>House of Gargi Backend — Graphify System Map</title>
  <script type="text/javascript" src="https://unpkg.com/vis-network/standalone/umd/vis-network.min.js"></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0F172A; color: #E2E8F0; display: flex; height: 100vh; overflow: hidden; }
    #sidebar { width: 340px; background: #1E293B; border-right: 1px solid #334155; display: flex; flex-direction: column; z-index: 10; }
    #header { padding: 16px 20px; border-bottom: 1px solid #334155; }
    #header h1 { font-size: 17px; font-weight: 700; color: #F8FAFC; margin-bottom: 4px; }
    #header p { font-size: 12px; color: #94A3B8; }
    #controls { padding: 12px 20px; border-bottom: 1px solid #334155; display: flex; flex-direction: column; gap: 10px; }
    #search { width: 100%; padding: 8px 12px; border-radius: 6px; border: 1px solid #475569; background: #0F172A; color: #F8FAFC; font-size: 13px; outline: none; }
    #search:focus { border-color: #38BDF8; }
    #community-filter { width: 100%; padding: 8px 12px; border-radius: 6px; border: 1px solid #475569; background: #0F172A; color: #F8FAFC; font-size: 13px; outline: none; }
    #sidebar-content { flex: 1; overflow-y: auto; padding: 20px; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; text-transform: uppercase; margin-bottom: 8px; }
    .node-title { font-size: 18px; font-weight: 700; color: #F8FAFC; margin-bottom: 4px; word-break: break-all; }
    .node-path { font-size: 11px; color: #94A3B8; font-family: monospace; margin-bottom: 12px; word-break: break-all; }
    .node-desc { font-size: 13px; color: #CBD5E1; line-height: 1.5; margin-bottom: 16px; background: #0F172A; padding: 10px; border-radius: 6px; border: 1px solid #334155; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 16px; }
    .meta-box { background: #0F172A; padding: 8px 12px; border-radius: 6px; border: 1px solid #334155; }
    .meta-box span { font-size: 10px; text-transform: uppercase; color: #64748B; font-weight: 700; display: block; }
    .meta-box strong { font-size: 15px; color: #F8FAFC; }
    .section-head { font-size: 12px; font-weight: 700; text-transform: uppercase; color: #94A3B8; margin: 16px 0 8px 0; }
    .link-pill { display: block; padding: 6px 10px; background: #0F172A; border: 1px solid #334155; border-radius: 4px; font-size: 12px; color: #38BDF8; text-decoration: none; margin-bottom: 6px; cursor: pointer; word-break: break-all; }
    .link-pill:hover { background: #1E293B; border-color: #38BDF8; }
    #network-container { flex: 1; height: 100%; position: relative; }
    #network { width: 100%; height: 100%; }
    .legend { position: absolute; bottom: 20px; right: 20px; background: rgba(30, 41, 59, 0.9); backdrop-filter: blur(8px); border: 1px solid #334155; border-radius: 8px; padding: 12px 16px; max-width: 280px; z-index: 5; }
    .legend-title { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #94A3B8; margin-bottom: 8px; }
    .legend-item { display: flex; alignItems: center; gap: 8px; font-size: 11px; margin-bottom: 4px; color: #E2E8F0; }
    .legend-color { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
    .btn-reset { padding: 6px 12px; border-radius: 4px; background: #334155; border: none; color: #F8FAFC; font-size: 12px; cursor: pointer; }
    .btn-reset:hover { background: #475569; }
  </style>
</head>
<body>
  <div id="sidebar">
    <div id="header">
      <h1>House of Gargi Backend</h1>
      <p>Fastify Enterprise API Gateway • Graphify Topology</p>
    </div>
    <div id="controls">
      <input type="text" id="search" placeholder="Search module, route, or file..." />
      <select id="community-filter">
        <option value="all">All Tiers (${nodes.length} Modules)</option>
        ${Object.keys(communities).map(c => `<option value="${c}">${c} (${communities[c].count})</option>`).join('')}
      </select>
      <button class="btn-reset" id="reset-zoom">Reset Viewport & Zoom</button>
    </div>
    <div id="sidebar-content">
      <p style="color: #94A3B8; font-size: 13px;">Click on any module or cluster node to inspect imports, routes, and connections.</p>
    </div>
  </div>

  <div id="network-container">
    <div id="network"></div>
    <div class="legend">
      <div class="legend-title">Architectural Clusters</div>
      ${Object.keys(communities).map(c => `
        <div class="legend-item">
          <div class="legend-color" style="background:${communityColors[c] || '#64748B'}"></div>
          <span>${c}</span>
        </div>
      `).join('')}
    </div>
  </div>

  <script>
    const graphData = ${JSON.stringify(graphData)};
    const communityColors = ${JSON.stringify(communityColors)};

    const visNodes = new vis.DataSet(graphData.nodes.map(n => ({
      id: n.id,
      label: n.label,
      title: n.id,
      value: n.size,
      color: {
        background: communityColors[n.community] || '#64748B',
        border: '#FFFFFF',
        highlight: { background: '#38BDF8', border: '#FFFFFF' }
      },
      font: { color: '#F8FAFC', size: 12, face: 'system-ui' },
      borderWidth: 1,
      shadow: true
    })));

    const visEdges = new vis.DataSet(graphData.edges.map(e => ({
      from: e.source,
      to: e.target,
      arrows: 'to',
      color: { color: 'rgba(148, 163, 184, 0.25)', highlight: '#38BDF8' },
      smooth: { type: 'continuous' }
    })));

    const container = document.getElementById('network');
    const data = { nodes: visNodes, edges: visEdges };
    const options = {
      nodes: { shape: 'dot', scaling: { min: 8, max: 32 } },
      edges: { width: 1.2 },
      physics: {
        forceAtlas2Based: {
          gravitationalConstant: -36,
          centralGravity: 0.005,
          springLength: 85,
          springConstant: 0.16
        },
        maxVelocity: 50,
        solver: 'forceAtlas2Based',
        timestep: 0.35,
        stabilization: { iterations: 150 }
      },
      interaction: { hover: true, tooltipDelay: 100 }
    };

    const network = new vis.Network(container, data, options);

    function showNodeDetails(id) {
      const node = graphData.nodes.find(n => n.id === id);
      if (!node) return;

      const incoming = graphData.edges.filter(e => e.target === id).map(e => e.source);
      const outgoing = graphData.edges.filter(e => e.source === id).map(e => e.target);

      const color = communityColors[node.community] || '#64748B';
      let html = \`
        <span class="badge" style="background: \${color}; color: #FFFFFF">\${node.community}</span>
        <div class="node-title">\${node.label}</div>
        <div class="node-path">\${node.id}</div>
        <div class="node-desc">\${node.description}</div>
        <div class="meta-grid">
          <div class="meta-box"><span>Lines of Code</span><strong>\${node.lines}</strong></div>
          <div class="meta-box"><span>Node Tier</span><strong>\${node.type.toUpperCase()}</strong></div>
          <div class="meta-box"><span>Used By</span><strong>\${incoming.length} modules</strong></div>
          <div class="meta-box"><span>Depends On</span><strong>\${outgoing.length} modules</strong></div>
        </div>
        <div class="section-head">Dependents (\${incoming.length})</div>
        \${incoming.length ? incoming.map(src => \`<a class="link-pill" onclick="selectNode('\${src}')">\${src}</a>\`).join('') : '<p style="color:#64748B; font-size:12px;">No incoming dependents</p>'}
        <div class="section-head">Dependencies (\${outgoing.length})</div>
        \${outgoing.length ? outgoing.map(tgt => \`<a class="link-pill" onclick="selectNode('\${tgt}')">\${tgt}</a>\`).join('') : '<p style="color:#64748B; font-size:12px;">None (Leaf Module)</p>'}
      \`;

      document.getElementById('sidebar-content').innerHTML = html;
    }

    window.selectNode = function(id) {
      network.selectNodes([id]);
      network.focus(id, { scale: 1.2, animation: true });
      showNodeDetails(id);
    };

    network.on('click', function(params) {
      if (params.nodes.length > 0) {
        showNodeDetails(params.nodes[0]);
      }
    });

    document.getElementById('search').addEventListener('input', function(e) {
      const q = e.target.value.toLowerCase().trim();
      if (!q) return;
      const match = graphData.nodes.find(n => n.id.toLowerCase().includes(q) || n.label.toLowerCase().includes(q));
      if (match) {
        selectNode(match.id);
      }
    });

    document.getElementById('community-filter').addEventListener('change', function(e) {
      const comm = e.target.value;
      if (comm === 'all') {
        visNodes.update(graphData.nodes.map(n => ({ id: n.id, hidden: false })));
      } else {
        visNodes.update(graphData.nodes.map(n => ({ id: n.id, hidden: n.community !== comm })));
      }
      network.fit({ animation: true });
    });

    document.getElementById('reset-zoom').addEventListener('click', function() {
      network.fit({ animation: true });
    });
  </script>
</body>
</html>
`;

fs.writeFileSync(path.join(outDir, 'graph.html'), htmlContent, 'utf8');

console.log('Graphify output for House of Gargi Backend generated successfully:');
console.log('  -> ' + path.join(outDir, 'graph.json'));
console.log('  -> ' + path.join(outDir, 'GRAPH_REPORT.md'));
console.log('  -> ' + path.join(outDir, 'graph.html'));
console.log(`Total nodes: ${nodes.length}, Total edges: ${edges.length}, Communities: ${Object.keys(communities).length}`);
