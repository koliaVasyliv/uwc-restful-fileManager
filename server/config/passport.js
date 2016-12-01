const passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy,
    BearerStrategy = require('passport-http-bearer').Strategy;


module.exports = function (app, User, Token) {
    'use strict';
    app.use(passport.initialize());
    app.use(passport.session());

    passport.serializeUser(function (user, done) {
        done(null, user._id);
    });

    passport.deserializeUser(function (id, done) {
        User.findById(id, (err, user) => {
            done(err, user);
        });
    });


    passport.use('local', new LocalStrategy({
        usernameField: 'username',
        passwordField: 'password'
    }, function (username, password, done) {
        User.findOne({username: username}).then(function (user) {
            if (!user) {
                return done(null, false, { message: 'Invalid email address or password'});

            } else if(user.isValidPassword(password))  {
                return done(null, user);

            } else {
                return done(null, false, { message: 'Invalid email address or password.' });
            }
        }, function (err) {
            done(err);
        });
    }));


    passport.use('bearer', new BearerStrategy(
        function (accessToken, cb) {
            Token.findOne({value: accessToken }, function (err, token) {
                if (err) return cb(err);

                if (!token) return cb(null, false);

                User.findById(token.userId, function (err, user) {
                    if (err) return cb(err);
                    if (!user) return cb(null, false);

                    cb(null, user, { scope: '*' });
                })
            })
        }
    ));
};