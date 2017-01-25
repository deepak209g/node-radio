var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require('fs');
var dir = require('node-dir');


// send the audio player frontend to the client
app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});


// app adimin panel
app.get('/admin', function(req, res){
	res.sendFile(__dirname + '/admin.html');
});


var readStream;


// a new user is connected
io.on('connection', function(socket){

	socket.on('more', function(data){
		console.log("more");
		var data = readStream.read(524288);
		var time = Date.now();
  		io.sockets.emit('moreData', { data: data, time: time });
  	});


  	// list files
  	socket.on('listFiles', function(data){
  		dir.paths("D:\\Music", function(err, paths) {
		    if (err) throw err;
		    //console.log('files:\n',paths.files);
		    //console.log('subdirs:\n', paths.dirs);
		    var files = paths.files.filter(isMp3File);
		    socket.emit('fileList', files);
		});
  	});


  	socket.on('adminCommandPlayNewSong', function(data){
  		var path = data.path;
  		readStream = fs.createReadStream(path);
  		socket.broadcast.emit('newSong');

  		var i=1;
  		readStream.on('data', function(chunk){
  			socket.broadcast.emit('moreData', {data: chunk, i: i});
  			i++;	
  		});

  		readStream.on('end', function(){
  			socket.broadcast.emit('assembleData');

  			setTimeout(function(){
	  			socket.broadcast.emit('playMusic');
	  		}, 2000);
  		})
  	});
});




function isMp3File(file) {
    return (file.indexOf(".mp3") > -1);
}

// blah blah
http.listen(3000, function(){
  console.log('listening on *:3000');
});