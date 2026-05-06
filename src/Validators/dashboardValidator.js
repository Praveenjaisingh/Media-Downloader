const { body, validationResult } = require("express-validator");

exports.dashboardValidator = [
    body("link")
        .notEmpty()
        .withMessage("Download link is required")
        .isURL()
        .withMessage("Invalid link")
];

exports.validate = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            status: false,
            errors: errors.array().map(err => err.msg)
        });
    }

    next();
};