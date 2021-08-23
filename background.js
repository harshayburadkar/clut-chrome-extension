
var mru = [];
var slowSwitchOngoing = false;
var fastSwitchOngoing = false;
var intSwitchCount = 0;
var lastIntSwitchIndex = 0;
var altPressed = false;
var wPressed = false;

var domLoaded = false
var quickActive = 0;
var slowActive = 0;

var prevTimestamp = 0;
var slowtimerValue = 1500;
var fasttimerValue = 200;
var timer;

var slowswitchForward = false;

var initialized = false;
var options = {};

var loggingOn = false;

var CLUTlog = function(str) {
	if(loggingOn) {
		console.log(str);
	}
}



function onInstall() {
	CLUTlog("Extension Installed");
	chrome.windows.create({url:"http://www.harshay-buradkar.com/clut_update6.html"});
}

function onUpdate() {
	CLUTlog("Extension Updated");
	chrome.windows.create({url:"http://www.harshay-buradkar.com/clut_update6.html"});
}

function getVersion() {
	var details = chrome.app.getDetails();
	return details.version;
}

// Check if the version has changed.
var currVersion = getVersion();
var prevVersion = localStorage['version']
CLUTlog("prev version: "+prevVersion);
CLUTlog("curr version: "+currVersion);
if (currVersion != prevVersion) {
// Check if we just installed this extension.
	if (typeof prevVersion == 'undefined') {
        onInstall();
    } else {
		onUpdate();
	}
	localStorage['version'] = currVersion;
}


var processCommand = function(command) {
	CLUTlog('Command recd:' + command);
	var fastswitch = true;
	slowswitchForward = false;
	if(command == "alt_switch_fast") {
		fastswitch = true;
		quickSwitchActiveUsage();
	} else if(command == "alt_switch_slow_backward") {
		fastswitch = false;
		slowswitchForward = false;
		slowSwitchActiveUsage();
	} else if(command == "alt_switch_slow_forward") {
		fastswitch = false;
		slowswitchForward = true;
		slowSwitchActiveUsage();
	}

	if(!slowSwitchOngoing && !fastSwitchOngoing) {

		if(fastswitch) {
			fastSwitchOngoing = true;
		} else {
			slowSwitchOngoing = true;
		}
			CLUTlog("CLUT::START_SWITCH");
			intSwitchCount = 0;
			doIntSwitch();

	} else if((slowSwitchOngoing && !fastswitch) || (fastSwitchOngoing && fastswitch)){
		CLUTlog("CLUT::DO_INT_SWITCH");
		doIntSwitch();

	} else if(slowSwitchOngoing && fastswitch) {
		endSwitch();
		fastSwitchOngoing = true;
		CLUTlog("CLUT::START_SWITCH");
		intSwitchCount = 0;
		doIntSwitch();

	} else if(fastSwitchOngoing && !fastswitch) {
		endSwitch();
		slowSwitchOngoing = true;
		CLUTlog("CLUT::START_SWITCH");
		intSwitchCount = 0;
		doIntSwitch();
	}

	if(timer) {
		if(fastSwitchOngoing || slowSwitchOngoing) {
			clearTimeout(timer);
		}
	}
	if(fastswitch) {
		timer = setTimeout(function() {endSwitch()},fasttimerValue);
	} else {
		timer = setTimeout(function() {endSwitch()},slowtimerValue);
	}

};

chrome.commands.onCommand.addListener(processCommand);

