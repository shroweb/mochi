// Shim for the TanStack Start virtual module that wrangler can't resolve.
// The Vite build injects real head scripts; the Worker bundler just needs
// something importable here — an empty array is the correct fallback.
const scripts: string[] = [];
export default scripts;
