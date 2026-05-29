import { useState, useMemo, useCallback } from "react";
import SunChart from "./components/SunChart";
import LocationPicker from "./components/LocationPicker";
import LocationMap from "./components/LocationMap";
import { useSunData } from "./lib/useSunData";
import type { Location } from "./lib/locations";
import "./app.css";
import "./components/cards.css";

const today = new Date();

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function App() {
  const [location, setLocation] = useState<Location | null>(null);
  const [picking, setPicking] = useState(true);
  const [year, setYear] = useState(today.getFullYear());
  const [scrubIndex, setScrubIndex] = useState(0);
  const [twelveHour, setTwelveHour] = useState(true);
  const [showGrid, setShowGrid] = useState(true);

  const rawDays = useSunData(
    location?.lat ?? 0,
    location?.lng ?? 0,
    location?.tz ?? "UTC",
    year,
  );
  const days = location !== null ? rawDays : [];

  const selectLocation = useCallback((loc: Location) => {
    setLocation(loc);
    if (year === today.getFullYear()) {
      const startOfYear = new Date(year, 0, 1);
      setScrubIndex(Math.floor((today.getTime() - startOfYear.getTime()) / 86400000));
    } else {
      setScrubIndex(0);
    }
  }, [year]);

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
      <header className="app-header">
        <h1 className="app-title">Daylight</h1>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 348.55 121.62" className="app-icon" aria-hidden='true'>
          <line x1="3.5" y1="118.12" x2="345.05" y2="118.12" />
          <path d="M91.65,104.45c15.91-29.29,46.95-49.18,82.62-49.18s66.39,19.68,82.37,48.71" />
          <line x1="174.28" y1="38.48" x2="174.28" y2="3.5" />
          <line x1="287.78" y1="57.83" x2="260.54" y2="79.76" />
          <line x1="60.77" y1="57.83" x2="88.01" y2="79.76" />
          <line x1="236.88" y1="17.63" x2="221.86" y2="49.22" />
          <line x1="111.67" y1="17.63" x2="126.7" y2="49.22" />
        </svg>
        <span className="app-desc">Simple sunrise & sunset visualizer</span>
      </header>

      <SunChart
        days={days}
        scrubIndex={scrubIndex}
        onScrub={setScrubIndex}
        showGrid={showGrid}
        twelveHour={twelveHour}
        onToggleClock={() => setTwelveHour((v) => !v)}
        onToggleGrid={() => setShowGrid((v) => !v)}
      />

      {picking && (
        <LocationPicker
          selected={location}
          onSelect={selectLocation}
          onDismiss={() => setPicking(false)}
        />
      )}

      {!picking && (
        <div className="floating-ui">
          {/* Location card */}
          <div className="card location">
            <div className="location-header">
              <span className="location-name-text">{location?.name}</span>
              <button className="btn btn--small" onClick={() => setPicking(true)}>
                Change location
              </button>
            </div>
            <LocationMap selected={location} onSelect={selectLocation} />
          </div>

          {/* Day stats */}
          <div className="card day-stats">
            {current ? (
              <>
                <div className="display-date">
                  <div className="display-day">
                    {DAY_NAMES[current.dayOfWeek].slice(0, 3)}, {MONTH_NAMES[current.month]} {current.day}
                  </div>
                  <div className="display-year">
                    <button className="btn btn--icon" onClick={() => setYear((y) => y - 1)}>
                      <svg className="btn-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M231 256L329 354L299 384L171 256L299 128L329 158"/></svg>
                    </button>
                    <span className="year-value">{year}</span>
                    <button className="btn btn--icon" onClick={() => setYear((y) => y + 1)}>
                      <svg className="btn-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M213 384L183 354L281 256L183 158L213 128L341 256"/></svg>
                    </button>
                  </div>
                </div>

                <div className="stats-grid">


                  <div className="stats-times">
                    <div className="stat-time">
                      <span className="stat-label">Rise</span>
                      <span className="stat-value">{twelveHour ? current.risef : current.risef24}</span>
                    </div>
                    <div className="stat-time">
                      <span className="stat-label">Set</span>
                      <span className="stat-value">{twelveHour ? current.setf : current.setf24}</span>
                    </div>
                  </div>
                  <div className="stat-daylight">
                    {((current.set - current.rise) / 60).toFixed(1)} hrs daylight
                  </div>

                  <div className="year-section">

                    {yearStats && (
                      <div className="year-mini-stats">
                        <span>
                          Earliest rise: 00:00 ({MONTH_NAMES[days[yearStats.earliestIdx].month]}{" "}
                          {days[yearStats.earliestIdx].day})
                        </span>
                        <span>
                          Latest set: 00:00 ({MONTH_NAMES[days[yearStats.latestIdx].month]}{" "}
                          {days[yearStats.latestIdx].day})
                        </span>
                        <span>
                          Longest day: {((days[yearStats.longestIdx].set - days[yearStats.longestIdx].rise) / 60).toFixed(1)} hours
                          ({MONTH_NAMES[days[yearStats.longestIdx].month]}{" "}
                          {days[yearStats.longestIdx].day})
                        </span>
                        <span>
                          Shortest day: {((days[yearStats.shortestIdx].set - days[yearStats.shortestIdx].rise) / 60).toFixed(1)} hours
                          ({MONTH_NAMES[days[yearStats.shortestIdx].month]}{" "}
                          {days[yearStats.shortestIdx].day})
                        </span>
                      </div>
                    )}
                  </div>

                </div>
              </>
            ) : (
              <div className="empty-hint">Select a location to begin</div>
            )}
          </div>


        </div>
      )}
    </div>
  );
}
