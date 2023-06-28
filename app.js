const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, "config/config.env") });
const { v4: uuid } = require('uuid');


const mongoose = require('mongoose');

// Set up the views directory and the view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// Set up the static files directory
app.use(express.static(path.join(__dirname, 'public')));

// Connect to MongoDB
mongoose.connect("mongodb+srv://nikhilscaria3:uzlfuyj2RfRbDdEa@global.lzwsydh.mongodb.net/ChatApp?retryWrites=true&w=majority")
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch(() => {
    console.log("Error connecting to MongoDB");
  });


app.use(express.urlencoded({ extended: true }));
// const messageroutes = require('./routes/messageRoutes')
// app.use('/', messageroutes)
// // Import the Message and User models

const { Message, User, chatuser } = require('./model/messagemodel');

// Mapping between user IDs and admin IDs
const userAdminMap = {};


app.use(express.urlencoded({ extended: false }));

const nodemailer = require('nodemailer');

app.post('/createUser', async (req, res) => {
  const { name, email, mobile } = req.body;
  const identifier = uuid(); // Generate a unique identifier

  const user = new chatuser({ name, email, mobile, identifier });
  await user.save();

  // Send an email to the user with the chat link
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    service: 'gmail',
    port: 587,
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    }
  });

  const emailOptions = {
    from: process.env.SMTP_USER,
    to: user.email,
    subject: 'New Message Notification',
    html: `<p>You have received a new message. Click <a href="http://16.170.250.38:4000/chat?identifier=${identifier}">here</a> to view the chat.</p>`,
  };

  transporter.sendMail(emailOptions, (err, info) => {
    if (err) {
      console.log("Email not sent");
      console.error(err);
      return res.status(500).json({ message: "Error sending email" });
    } else {
      console.log("Email sent successfully");
      return res.redirect(`/chat?identifier=${identifier}`);
    }
  });
});




app.get('/homepage', async (req, res) => {
  res.render('homepage');
});

app.get('/api/messages', async (req, res) => {
  try {
    // Retrieve the messages from the database
    const messages = await Message.find();

    // Send the messages as a response
    res.json({ messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

app.get('/chat', async (req, res) => {
  const { identifier } = req.query;
  const messages = await Message.find({ senderid: identifier });
  
  const formattedTimes = messages.map((message) => {
    const formattedTime = message.createdAt.toLocaleString('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    });
    const [day, time] = formattedTime.split(', ');
    return { day, time };
  });
  
  console.log("formattedTimes:", formattedTimes);
  res.render('chat', { identifier, messages, formattedTimes });
});


io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('chat message', async (message) => {
    try {
      if (!message.senderid) {
        console.error('senderid is required');
        return;
      }

      // Save the message to the database
      const newMessage = new Message({
        senderid: message.senderid,
        sender: message.sender,
        content: message.content,
        

      });

      await newMessage.save();

      // Emit the chat message to all connected sockets
      io.emit('chat message', newMessage);
    } catch (error) {
      console.error(error);
    }
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

http.listen(4000, () => {
  console.log('Server is running on http://localhost:4000');
});
