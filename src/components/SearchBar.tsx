import { useState } from "react";
import Select, { SingleValue } from "react-select";
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
  onClose: () => void;
};

export function SearchBar({
  onRouteFound,
  onClearRoute,
  currentLocation,
  onClose,
}: SearchBarProps) {
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

    // Validation
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
        // Use GPS to destination endpoint
        const response = await axios.post(
          `${Env.API_URL}/plan-journey`,
          {
            start_lat: currentLocation[0],
            start_lng: currentLocation[1],
            end_stop: endStop.value,
          }
        );
        routeData = response.data;
      } else if (startStop && endStop) {
        // Use stop to stop endpoint
        const response = await axios.get(
          `${Env.API_URL}/find-route`,
          {
            params: {
              start: startStop.value,
              end: endStop.value,
            },
          }
        );
        routeData = response.data;
      }

      if (routeData && routeData.success) {
        onRouteFound(routeData);
        onClose(); // Close modal after successful search
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
    onClearRoute(); // Clear the route from map
  };

  const handleSwapStops = () => {
    const temp = startStop;
    setStartStop(endStop);
    setEndStop(temp);
  };

  const customSelectStyles = {
    control: (provided: any, state: any) => ({
      ...provided,
      borderRadius: '14px',
      borderColor: state.isFocused ? '#4338ca' : '#e5e7eb',
      borderWidth: '2px',
      minHeight: '56px',
      boxShadow: state.isFocused ? '0 0 0 3px rgba(67, 56, 202, 0.1)' : 'none',
      transition: 'all 0.2s',
      fontSize: '1rem',
      cursor: 'pointer',
    }),
    option: (provided: any, state: any) => ({
      ...provided,
      textAlign: 'right',
      direction: 'rtl',
      backgroundColor: state.isSelected 
        ? '#4338ca' 
        : state.isFocused 
        ? '#eef2ff' 
        : 'white',
      color: state.isSelected ? 'white' : '#1f2937',
      padding: '14px 16px',
      cursor: 'pointer',
      fontWeight: state.isSelected ? '600' : '400',
      transition: 'all 0.15s',
      fontSize: '1rem',
      minHeight: '48px',
      display: 'flex',
      alignItems: 'center',
    }),
    singleValue: (provided: any) => ({
      ...provided,
      textAlign: 'right',
      direction: 'rtl',
      color: '#1f2937',
      fontWeight: '500',
      fontSize: '1rem',
    }),
    placeholder: (provided: any) => ({
      ...provided,
      textAlign: 'right',
      direction: 'rtl',
      color: '#9ca3af',
      fontSize: '1rem',
    }),
    menu: (provided: any) => ({
      ...provided,
      borderRadius: '14px',
      overflow: 'hidden',
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
      marginTop: '8px',
      border: '2px solid #e5e7eb',
    }),
    menuList: (provided: any) => ({
      ...provided,
      padding: '6px',
      maxHeight: '280px',
    }),
    input: (provided: any) => ({
      ...provided,
      textAlign: 'right',
      direction: 'rtl',
      margin: '0',
      padding: '0',
      fontSize: '1rem',
    }),
    dropdownIndicator: (provided: any, state: any) => ({
      ...provided,
      color: state.isFocused ? '#4338ca' : '#9ca3af',
      transition: 'all 0.2s',
      padding: '8px 12px',
    }),
    clearIndicator: (provided: any) => ({
      ...provided,
      color: '#9ca3af',
      transition: 'all 0.2s',
      padding: '8px 12px',
      cursor: 'pointer',
    }),
    indicatorSeparator: (provided: any) => ({
      ...provided,
      backgroundColor: '#e5e7eb',
      marginTop: '12px',
      marginBottom: '12px',
    }),
    valueContainer: (provided: any) => ({
      ...provided,
      padding: '8px 16px',
    }),
  };

  return (
    <div className="vstack" style={{ gap: "1.75rem" }}>
      {/* Header */}
      <div className="search-modal-header">
        <div className="hstack" style={{ gap: '0.75rem' }}>
          <div className="search-icon-container">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="24px"
              height="24px"
              fill="white"
            >
              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
          </div>
          <h2 style={{ margin: 0, fontSize: '1.5em', fontWeight: 600 }}>Find Your Route</h2>
        </div>
      </div>

      {/* Current Location Toggle */}
      {currentLocation && (
        <div className="location-toggle">
          <label className="hstack" style={{ cursor: "pointer", gap: '0.75rem' }}>
            <input
              type="checkbox"
              checked={useCurrentLocation}
              onChange={(e) => {
                setUseCurrentLocation(e.target.checked);
                if (e.target.checked) {
                  setStartStop(null);
                }
              }}
              className="custom-checkbox"
            />
            <div className="hstack" style={{ gap: '0.5rem' }}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="12" cy="12" r="8" stroke="#00C951" strokeWidth="2" fill="none"/>
                <circle cx="12" cy="12" r="3" fill="#00C951"/>
              </svg>
              <span style={{ fontSize: '0.95rem', fontWeight: 500 }}>Use my current location</span>
            </div>
          </label>
        </div>
      )}

      {/* Starting Point */}
      {!useCurrentLocation && (
        <div className="vstack w-full" style={{ gap: '0.6rem' }}>
          <div className="hstack" style={{ gap: '0.5rem' }}>
            <div className="location-icon-badge start-badge">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="12" cy="12" r="8" stroke="white" strokeWidth="2.5" />
                <circle cx="12" cy="12" r="3" fill="white" />
              </svg>
            </div>
            <span className="label-enhanced">Starting Point</span>
          </div>
          <Select
            options={stopOptions}
            value={startStop}
            onChange={(newValue) => setStartStop(newValue)}
            placeholder="Select where you are..."
            styles={customSelectStyles}
            isSearchable
            isClearable
            noOptionsMessage={() => "No stops found"}
          />
        </div>
      )}

      {/* Swap Button */}
      {!useCurrentLocation && startStop && endStop && (
        <div className="swap-button-container">
          <button
            className="swap-button"
            onClick={handleSwapStops}
            aria-label="Swap locations"
          >
            <svg
              width="20"
              height="20"
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
              <path
                d="M21 12H9"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M3 12H15"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      )}

      {/* Destination */}
      <div className="vstack w-full" style={{ gap: '0.6rem' }}>
        <div className="hstack" style={{ gap: '0.5rem' }}>
          <div className="location-icon-badge end-badge">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
                fill="white"
              />
              <circle cx="12" cy="9" r="2.5" fill="#ef4444" />
            </svg>
          </div>
          <span className="label-enhanced">Destination</span>
        </div>
        <Select
          options={stopOptions}
          value={endStop}
          onChange={(newValue) => setEndStop(newValue)}
          placeholder="Select where you're going..."
          styles={customSelectStyles}
          isSearchable
          isClearable
          noOptionsMessage={() => "No stops found"}
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-message-enhanced">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="12" cy="12" r="10" stroke="#ef4444" strokeWidth="2" />
            <path
              d="M12 8v4M12 16h.01"
              stroke="#ef4444"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="action-buttons">
        <button
          onClick={handleSearch}
          disabled={
            isSearching || (!useCurrentLocation && !startStop) || !endStop
          }
          className="primary-button"
        >
          {isSearching ? (
            <>
              <div className="spinner-small"></div>
              <span>Searching...</span>
            </>
          ) : (
            <>
              <svg
                width="20"
                height="20"
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
          className="secondary-button"
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
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <span>Clear</span>
        </button>
      </div>
    </div>
  );
}