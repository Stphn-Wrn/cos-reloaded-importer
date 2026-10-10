const ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

function cyrb53(text, seed) {
  let h1 = 0xdeadbeef ^ seed;
  let h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ code, 2654435761);
    h2 = Math.imul(h2 ^ code, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

function toBase62(value, length) {
  let remaining = value;
  let result = "";
  for (let i = 0; i < length; i++) {
    result = ALPHABET[remaining % 62] + result;
    remaining = Math.floor(remaining / 62);
  }
  return result;
}

export function documentId(key) {
  return toBase62(cyrb53(key, 1), 8) + toBase62(cyrb53(key, 2), 8);
}

export function contentHash(text) {
  return cyrb53(text, 0).toString(16);
}

export function folderIdFor(folderPath) {
  return documentId(`folder:${folderPath}`);
}

export function journalIdFor(document) {
  return documentId(`journal:${document.path}`);
}

export function pageIdFor(section) {
  return documentId(`page:${section.key}`);
}
