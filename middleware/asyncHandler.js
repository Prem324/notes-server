const asyncHandler=(fn)=>{
    return (req,res,next)=>{
        return Promise.resolve()
            .then(()=>fn(req,res,next))
            .catch(next);
    };
};

module.exports= asyncHandler;