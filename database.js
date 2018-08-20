var fs = require('fs');
module.exports = function(path) {
  this.path = path;
  this.queryAll = function() {
    return new Promise((resolve, reject) => {
      fs.readFile(path, (err, data) => {
        if(err) {
          reject(err);
          return
        }
        resolve(JSON.parse(data))
      })
    })
  }
  this.writeAll = function(data) {
    return new Promise((resolve, reject) => {
      fs.writeFile(path, JSON.stringify(data, undefined, 2), (err) => {
        if(err) {
          reject(err);
          return;
        }
        resolve(true);
      })
    })
  }
}
