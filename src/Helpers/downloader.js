const { execFile } = require("child_process");
const fs = require("fs");

class Downloader {
    constructor() {
        this.outputDir = "/tmp/downloads";
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }
        this.cookiesPath = "/tmp/cookies.txt";
        if (process.env.YT_COOKIES) {
            if (process.env.YT_COOKIES_B64) {
                const cookies = Buffer.from(
                    process.env.YT_COOKIES_B64,
                    "base64"
                ).toString("utf8");

                fs.writeFileSync(this.cookiesPath, cookies);
                console.log("🍪 Cookies decoded from base64");
            }
            console.log("🍪 Cookies file created");
            console.log("📁 Cookies path:", this.cookiesPath);
        } else {
            console.warn("⚠️ YT_COOKIES env missing");
        }
        console.log(
            "✅ Cookies exists:",
            fs.existsSync(this.cookiesPath)
        );
    }
    download(link) {
        if (!link) {
            return Promise.reject(
                new Error("Download link is required")
            );
        }
        let referer = "https://www.youtube.com/";
        if (link.includes("instagram.com")) {
            referer = "https://www.instagram.com/";
        }
        const args = [
            "--cookies",
            this.cookiesPath,
            "--impersonate",
            "chrome",
            "--extractor-args",
            "youtube:player_client=android,web",
            "--no-check-certificate",
            "--no-cache-dir",
            "--force-ipv4",
            "--concurrent-fragments",
            "1",
            "--sleep-requests",
            "2",
            "--sleep-interval",
            "2",
            "--max-sleep-interval",
            "5",
            "--user-agent",
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
            "--referer",
            referer,
            "--add-header",
            "Accept-Language:en-US,en;q=0.9",
            "--add-header",
            "Accept:text/html,application/xhtml+xml",
            "--restrict-filenames",
            "--merge-output-format",
            "mp4",
            "--print",
            "after_move:filepath",
            "-o",
            `${this.outputDir}/video_%(id)s.%(ext)s`,
            link
        ];
        return new Promise((resolve, reject) => {
            execFile(
                "yt-dlp",
                args,
                {
                    maxBuffer: 1024 * 1024 * 20,
                    timeout: 300000
                },
                (error, stdout, stderr) => {
                    console.log("STDOUT:", stdout);
                    console.log("STDERR:", stderr);
                    if (error) {
                        return reject(
                            new Error(stderr || error.message)
                        );
                    }
                    const lines =
                        stdout.trim().split("\n");
                    const filePath =
                        lines.pop()?.trim();
                    if (!filePath) {
                        return reject(
                            new Error(
                                "No output file returned from yt-dlp"
                            )
                        );
                    }
                    if (!fs.existsSync(filePath)) {
                        return reject(
                            new Error(
                                "Downloaded file not found on server"
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