const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");

const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";

main()
  .then(() => {
    console.log("connected to DB");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect(MONGO_URL);
}

const initDB = async () => {
  await Listing.deleteMany({});//pehle se koi bhi data hai toh hataado
  initData.data=initData.data.map((obj)=>({...obj,owner:"660ba25f8bb8e198b472939e"}));//bhai owner daalre
  await Listing.insertMany(initData.data);//initdata khud mei ek object hai and data bhi ek object hai
  console.log("data was initialized");
};

initDB();
