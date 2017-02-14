let deployd = require('deployd');

let server = deployd({
  port: process.env.PORT || 8000,
  env: 'production',
  db: {
    connectionString: process.env.MONGODB_URI || 'mongodb://heroku_xd5vwxrx:l57ba6l0qaufndgcphmt2g06vq@ds149489.mlab.com:49489/heroku_xd5vwxrx'
  }
});

server.listen();

server.on('listening', function() {
  console.log("Server is listening");
});

server.on('error', function(err) {
  console.error(err);
  process.nextTick(function() { // Give the server a chance to return an error
    process.exit();
  });
});