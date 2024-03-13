const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser')
require('dotenv').config()

app.use(bodyParser.json());

const mongoose = require('mongoose')
const uri = process.env.MONGO_URI
console.log(uri)

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

app.use(express.urlencoded({extended: true}));

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

let userSchema = new mongoose.Schema({
  username: String
});

const User = mongoose.model('User', userSchema);

let exerciseSchema = new mongoose.Schema({
  username: String,
  description: {type:String, required: true},
  duration: {type: Number, required: true},
  date: Date,
});

const Exercise = mongoose.model('Exercise', exerciseSchema);


app.route('/api/users')
.get(async (req, res) => {
  const users = await User.find({});
  res.send(users);
})// Route to create a user
.post(async (req, res) => {
  try {
    // Get username from request body
    const { username } = req.body;

    // Check if username is provided
    if (!username) {
      return res.status(400).json({ message: 'Username is required' });
    }

    // Create a new user instance
    const newUser = new User({ username });

    // Save the new user to the database
    const savedUser = await newUser.save();

    // Return the saved user data in JSON format
    res.status(201).json(savedUser);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error creating user' });
  }
});

// Route to create an exercise for a user
app.post('/api/users/:_id/exercises', async (req, res) => {
  try {
    // Get user ID from route parameter
    const userId = req.params._id;

    // Get exercise data from request body
    const { description, duration, date } = req.body;

    // Validation (optional, adjust as needed)
    if (!description || !duration) {
      return res.status(400).json({ message: 'Description and duration are required' });
    }

    // Find the user by ID
    const user = await User.findById(userId);

    // Check if user exists
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Create a new exercise with username and form data
    const newExercise = new Exercise({
      username: user.username,
      description,
      duration,
      date: date ? new Date(date) : new Date(), // Handle optional date
    });

    // Save the new exercise document
    const savedExercise = await newExercise.save();

    // Return the saved exercise data in JSON format
    res.status(201).json(savedExercise);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error creating exercise' });
  }
});




const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
