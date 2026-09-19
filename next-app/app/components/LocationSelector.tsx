"use client";

import { useMemo, useState, useEffect } from "react";
import { ALL_INDIAN_STATES, getCitiesForState } from "@/lib/location-data";

interface LocationSelectorProps {
  stateValue: string;
  cityValue: string;
  onChange: (values: { state: string; city: string }) => void;
  disabled?: boolean;
  stateLabel?: string;
  cityLabel?: string;
  required?: boolean;
}

export default function LocationSelector({
  stateValue,
  cityValue,
  onChange,
  disabled = false,
  stateLabel = "State *",
  cityLabel = "City *",
  required = true,
}: LocationSelectorProps) {
  const isKnownState = useMemo(() => {
    return ALL_INDIAN_STATES.some((s) => s.toLowerCase() === (stateValue || "").toLowerCase());
  }, [stateValue]);

  const [isCustomState, setIsCustomState] = useState(!isKnownState && !!stateValue);
  const [selectedState, setSelectedState] = useState(isKnownState ? stateValue : isCustomState ? "OTHER" : "");

  const availableCities = useMemo(() => {
    if (!isKnownState || isCustomState) return [];
    return getCitiesForState(selectedState);
  }, [selectedState, isKnownState, isCustomState]);

  const isKnownCity = useMemo(() => {
    return availableCities.some((c) => c.toLowerCase() === (cityValue || "").toLowerCase());
  }, [availableCities, cityValue]);

  const [isCustomCity, setIsCustomCity] = useState(
    (!isKnownCity && !!cityValue) || availableCities.length === 0
  );
  const [selectedCity, setSelectedCity] = useState(
    isKnownCity ? cityValue : isCustomCity && cityValue ? "OTHER" : ""
  );

  useEffect(() => {
    if (isKnownState && !isCustomState) {
      setSelectedState(stateValue);
    }
  }, [stateValue, isKnownState, isCustomState]);

  useEffect(() => {
    if (isKnownCity && !isCustomCity) {
      setSelectedCity(cityValue);
    }
  }, [cityValue, isKnownCity, isCustomCity]);

  const handleStateSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === "OTHER") {
      setIsCustomState(true);
      setSelectedState("OTHER");
      setIsCustomCity(true);
      setSelectedCity("OTHER");
      onChange({ state: "", city: cityValue });
    } else {
      setIsCustomState(false);
      setSelectedState(val);
      const cities = getCitiesForState(val);
      const cityStillValid = cities.some((c) => c.toLowerCase() === cityValue.toLowerCase());
      if (cityStillValid) {
        setIsCustomCity(false);
        setSelectedCity(cityValue);
        onChange({ state: val, city: cityValue });
      } else {
        setIsCustomCity(false);
        setSelectedCity("");
        onChange({ state: val, city: "" });
      }
    }
  };

  const handleCustomStateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ state: e.target.value, city: cityValue });
  };

  const handleCitySelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === "OTHER") {
      setIsCustomCity(true);
      setSelectedCity("OTHER");
      onChange({ state: stateValue, city: "" });
    } else {
      setIsCustomCity(false);
      setSelectedCity(val);
      onChange({ state: stateValue, city: val });
    }
  };

  const handleCustomCityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ state: stateValue, city: e.target.value });
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
      {/* State Selector */}
      <div>
        <label style={{ fontSize: 11, fontWeight: 600, display: "block", marginBottom: 4, color: "var(--ink, #1f1b24)" }}>
          {stateLabel}
        </label>
        {!isCustomState ? (
          <select
            value={selectedState}
            onChange={handleStateSelectChange}
            disabled={disabled}
            required={required}
            style={{
              width: "100%",
              padding: "10px 12px",
              border: "1px solid var(--line, #e6e4ea)",
              borderRadius: 4,
              fontSize: 13,
              background: "#fff",
              color: selectedState ? "inherit" : "var(--muted, #666)",
            }}
          >
            <option value="">Select State / UT</option>
            {ALL_INDIAN_STATES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
            <option value="OTHER">Other / Enter manually…</option>
          </select>
        ) : (
          <div style={{ display: "flex", gap: 6 }}>
            <input
              placeholder="Enter State"
              value={stateValue}
              onChange={handleCustomStateChange}
              disabled={disabled}
              required={required}
              style={{
                flex: 1,
                padding: "10px 12px",
                border: "1px solid var(--line, #e6e4ea)",
                borderRadius: 4,
                fontSize: 13,
              }}
            />
            <button
              type="button"
              onClick={() => {
                setIsCustomState(false);
                setSelectedState("");
                onChange({ state: "", city: cityValue });
              }}
              style={{
                padding: "0 10px",
                fontSize: 11,
                border: "1px solid var(--line, #ccc)",
                background: "#f8f8f8",
                borderRadius: 4,
                cursor: "pointer",
              }}
              title="Return to list"
            >
              List
            </button>
          </div>
        )}
      </div>

      {/* City Selector */}
      <div>
        <label style={{ fontSize: 11, fontWeight: 600, display: "block", marginBottom: 4, color: "var(--ink, #1f1b24)" }}>
          {cityLabel}
        </label>
        {!isCustomCity && availableCities.length > 0 ? (
          <select
            value={selectedCity}
            onChange={handleCitySelectChange}
            disabled={disabled || !selectedState}
            required={required}
            style={{
              width: "100%",
              padding: "10px 12px",
              border: "1px solid var(--line, #e6e4ea)",
              borderRadius: 4,
              fontSize: 13,
              background: "#fff",
              color: selectedCity ? "inherit" : "var(--muted, #666)",
            }}
          >
            <option value="">Select City</option>
            {availableCities.map((ct) => (
              <option key={ct} value={ct}>
                {ct}
              </option>
            ))}
            <option value="OTHER">Other / Enter manually…</option>
          </select>
        ) : (
          <div style={{ display: "flex", gap: 6 }}>
            <input
              placeholder="Enter City"
              value={cityValue}
              onChange={handleCustomCityChange}
              disabled={disabled}
              required={required}
              style={{
                flex: 1,
                padding: "10px 12px",
                border: "1px solid var(--line, #e6e4ea)",
                borderRadius: 4,
                fontSize: 13,
              }}
            />
            {availableCities.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setIsCustomCity(false);
                  setSelectedCity("");
                  onChange({ state: stateValue, city: "" });
                }}
                style={{
                  padding: "0 10px",
                  fontSize: 11,
                  border: "1px solid var(--line, #ccc)",
                  background: "#f8f8f8",
                  borderRadius: 4,
                  cursor: "pointer",
                }}
                title="Return to list"
              >
                List
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