chrome.browserAction.onClicked.addListener(function(tab) {
	CLUTlog('Click recd');
	processCommand('alt_switch_fast');

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
	if (intSwitchCount < mru.length && intSwitchCount >= 0) {
		var tabIdToMakeActive;
		//check if tab is still present
		//sometimes tabs have gone missing
		var invalidTab = true;
		var thisWindowId;
		if(slowswitchForward) {
			decrementSwitchCounter();	
		} else {
			incrementSwitchCounter();	
		}
		chrome.tabs.query({lastFocusedWindow: true, active: true}, function(activeTabs) {
			var activeTab = activeTabs[0];
			if (options.onlySameWindow && !activeTab) {
				return;
			}
			tabIdToMakeActive = mru[intSwitchCount];
			chrome.tabs.get(tabIdToMakeActive, function(tab) {
				if(tab) {
					if (options.onlySameWindow && (tab.windowId !== activeTab.windowId || tab.id === activeTab.id)) {
						doIntSwitch();
					} else {
						thisWindowId = tab.windowId;
						invalidTab = false;

						chrome.windows.update(thisWindowId, {"focused":true});
						chrome.tabs.update(tabIdToMakeActive, {active:true, highlighted: true});
						lastIntSwitchIndex = intSwitchCount;
						//break;
					}
				} else {
					CLUTlog("CLUT:: in int switch, >>invalid tab found.intSwitchCount: "+intSwitchCount+", mru.length: "+mru.length);
					removeItemAtIndexFromMRU(intSwitchCount);
					if(intSwitchCount >= mru.length) {
						intSwitchCount = 0;
					}
					doIntSwitch();
				}
			});
		});

		
	}
}

var endSwitch = function() {
	CLUTlog("CLUT::END_SWITCH");
	slowSwitchOngoing = false;
	fastSwitchOngoing = false;
	var tabId = mru[lastIntSwitchIndex];
	putExistingTabToTop(tabId);
	printMRUSimple();
}

chrome.tabs.onActivated.addListener(function(activeInfo){
	if(!slowSwitchOngoing && !fastSwitchOngoing) {
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

var removeItemAtIndexFromMRU = function(index) {
	if(index < mru.length) {
		mru.splice(index, 1);
	}
}

var incrementSwitchCounter = function() {
	intSwitchCount = (intSwitchCount+1)%mru.length;
}

var decrementSwitchCounter = function() {
	if(intSwitchCount == 0) {
		intSwitchCount = mru.length - 1;
	} else {
		intSwitchCount = intSwitchCount - 1;
	}
}

var initialize = function() {

	if(!initialized) {
		initialized = true;
		chrome.windows.getAll({populate:true},function(windows){
			windows.forEach(function(window){
				window.tabs.forEach(function(tab){
					mru.unshift(tab.id);
				});
			});
			CLUTlog("MRU after init: "+mru);
		});

		chrome.storage.sync.get({
			onlySameWindow: false
		}, function(items) {
			options.onlySameWindow = items.onlySameWindow;
		});

		chrome.storage.onChanged.addListener(function (changes) {
			for (let [key, { newValue }] of Object.entries(changes)) {
				options[key] = newValue;
			}
		});
	}
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

initialize();

var quickSwitchActiveUsage = function() {

	if(domLoaded) {
		if(quickActive == -1) {
			return;
		} else if(quickActive < 5){
			quickActive++;
		} else if(quickActive >= 5) {
			_gaq.push(['_trackEvent', 'activeUsage', 'quick']);
			quickActive = -1;
		}
	}
}

var slowSwitchActiveUsage = function() {

	if(domLoaded) {
		if(slowActive == -1) {
			return;
		} else if(slowActive < 5){
			slowActive++;
		} else if(slowActive >= 5) {
			_gaq.push(['_trackEvent', 'activeUsage', 'slow']);
			slowActive = -1;
		}
	}
}

//check for actual active users
var _AnalyticsCode = 'UA-51920707-1';
var _gaq = _gaq || [];
_gaq.push(['_setAccount', _AnalyticsCode]);
_gaq.push(['_trackPageview']);

(function() {
	var ga = document.createElement('script');
	ga.type = 'text/javascript';
	ga.async = true;
	ga.src = 'https://ssl.google-analytics.com/ga.js';
	//ga.src = 'https://ssl.google-analytics.com/u/ga_debug.js';
	var s = document.getElementsByTagName('script')[0];
	s.parentNode.insertBefore(ga, s);
})();
document.addEventListener('DOMContentLoaded', function () {
	domLoaded = true;

});
