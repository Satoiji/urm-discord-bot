var Discord = require('discord.io');
var auth = require('./auth.json');
const mongoose = require('mongoose');
const usersTable = require('./models/userSchema.js').schema;
const playersTable = require('./models/playersSchema.js').schema;
const countriesTable = require('./models/countriesSchema.js').schema;
const platformsTable = require('./models/platformsSchema.js').schema;
const rolesTable = require('./models/rolesSchema.js').schema;
const matchmakingTable = require('./models/matchmakingSchema.js').schema;
const matchmakingHistoryTable = require('./models/matchmakingHistorySchema.js').schema;
const declareMatchesTable = require('./models/declareMatchesSchema.js').schema;

//var uri = "mongodb://g_herrera:"+auth.mongo+"@flavoured-classics-shard-00-00-dmotk.mongodb.net:27017,flavoured-classics-shard-00-01-dmotk.mongodb.net:27017,flavoured-classics-shard-00-02-dmotk.mongodb.net:27017/test?ssl=true&replicaSet=Flavoured-Classics-shard-0&authSource=admin&retryWrites=true&w=majority";
const uri = "mongodb+srv://g_herrera:"+auth.mongo+"@flavoured-classics-dmotk.mongodb.net/URM_collection?retryWrites=true&w=majority";

// Initialize Discord Bot
var bot = new Discord.Client({
   token: auth.token,
   autorun: true
});

//collections constants
const USERS_COLLECTION = "users";
const USER_MODEL = mongoose.model(USERS_COLLECTION, usersTable);
const PLAYERS_COLLECTION = "players";
const PLAYERS_MODEL = mongoose.model(PLAYERS_COLLECTION, playersTable);
const COUNTRIES_COLLECTION = "countries";
const COUNTRIES_MODEL = mongoose.model(COUNTRIES_COLLECTION, countriesTable);
const PLATFORMS_COLLECTION = "platforms";
const PLATFORMS_MODEL = mongoose.model(PLATFORMS_COLLECTION, platformsTable);
const ROLES_COLLECTION = "roles";
const ROLES_MODEL = mongoose.model(ROLES_COLLECTION, rolesTable);
const MATCHMAKING_COLLECTION = "matchmaking";
const MATCHMAKING_MODEL = mongoose.model(MATCHMAKING_COLLECTION, matchmakingTable);
const MATCHMAKING_HISTORY_COLLECTION = "matchmaking_history";
const MATCHMAKING_HISTORY_MODEL = mongoose.model(MATCHMAKING_HISTORY_COLLECTION, matchmakingHistoryTable);
const DECLARE_MATCHES_COLLECTION = "declare_matches";
const DECLARE_MATCHES_MODEL = mongoose.model(DECLARE_MATCHES_COLLECTION, declareMatchesTable);

const FUNCTION = 0;

//regPlayer constants
const PREFIX_REGISTER_PLAYER = "regPlayer";
const REGISTER_TAG_POSITION = 1;
const REGISTER_NAME_POSITION = 2;
const REGISTER_COUNTRY_CODE_POSITION = 3;
const REGISTER_PLATFORM_POSITION = 4;

//register constants
const PREFIX_REGISTER = "register";
const REGISTER_ROLE_POSITION = 2;

//regCountry constants
const PREFIX_REGISTER_COUNTRY = "regCountry";
const COUNTRY_NAME = 1;
const COUNTRY_CODE = 2;

//regPlatform constants
const PREFIX_REGISTER_PLATFORM = "regPlatform";
const PLATFORM_NAME = 1;
const PLATFORM_CODE = 2;

//matchmaking constants
const PREFIX_MATCHMAKE = "matchmake";

//matchend constants
const PREFIX_MATCH_END = "end-match";

//match declare constants
const PREFIX_MATCH_DECLARE = "declare";

//match accept constants
const PREFIX_ACCEPT_MATCH = "accept";

//list constants
const PREFIX_LIST = "list";

//temporary constant
const PREFIX_RATING = "rating"

