const bodyParser = require("body-parser");
var express = require("express");
var cookieParser = require('cookie-parser');
var app = express();
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
var PORT = 8080; // default port 8080

app.set("view engine", "ejs");

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

function generateRandomString() {
  var array = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".slice('');
  var randomString = '';
  for (var i = 0; i < 6; i++){
    var index = Math.floor((Math.random() * 61) + 1);
    randomString += array[index];
  }
  return randomString;
}

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.post("/urls", (req, res) => {
  console.log(req.body);
  var shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body['longURL'];
  res.send("Ok");         // Respond with 'Ok' (we will replace this)
});

app.post("/urls/:shortURL/delete", (req, res) => {
  let shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

app.get("/urls", (req, res) => {
  let templateVars = {
    urls: urlDatabase,
    username: req.cookies["username"]
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let templateVars = {
    username: req.cookies["username"]
  };
  res.render("urls_new", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  res.redirect(urlDatabase[req.params.shortURL]);
});

app.get("/urls/:shortURL", (req, res) => {
  let templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    username: req.cookies["username"]
  };
  res.render("urls_show", templateVars);
});

app.post("/urls/:shortURL", (req, res) => {
  let shortURL = req.params.shortURL;
  urlDatabase[shortURL] = req.body["longURL"];
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  let name = req.body["username"];
  res.cookie('username', name);
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.cookie('username', "");
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