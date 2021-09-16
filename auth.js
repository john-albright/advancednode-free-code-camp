const passport = require('passport');
const LocalStrategy = require('passport-local');
const ObjectID = require('mongodb').ObjectID;
const bcrypt = require('bcrypt');

module.exports = function (app, myDataBase) {

  // Serialize the user's information
  passport.serializeUser((user, done) => {
    done(null, user._id);
  });

  // Deserialize the user's information
  passport.deserializeUser((id, done) => {
    myDataBase.findOne({ _id: new ObjectID(id) }, (err, doc) => {
      done(null, doc);
    });
  })

  // Set up a local strategy
  passport.use(new LocalStrategy(
    function(username, password, done) {
      myDataBase.findOne({ username: username }, function(err, user) {
        console.log('User ' + username + ' attempted to log in.');
        if (err) { return done(err); }
        if (!user) { return done(null, false); }
        if (!bcrypt.compareSync(password, user.password)) { return done(null, false); }
        return done(null, user);
      });
    }
  ));

}