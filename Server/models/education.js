const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Education Schema Definition (Parent)
const educationSchema = new mongoose.Schema({
  college_name_or_school_name: {
    type: String,
    required: true,
    trim: true,
  },
  date: {
    type: Date,
    required: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 20, // Minimum length for password
  },
  flag: {
    type: Boolean,
    default: true, // Active by default
  },
});

// Pre-save hook to hash the password before saving
educationSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    try {
      const salt = await bcrypt.genSalt(10); // Generate salt
      this.password = await bcrypt.hash(this.password, salt); // Hash the password
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

// Pre-hook to delete dependent Teacher records if Education is deleted (soft delete logic)
educationSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
  try {
    // Get the Education document's ID
    const educationId = this._id;

    // Delete all Teachers associated with this Education (cascading delete)
    await mongoose.model('Teacher').deleteMany({ education: educationId });

    next();
  } catch (err) {
    console.error('Error during cascading delete:', err);
    next(err); // Pass error to the next middleware
  }
});

// Education Model (Parent)
const Education = mongoose.model('Education', educationSchema);

module.exports = Education;
