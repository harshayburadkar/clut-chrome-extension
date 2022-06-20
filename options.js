// Saves options to chrome.storage
function save_options() {
	var onlySameWindow = document.getElementById('only-same-window').checked;
	chrome.storage.sync.set({
		onlySameWindow
	}, function() {
		// Update status to let user know options were saved.
		var status = document.getElementById('status');
		status.textContent = 'Options saved.';
		setTimeout(function() {
			status.textContent = '';
		}, 750);
	});
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
	// Use default value color = 'red' and likesColor = true.
	chrome.storage.sync.get({
		onlySameWindow: false
	}, function(items) {
		document.getElementById('only-same-window').checked = items.onlySameWindow;
	});
}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);
