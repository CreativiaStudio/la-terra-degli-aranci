/**
 * tests/mocks/next-cache.cjs
 */
if (!globalThis.__tda_revalidated_paths) {
  globalThis.__tda_revalidated_paths = [];
}
const revalidatedPaths = globalThis.__tda_revalidated_paths;

function revalidatePath(path) {
  revalidatedPaths.push(path);
}

function revalidateTag(tag) {}

function unstable_cache(fn) {
  return fn;
}

function unstable_noStore() {}

module.exports = {
  revalidatePath,
  revalidateTag,
  unstable_cache,
  unstable_noStore,
  revalidatedPaths,
};
