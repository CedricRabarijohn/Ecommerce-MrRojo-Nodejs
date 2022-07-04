const ApiError = require("./ApiError")

const ErrorHandler = (err,req,res,next) => {
    if(err){
        if(err instanceof ApiError){
            res.status(err.code).send({error:err})
            next()
        }
    }
}

module.exports = ErrorHandler