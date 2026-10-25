/**
 * tests/mocks/next-headers.cjs
 */
let currentCookieJar = globalThis.__tda_mock_cookie_jar || null;

function setMockCookieJar(jar) {
  currentCookieJar = jar;
  globalThis.__tda_mock_cookie_jar = jar;
}

async function cookies() {
  const jar = currentCookieJar || globalThis.__tda_mock_cookie_jar;
  if (jar) return jar;
  return {
    get: () => undefined,
    set: () => {},
    delete: () => {},
  };
}

async function headers() {
  return new Headers();
}

module.exports = {
  cookies,
  headers,
  setMockCookieJar,
};
