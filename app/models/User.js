const mongoose = require('mongoose');

const Schema = mongoose.Schema;

// create a schema
const UserSchema = new Schema({
  _id: { type: Number, unique: true },
  name: String,
  nickname: String,
  email: {type: String, unique: true},
  access_token: String,
  refresh_token: String,
  expiration_time: Date,
});

// create the model
const UserModel = mongoose.model('User', UserSchema);

// export the model
module.exports = UserModel;
