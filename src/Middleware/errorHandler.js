module.exports = (err, req, res, next) => {

    console.log(err.message);

    // ✅ Handle invalid / empty JSON body
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({
            status: false,
            errors: ["Data is required"]
        });
    }

    res.status(err.statusCode || 400).json({
        status: false,
        errors: err.errors || [err.message]
    });

};