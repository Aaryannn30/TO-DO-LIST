
const mongoose = require('mongoose');
const validator = require('validator');

//User Schema created using validator module 👍 
const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required.'], 
        minlength: [2, 'Name must be at least 2 characters long.'], 
        maxlength: [30, 'Name must be at most 50 characters long.'] 
    },
    email: {
        type: String,
        required: [true, 'Email is required.'], 
        unique: true,
        validate: {
            validator: (value) => validator.isEmail(value),
            message: 'Please fill a valid email address.'
        }
    },
    password: {
        type: String,
        required: [true, 'Password is required.'], 
        minlength: [6, 'Password must be at least 6 characters long.'] 
    }
});

const User = mongoose.model('User', UserSchema);
module.exports = User;

