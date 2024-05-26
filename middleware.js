const Review = require("./models/review.js");
module.exports.isLoggedIn=(req,res,next)=>{
    if(!req.isAuthenticated()){
        req.flash("error","user must be logged in :(");
        res.redirect("/login");
      }
      next();
}
const mongoose = require('mongoose');

module.exports.isReviewAuthor = async (req, res, next) => {
    const { id, reviewId } = req.params;
    const review = await Review.findById(reviewId);

    if (!review) {
      req.flash("error", "Review not found");
      return res.redirect(`/listings/${id}`);
    }

    // Log the IDs to debug
    console.log(`Review Author: ${review.author}`);
    console.log(`Current User: ${res.locals.currUser._id}`);

    // Ensure IDs are ObjectIds
    const reviewAuthorId =  new mongoose.Types.ObjectId(review.author);
    const currentUserId = new mongoose.Types.ObjectId(res.locals.currUser._id);

    if (!reviewAuthorId.equals(currentUserId)) {
      return res.redirect(`/listings/${id}`);
    }

    next();
};
