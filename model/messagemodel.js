// Define Message schema and model using Mongoose
const mongoose = require('mongoose')
const messageSchema = new mongoose.Schema({
    senderid: String,
    sender: String,
    content: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  });
const Message = mongoose.model('Message', messageSchema);


module.exports = Message;

const chataddSchema = new mongoose.Schema({
    name: String,
    email: String,
    mobile: String,
    identifier: String,
});

const chatuser = mongoose.model('chatuser', chataddSchema);

module.exports = { Message, chatuser };