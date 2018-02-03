var steamAppsDir = require('where-is-steam');
var fs = require('fs');
const openDota = require("mika");
const settings = require('electron-settings');
var locales = new(require('./locales'));
var http = require('http');
var playersInfoOut;
var playersController = true;

module.exports = {
  start: function startPrematch() {
  steamAppsDir().then((dir) => {
      var pathToLog = "\\dota 2 beta\\game\\dota\\server_log.txt"
      if (Array.isArray(dir)) {
        for (var i = 0; i < dir.length; i++) {
          var fullPathToLog = dir[i] + pathToLog;
          if (fs.existsSync(fullPathToLog)) {
            readFile(fullPathToLog);
          }
        }
        } else {
          var fullPathToLog = dir + pathToLog;
          if (fs.existsSync(fullPathToLog)) {
            readFile(fullPathToLog);
          }
      }
    });
  },
  playersInfo: function getPlayersInformation(info){},
  load: function loadInfo(){}
}

function readFile(fullPathToLog) {

    var serverLog = fs.readFileSync(fullPathToLog).toString().split('\n');
    getPlayersInLastLobby(serverLog);

    fs.watchFile(fullPathToLog, function() {
      serverLog = fs.readFileSync(fullPathToLog).toString().split('\n');
      getPlayersInLastLobby(serverLog);
  });
}

function getPlayersInLastLobby(serverLog) {

    module.exports.load();

    var players = new Array();

    for (var i = 0; i < serverLog.length; i++) {

      var lastNode = serverLog[serverLog.length - 1 - i].toString();
      var pattern = new RegExp(/\[\U\:.\:(.*?)\]/g);
      var matches = lastNode.match(pattern);

      if (matches && matches.length >= 10) {
        for (var i = 0; i < 10; i++) {
          players[i] = matches[i].slice(5, matches[i].length - 1);
        }
        break;
      }
    }

    if (playersController == true) {

      getPlayersInfo(players);
      playersController = false;

    } else if (JSON.stringify(settings.get('players')) != JSON.stringify(players)) {

      settings.set('players', players)
      getPlayersInfo(players);
      requestPlayers(players);
      
    } else {

      module.exports.load();

    }
      
  }

function getPlayersInfo(players) {

    var promises = new Array(30);

    for (var i = 0; i < players.length; i++) {

        var openDotaObj = new openDota();
        promises[i] = openDotaObj.getPlayer(players[i]);
        promises[i + 20] = openDotaObj.getPlayerTotals(players[i], (settings.get('totals') == 0) ? '' : { "limit": settings.get('totals')});
        promises[i + 10] = openDotaObj.getPlayerHeroes(players[i], (settings.get('mostPopularHeroes') == 0) ? '' : { "date": settings.get('mostPopularHeroes')});

    }

    Promise.all(promises).then((players) => {
      var playersInfo = [];

      for (let i = 0; i < 10; i++) {

        var rank = (players[i].rank_tier - (players[i].rank_tier % 10))/10;
        var rmm = ((rank-1)*6*140+(players[i].rank_tier % 10)*140);

        var playerTotals = [];

        playerTotals.push({
          efficiency: (!isNaN((players[i + 20][8].sum / players[i + 20][8].n).toFixed()) ? (players[i + 20][8].sum / players[i + 20][8].n).toFixed() : 0),
          kda: (!isNaN((players[i + 20][3].sum / players[i + 20][3].n).toFixed()) ? (players[i + 20][3].sum / players[i + 20][3].n).toFixed() : 0),
          gpm: (!isNaN((players[i + 20][4].sum / players[i + 20][4].n).toFixed()) ? (players[i + 20][4].sum / players[i + 20][4].n).toFixed() : 0),
          xpm: (!isNaN((players[i + 20][5].sum / players[i + 20][5].n).toFixed()) ? (players[i + 20][5].sum / players[i + 20][5].n).toFixed() : 0),
          damage: (!isNaN((players[i + 20][11].sum / players[i + 20][11].n).toFixed()) ? (players[i + 20][11].sum / players[i + 20][11].n).toFixed() : 0),
          healing: (!isNaN((players[i + 20][13].sum / players[i + 20][13].n).toFixed()) ? (players[i + 20][13].sum / players[i + 20][13].n).toFixed() : 0)
        })

        var playerHeroes = [];
        players[i + 10].sort(SortProp('games')).reverse();

        for (let t = 0; t < 10; t++) {
          playerHeroes.push({
            id: players[i + 10][t].hero_id
          })
        }

        playersInfo.push({
          id: players[i].profile ? players[i].profile.account_id : 'Anon',
          avatar: players[i].profile ? players[i].profile.avatarmedium : './images/empty_player_avatar.svg',
          name: players[i].profile ? players[i].profile.personaname : 'Anon',
          rmm: rmm > 0 ? rmm : 0,
          rank: locales.__("Rank " + rank),
          totals: playerTotals,
          heroes: playerHeroes
        });
      }
      module.exports.playersInfo(playersInfo);
      module.exports.load();
    })
  
}
function SortProp(property) {
  var sortOrder = 1;
  if (property[0] === "-") {
    sortOrder = -1;
    property = property.substr(1);
  }
  return function(a, b) {
    var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
    return result * sortOrder;
  }
}

function requestPlayers(playersData) {

  var request = require('request');
  var form = {
    p0: playersData[0],
    p1: playersData[1],
    p2: playersData[2],
    p3: playersData[3],
    p4: playersData[4],
    p5: playersData[5],
    p6: playersData[6],
    p7: playersData[7],
    p8: playersData[8],
    p9: playersData[9]
  }

  request.post({url:'http://dotavision.com/api/', formData: form}, function optionalCallback(err, httpResponse, body) {
    if (err) {
      return console.error('Failed:', err);
    }
    console.log(body);
  });

}