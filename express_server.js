const bodyParser = require("body-parser");
var express = require("express");
var cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
var app = express();
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
var PORT = 8080; // default port 8080

app.set("view engine", "ejs");

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
}

function isEmailAlreadyPresent(email){
  for (let userid in users){
    if(users[userid].email === email){
      return users[userid];
    }
  }
  return false;
}

function generateRandomString() {
  let array = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".slice('');
  var randomString = '';
  for (var i = 0; i < 6; i++){
    var index = Math.floor((Math.random() * 61) + 1);
    randomString += array[index];
  }
  return randomString;
}

function urlsForUser(id) {
  let filteredUrls = {};
  for(let shortURL in urlDatabase) {
    if(urlDatabase[shortURL].userID === id) {
      filteredUrls[shortURL] = urlDatabase[shortURL];
    }
  }
  return filteredUrls;
}

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.post("/urls", (req, res) => {
  console.log(req.body);
  var shortURL = generateRandomString();
  urlDatabase[shortURL] = {longURL : req.body['longURL'], userID : req.cookies["user_id"]};
  res.redirect("/urls");
});

app.post("/urls/:shortURL/delete", (req, res) => {
  let userID = req.cookies["user_id"];
  let shortURL = req.params.shortURL;
  console.log(shortURL);
  if(!userID || urlDatabase[shortURL].userID != userID){
    res.status(400).send({
      message: "You are not authorized to delete this URL"
    });
  }
  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

app.get("/urls", (req, res) => {
  let filteredUrls = urlsForUser(req.cookies["user_id"]);
  console.log(filteredUrls);
  let templateVars = {
    urls: filteredUrls,
    user: users[req.cookies["user_id"]]
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let templateVars = {
    user: users[req.cookies["user_id"]]
  };
  res.render("urls_new", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  res.redirect(urlDatabase[req.params.shortURL].longURL);
});


app.get("/urls/:shortURL", (req, res) => {
  let userId = req.cookies["user_id"];
  let url = urlDatabase[req.params.shortURL];
  if (!url || url.userID != userId){
    res.status(400).send({
      message: 'Not authorized to see this URL'
    })
  }
  let templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    user: users[userId]
  };
  res.render("urls_show", templateVars);
});

app.get("/register", (req, res) => {
  let templateVars = {
    user: users[req.cookies["user_id"]]
  };
  res.render("urls_reg", templateVars);
});

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
      res.cookie('user_id', registration.id);
      console.log(users);
      res.redirect("/urls");
  }
  });

app.post("/urls/:shortURL", (req, res) => {
  let shortURL = req.params.shortURL;
  urlDatabase[shortURL] = {longURL: req.body["longURL"], userID: req.cookies["user_id"]};
  res.redirect("/urls");
});

app.get("/login", (req, res) => {
  let templateVars = {
    user: users[req.cookies["user_id"]]
  };
  res.render("urls_login", templateVars);
});

app.post("/login", (req, res) => {
  let email = req.body["email"];
  let password = req.body["password"];
  const user = isEmailAlreadyPresent(email);
  if(user){
    if(bcrypt.compareSync(password, user.password)){
      res.cookie('user_id', user.id);
      res.redirect("/urls");
    } else {
      res.status(403).send({
        message: "Incorrect Password"
      });
    }
  } else {
    res.status(403).send({
      message: "Invalid Email ID"
    });
  }
});

app.post("/logout", (req, res) => {
  res.cookie('user_id', "");
  res.redirect("/urls");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});