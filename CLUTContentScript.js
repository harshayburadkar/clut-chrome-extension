
console.log("Content script loaded !");

// document.addEventListener("keydown", function(e) {
// 	var inp = ''; 
//     var character = e.char;
//     var key = e.key;
//     var charCode = e.charCode;
//     var keyCode = e.keyCode;
//     var which = e.which;
//     console.log("keypressed: "+keyCode);
//     if(keyCode != 18 && keyCode != 87) {
//     	return;
//     }
    
//     if(keyCode == 18) {
//     	chrome.runtime.sendMessage({message: "CLUT:ALT_PRESSED"}, function(response) {
//   			console.log(response.farewell);
// 		});	
//     } else if(keyCode == 87) {
//     	chrome.runtime.sendMessage({message: "CLUT:W_PRESSED"}, function(response) {
//   			console.log(response.farewell);
// 		});	
//     }
// }, true);

// document.addEventListener("keyup", function(e) {
// 	var inp = ''; 
//     var character = e.char;
//     var key = e.key;
//     var charCode = e.charCode;
//     var keyCode = e.keyCode;
//     var which = e.which;
//     console.log("keyreleased: "+keyCode);
//     if(keyCode != 18 && keyCode != 87) {
// 		return;
//     }
//     if(keyCode == 18) {
//     	chrome.runtime.sendMessage({message: "CLUT:ALT_RELEASED"}, function(response) {
//   			console.log(response.farewell);
// 		});	
//     } else if(keyCode == 87) {
//     	chrome.runtime.sendMessage({message: "CLUT:W_RELEASED"}, function(response) {
//   			console.log(response.farewell);
// 		});	
//     }

// }, true);
