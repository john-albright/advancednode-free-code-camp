const passport = require('passport');
const bcrypt = require('bcrypt');

module.exports = function (app, myDataBase) {

  // Render the index page stating that a connection has been made
  app.route('/').get((req, res) => {
    res.render('pug', {
      title: 'Connected to Database', 
      message: 'Please login',
      showLogin: true,
      showRegistration: true,
      showSocialAuth: true
    });
  });

  // POST requests to /login
  app.route('/login').post(passport.authenticate('local', { failureRedirect: '/'}), (req, res) => {
    res.redirect('/profile');
  });
  
  // GET requests to /profile
  app.route('/profile').get(ensureAuthenticated, (req, res) => {
    res.render(process.cwd() + '/views/pug/profile', { username: req.user.username });
  });

  // GET requests to /logout
  app.route('/logout').get((req, res) => {
    req.logout();
    res.redirect('/');
  });

  // POST requests to /register
  app.route('/register').post((req, res, next) => {
    // Check the database for the username 
    myDataBase.findOne({ username: req.body.username }, (err, user) => {
      if (err) {
        next(err);
      } else if (user) {
        res.redirect('/');
      } else {
        // Hash the password using bcrypt
        const hash = bcrypt.hashSync(req.body.password, 12);

        // Insert the username into the database if not found 
        myDataBase.insertOne({username: req.body.username, password: hash}, (err, doc) => {
          if (err) {
            res.redirect('/');
          } else {
            next(null, doc.ops[0]); // The inserted document is held within ops property
          }
        });
      }
    });
  }, passport.authenticate('local', { failureRedirect: '/' }), (req, res, next) => {
      res.redirect('/profile');
    }
  );

  // GET requests to /auth/github
  app.route('/auth/github').get(passport.authenticate('github'));

  // GET requests to /auth/github/callback
  app.route('/auth/github/callback').get(passport.authenticate('github', { failureRedirect: '/'}), (req, res) => {
        res.redirect('/profile');
  });

  // Handle 404 requests
  app.use((req, res, next) => {
    res.status(404).type('text').send('Not Found');
  });
    
}

// Create middleware function to make sure the user is authenticated
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    res.redirect('/');
}