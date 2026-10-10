function encodePath(path) {
  return path.split("/").map(encodeURIComponent).join("/");
}

export function createTranslationSource({ baseUrl, fetchImpl = globalThis.fetch }) {
  const base = baseUrl.replace(/\/+$/, "");

  async function request(path) {
    const url = `${base}/${encodePath(path)}`;
    const response = await fetchImpl(url);
    if (!response.ok) {
      throw new Error(`Translation ${response.status} (${url})`);
    }
    return response;
  }

  return {
    async readManifest() {
      const response = await request("manifest.json");
      return response.json();
    },

    async readFile(path) {
      const response = await request(path);
      return response.text();
    }
  };
}
