var app = require('express')();
var cors = require('cors');
var authUser = require('./auth');
var moment = require('moment');
var bodyParser = require('body-parser');
var fs = require('fs');

app.set('port', process.env.PORT || 3000);

app.use(cors());

app.use(bodyParser.json({type: 'application/json'}));
/*var options = {
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
app.use(session(options));*/

function fileToJson(path) {
    return JSON.parse(fs.readFileSync(path));
}
function jsonToFile(path, data) {
    fs.writeFileSync(path, JSON.stringify(data, undefined, 2));
}
var randomString = function(length) {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for(var i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}


app.use((req, res, next) => {
  res.apiError = function(error) {
    res.json({ success: false, error: error })
  }
  next();
})


app.post('/login', (req, res) => {
    /*
    Login endpoint, POST req
    Takes a JSON req body with username and password
    Returns some JSON with an API key
    */
    if(req.body.username && req.body.password) {
        var table = fileToJson('data/users.json');
        for(var i = 0; i < table.length; i++) {
            if(table[i].username == req.body.username) {
                var found = true;
                if(table[i].password == req.body.password) {
                    res.json({ success: true, apiKey: table[i].apiKey, username: table[i].username });
                } else {
                    res.json({ success: false, error: "Incorrect password" });
                }
                break;
            }
        }
        if(!found) {
            res.json({ success: false, error: "Incorrect username"});
        }
    } else {
        res.json({ success: false, error: "Both username and password are required"});
    }
})
/*app.get('/logout', (req, res) => {
    req.user.destroy();
    res.json({ success: true });
})*/
app.post('/create-user', (req, res) => {
    if(req.body.username && req.body.password) {
        var table = fileToJson('data/users.json');
        for(var i = 0; i < table.length; i++) {
            if (table[i].username == req.body.username) {
                var taken = true;
            }
        }
        if(taken) {
            res.json({ success: false, error: "Username taken" })
        } else {
            if(table[0]) {
                var id = table.reverse()[0].id + 1;
            } else {
                id = 0;
            }
            var keys = table.map((x) => {
              return x.key;
            })
            var key = randomString(10);
            while (keys.includes(key)) {
              key = randomString(10);
            }
            table.push({
                id: id,
                apiKey: key,
                username: req.body.username,
                password: req.body.password,
                created: moment().format("MM-DD-YY h:mm:ss a")
            })
            jsonToFile('data/users.json', table);
            res.json({ success: true, username: req.body.username, apiKey: key })
        }
    } else {
        res.json({ success: false, error: "Invalid username/password" })
    }
})
app.get('/posts', (req, res) => {
  var table = fileToJson('data/posts.json');
  /*for (var i = 0; i < table.length; i++) {
    if(table[i].likers.includes(req.user.username)) {
      table[i].liked = true;
    } else {
      table[i].liked = false;
    }
  }*/
  res.json({ success: true, posts: table })
})
app.get('/post/:id', (req, res) => {
    var table = fileToJson('data/posts.json');
    for(var i = 0; i < table.length; i++) {
        if(table[i].id == req.params.id) {
            var post = table[i];
        }
    }
    if(post) {
        post.comments = post.comments.reverse()
        res.json({ success: true, post: post });
    } else {
        res.json({ success: false, error: "That post doesn't exist. " });
    }
})
app.get('/search-posts', (req, res) => {
    var table = fileToJson('data/posts.json');
    var results = [];
    for (var i = 0; i < table.length; i++) {
        if(table[i].title.toUpperCase().includes(req.query.q.toUpperCase())) {
            results.push(table[i]);
        }
    }
    res.json({ success: true, results: results })
})
app.post('/create-post', authUser, (req, res) => {
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
          poster: req.user.username,
          posted: moment().format("MM-DD-YY h:mm:ss a"),
          likes: 0,
          likers: [],
          comments: []
      });
      jsonToFile('data/posts.json', table);
      res.json({ success: true })
  } else {
      res.json({ success: false, error: "You must have a title and post content" })
  }
})
app.put('/like/:id', authUser, (req, res) => {
  var table = fileToJson('data/posts.json');
  var found = false;
  for(var i = 0; i < table.length; i++) {
      if(req.params.id == table[i].id) {
          var found = true;
          //console.log('1')
          if(table[i].likers.includes(req.user.username)) {
              //console.log('2')
              success = true;
              table[i].likes--;
              table[i].likers = table[i].likers.filter(username => username != req.user.username);
          } else {
              //console.log('3')
              table[i].likers.push(req.user.username);
              table[i].likes++;
              success = true;
              break;
          }
      }
  }
  if(!found) {
    //console.log('3.5');
    res.json({ success: false, error: "Post not found" })
    return;
  }
  if(success) {
      //console.log('4')
      jsonToFile('data/posts.json', table);
      res.json({ success: true });
  }
})
app.get('/checkliked/:id', authUser, (req, res) => {
  var table = fileToJson('data/posts.json');
  for (var i = 0; i < table.length; i++) {
    if (table[i].id == req.params.id) {
      var found = true;
      res.json({ success: true, liked: table[i].likers.includes(req.user.username) });
      return;
    }
  }
  if(!found) {
    res.json({ success: false, error: "Post not found" })
    return;
  }
})
app.post('/create-comment/:id', authUser, (req, res) => {
        if(req.body.comment) {
            var table = fileToJson('data/posts.json');
            for(var i = 0; i < table.length; i++) {
                if(table[i].id == req.params.id) {
                    var found = true;
                    table[i].comments.push({
                        comment: req.body.comment,
                        commenter: req.user.username,
                        commented: moment().format("MM-DD-YY h:mm:ss a")
                    });
                    jsonToFile('data/posts.json', table);
                    res.json({ success: true, comments: table[i].comments.reverse() });
                    return;
                }
            }
            if (!found) {
                res.json({ success: false, error: "Post ID not found" })
            }
        } else {
            res.json({ success: false, error: "You must have a comment" })
        }
})
app.post('/create-chat', authUser, (req, res) => {
  if(req.body.name && req.body.name != "") {
    var table = fileToJson('data/chats.json');
    if(table[0]) {
      var id = table.reverse()[0].id + 1;
    } else {
      var id = 0;
    }
    table.push({
      id: id,
      name: req.body.name,
      creator: req.user.username,
      members: [],
      messages: []
    });
    jsonToFile('data/chats.json', table);
    res.json({ success: true })
  } else {
    res.apiError('Chat name required');
  }
})

