const fs = require("fs");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Function to find the command with the closest name
function findClosestCommand(typedCommand) {
  let minDistance = Infinity;
  let closestCommand = null;
  for (const cmd of commands) {
    let distance = levenshteinDistance(typedCommand, cmd.name);
    if (cmd.aliases) {
      for (const alias of cmd.aliases) {
        let aliasDistance = levenshteinDistance(typedCommand, alias);
        if (aliasDistance < distance) {
          distance = aliasDistance;
        }
      }
    }
    if (distance < minDistance) {
      minDistance = distance;
      closestCommand = cmd;
    }
  }
  return closestCommand;
}

// Function to calculate Levenshtein distance
function levenshteinDistance(s1, s2) {
  const m = s1.length;
  const n = s2.length;
  let dp = Array.from(Array(m + 1), () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) {
    for (let j = 0; j <= n; j++) {
      if (i === 0) {
        dp[i][j] = j;
      } else if (j === 0) {
        dp[i][j] = i;
      } else if (s1[i - 1] === s2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i][j - 1], dp[i - 1][j], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
}

function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  const formattedHours = String(hours).padStart(2, "0");
  const formattedMinutes = String(minutes).padStart(2, "0");
  const formattedSeconds = String(remainingSeconds).padStart(2, "0");

  return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
}

function download(url, path) {
  return new Promise((resolve, reject) => {
    //use fetch to download the file
    fetch(url)
      .then((response) => {
        return response.blob();
      })
      .then((blob) => {
        // Convert blob to buffer
        const reader = blob.stream().getReader();

        // Read data from the blob as chunks
        return new Promise((resolve, reject) => {
          const chunks = [];
          reader.read().then(function processChunk({ done, value }) {
            if (done) {
              resolve(Buffer.concat(chunks));
              return;
            }
            chunks.push(value);
            return reader.read().then(processChunk);
          });
        });
      })
      .then((buffer) => {
        fs.writeFileSync(path, buffer);
        resolve(path);
        return path;
      });
  });
}

module.exports = {
  sleep,
  findClosestCommand,
  levenshteinDistance,
  formatTime,
  download,
};
