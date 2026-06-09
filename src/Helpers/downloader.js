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

        // Always re-write cookies on every request to ensure freshness
        try {
            this.ensureCookies();
        } catch (err) {
            return Promise.reject(err);
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
                "--extractor-args=youtube:player_client=ios,web",
                "--user-agent=com.google.ios.youtube/19.09.3 (iPhone14,3; U; CPU iOS 15_6 like Mac OS X)",
            );
            if (process.env.RESIDENTIAL_PROXY_URL) {
                args.push("--proxy", process.env.RESIDENTIAL_PROXY_URL);
            }

            if (process.env.YT_PO_TOKEN) {
                args.push(
                    `--extractor-args=youtube:po_token=web+${process.env.YT_PO_TOKEN}`
                );
            }
        }

        if (isInstagram) {
            args.push(
                "--user-agent=Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1"
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