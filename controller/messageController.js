const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const { Admin, UserAdd ,User} = require('../model/messagemodel');
const { log } = require('console');
// Function to generate a random OTP
const generateOTP = () => {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < 6; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
};

// GET request handler for the "main" route
exports.getMain = async (req, res) => {
  try {
    // Fetch all users from the database
    let users = await UserAdd.find({});

    // Render the "main" view template and pass the fetched users as data
    res.render("main", { users });
  } catch (err) {
    console.log(err);
    // Handle the error and send an appropriate response
    res.status(500).send('Internal Server Error');
  }
};

// POST request handler for the "main" route
exports.postMain = async (req, res) => {
  try {
    const { username, number, email } = req.body;

    // Create a new instance of the UserAdd model with the submitted data
    const newUser = new UserAdd({
      username,
      number,
      email
    });

    // Save the new user to the database
    await newUser.save();

    // Redirect the user to the "/main" route after successful user creation
    res.redirect('/main');
  } catch (err) {
    console.log(err);
    // Handle the error and send an appropriate response
    res.status(500).send('Internal Server Error');
  }
};


exports.chat = async (req, res) => {
  try {
    const id = req.params.id
    const user = await Admin.findById(id)
    res.render('chat', { user, id });
  } catch (err) {
    console.log(err);
  }
}

exports.chatlist = async (req, res) => {
  try {
    const user = await Admin.find({})
    console.log(user);
    res.render('adminpage', { user });
  } catch (err) {
    console.log(err);
  }
}

exports.getEmail = async (req, res) => {
  try {
    return res.render('blockedMessage');
  } catch (err) {
    console.error(err);
    return res.render('error');
  }
};

exports.postEmail = async (req, res) => {
  try {
    const { senderEmail, emailSubject } = req.body;

    // Generate a random OTP
    const otp = generateOTP();
    const filePath = path.join(__dirname, '../views/otpmessage.hbs');

    // Read the contents of the user.hbs file
    const htmlContent = fs.readFileSync(filePath, 'utf-8');

    const htmlEmail = htmlContent.replace('{{otp}}', otp);

    // Create a transporter for sending emails
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'digitaltechecom99@gmail.com',
        pass: 'jtrbzbiuuhlkjuxz',
      },
    });

    // Compose the email options
    const mailOptions = {
      from: 'digitaltechecom99@gmail.com',
      to: senderEmail,
      subject: emailSubject,
      html: htmlEmail,
    };

    // Send the email
    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Error sending email' });
      } else {
        console.log('Email sent successfully');
        return res.status(200).json({ message: 'Email sent' });
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).send('Server Error');
  }
};
