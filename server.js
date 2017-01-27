var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require('fs');
var dir = require('node-dir');
var ip = require('ip');
var hb = require('handlebars');
app.use(express.static('public'));

var myip = ip.address();


var indexhtml = fs.readFileSync(__dirname + '/index.html', "utf8");
var indexTemplate = hb.compile(indexhtml);

// send the audio player frontend to the client
app.get('/', function(req, res){
  //res.sendFile(__dirname + '/index.html');
  res.send(indexTemplate({ip: myip}));
});



var adminhtml = fs.readFileSync(__dirname + '/admin.html', "utf8");
var adminTemplate = hb.compile(adminhtml);
// app adimin panel
app.get('/admin', function(req, res){
	res.send(adminTemplate({ip: myip}));
});


var readStream;


// a new user is connected
io.on('connection', function(socket){

  	// list files
  	socket.on('listFiles', function(data){
  		fs.readFile(__dirname + '/config.json', 'utf8', (err, data) => {
		  if (err) throw err;
		  var config = JSON.parse(data);
		  var music_dirs = config.music_directory;
		  for(var i=0; i<music_dirs.length; i++){
		  	dir.files(music_dirs[i], function(err, paths) {
			    if (err) throw err;
			    var files = paths.filter(isMp3File);
			    socket.emit('fileList', files);
			});  	
		  }

		});
  		
  	});

		var chunkSize = 15;
  	socket.on('adminCommandPlayNewSong', function(data){
  		var path = data.path;
  		fs.access(path, (err)=>{
  			if(err){
  				return;
  			}
  			readStream = fs.createReadStream(path);
	  		//console.log(readStream);
	  		var name = nameFromPath(path);
	  		socket.broadcast.emit('newSong', {name: name });

	  		var i=1;
	  		readStream.on('data', function(chunk){
	  			socket.broadcast.emit('moreData', {data: chunk, i: i});
	  			i++;	
	  			if(i == 3*chunkSize){
			  		setTimeout(function(){
				  		socket.broadcast.emit('playMusic');
				  	}, 1000);	  				
	  			}
	  		});



	  		// readStream.on('end', function(){
	  		// 	socket.broadcast.emit('assembleData');
	  		// })
  		})
  	});
});




function isMp3File(file) {
    return (file.indexOf(".mp3") > -1);
}

function nameFromPath(path){
	var tokens = path.split('\\');
	var name = tokens[tokens.length-1];
	return name;
}

// blah blah
http.listen(3000, function(){
  console.log('listening on '+ myip +':3000');
});