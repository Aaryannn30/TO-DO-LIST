//Dependecies
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();

//to hash password
const bcrypt = require('bcryptjs');

//JSON WEB TOKEN for authentications
const jwt = require("jsonwebtoken"); 

//Models
const Task = require('./models/Task');
const User = require('./models/User'); 

require('dotenv').config();
app.use(cors());
app.use(bodyParser.json());

//MongoDB connection
mongoose.connect(process.env.MONGO_URI);

//User Registration
app.post('/api/users/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        console.log("Username is" + name);

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ error: 'Email already in use.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ name: name, email: email, password: hashedPassword });

        await newUser.save();
        return res.status(201).json({ message: 'User registered successfully.' });
    } catch (error) {
        if (error.name === 'ValidationError') {
            const errors = {};
            Object.keys(error.errors).forEach((key) => {
                errors[key] = error.errors[key].message;
            });
            return res.status(400).json({ errors });
        }
        console.error(error);
        return res.status(500).json({ error: 'An error occurred.' });
    }
});


//User Login
app.post('/api/users/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Email not found.' });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ error: 'Invalid password.' });
        }

        const token = jwt.sign({ email: email, password: password },
            process.env.JWT_SECRET_KEY, {
            expiresIn: 86400
        });
        res.json({ message: 'Login successful.', user: token });
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: 'Something Went Wrong , Try Later!' });
    }
});

// Middleware to verify token
const verifyToken = (req, res, next) => {
    const token = req.headers['x-access-token'];
    console.log('Received Token:', token);
    if (!token) return res.status(403).send('A token is required for authentication');

    jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decoded) => {
        if (err) {
            console.error('Token verification failed:', err);
            return res.status(401).send('Invalid Token');
        }
        req.user = decoded;
        next();
    });
};


// Get user's todo list
app.get('/api/users/todo', verifyToken, async (req, res) => {
    try {
        // Extract email from decoded token
        const user = req.user.email; 

        const tasks = await Task.find({ user })
        return res.status(200).json({ tasks });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Server error' });
    }
});


// Add a Task
app.post('/api/users/todo', verifyToken, async (req, res) => {
    try {
        const { text } = req.body;

        const newTask = new Task({
            text,
            user: req.user.email,
        });
        await newTask.save();
        res.status(201).json({ task: newTask });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error.' });
    }
});

// Edit a task
app.put('/api/users/todo/:taskId', verifyToken, async (req, res) => {
    try {
         // Ensure taskId is valid or not
        const task = await Task .findById(req.params.taskId);
        if (!task) return res.status(404).json({ error: 'Task not found' });

         // Update the task
        task.text = req.body.text;
        await task.save();
        return res.status(200).json({ task ,  message: 'Task Updated successfully'   });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Server error' });
    }
});

// Delete a task
app.delete('/api/users/todo/:taskId', verifyToken, async (req, res) => {
    try {
        // Ensure taskId is valid
        const task = await Task.findById(req.params.taskId);
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }

        // Delete the task
        await task.deleteOne();
        return res.status(200).json({ message: 'Task deleted successfully' });
    } catch (error) {
        console.error('Error deleting task:', error); 
        return res.status(500).json({ error: 'Server error' });
    }
});

app.listen(5000)