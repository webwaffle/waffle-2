var app = require('express')();
var moment = require('moment');
var session = require('express-session');
var FileStore = require('session-file-store')(session);
var bodyParser = require('body-parser');
var fs = require('fs');

app.set('port', process.env.PORT || 3000);

app.use(bodyParser.json({type: 'application/json'}));
var options = {
    secret: 'yee',
    resave: false,
    saveUninitialized: false,
    store: new FileStore,
    cookie: {
        maxAge: 3600000,
        secure: false,
        httpOnly: true
    },
    name: 'my.connect.sid'
}
app.use(session(options));

function fileToJson(path) {
    return JSON.parse(fs.readFileSync(path));
}
function jsonToFile(path, data) {
    fs.writeFileSync(path, JSON.stringify(data, undefined, 2));
}

app.post('/login', (req, res) => {
    /*
    Login endpoint, POST req
    Takes a JSON req body with username and password
    Returns some JSON and a session id cookie if successful
    */
    if(req.body.username && req.body.password) {
        var table = fileToJson('data/users.json');
        for(var i = 0; i < table.length; i++) {
            if(table[i].username == req.body.username) {
                var found = true;
                if(table[i].password == req.body.password) {
                    req.session.username = req.body.username;
                    req.session.userid = req.body.password;
                    res.json({ success: true });
                } else {
                    res.json({error: "Incorrect password"});
                }
            }
        }
        if(!found) {
            res.json({error: "Incorrect username"});
        }
    } else {
        res.json({error: "Both username and password are required"});
    }
})
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
})
app.post('/create-user', (req, res) => {
    if(req.body.username && req.body.password) {
        var table = fileToJson('data/users.json');
        for(var i = 0; i < table.length; i++) {
            if (table[i].username == req.body.username) {
                var taken = true;
            }
        }
        if(taken) {
            res.json({ error: "Username taken" })
        } else {
            if(table[0]) {
                var id = table.reverse()[0].id + 1;
            } else {
                id = 0;
            }
            table.push({
                id: id,
                username: req.body.username,
                password: req.body.password,
                created: moment().format("MM-DD-YY h:mm:ss a")
            })
            jsonToFile('data/users.json', table);
            res.json({ success: true })
        }
    } else {
        res.json({ error: "Invalid username/password" })
    }
})
app.get('/posts', (req, res) => {
    res.json({ success: true, posts: fileToJson('data/posts.json') })
})
app.post('/create-post', (req, res) => {
    if(req.session.username && req.session.userid) {
        if(req.body.title && req.body.content) {
            var table = fileToJson('data/posts.json');
            if(table[0]) {
                var id = table.reverse()[0].id + 1;
            } else {
                var id = 0;
            }
            table.push({
                id: id,
                title: req.body.title,
                content: req.body.content,
                poster: req.session.username,
                posted: moment().format("MM-DD-YY h:mm:ss a"),
                likes: 0,
                likers: []
            });
            jsonToFile('data/posts.json', table);
            res.json({ success: true })
        } else {
            res.json({ error: "You must have a title and post content" })
        }
    } else {
        res.status(401);
        res.json({ error: "You are not logged in" });
    }
})
app.put('/like/:id', (req, res) => {
    if(req.session.username) {
        var table = fileToJson('data/posts.json');
        for(var i = 0; i < table.length; i++) {
            if(req.params.id == table[i].id) {
                //console.log('1')
                if(table[i].likers.includes(req.session.username)) {
                    //console.log('2')
                    res.json({ error: "You have already liked this post" });
                    return;
                } else {
                    //console.log('3')
                    table[i].likers.push(req.session.username);
                    table[i].likes++;
                    success = true;
                    break;
                }
            }
        }
        if(success) {
            //console.log('4')
            jsonToFile('data/posts.json', table);
            res.json({ success: true });
        }
    } else {
        res.status(401);
        res.json({ error: "You are not logged in." })
    }
})

app.listen(app.get('port'), function() {
    console.log('API Started on port ' + app.get('port'));
})