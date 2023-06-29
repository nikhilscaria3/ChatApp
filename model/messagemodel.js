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
  image: [{
    title: String,
    filepath: String,
  }],
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
});

const chatuser = mongoose.model('chatuser', chataddSchema);


const userSchema = new mongoose.Schema({
  name: String,
  password: String,
});

const User = mongoose.model('User', userSchema);

module.exports = { Message, chatuser,User };