const dashboardService = require("../Services/dasboardService");

exports.downloadContent = async (req,res,next)=>{

    try{
        const data = await dashboardService.downloadContent(req.body);
        const baseUrl = process.env.APP_URL;
        const fileName = data.filePath.split("/").pop();
        return res.status(200).json({
            status: true,
            message: "Download success",
            fileUrl: `${baseUrl}/files/${encodeURIComponent(fileName)}`
        });

    }
    catch(error){
       next(error);
    }

}