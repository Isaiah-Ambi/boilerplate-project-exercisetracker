const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser')
require('dotenv').config()

app.use(bodyParser.json());

const mongoose = require('mongoose')
const uri = process.env.MONGO_URI
// console.log(uri)

mongoose.connect(process.env.MONGO_URI);

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

const exerciseSchema = new mongoose.Schema({
  user_id: {type: String, required: true},
  username: String,
  description: {type:String, required: true},
  duration: {type: Number, required: true},
  date: {type:Date},
});

const Exercise = mongoose.model('Exercise', exerciseSchema);


app.route('/api/users')
.get(async (req, res) => {
  try {const users = await User.find({},'id username');
  res.send(users);
  } catch (err) {
    console.error(err);
    res.status(401).json({ message: 'something went wrong' });
  }
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

app.route('/api/users/:_id/exercises')
.get(async (req, res) => {
  const userId = req.params._id;

  const user = await User.findById(userId);
  // console.log(user.username);
  if(!user) {
    return res.status(404).json({error: 'User not found'})
    }
  try{
    const exercises = await Exercise.find({username:user.username}, 'description duration date');

    const log = exercises.map(e => ({
      description: e.description, 
      duration: e.duration,
      date: new Date(e.date).toDateString()
    }));
    
    // console.log(exercises);
    res.status(200).json({
      id: user.id,
      username: user.username,
      exercises:exercises
    }); // Send the formatted response
  }
  catch (err){
    console.error(err);
    res.status(500).json({error: 'Something went wrong getting user logs'});
  }
})
// Route to create an exercise for a user
.post( async (req, res) => {
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
      user_id: userId,
      username: user.username,
      description,
      duration,
      date: new Date(date ? date : new Date()), // Handle optional date
    });

    // Format the date before saving
    // newExercise.date = newExercise.date.toDateString();

    // Save the new exercise document
    const savedExercise = await newExercise.save();

    

    // Return the saved exercise data in JSON format
    res.status(201).json({
      _id:savedExercise._id,
      username: savedExercise.username,
      description: savedExercise.description,
      duration: savedExercise.duration,
      date: new Date(savedExercise.date).toDateString()
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error creating exercise' });
  }
});


app.get('/api/users/:_id/logs',async (req, res) => {
  const { from, to, limit } = req.query;
  const userId = req.params._id;

  const user = await User.findById(userId);
  // console.log(user.username);
  if(!user) {
    return res.status(404).json({error: 'User not found'})
    }

  let dateObj = {};
  if (from) {
    dateObj["$gte"] = new Date(from)
  }

  if (to) {
    dateObj["$lte"] = new Date(to)
  }
  let filter = {
    user_id: userId
  }
  if (from || to){
    filter.date = dateObj;
  }
  try{
    const exercises = await Exercise.find(filter).limit(+limit ?? 500);
    
    const log = exercises.map(e => ({
      description: e.description, 
      duration: e.duration,
      date: new Date(e.date).toDateString()
    }));
    
    // console.log(exercises);
    res.status(200).json({
      id: user.id,
      username: user.username,
      count: exercises.length,
      log:log
    }); // Send the formatted response
  }
  catch (err){
    console.error(err);
    res.status(500).json({error: 'Something went wrong getting user logs'});
  }
  
});



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
