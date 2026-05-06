const express = require("express");
const router = express.Router();
const dashboardController = require("../Controllers/dashboardController");
const {dashboardValidator,validate} = require("../Validators/dashboardValidator");

router.post("/downloadContent",dashboardValidator,validate,dashboardController.downloadContent);


module.exports = router;