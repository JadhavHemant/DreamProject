const mongoose = require('mongoose');

// User Schema with necessary fields
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  mobile_number: {
    type: String,
    required: true,
  },
  father_number: {
    type: String,
    required: true,
  },
  mother_number: {
    type: String,
    required: true,
  },
  roll_number: {
    type: String,
    required: true,
  },
  class_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class', // Assuming there's a Class model to reference
    required: true,
  },
  class_div: {
    type: String,
    required: true,
  },
  education_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Education', // Assuming there's an Education model to reference
    required: true,
  },
  photo: {
    type: String, // File path to the photo stored in uploads folder
    required: true,
  },
  adharcard_no: {
    type: String,
    required: true,
    unique: true,
  },
  flag: {
    type: Boolean,
    default: true, // true for active, false for inactive
  }
});

// Create the User model from the schema
const User = mongoose.model('User', userSchema);

module.exports = User;
