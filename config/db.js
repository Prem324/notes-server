const mongoose=require("mongoose");
const config=require("./env");
const logger=require("./logger");

const connectDB=async()=>{
    try{
        await mongoose.connect(config.mongoUri);
        logger.info(
            {
             database:"MongoDB",   
            },
            "Database connected successfully"
        );
    }catch(error){
        logger.error(
            {
                database:"MongoDB",
                error:{
                    message:error.message,
                    stack:error.stack,
                },
            },
            "Database connection failed"
        );
        process.exit(1);
        
    }
}

module.exports=connectDB;