const fsp = require('fs-promise'),
    path = require('path');

module.exports = function (User, Token) {

    function index(req, res) {
        res.render('index', { authenticated: req.isAuthenticated() });
    }

    /**
     * Create user, initialize root directory and `json` file with files tree
     * @param req
     * @param res
     */
    function createUser(req, res) {
        //TODO: better checking for errors
        if (!req.body || Object.keys(req.body).length < 2) {
            res.status(400).send('You need to type in all fields.');
        }
        let user = new User(req.body);
        let username = user.username;
        let dirPath = path.resolve(__dirname, '../USERS_DATA', `${username}`);
        user.save()
            .then(result => {
                return fsp.mkdir(dirPath);
            })
            .then(r => {
                res.redirect('/login');
            })
            .catch(err => {
                //TODO: mongoose errors showing
                res.render('error', { error: err });
            });

    }

    function getToken(req, res) {
        Token.find({ userId: req.user.id})
            .then(tokens => {
                if (tokens.length  === 0) {
                    res.render('token');
                } else {
                    res.render('token', { token: tokens[0].value });
                }
            }, err => {
                res.status(500).render('error', { error: err });
            });
    }

    function postToken(req, res) {
        let userId = req.user.id;
        //TODO: remove Token if exist
        checkTokenExist(userId)
            .then(result => {
                if (result === true) {
                    return removeToken(userId);
                } else {
                    return createToken(userId);
                }
            })
            .then(result => {
                if (result === true) {
                    return createToken(userId);
                } else {
                    res.render('token', { token: result.value });
                }
            })
            .then(result => {
                if (result.value) {
                    res.render('token', { token: result.value });
                }
            })
            .catch(err => {
                res.render('error', { error: err });
            });
    }

    function logout(req, res) {
        req.logout();
        res.redirect('/');
    }
    
    function checkAuthentication(req, res, next) {
        if (req.isAuthenticated() && req.user) {
            next();
        } else {
            res.redirect('/login');
        }
    }

    function checkTokenExist(userId) {
        return new Promise((resolve, reject) => {
            Token.find({ userId: userId })
                .then(tokens => {
                    if (tokens.length > 0) {
                        return resolve(true);
                    } else {
                        return resolve(false);
                    }
                }, error => {
                    return reject(error);
                });
        });
    }

    function removeToken(userId) {
        return new Promise((resolve, reject) => {
            Token.remove({ userId: userId}, function (err) {
                if (err) {
                    return reject(err);
                } else {
                    return resolve(true);
                }
            });
        })
    }

    function createToken(userId) {
        let token = new Token();
        token.value = token.uid(256);
        token.userId = userId;
        return token.save();
    }


    return {
        createUser: createUser,
        postToken: postToken,
        index: index,
        logout: logout,
        checkAuthentication: checkAuthentication,
        getToken: getToken
    }
};



