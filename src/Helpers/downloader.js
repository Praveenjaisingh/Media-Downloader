const { execFile } = require("child_process");
const fs = require("fs");
const path = require("path");

class Downloader {
    constructor() {
        this.outputDir = "/tmp/downloads";
        this.cookiesPath = "/tmp/cookies.txt";
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }
        this.writeCookies();
    }
    writeCookies() {
        const cookies = process.env.YT_COOKIES;
        if (!cookies) {
            throw new Error("YT_COOKIES environment variable missing");
        }
        fs.writeFileSync(this.cookiesPath, cookies);
    }
    async clearOldFiles() {
        const files = fs.readdirSync(this.outputDir);
        for (const file of files) {
            try {
                fs.unlinkSync(path.join(this.outputDir, file));
            } catch (err) {
                console.log(err);
            }
        }
    }
    download(link) {
        if (!link) {
            return Promise.reject(
                new Error("Download link is required")
            );
        }
        return new Promise(async (resolve, reject) => {
            try {
                await this.clearOldFiles();
                const isYouTube =
                    link.includes("youtube.com") ||
                    link.includes("youtu.be");
                const isInstagram =
                    link.includes("instagram.com");
                const outputTemplate =
                    `${this.outputDir}/video_%(id)s_%(timestamp)s.%(ext)s`;
                const args = [
                    "--cookies",
                    this.cookiesPath,
                    "--force-ipv4",
                    "--no-cache-dir",
                    "--no-part",
                    "--no-continue",
                    "--no-overwrites",
                    "--no-playlist",
                    "--merge-output-format",
                    "mp4",
                    "-o",
                    outputTemplate
                ];
                if (isYouTube) {
                    args.push(
                        "--sleep-requests", "2",
                        "--sleep-interval", "2",
                        "--max-sleep-interval", "5",
                        "--extractor-args",
                        "youtube:player_client=web;player_skip=webpage,configs",
                        "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
                        "--add-header=Accept-Language:en-US,en;q=0.9"
                    );
                }
                if (isInstagram) {
                    args.push(
                        "--user-agent=Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
                        "--add-header=Referer:https://www.instagram.com/",
                        "--add-header=Origin:https://www.instagram.com",
                        "--add-header=Accept-Language:en-US,en;q=0.9"
                    );
                }
                args.push(link);
                execFile(
                    "yt-dlp",
                    args,
                    { timeout: 300000 },
                    (error, stdout, stderr) => {
                        console.log(stdout);
                        console.log(stderr);
                        if (error) {
                            return reject(
                                new Error(stderr || error.message)
                            );
                        }
                        const files = fs.readdirSync(this.outputDir);
                        const mediaFile = files.find(file =>
                            /\.(mp4|mkv|webm|mov)$/i.test(file)
                        );
                        if (!mediaFile) {
                            const htmlFile = files.find(file =>
                                file.endsWith(".html")
                            );
                            if (htmlFile) {
                                return reject(
                                    new Error(
                                        "Platform returned login/challenge page instead of media"
                                    )
                                );
                            }
                            return reject(
                                new Error("No media file found")
                            );
                        }
                        resolve({
                            message: "Download completed",
                            filePath: path.join(
                                this.outputDir,
                                mediaFile
                            )
                        });
                    }
                );
            } catch (err) {
                reject(err);
            }
        });
    }
}

module.exports = new Downloader();