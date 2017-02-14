var canvas;
var c = {};
var bar, dragger;
var opts = {};
var days;
var latitude;
var longitude;
var offset;
var t;
var monthNames = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
var dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];



function init() {
	canvas = document.getElementById('canvas');
	canvas.width = window.innerWidth * 2;
	canvas.height = 800;
	canvas.style.width = window.innerWidth + 'px';
	canvas.style.height = 400 + 'px';



	c.width = canvas.width;
	c.height = canvas.height;
	c.leftOffset = $("#canvas").offset().left;
	c.topOffset = $("#canvas").offset().top;
	c.yscale = (c.height/1440)/2;				// scale height to the canvas size (1440 is minutes in day) (divide by 2 for retina)
	c.xscale = (c.width/d.times.length)/2;		// scale width to the canvas size (divide by 2 for retina)
	c.xorigin = 0;
	c.goalxorigin = 0;
	c.zoomed = false;
	c.moving = false;
	
	$("#scrubber").show();		// this was hidden to make sure it didn't show during the fadeout from the location form
	
	bar = $("#control-bar");
	dragger = $("#bar-dragger");
	bar.position = 0;
	bar.css({left:0});
	bar.width = 1;
	bar.focusedMonth = 0;				// when zooming in, this is the month it zooms to
	bar.updateDisplay = true;			// runs the mousemove function, updating postion of the dragger and time displays
	
	days = d.times.length;
		
	opts.twelvehour = true;				// set display to 12-hour clock times (false is 24 hour clock)
	opts.monthLines = true;				// turns on the months line grid

	// Preprocess data
	//		Move values into properties for easier handling
	// 		Times are returned each day as an array [rise, set, month, day, dayOfWeek]
	//		Generate friendly strings for display

	d.times.map(function(day, i) {
		var values = day;
		day = {
			rise: 		values[0],
			set: 		values[1],
			month: 		values[2],
			day: 		values[3],
			dayOfWeek: 	values[4]
		};

		var mins,
			hrs;

		if (day.set == 8888 || day.set == 9999) {
			day.setf24 = 'No sunrise';
			day.setf = 'No sunrise';
		} else {
			mins = (Math.floor(day.set % 60) < 10) ? '0' + Math.floor(day.set % 60) : Math.floor(day.set % 60);
			hrs = Math.floor(day.set / 60);

			day.setf24 = hrs + ':' + mins;
			day.setf = (hrs > 12) ? (hrs - 12) + ':' + mins + ' pm' : hrs + ':' + mins + ' am';
		}

		if (day.rise == 8888 || day.rise == 9999) {
			day.risef24 = 'No sunrise';
			day.risef = 'No sunrise';
		} else {
			mins = (Math.floor(day.rise % 60) < 10) ? '0' + Math.floor(day.rise % 60) : Math.floor(day.rise % 60);
			hrs = Math.floor(day.rise / 60);

			day.risef24 = hrs + ':' + mins;
			day.risef = (hrs > 12) ? (hrs - 12) + ':' + mins + ' pm' : hrs + ':' + mins + ' am';
		}

		d.times[i] = day;
	});
	
	switchTo12Hr();
	
	loadHeader();
	
	if (activeYear != year) {
		$("#goto-now").hide();
	} else {
		$("#goto-now").show();
	}
	
	$(document).mousemove(function(e) {
		c._x = e.pageX - c.leftOffset;
		c._y = e.pageY - c.topOffset;
		
		if (bar.dragging || bar.updateDisplay) {
			bar.updateDisplay = false;
			
			if (bar.dragging && c._x - bar.mouseOffset >= 0 && c._x - bar.mouseOffset + bar.width <= c.width) {
				bar.position = c._x - bar.mouseOffset;
				bar.css({'left' : bar.position});
				dragger.css({
					backgroundPosition: '0px -70px',
					cursor: 'pointer'
				});
			}
			
			dayLength = (d.times[findDay(bar.position)].set - d.times[findDay(bar.position)].rise)/60;
			dayHTML = "<h2>" + dayNames[d.times[findDay(bar.position)].dayOfWeek] + ', ' + monthNames[d.times[findDay(bar.position)].month] + ' ' + d.times[findDay(bar.position)].day + ' ' + activeYear + "</h2> Hours of sunlight: " + dayLength.toFixed(2);
			$("#day-display").empty().html(dayHTML);
			
			fillInTimes();
			
			riseY = d.times[findDay(bar.position)].rise*c.yscale - $("#rise").outerHeight()/2;
			if (riseY < $("#rise").outerHeight()/2) {
				riseY = $("#rise").outerHeight()/2;
			} else if (riseY > 128) {
				riseY = 128;
			}
			
			setY = d.times[findDay(bar.position)].set*c.yscale - $("#set").outerHeight()/2;
			if (setY < $("#set").outerHeight()/2) {
				setY = $("#set").outerHeight()/2;
			} else if (setY < 250) {
				setY = 250;
			}
			
			if (d.times[findDay(bar.position)].rise == 9999) {
				$("#rise").css({
					'top' : 110,
					'left' : bar.position - $("#rise").outerWidth()/2,
					'backgroundColor' : '#3e5a65'
				});
				$("#set").hide();
			} else if (d.times[findDay(bar.position)].rise == 8888) {
				$("#set").css({
					'top' : 110,
					'left' : bar.position - $("#set").outerWidth()/2,
					'backgroundColor' : '#65a9c4'
				});
				$("#rise").hide();
			} else {
				$("#rise").show().css({
					'top' : riseY,
					'backgroundColor' : 'rgba(0, 200, 0, 0.8)',
					'left' : bar.position - $("#rise").outerWidth()/2
				});
				$("#set").show().css({
					'top' : setY,
					'backgroundColor' : 'rgba(0, 200, 0, 0.8)',
					'left' : bar.position - $("#set").outerWidth()/2
				});
			}
		}
	});
	
	dragger.hover(function() {
		dragger.css({
			backgroundPosition: '0px -70px',
			cursor: 'pointer'
		});
	}, function() {
		if (bar.dragging == false || typeof bar.dragging === 'undefined') {
			dragger.css({
				backgroundPosition: '0px 0px'
			});
		}
	});
	
	dragger.mousedown(function(e) {
		bar.dragging = true;
		bar.mouseOffset = c._x - bar.position;
		return false;
	});

	$(document).mouseup(function(e) {
		bar.dragging = false;
		dragger.css({
			backgroundPosition: '0px 0px'
		});
	});
	
	
}