//middleware constants
var MIDDLEWARE = [
    /*admins*/      [PREFIX_RATING/*,PREFIX_MATCH_END,PREFIX_LIST,PREFIX_MATCHMAKE,PREFIX_REGISTER_COUNTRY,PREFIX_REGISTER_PLATFORM,PREFIX_REGISTER_PLAYER*/],
    /*matchmakers*/ [/*PREFIX_MATCH_END,PREFIX_MATCHMAKE,PREFIX_LIST*/],
    /*registers*/   [/*PREFIX_REGISTER_COUNTRY,PREFIX_REGISTER_PLATFORM,PREFIX_REGISTER_PLAYER*/],
    /*owner*/       [PREFIX_RATING,PREFIX_MATCH_END,PREFIX_REGISTER,PREFIX_LIST,PREFIX_MATCHMAKE,PREFIX_REGISTER_COUNTRY,PREFIX_REGISTER_PLATFORM,PREFIX_REGISTER_PLAYER],
    /*player*/      [/*PREFIX_MATCH_DECLARE, PREFIX_ACCEPT_MATCH*/],
];

function throwErrorMessage(channelID){
    bot.sendMessage({
        to: channelID,
        message: "Something wrong happend, check your parameters."
    });
}

function notEnoughParametersMessage(syntax,channelID){
    bot.sendMessage({
        to: channelID,
        message: "Not enough parameters, the correct syntax is: " + syntax
    });
}

function throwExistMessage(channelID, collection, exists){
    var extra = exists? " already exists." : "doesn't exist.";
    bot.sendMessage({
        to: channelID,
        message: "the specified " + collection + " " + extra
    });
}

mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

