import { useMemo } from "react";
import type { DayData } from "../lib/useSunData";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface Props {
  days: DayData[];
  scrubIndex: number;
  locationName: string;
  year: number;
  twelveHour: boolean;
  onToggleClock: () => void;
  onToggleGrid: () => void;
  showGrid: boolean;
  onChangeLocation: () => void;
}

function shortDate(day: DayData) {
  return `${MONTH_NAMES[day.month]} ${day.day}`;
}

function formatHours(minutes: number) {
  return (minutes / 60).toFixed(2) + " hrs";
}

export default function StatsHeader({
  days,
  scrubIndex,
  locationName,
  year,
  twelveHour,
  onToggleClock,
  onToggleGrid,
  showGrid,
  onChangeLocation,
}: Props) {
  const stats = useMemo(() => {
    if (days.length === 0) return null;

    let earliestIdx = 0;
    let latestIdx = 0;
    let longestIdx = 0;
    let shortestIdx = 0;
    let totalMinutes = 0;

    for (let i = 0; i < days.length; i++) {
      const d = days[i];
      if (d.rise < days[earliestIdx].rise) earliestIdx = i;
      if (d.set > days[latestIdx].set) latestIdx = i;
      const len = d.set - d.rise;
      const longestLen = days[longestIdx].set - days[longestIdx].rise;
      const shortestLen = days[shortestIdx].set - days[shortestIdx].rise;
      if (len > longestLen) longestIdx = i;
      if (len < shortestLen) shortestIdx = i;
      totalMinutes += len;
    }

    return { earliestIdx, latestIdx, longestIdx, shortestIdx, avgMinutes: totalMinutes / days.length };
  }, [days]);

  if (!stats || days.length === 0) return null;

  const current = days[scrubIndex];
  const dayLen = ((current.set - current.rise) / 60).toFixed(2);

  const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  return (
    <div className="stats-header">
      <div className="header-top">
        <h1 className="location-name">{locationName}</h1>
        <div className="header-controls">
          <button onClick={onChangeLocation}>Change location</button>
          <button onClick={onToggleClock}>{twelveHour ? "24 hour" : "12 hour"}</button>
          <button onClick={onToggleGrid}>{showGrid ? "Hide grid" : "Show grid"}</button>
        </div>
      </div>

      <div className="day-display">
        <h2>{DAY_NAMES[current.dayOfWeek]}, {MONTH_NAMES[current.month]} {current.day} {year}</h2>
        <div className="times-row">
          <span className="time-pill">
            <span className="label">Rise</span>
            {twelveHour ? current.risef : current.risef24}
          </span>
          <span className="time-pill">
            <span className="label">Set</span>
            {twelveHour ? current.setf : current.setf24}
          </span>
          <span className="daylight">{dayLen} hours of daylight</span>
        </div>
      </div>

      <div className="year-stats">
        <span>
          <strong>Earliest sunrise:</strong>{" "}
          {shortDate(days[stats.earliestIdx])} ({twelveHour ? days[stats.earliestIdx].risef : days[stats.earliestIdx].risef24})
        </span>
        <span>
          <strong>Latest sunset:</strong>{" "}
          {shortDate(days[stats.latestIdx])} ({twelveHour ? days[stats.latestIdx].setf : days[stats.latestIdx].setf24})
        </span>
        <span>
          <strong>Longest day:</strong>{" "}
          {shortDate(days[stats.longestIdx])} ({formatHours(days[stats.longestIdx].set - days[stats.longestIdx].rise)})
        </span>
        <span>
          <strong>Shortest day:</strong>{" "}
          {shortDate(days[stats.shortestIdx])} ({formatHours(days[stats.shortestIdx].set - days[stats.shortestIdx].rise)})
        </span>
        <span>
          <strong>Average daylight:</strong> {formatHours(stats.avgMinutes)}
        </span>
      </div>
    </div>
  );
}
