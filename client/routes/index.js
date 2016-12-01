const express = require('express'),
    indexRouter = express.Router(),
    path = require('path'),
    fs = require('fs'),
    r = require('request'),
    rToken = r.defaults({
        headers: {
            'Authorization': 'Bearer X7zBFwC5sCwnKhU0psnqgfDb34HZH4eQKwgqEFYHVZSoTkTy8c08BONn44v6dYnZDBwJPbkZrf6DJU4kNe7QxjDVU0fsBlPhfxCOqtt6lE2aN53ib9YBW7Wiawf0JBtF0zMxsmvZfe7V4HsS9LRuC5Fiz6OqterTP21Ae74D8Jj1lwGYAh9tOpC34Y1Vv5w2AvCc2Y2rq8dAqSSJ0CmuDf9oY2sM5BqVzZHjZ5ZEacmwzvVNWHyHJY7uRE9fBFf2'
        }
    });

let url = 'http://server:3000/api/v1';

module.exports = function () {

    indexRouter.route('/')
        .get(function (req, res) {
            res.render('index');
        });

    indexRouter.post('/search', function (req, res) {
        rToken.get('http://server:3000/api/v1/search' + req.body.url,
            function (err, response, body) {
                res.send(body);
        })
    });

    indexRouter.post('/get', function (req, res) {
        rToken.get(url + req.body.url, function (err, response, body) {
            res.send(body);
        });
    });

    indexRouter.post('/post', function (req, res) {
        fs.readFile(path.resolve(__dirname, '../public/files/test.txt'), 'utf8', function (err, data) {
            rToken.post({ url: url + req.body.url, headers: { 'Content-Type': 'text/plain' }, body: data },
                function (err, response, body) {
                    res.send(body);
                })
        });
    });

    indexRouter.post('/head', function (req, res) {
        rToken.head(url + req.body.url, function (err, response, body) {
            res.send({ headers: response.headers });
        });
    });

    indexRouter.post('/delete', function (req, res) {
        rToken.delete(url + req.body.url, function (err, response, body) {
            res.send({ headers: response.headers });
        });
    });

    indexRouter.post('/put', function (req, res) {
        fs.readFile(path.resolve(__dirname, '../public/files/test2.txt'), 'utf8', function (err, data) {
            rToken.put({ url: url + req.body.url, headers: { 'Content-Type': 'text/plain' }, body: data },
                function (err, response, body) {
                    res.send(body);
                });
        });
    });

    indexRouter.post('/patch', function (req, res) {
        rToken.patch(url + req.body.url, function (err, response, body) {
            res.send(body);
        });
    });

    return indexRouter;
};
