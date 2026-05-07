const { execFile } = require("child_process");
const fs = require("fs");

class Downloader {
    constructor() {
        this.outputDir = "/tmp/downloads";

        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }

        this.cookiesPath = "/tmp/cookies.txt";

        // ----------------------------
        // Load cookies from base64
        // ----------------------------
        if (process.env.YT_COOKIES_B64) {
            try {
                const cookies = Buffer.from(
                    process.env.YT_COOKIES_B64,
                    "base64"
                ).toString("utf8");

                fs.writeFileSync(this.cookiesPath, cookies);

                console.log("🍪 Cookies decoded from base64");
                console.log("📁 Cookies saved:", this.cookiesPath);
            } catch (err) {
                console.error("❌ Failed to decode cookies:", err.message);
            }
        } else {
            console.warn("⚠️ YT_COOKIES_B64 missing");
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

        // ----------------------------
        // Referer logic
        // ----------------------------
        let referer = "https://www.youtube.com/";
        if (link.includes("instagram.com")) {
            referer = "https://www.instagram.com/";
        }

        // ----------------------------
        // Ensure cookies exist
        // ----------------------------
        if (!fs.existsSync(this.cookiesPath)) {
            return Promise.reject(
                new Error("Cookies file not found. Set YT_COOKIES_B64")
            );
        }

        // ----------------------------
        // yt-dlp args (SAFE VERSION)
        // ----------------------------
        const args = [
            "--cookies",
            this.cookiesPath,

            "--extractor-args",
            "youtube:player_client=android,web",

            "--no-check-certificate",
            "--force-ipv4",

            "--retries",
            "10",
            "--fragment-retries",
            "10",

            "--sleep-requests",
            "2",
            "--sleep-interval",
            "3",
            "--max-sleep-interval",
            "10",

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
                    console.log("STDOUT:\n", stdout);
                    console.log("STDERR:\n", stderr);

                    if (error) {
                        return reject(
                            new Error(stderr || error.message)
                        );
                    }

                    // ----------------------------
                    // SAFE file path extraction
                    // ----------------------------
                    const filePath = stdout
                        .split("\n")
                        .map(line => line.trim())
                        .filter(Boolean)
                        .pop();

                    if (!filePath) {
                        return reject(
                            new Error("No output file returned from yt-dlp")
                        );
                    }

                    if (!fs.existsSync(filePath)) {
                        return reject(
                            new Error("Downloaded file not found on server")
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