const User = require("../models/user.js");

module.exports.signupPage=async(req,res)=>{
    res.render("users/signup.ejs");
}

module.exports.postSignup=async(req,res,next)=>{
  try {
    let{username,email,password}=req.body;
    console.log("error 0");
   const Userinfo=new User({email,username});
   console.log("error 1");
   let registereduser=await User.register(Userinfo,password);
   console.log(registereduser);
   req.login(registereduser,(err)=>{
    if(err){
      console.log("error 2");
      return next(err);
    }
    console.log("error 3");
    req.flash("success","Welcome To WanderLust :)");
    console.log("error 4");
    return res.redirect("/listings");
   });
  } catch (error) {
    console.log("error 5");
    req.flash("error",error.message);
    res.redirect("/signup");
  }
}

module.exports.loginPage=(req,res)=>{
    res.locals.errorMsg=req.flash("error");
    res.render("users/login.ejs");
}
module.exports.postLogin=async(req,res)=>{
    req.flash("success","Welcome To WanderLust :)");
    res.redirect("/listings");
}
module.exports.logout=(req,res)=>{
    req.logout((err)=>{
      if(err){
        next(err);
      }
      req.flash("success","Logged Out Successfully :)");
      res.redirect("/listings");
    })
}