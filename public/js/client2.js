$(document).ready(function(){

		// Player logic
		console.log(ip);
		var socket = io('http://'+ ip +':3000');
		var chunkSize = 15;
		var queue;
		var nextTime = 0;
		var playing = false;
		var source;
		var songQueue;
		var context = new (window.AudioContext || window.webkitAudioContext)();
		var analyser;
		var gainNode;
		var gainValue = 0.5;
		var audioSource;
		var audioElem;
		var sourceBuffer;
		var mediaSource;
		var audio;
		var queue;
		socket.on('newSong', function (data) {
			playing = false;
			if(context){
				context.close();
			}
			context = new (window.AudioContext || window.webkitAudioContext)();
			analyser = context.createAnalyser();
    		analyser.fftSize = 256; // see - there is that 'fft' thing.
    		gainNode = context.createGain();
    		gainNode.gain.value = gainValue;
			queue = new Queue();
			songQueue = [];
			nextTime = 0;
			var name = data.name.substring(0, data.name.length-4);
			for(var i=0; i<name.length; i++){
				if(name[i] >= 'A' && name[i] <= 'Z'){
					name = name.substring(i);
					break;
				}else if(name[i] >= 'a' && name[i] <= 'z'){
					name = name.substring(i);
					break;
				}
			}
			$("#nowPlaying").html(name);
			$("#visualizer").html("");
		});


		var decoding = false;
		socket.on('moreData', function (data) {
			//console.log(data);
			if(data.i == 1){
				queue = new Queue();
			}
			queue.enqueue(data.data);
			if(queue.getLength() >= chunkSize && decoding == false){
				var songdata = appendBuffers(queue, chunkSize);
				decoding = true;
				context.decodeAudioData(songdata, function(buffer){
					songQueue.push(buffer);
					decoding = false;
					console.log("Decode at: " + new Date().getTime() + " buffer size: " + buffer.length);
				});
			}
		});


		// socket.on('assembleData', function(){
		// 	// reaceiced all data
		// 	// make a single buffer and decode
		// 	var songData1 = appendBuffers(queue,0);
		// 	var songData2 = appendBuffers(queue,1);
		// 	var songData3 = appendBuffers(queue,2);
		// 	var songData4 = appendBuffers(queue,3);
		// 	var songData5 = appendBuffers(queue,4);
		// 	songQueue = [];
		// 	context.decodeAudioData(songData1, function(buffer){
		// 		songQueue[0] = buffer;
		// 	});

		// 	context.decodeAudioData(songData2, function(buffer){
		// 		songQueue[1] = buffer;	
		// 	});
		// 	context.decodeAudioData(songData3, function(buffer){
		// 		songQueue[2] = buffer;
		// 	});
		// 	context.decodeAudioData(songData4, function(buffer){
		// 		songQueue[3] = buffer;
		// 	});
		// 	context.decodeAudioData(songData5, function(buffer){
		// 		songQueue[4] = buffer;
		// 	});

		// });


		socket.on('playMusic', function(data){
			schedulePlayback();
			if(!queue.isEmpty()){
				var len = queue.getLength();
				var songdata = appendBuffers(queue, len);
				decoding = true;
				context.decodeAudioData(songdata, function(buffer){
					songQueue.push(buffer);
					decoding = false;
					schedulePlayback(songQueue.length-1);
					console.log("Decode at: " + new Date().getTime());
				});	
			}
			console.log("Play at: " + new Date().getTime());
			playing = true;
			console.log(analyser);
			audioSource = new AwesomeAudioSource(analyser);
		    visualizer.init({
		        containerId: 'visualizer',
		        audioSource: audioSource
		    });
		});

		function schedulePlayback(begin){
			var begin = begin || 0;
			for(var i=begin; i<songQueue.length; i++){
				var buffer = songQueue[i];
				var sourcee    = context.createBufferSource();
		        sourcee.buffer = buffer;
		        sourcee.connect(analyser);
		        analyser.connect(gainNode);
		        gainNode.connect(context.destination);
		        if (nextTime == 0)
		            nextTime = context.currentTime;  /// add 50ms latency to work well across systems - tune this if you like
		        sourcee.start(nextTime);
		        nextTime+=sourcee.buffer.duration;	
			}
		}

		function appendBuffers(arrayOfBuffers, toClub){
			var size = 0;
			var tempbuff = [];
			var i = 0;
			while(!arrayOfBuffers.isEmpty()){
				var buff = arrayOfBuffers.dequeue(); 
				size+=buff.byteLength;
				tempbuff.push(buff);
				i++;
				if(i==toClub){
					break;
				}
			}
			var tmp = new Uint8Array(size);
			var offset = 0;
			for(var i=0; i<tempbuff.length; i++){
				tmp.set(new Uint8Array(tempbuff[i]), offset);
				offset += tempbuff[i].byteLength;
			}
			return tmp.buffer;
		}



		// Visualizer Logic
		var visualizer = new Visualizer();
	    $(".dial").knob({
	    	'width':70,
			"thickness":".4",
			"step":5,
			'release' : function(v){
				console.log(v);
				gainNode.gain.value = v/100;
				gainValue = v/100;
			}

	    });

	    
	});