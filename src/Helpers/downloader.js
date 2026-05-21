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
            this.ensureCookies();
        } catch (err) {
            return Promise.reject(err);
        }
        if (!fs.existsSync(this.cookiesPath)) {
            return Promise.reject(new Error("Cookies file not created"));
        }
        let referer = "https://www.youtube.com/";
        if (link.includes("instagram.com")) {
            referer = "https://www.instagram.com/";
        }
        const args = [
            "--cookies",
            this.cookiesPath,
            "--extractor-args",
            "youtube:player_client=android",
            "--user-agent",
            "com.google.android.youtube/19.09.37 (Linux; Android 11)",
            "--add-header",
            "X-YouTube-Client-Name:3",
            "--add-header",
            "X-YouTube-Client-Version:19.09.37",
            "--force-ipv4",
            "--no-cache-dir",
            "--no-part",
            "--rm-cache-dir",
            "--geo-bypass",
            "--no-check-certificates",
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
                        return reject(new Error(stderr || error.message));
                    }
                    const lines = stdout
                        .split("\n")
                        .map(line => line.trim())
                        .filter(Boolean);
                    let filePath = lines.find(line =>
                        line.startsWith(this.outputDir)
                    );
                    if (!filePath) {
                        filePath = lines.pop();
                    }
                    if (!filePath) {
                        return reject(
                            new Error("No output file returned from yt-dlp")
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