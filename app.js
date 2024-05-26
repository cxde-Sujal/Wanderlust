// it simply means while developing we will use .env file and in production we will not send it as it has credentials
// and while hosting we will set the NODE_ENV to production
if(process.env.NODE_ENV != "production"){
  require('dotenv').config();
}
// console.log(process.env);

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Listing = require("./models/listing.js");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError= require("./utils/Expresserror.js")
const asyncWrap= require("./utils/wrapAsync.js")
const {listingSchema, reviewSchema}= require("./schema.js")
const Review = require("./models/review.js");
const cookieParser= require("cookie-parser");
const session=require("express-session");
const flash=require("connect-flash");
const passport=require("passport");
const localStrategy=require("passport-local");
const User = require("./models/user.js");
const {isLoggedIn,isReviewAuthor}= require("./middleware.js");
const listingController= require("./controllers/listing.js");
const reviewController= require("./controllers/review.js");
const userController= require("./controllers/user.js");
const multer  = require('multer');
const {storage}=require("./cloudConfig.js");//this is for storing in cloud
const upload = multer({ storage: storage });//this is for storing in cloud
// const upload = multer({ dest: 'uploads/' });//initialise where to store can it be a folder -it is for local storing in a folder
const MongoStore = require('connect-mongo');


// const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";
const dbUrl=process.env.ATLASDB_URL;

main()
  .then(() => {
    console.log("connected to DB");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect(/*MONGO_URL*/dbUrl);
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));//parsing of nested objects in the URL-encoded data
app.use(methodOverride("_method"));
app.engine('ejs', ejsMate);//gives templates
app.use(express.static(path.join(__dirname,"public")));//to use public folder
// app.use(cookieParser("secretcode"));//to use cookie parser package, every cookie will execute this middleware


const store=MongoStore.create({
  mongoUrl: dbUrl,
crypto: {
  secret: process.env.SECRET
},
touchAfter: 24*3600
//touchAfter is used to save session updates dont need to login in 24hours
});

store.on("error",()=>{
  console.log("Error in Mongo Sessions",err);
})
//using of sessions
const sessOptions={
  store,
  secret:process.env.SECRET,//string used to sign the session ID cookie. important for security purposes to prevent tampering with the session cookie.
  resave:false,//Setting it to false can optimize server performance by only saving sessions that have been modified.
  saveUninitialized:true,//This property determines whether to save uninitialized sessions. Setting it to true will save new sessions to the session store, even if they haven't been modified.
  cookie:{
    expires: Date.now()+ 7*24*60*60*1000,//temporary data store kare usse 7 din tak info stored ho basically yaha 7 din jo ki milli second mei diya hai(7days*24hours*60mins*60sec*1000ms) 
    maxAge:7*24*60*60*1000,
    httpOnly:true,//for security purposes-restricts access to the cookie only through the HTTP protocol
  },
};



app.use(session(sessOptions));
app.use(flash());

//configuring strategy
app.use(passport.initialize());//to initialise passport
app.use(passport.session());//web app needs the ability to identify users as they browse from page to page
passport.use(new localStrategy(User.authenticate()));//LocalStrategy is a strategy provided by Passport.js for authenticating with a username and password.
passport.serializeUser(User.serializeUser());//to serialize users into the session
passport.deserializeUser(User.deserializeUser());//ulta upar ka

app.use((req,res,next)=>{
  res.locals.currUser=req.user;
  next();
})
// app.get("/demouser", async(req,res)=>{
//   let fakeuser=new User({
//     email:"sujalsinha10@gmail.com",
//     username:"heyasujalhere"
//   });
//   let registereduser=await User.register(fakeuser,"helloworld");//a static method of passport stores user and its password, also checks if username is unique
//   res.send(registereduser);
// });

//SignUp routes
app.get("/signup",userController.signupPage);

app.post("/signup",asyncWrap(userController.postSignup));

app.get("/login",userController.loginPage);

app.post("/login",passport.authenticate("local",{
  failureRedirect:"/login",
  failureFlash:true,
}),userController.postLogin);

//logout route 
app.get("/logout",userController.logout) 

const validateListing=(req,res,next)=>{
  let {error}=listingSchema.validate(req.body);
  if(error){
    let errMsg=error.details.map((el)=>el.message).join(",");
    throw new ExpressError(4000,errMsg);
  }else{
    next();
  }
}

const validateReview=(req,res,next)=>{
    let {error}=reviewSchema.validate(req.body);
    if(error){
      let errMsg=error.details.map((el)=>el.message).join(",");
      throw new ExpressError(4000,errMsg);
    }else{
      next();
    }
}

//COOKIES
// app.get("/getsignedcookies",(req,res)=>{
//   res.cookie("greet","hello",{signed:true});//cookies name and its value
//   res.send("sent signed cookies");
// })

// app.get("/verify",(req,res)=>{
//   console.log(req.cookies);
//   res.send("verified");
// })

//listings
//Index Route-to return all the listings
app.get("/listings",asyncWrap(listingController.index));

//New Route-part of create crud
app.get("/listings/new",isLoggedIn,listingController.renderNewForm);

//Show Route-to display any specific listing(CRUD - READ)
app.get("/listings/:id", asyncWrap(listingController.showPage));

//Create Route - to create and display that list(CRUD - CREATE)
app.post("/listings",isLoggedIn,upload.single("listing[image]"),asyncWrap( listingController.createListing));
// to store in local storage is below automatic creation of uploads and image will be added in it 
// app.post("/listings",upload.single("listing[image]"),(req,res)=>{
//   if(req.file){
//   res.send(req.file);}else{
//     res.status(400).send('File upload failed.');
//   }
// });

//Edit Route
app.get("/listings/:id/edit",isLoggedIn, asyncWrap(listingController.editListing));

//Update Route
app.put("/listings/:id",isLoggedIn,upload.single("listing[image]"),asyncWrap(listingController.updateListing));

//Delete Route
app.delete("/listings/:id",isLoggedIn, asyncWrap(listingController.deleteListing));


//REVIEWS

//post route
app.post("/listings/:id/reviews",validateReview,isLoggedIn,asyncWrap(reviewController.createReview));

//delete route
app.delete("/listings/:id/reviews/:reviewId",isLoggedIn,isReviewAuthor,asyncWrap(reviewController.deleteReview));


// app.get("/testListing", async (req, res) => {
//   let sampleListing = new Listing({
//     title: "My New Villa",
//     description: "By the beach",
//     price: 1200,
//     location: "Calangute, Goa",
//     country: "India",
//   });

//   await sampleListing.save();
//   console.log("sample was saved");
//   res.send("successful testing");
// });
app.all("*",(req,res,next)=>{
  next(new ExpressError(404,"Page not found"));
})
// error handling middleware
app.use((err,req,res,next)=>{
    console.error('An error occurred:', err);
    let {status=500, message="Some error occured"}= err;
    // res.status(status ).send(message);
    res.status(status).render("error.ejs",{message});
});

app.listen(8080, () => {
  console.log("server is listening to port 8080");
});