function display() {
	if (canvas.getContext) {
		var ctx = canvas.getContext('2d');
		ctx.scale(2,2);
		
		var nativeScale = (c.width/days)/2;
		var z = 10;			// the animation speed, lower is faster
		var tolerance = 0.01;	// how close figures to need get to their goal before the loop quits
				
		ctx.clearRect(0, 0, c.width, c.height);
		
		ctx.save();
		
		if (c.moving) {
			if (Math.abs(c.goalxorigin - c.xorigin) > tolerance*100) {		// tolerance is larger for just moving back and forth
				c.xorigin += (c.goalxorigin - c.xorigin) / z;
				clearTimeout(t);
				t = setTimeout(display, 20);
			} else {
				c.xorigin = c.goalxorigin;
				dragger.fadeIn('fast');
				c.moving = false;
			}
		}
		
		if (c.scalingUp) {
			c.xscale += (nativeScale * 11 - c.xscale) / z;		// makes it wider, goes to 11 so month doesn't totally fill canvas
			if (c.goalxorigin-c.xorigin != 0) {
				c.xorigin += (c.goalxorigin - c.xorigin) / z;
			}
			if (c.xscale < nativeScale * 11 && nativeScale*11-c.xscale > tolerance) {
				clearTimeout(t);
				t = setTimeout(display, 20);
			} else {
				c.xscale = nativeScale * 11;
				c.xorigin = c.goalxorigin;
				c.scalingUp = false;
				c.zoomed = true;
				dragger.fadeIn('fast');
				$("#month-button-wrapper").stop().animate({ marginLeft : '0px' });
			}
		}
		if (c.scalingDown) {
			c.zoomed = false;
			c.xscale -= (c.xscale - nativeScale) / z;		// makes it narrower
			c.xorigin += -c.xorigin / z;
			if (c.xscale > nativeScale && c.xscale-nativeScale > tolerance) {
				clearTimeout(t);
				t = setTimeout(display, 20);
			} else {
				c.xorigin = 0;
				c.xscale = nativeScale;
				c.scalingDown = false;
				dragger.fadeIn('fast');
			}
		}
		
		ctx.translate(c.xorigin, 0);	
		
		// draw the sunrise/sunset curves
		ctx.beginPath();
		
		if (d.times[0].rise == 9999) {
			ctx.moveTo(0, 720*c.yscale);
		} else if (d.times[0].rise == 8888) {
			ctx.moveTo(0, 0);
		} else {
			ctx.moveTo(0, d.times[0].rise*c.yscale);
		}
		for (i = 2; i <= days; i++) {
			if (d.times[i-1].rise == 9999) {
				ctx.lineTo(i*c.xscale, 720*c.yscale);
			} else if (d.times[i-1].rise == 8888) {
				ctx.lineTo(i*c.xscale, 0);
			} else {
				ctx.lineTo(i*c.xscale, d.times[i-1].rise*c.yscale);
			}
		}
		if (d.times[days-1].set == 9999) {
			ctx.lineTo(days*c.xscale, 720*c.yscale);
		} else if (d.times[days-1].set == 8888) {
			ctx.lineTo(days*c.xscale, 1440*c.yscale);
		} else {
			ctx.lineTo(days*c.xscale, d.times[days-1].set*c.yscale);
		}
		for (i = days-2; i >= 0; i--) {
			if (d.times[i].set == 9999) {
				ctx.lineTo(i*c.xscale, 720*c.yscale);
			} else if (d.times[i].set == 8888) {
				ctx.lineTo(i*c.xscale, 1440*c.yscale);
			} else {
				ctx.lineTo(i*c.xscale, d.times[i].set*c.yscale);
			}
		}
		ctx.closePath();
		ctx.fillStyle = "#7bbbd4";
		ctx.fill();
		
		if (opts.monthLines) {
			drawGrid(ctx);
		}
		
		ctx.restore();
		
		bar.updateDisplay = true;
		$(document).mousemove();			// "jiggle" mouse to make sure rise/set displays move with graph
	}
}

