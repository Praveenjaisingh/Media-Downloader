const { execFile } = require("child_process");
const fs = require("fs");

class Downloader {
    constructor() {
        this.outputDir = "/tmp/downloads";
        this.cookiesPath = "/tmp/cookies.txt";
        this.outputMetaPath = "/tmp/output.txt";
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }
    }
    ensureCookies() {
        if (!process.env.YT_COOKIES_B64) {
            throw new Error("YT_COOKIES_B64 missing in environment");
        }
        try {
            const cookies = Buffer.from(
                process.env.YT_COOKIES_B64,
                "base64"
            ).toString("utf8");
            fs.writeFileSync(this.cookiesPath, cookies);
            console.log("🍪 Cookies regenerated at runtime");
            console.log("📁 Cookies path:", this.cookiesPath);
        } catch (err) {
            throw new Error("Failed to decode cookies: " + err.message);
        }
    }
    download(link) {
        if (!link) {
            return Promise.reject(new Error("Download link is required"));
        }
        try {
            if (!fs.existsSync(this.cookiesPath)) {
                this.ensureCookies();
            }
        } catch (err) {
            return Promise.reject(err);
        }
        const isYouTube =
            link.includes("youtube.com") || link.includes("youtu.be");
        const isInstagram = link.includes("instagram.com");
        if (fs.existsSync(this.outputMetaPath)) {
            fs.unlinkSync(this.outputMetaPath);
        }
        let args = [
            "--cookies",
            this.cookiesPath,
            "--force-ipv4",
            "--no-cache-dir",
            "--no-part",
            "--rm-cache-dir",
            "--no-check-certificates",
            "--merge-output-format",
            "mp4",
            "--print-to-file",
            "after_move:filepath:" + this.outputMetaPath,
            "-o",
            `${this.outputDir}/video_%(id)s.%(ext)s`
        ];
        if (isYouTube) {
            args.push(
                "--extractor-args",
                "youtube:player_client=android",
                "--user-agent",
                "com.google.android.youtube/19.09.37 (Linux; Android 11)",
                "--add-header",
                "X-YouTube-Client-Name:3",
                "--add-header",
                "X-YouTube-Client-Version:19.09.37"
            );
        }
        if (isInstagram) {
            args.push(
                "--user-agent",
                "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1",
                "--extractor-args",
                "instagram:api_version=1"
            );
        }
        return new Promise((resolve, reject) => {
            execFile(
                "yt-dlp",
                args,
                {
                    maxBuffer: 1024 * 1024 * 20,
                    timeout: 300000
                },
                (error, stdout, stderr) => {
                    console.log("STDOUT:\n", stdout);
                    console.log("STDERR:\n", stderr);
                    if (error) {
                        return reject(new Error(stderr || error.message));
                    }
                    let filePath = null;
                    if (fs.existsSync(this.outputMetaPath)) {
                        filePath = fs
                            .readFileSync(this.outputMetaPath, "utf8")
                            .trim();
                    }
                    if (!filePath) {
                        const lines = stdout
                            .split("\n")
                            .map(l => l.trim())
                            .filter(Boolean);
                        filePath = lines
                            .reverse()
                            .find(line =>
                                line.includes(this.outputDir) &&
                                !line.endsWith(".html")
                            );
                    }
                    if (!filePath) {
                        return reject(
                            new Error("No output file returned from yt-dlp")
                        );
                    }
                    if (filePath.endsWith(".html")) {
                        return reject(
                            new Error(
                                "Blocked or login-required page returned (.html instead of video)"
                            )
                        );
                    }
                    if (!fs.existsSync(filePath)) {
                        return reject(
                            new Error(
                                "Downloaded file not found on server: " +
                                filePath
                            )
                        );
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