const express= require("express");
const { FavoriteSongModel } = require("../Model/Favorite.model");
const { auth } = require("../Middleware/auth.middleware");

const FavoriteSongRoute= express.Router();
FavoriteSongRoute.use(auth)

FavoriteSongRoute.get("/",async(req,res)=>{
    // console.log({req:req.body});
    const {  q, page, limit } = req.query;
    // console.log(q, page, limit );
    try {
      // Build query

    let query={userID: req.body.userID}; //Restrict songs to the logged-in user
    if (q) {
        query.$or = [
          { title: new RegExp(q, "i") },
        { artist: new RegExp(q, "i") },
        { genre: new RegExp(q, "i") },
        { language: new RegExp(q, "i") },
        ];
      }
// console.log({query});
      // const pageNumber = parseInt(page) || 1; // page come form query if not then by default 1
      const pageSize = parseInt(limit) || Infinity; // limit come form query if not then by default 10
      const totalproduct = await FavoriteSongModel.countDocuments(query); // it is use for count totle Song
      const totalPages = Math.ceil(totalproduct / pageSize); // logic for find total page
    
        const FavoriteSong= await FavoriteSongModel.find(query)
        .skip((page-1)* pageSize)
        .limit(pageSize);

        res.status(200).json({
            FavoriteSong, // current page Array of SONG list means how many limit you give
            // page: pageNumber, // current page
            totalPages, // total page
            totalResults: totalproduct, //  total number of SONG persent in database
          });
    } catch (error) {
        res.status(400).send({error:"error"})
    }
})

FavoriteSongRoute.post("/add",async(req,res)=>{
    const data = {...req.body}  // Ensure userID is included
  console.log({data},"Post data")
    try {
      // Check for duplicate song
      const existingSong = await FavoriteSongModel.findOne({songId:data.songId, userID: data.userID});
      if(existingSong){
        return res.status(400).send({error: 'Song already exists in the favorites!'})
      }

      // Create and save the song
    const CreatedData = new FavoriteSongModel(data);
    await CreatedData.save();
    res.status(201).send({ message: "Song added to favorites!" });
  } catch (error) {
    console.error(error); // Log the actual error for debugging
    res.status(400).send({ error: error.message || "Error adding song to favorites!" });
  }
})

FavoriteSongRoute.delete("/delete/:songId",async(req,res)=>{
    // const {userId} = req.params
    // // console.log({userId});
    // // 651a75e120a97f3e7bd3c463
    // try {
    //   const checkSong= await FavoriteSongModel.findOne({_id:userId})
    //   const checkSongUserSong= await FavoriteSongModel.findOne({songId:userId})
    //   // console.log({checkSong,checkSongUserSong})
    //   if(checkSong){
    //     if(checkSong.userId==req.body.userId){
    //       await FavoriteSongModel.findByIdAndDelete({_id:userId})
    //       res.status(200).send({msg:`Song id ${userId} has been deleted`})
    //     }else{
    //         res.status(200).send({msg:`you are not authorized`}) 
    //     }
    //   }
    //   else if(checkSongUserSong){
       
    //     if(checkSongUserSong.userId==req.body.userId){
    //       // console.log("hello")
    //       await FavoriteSongModel.deleteOne({songId:userId})
    //       res.status(200).send({msg:`Song id ${userId} has been deleted`})
    //     }else{
    //         res.status(200).send({msg:`you are not authorized`}) 
    //     }
    //   }
    //   else{
    //     res.status(200).send({msg:"song is not found"})
    //   }
    
    // } catch (error) {
    //     res.status(400).send({error:"error"})
    // }

    const {songId} = req.params;
    const userIdFromToken = req.body.userID;

    try{
      // Find the favorite song using songId
      const favoriteSong = await FavoriteSongModel.findOne({_id:songId})

      if (!favoriteSong) {
        return res.status(404).json({ error: "Song not found" });
      }

      // check  if the logged-in user owns the favorite song
      if(favoriteSong.userID !==userIdFromToken){
        return res.status(403).json({error: 'You are not authorized to delete this song'})
      }

      //Delete the favorite song
      await FavoriteSongModel.findByIdAndDelete(songId);
      res.status(200).json({message: `Song with ID ${songId} has been deleted successfully!`})
    }
    catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
})

module.exports={
    FavoriteSongRoute
}
