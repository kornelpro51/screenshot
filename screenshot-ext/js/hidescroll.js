document.documentElement.style.overflow = 'hidden';
var swfObjects = [];
swfObjects = swfObjects.concat(Array.prototype.slice.call( document.getElementsByTagName('object') )) ;
swfObjects = swfObjects.concat(Array.prototype.slice.call( document.embeds ));

for (var i = swfObjects.length - 1; i >= 0; i--) {
	if ( typeof swfObjects[i].PercentLoaded !== 'function' ) {
		swfObjects.splice(i, 1);
	}
}

var loadCheckInterval = setInterval(function() {
	if (swfObjects.length == 0) {
		clearInterval(loadCheckInterval);
		chrome.extension.sendRequest({msg: 'swfcomplete'});
		// sendMessage
	}
	for (var i = swfObjects.length - 1; i >= 0; i--) {
		if (swfObjects[i].PercentLoaded() === 100 ) {
			swfObjects.splice(i, 1);
		}
	}
}, 100);