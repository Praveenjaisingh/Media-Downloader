const downloader = require("../Helpers/downloader");

class dashboardEloquent {

    async downloadContent(data) {
        const { link } = data;
        return await downloader.download(link);
    }
}

module.exports = new dashboardEloquent();