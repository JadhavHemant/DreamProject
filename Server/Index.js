const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const nodemailer = require('nodemailer');
const session = require('express-session');
const Education = require('./models/education'); 
const Teacher = require('./models/Teacher'); 
const User = require('./models/user'); 

const app = express();
const mongoURI = 'mongodb+srv://jadhavhemantbalkrushna:sPPL0UNSyDMxtH8X@hemant.9wuh4.mongodb.net/hemant?retryWrites=true&w=majority&appName=Hemant';

app.use(bodyParser.json());
app.use(cors());
app.use(
  session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }, // 1 day
  })
);

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'your-email@gmail.com',
    pass: 'your-email-password',
  },
});

mongoose
  .connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('MongoDB connected');
    app.listen(5000, () => {
      console.log('Server running on port 5000');
    });
  })
  .catch((err) => console.log('MongoDB connection error:', err.message));

const upload = multer({
  dest: 'uploads/', // Specify the uploads folder
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB file size limit
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error('Please upload a jpg/jpeg/png file.'));
    }
    cb(null, true);
  },
});

async function createEducation(data) {
  try {
    const education = new Education(data);
    await education.save();
    return { success: true, message: 'Education record created successfully' };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

async function getActiveEducation() {
  try {
    const educationRecords = await Education.find({ flag: true });
    return { success: true, data: educationRecords };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

async function getEducationById(id) {
  try {
    const education = await Education.findById(id);
    if (!education) return { success: false, message: 'Education not found' };
    return { success: true, data: education };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

async function updateEducation(id, data) {
  try {
    const updatedEducation = await Education.findByIdAndUpdate(id, data, { new: true });
    if (!updatedEducation) return { success: false, message: 'Education record not found' };
    return { success: true, message: 'Education record updated successfully' };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

async function softDeleteEducation(id) {
  try {
    const education = await Education.findByIdAndUpdate(id, { flag: false }, { new: true });
    if (!education) return { success: false, message: 'Education record not found' };
    return { success: true, message: 'Education record deactivated successfully' };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

app.post('/education', async (req, res) => {
  const result = await createEducation(req.body);  // Call the controller function
  res.status(result.success ? 201 : 400).send(result.message);
});

app.get('/education', async (req, res) => {
  const result = await getActiveEducation();
  res.status(result.success ? 200 : 500).send(result.success ? result.data : result.message);
});

app.get('/education/:id', async (req, res) => {
  const result = await getEducationById(req.params.id);
  res.status(result.success ? 200 : 404).send(result.success ? result.data : result.message);
});

app.put('/education/:id', async (req, res) => {
  const result = await updateEducation(req.params.id, req.body);
  res.status(result.success ? 200 : 400).send(result.message);
});

app.patch('/education/:id', async (req, res) => {
  const result = await softDeleteEducation(req.params.id);
  res.status(result.success ? 200 : 400).send(result.message);
});

app.post('/createUser', upload.single('photo'), async (req, res) => {
  const {username,password,email,mobile_number,father_number,mother_number,roll_number,class_id,class_div,education_id,adharcard_no,flag = true} = req.body;
  const photoPath = req.file ? path.join('uploads', req.file.filename) : null;
  try {
    const newUser = new User({username,password,email,mobile_number,father_number,mother_number,roll_number,class_id,class_div,education_id,photo: photoPath,adharcard_no,flag,});
    await newUser.save();
    const mailOptions = {
      from: 'your-email@gmail.com',
      to: email,
      subject: 'Account Registration Successful',
      text: `Hello ${username},\n\nYour account has been successfully registered.\n\nThank you for joining us!`,
    };
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log('Error sending email:', error);
      } else {
        console.log('Email sent: ' + info.response);
      }
    });
    res.status(201).send('User created successfully and email sent!');
  } catch (error) {
    res.status(400).send('Error creating user: ' + error.message);
  }
});

async function deleteEducationAndTeachers(educationId) {
  try {
    await Teacher.updateMany({ education: educationId }, { $set: { flag: false } });
    console.log(`All teachers associated with Education ID ${educationId} marked as inactive.`);
    await Education.updateOne({ _id: educationId }, { $set: { flag: false } });
    console.log(`Education record with ID ${educationId} marked as inactive.`);
  } catch (err) {
    console.log('Error deactivating education and teachers:', err);
  }
}

app.put('/deleteEducation/:educationId', async (req, res) => {
  const { educationId } = req.params;

  try {
    await deleteEducationAndTeachers(educationId);
    res.status(200).send(`Education with ID ${educationId} and related teachers have been deactivated.`);
  } catch (err) {
    res.status(500).send('Error deactivating Education and Teachers.');
  }
});

app.put('/deactivateUser/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).send('User not found');
    }
    user.flag = false;
    await user.save();
    const mailOptions = {
      from: 'your-email@gmail.com',
      to: user.email,
      subject: 'Account Deactivated',
      text: `Hello ${user.username},\n\nYour account has been deactivated. If you think this was a mistake, please contact support.`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log('Error sending deactivation email:', error);
      } else {
        console.log('Deactivation email sent: ' + info.response);
      }
    });

    res.status(200).send('User deactivated and email sent');
  } catch (err) {
    res.status(500).send('Error deactivating user: ' + err.message);
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user || user.password !== password) {
      return res.status(401).send('Invalid credentials');
    }
    req.session.user = {
      username: user.username,
      email: user.email,
      id: user._id,
    };

    res.status(200).send('Logged in successfully');
  } catch (err) {
    res.status(500).send('Error logging in: ' + err.message);
  }
});

app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send('Error logging out');
    }
    res.status(200).send('Logged out successfully');
  });
});

module.exports = app;


// git remote add origin https://github.com/JadhavHemant/DreamProject.git
// git branch -M main
// git push -u origin main