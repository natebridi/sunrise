<?php

/*$locationPost = filter_input(INPUT_POST, "location", FILTER_SANITIZE_ENCODED);

$c = curl_init();
curl_setopt($c, CURLOPT_URL, "http://where.yahooapis.com/geocode?q=" . $locationPost . "&flags=TR&appid=pkvUxZPV34F8z2hrkk9aVpbD.czCeo2mi.23h5GAbEddtfgHKwObU1yQxZo-");
curl_setopt($c, CURLOPT_RETURNTRANSFER, 1);
$output = curl_exec($c);
curl_close($c);

$xml = simplexml_load_string($output);*/

$error[0] = 0; //$xml->Error;    // 0 means no error
if ($error[0] == 0) {
     // static numbers are for zip code 15224
     $latitude = 40.46408; //(float) $xml->Result[0]->latitude;
     $longitude = 79.945949; //-(float) $xml->Result[0]->longitude;
     $quality = 60; //$xml->Result[0]->quality;
     //$timecode = $xml->Result[0]->timezone;
     $name = "Pittsburgh"; //$xml->Result[0]->city;

     //$tz = new DateTime('now', new DateTimeZone($timecode));
     $offset = -5; //$tz->getOffset() / 3600;

     $locationData = array('location' => $name,
                      'latitude' => $latitude,
                      'longitude' => $longitude,
                      'offset' => $offset,
                      'error' => $error,
                      'quality' => $quality);

     echo json_encode($locationData);
} else {
     $locationData = array('error' => $error);
     echo json_encode($locationData);
}

?>