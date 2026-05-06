const { execFile } = require("child_process");
const fs = require("fs");
const path = require("path");

class Downloader {

    constructor() {
        this.outputDir = "/tmp/downloads";

        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }
    }

    download(link) {
        if (!link) {
            return Promise.reject(new Error("Download link is required"));
        }

        let referer = "https://www.youtube.com/";
        if (link.includes("instagram.com")) {
            referer = "https://www.instagram.com/";
        }

        const args = [
            "--js-runtimes", "node",
            "--no-check-certificate",
            "--no-cache-dir",
            "--user-agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
            "--referer", referer,
            "--add-header", "Accept-Language:en-US,en;q=0.9",
            "--restrict-filenames",
            "--merge-output-format", "mp4",
            "--sleep-interval", "2",
            "--max-sleep-interval", "5",
            "--print", "after_move:filepath",
            "-o", `${this.outputDir}/video_%(id)s.%(ext)s`,
            link
        ];

        return new Promise((resolve, reject) => {

            execFile("yt-dlp", args, { maxBuffer: 1024 * 1024 * 20 }, (error, stdout, stderr) => {

                console.log("STDOUT:", stdout);
                console.log("STDERR:", stderr);
                if (stderr.includes("Sign in to confirm you’re not a bot")) {
                    return reject(new Error("YouTube blocked this request (bot detection). Try another video or run locally."));
                }

                if (error) {
                    return reject(new Error(stderr || error.message));
                }

                const filePath = stdout.trim().split("\n").pop();

                if (!filePath) {
                    return reject(new Error("No file downloaded"));
                }

                if (!fs.existsSync(filePath)) {
                    return reject(new Error("File not found after download"));
                }

                resolve({
                    message: "Download completed",
                    filePath: filePath
                });
            });
        });
    }
}

module.exports = new Downloader();