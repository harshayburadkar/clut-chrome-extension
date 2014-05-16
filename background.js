
var mru = [];
var switchOngoing = false;
var intSwitchCount = 1;
var lastIntSwitchIndex = 0;

var altPressed = false;
var wPressed = false;

var prevTimestamp = 0;
var timerValue = 300;
var timer;


chrome.commands.onCommand.addListener(function(command) {
	if(command == "alt_switch") {
		if(!switchOngoing) {
			switchOngoing = true;
			console.log("START SWITCH");
			intSwitchCount = 1;
			doIntSwitch();
		} else {
			console.log("DO INT SWITCH");
			doIntSwitch();
		}
		if(!timer) {
			timer = setTimeout(function() {endSwitch()},timerValue);	
		} else {
			if(switchOngoing) {
				clearTimeout(timer);
				timer = setTimeout(function() {endSwitch()},timerValue);	
			} else {
				clearTimeout(timer);
				timer = setTimeout(function() {endSwitch()},timerValue);	
			}
		}

		
	}
console.log('Command:', command);
});

chrome.runtime.onStartup.addListener(function () {
	console.log("on startup");
	initialize();

});

chrome.runtime.onInstalled.addListener(function () {
	console.log("on startup");
	initialize();

});
// chrome.tabs.query({ url: "*://*/*" }, function(tabs)
// {
//     for(var i = 0; i < tabs.length; i++)
//     {
//         chrome.tabs.executeScript(tabs[i].id, { file: "CLUTContentScript.js" }, function() {});
//     }
// });

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log(sender.tab ?
                "from a content script:" + sender.tab.url :
                "from the extension");
    if (request.message == "CLUT:ALT_PRESSED") {
    	altPressed = true;
    } else if(request.message == "CLUT:W_PRESSED") {
    	wPressed = true;
    	if(altPressed) {
    		if(!switchOngoing) {
		    	switchOngoing = true;
				console.log("START SWITCH");
				intSwitchCount = 1;
				doIntSwitch();
			} else {
				console.log("DO INT SWITCH");
				doIntSwitch();
			}
		}	
    } else if(request.message == "CLUT:ALT_RELEASED") {
    	altPressed = false;
	    if(switchOngoing) {
	    	switchOngoing = false;
			endSwitch();
		}
    } else if(request.message == "CLUT:W_RELEASED") {
    	wPressed = false;
    } else {
    	console.log("Unidentified message recd!!");
    	return;
    }

  	sendResponse({farewell: request.message+"response"});

});


var doIntSwitch = function() {
	console.log("CLUT:: in int switch, intSwitchCount: "+intSwitchCount+", mru.length: "+mru.length);
	if (intSwitchCount < mru.length) {
		chrome.tabs.update(mru[intSwitchCount], {active:true});
		lastIntSwitchIndex = intSwitchCount;
		intSwitchCount = (intSwitchCount+1)%mru.length;
	}
}

var endSwitch = function() {
	console.log("CLUT:: in endSwitch");
	switchOngoing = false;
	putExistingTabToTop(mru[lastIntSwitchIndex]);
}


var addTabToMRU = function(tabId) {
	mru.unshift(tabId);
}

var putExistingTabToTop = function(tabId){
	var index = mru.indexOf(tabId);
	if(index != -1) {
		mru.splice(index, 1);
		mru.unshift(tabId);
	}
}

var initialize = function() {
    chrome.tabs.getAllInWindow(null, function(tabs){
	    for (var i = 0; i < tabs.length; i++) {
	      mru.unshift(tabs[i].id);
	      console.log("MRU after init: "+mru);
	    }
	});


}	

chrome.tabs.onActivated.addListener(function(activeInfo){
	if(! switchOngoing) {
		var index = mru.indexOf(activeInfo.tabId);
		if(index != -1) {
			addTabToMRU(activeInfo.tabId)
		} else {
			putExistingTabToTop(activeInfo.tabId);
		}
		console.log(mru);
	}
});

//initialize();


