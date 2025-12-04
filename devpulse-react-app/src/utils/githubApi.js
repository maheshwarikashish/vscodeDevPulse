export const fetchCommits = async (username, repo) => {
  if (!username || !repo) {
    return [];
  }

  try {
    const response = await fetch(`https://api.github.com/repos/${username}/${repo}/commits`);
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
    }
    const data = await response.json();
    return data.map(commit => ({
      sha: commit.sha,
      message: commit.commit.message,
      date: new Date(commit.commit.author.date),
      author: commit.commit.author.name,
    }));
  } catch (error) {
    console.error("Error fetching commits:", error);
    return [];
  }
};

