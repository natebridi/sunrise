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
		getTimes(position.coords.latitude, position.coords.longitude, year, tz.name());
	}

	function error() {
		var dd = document.getElementById('city');
		dd.removeChild(dd.children[0]);
		//output.innerHTML = "Unable to retrieve your location";
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
		},{
		"name": "Vandenberg AFB",
		"lat": 34.7428887,
		"lng": -120.5495257,
		"tz": "America/Los_Angeles"
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
  



	var svgHeight = 305;
	var svgWidth = 500;

	for (var i = 0; i < cities.length; i++) {

	  // latitudes/longitudes to radians
	  var latRadian = -(cities[i].lat * Math.PI) / 180;
	  var lngRadian = (cities[i].lng * Math.PI) / 180;
	  
	  //Radians to xy cartesian coordinates
	            var alpha = Math.acos( Math.cos(latRadian) * Math.cos( lngRadian / 2 ) );
	            var phi_1 = Math.acos( 2 / Math.PI );
	            function sinc(x) {
	                if (x == 0) {
	                    return 1;
	                } else {
	                    return (Math.sin(x)/x);
	                }
	            }
	            var x = (svgHeight/Math.PI) * ( lngRadian * Math.cos(phi_1) + 2 * ( Math.cos(latRadian) * Math.sin(lngRadian/2) / sinc(alpha) ) ) / 2;
	            var y = (svgHeight/Math.PI) * ( latRadian + ( Math.sin(latRadian) / sinc(alpha) )) / 2;
	  
	  //Re-align coordinates to center of map
	  var lat = x + (svgWidth / 2);
	  var lng = y + (svgHeight / 2);

	  $('#map').append('<div style="width:5px;height:5px;background:#f00;position: absolute; left:' + lat + 'px;top:' + lng + 'px;border-radius:50%"></div>')

	}




}

function getTimes(lat, lng, year, tz) {

	document.getElementById('loading').style = 'display: flex'

	var xhr = new XMLHttpRequest();
	xhr.open('POST', 'display.php');
	xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
	xhr.onload = function() {
	    if (xhr.status === 200) {
	        console.log(JSON.parse(xhr.responseText));
	        d = JSON.parse(xhr.responseText);
	        document.getElementById('loading').style = 'display: none'
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