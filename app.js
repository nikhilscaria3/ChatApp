const express = require('express');
const app = express();
const session = require('express-session');
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');
const cacheControl = require('cache-control')
const dotenv = require('dotenv');
const fs = require('fs');
dotenv.config({ path: path.join(__dirname, "config/config.env") });
const { v4: uuid } = require('uuid');


const mongoose = require('mongoose');

// Set up the views directory and the view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// Set up the static files directory
app.use(express.static(path.join(__dirname, 'public')));

// Connect to MongoDB
mongoose.connect('mongodb+srv://nikhilscaria3:uzlfuyj2RfRbDdEa@global.lzwsydh.mongodb.net/ChatApp?retryWrites=true&w=majority')
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

app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false,
}));

app.use(function (req, res, next) {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

app.use(cacheControl({ noCache: true }));

const setUserId = (req, res, next) => {
  req.session.loggedIn = req.session.loggedIn || false; // Set loggedIn to false if not already set
  if (req.session.loggedIn && req.session.usersession) {
    res.locals.userSession = req.session.usersession;
  } else {
    res.locals.userSession = null;
  }

  console.log("req.session.loggedIn:", req.session.loggedIn);
  console.log("req.session.usersession:", req.session.usersession);
  console.log("res.locals.userSession:", res.locals.userSession);
  next();
};


const goToLoginIfNotAuth = (req, res, next) => {
  if (req.session.loggedIn) {
    next()
  } else {
    res.redirect("/")
  }
};

app.get('/logout', async (req, res) => {
  req.session.destroy()
  res.redirect('/')
})

app.get('/button', async (req, res) => {
  res.render('button')
})



app.post('/createUser', async (req, res) => {
  const { name, email, mobile, users } = req.body;
  const identifier = uuid(); // Generate a unique identifier

  const user = new chatuser({ name, email, mobile, identifier, users });
  await user.save();


  const filePath = './views/email.hbs';

  console.log(filePath);

  const htmlContent = fs.readFileSync(filePath, 'utf-8');
  const htmlEmail = htmlContent.replace('{{identifier}}', identifier);
  console.log(htmlEmail);
  // Send an email to the user with the chat link
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    service: 'gmail',
    port: 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    }
  });

  const emailOptions = {
    from: process.env.SMTP_USER,
    to: user.email,
    subject: 'New Message Notification',
    html: htmlEmail
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


const bcrypt = require('bcrypt');
const nocache = require('nocache');

app.get('/', async (req, res) => {
  const { loggedIn, username, usersession, message } = req.session;

  // Clear the message after displaying it
  req.session.message = '';

  try {
    // Render the homepage template and pass the session variables and users
    res.render('homepage', { loggedIn, username, usersession, message });
  } catch (error) {
    console.error('Error finding users:', error);
    res.status(500).send('Internal Server Error');
  }
});


// Handle POST requests to '/home' for sign-up and login
app.post('/', async (req, res) => {
  const { name, password } = req.body;

  try {
    // Find the user in the database by name
    const user = await User.findOne({ name });

    if (!user) {
      // User does not exist, proceed with sign-up

      // Generate a salt for password hashing
      const salt = await bcrypt.genSalt(10);

      // Hash the password using bcrypt
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create a new User document with hashed password
      const newUser = new User({
        name,
        password: hashedPassword,
      });

      // Save the user to the database
      await newUser.save();

      // Set session variables for the newly signed up user
      req.session.username = newUser.name;
      req.session.loggedIn = true;
      req.session.usersession = newUser.id
      // Redirect to the homepage or any other desired page
      res.redirect('/');
    } else {
      // User exists, proceed with login

      // Compare the provided password with the stored hashed password
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (isPasswordValid) {
        // Set session variables for the logged-in user
        req.session.username = user.name;
        req.session.loggedIn = true;

        // Redirect to the homepage or any other desired page
        res.redirect('/homepage');
      } else {
        req.session.message = 'Invalid Password or Username';
        res.redirect('/');
      }
    }
  } catch (error) {
    console.error('Error signing up or logging in:', error);
    res.status(500).send('Internal Server Error');
  }
});


app.get('/homepage', goToLoginIfNotAuth, setUserId, async (req, res) => {
  const userSession = res.locals.userSession
  const users = await chatuser.find({ users: userSession });
  console.log(users);
  res.render('chat', { users, userSession });
});


app.get('/chat', setUserId, async (req, res) => {
  const userSession = res.locals.userSession
  const { identifier } = req.query;
  const messages = await Message.find({ senderid: identifier });
  const users = await chatuser.find({ identifier: identifier })
  const formattedTimes = messages.map((message) => {
    const formattedTime = message.createdAt.toLocaleString('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    });

    console.log(formattedTime);
    const [day, time] = formattedTime.split(', ');
    return { day, time };
  });

  console.log("formattedTimes:", formattedTimes);
  res.render('chat', { identifier, messages, users, formattedTimes, userSession });
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
