const { exec } = require("child_process");

let currentCommit = ""; // Store the current commit hash

// Function to get the latest commit hash
const getLatestCommit = () => {
  return new Promise((resolve, reject) => {
    exec("git rev-parse HEAD", (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve(stdout.trim());
      }
    });
  });
};

// Function to pull the latest changes from the remote repository
const pullLatestChanges = () => {
  return new Promise((resolve, reject) => {
    exec("git pull", (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        // Check if the stdout contains "Already up to date"
        if (stdout.includes("Already up to date")) {
          resolve("updated"); // Resolve with "updated" if already up to date
        } else {
          resolve(stdout.trim()); // Resolve with the standard output if changes were pulled
        }
      }
    });
  });
};

// Function to check if the latest commit is greater than the current commit and pull changes if needed
const checkAndPullChanges = async () => {
  try {
    const latestCommit = await getLatestCommit();
    if (latestCommit > currentCommit) {
      const result = await pullLatestChanges();
      if (result === "updated") {
      } else {
        currentCommit = latestCommit;
        console.log("Pulled latest changes");
      }
    }
  } catch (error) {
    console.error("Error:", error);
  }
};

module.exports = {
  checkAndPullChanges,
};
