var Discord = require('discord.io');
var logger = require('winston');
var auth = require('./auth.json');
var request = require('request');

/* ----------------------------------------------------------------------------------------------------------------------------*/
//Hilo de ejecución

const spawn = require('threads').spawn;

var users = [{
	"token": "3740671821.ed7363f.59937bcbc9744527bbadcbd8fd3247f0",
	"username": "Oscar",
	"userID": "444342767301427210",
	"url": "https://www.instagram.com/oscarolivasfrias/",
	"mention": "<@444342767301427210>",
	"lastID": ""
},{
	"token": "3192035315.ed7363f.c9c160c8e6ed46cd9e48d410bca7696c",
	"username": "Gustaavo",
	"userID": "420042963624919040",
	"url": "https://www.instagram.com/satoiji/",
	"mention": "<@420042963624919040>",
	"lastID": ""
}];

var userslength = 2;

var listening = false;
spawnThread = function(){
	const thread = spawn(function(input, done) {
		var start = new Date().getTime();
		for (var i = 0; i < 1e7; i++) {
			if ((new Date().getTime() - start) > 4000){
				break;
			}
		}
		var request = require('request');
		var headers = {
		}
		var options = {
		    url: 'https://api.instagram.com/v1/users/self/media/recent/?access_token='+input.token+'&count=1',
		    method: 'GET',
		    headers: headers
		}
		request(options, function (error, response, body) {
		    if (!error && response.statusCode == 200) {
		        var data = JSON.parse(body);
		        if (data.data[0].id == input.lastID) {
		        	done({print: false});
		        } else {
		        	done({lastID: data.data[0].id, print: true, ind: input.ind});
		        }

		    }
		});
	});
	return thread;
}

var index = 0;

var thread;
fetch = function(timestamp){
	if (listening) {
		thread = spawnThread();
		thread
		.send({ lastID : users[index].lastID, ind: index, token: users[index].token })
		// The handlers come here: (none of them is mandatory)
		.on('message', function(response) {
			if (response.print == true) {
				users[response.ind].lastID = response.lastID;
				callMediaInstagram("",timestamp,true);
			} 
			index++;
			index = index == userslength ? 0 : index;
			thread.kill();
		})
		.on('error', function(error) {
			console.error('Worker errored:', error);
		})
		.on('exit', function() {
			fetch(timestamp);
		});
	}
}

//Termina bloque de codigo de hilo
/* ---------------------------------------------------------------------------------------------------------------------*/

logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';
// Initialize Discord Bot
var bot = new Discord.Client({
   token: auth.token,
   autorun: true
});


bot.on('ready', function (evt) {
    logger.info('Connected');
    logger.info('Logged in as: ');
    logger.info(bot.username + ' - (' + bot.id + ')');
	//Concurrent.Thread.create(instagramListener);
});

bot.on('message', function (user, userID, channelID, message, evt) {
	if (userID == "444342767301427210" || userID == "420042963624919040") {
		if(message.substring(0,2) == "m/"){
			message = message.substring(2,message.length);
			// m/postrecent mensaje incrustado
			// m/postrecent
			var array = getFunction(message);
			var funcion = array[0];
			var index = array[1];
			switch(funcion){
				case "postrecent":
					if (index == -1) {
						callMediaInstagram("",evt.d.timestamp,false);
					} else {
						callMediaInstagram(message.substring(index+1, message.length),evt.d.timestamp,false);
					}
				break;
				case "fetch":
					if (!listening){
						listening = true;
						fetch(evt.d.timestamp);
					}
				break;
				case "stopfetch":
					listening = false;
				break;
				case "fetchstate":
					var m = listening? "listening": "not listening";
					bot.sendMessage({
						to: channelID,
						message: m
					});
				break;
			}
			bot.deleteMessage({
				channelID: channelID,
				messageID: evt.d.userID
			});
		}
	}
});

getFunction = function(message,timestamp){
	var func ="";
	for (var i = 0; i < message.length; i++) {
		if (message[i] != " ") {
			func = func + message[i];
		} else { 
			return [func,i];
		}
	}
	return [func,-1];
}

var data = [];
callMediaInstagram = function(embedMessage,timestamp, fromThread){
	console.log("calling instagram");
	var headers = {
	}
	var options = {
	    url: 'https://api.instagram.com/v1/users/self/media/recent/?access_token='+users[index].token+'&count=1',
	    method: 'GET',
	    headers: headers
	}
	var mention = users[index].mention;
	var url = users[index].url;
	request(options, function (error, response, body) {
	    if (!error && response.statusCode == 200) {
	        // Print out the response body
	        data = JSON.parse(body);
            var extra = embedMessage!=''?"```"+embedMessage+"```":"";
            extra = fromThread?"Hello @everyone, I just retrieved a new post from instagram from the user "+mention+",":"";
            var text = data.data[0].caption != null ? data.data[0].caption.text : "No description.";
            var defaultField = 
            [
				{
					"name": "Descripcion",
					"value": text
				}
		    ];
            if (data.data[0].type == "carousel") 
            	defaultField = generateFields(data.data[0].carousel_media);
			var embedded =
				{
					"to": "529476482578251807",	
					"message": extra,
  					"embed":
					{
					    "title": "Instagram post",
					    "description": "En [Instagram](https://www.instagram.com)",
					    "url": data.data[0].link,
					    "color": 6935600,
					    "timestamp": timestamp,
					    "footer": {
					      "icon_url": data.data[0].images.thumbnail.url,
					      "text": "Imagen recuperada de instagram"
					    },
					    "thumbnail": {
					      "url": data.data[0].images.thumbnail.url
					    },
					    "image": {
					      "url": data.data[0].images.standard_resolution.url
					    },
					    "author": {
					      "name": data.data[0].user.full_name,
					      "url": url,
					      "icon_url": data.data[0].user.profile_picture
					    },
					    "fields": defaultField
					}
				};
			bot.sendMessage(embedded);
	    }
	});
}

generateFields = function(carousel){
	var fields = [];
	for (var i = 0; i < carousel.length; i++) {
		fields.push(
		{
			"name": "Extra " + (i+1),
			"value": "[Redirect]("+carousel[i].images.standard_resolution.url+")",
			"inline": true
		}
		);
	}
	return fields;
}