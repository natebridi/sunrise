<!DOCTYPE html>
<html>
<head>
<title>Day:light - A simple sunset-sunrise calculator and visualizer</title>
<link rel="stylesheet" type="text/css" href="style.css" />
<script type="text/javascript" src="jquery.js"></script>
<script type="text/javascript" src="location.js"></script>
<script type="text/javascript" src="light.js"></script>
<script type="text/javascript">

  var _gaq = _gaq || [];
  _gaq.push(['_setAccount', 'UA-22258578-1']);
  _gaq.push(['_trackPageview']);

  (function() {
    var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
    ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
    var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
  })();

</script>
</head>
<body>

<div id="content-area">


</div><!-- #content-area -->

<div id="popup-wrapper">
     <div id="location-popup">
          <div id="location-form-wrapper">
               <form action="location.php" method="post" id="location-form">
                    <label for="location">Enter your location</label> <a href="#" id="location-help">? <div id="location-tooltip">You can enter anything that represents a location: a state/province, city, postal code, or an address.</div></a><br>
                    
                    <input type="text" size="20" name="location" id="location" /><br>
                    <label for="year">Select year</label><br>
                    <div id="year-chooser"><a href="#" id="year-subtract">-</a> <span id="year">2011</span> <a href="#" id="year-add">+</a></div>
                    <input type="submit" value="Show me the light">
               </form>
               <div id="error"></div>
          </div>
     </div><!-- #location-popup -->
</div><!-- #popup-wrapper -->

<div id="loading">
     <span class="loading">Loading . . .</span>
</div>

</body>
</html>