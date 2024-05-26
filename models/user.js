const mongoose = require('mongoose');
const Schema=mongoose.Schema;
const passportLocalMongoose=require("passport-local-mongoose");
const userSchema=new Schema({
    email:{
        type:String,
        required:true
    }
});
userSchema.plugin(passportLocalMongoose);//iss line se passportlocalmongoose khud bhar khud schema mei username hashing salting add kar dega so alag se karne ka zarurat nahi
const User=mongoose.model("User",userSchema);
module.exports=User;