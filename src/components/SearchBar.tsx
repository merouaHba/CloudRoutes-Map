/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import Select from "react-select";
import { useStops } from "@cloudroutes/query/lines";
import { QUERY_KEYS } from "@cloudroutes/query";
import axios from "axios";
import { Env } from "../config/env";

type StopOption = {
  value: string;
  label: string;
  lat: number;
  lng: number;
};

type SearchBarProps = {
  onRouteFound: (routeData: any) => void;
  onClearRoute: () => void;
  currentLocation?: [number, number] | null;
};

export function SearchBar({
  onRouteFound,
  onClearRoute,
  currentLocation,
}: SearchBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [startStop, setStartStop] = useState<StopOption | null>(null);
  const [endStop, setEndStop] = useState<StopOption | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);

  const { data: stops } = useStops<StopOption[]>({
    queryKey: [QUERY_KEYS.STOPS],
    select: (data) => {
      return data.map((stop) => ({
        value: stop.name,
        label: stop.name,
        lat: parseFloat(stop.latitude),
        lng: parseFloat(stop.longitude),
      }));
    },
  });

  const stopOptions = stops || [];

  const handleSearch = async () => {
    setError(null);

    if (!useCurrentLocation && !startStop) {
      setError("Please select a starting point");
      return;
    }

    if (!endStop) {
      setError("Please select a destination");
      return;
    }

    setIsSearching(true);

    try {
      let routeData;

      if (useCurrentLocation && currentLocation) {
        const response = await axios.post(`${Env.API_URL}/plan-journey`, {
          start_lat: currentLocation[0],
          start_lng: currentLocation[1],
          end_stop: endStop.value,
        });
        routeData = response.data;
      } else if (startStop && endStop) {
        const response = await axios.get(`${Env.API_URL}/find-route`, {
          params: {
            start: startStop.value,
            end: endStop.value,
          },
        });
        routeData = response.data;
      }

      if (routeData && routeData.success) {
        onRouteFound(routeData);
        setIsExpanded(false);
      } else {
        setError(routeData?.message || "No route found");
      }
    } catch (err: any) {
      console.error("Search error:", err);
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to find route"
      );
    } finally {
      setIsSearching(false);
    }
  };

  const handleClear = () => {
    setStartStop(null);
    setEndStop(null);
    setUseCurrentLocation(false);
    setError(null);
    onClearRoute();
  };

  const handleSwapStops = () => {
    const temp = startStop;
    setStartStop(endStop);
    setEndStop(temp);
  };

  const customSelectStyles = {
    control: (provided: any, state: any) => ({
      ...provided,
      borderRadius: "12px",
      borderColor: state.isFocused ? "#4338ca" : "#e5e7eb",
      borderWidth: "2px",
      minHeight: "44px",
      boxShadow: state.isFocused ? "0 0 0 3px rgba(67, 56, 202, 0.1)" : "none",
      transition: "all 0.2s",
      fontSize: "14px",
      cursor: "pointer",
      background: "white",
    }),
    option: (provided: any, state: any) => ({
      ...provided,
      textAlign: "right",
      direction: "rtl",
      backgroundColor: state.isSelected
        ? "#4338ca"
        : state.isFocused
          ? "#eef2ff"
          : "white",
      color: state.isSelected ? "white" : "#1f2937",
      padding: "10px 12px",
      cursor: "pointer",
      fontWeight: state.isSelected ? "600" : "400",
      transition: "all 0.15s",
      fontSize: "13px",
    }),
    singleValue: (provided: any) => ({
      ...provided,
      textAlign: "right",
      direction: "rtl",
      color: "#1f2937",
      fontWeight: "500",
      fontSize: "13px",
    }),
    placeholder: (provided: any) => ({
      ...provided,
      textAlign: "right",
      direction: "rtl",
      color: "#9ca3af",
      fontSize: "13px",
    }),
    menu: (provided: any) => ({
      ...provided,
      borderRadius: "12px",
      overflow: "hidden",
      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.15)",
      marginTop: "6px",
      border: "2px solid #e5e7eb",
      zIndex: 10000,
    }),
    menuList: (provided: any) => ({
      ...provided,
      padding: "4px",
      maxHeight: "200px",
    }),
  };

  return (
    <div className={`search-bar-container ${isExpanded ? "expanded" : ""}`}>
      {/* Collapsed State - Search Button */}
      {!isExpanded && (
        <button
          className="search-bar-toggle"
          onClick={() => setIsExpanded(true)}
          aria-label="Open search"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"
              fill="white"
            />
          </svg>
          <span>Search Route</span>
        </button>
      )}

      {/* Expanded State - Search Form */}
      {isExpanded && (
        <div className="search-bar-content">
          <div className="search-bar-header">
            <h3 className="search-bar-title">Find Route</h3>
            <button
              className="search-bar-close"
              onClick={() => setIsExpanded(false)}
              aria-label="Close search"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M18 6L6 18M6 6l12 12"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>

          <div className="search-bar-body">
            {/* Current Location Toggle */}
            {currentLocation && (
              <div className="search-location-toggle">
                <label>
                  <input
                    type="checkbox"
                    checked={useCurrentLocation}
                    onChange={(e) => {
                      setUseCurrentLocation(e.target.checked);
                      if (e.target.checked) {
                        setStartStop(null);
                      }
                    }}
                  />
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="8"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      fill="none"
                    />
                    <circle cx="12" cy="12" r="3" fill="currentColor" />
                  </svg>
                  <span>Use current location</span>
                </label>
              </div>
            )}

            {/* From */}
            {!useCurrentLocation && (
              <div className="search-input-group">
                <label className="search-label">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="8"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    />
                    <circle cx="12" cy="12" r="3" fill="currentColor" />
                  </svg>
                  <span>From</span>
                </label>
                <Select
                  options={stopOptions}
                  value={startStop}
                  onChange={(newValue) => setStartStop(newValue)}
                  placeholder="Select start..."
                  styles={customSelectStyles}
                  isSearchable
                  isClearable
                  noOptionsMessage={() => "No stops found"}
                />
              </div>
            )}

            {/* Swap Button */}
            {!useCurrentLocation && startStop && endStop && (
              <div className="search-swap-container">
                <button
                  className="search-swap-btn"
                  onClick={handleSwapStops}
                  aria-label="Swap locations"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M16 17L21 12L16 7"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M8 7L3 12L8 17"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            )}

            {/* To */}
            <div className="search-input-group">
              <label className="search-label">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
                    fill="currentColor"
                  />
                </svg>
                <span>To</span>
              </label>
              <Select
                options={stopOptions}
                value={endStop}
                onChange={(newValue) => setEndStop(newValue)}
                placeholder="Select destination..."
                styles={customSelectStyles}
                isSearchable
                isClearable
                noOptionsMessage={() => "No stops found"}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="search-error">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <path
                    d="M12 8v4M12 16h.01"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="search-actions">
              <button
                onClick={handleSearch}
                disabled={
                  isSearching || (!useCurrentLocation && !startStop) || !endStop
                }
                className="search-btn-primary"
              >
                {isSearching ? (
                  <>
                    <div className="spinner-small"></div>
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <circle
                        cx="12"
                        cy="10"
                        r="3"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                    </svg>
                    <span>Find Route</span>
                  </>
                )}
              </button>
              <button
                onClick={handleClear}
                disabled={isSearching}
                className="search-btn-secondary"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M18 6L6 18M6 6l12 12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
