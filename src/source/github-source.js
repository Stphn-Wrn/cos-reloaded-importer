const API = "https://api.github.com/repos";
const RAW = "https://raw.githubusercontent.com";
const IMAGE = /\.(png|jpe?g|webp|gif)$/i;
const MARKDOWN = /\.md$/i;

function encodePath(path) {
  return path.split("/").map(encodeURIComponent).join("/");
}

export function createGithubSource({ owner, repo, branch, fetchImpl = globalThis.fetch }) {
  const apiBase = `${API}/${owner}/${repo}`;

  async function request(url) {
    const response = await fetchImpl(url);
    if (!response.ok) {
      throw new Error(`GitHub ${response.status} (${url})`);
    }
    return response;
  }

  async function getJson(url) {
    const response = await request(url);
    return response.json();
  }

  return {
    repositoryUrl: `https://github.com/${owner}/${repo}`,

    async latestCommit() {
      const commit = await getJson(`${apiBase}/commits/${branch}`);
      return { sha: commit.sha, date: commit.commit.committer.date };
    },

    async listFiles(sha) {
      const { tree } = await getJson(`${apiBase}/git/trees/${sha}?recursive=1`);
      const blobs = tree.filter((entry) => entry.type === "blob").map((entry) => entry.path);
      return {
        markdown: blobs.filter((path) => MARKDOWN.test(path)),
        images: blobs.filter((path) => IMAGE.test(path))
      };
    },

    async changedFiles(baseSha, headSha) {
      const comparison = await getJson(`${apiBase}/compare/${baseSha}...${headSha}`);
      return comparison.files.map((file) => file.filename).filter((path) => MARKDOWN.test(path));
    },

    fileUrl(sha, path) {
      return `${RAW}/${owner}/${repo}/${sha}/${encodePath(path)}`;
    },

    async readFile(sha, path) {
      const response = await request(this.fileUrl(sha, path));
      return response.text();
    }
  };
}
