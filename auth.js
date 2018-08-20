var fs = require('fs');

function fileToJson(path) {
    return JSON.parse(fs.readFileSync(path));
}
function jsonToFile(path, data) {
    fs.writeFileSync(path, JSON.stringify(data, undefined, 2));
}

module.exports = function(req, res, next) {
  if(req.query.key) {
    var table = fileToJson('data/users.json');
    for (var i = 0; i < table.length; i++) {
      if(table[i].apiKey == req.query.key) {
        req.user = {
          key: req.query.key,
          id: table[i].id,
          username: table[i].username
        }
        var found = true;
        break;
      }
    }
    if(found) {
      next();
      return;
    } else {
      res.status(401);
      res.json({ success: false, error: "Unauthorized- Bad Key" })
    }
  } else {
    res.status(401);
    res.json({ success: false, error: "Unauthorized- No Key" })
  }
}
