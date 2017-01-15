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
     
     if ($rise != 9999 && $rise != 8888) {
          if ($rise > 720) {
               $formattedRise12 = floor($rise/60)-12 . ':' . str_pad(floor($rise%60), 2, "0", STR_PAD_LEFT) . ' pm';
          } else {
               $formattedRise12 = floor($rise/60) . ':' . str_pad(floor($rise%60), 2, "0", STR_PAD_LEFT) . ' am';
          }
          $formattedRise24 = floor($rise/60) . ':' . str_pad(floor($rise%60), 2, "0", STR_PAD_LEFT);
     } else {
          $formattedRise12 = "No sunrise";
          $formattedRise24 = "No sunrise";
     }
     
     if ($set != 9999 && $set != 8888) {
          if ($set > 720) {
               $formattedSet12 = floor($set/60)-12 . ':' . str_pad(floor($set%60), 2, "0", STR_PAD_LEFT) . ' pm';
          } else {
               $formattedSet12 = floor($set/60) . ':' . str_pad(floor($set%60), 2, "0", STR_PAD_LEFT) . ' am';
          }
          $formattedSet24 = floor($set/60) . ':' . str_pad(floor($set%60), 2, "0", STR_PAD_LEFT);
     } else {
          $formattedSet12 = "No sunset";
          $formattedSet24 = "No sunset";
     }
          
     $formattedDate = date("l, F j, Y", strtotime($currentDay));
     $formattedShortDate = date("F j", strtotime($currentDay));
     
     $monthString = date("F", strtotime($currentDay));

     
     $sunData[] = array('rise' => $rise,
                        'set' => $set,
                        'risef' => $formattedRise12,
                        'setf' => $formattedSet12,
                        'risef24' => $formattedRise24,
                        'setf24' => $formattedSet24,
                        'month' => $monthString,
                        'day' => $formattedDate,
                        'shortdate' => $formattedShortDate);
     
     $currentDay = date("Y-m-d", strtotime("+1 day", strtotime($currentDay)));
}

$data = array('location' => $locationData, 'times' => $sunData);

echo json_encode($data);

?>