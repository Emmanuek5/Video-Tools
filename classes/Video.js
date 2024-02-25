const { spawn, exec } = require("child_process");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const ffmpeg = require("fluent-ffmpeg");
ffmpeg.setFfmpegPath(ffmpegPath);
const { createWriteStream } = require("fs");
const archiver = require("archiver");
const { formatTime } = require("../utils/functions");
const path = require("path");
const fs = require("fs");

class Video {
  constructor() {
    this.file = "";
    this.name = "";
    this.subtitles = "";
    this.duration = 0;
    this.clips = [];
    this.cuts = [];
  }

  setName(name) {
    this.name = name;
  }

  setDuration(duration) {
    this.duration = duration;
  }

  setFile(path) {
    this.file = path;
  }

  setSubtitles(path) {
    this.subtitles = path;
  }

  download(url) {
    return new Promise((resolve, reject) => {
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
          if (!fs.existsSync(this.file)) {
            fs.mkdirSync(path.dirname(this.file), { recursive: true });
          }

          fs.writeFileSync(this.file, buffer);
          resolve(this.file);
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  async cut(start, dur, outputFileName, progressCallback = () => {}) {
    return new Promise((resolve, reject) => {
      const command = ffmpeg(this.file)
        .setStartTime(start)
        .setDuration(dur)
        .output(outputFileName)
        .on("progress", (progress) => {
          // Calculate percentage completion and call the progress callback
          const percentComplete = Math.min(
            Math.round((progress.percent / 100) * 100),
            100
          ); // Ensure the progress is between 0 and 100
          progressCallback(percentComplete);
        })
        .on("end", () => {
          this.cuts.push({
            start,
            dur,
            outputFileName,
          });
          resolve();
        })
        .on("error", (err) => {
          reject(err);
        });

      command.run();
    });
  }

  async clip(numberOfParts, duration, progressCallback = () => {}) {
    this.duration = duration;
    const partDuration = Math.floor(this.duration / numberOfParts);
    const maxFileSize = 25 * 1024 * 1024; // 25MB in bytes
    const maxNumberOfVideosPerZip = Math.ceil(
      maxFileSize / (numberOfParts * partDuration * 100)
    ); // Maximum number of videos per zip

    const promises = [];
    const videos = [];
    let completedParts = 0;

    for (let i = 0; i < numberOfParts; i++) {
      const startTime = formatTime(i * partDuration);
      const partFile = path.join(
        process.cwd(),
        "data",
        "videos",
        "clip",
        `${Date.now()}_${this.name}_part${i + 1}.mp4`
      );
      if (!fs.existsSync(path.dirname(partFile))) {
        fs.mkdirSync(path.dirname(partFile), { recursive: true });
      }

      videos.push(partFile);
      promises.push(this.cut(startTime, partDuration, partFile));
    }

    await Promise.all(
      promises.map((promise) =>
        promise.then(() => {
          completedParts++;
          const totalProgress = (completedParts / numberOfParts) * 100;
          progressCallback(totalProgress);
        })
      )
    );

    // Split videos into smaller groups based on maxNumberOfVideosPerZip
    const videoGroups = [];
    for (let i = 0; i < videos.length; i += maxNumberOfVideosPerZip) {
      videoGroups.push(videos.slice(i, i + maxNumberOfVideosPerZip));
    }

    // Create multiple zip files if needed
    const zipFilePaths = [];
    for (let i = 0; i < videoGroups.length; i++) {
      const zipFilePath = path.join(
        process.cwd(),
        "data",
        "videos",
        "zips",
        `${this.name}_clipped_${i + 1}.zip`
      );
      const output = createWriteStream(zipFilePath);
      const archive = archiver("zip");

      archive.on("error", (err) => {
        throw err;
      });

      archive.pipe(output);

      videoGroups[i].forEach((video) => {
        const fileName = path.basename(video);
        archive.file(video, { name: fileName });
      });

      await new Promise((resolve, reject) => {
        output.on("close", () => {
          zipFilePaths.push(zipFilePath);
          resolve();
        });
        archive.finalize();
      });
    }

    return zipFilePaths;
  }

  /**
   * Add subtitles to the video.
   * The Subtitles should be defined using the setSubtitles method.
   * @param {string} outputFilePath - Path to save the video with subtitles.
   * @return {Promise<string>} A promise that resolves with the path to the video with subtitles.
   */
  async addSubtitles(outputFilePath) {
    if (!this.file || !fs.existsSync(this.file)) {
      throw new Error("Video file not provided or not found");
    }
    if (!this.subtitles || !fs.existsSync(this.subtitles)) {
      throw new Error("Subtitle file not provided or not found");
    }

    return new Promise((resolve, reject) => {
      const subtitlesFileName = path.basename(this.subtitles);

      ffmpeg(this.file)
        .videoFilters(`subtitles=${subtitlesFileName}`)
        .output(outputFilePath)
        .on("end", () => {
          resolve(outputFilePath);
        })
        .on("error", (err) => {
          reject(err);
        })
        .run();
    });
  }

  delete() {
    if (fs.existsSync(this.file)) {
      fs.unlinkSync(this.file);
    }
    this.clips.forEach((clip) => {
      if (fs.existsSync(clip.file)) {
        fs.unlinkSync(clip.file);
      }
    });
    if (fs.existsSync(this.subtitles)) {
      fs.unlinkSync(this.subtitles);
    }
  }
}

module.exports = Video;
