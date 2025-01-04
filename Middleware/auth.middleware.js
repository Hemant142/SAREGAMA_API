const jwt = require("jsonwebtoken");
const {BlacklistModel} = require("../Model/Blacklist.model");
require("dotenv").config();
const SECRET_KEY = process.env.SECRET_Key;

const auth = async(req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];  // Extract token

  if(!token){
    return res.status(401).json({error: 'Please login first!'})
  }
    // const token = req.headers.authorization;
    // console.log({token});
    try {
        // if(token){
        //     let existingToken = await BlacklistModel.find({
        //         blacklist : {$in : token},
        //     });
           
        //     if(existingToken.length > 0){
               
        //         return res.status(400).json({error : "Please Login again!"});
        //     }else{
        //         let decoded = jwt.verify(token, SECRET_KEY);
        //         // console.log({decoded});
        //         req.body.userID = decoded.userID;
        //         req.body.username = decoded.username;
        //         return next();
        //     }
        // }else{
        //     return res.status(400).json({error : "Please Login first!"});
        // }

       
    
    //Check if token is blacklisted
    const existingToken= await BlacklistModel.findOne({blacklist: {$in : token}});
   
    if(existingToken){
        return res.status(403).json({error:'Please login again!'})
    }
    

    //Verify the token
    const decoded = jwt.verify(token,SECRET_KEY);
    
    req.body.userID=decoded.userID;
    req.body.username=decoded.username;
    next();
    
    } catch (error) {
        if (error.name === "JsonWebTokenError") {
          return res.status(403).json({ error: "Invalid or malformed token!" });
        }
        if (error.name === "TokenExpiredError") {
          return res.status(403).json({ error: "Token has expired!" });
        }
        return res.status(500).json({ error: "Internal Server Error!" });
      }
}

module.exports = {
    auth
}