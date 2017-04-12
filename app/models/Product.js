const mongoose = require('mongoose');

const Schema = mongoose.Schema;

// create a schema
const ProductSchema = new Schema({
  _id: { type: String, unique: true },
  user_id: Number,
  name: String,
  price: Number,
  cheaper_price: Number,
  currency: String,
  url: String,
  meli_compare: [{
    meli_id: String,
    name: String,
    url: String,
    price: Number,
    currency: String
  }],
});

// create the model
const ProductModel = mongoose.model('Product', ProductSchema);

// export the model
module.exports = ProductModel;
