const express = require('express'),
    path = require('path'),
    logger = require('morgan'),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    session = require('express-session'),
    mongoose = require('mongoose');

//TODO: config
//Get Models
const User = require('./models/userModel'),
    Token = require('./models/tokenModel'),
    File = require('./models/fileModel');


// Get routers
const userRouter = require('./routes/userRouter')(User, Token),
    apiRouter = require('./routes/apiRouter')(User, File);

const app = express();
mongoose.Promise = Promise;
mongoose.connect(`${process.argv[3] || 'localhost'}:27017/uwc`);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');


app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: 'oh my dude',
    resave: false,
    saveUninitialized: false
}));

//Add passport middleware
require('./config/passport')(app, User, Token);

//Set routes
app.use('/', userRouter);
app.use('/api/v1', apiRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

function initScript() {
    let user = new User({
        username: 'admin',
        password: 'password'
    });
    user.save()
        .then(result => {
            let token = new Token();
            token.value = 'X7zBFwC5sCwnKhU0psnqgfDb34HZH4eQKwgqEFYHVZSoTkTy8c08BONn44v6dYnZDBwJPbkZrf6DJU4kNe7QxjDVU0fsBlPhfxCOqtt6lE2aN53ib9YBW7Wiawf0JBtF0zMxsmvZfe7V4HsS9LRuC5Fiz6OqterTP21Ae74D8Jj1lwGYAh9tOpC34Y1Vv5w2AvCc2Y2rq8dAqSSJ0CmuDf9oY2sM5BqVzZHjZ5ZEacmwzvVNWHyHJY7uRE9fBFf2';
            token.userId = result.id;
            token.save();
        });
}
initScript();
module.exports = app;