bot.on('message', function (user, userID, channelID, message, evt) {
    var syntax = "";
    if(message.substring(0,2) == "--"){
        message = message.substring(2,message.length);
        params = message.split(" ");
        USER_MODEL.findOne({"discord_id": userID}).populate("role").exec(function(err, doc){
            PLAYERS_MODEL.findOne({"discord_id": userID}).exec(function(err2, player){
                if(doc || player){
                    var access = false;
                    doc.role.forEach(function(role){
                        MIDDLEWARE[role.priviledge-1].forEach(function(value){
                            if(params[FUNCTION] == value||params[FUNCTION] == "commands"){
                                access = true;
                                return;
                            }
                        });
                    });
                    if(player){
                        MIDDLEWARE[4].forEach(function(value){
                            if(params[FUNCTION] == value){
                                access = true;
                                return;
                            }
                        });
                    }
                    if(access)
                    switch(params[FUNCTION]){
                        case PREFIX_RATING:
                            syntax = "--rating {num1} {num2} {1|0}";
                            var num1 = Number.parseFloat (params[1]);
                            TB1 = num1 < 2000 ? 100 : 0;
                            var num2 = Number.parseFloat (params[2]);
                            TB2 = num2 < 2000 ? 100 : 0;
                            var win = Number.parseFloat (params[3]);
                            var Nnum1 = num1 + 300*(win - 1/(1 + Math.pow(10,((num2 - num1)/1000)))) + (win)*TB1;
                            var Nnum2 = num2 + 300*((1-win) - 1/(1 + Math.pow(10,((num1 - num2)/1000)))) + (1-win)*TB2;
                            bot.sendMessage({
                                to: channelID,
                                message: "New num1: " + Math.floor(Nnum1) + "\nNew num2: " + Math.floor(Nnum2)
                            });
                        break;
                        case PREFIX_REGISTER:
                            syntax = "--register {@mention} {role}";
                            if(params.length == 3){
                                ROLES_MODEL.findOne({"name": params[REGISTER_ROLE_POSITION]}, function(role_err,role_res){
                                    if(!role_err){
                                    if(role_res){
                                        USER_MODEL.findOne({discord_id: evt.d.mentions[0].id}, function(user_err,user_res){
                                            if(!user_err){
                                                if(!user_res){
                                                    var coll = {
                                                        discord_id: evt.d.mentions[0].id,
                                                        tag: params[1],
                                                        created: Date.now()
                                                    }
                                                    var User = new USER_MODEL(coll);
                                                    User.save(function(err){
                                                        if(!err){
                                                            User.role.push(role_res._id);
                                                            User.save();
                                                            bot.sendMessage({
                                                                to: channelID,
                                                                message: "User registered"
                                                            });
                                                        } else 
                                                            throwErrorMessage(channelID);
                                                    });
                                                } else {
                                                    user_res.role.push(role_res._id);
                                                    user_res.save();
                                                }
                                            } else throwErrorMessage(channelID);
                                        });
                                    } else throwExistMessage(channelID, "role", false); } else throwErrorMessage(channelID);
                                });
                            } else notEnoughParametersMessage(syntax,channelID);
                        break;
                        case PREFIX_REGISTER_PLAYER:
                            syntax = "--regPlayer {@mention} {name} {country code{2}} {platform{2}}";
                            if(params.length == 5){
                                PLAYERS_MODEL.findOne({'discord_id': evt.d.mentions[0].id}, function(e1,r1){
                                    if(!e1){
                                    if(!r1){
                                        COUNTRIES_MODEL.findOne({"code": params[REGISTER_COUNTRY_CODE_POSITION].toLowerCase()}, function(e2,r2){
                                            if(!e2 && r2){
                                                PLATFORMS_MODEL.findOne({"code": params[REGISTER_PLATFORM_POSITION].toLowerCase()}, function(e3,r3){
                                                    if(!e3 && r3){
                                                        ROLES_MODEL.findOne({"name": "player"}, function(role_err,role_res){
                                                            if(!role_err){
                                                            if(role_res){
                                                                USER_MODEL.findOne({discord_id: evt.d.mentions[0].id}, function(user_err,user_res){
                                                                    if(!user_err){
                                                                        if(!user_res){
                                                                            var coll = {
                                                                                discord_id: ""+evt.d.mentions[0].id,
                                                                                tag: params[1],
                                                                                created: Date.now()
                                                                            }
                                                                            var User = new USER_MODEL(coll);
                                                                            User.save(function(err){
                                                                                if(!err){
                                                                                    User.role.push(role_res._id);
                                                                                    User.save();
                                                                                } else 
                                                                                    throwErrorMessage(channelID);
                                                                            });
                                                                        } else {
                                                                            user_res.role.push(role_res._id);
                                                                            user_res.save();
                                                                        }
                                                                    } else throwErrorMessage(channelID);
                                                                });
                                                            } else throwExistMessage(channelID, "role", false); } else throwErrorMessage(channelID);
                                                        });
                                                        var coll = {
                                                            discord_id: evt.d.mentions[0].id,
                                                            name: params[REGISTER_NAME_POSITION],
                                                            tag: params[REGISTER_TAG_POSITION],
                                                            country: r2._id,
                                                            platform: r3._id,
                                                            created: evt.d.timestamp,
                                                            games_played: 0,
                                                            elo1_temp: 1000,
                                                            elo2_temp: 1000,
                                                            last_game_date: evt.d.timestamp
                                                        }
                                                        PLAYERS_MODEL.create(coll, function(err){
                                                            if(!err) 
                                                                bot.sendMessage({
                                                                    to: channelID,
                                                                    message: "Player registered"
                                                                });
                                                            else
                                                                throwErrorMessage(channelID);
                                                        });
                                                    } else throwErrorMessage(channelID);
                                                });
                                            } else throwErrorMessage(channelID);
                                        });
                                    } else throwExistMessage(channelID, "user", true)} else throwErrorMessage(channelID);
                                });
                            } else notEnoughParametersMessage(syntax,channelID);
                        break;
                        case PREFIX_REGISTER_COUNTRY:
                            syntax = "--regCountry {name} {country code{2}}";
                            if(params.length == 3){
                                if(params[COUNTRY_CODE].length == 2){
                                    COUNTRIES_MODEL.findOne({"code": params[COUNTRY_CODE].toLowerCase()}, function(e1,r1){
                                        if(!e1){
                                        if(!r1){
                                            var coll = {
                                                name: params[COUNTRY_NAME],
                                                code: params[COUNTRY_CODE].toLowerCase(),
                                            }
                                            COUNTRIES_MODEL.create(coll, function(err){
                                                if(!err) 
                                                    bot.sendMessage({
                                                        to: channelID,
                                                        message: "Country registered"
                                                    });
                                                else
                                                    throwErrorMessage(channelID);
        
                                            });
                                        } else throwExistMessage(channelID, "country", true); } else throwErrorMessage(channelID);
                                    });
                                } else {
                                    bot.sendMessage({
                                        to: channelID,
                                        message: "Country code must be 2 digits length"
                                    });
                                }
                            } else notEnoughParametersMessage(syntax,channelID);
                        break;
                        case PREFIX_REGISTER_PLATFORM:
                            syntax = "--regPlatform {name} {platform code{2}}";
                            if(params.length == 3){
                                if(params[PLATFORM_CODE].length == 2){
                                    PLATFORMS_MODEL.findOne({"code": params[PLATFORM_CODE].toLowerCase()}, function(e1,r1){
                                        if(!e1){
                                        if(!r1){
                                            var coll = {
                                                name: params[PLATFORM_NAME],
                                                code: params[PLATFORM_CODE].toLowerCase(),
                                            }
                                            PLATFORMS_MODEL.create(coll, function(err){
                                                if(!err) 
                                                    bot.sendMessage({
                                                        to: channelID,
                                                        message: "Platform registered"
                                                    });
                                                else
                                                    throwErrorMessage(channelID);
        
                                            });
                                        } else throwExistMessage(channelID, "platform", true); } else throwErrorMessage(channelID);
                                    });
                                } else {
                                    bot.sendMessage({
                                        to: channelID,
                                        message: "Country code must be 2 digits length"
                                    });
                                }
                            } else notEnoughParametersMessage(syntax,channelID);
                        break;
                        case PREFIX_MATCHMAKE:
                            syntax = "--matchmake {@mention p1} {@mention p2}";
                            if(evt.d.mentions.length == 2){
                                PLAYERS_MODEL.find({$or: [{'discord_id': evt.d.mentions[0].id}, {'discord_id': evt.d.mentions[1].id}]}, function(err,players){
                                    if(!err){
                                    if(players.length == 2){
                                        MATCHMAKING_MODEL.find(
                                            {$or: [
                                                {'player1': players[0]._id}, 
                                                {'player2': players[0]._id},
                                                {'player1': players[1]._id}, 
                                                {'player2': players[1]._id}
                                            ]}, function(err,errorPlayers){
                                            if(!err){
                                            if(errorPlayers == 0){
                                                var coll = {
                                                    player1: players[0]._id,
                                                    player2: players[1]._id,
                                                    created_date: Date.now()
                                                }
                                                MATCHMAKING_MODEL.create(coll, function(err){
                                                    if(!err){
                                                        bot.sendMessage({
                                                            to: channelID,
                                                            message: "The match has successfully created!"
                                                        });
                                                    } else throwErrorMessage(channelID);
                                                });
                                            } else {
                                                bot.sendMessage({
                                                    to:channelID,
                                                    message: "One or both players are already in a match, this or these players can't be added to a new one"
                                                });
                                            } } else throwErrorMessage(channelID);
                                        });
                                    } else bot.sendMessage({to:channelID, message:"One or both players ain't registered as ranked players."}) } else throwErrorMessage(channelID);
                                });
                            } else notEnoughParametersMessage(syntax,channelID);
                        break;
                        case PREFIX_MATCH_END:
                            syntax = "--end-match {@player} {win|lose|delete}";
                            if(params.length == 3){
                                MATCHMAKING_MODEL.find()
                                .populate("player1")
                                .populate("player2").exec(function(err, matches){
                                    matches.forEach(function(match){
                                        if (match.player1.discord_id == evt.d.mentions[0].id || 
                                            match.player2.discord_id == evt.d.mentions[0].id){
                                            if(params[2] == "delete"){
                                                match.remove();
                                                return;
                                            }
                                            PLAYERS_MODEL.find({$or: 
                                                [{'discord_id': match.player1.discord_id}, {'discord_id': match.player2.discord_id}]}, 
                                                function(err,players){
                                                    //Satoiji vs VC
                                                    //Satoiji win
                                                var isPlayer1 = match.player1.discord_id == evt.d.mentions[0].id;
                                                var p = isPlayer1 ? match.player1.elo2_temp : match.player2.elo2_temp;
                                                var v = isPlayer1 ? match.player2.elo2_temp : match.player1.elo2_temp;
                                                var r = params[2] == "win" ? 1 : 0;
                                                var s = 1000;
                                                var k = 16 + Math.floor(Math.abs(v - p) / 200) * 2;
                                                var newp = p + k * (r - 1 / ((Math.pow(2,1 - (p-v)/s))+1));
                                                var newv = v + k * (1 - r - 1 / ((Math.pow(2,1 - (v-p)/s))+1));
                                                if(isPlayer1){
                                                    players[0].elo2_temp = newp;
                                                    players[1].elo2_temp = newv;
                                                } else {
                                                    players[1].elo2_temp = newp;
                                                    players[0].elo2_temp = newv;
                                                }
                                                players[0].games_played++;
                                                players[0].last_game_date = Date.now();
                                                players[0].save();
                                                players[1].games_played++;
                                                players[1].last_game_date = Date.now();
                                                players[1].save();
                                            });
                                            match.remove();
                                            return;
                                        }
                                    });
                                });
                            } else notEnoughParametersMessage(syntax,channelID);
                        break;
                        case PREFIX_MATCH_DECLARE:
                            syntax = "--declare {@mention}";
                            if(params.length == 2){
                                PLAYERS_MODEL.findOne({"discord_id": evt.d.mentions[0].id}, function(err,opponent){
                                    if(!err){
                                    if(opponent){
                                        MATCHMAKING_MODEL.findOne({$or: [{"player1": player._id}, {"player2": player._id}]}, function(err, currentMatch){
                                            if(!err){
                                            if(!currentMatch){
                                                DECLARE_MATCHES_MODEL.findOne({$and: [{"declare": player._id}, {"opponent": opponent._id}]}, function(err, declared){
                                                    if(!err){
                                                    if(!declared){
                                                        var coll = {
                                                            declare: player._id,
                                                            opponent: opponent._id,
                                                            created_date: Date.now()
                                                        }
                                                        DECLARE_MATCHES_MODEL.create(coll, function(e){
                                                            if(!e){
                                                                bot.sendMessage({
                                                                    to: channelID,
                                                                    message: player.tag + " has declared a match against " + opponent.tag + "!"
                                                                });
                                                            } else throwErrorMessage(channelID);
                                                        });
                                                    } else throwExistMessage(channelID, "declared match", true)} else throwErrorMessage(channelID);
                                                });
                                            } else {
                                                bot.sendMessage({
                                                    to: channelID,
                                                    message: "You already have a match, you can't declare a fight against someone else until you finish your current match."
                                                })
                                            }} else throwErrorMessage(channelID);
                                        });
                                    } else throwExistMessage(channelID,"player",false); } else throwErrorMessage(channelID);
                                });
                            } else notEnoughParametersMessage(syntax, channelID);
                        break;
                        case PREFIX_ACCEPT_MATCH:
                            syntax = "--accept {@mention}";
                            if(params.length == 2){
                                PLAYERS_MODEL.findOne({"discord_id": evt.d.mentions[0].id}, function(err,p){
                                    if(!err){
                                    if(p){
                                        MATCHMAKING_MODEL.findOne({$or: 
                                            [{'player1':p._id},{'player2':p._id},{'player1':player._id},{'player2':player._id}]}, 
                                            function(err, match1){
                                                if(!err){
                                                if(!match1){
                                                    DECLARE_MATCHES_MODEL.findOne({$and: 
                                                        [{"declare": p._id}, {"opponent": player._id}]
                                                    }, function(err, match){
                                                        if(!err){
                                                        if(match){
                                                            var coll = {
                                                                player1: p._id,
                                                                player2: player._id,
                                                                created_date: Date.now()
                                                            }
                                                            MATCHMAKING_MODEL.create(coll, function(err){
                                                                if(!err){
                                                                    bot.sendMessage({
                                                                        to:channelID,
                                                                        message: "You have accepted the match from " +  player.tag + ", it's time to fight and show the results."
                                                                    });
                                                                } else throwErrorMessage(channelID);
                                                            });
                                                            match.remove();
                                                        } else throwExistMessage(channelID, "declared match ", false); } else throwErrorMessage(channelID);
                                                    });
                                                } else {
                                                    bot.sendMessage({
                                                        to: channelID,
                                                        message: "One or both players are already in a match, you can't accept this declare."
                                                    })
                                                }} else throwErrorMessage(channelID);
                                        });
                                    } else throwExistMessage(channelID, "player", false); } else throwErrorMessage(channelID);
                                });
                            } else notEnoughParametersMessage(syntax, channelID);
                        break;
                        case PREFIX_LIST:
                            syntax = "--list {collection}";
                            if(params.length < 3){
                                if(params.length == 1){
                                    bot.sendMessage({
                                        to: channelID,
                                        message: "```"+
                                        "Available collections: \n"+
                                        "1) " + ROLES_COLLECTION+ ", Available roles\n"+
                                        "2) " + PLATFORMS_COLLECTION+", Available platforms\n"+
                                        "3) " + COUNTRIES_COLLECTION+", Available countries\n"+
                                        "4) " + USERS_COLLECTION+", Available users\n"+
                                        "5) " + MATCHMAKING_COLLECTION+", Matchmakings in progress\n"+
                                        "6) commands```"
                                    });
                                } else {
                                    var message = "";
                                    switch(params[1]){
                                        case COUNTRIES_COLLECTION:
                                            COUNTRIES_MODEL.find({}, function(err, objects){
                                                message += "```List of available countries\n";
                                                if(objects.length == 0) message = "```The collection is empty.";
                                                else {
                                                    objects.forEach(function(document){
                                                        message += "- Name: " + document.name + " | Code: " + document.code.toUpperCase() + "\n";
                                                    });
                                                }
                                                message += "```";
                                                bot.sendMessage({
                                                    to:channelID,
                                                    message: message
                                                });
                                            });
                                        break;
                                        case PLATFORMS_COLLECTION:
                                            PLATFORMS_MODEL.find({}, function(err, objects){
                                                message += "```List of available platforms\n";
                                                if(objects.length == 0) message = "```The collection is empty.";
                                                else {
                                                    objects.forEach(function(document){
                                                        message += "- Name: " + document.name + " | Code: " + document.code.toUpperCase() + "\n";
                                                    });
                                                }
                                                message += "```";
                                                bot.sendMessage({
                                                    to:channelID,
                                                    message: message
                                                });
                                            });
                                        break;
                                        case ROLES_COLLECTION:
                                            ROLES_MODEL.find({}, function(err, objects){
                                                message += "```List of available roles\n";
                                                if(objects.length == 0) message = "```The collection is empty.";
                                                else {
                                                    objects.forEach(function(document){
                                                        message += "- Name: '" + document.name + "'\n";
                                                    });
                                                }
                                                message += "```";
                                                bot.sendMessage({
                                                    to:channelID,
                                                    message: message
                                                });
                                            });
                                        break;
                                        case USERS_COLLECTION:
                                            USER_MODEL.find({}).populate("role").exec(function(err,objects){
                                                message += "```List of users\n";
                                                if(objects.length == 0) message = "```The collection is empty.";
                                                else {
                                                    objects.forEach(function(document){
                                                        message += "- Discord: '" + document.tag + "' | Role: '" + document.role.name + "'\n";
                                                    });
                                                }
                                                message += "```";
                                                bot.sendMessage({
                                                    to:channelID,
                                                    message: message
                                                });
                                            });
                                        break;
                                        case PLAYERS_COLLECTION:
                                            PLAYERS_MODEL.find({}).populate("country").populate("platform").exec(function(err, objects){
                                                message += "List of registered players for URM\n";
                                                if(objects.length == 0) message = "The collection is empty.";
                                                else {
                                                    objects.forEach(function(document){
                                                        message += "- Discord: '" + document.tag + "' | Country: '" + document.country.name + "' | ELO_V2: '" + document.elo2_temp.toFixed(2) + "\n";
                                                    });
                                                }
                                                message += "";
                                                bot.sendMessage({
                                                    to:channelID,
                                                    message: message
                                                });
                                            });
                                        break;
                                        case MATCHMAKING_COLLECTION:
                                            message += "```List of matchmakings that are taking place now.```\n";
                                            MATCHMAKING_MODEL.find({}).populate("player1").populate("player2").exec(function(err, matches){
                                                matches.forEach(function(match){
                                                    var date = match.created_date.getDate();
                                                    var month = match.created_date.getMonth();
                                                    var year = match.created_date.getFullYear();
                                                    var dateString = date + "/" +(month + 1) + "/" + year;
                                                    message += dateString + " - " + match.player1.tag + " vs " + match.player2.tag + "\n";
                                                });
        
                                                bot.sendMessage({
                                                    to: channelID,
                                                    message: message
                                                })
                                            });
                                        break;
                                        case "commands":
                                            message+= "```List of commands: \n";
                                            message+= PREFIX_LIST + ": lists the available collections.\n"+
                                                    PREFIX_REGISTER_PLAYER + ": Register a new player\n"+
                                                    PREFIX_REGISTER_PLATFORM + ": Register a new platform\n"+
                                                    PREFIX_REGISTER_COUNTRY + ": Register a new country\n"+
                                                    PREFIX_REGISTER + ": Register a new user\n"+
                                                    PREFIX_MATCHMAKE + ": Register a new matchmake.```";
                                            bot.sendMessage({
                                                to:channelID,
                                                message:message
                                            });
                                        break;
                                        default:
                                            bot.sendMessage({
                                                to: channelID,
                                                message: "The collection doesn't exist, use --list to see the available collections."
                                            });
                                        break;
                                    }
                                }
                            } else {
                                notEnoughParametersMessage(syntax,channelID);
                            }
                        break;
                        default:
                            bot.sendMessage({
                                to: channelID,
                                message: "Unrecognized command"
                            });
                        break;
                    }
                    else {
                        bot.sendMessage({
                            to: channelID,
                            message: "I'm sorry, you don't have the priviledge to use this command."
                        })
                    }
                } else {
                    bot.sendMessage({
                        to: channelID,
                        message: "You are not registered as a user, I can't allow you do anything."
                    })
                }
            });
        });
    }
});