// Define Message schema and model using Mongoose
const mongoose = require('mongoose')
const messageSchema = new mongoose.Schema({
  senderid: String,
  sender: String,
  content: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  image: String,
  video: String,
});
const Message = mongoose.model('Message', messageSchema);


module.exports = Message;

const chataddSchema = new mongoose.Schema({
  name: String,
  email: String,
  mobile: String,
  identifier: String,
  users: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  image: {
    title: { type: String },
    filepath: { type: String }
  },
  status: {
    type: String,
    default: "offline",
  },
  receiverstatus: {
    type: String,
    default: "offline",
  },
});

const chatuser = mongoose.model('chatuser', chataddSchema);


const userSchema = new mongoose.Schema({
  name: String,
  password: String,
});

const User = mongoose.model('User', userSchema);

module.exports = { Message, chatuser, User };