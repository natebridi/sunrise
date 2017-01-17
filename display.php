<?php
require "sun.php";


$locationData = array();


$currentYear = filter_input(INPUT_POST, "year", FILTER_SANITIZE_MAGIC_QUOTES);
$tz = filter_input(INPUT_POST, "tz", FILTER_SANITIZE_MAGIC_QUOTES);
$latitude = filter_input(INPUT_POST, "lat", FILTER_SANITIZE_ENCODED);
$longitude = filter_input(INPUT_POST, "lng", FILTER_SANITIZE_ENCODED);

$i = 1;

// NOAA formula uses inverse longitude
$longitude = -$longitude;

//$timezone = 'America/New_York';
date_default_timezone_set($tz);

$startDate = $currentYear.'-01-01';
$endDate = (int)$currentYear+1 . '-01-01';

$currentDay = $startDate;

$sunData = array();
$i = 0;

while ($currentDay != $endDate) {
     $i++;
     
     $jd = julianDay($i, 1, $currentYear);

     // Have to get the timezone each "day" to properly account for 
     // daylight savings time
     $temp_tz = new DateTime($currentDay, new DateTimeZone($tz));
     $offset = $temp_tz->getOffset();
     
     $rise = sunriseUTC($jd, $latitude, $longitude);
     if ($rise == 9999 || $rise == 8888) {
          $set = $rise;
     } else {
          $set = sunsetUTC($jd, $latitude, $longitude);
     }
     
     if ($rise != 9999 && $rise != 8888) {
          $rise += $offset / 60;
     }
     if ($set != 9999 && $set != 8888) {
          $set += $offset / 60;
     }
     
     if (abs($set - $rise) > 1440) {
          $rise = 8888;
          $set = 8888;
     }
     
     if ($rise > 1440 && $rise != 9999 && $rise != 8888) {
          $rise = 1440;
     }
     if ($rise < 0) {
          $rise = 0;
     }
     if ($set < 0) {
          $set = 0;
     }
     if ($set > 1440  && $set != 9999 && $set != 8888) {
          $set = 1440;
     }
          
     // Month as a number from 0 to 11
     $monthNum = date("n", strtotime($currentDay)) - 1;

     // Day as a number from 1 to 31
     $dayNum = (int)date("j", strtotime($currentDay));

     // Day of week as number from 0 (Monday) to 6
     $dayOfWeek = date("N", strtotime($currentDay)) - 1;

     $sunData[] = array(
                    round($rise, 2),
                    round($set, 2),
                    $monthNum,
                    $dayNum,
                    $dayOfWeek
                  );
     
     $currentDay = date("Y-m-d", strtotime("+1 day", strtotime($currentDay)));
}

$data = array('location' => $locationData, 'times' => $sunData);

echo json_encode($data);

?>