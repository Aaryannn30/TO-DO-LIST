const mongoose = require('mongoose');

//Task Schema
const TaskSchema = new mongoose.Schema({
    text: {
        type: String,
        required: [true, 'Task text is required.'],
        minlength: 1,
    },
    user: {
        type: String,
        ref: 'User',
        required: true,
    }
}, { timestamps: true });

const Task = mongoose.model('Task', TaskSchema);
module.exports = Task;
