
var mru = [];
var switchOngoing = false;
var intSwitchCount = 1;
var lastIntSwitchIndex = 0;

var altPressed = false;
var wPressed = false;

var prevTimestamp = 0;
var timerValue = 400;
var timer;

var loggingOn = true;


chrome.commands.onCommand.addListener(function(command) {
	CLUTlog('Command recd:' + command);
	if(command == "alt_switch") {
		if(!switchOngoing) {
			switchOngoing = true;
			CLUTlog("CLUT::START_SWITCH");
			intSwitchCount = 1;
			doIntSwitch();
		} else {
			CLUTlog("CLUT::DO_INT_SWITCH");
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

});

chrome.runtime.onStartup.addListener(function () {
	CLUTlog("on startup");
	initialize();

});

chrome.runtime.onInstalled.addListener(function () {
	CLUTlog("on startup");
	initialize();

});



var doIntSwitch = function() {
	CLUTlog("CLUT:: in int switch, intSwitchCount: "+intSwitchCount+", mru.length: "+mru.length);
	if (intSwitchCount < mru.length) {
		var tabIdToMakeActive = mru[intSwitchCount];
		chrome.tabs.update(tabIdToMakeActive, {active:true, highlighted: true});
		chrome.tabs.get(tabIdToMakeActive, function(tab) {
			var thisWindowId = tab.windowId;
			chrome.windows.update(thisWindowId, {"focused":true});
		});
		
		lastIntSwitchIndex = intSwitchCount;
		intSwitchCount = (intSwitchCount+1)%mru.length;
	}
}

var endSwitch = function() {
	CLUTlog("CLUT::END_SWITCH");
	switchOngoing = false;
	var tabId = mru[lastIntSwitchIndex];
	putExistingTabToTop(tabId);
	printMRUSimple();
}

chrome.tabs.onActivated.addListener(function(activeInfo){
	if(! switchOngoing) {
		var index = mru.indexOf(activeInfo.tabId);

		//probably should not happen since tab created gets called first than activated for new tabs,
		// but added as a backup behavior to avoid orphan tabs
		if(index == -1) {
			CLUTlog("Unexpected scenario hit with tab("+activeInfo.tabId+").")
			addTabToMRUAtFront(activeInfo.tabId)
		} else {
			putExistingTabToTop(activeInfo.tabId);	
		}
	}
});

chrome.tabs.onCreated.addListener(function(tab) {
	CLUTlog("Tab create event fired with tab("+tab.id+")");
	addTabToMRUAtBack(tab.id);
});

chrome.tabs.onRemoved.addListener(function(tabId, removedInfo) {
	CLUTlog("Tab remove event fired from tab("+tabId+")");
	removeTabFromMRU(tabId);
});


var addTabToMRUAtBack = function(tabId) {

	var index = mru.indexOf(tabId);
	if(index == -1) {
		//add to the end of mru
		mru.splice(-1, 0, tabId);
	}

}
	


var addTabToMRUAtFront = function(tabId) {

	var index = mru.indexOf(tabId);
	if(index == -1) {
		//add to the front of mru
		mru.splice(0, 0,tabId);
	}
	
}
var putExistingTabToTop = function(tabId){
	var index = mru.indexOf(tabId);
	if(index != -1) {
		mru.splice(index, 1);
		mru.unshift(tabId);
	}
}

var removeTabFromMRU = function(tabId) {
	var index = mru.indexOf(tabId);
	if(index != -1) {
		mru.splice(index, 1);
	}
}

var initialize = function() {

	chrome.windows.getAll({populate:true},function(windows){
		windows.forEach(function(window){
			window.tabs.forEach(function(tab){
				mru.unshift(tab.id);
			});
		});
		CLUTlog("MRU after init: "+mru);
	});

 //    chrome.tabs.getAllInWindow(null, function(tabs){
	//     for (var i = 0; i < tabs.length; i++) {
	      
	//     }
	//     CLUTlog("MRU after init: "+mru);
	// });
}	

var printTabInfo = function(tabId) {
	var info = "";
	chrome.tabs.get(tabId, function(tab) {
		info = "Tabid: "+tabId+" title: "+tab.title;
	});
	return info;
}

var str = "MRU status: \n";
var printMRU = function() {
	str = "MRU status: \n";
	for(var i = 0; i < mru.length; i++) {		
		chrome.tabs.get(mru[i], function(tab) {
			
		});				
	}
	CLUTlog(str);
}

var printMRUSimple = function() {
	CLUTlog("mru: "+mru);
}

var generatePrintMRUString = function() {
	chrome.tabs.query(function() {
		
	});
	str += (i + " :("+tab.id+")"+tab.title);
	str += "\n";

}

var CLUTlog = function(str) {
	if(loggingOn) {
		console.log(str);
	}
}



//initialize();