app.post('/chat-invite/:id', authUser, (req, res) => {
  if(req.body.username && req.body.username != "") {
    var table = fileToJson('data/chats.json');
    for (var i = 0; i < table.length; i++) {
      if(table[i].id == req.params.id) {
        var found = true;
        if(table[i].creator == req.user.username) {
          if(table[i].members.includes(req.body.username)) {
            res.apiError('Already invited');
            return;
          } else {
            table[i].members.push(req.body.username);
            jsonToFile('data/chats.json', table);
            res.json({ success: true });
            return;
          }
        } else {
          res.status(401);
          res.apiError('You are not the creator of this chat');
          return;
        }
      }
    }
    if(!found) {
      res.apiError('Chat id not found');
      return;
    }
  } else {
    res.apiError('You need to invite someone');
    return;
  }
})

app.post('/chat-message/:id', authUser, (req, res) => {
  if(req.body.message && req.body.message != "") {
    var table = fileToJson('data/chats.json');
    for (var i = 0; i < table.length; i++) {
      if(table[i].id == req.params.id) {
        var found = true;
        if(table[i].members.includes(req.user.username) || table[i].creator == req.user.username) {
          table[i].messages.push({
            message: req.body.message,
            from: req.user.username,
            sent: moment().format("MM-DD-YYYY h:mm:ss a")
          });
          jsonToFile('data/chats.json', table);
          res.json({ success: true, message: req.body.message });
          return;
        } else {
          res.status(401);
          res.apiError('You are not in this chat');
          return;
        }
      }
    }
    if(!found) {
      res.apiError('Chat id not found');
      return;
    }
  } else {
    res.apiError('You need to have a message');
    return;
  }
})

app.get('/chat-info/:id', authUser, (req, res) => {
  var table = fileToJson('data/chats.json');
  var chatArray = table.filter(x => x.id == req.params.id);
  if(chatArray.length != 0) {
    var chat = chatArray[0];
  } else {
    res.apiError('Chat not found');
    return;
  }
  if(chat.members.includes(req.user.username) || chat.creator == req.user.username) {
    res.json({ success: true, chat: chat });
  } else {
    //res.status(401);
    res.apiError('You are not in this chat.')
  }
})

app.get('/get-chats', authUser, (req, res) => {
  var table = fileToJson('data/chats.json');
  var results = table.filter((x) => { return x.creator == req.user.username || x.members.includes(req.user.username) });
  res.json({ success: true, chats: results });
})

app.listen(app.get('port'), () => {
    console.log('API Started on port ' + app.get('port'));
})
