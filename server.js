'use strict';
require('dotenv').config();
const express = require('express');
const myDB = require('./connection');
const fccTesting = require('./freeCodeCamp/fcctesting.js');
const session = require('express-session');
const passport = require('passport');

// Connect to other JS files
const routes = require('./routes.js');
const auth = require('./auth.js');

const app = express();

// Mount an HTTP server
const http = require('http').createServer(app);
const io = require('socket.io')(http);

const passportSocketIo = require('passport.socketio');
const cookieParser = require('cookie-parser');

// Initialize a new memory store
const MongoStore = require('connect-mongo')(session);
const URI = process.env.MONGO_URI;
const store = new MongoStore({ url: URI });

// Have Socket.IO use the memory store
io.use(
  passportSocketIo.authorize({
    cookieParser: cookieParser,
    key: 'express.sid',
    secret: process.env.SESSION_SECRET,
    store: store,
    success: onAuthorizeSuccess,
    fail: onAuthorizeFail
  })
);

app.set('view engine', 'pug');

fccTesting(app); //For FCC testing purposes
app.use('/public', express.static(process.cwd() + '/public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Use express session
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  store: store,
  key: 'express.sid',
  cookie: { secure: false }
}));

// Use the passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Connect database to start listening for requests 
myDB(async (client) => {
  const myDataBase = await client.db('database').collection('users');

  routes(app, myDataBase);

  auth(app, myDataBase);

  // Initialize user count to 0
  let currentUsers = 0;

  // Listen for connections
  io.on('connection', socket => {
    ++currentUsers;

    // Emit user information once connection is made
    io.emit('user', {
      name: socket.request.user.name,
      currentUsers,
      connected: true
    });

    console.log('A user has connected');
    // console.log(socket.request.user);

    socket.on('chat message', (message) => {
      io.emit('chat message', {
        name: socket.request.user.name,
        message
      });
    });

    // Listen for disconnect events
    socket.on('disconnect', () => {
      --currentUsers;
      io.emit('user', {
        name: socket.request.user.name,
        currentUsers,
        connected: false
      });
    });
  });

}).catch((e) => {

  // Render the index page displaying the error message
  app.route('/').get((req, res) => {
    res.render('pug', { title: e, message: 'Unable to login' });
  });
});;

function onAuthorizeSuccess(data, accept) {
  console.log('successful connection to socket.io');
  
  accept(null, true);
}

function onAuthorizeFail(data, message, error, accept) {
  if (error) throw new Error(message);
  console.log('failed connection to socket.io:', message);
  accept(null, false);
}

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log('Listening on port ' + PORT);
});
