class AppError extends Error {

    constructor(errors, statusCode = 400){
        super();

        this.status = false;
        this.errors = Array.isArray(errors) ? errors : [errors];
        this.statusCode = statusCode;

        Error.captureStackTrace(this,this.constructor);
    }

}

module.exports = AppError;