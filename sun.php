<?php 

function dayOfYear($day, $month, $year) {
     $N1 = floor(275 * $month / 9);
	$N2 = floor(($month + 9) / 12);
	$N3 = (1 + floor(($year - 4 * floor($year / 4) + 2) / 3));
	return $N1 - ($N2 * $N3) + $day - 30;
}


// Calculates the Julian day
function julianDay($d, $m, $y) {
     if ($m <= 2) {
		$y -= 1;
		$m += 12;
	}
	
     $A = floor($y/100);
     $B = 2 - $A + floor($A/4);
     $julianDay = floor(365.25*($y + 4716)) + floor(30.6001*($m+1)) + $d + $B - 1524.5;
          
     return $julianDay;
}


// Takes Julian Day and returns Julian centuries since J2000
function julianCent($jd) {
	$julianCent = ($jd - 2451545.0)/36525.0;
          
	return $julianCent;
}


function JDFromJulianCent($t) {
     $JD = $t * 36525.0 + 2451545.0;
     return $JD;
}



// Takes the Julian century and returns the geometric mean longitude of the sun in degrees
function geoMeanLongSun($t) {
     $L = 280.46646 + $t * (36000.76983 + (0.0003032 * $t));
     
     while($L > 360) {
          $L -= (float) 360;
     }
     while($L < 0) {
          $L += (float) 360;
     }
          
     return $L;		// in degrees
}


// Takes the Julian century and returns the geometric mean anomaly of the sun in degrees
function geoMeanAnomalySun($t) {
     $M = 357.52911 + $t * (35999.05029 - 0.0001537 * $t);
          
     return $M;		// in degrees
}


// Takes the Julian century and returns the eccentricity of the earth's orbit
function orbitEccentricity($t) {
     $e = 0.016708634 - $t * (0.000042037 + 0.0000001267 * $t);
          
     return $e;		// unitless
}


// Takes the Julian century and calculates the equation of center for the sun in degrees
function sunCenter($t) {
     $m = geoMeanAnomalySun($t);

     $m = deg2rad($m);
     $sinm = sin($m);
     $sin2m = sin(2*$m);
     $sin3m = sin(3*$m);

     $C = $sinm * (1.914602 - $t * (0.004817 + 0.000014 * $t)) + $sin2m * (0.019993 - 0.000101 * $t) + $sin3m * 0.000289;
               
     return $C;		// in degrees
}


// Takes the Julian century and calculates the true longitude of the sun in degrees
function sunTrueLong($t) {
	$l = geoMeanLongSun($t);
	$c = sunCenter($t);

     $trueLong = $l + $c;
               	
     return $trueLong;		// in degrees
}


// Takes the Julian century and calculates the true anomaly of the sun in degrees
function sunTrueAnomaly($t) {
     $m = geoMeanAnomalySun($t);
     $c = sunCenter($t);

     $v = $m + $c;
          
     return $v;		// in degrees
}


// Takes the Julian century and calculates the distances (vector) to the sun in AUs
function sunDistance($t) {
     $v = sunTrueAnomaly($t);
     $e = orbitEccentricity($t);

     $R = (1.000001018 * (1 - $e * $e)) / (1 + $e * cos(deg2rad($v)));
          
     return $R;		// in AUs
}


// Takes the Julian century and calculates the apparent longitude of the sun in degrees
function sunApparentLong($t) {
     $o = sunTrueLong($t);

     $omega = 125.04 - 1934.136 * $t;
     $lambda = $o - 0.00569 - 0.00478 * sin(deg2rad($omega));
          
     return $lambda;		// in degrees
}


// Takes the Julian century and calculates the mean obliquity of the ecliptic in degrees
function meanEclipticObliquity($t) {
     $seconds = 21.448 - $t*(46.8150 + $t*(0.00059 - $t*(0.001813)));
     
     $e0 = 23.0 + (26.0 + ($seconds/60.0))/60.0;
               
     return $e0;		// in degrees
}


// Takes the Julian century and calculates the corrected obliquity of the ecliptic in degrees
function obliquityCorrection($t) {
     $e0 = meanEclipticObliquity($t);

     $omega = 125.04 - 1934.136 * $t;
     $e = $e0 + 0.00256 * cos(deg2rad($omega));
               
     return $e;		// in degrees
}


// Calculates the right ascension of the sun in degrees
function rightAscension($t) {
     $e = obliquityCorrection($t);
     $lambda = sunApparentLong($t);

     $tananum = cos(deg2rad($e)) * sin(deg2rad($lambda));
     $tanadenom = cos(deg2rad($lambda));
     $alpha = rad2deg(atan2($tananum, $tanadenom));
          
     return $alpha;		// in degrees
}


// Calculates the declination of the sun
function declination($t) {
     $e = obliquityCorrection($t);
     $lambda = sunApparentLong($t);

     $sint = sin(deg2rad($e)) * sin(deg2rad($lambda));
     $theta = rad2deg(asin($sint));
                    
     return $theta;		// in degrees
}



