const jwt=require("jsonwebtoken");
const config=require("../config/env");

const auth=(req,res,next)=>{
    try{
        
        // Get Authorization header
        const authHeader=req.headers.authorization;;

        //Check if header exists
        if(!authHeader){
            return res.status(401).json({
                success:false,
                message:"No token provided"
            });
        }

        if (!authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Invalid token format",
            });
        }

    // Extract token from header
    const token=authHeader.split(" ")[1];

    
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "No token provided",
            });
        }

    // Verify token
    const decoded=jwt.verify(token,config.jwtSecret);

    // Attach user info to request object
    req.user=decoded;
    next();
}catch(error){
    return res.status(401).json({
        success:false,
        message:"Invalid token"
    });
}
};

module.exports=auth;