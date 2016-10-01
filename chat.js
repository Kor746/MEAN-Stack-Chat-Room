var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var PORT = process.env.PORT || 3000;
var count = 0;
var users = [];
var mongoose = require('mongoose');



app.get('/', function(req,res) {
	res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket) {
	console.log("count: " + count);
	console.log("using id : %s", socket.id);

	socket.on('new user', function(newUser, callback) {
		
		if(users.indexOf(newUser) != -1)
		{
			callback(false);
			
		} else {
			callback(true);
			socket.id = newUser;
			users.push(socket.id);
			console.log(users.indexOf(socket.id));
			io.emit('new user', socket.id);
			io.emit('welcome', socket.id);
			socket.broadcast.emit('message', 'User ' + socket.id  + ' has connected!','System');
			socket.broadcast.emit('message', count + ' users online', 'System');
				
		}
	});


	var channel = 'Dans The Man';
	
	socket.join(channel);
	

	socket.on('send message',function(data) {
		var msg = data.trim();
		if(msg.substr(0,4) === '/who')
		{
			msg = msg.substr(4);
			var idx = msg.indexOf('');
			if(idx !== -1)
			{
				io.in(channel).emit('online',count);
			}
			else {
				console.log('error!');
			}
		} 
		else if(msg.substr(0,5) === '/list') 
		{
			msg = msg.substr(5);
			var idx = msg.indexOf('');
			if(idx !== -1)
			{
				io.in(channel).emit('user list', users);
			}
			else {
				console.log('error');
			}
		}
		else {
			io.in(channel).emit('message', msg, socket.id);
		}
		//io.emit('message',data,socket.id);
		
		
		
		//socket.broadcast.to(channel).emit('message',data,socket.id);
		
	});

	socket.on('typing',function(data) {
		console.log(data);
		io.in(channel).emit('istyping', data, socket.id);
		
	});

	socket.on('online',function(data) {
		io.in(channel).emit('online', count);
	});

	socket.on('disconnect',function() {
		users.splice(users.indexOf(socket.id));
		socket.broadcast.emit('message', 'User ' + socket.id + ' has disconnected','System');
		count--;
		socket.emit("isTyping", false);
		io.emit('message', count + ' users online', 'System');
	});
	
	socket.on('change channel', function(newChannel) {
		
		socket.leave(channel);
		socket.emit("isTyping", false);
		socket.join(newChannel);
		channel = newChannel;
		socket.emit('change channel', newChannel);
	});


	count++;
});

http.listen(PORT, function() {
	console.log('Server successfully connected on PORT: ' + PORT);
});