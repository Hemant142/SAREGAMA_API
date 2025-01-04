const express = require("express");
const { SongModel } = require("../Model/Song.Model");
const { auth } = require("../Middleware/auth.middleware");
const jwt = require('jsonwebtoken');
const { BlacklistModel } = require("../Model/Blacklist.model");
const SECRET_KEY = process.env.SECRET_KEY

const SongRoute = express.Router();
// SongRoute.use(auth)
// Song Get Requeest for getting the song according the query

SongRoute.get("/", async (req, res) => {
  // title: String,
  // avatar: String,
  // play: String,
  // rating: String,

  // catogary: String,
  // artist: String,
  // liked: Number,
  // disliked: Number,
  try {
    const { catogary, rating,language, title, artist,genre, q, sort, order, page, limit } =
      req.query;
    // console.log({catogary, rating, title, artist, q, sort, order, page, limit });
    //  for example  basic Url = "http://localhost:8080/songs?page=2&limit=2&sortBy=asc"

    const query = {}; // all query Object

    //  if catogary is in query and type is array
    if (Array.isArray(catogary)) {
      query.catogary = { $in: catogary };
    }
    //  if catogary is in query and type is String means single Catogary
    else if (catogary) {
      query.catogary = catogary;
    }
    //  if artist is in query and type is array
    if (Array.isArray(artist)) {
      query.artist = { $in: artist };
    }
    //  if artist is in query and type is String means single artist
    else if (artist) {
      query.artist = artist;
    }

    //  if title is in query and type is array
    if (Array.isArray(title)) {
      query.title = { $in: title };
    }
    //  if title is in query and type is String means single title
    else if (title) {
      query.title = title;
    }
    //  if rating is in query
    if (rating) {
      query.rating = parseFloat(rating);
    }

    //  if any query is in query it is special for title,artist and catogary
    //  it is basically use for searching
    if (q) {
      query.$or = [
        { title: new RegExp(q, "i") },
        { artist: new RegExp(q, "i") },
        { genre: new RegExp(q, "i") },
        { language: new RegExp(q, "i") },
      ];
    }

    //  sorting Object
    const sortOptions = {};

    //   sorting by id
    if (sort && order) {
      sortOptions[sort] = order == "asc" ? 1 : -1; // 1 for ascending, -1 for descending 1
    }

    // const pageNumber = parseInt(page) || 1; // page come form query if not then by default 1
    const pageSize = parseInt(limit) || Infinity; // limit come form query if not then by default 10
    const totalProduct = await SongModel.countDocuments(query); // it is use for count totle Song
    const totalPages = Math.ceil(totalProduct / pageSize); // logic for find total page

    const songs = await SongModel.find(query)
      .sort(sortOptions)
      // .skip((pageNumber - 1) * pageSize)
      .limit(pageSize);


//Check for bearer token
const authHeader = req.headers.authorization;
const token = authHeader && authHeader.split(" ")[1];
const isBlackListed = await BlacklistModel.findOne({blacklist: token});
if (isBlackListed) {
  return res.status(403).json({ error: "Token is blacklisted! Please login again." });
}


if(token&&!isBlackListed) {
  try{
    
    
    jwt.verify(token,SECRET_KEY);

    //If token is valid, include audio file 
    const dataWithAudio = songs.map((song)=>({
      ...song._doc,
    }));

      return res.json({
        data: dataWithAudio,
        totalPages,
        totalResults:totalProduct
      })
  }
  catch (error) {
    // Token is invalid
    console.log(error,"Error")
    return res.status(403).json({ error: "Invalid or expired token!" });
  }
}
// Ifno token, exclude audio fiels
const dataWithoutAudio = songs.map((song)=>{
  const {audio, ...rest} = song._doc;
  return rest
})
return res.json({
  data: songs,
  totalPages,
  totalResults:totalProduct
})


// <=======================Old Code======================>
    // res.json({
    //   data, // current page Array of SONG list means how many limit you give
    //   // page: pageNumber, // current page
    //   totalPages, // total page
    //   totalResults: totalProduct, //  total number of SONG persent in database
    // });
// <=======================Old Code======================>
  } catch (error) {
    res.status(400).json({ error: "error" });
  }
});

// Song post Requeest for adding the new song according

SongRoute.post("/add", auth, async (req, res) => {
  const SongFromBody = req.body;
  // console.log(SongFromBody);
  try {
    const addedSong = new SongModel(SongFromBody);

    await addedSong.save();
    //   console.log(addedSong);
    res.status(200).send({ message: "New Song added successfully" });
  } catch (error) {
    res.status(400).json({ error: "error" });
  }
});

// Song patch Requeest for updating the song according
SongRoute.patch("/update/:songId", auth, async (req, res) => {
  try {
    const { songId } = req.params;

    // console.log({songId});
    // console.log({Body:req.body});

    const Song = await SongModel.findOne({ _id: songId });
    // console.log( {Song});
    if (req.body.userID != Song.userID)
      res.status(200).send({ message: "you are not AdminAuthorized" });
    if (Song) {
      await SongModel.findByIdAndUpdate({ _id: songId }, req.body);
      res
        .status(200)
        .send({ message: `Product ${songId} updated successfully` });
    } else {
      res.status(200).send({ message: "Song not found" });
    }
  } catch (error) {
    res.status(400).json({ error: "error" });
  }
});

// Song delete Requeest for deleting the song according

SongRoute.delete("/delete/:songId", auth, async (req, res) => {
  try {
    const { songId } = req.params;
    // console.log({songId});
    const Song = await SongModel.findOne({ _id: songId });
   
    if (Song) {
      if (req.body.userID != Song.userID)
        res.status(200).send({ message: "you are not AdminAuthorized" });

      await SongModel.findByIdAndDelete({ _id: songId });
      res.status(200).send({ message: `Song ${songId} Deleted successfully` });
    } else {
      res.status(200).send({ message: "song not found" });
    }
  } catch (error) {
    res.status(400).json({ error: "error" });
  }
});


module.exports = {
  SongRoute,
};
