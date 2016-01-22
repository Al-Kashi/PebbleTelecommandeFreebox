/**
 * Télécommande Freebox : l'application Pebble
 **/
var UI = require('ui');
var ajax = require('ajax');
var Voice = require('ui/voice');
//var code = 89821098;
//var code = 46698088;
var URL_PREFIX_1 = "http://";
var URL_PREFIX_2 = ".freebox.fr/pub/remote_control?code=";
var URL_SUFFIX = "&key=";

var actions = [{
  title: "Micro",
  icon: "images/Micro.png"
}, {
  title: "Demo",
  keys: ["home", 10, "home", 1, "right", 1, "ok", 3, "ok", 1]
}, {
  title: "Jaune",
  keys: ["yellow"]
}, {
  title: "Pause",
  keys: ["play"]
}, {
  title: "Media",
  keys: ["media"]
}, {
  title: "Options",
  keys: ["options"]
}, {
  title: "EPG",
  keys: ["epg"]
}, {
  title: "PIP",
  keys: ["pip"]
}, {
  title: "Switch off",
  keys: ["power&long=true"]
}];

var vocalCommands = [{
  command: "table",
  keys: ["home", 10, "home", 1, "right", 1, "ok", 3, "ok", 1]
}, {
  command: "pause",
  keys: ["play"]
}, {
  title: "stop",
  keys: ["power&long=true"]
}];


var actionMenu = new UI.Menu({
  sections: [{
    title: "Commandes Freebox"
  }, {
    items: actions
  }]
});

// Set a configurable with the open callback

Pebble.addEventListener("showConfiguration", function() {
  console.log("showing configuration");
  Pebble.openURL('http://www.caribouteries.com/PebbleFreebox.html?code=' + encodeURI(localStorage.code) + "&remote=" + encodeURI(localStorage.remote));
});

Pebble.addEventListener("webviewclosed", function(e) {
  console.log("configuration closed");
  if (e.response != "CANCELLED") {
    var options = JSON.parse(decodeURIComponent(e.response));
    console.log("Options = " + JSON.stringify(options));
    localStorage.code = options.code;
    localStorage.remote = options.remote;
  }
});

/** Action Menu **/
/*****************/
actionMenu.on('select', function(event) {
  var keys = actions[event.itemIndex].keys;
  if (keys === null || keys === undefined) {
    Voice.dictate('stop');
    Voice.dictate('start', false, function(e) {
      if (e.err) {
        console.log('Error listening : ' + e.err);
      } else {
        var command = e.transcription.toLowerCase();
        console.log("Reconnaissance=" + command);
        updateActionItem(event, command);

        var found = false;
        for (var j = 0; j < vocalCommands.length && !found; j++) {
          if (vocalCommands[j].command == command) {
            found = true;
            executeCommand(event, vocalCommands[j].keys);
          }
        }
        if (!found) {
          updateActionItem(event, command + " ?!?");
        }
      }
    });
  } else {
    executeCommand(event, keys);
  }
});

function executeCommand(event, commands) {
  if (commands.length > 0) {
    var command = commands[0];
    console.log('executeCommand ' + getURL(command) + ", length=" + commands.length);
    ajax({
        url: getURL(command)
      },
      function(data, status, request) {
        console.log('Command sent');
      },
      function(error, status, request) {
        console.log('The ajax request failed: ' + error + "/" + status + "/" + request);
      });
    updateActionItem(event, command);
    console.log('Done executeCommand ' + command);

    // Relaunch the next command - or a timer to clean up subtitle
    var timer = 1; // 1 second by default
    var newCommands = new Array(0);
    if (commands.length > 1) {
      timer = commands[1];
      newCommands = new Array(commands.length - 2);
      console.log("timer=" + timer);
      for (var j = 2; j < commands.length; j++) {
        newCommands[j - 2] = commands[j];
      }
    }
    setTimeout(function() {
      executeCommand(event, newCommands);
    }, timer * 1000);
  } else {
    updateActionItem(event, '');
  }
}

function updateActionItem(event, title) {
  actionMenu.item(event.sectionIndex, event.itemIndex, {
    title: event.item.title,
    subtitle: title,
    keys: event.item.keys
  });
}

function getURL(command) {
  if (localStorage.remote === undefined) {
    localStorage.remote = "hd1";
  }
  return URL_PREFIX_1 + localStorage.remote + URL_PREFIX_2 + localStorage.code + URL_SUFFIX + command;
}

actionMenu.show();