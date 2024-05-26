const Review = require("../models/review.js");
const Listing = require("../models/listing.js");

module.exports.createReview=async(req,res)=>{
    let listing=await Listing.findById(req.params.id);
    let newReview=new Review(req.body.review);
    newReview.author=req.user._id;
    listing.reviews.push(newReview);
    await newReview.save();
    await listing.save();
    // console.log("new response saved");
    // res.send("saved");
    res.redirect(`/listings/${listing._id}`);
}

module.exports.deleteReview=async(req,res)=>{
    let {id,reviewId}=req.params;
    await Listing.findByIdAndUpdate(id,{$pull:{reviews:reviewId}});//to update in the main listings collection also after rmoval of review pull is used to remove a value from an array 
    let review= await Review.findByIdAndDelete(reviewId);
    console.log(review);
    res.redirect(`/listings/${id}`);
  
}