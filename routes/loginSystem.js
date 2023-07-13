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
    console.error('Erreur lors de la connexion à la base de données:', err);
    return;
  }
  console.log('Connecté à la base de données MongoDB');
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
        message: 'Ce nom d\'utilisateur est déjà utilisé'
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
        message: 'Cette adresse e-mail est déjà utilisée'
      });
    }

    if (!username || !email || !password) {
      return res.status(400).json({
        message: 'Veuillez remplir tous les champs requis'
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
      message: 'Inscription réussie',
      userId
    });
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    res.status(500).json({
      message: 'Une erreur est survenue lors de l\'inscription'
    });
  }
});

app.post('/login', async (req, res) => {
  const {
    email,
    password
  } = req.body;

  try {
    const existingUser = await client
      .db('web2Aug')
      .collection('users')
      .findOne({
        email
      });

    if (!existingUser) {
      return res.status(400).json({
        message: 'Adresse e-mail ou mot de passe incorrect'
      });
    }

    const passwordMatch = await bcrypt.compare(password, existingUser.password);
    if (!passwordMatch) {
      return res.status(400).json({
        message: 'Adresse e-mail ou mot de passe incorrect'
      });
    }

    res.status(200).json({
      message: 'Connexion réussie'
    });
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({
      message: 'Une erreur est survenue lors de la connexion'
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
        message: 'userID invalide'
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
      message: 'Challenge créé avec succès',
      challengeId,
      userId
    });
    
    
  } catch (error) {
    console.error('Erreur lors de la création du challenge:', error);
    res.status(500).json({
      message: 'Une erreur est survenue lors de la création du challenge'
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
        message: 'Défi introuvable ou déjà supprimé'
      });
    }

    res.status(200).json({
      message: 'Défi supprimé avec succès',
      challengeId
    });
  } catch (error) {
    console.error('Erreur lors de la suppression du défi:', error);
    res.status(500).json({
      message: 'Une erreur est survenue lors de la suppression du défi'
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
    console.error('Erreur lors de la récupération des challenges de l\'utilisateur:', error);
    res.status(500).json({
      message: 'Une erreur est survenue lors de la récupération des challenges de l\'utilisateur'
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
    console.error('Erreur lors de la récupération de tous les challenges:', error);
    res.status(500).json({
      message: 'Une erreur est survenue lors de la récupération de tous les challenges'
    });
  }
});




app.listen(port, () => {
  console.log(`Serveur démarré sur le port ${port}`);
});

module.exports = router;