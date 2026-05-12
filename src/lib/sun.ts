// NOAA solar calculation formulas, ported from sun.php
// Source: https://gml.noaa.gov/grad/solcalc/

function julianDay(d: number, m: number, y: number): number {
  if (m <= 2) {
    y -= 1;
    m += 12;
  }
  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5;
}

function julianCent(jd: number): number {
  return (jd - 2451545.0) / 36525.0;
}

function jdFromJulianCent(t: number): number {
  return t * 36525.0 + 2451545.0;
}

function geoMeanLongSun(t: number): number {
  let L = 280.46646 + t * (36000.76983 + 0.0003032 * t);
  while (L > 360) L -= 360;
  while (L < 0) L += 360;
  return L;
}

function geoMeanAnomalySun(t: number): number {
  return 357.52911 + t * (35999.05029 - 0.0001537 * t);
}

function orbitEccentricity(t: number): number {
  return 0.016708634 - t * (0.000042037 + 0.0000001267 * t);
}

function sunCenter(t: number): number {
  const m = (geoMeanAnomalySun(t) * Math.PI) / 180;
  return (
    Math.sin(m) * (1.914602 - t * (0.004817 + 0.000014 * t)) +
    Math.sin(2 * m) * (0.019993 - 0.000101 * t) +
    Math.sin(3 * m) * 0.000289
  );
}

function sunTrueLong(t: number): number {
  return geoMeanLongSun(t) + sunCenter(t);
}

function sunApparentLong(t: number): number {
  const omega = 125.04 - 1934.136 * t;
  return sunTrueLong(t) - 0.00569 - 0.00478 * Math.sin((omega * Math.PI) / 180);
}

function meanEclipticObliquity(t: number): number {
  const seconds = 21.448 - t * (46.815 + t * (0.00059 - t * 0.001813));
  return 23.0 + (26.0 + seconds / 60.0) / 60.0;
}

function obliquityCorrection(t: number): number {
  const omega = 125.04 - 1934.136 * t;
  return meanEclipticObliquity(t) + 0.00256 * Math.cos((omega * Math.PI) / 180);
}

function equationOfTime(t: number): number {
  const epsilon = obliquityCorrection(t);
  const l0 = geoMeanLongSun(t);
  const e = orbitEccentricity(t);
  const m = geoMeanAnomalySun(t);

  const y = Math.tan(((epsilon * Math.PI) / 180) / 2) ** 2;

  const sin2l0 = Math.sin(2 * (l0 * Math.PI) / 180);
  const sinm = Math.sin((m * Math.PI) / 180);
  const cos2l0 = Math.cos(2 * (l0 * Math.PI) / 180);
  const sin4l0 = Math.sin(4 * (l0 * Math.PI) / 180);
  const sin2m = Math.sin(2 * (m * Math.PI) / 180);

  const Etime =
    y * sin2l0 -
    2 * e * sinm +
    4 * e * y * sinm * cos2l0 -
    0.5 * y * y * sin4l0 -
    1.25 * e * e * sin2m;

  return ((Etime * 180) / Math.PI) * 4;
}

function declination(t: number): number {
  const e = obliquityCorrection(t);
  const lambda = sunApparentLong(t);
  const sint = Math.sin((e * Math.PI) / 180) * Math.sin((lambda * Math.PI) / 180);
  return (Math.asin(sint) * 180) / Math.PI;
}

function solNoonUTC(t: number, longitude: number): number {
  const tnoon = julianCent(jdFromJulianCent(t) + longitude / 360.0);
  let eqTime = equationOfTime(tnoon);
  let solNoon = 720 + longitude * 4 - eqTime;
  const newt = julianCent(jdFromJulianCent(t) - 0.5 + solNoon / 1440.0);
  eqTime = equationOfTime(newt);
  return 720 + longitude * 4 - eqTime;
}

function hourAngleSunrise(lat: number, solarDec: number): number | null {
  const latRad = (lat * Math.PI) / 180;
  const sdRad = (solarDec * Math.PI) / 180;
  const HAarg =
    Math.cos((90.833 * Math.PI) / 180) / (Math.cos(latRad) * Math.cos(sdRad)) -
    Math.tan(latRad) * Math.tan(sdRad);
  if (HAarg > 1 || HAarg < -1) return null;
  return Math.acos(HAarg);
}

function sunriseUTC(jd: number, latitude: number, longitude: number): number | null {
  const t = julianCent(jd);
  const noonmin = solNoonUTC(t, longitude);
  const tnoon = julianCent(jd + noonmin / 1440.0);

  let eqTime = equationOfTime(tnoon);
  let solarDec = declination(tnoon);
  let hourAngle = hourAngleSunrise(latitude, solarDec);
  if (hourAngle === null) return null;

  let delta = longitude - (hourAngle * 180) / Math.PI;
  let timeUTC = 720 + 4 * delta - eqTime;

  const newt = julianCent(jdFromJulianCent(t) + timeUTC / 1440.0);
  eqTime = equationOfTime(newt);
  solarDec = declination(newt);
  hourAngle = hourAngleSunrise(latitude, solarDec);
  if (hourAngle === null) return null;

  delta = longitude - (hourAngle * 180) / Math.PI;
  timeUTC = 720 + 4 * delta - eqTime;
  return timeUTC;
}

function sunsetUTC(jd: number, latitude: number, longitude: number): number | null {
  const t = julianCent(jd);
  const noonmin = solNoonUTC(t, longitude);
  const tnoon = julianCent(jd + noonmin / 1440.0);

  let eqTime = equationOfTime(tnoon);
  let solarDec = declination(tnoon);
  let hourAngle = hourAngleSunrise(latitude, solarDec);
  if (hourAngle === null) return null;

  let delta = longitude - (-(hourAngle * 180) / Math.PI);
  let timeUTC = 720 + 4 * delta - eqTime;

  const newt = julianCent(jdFromJulianCent(t) + timeUTC / 1440.0);
  eqTime = equationOfTime(newt);
  solarDec = declination(newt);
  hourAngle = hourAngleSunrise(latitude, solarDec);
  if (hourAngle === null) return null;

  delta = longitude - (-(hourAngle * 180) / Math.PI);
  timeUTC = 720 + 4 * delta - eqTime;
  return timeUTC;
}

export { julianDay, sunriseUTC, sunsetUTC };