function equationOfTime($t) {
     $epsilon = obliquityCorrection($t);
     $l0 = geoMeanLongSun($t);
     $e = orbitEccentricity($t);
     $m = geoMeanAnomalySun($t);
     
     $y = tan(deg2rad($epsilon)/2.0);
     $y *= $y;

     $sin2l0 = sin(2.0 * deg2rad($l0));
     $sinm   = sin(deg2rad($m));
     $cos2l0 = cos(2.0 * deg2rad($l0));
     $sin4l0 = sin(4.0 * deg2rad($l0));
     $sin2m  = sin(2.0 * deg2rad($m));

     $Etime = $y * $sin2l0 - 2.0 * $e * $sinm + 4.0 * $e * $y * $sinm * $cos2l0 - 0.5 * $y * $y * $sin4l0 - 1.25 * $e * $e * $sin2m;
          
     return rad2deg($Etime)*4.0;	// in minutes of time
}


// Calculates the hour angle of the sun at sunrise
function hourAngleSunrise($lat, $solarDec) {
     $latRad = deg2rad($lat);
     $sdRad  = deg2rad($solarDec);

     $HAarg = cos(deg2rad(90.833))/(cos($latRad)*cos($sdRad))-tan($latRad) * tan($sdRad);
     
     if ($HAarg > 1 || $HAarg < -1) {
          return -1;
     } else {
          $HA = (acos(cos(deg2rad(90.833))/(cos($latRad)*cos($sdRad))-tan($latRad) * tan($sdRad)));
          return $HA;		// in radians
     }
}


// Calculates the hour angle of the sun at sunset
function hourAngleSunset($lat, $solarDec) {
     $latRad = deg2rad($lat);
     $sdRad  = deg2rad($solarDec);
     
     $HAarg = cos(deg2rad(90.833))/(cos($latRad)*cos($sdRad))-tan($latRad) * tan($sdRad);
     
     if ($HAarg > 1 || $HAarg < -1) {
          return -1;
     } else {
          $HA = (acos(cos(deg2rad(90.833))/(cos($latRad)*cos($sdRad))-tan($latRad) * tan($sdRad)));
          return -$HA;		// in radians
     }
}



function sunriseUTC($JD, $latitude, $longitude) {
     $t = julianCent($JD);
     
     // *** Find the time of solar noon at the location, and use
   //     that declination. This is better than start of the 
   //     Julian day

     $noonmin = solNoonUTC($t, $longitude);
     $tnoon = julianCent($JD+$noonmin/1440.0);
     
     // *** First pass to approximate sunrise (using solar noon)

     $eqTime = equationOfTime($tnoon);
     $solarDec = declination($tnoon);
     $hourAngle = hourAngleSunrise($latitude, $solarDec);
     
     // this means the sun never rises on this date
     if ($hourAngle == -1) {
          return -1;
     } else {
          $delta = $longitude - rad2deg($hourAngle);
                    
          $timeDiff = 4 * $delta;	// in minutes of time
          $timeUTC = 720 + $timeDiff - $eqTime;	// in minutes
          
          // *** Second pass includes fractional jday in gamma calc
     
          $newt = julianCent(JDFromJulianCent($t) + $timeUTC/1440.0); 
          $eqTime = equationOfTime($newt);
          $solarDec = declination($newt);
          $hourAngle = hourAngleSunrise($latitude, $solarDec);
     
          $delta = $longitude - rad2deg($hourAngle);
          $timeDiff = 4 * $delta;
          $timeUTC = 720 + $timeDiff - $eqTime; // in minutes
          return $timeUTC;
     }
}


function sunsetUTC($JD, $latitude, $longitude) {
     $t = julianCent($JD);
     
     // *** Find the time of solar noon at the location, and use
   //     that declination. This is better than start of the 
   //     Julian day

     $noonmin = solNoonUTC($t, $longitude);
     $tnoon = julianCent($JD+$noonmin/1440.0);
     
     // *** First pass to approximate sunrise (using solar noon)

     $eqTime = equationOfTime($tnoon);
     $solarDec = declination($tnoon);
     $hourAngle = hourAngleSunset($latitude, $solarDec);
     
     // this means the sun never sets on this date
     if ($hourAngle == -1) {
          return -1;
     } else {
          $delta = $longitude - rad2deg($hourAngle);
               
          $timeDiff = 4 * $delta;	// in minutes of time
          $timeUTC = 720 + $timeDiff - $eqTime;	// in minutes
          
          // *** Second pass includes fractional jday in gamma calc
     
          $newt = julianCent(JDFromJulianCent($t) + $timeUTC/1440.0); 
          $eqTime = equationOfTime($newt);
          $solarDec = declination($newt);
          $hourAngle = hourAngleSunset($latitude, $solarDec);
     
          $delta = $longitude - rad2deg($hourAngle);
          $timeDiff = 4 * $delta;
          $timeUTC = 720 + $timeDiff - $eqTime; // in minutes

          return $timeUTC;
     }
}


function solNoonUTC($t, $longitude) {
     // First pass uses approximate solar noon to calculate eqtime
     $tnoon = julianCent(JDFromJulianCent($t) + $longitude/360.0);
     $eqTime = equationOfTime($tnoon);
     $solNoonUTC = 720 + ($longitude * 4) - $eqTime; // min

     $newt = julianCent(JDFromJulianCent($t) -0.5 + $solNoonUTC/1440.0); 

     $eqTime = equationOfTime($newt);

     $solNoonUTC = 720 + ($longitude * 4) - $eqTime; // min
          
     return $solNoonUTC;
}

?>