// finds the given day from the 'times' array from the bar position
function findDay(position) {
	if (position-c.xorigin == 0) {
		return 0;
	} else {
		return Math.floor((position-c.xorigin)/c.xscale);
	}
}

// puts the sunrise and sunset in their boxes
function fillInTimes() {
	if (opts.twelvehour) {
		$("#rise").html('<span class="label">Rise</span>' + d.times[findDay(bar.position)].risef);
		$("#set").html('<span class="label">Set</span>' + d.times[findDay(bar.position)].setf);
	} else {
		$("#rise").html('<span class="label">Rise</span>' + d.times[findDay(bar.position)].risef24);
		$("#set").html('<span class="label">Set</span>' + d.times[findDay(bar.position)].setf24);
	}
	$("#rise, #set").show();
}


// fills in the location name and calculates and fills in the header stats
function loadHeader() {
	var earliest = 0; 			// the earliest sunrise
	var average = 0;			// the average length of day
	var longest = 0;			// longest day
	var shortest = 0;			// shortest day
	var latest = 0; 			// the latest sunset
	
	if (d.location.name == "") {
		$("#location-name").html(d.location.state + ", " + d.location.country);
	} else {
		if (d.location.state == "") {
			$("#location-name").html(d.location.name + ", " + d.location.country);
		} else {
			$("#location-name").html(d.location.name + ", " + d.location.state);
		}
	}
	
	
	for (i = 0; i < days; i++) {
		if (d.times[earliest].rise > d.times[i].rise) {
			earliest = i;
		}
		if (d.times[latest].set < d.times[i].set) {
			latest = i;
		}
		if (d.times[longest].set-d.times[longest].rise < d.times[i].set-d.times[i].rise) {
			longest = i;
		}
		if (d.times[shortest].set-d.times[shortest].rise > d.times[i].set-d.times[i].rise) {
			shortest = i;
		}
		average += d.times[i].set-d.times[i].rise;
	}
	average /= days;
	average /= 60;
	
	shortestTime = (d.times[shortest].set-d.times[shortest].rise)/60;
	longestTime = (d.times[longest].set-d.times[longest].rise)/60;

	if (opts.twelvehour) {
		$("#earliest").html("<strong>Earliest sunrise:</strong> " + shortDate(earliest) + " (" + d.times[earliest].setf + ")");
		$("#latest").html("<strong>Latest sunset:</strong> " + shortDate(latest) + " (" + d.times[latest].setf + ")");
	} else {
		$("#earliest").html("<strong>Earliest sunrise:</strong> " + shortDate(earliest) + " (" + d.times[earliest].risef24 + ")");
		$("#latest").html("<strong>Latest sunset:</strong> " + shortDate(latest) + " (" + d.times[latest].setf24 + ")");
	}
	$("#shortest").html("<strong>Shortest day:</strong> " + shortDate(shortest) + " (" + shortestTime.toFixed(2) + " hours)");
	$("#longest").html("<strong>Longest day:</strong> " + shortDate(longest) + " (" + longestTime.toFixed(2) + " hours)");
	$("#average").html("<strong>Average daylight:</strong> " + average.toFixed(2) + " hours");
	
	$("#active-year").html(activeYear);
}

