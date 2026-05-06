const { exec } = require("child_process");
const fs = require("fs");

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
        const command = `yt-dlp -f best \
            --no-check-certificate \
            --no-cache-dir \
            --user-agent "Mozilla/5.0" \
            --restrict-filenames \
            --print after_move:filepath \
            -o "${this.outputDir}/video_%(id)s.%(ext)s" \
            "${link}"`;
        return new Promise((resolve, reject) => {
            exec(command, { maxBuffer: 1024 * 1024 * 20 }, (error, stdout, stderr) => {
                console.log("STDOUT:", stdout);
                console.log("STDERR:", stderr);
                if (error) {
                    return reject(new Error(stderr || error.message));
                }
                const filePath = stdout.trim().split("\n").pop();
                if (!filePath || filePath === "") {
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