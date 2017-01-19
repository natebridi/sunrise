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

function populateDropdown() {
	var cities = [{
		"name": "Auckland",
		"lat": -36.8626942,
		"lng": 174.5852738,
		"tz": "Pacific/Auckland" 
		},{
		"name": "Austin",
		"lat": 30.3074624,
		"lng": -98.0336008,
		"tz": "America/Chicago" 
		},{
		"name": "Buenos Aires",
		"lat": -34.6156541,
		"lng": -58.5734074,
		"tz": "America/Argentina/Buenos_Aires" 
		},{
		"name": "Copenhagen",
		"lat": 55.6712474,
		"lng": 12.490799,
		"tz": "Europe/Copenhagen" 
		},{
		"name": "Mexico City",
		"lat": 19.390519,
		"lng": -99.423817,
		"tz": "America/Mexico_City" 
		},{
		"name": "New York",
		"lat": 40.705311,
		"lng": -74.2581965,
		"tz": "America/New_York" 
		},{
		"name": "Paris",
		"lat": 48.8588377,
		"lng": 2.2775168,
		"tz": "Europe/Paris" 
		},{
		"name": "Reykjavik",
		"lat": 64.1322134,
		"lng": -21.9925239,
		"tz": "Atlantic/Reykjavik" 
		},{
		"name": "Tehran",
		"lat": 35.6964894,
		"lng": 51.0696223,
		"tz": "Asia/Tehran" 
		}];

	var dropdown = document.getElementById('city');
	cities.map(function(c, i) {
		var option = document.createElement('option');
		option.value = i;
		option.innerHTML = c.name;
		dropdown.appendChild(option)
	});

	dropdown.onchange = function() {
		var city,
			year = new Date().getFullYear();

		if (this.value) {
			city = cities[this.value];
			getTimes(city.lat, city.lng, year, city.tz)
		} else {
			getLatLng();
		}
	};
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
populateDropdown();

})();