function shortDate(index) {
	return monthNames[d.times[index].month] + ' ' + d.times[index].day;
}

// resets the left and top offsets when the window resizes
$(window).resize(function() {
	c.leftOffset = $("#canvas").offset().left;
	c.topOffset = $("#canvas").offset().top;
	
	$("#popup-wrapper").css({
		height : $(document).height()	
	});
});

function bindEvents () {
	$("#popup-wrapper").css({
		height : $(document).height()	
	});
	
	$("#change").click(function() {
		$("#content-area").html("");
		changeLocation();
		return false;
	});
	
	$("#hour-option").toggle(function() {
		opts.twelvehour = false;
		fillInTimes();
		loadHeader();
		$("#hour-option").html('12 hour');
		$("#clock-grid").html('<span class="time">3:00</span><span class="time">6:00</span><span class="time">9:00</span><span class="time">Noon</span><span class="time">15:00</span><span class="time">18:00</span><span class="time">21:00</span>');
		return false;
	}, function() {
		opts.twelvehour = true;
		fillInTimes();
		loadHeader();
		switchTo12Hr();
		return false;
	});
	
	$("#month-option").toggle(function() {
		$("#month-option").html("Show grid");
		opts.monthLines = false;
		$("#clock-grid").hide();
		display();
		return false;
	}, function() {
		$("#month-option").html("Hide grid");
		opts.monthLines = true;
		$("#clock-grid").show();
		display();
		return false;
	});
	
	$("#view-year").click(function() {
		if (c.zoomed) {
			c.scalingUp = false;
			c.scalingDown = true;
			c.moving = false;
			dragger.fadeOut('fast');
			$("#month-button-wrapper").stop().animate({
				marginLeft : '-530px'
			}, 'fast', function() {
				clearTimeout(t);
				t = setTimeout(display, 20);
			});
			$(".month-button").removeClass("selected");
			$("#view-month").removeClass("selected");
			$(this).addClass("selected");
		}
		return false;
	});
	
	$("#view-month").click(function() {
		if (!c.zoomed && !c.scalingUp && !c.scalingDown) {
			c.scalingUp = true;
			c.scalingDown = false;
			c.moving = false;
			if (bar.position == 0) {
				bar.focusedMonth = 0;
			} else {
				bar.focusedMonth = Math.floor(bar.position/(c.width/12));
			}
			$(".month-button:eq(" +bar.focusedMonth+ ")").addClass("selected");
			$(this).addClass("selected");
			$("#view-year").removeClass("selected");
			dragger.fadeOut('fast');
			c.goalxorigin = moveToMonth(bar.focusedMonth);
			clearTimeout(t);
			t = setTimeout(display, 20);
		}
		return false;
	});
	
	$("#goto-now").click(function() {
		if (!c.scalingDown && !c.scalingUp) {
			positionBar(day-1, month, year);
		}
		return false;
	});
	
	$(".month-button").click(function() {
		var goalMonth = $(this).index();
		c.goalxorigin = moveToMonth(goalMonth);
		$(".month-button").removeClass("selected");
		$(this).addClass("selected");
		c.moving = true;
		dragger.fadeOut('fast');
		clearTimeout(t);
		t = setTimeout(display, 20);
		return false;
	});
};

// move the dragger bar to the specified date
function positionBar(d, m, y) {
	var newX;
	
	if (c.zoomed) {
		c.moving = true;
		c.goalxorigin = moveToMonth(m-1);
		clearTimeout(t);
		t = setTimeout(display, 20);
		newX = dayOfYear(d, m, y) * c.xscale + moveToMonth(m-1);
	} else {
		newX = dayOfYear(d, m, y) * c.xscale;
	}
	
	// add one to make sure the animation takes it far enough
	bar.animate({
		left : newX + 1
	},
	{
		step: function(now) {
			bar.updateDisplay = true;
			$(document).mousemove();
			bar.position = now;
		},
		duration: 500,
		easing: 'swing'
	});
}

