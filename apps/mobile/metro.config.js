const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(projectRoot);

// Monorepo: watch root node_modules for hoisted deps
config.watchFolders = [monorepoRoot];

// Monorepo: resolve packages from both local and root node_modules
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// Transformer
config.transformer = {
  ...config.transformer,
  minifierPath: 'metro-minify-terser',
  minifierConfig: {
    compress: {
      drop_console: process.env.NODE_ENV === 'production',
    },
  },
};

// Resolver
config.resolver = {
  ...config.resolver,
  sourceExts: ['js', 'jsx', 'ts', 'tsx', 'json', 'cjs', 'mjs'],
  blockList: [
    /\.git\/.*/,
    /android\/.*\/build\/.*/,
    /\.expo\/.*/,
  ],
  unstable_enablePackageExports: true,
};

// === Sync Status Middleware ===
// Intercepts .bundle requests to track bundling state,
// and exposes GET /sync-status endpoint for DevOverlay + Claude diagnostics.
let syncState = { bundling: false, lastStatus: null, lastTime: null };
function getSyncState() { return syncState; }
function onBundleStart() { syncState = { bundling: true, lastStatus: null, lastTime: Date.now() }; }
function onBundleDone(status) { syncState = { bundling: false, lastStatus: status, lastTime: Date.now() }; }

const originalMiddleware = config.server?.enhanceMiddleware;
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware, metroServer) => {
    let enhanced = middleware;
    if (originalMiddleware) {
      enhanced = originalMiddleware(middleware, metroServer);
    }
    return (req, res, next) => {
      // Sync status endpoint
      if (req.url === '/sync-status') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(getSyncState()));
        return;
      }

      // Monorepo fix: rewrite /index.bundle → /apps/mobile/index.bundle
      // Metro resolves from the workspace root, but the Dev Client requests /index.bundle.
      if (req.url && req.url.startsWith('/index.bundle')) {
        req.url = '/apps/mobile' + req.url;
      }

      // Windows bundling fixes:
      // 1. Strip multipart/mixed Accept header → force plain JS response
      //    (avoids MultipartStreamReader parsing issues on Windows)
      // 2. Disable chunked encoding → OkHttp ProtocolException (0xd) fix
      if (req.url && req.url.includes('.bundle')) {
        onBundleStart();
        // Force plain application/javascript response (no multipart wrapping)
        if (req.headers.accept) {
          req.headers.accept = req.headers.accept
            .replace(/multipart\/mixed\s*,?\s*/g, '')
            .replace(/,\s*$/, '') || '*/*';
        }
        res.useChunkedEncodingByDefault = false;
        res.chunkedEncoding = false;
        res.on('finish', () => {
          onBundleDone(res.statusCode || 200);
        });
      }

      enhanced(req, res, next);
    };
  },
};

module.exports = config;
