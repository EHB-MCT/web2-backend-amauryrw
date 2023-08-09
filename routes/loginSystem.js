const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const {
  MongoClient
} = require('mongodb');
const {
  v4: uuidv4
} = require('uuid');
const router = express.Router();
require('dotenv').config();
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
router.use(cors());

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

client.connect((err) => {
  if (err) {
    console.error('Error connecting to database:', err);
    return;
  }
  console.log('Connected to MongoDB database');
});

app.post('/register', async (req, res) => {
  const {
    username,
    email,
    password
  } = req.body;

  try {
    const existingUsername = await client
      .db('web2Aug')
      .collection('users')
      .findOne({
        username
      });

    if (existingUsername) {
      return res.status(400).json({
        message: 'This username is already used'
      });
    }

    const existingEmail = await client
      .db('web2Aug')
      .collection('users')
      .findOne({
        email
      });

    if (existingEmail) {
      return res.status(400).json({
        message: 'This email address is already in use'
      });
    }

    if (!username || !email || !password) {
      return res.status(400).json({
        message: 'Please complete all required fields'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    await client.db('web2Aug').collection('users').insertOne({
      userId,
      username,
      email,
      password: hashedPassword,
    });

    res.status(200).json({
      message: 'successful registration',
      userId
    });
  } catch (error) {
    console.error('Error while registering:', error);
    res.status(500).json({
      message: 'An error occurred while registering'
    });
  }
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const existingUser = await client
      .db('web2Aug')
      .collection('users')
      .findOne({
        email
      });

    if (!existingUser) {
      return res.status(400).json({
        message: 'Incorrect email address or password'
      });
    }

    const passwordMatch = await bcrypt.compare(password, existingUser.password);
    if (!passwordMatch) {
      return res.status(400).json({
        message: 'Incorrect email address or password'
      });
    }

    const userId = existingUser.userId; // Get the userId from the existingUser object

    res.status(200).json({
      message: 'Successful connection',
      userId
    });
  } catch (error) {
    console.error('Error while connecting:', error);
    res.status(500).json({
      message: 'An error occurred while logging in'
    });
  }
});

app.post('/newChallenges', async (req, res) => {
  const {
    text,
    description,
    dataset,
    picture,
    result
  } = req.body;
  
  const {
    userId
  } = req.body;
  const challengeId = uuidv4();

  try {
    const existingUser = await client
      .db('web2Aug')
      .collection('users')
      .findOne({
        userId
      });

    if (!existingUser) {
      return res.status(400).json({
        message: 'invalid user ID'
      });
    }

    await client.db('web2Aug').collection('challenges').insertOne({
      challengeId,
      userId,
      text,
      description,
      dataset,
      picture,
      result,
    });

    res.status(200).json({
      message: 'Challenge created successfully',
      challengeId,
      userId
    });
    
    
  } catch (error) {
    console.error('Error creating challenge:', error);
    res.status(500).json({
      message: 'An error occurred while creating the challenge'
    });
  }
});

        
app.delete('/deleteChallenge/:challengeId', async (req, res) => {
  const { challengeId } = req.params;

  try {
    const deletedChallenge = await client
      .db('web2Aug')
      .collection('challenges')
      .findOneAndDelete({ challengeId });

    if (!deletedChallenge.value) {
      return res.status(400).json({
        message: 'Challenge not found or already deleted'
      });
    }

    res.status(200).json({
      message: 'Challenge successfully deleted',
      challengeId
    });
  } catch (error) {
    console.error('Error deleting challenge:', error);
    res.status(500).json({
      message: 'An error occurred while deleting the challenge'
    });
  }
});


app.get('/my-challenges', async (req, res) => {
  const { userId } = req.query;

  try {
    const challenges = await client
      .db('web2Aug')
      .collection('challenges')
      .find({ userId })
      .toArray();

    res.status(200).json({ challenges });
  } catch (error) {
    console.error('Error retrieving user challenges:', error);
    res.status(500).json({
      message: 'An error occurred while retrieving user challenges'
    });
  }
});


app.get('/challenges/:challengeId', async (req, res) => {

  const {

    challengeId

  } = req.params;

 

  try {

    const challenge = await client

      .db('web2Aug')

      .collection('challenges')

      .findOne({

        challengeId

      });

 

    if (!challenge) {

      return res.status(404).json({

        message: 'Défi introuvable'

      });

    }

 

    res.status(200).json(challenge);

  } catch (error) {

    console.error('Erreur lors de la récupération du défi:', error);

    res.status(500).json({

      message: 'Une erreur est survenue lors de la récupération du défi'

    });

  }

});


app.get('/all-challenges', async (req, res) => {
  try {
    const challenges = await client
      .db('August-web2')
      .collection('challenges')
      .find({})
      .toArray();

    res.status(200).json({ challenges });
  } catch (error) {
    console.error('Error while retrieving all challenges:', error);
    res.status(500).json({
      message: 'An error occurred while retrieving all the challenges'
    });
  }
});


app.listen(port, () => {
  console.log(`Serveur démarré sur le port ${port}`);
});

module.exports = router;