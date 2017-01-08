var d,
	activeYear = 2017;
var today = new Date();
var year = today.getFullYear();
var activeYear = year;        // the year currently being shown
var month = today.getMonth() + 1;
var day = today.getDate();

(function() {

function getLatLng() {
	var output = document.getElementById("content");

	if (!navigator.geolocation){
		output.innerHTML = "<p>Geolocation is not supported by your browser</p>";
		return;
	}

	function success(position) {
		var year = new Date().getFullYear(),
			tz = jstz.determine();
		getTimes(position.coords.latitude, position.coords.longitude, year, tz.name())
	}

	function error() {
		output.innerHTML = "Unable to retrieve your location";
	}

	navigator.geolocation.getCurrentPosition(success, error);
}

function getTimes(lat, lng, year, tz) {
	var xhr = new XMLHttpRequest();
	xhr.open('POST', 'display.php');
	xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
	xhr.onload = function() {
	    if (xhr.status === 200) {
	        console.log(JSON.parse(xhr.responseText));
	        d = JSON.parse(xhr.responseText);
	        init();
	        display();
	        bindEvents();
	    } else {
	        console.log('Request failed.  Returned status of ' + xhr.status);
	    }
	};
	xhr.send('year=' + year + '&lat=' + lat + '&lng=' + lng + '&tz=' + tz);
}

getLatLng();

})();