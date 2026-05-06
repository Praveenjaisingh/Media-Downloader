const dashboardEloquent = require("../Repositories/dashboardEloquent");
const appError = require("../Helpers/appError");    

class dasboardService{

    async downloadContent(data) {
        const { link } = data;

        if (!link) {
            throw new appError("Download link is required");
        }

        return await dashboardEloquent.downloadContent({ link });
    }

}
module.exports = new dasboardService();