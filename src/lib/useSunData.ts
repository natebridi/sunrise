import { useMemo } from "react";
import { DateTime } from "luxon";
import { julianDay, sunriseUTC, sunsetUTC } from "./sun";

export interface DayData {
  rise: number;   // minutes since midnight, local time
  set: number;
  month: number;  // 0-based
  day: number;    // 1-based
  dayOfWeek: number; // 0=Monday … 6=Sunday
  risef: string;  // formatted 12-hour
  setf: string;
  risef24: string;
  setf24: string;
}

function formatTime(minutes: number, twelveHour: boolean): string {
  const hrs = Math.floor(minutes / 60);
  const mins = Math.floor(minutes % 60);
  const mm = mins < 10 ? "0" + mins : String(mins);
  if (twelveHour) {
    if (hrs === 0) return `12:${mm} am`;
    if (hrs < 12) return `${hrs}:${mm} am`;
    if (hrs === 12) return `12:${mm} pm`;
    return `${hrs - 12}:${mm} pm`;
  }
  return `${hrs}:${mm}`;
}

export function computeSunData(lat: number, lng: number, tz: string, year: number): DayData[] {
  // NOAA formula uses negated longitude
  const lngNoaa = -lng;

  const result: DayData[] = [];
  let dayIndex = 1;

  const start = DateTime.fromObject({ year, month: 1, day: 1 }, { zone: tz });
  const end = DateTime.fromObject({ year: year + 1, month: 1, day: 1 }, { zone: tz });
  let current = start;

  while (current < end) {
    const jd = julianDay(dayIndex, 1, year);

    // Per-day offset (minutes) accounts for DST — luxon .offset is already in minutes
    const offsetMinutes = current.offset;

    let rise = sunriseUTC(jd, lat, lngNoaa);
    let set: number | null = null;

    if (rise === null) {
      rise = 0;
      set = 0;
    } else {
      set = sunsetUTC(jd, lat, lngNoaa);
      rise += offsetMinutes;
      if (set !== null) set += offsetMinutes;
      else set = 0;
    }

    // Sun never sets: span > 24 hours
    if (Math.abs(set - rise) > 1440) {
      rise = 0;
      set = 1440;
    }

    rise = Math.min(Math.max(rise, 0), 1440);
    set = Math.min(Math.max(set, 0), 1440);

    const month = current.month - 1; // 0-based
    const day = current.day;
    const dayOfWeek = current.weekday - 1; // luxon: 1=Mon, convert to 0-based Mon

    result.push({
      rise: Math.round(rise * 100) / 100,
      set: Math.round(set * 100) / 100,
      month,
      day,
      dayOfWeek,
      risef: formatTime(rise, true),
      setf: formatTime(set, true),
      risef24: formatTime(rise, false),
      setf24: formatTime(set, false),
    });

    current = current.plus({ days: 1 });
    dayIndex++;
  }

  return result;
}

export function useSunData(
  lat: number,
  lng: number,
  tz: string,
  year: number
): DayData[] {
  return useMemo(() => computeSunData(lat, lng, tz, year), [lat, lng, tz, year]);
}