function dayOfYear(day, month, year) {
     N1 = Math.floor(275 * month / 9);
	N2 = Math.floor((month + 9) / 12);
	N3 = (1 + Math.floor((year - 4 * Math.floor(year / 4) + 2) / 3));
	return N1 - (N2 * N3) + day - 30;
}


// draws the month and day grid
function drawGrid(ctx) {

	var daysInMonth = 0;
	for (i = 1; i < days; i++) {
		daysInMonth++;
		if (c.zoomed && !c.moving) {
			ctx.beginPath();
			ctx.moveTo(Math.floor(i*c.xscale)+0.5, 0);			// the floor + 0.5 is to force the line to be clean with no antialiasing
			ctx.lineTo(Math.floor(i*c.xscale)+0.5, c.height);
			ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
			ctx.stroke();
			ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
			ctx.font = '11px Arial';
			var w = ctx.measureText(daysInMonth);
			ctx.fillText(daysInMonth, i*c.xscale - c.xscale/2 - w.width/2, 40);
			ctx.closePath();
		}
		if (d.times[i].month != d.times[i-1].month) {
			ctx.beginPath();
			ctx.moveTo(Math.floor(i*c.xscale)+0.5, 0);			// the floor + 0.5 is to force the line to be clean with no antialiasing
			ctx.lineTo(Math.floor(i*c.xscale)+0.5, c.height);
			ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
			ctx.stroke();
			ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
			ctx.font = 'bold 11px Arial';
			var w = ctx.measureText(monthNames[d.times[i-1].month]);
			ctx.fillText(monthNames[d.times[i-1].month], i*c.xscale - daysInMonth*c.xscale/2 - w.width/2, 20);
			daysInMonth = 0;
			ctx.closePath();
		}
		// special case for December
		if (i == days-1) {
			ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
			ctx.font = 'bold 11px Arial';
			w = ctx.measureText("December");
			var decemberX = i*c.xscale - daysInMonth*c.xscale/2 - w.width/2;
			ctx.fillText("December", decemberX, 20);
			if (c.zoomed && !c.moving) {
				ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
				ctx.font = '11px Arial';
				w = ctx.measureText("31");
				decemberX = (i+1)*c.xscale - c.xscale/2 - w.width/2;
				ctx.fillText("31", decemberX, 40);
			}
		}
	}
	ctx.beginPath();
	for (i = 1; i < 24; i++) {
		if (i%3 == 0) {
			ctx.moveTo(0-c.xorigin, Math.floor(i*c.height/24)+0.5);
			ctx.lineTo(c.width-c.xorigin, Math.floor(i*c.height/24)+0.5);
		}
	}
	ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
	ctx.stroke();
	ctx.closePath();
	
}



// returns the proper coordinate to show the month requested
function moveToMonth(x) {
	// x is the 0-based number of the month
	var monthCoords = 0;
	switch (x) {
		case 0:		// January
			monthCoords = 0;
			break;
		case 1:		// February
			monthCoords = -685;
			break;
		case 2:		// March
			monthCoords = -1390;
			break;
		case 3:		// April
			monthCoords = -2129;
			break;
		case 4:		// May
			monthCoords = -2858;
			break;
		case 5:		// June
			monthCoords = -3594;
			break;
		case 6:		// July
			monthCoords = -4330;
			break;
		case 7:		// August
			monthCoords = -5080;
			break;
		case 8:		// September
			monthCoords = -5815;
			break;
		case 9:		// October
			monthCoords = -6550;
			break;
		case 10:		// November
			monthCoords = -7286;
			break;
		case 11:		// December
			monthCoords = -7999;
			break;
	}
	return monthCoords;
}

// change the year or location
function changeLocation() {
	$("#location").val("");
	$("#year").html(year);
	$("#popup-wrapper").css({ height : $(document).height() }).fadeIn();
}

function switchTo12Hr () {
	$("#hour-option").html('24 hour');
	$("#clock-grid").html('<span class="time">3:00</span><span class="time">6:00</span><span class="time">9:00</span><span class="time">Noon</span><span class="time">3:00</span><span class="time">6:00</span><span class="time">9:00</span>');
}
