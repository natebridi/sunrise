<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>

<title>Day:light - A simple sunset-sunrise calculator and visualizer</title>
<link rel="stylesheet" type="text/css" href="styles/base.css" />
<link rel="stylesheet" type="text/css" href="style.css" />
<link rel="stylesheet" type="text/css" href="styles/style.css" />
<!-- <script type="text/javascript">

  var _gaq = _gaq || [];
  _gaq.push(['_setAccount', 'UA-22258578-1']);
  _gaq.push(['_trackPageview']);

  (function() {
    var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
    ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
    var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
  })();

</script> -->
</head>
<body>

<div id="content">

<div id="masthead">
    <h1>Daylight: <em>A simple sunset-sunrise calculator and visualizer</em></h1>
    <div class="select-wrap">
      <select id="city">
        <option>Current Location</option>
      </select>
    </div>
</div>
<div id="page-wrapper">
     <div id="header">
          <div id="location-stats">
             <span class="location-data" id="profile-leadin">Statistics for <span id="active-year"></span></span>
             <span class="location-data" id="shortest"></span>
             <span class="location-data" id="longest"></span>
             <span class="location-data" id="earliest"></span>
             <span class="location-data" id="average"></span>
             <span class="location-data" id="latest"></span>
          </div><!-- #location-stats -->
     </div><!-- #header -->
     
     <div id="timeframe"><span class="label">View:</span><a href="#"  class="selected" id="view-year">Full year</a><a href="#" id="view-month">Month</a>
          <div id="month-selector-wrapper">
               <div id="month-button-wrapper">
                    <a href="#" class="month-button">Jan.</a>
                    <a href="#" class="month-button">Feb.</a>
                    <a href="#" class="month-button">March</a>
                    <a href="#" class="month-button">April</a>
                    <a href="#" class="month-button">May</a>
                    <a href="#" class="month-button">June</a>
                    <a href="#" class="month-button">July</a>
                    <a href="#" class="month-button">Aug.</a>
                    <a href="#" class="month-button">Sept.</a>
                    <a href="#" class="month-button">Oct.</a>
                    <a href="#" class="month-button">Nov.</a>
                    <a href="#" class="month-button">Dec.</a>
               </div>
          </div>
     </div>
          
     <div id="canvas-wrapper">
          <div id="clock-grid"><span class="time">3:00</span><span class="time">6:00</span><span class="time">9:00</span><span class="time">Noon</span><span class="time">3:00</span><span class="time">6:00</span><span class="time">9:00</span></div>
          <canvas id="canvas"></canvas>
          <div id="scrubber"><div id="control-bar"><div id="bar-dragger"></div></div><div id="rise"></div><div id="set"></div></div>
     </div><!-- #canvas-wrapper -->
     
     <div id="day-display"></div>
     
     <div id="options">
          <a href="#" class="options-button" id="goto-now">Move bar to today</a><a href="#" class="options-button" id="hour-option">24 hour</a><a href="#" class="options-button" id="month-option">Hide grid</a>
     </div><!-- #options -->

</div><!-- #page-wrapper -->
</div>

<div id="loading">
  <ul>
    <li></li>
    <li></li>
    <li></li>
    <li></li>
  </ul>
</div>

<script type="text/javascript" src="jquery.js"></script>
<script type="text/javascript" src="scripts/jstz.min.js"></script>
<script type="text/javascript" src="scripts/location.js"></script>
<script type="text/javascript" src="light.js"></script>

<!-- <script type="text/javascript" src="jquery.js"></script>
<script type="text/javascript" src="location.js"></script>
<script type="text/javascript" src="light.js"></script> -->

</body>
</html>