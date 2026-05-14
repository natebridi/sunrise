import { useState, useMemo } from "react";
import SunChart from "./components/SunChart";
import { useSunData } from "./lib/useSunData";
import type { Location } from "./lib/locations";
import LOCATIONS from "./lib/locations";
import "./app.css";

const today = new Date();

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function App() {
  const [location, setLocation] = useState<Location | null>(null);
  const [year, setYear] = useState(today.getFullYear());
  const [scrubIndex, setScrubIndex] = useState(0);
  const [twelveHour, setTwelveHour] = useState(true);
  const [showGrid, setShowGrid] = useState(true);

  // Always call the hook unconditionally, but treat days as empty until a
  // location is chosen so the canvas shows the bare night sky first.
  const rawDays = useSunData(
    location?.lat ?? 0,
    location?.lng ?? 0,
    location?.tz ?? "UTC",
    year,
  );
  const days = location !== null ? rawDays : [];

  function handleLocationChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const loc = LOCATIONS.find((l) => l.name === e.target.value) ?? null;
    setLocation(loc);
    if (loc) {
      if (year === today.getFullYear()) {
        const startOfYear = new Date(year, 0, 1);
        const dayOfYear = Math.floor((today.getTime() - startOfYear.getTime()) / 86400000);
        setScrubIndex(dayOfYear);
      } else {
        setScrubIndex(0);
      }
    }
  }

  const yearStats = useMemo(() => {
    if (days.length === 0) return null;
    let earliestIdx = 0, latestIdx = 0, longestIdx = 0, shortestIdx = 0;
    for (let i = 0; i < days.length; i++) {
      const d = days[i];
      if (d.rise < days[earliestIdx].rise) earliestIdx = i;
      if (d.set > days[latestIdx].set) latestIdx = i;
      const len = d.set - d.rise;
      if (len > days[longestIdx].set - days[longestIdx].rise) longestIdx = i;
      if (len < days[shortestIdx].set - days[shortestIdx].rise) shortestIdx = i;
    }
    return { earliestIdx, latestIdx, longestIdx, shortestIdx };
  }, [days]);

  const current = days[scrubIndex];

  return (
    <div className="app">
      <SunChart
        days={days}
        scrubIndex={scrubIndex}
        onScrub={setScrubIndex}
        showGrid={showGrid}
        twelveHour={twelveHour}
        onToggleClock={() => setTwelveHour((v) => !v)}
        onToggleGrid={() => setShowGrid((v) => !v)}
      />

      <div className="floating-ui">
        <div className="card location">
          <select
            className="location-select"
            value={location?.name ?? ""}
            onChange={handleLocationChange}
          >
            <option value="" disabled>Select a city…</option>
            {LOCATIONS.map((l) => (
              <option key={l.name} value={l.name}>{l.name}</option>
            ))}
          </select>
        </div>

        {/* Day stats */}
        <div className="card day-stats">

          {current ? (
            <>
              <div className="stats-date">
                {DAY_NAMES[current.dayOfWeek]}, {MONTH_NAMES[current.month]} {current.day}
              </div>
              <div className="stats-times">
                <div className="stat-time">
                  <span className="stat-label">Rise</span>
                  <span className="stat-value">{twelveHour ? current.risef : current.risef24}</span>
                </div>
                <div className="stat-sep" />
                <div className="stat-time">
                  <span className="stat-label">Set</span>
                  <span className="stat-value">{twelveHour ? current.setf : current.setf24}</span>
                </div>
              </div>
              <div className="stat-daylight">
                {((current.set - current.rise) / 60).toFixed(1)} hrs daylight
              </div>
            </>
          ) : (
            <div className="empty-hint">Select a location to begin</div>
          )}
        </div>

        {/* Year + location */}
        <div className="card year-section">


          <div className="year-row">
            <button className="year-btn" onClick={() => setYear((y) => y - 1)}>◁</button>
            <span className="year-value">{year}</span>
            <button className="year-btn" onClick={() => setYear((y) => y + 1)}>▷</button>
          </div>

          {yearStats && (
            <div className="year-mini-stats">
              <span>
                Earliest rise: {MONTH_NAMES[days[yearStats.earliestIdx].month].slice(0, 3)}{" "}
                {days[yearStats.earliestIdx].day}
              </span>
              <span>
                Latest set: {MONTH_NAMES[days[yearStats.latestIdx].month].slice(0, 3)}{" "}
                {days[yearStats.latestIdx].day}
              </span>
              <span>
                Longest: {((days[yearStats.longestIdx].set - days[yearStats.longestIdx].rise) / 60).toFixed(1)} hrs
              </span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
