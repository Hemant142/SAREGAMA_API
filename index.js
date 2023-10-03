const express = require("express");
require("dotenv").config();
const cors = require("cors");
const { connection } = require("./db");
const { userRouter } = require("./Routes/user.routes");
const { SongRoute } = require("./Routes/Song.Route");
const { FavoriteSongRoute } = require("./Routes/Favirote.Route");
const app=express();
app.use(cors())

// app.set("views", __dirname + "/views"); 

app.use(express.json())
app.set("view engine", "ejs");
app.use(express.urlencoded({extended:false}))
app.get("/",async(req,res)=>{
    res.setHeader("Content-type", "text/html")
    res.send("<h1>Welcome to the Sare Gama server</h1>")
})
app.use("/songs",SongRoute)
app.use("/favorite",FavoriteSongRoute)

app.use("/users", userRouter);
const PORT = process.env.PORT;
app.listen(PORT, async () => {
  try {
    await connection;
    console.log("You are connected to Saregama");
    console.log(`Server is running on Port: ${PORT}`);
  } catch (err) {
    console.log(err.message);
  }
});
