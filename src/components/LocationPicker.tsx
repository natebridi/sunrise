import { useState } from "react";
import LOCATIONS, { type Location } from "../lib/locations";

interface Props {
  onSelect: (loc: Location, year: number) => void;
  currentYear: number;
}

export default function LocationPicker({ onSelect, currentYear }: Props) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [year, setYear] = useState(currentYear);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSelect(LOCATIONS[selectedIndex], year);
  }

  return (
    <div className="picker-overlay">
      <div className="picker-box">
        <h1>Sunrise &amp; Sunset</h1>
        <form onSubmit={handleSubmit}>
          <div className="picker-row">
            <label htmlFor="location-select">Location</label>
            <select
              id="location-select"
              value={selectedIndex}
              onChange={(e) => setSelectedIndex(Number(e.target.value))}
            >
              {LOCATIONS.map((loc, i) => (
                <option key={loc.name} value={i}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>

          <div className="picker-row">
            <label>Year</label>
            <div className="year-stepper">
              <button
                type="button"
                onClick={() => setYear((y) => Math.max(1, y - 1))}
              >
                −
              </button>
              <span className="year-display">{year}</span>
              <button
                type="button"
                onClick={() => setYear((y) => Math.min(3000, y + 1))}
              >
                +
              </button>
            </div>
          </div>

          <button type="submit" className="go-btn">
            Go
          </button>
        </form>
      </div>
    </div>
  );
}
