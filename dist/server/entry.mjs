import { renderers } from './renderers.mjs';
import { c as createExports, s as serverEntrypointModule } from './chunks/_@astrojs-ssr-adapter_DklmoWrk.mjs';
import { manifest } from './manifest_DMNT9wJd.mjs';

const serverIslandMap = new Map();;

const _page0 = () => import('./pages/_image.astro.mjs');
const _page1 = () => import('./pages/404.astro.mjs');
const _page2 = () => import('./pages/agb.astro.mjs');
const _page3 = () => import('./pages/api/keystatic/_---params_.astro.mjs');
const _page4 = () => import('./pages/datenschutz.astro.mjs');
const _page5 = () => import('./pages/en/404.astro.mjs');
const _page6 = () => import('./pages/en/imprint.astro.mjs');
const _page7 = () => import('./pages/en/privacy.astro.mjs');
const _page8 = () => import('./pages/en/terms.astro.mjs');
const _page9 = () => import('./pages/en/_---slug_.astro.mjs');
const _page10 = () => import('./pages/impressum.astro.mjs');
const _page11 = () => import('./pages/keystatic/_---params_.astro.mjs');
const _page12 = () => import('./pages/index.astro.mjs');
const _page13 = () => import('./pages/_---slug_.astro.mjs');
const pageMap = new Map([
    ["node_modules/.pnpm/astro@5.17.3_@types+node@25.3.0_idb-keyval@6.2.2_jiti@1.21.7_rollup@4.57.1_typescript@5.9.3_yaml@2.8.2/node_modules/astro/dist/assets/endpoint/node.js", _page0],
    ["src/pages/404.astro", _page1],
    ["src/pages/agb.astro", _page2],
    ["node_modules/.pnpm/@keystatic+astro@5.0.6_@keystatic+core@0.5.48_next@16.1.6_@babel+core@7.29.0_@opentelem_f588a7d46a16f61d33f37bf9f70d850a/node_modules/@keystatic/astro/internal/keystatic-api.js", _page3],
    ["src/pages/datenschutz.astro", _page4],
    ["src/pages/en/404.astro", _page5],
    ["src/pages/en/imprint.astro", _page6],
    ["src/pages/en/privacy.astro", _page7],
    ["src/pages/en/terms.astro", _page8],
    ["src/pages/en/[...slug].astro", _page9],
    ["src/pages/impressum.astro", _page10],
    ["node_modules/.pnpm/@keystatic+astro@5.0.6_@keystatic+core@0.5.48_next@16.1.6_@babel+core@7.29.0_@opentelem_f588a7d46a16f61d33f37bf9f70d850a/node_modules/@keystatic/astro/internal/keystatic-astro-page.astro", _page11],
    ["src/pages/index.astro", _page12],
    ["src/pages/[...slug].astro", _page13]
]);

const _manifest = Object.assign(manifest, {
    pageMap,
    serverIslandMap,
    renderers,
    actions: () => import('./noop-entrypoint.mjs'),
    middleware: () => import('./_noop-middleware.mjs')
});
const _args = {
    "mode": "standalone",
    "client": "file:///home/wunluv/DEV/eosclub/dist/client/",
    "server": "file:///home/wunluv/DEV/eosclub/dist/server/",
    "host": "127.0.0.1",
    "port": 4321,
    "assets": "_astro",
    "experimentalStaticHeaders": false
};
const _exports = createExports(_manifest, _args);
const handler = _exports['handler'];
const startServer = _exports['startServer'];
const options = _exports['options'];
const _start = 'start';
if (Object.prototype.hasOwnProperty.call(serverEntrypointModule, _start)) {
	serverEntrypointModule[_start](_manifest, _args);
}

export { handler, options, pageMap, startServer };
