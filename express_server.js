const bodyParser = require("body-parser");
const express = require("express");
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const app = express();
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['dtyrytuuututrdteteet'], // random key provided
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}))
var PORT = 8080; // default port 8080

app.set("view engine", "ejs");


// ****************** DATA STORE ************************
var urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "aJ48lW" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "aJ48lW"}
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

// ******************** FUNCTIONS **********************
/*
  Function to check if given email is alredy present in users object
  Input: email (string)
  Output: user object if found else false
*/
function isEmailAlreadyPresent(email){
  for (let userid in users){
    if(users[userid].email === email){
      return users[userid];
    }
  }
  return false;
}
/*
  Function to generate random string of length 6
  Input: Nothing
  Output: random string of length 6 (string)
*/
function generateRandomString() {
  let array = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".slice('');
  var randomString = '';
  for (var i = 0; i < 6; i++){
    var index = Math.floor((Math.random() * 61) + 1);
    randomString += array[index];
  }
  return randomString;
}

/*
  Function to get all urls for given id
  Input: id (string)
  Output: url objects for given user id (object)
*/
function urlsForUser(id) {
  let filteredUrls = {};
  for(let shortURL in urlDatabase) {
    if(urlDatabase[shortURL].userID === id) {
      filteredUrls[shortURL] = urlDatabase[shortURL];
    }
  }
  return filteredUrls;
}

// ****************** GET URLS **************************

app.get("/", (req, res) => {
  if(req.session.user_id){
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

// Get all urls page
app.get("/urls", (req, res) => {
  let userId = req.session.user_id;
  if (!userId) {
      res.send({
        message: 'Please Login to access URL'
      });
  } else {
    let filteredUrls = urlsForUser(userId);
    let templateVars = {
      urls: filteredUrls,
      user: users[userId]
    };
    res.render("urls_index", templateVars);
  }
});

// To create new url
app.get("/urls/new", (req, res) => {
  if(req.session.user_id){
    let templateVars = {
      user: users[req.session.user_id]
    };
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});

// To see single url details
app.get("/urls/:shortURL", (req, res) => {
  let shortURL = req.params.shortURL;
  let userId = req.session.user_id;
  let url = urlDatabase[shortURL];
  if (!(shortURL in urlDatabase)){
    res.status(400).send({
      message: 'Could not find matching Long URL'
    });
  } else if (!userId) {
    res.status(400).send({
      message: 'Please Login to access URL'
    });
  } else if (url.userID != userId){
    res.status(400).send({
      message: 'Not authorized to see this URL'
    });
  } else {
    let templateVars = {
      shortURL: req.params.shortURL,
      longURL: urlDatabase[req.params.shortURL].longURL,
      user: users[userId]
    };
    res.render("urls_show", templateVars);
  }
});

// To redirect to long URL
app.get("/u/:shortURL", (req, res) => {
  let shortURL = req.params.shortURL;
  if (!(shortURL in urlDatabase)){
    res.status(400).send({
      message: 'Could not find matching Long URL'
    });
  } else {
    res.redirect(urlDatabase[shortURL].longURL);
  }
});

// To login to TinyApp
app.get("/login", (req, res) => {
  let userId = req.session.user_id;
  if (userId) {
    res.redirect("/urls");
  } else {
    let templateVars = {
      user: users[req.session.user_id]
    };
    res.render("urls_login", templateVars);
  }
});

// To Register to TinyApp
app.get("/register", (req, res) => {
  let userId = req.session.user_id;
  if (userId) {
    res.redirect("/urls");
  }
  let templateVars = {
    user: users[req.session.user_id]
  };
  res.render("urls_reg", templateVars);
});

// ***************** POST URLS *******************

// To process new URL
app.post("/urls", (req, res) => {
  let userId = req.session.user_id;
  if (!userId) {
    res.status(400).send({
      message: 'Please Login to create new URL'
    });
  } else {
    var shortURL = generateRandomString();
    urlDatabase[shortURL] = {
      longURL : req.body['longURL'],
      userID : req.session.user_id
    };
    res.redirect("/urls");
  }
});

// To process URL update
app.post("/urls/:shortURL", (req, res) => {
  let userId = req.session.user_id;
  if (!userId) {
    res.status(400).send({
      message: 'Please Login to update this URL'
    });
  } else {
    let shortURL = req.params.shortURL;
    let url = urlDatabase[shortURL];
    if (url.userID != userId){
      res.status(400).send({
        message: 'Not authorized to update this URL'
      });
    }
    urlDatabase[shortURL] = {longURL: req.body["longURL"], userID: req.session.user_id};
    res.redirect("/urls");
  }
});

// To delete URL
app.post("/urls/:shortURL/delete", (req, res) => {
  let userId = req.session.user_id;
  let shortURL = req.params.shortURL;
  let url = urlDatabase[shortURL];
  if (!userId) {
    res.status(400).send({
      message: 'Please Login to delete this URL'
    });
  } else if (url.userID != userId){
    res.status(400).send({
      message: 'Not authorized to delete this URL'
    });
  } else if(urlDatabase[shortURL].userID != userId){
    res.status(400).send({
      message: "You are not authorized to delete this URL"
    });
  } else {
    delete urlDatabase[shortURL];
    res.redirect("/urls");
  }
});

// To process login form
app.post("/login", (req, res) => {
  let email = req.body["email"];
  let password = req.body["password"];
  const user = isEmailAlreadyPresent(email);
  if(user){
    if(bcrypt.compareSync(password, user.password)){
      req.session.user_id = user.id;
      res.redirect("/urls");
    } else {
      res.status(403).send({
        message: "Incorrect Password, Try correct password to login."
      });
    }
  } else {
    res.status(403).send({
      message: "Invalid Email ID"
    });
  }
});

// To process new registeration
app.post("/register", (req, res) => {
  let email = req.body["email"];
  let password = req.body["password"];
  if(!email || !password){
    return res.status(400).send({
      message: "Please enter valid email and password"
    });
  } else if(isEmailAlreadyPresent(email)){
      return res.status(400).send({
        message: "Username already exists"
    });
  } else {
      let registration = {
        id:  generateRandomString(),
        email: req.body["email"],
        password: bcrypt.hashSync(req.body["password"], 10)
      };
      users[registration.id] = registration;
      req.session.user_id = registration.id;
      res.redirect("/urls");
  }
  });

// To logout
app.post("/logout", (req, res) => {
  // Clears the session
  req.session = null;
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});