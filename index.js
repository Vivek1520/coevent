const express = require("express");
const bodyParser = require("body-parser");
const multer = require('multer');
const path = require('path');
const upload = multer();
const mongoose = require('mongoose');

const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'Coevent_Website-main', 'views'));

app.use(bodyParser.urlencoded({ extended: true }));

let images = [];

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
});

const User = mongoose.model('User', userSchema);

const imageSchema = new mongoose.Schema({
  eventName: String,
  eventDescription: String,
  images: [{
    name: String,
    contentType: String,
    data: Buffer,
  }],
});
app.get('/skip', function (req, res) {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.get('/:committee', async (req, res) => {
  const committeeName = req.params.committee.replace('.', '_');
  console.log('committeeName:', committeeName);

  try {
    const committeeDB = mongoose.createConnection(`mongodb://0.0.0.0/${committeeName}`, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    const Image1 = committeeDB.model('Image1', imageSchema);

    const images = await Image1.find().exec();

    
      res.render('nss', { images: images,committee:committeeName });
    
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching images');
  }
});

app.post('/:committee/upload', upload.array('images'), async (req, res) => {
  const committeeName = req.params.committee.replace('.', '_');

  try {
      const files = req.files;
      const eventName = req.body.eventName;
      const eventDescription = req.body.eventDescription;

      const imageData = [];

      for (const file of files) {
          imageData.push({
              name: file.originalname,
              contentType: file.mimetype,
              data: file.buffer,
          });
      }

      const committeeDB = await mongoose.createConnection(`mongodb://0.0.0.0/${committeeName}`, {
          useNewUrlParser: true,
          useUnifiedTopology: true
      });

      const Image1 = committeeDB.model('Image1', imageSchema);

      const imageDocument = new Image1({
          eventName: eventName,
          eventDescription: eventDescription,
          images: imageData
      });

      await imageDocument.save();

      // Fetch images for the committee
      const images = await Image1.find().exec();

      res.render('admin', { committee: committeeName.replace('_', '.'), images: images });
  } catch (error) {
      console.error('Error occurred during upload:', error);
      res.status(500).send('Failed to upload images.');
  }
});

app.post('/signup', async (req, res) => {
  const { email, password } = req.body;

  try {
    const committeeDB = await mongoose.createConnection('mongodb://0.0.0.0/mydatabase', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    const User = committeeDB.model('User', userSchema);

    const newUser = new User({
      email,
      password,
    });

    await newUser.save();

    res.send('Signup successful');
  } catch (err) {
    console.error(err);
    res.send('Error occurred during signup');
  }
});
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const committeeDB = await mongoose.createConnection('mongodb://0.0.0.0/mydatabase', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    const User = committeeDB.model('User', userSchema);

    // Perform your login/authentication logic here
    // For example, you can check if the email and password match a user in your database
    const user = await User.findOne({ email, password });

    if (user) {
      // Authentication successful
      
      const committeeName = getCommitteeNameFromPassword(password);
      res.redirect(`/${committeeName}/admin`);
    } else {
      // Authentication failed
      res.send('Invalid email or password');
    }
  } catch (err) {
    console.error(err);
    res.send('Error occurred during login');
  }
});
app.get('/:committee/admin', async (req, res) => {
  const committee = req.params.committee.replace('.', '_');

  try {
      const committeeDB = mongoose.createConnection(`mongodb://0.0.0.0/${committee}`, {
          useNewUrlParser: true,
          useUnifiedTopology: true
      });

      const Image1 = committeeDB.model('Image1', imageSchema);

      const images = await Image1.find().exec();

      res.render('admin', { committee: committee, images: images, });
  } catch (err) {
      console.error(err);
      res.status(500).send('Error fetching images');
  }
});
// Other server configuration and routes...


app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname, 'public', 'home.html'));
});

app.use(express.static(path.join(__dirname, 'public')));





app.listen(4001, function () {
  console.log("Server started at port 4001");
});

function getCommitteeNameFromPassword(password) {
  // Assuming the password format is "Committee123"
  return password.substring(0, password.length - 3);
}