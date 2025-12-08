const errorHandler = (err,req,res,next) => {    
      
    const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
console.log("statusCode", statusCode);

      console.log("err",err);

    res.status(statusCode).json({
        success: false,
        message: err.message || "Error"
    })

}
module.exports = errorHandler