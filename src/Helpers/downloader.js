const { execFile } = require("child_process");
const fs = require("fs");

class Downloader {
    constructor() {
        this.outputDir = "/tmp/downloads";
        this.cookiesPath = "/tmp/cookies.txt";
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }
    }
    ensureCookies() {
        if (!process.env.YT_COOKIES_B64) {
            throw new Error("YT_COOKIES_B64 missing in environment");
        }
        const cookies = Buffer.from(
            process.env.YT_COOKIES_B64,
            "base64"
        ).toString("utf8");
        fs.writeFileSync(this.cookiesPath, cookies);
    }
    download(link) {
        if (!link) {
            return Promise.reject(new Error("Download link is required"));
        }
        if (!fs.existsSync(this.cookiesPath)) {
            this.ensureCookies();
        }
        const isYouTube =
            link.includes("youtube.com") || link.includes("youtu.be");
        const isInstagram = link.includes("instagram.com");
        const outputTemplate = `${this.outputDir}/video_%(id)s_%(epoch)s.%(ext)s`;
        const args = [
            "--cookies",
            this.cookiesPath,
            "--force-ipv4",
            "--no-cache-dir",
            "--no-part",
            "--no-continue",
            "--no-overwrites",
            "--merge-output-format",
            "mp4",
            "-o",
            outputTemplate
        ];
        if (isYouTube) {
            args.push(
                "--extractor-args=youtube:player_client=android",
                "--user-agent=com.google.android.youtube/19.09.37 (Linux; Android 11)",
                "--add-header=X-YouTube-Client-Name:3",
                "--add-header=X-YouTube-Client-Version:19.09.37"
            );
        }
        if (isInstagram) {
            args.push(
                "--user-agent=Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)"
            );
        }
        args.push(link);
        return new Promise((resolve, reject) => {
            execFile("yt-dlp", args, { timeout: 300000 }, (error, stdout, stderr) => {
                if (error) {
                    return reject(new Error(stderr || error.message));
                }
                const files = fs.readdirSync(this.outputDir);
                const videoFile = files
                    .filter(f => f.endsWith(".mp4"))
                    .map(f => ({
                        name: f,
                        time: fs.statSync(`${this.outputDir}/${f}`).mtimeMs
                    }))
                    .sort((a, b) => b.time - a.time)[0];
                if (!videoFile) {
                    return reject(new Error("No output file found"));
                }
                const filePath = `${this.outputDir}/${videoFile.name}`;
                resolve({
                    message: "Download completed",
                    filePath
                });
            });
        });
    }
}

module.exports = new Downloader();