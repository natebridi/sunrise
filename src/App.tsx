import { useState } from "react";
import LocationPicker from "./components/LocationPicker";
import StatsHeader from "./components/StatsHeader";
import SunChart from "./components/SunChart";
import { useSunData } from "./lib/useSunData";
import type { Location } from "./lib/locations";
import LOCATIONS from "./lib/locations";
import "./app.css";

const today = new Date();
const DEFAULT_LOCATION = LOCATIONS.find((l) => l.name === "New York, NY") ?? LOCATIONS[0];

export default function App() {
  const [location, setLocation] = useState<Location | null>(null);
  const [year, setYear] = useState(today.getFullYear());
  const [scrubIndex, setScrubIndex] = useState(0);
  const [twelveHour, setTwelveHour] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [picking, setPicking] = useState(true);

  const activeLocation = location ?? DEFAULT_LOCATION;
  const days = useSunData(activeLocation.lat, activeLocation.lng, activeLocation.tz, year);

  function handleSelect(loc: Location, yr: number) {
    setLocation(loc);
    setYear(yr);
    setPicking(false);
    if (yr === today.getFullYear()) {
      // Compute 0-based day-of-year for today directly (no dependency on stale days)
      const startOfYear = new Date(yr, 0, 1);
      const diffMs = today.getTime() - startOfYear.getTime();
      const dayOfYear = Math.floor(diffMs / 86400000);
      setScrubIndex(dayOfYear);
    } else {
      setScrubIndex(0);
    }
  }

  return (
    <>
      {picking && (
        <LocationPicker onSelect={handleSelect} currentYear={year} />
      )}

      {!picking && (
        <div className="app">
          <StatsHeader
            days={days}
            scrubIndex={scrubIndex}
            locationName={activeLocation.name}
            year={year}
            twelveHour={twelveHour}
            onToggleClock={() => setTwelveHour((v) => !v)}
            onToggleGrid={() => setShowGrid((v) => !v)}
            showGrid={showGrid}
            onChangeLocation={() => setPicking(true)}
          />
          <SunChart
            days={days}
            scrubIndex={scrubIndex}
            onScrub={setScrubIndex}
            showGrid={showGrid}
            twelveHour={twelveHour}
          />
        </div>
      )}
    </>
  );
}
