
/**
 * Module dependencies.
 */

var express = require('express');
var mongodb = require('mongodb');
var GitHubApi = require('github').GitHubApi;
var mygengo = require('./deps/mygengo_node');
var config = require('./config');
mygengo.init(config.pub, config.pri);
var db = new mongodb.Db(
    'myGengohub',
    new mongodb.Server(
        '127.0.0.1',
        27017,
        {}
    )
);

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(app.router);
    app.use(express['static'](__dirname + '/public'));
});

app.configure('development', function(){
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function () {
    app.use(express.errorHandler());
});

// Routes

app.get('/', function (req, res){
    res.render('index', {
        title: 'Express'
    });
});

app.get('/repositories/:user/:repo', function (req, res) {
    res.render('repositories/show', {
        title: 'repository',
        user: req.params.user,
        repo: req.params.repo
    });
});

app.post('/repositories/:user/:repo', function (req, res) {
    var data = {
        job: {
            type: "text",
            slug: req.params.user + '/' + req.params.repo,
            body_src: req.body.readme,
            lc_src: 'en',
            lc_tgt: 'ja',
            tier: 'machine'
        },
        as_group: 0
    };
    console.log(data);
    mygengo.postJob(data, function (err, data) {
        if (err) {
            console.error(err);
            res.send(400);
        }
        console.log(data);
        db.collection('repository', function (err, c) {
            c.insert(data.response, function (err) {
                if (err) {
                    throw err;
                }
            });
        });
        res.redirect('/');
    });
});

app.get('/api/repository', function (req, res) {
    var user = req.param('user');
    var repo = req.param('repo');
    if (! (user && repo)) {
        res.send(400);
        return;
    }

    var callback = function (err, data) {
        res.send(data);
    };
    var github = new GitHubApi(true);

    github.getCommitApi().getBranchCommits(user, repo, 'master', function (err, data) {
        if (err) {
            console.error(err);
            res.send(err.status);
            return;
        }
        if (data.length > 0) {
            var sha = data[0].tree;
            github.getObjectApi().showTree(user, repo, sha, function (err, data) {
                if (err) {
                    console.error(err);
                    res.send(err.status);
                    return;
                }
                var i;
                // TODO 見つからなかったとき？
                for (i = data.length; i--;) {
                    if (data[i].name.match(/README/i)) {
                        github.getObjectApi().getRawData(user, repo, data[i].sha, callback);
                    }
                }
            });
        }
    });
});

db.open(function (err) {
    if (err) {
        throw err;
    }
    app.listen(3000);
    console.log("Express server listening on port %d", app.address().port);
});
