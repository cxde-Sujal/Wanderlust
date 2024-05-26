const Listing = require("../models/listing");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken=process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

module.exports.index=async (req, res) => {
    const allListings = await Listing.find({});
    res.locals.successMsg=req.flash("success");//we can directly pass it as an object like successMsg=req.flash("success"); too
    res.locals.errorMsg=req.flash("error");
    res.render("listings/index.ejs", { allListings });//passing flash message
}

module.exports.renderNewForm=(req, res) => {
    //below method is used to check whether user is logged in or not
    console.log(req.user);
    
    res.render("listings/new.ejs");
}
 
module.exports.showPage=async (req, res) => {
    let { id } = req.params;
    //to populate meaning to use the data over here too of mentioned in bracket
    const listing = await Listing.findById(id).populate({path:"reviews",populate:{path:"author"},}).populate("owner");
    if(!listing){
      req.flash("error","Listing does not exist!");
      res.redirect("/listings");
    }
    res.render("listings/show.ejs", { listing });
}

module.exports.createListing=async (req, res,next) => {
    let response=await geocodingClient.forwardGeocode({
        query: req.body.listing.location,
        limit: 1
      })
        .send()
    console.log(response);
    // res.send('done');
    let url= req.file.path;
    let filename= req.file.filename;
    console.log(url +"...."+filename);
    // let result= listingSchema.validate(req.body)
    // if(result.error){
    //   throw new ExpressError(400,result.error);
    // }
    const newListing = new Listing(req.body.listing);//or extract on the basis of name {title,description,location,country,price}=req.body
    //here req.body.listing listing is the object that is containing its key like title,,description,location,country,price check new.ejs
    newListing.owner=req.user._id;
    newListing.image={url , filename};
    newListing.geometry=response.body.features[0].geometry;
    await newListing.save();
    console.log(newListing);
    req.flash("success","New Listing Created :)");
 res.redirect("/listings");}

module.exports.editListing=async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    res.render("listings/edit.ejs", { listing });
}

module.exports.updateListing=async (req, res) => {
    let { id } = req.params;
    let listing=await Listing.findByIdAndUpdate(id, { ...req.body.listing });
    if(typeof req.file !=="undefined"){
        let url= req.file.path;
    let filename= req.file.filename;
    listing.image={url , filename};
    await listing.save();
    }
    req.flash("success","Listing succesfully Updated :)");
    res.redirect(`/listings/${id}`);//goes to show route 
}

module.exports.deleteListing=async (req, res) => {
    let { id } = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
    req.flash("success","Listing succesfully deleted :)");
    res.redirect("/listings");
}