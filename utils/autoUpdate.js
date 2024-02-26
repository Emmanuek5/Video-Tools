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
        resolve(stdout.trim());
      }
    });
  });
};

// Function to check if the latest commit is greater than the current commit and pull changes if needed
const checkAndPullChanges = async () => {
  try {
    const latestCommit = await getLatestCommit();
    if (latestCommit > currentCommit) {
      await pullLatestChanges();
      currentCommit = latestCommit;
      console.log("Pulled latest changes");
    }
  } catch (error) {
    console.error("Error:", error);
  }
};

module.exports = {
  checkAndPullChanges,
};
