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
    console.log(`Latest commit: ${latestCommit}`);

    if (latestCommit > currentCommit) {
      console.log("Latest commit is greater than current commit!");
      await pullLatestChanges();
      currentCommit = latestCommit;
      console.log("Pulled latest changes");
    } else {
      console.log("Latest commit is not greater than current commit.");
    }
  } catch (error) {
    console.error("Error:", error);
  }
};

// Run checkAndPullChanges every 5 seconds
setInterval(checkAndPullChanges, 5000);
