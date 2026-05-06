const { execFile } = require("child_process");
const fs = require("fs");
const path = require("path");

class Downloader {
    constructor() {
        this.outputDir = "/tmp/downloads";
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }
        this.cookiesPath = path.resolve(
            process.env.YT_COOKIES_PATH || "./src/tmp/cookies.txt"
        );
        if (!fs.existsSync(this.cookiesPath)) {
            console.warn("⚠️ Cookies file not found:", this.cookiesPath);
        } else {
            console.log("🍪 Cookies loaded from:", this.cookiesPath);
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
            "--cookies", this.cookiesPath,
            "--no-check-certificate",
            "--no-cache-dir",
            "--force-ipv4",
            "--concurrent-fragments", "1",
            "--user-agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
            "--referer", referer,
            "--add-header", "Accept-Language:en-US,en;q=0.9",
            "--extractor-args", "youtube:player_client=android,web",
            "--restrict-filenames",
            "--merge-output-format", "mp4",
            "--sleep-interval", "2",
            "--max-sleep-interval", "5",
            "--print", "after_move:filepath",
            "-o", `${this.outputDir}/video_%(id)s.%(ext)s`,
            link
        ];
        return new Promise((resolve, reject) => {
            execFile(
                "yt-dlp",
                args,
                {
                    maxBuffer: 1024 * 1024 * 20,
                    timeout: 120000 
                },
                (error, stdout, stderr) => {
                    console.log("STDOUT:", stdout);
                    console.log("STDERR:", stderr);
                    const botError =
                        stderr.includes("Sign in to confirm") ||
                        stderr.includes("bot detection") ||
                        stderr.includes("unusual traffic") ||
                        stderr.includes("confirm you’re not");
                    if (botError) {
                        return reject(
                            new Error("YouTube blocked request. Try updating cookies or using proxy.")
                        );
                    }
                    if (error) {
                        return reject(new Error(stderr || error.message));
                    }
                    const lines = stdout.trim().split("\n");
                    const filePath = lines.pop()?.trim();
                    if (!filePath) {
                        return reject(new Error("No output file returned from yt-dlp"));
                    }
                    if (!fs.existsSync(filePath)) {
                        return reject(new Error("Downloaded file not found on server"));
                    }
                    resolve({
                        message: "Download completed",
                        filePath
                    });
                }
            );
        });
    }
}

module.exports = new Downloader();