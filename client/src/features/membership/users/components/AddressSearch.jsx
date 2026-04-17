import { useState, useRef, useEffect } from "react";
import "./AddressSearch.css";

const AddressSearch = ({ onAddressSelect, value = "" }) => {
  const [input, setInput] = useState(value || "");
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const autocompleteService = useRef(null);
  const placesService = useRef(null);
  const scriptLoadedRef = useRef(false);

  // Load Google Maps API Script Dynamically
  useEffect(() => {
    const loadGoogleMapsScript = async () => {
      // Check if script is already loading or loaded
      if (scriptLoadedRef.current) {
        return;
      }

      // Check if Google Maps API is already available
      if (window.google && window.google.maps) {
        scriptLoadedRef.current = true;
        initializeGooglePlaces();
        return;
      }

      // Get API key from environment
      const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;

      if (!apiKey) {
        console.warn(
          "Google Maps API key not found. Please set VITE_GOOGLE_API_KEY in .env.local"
        );
        return;
      }

      // Create and load script
      return new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
        script.async = true;
        script.defer = true;

        script.onload = () => {
          scriptLoadedRef.current = true;
          // Give a moment for Google Maps to be fully available
          setTimeout(() => {
            initializeGooglePlaces();
            resolve();
          }, 100);
        };

        script.onerror = () => {
          console.error("Failed to load Google Maps API script");
          resolve();
        };

        document.head.appendChild(script);
      });
    };

    loadGoogleMapsScript();
  }, []);

  // Initialize Google Places Services
  const initializeGooglePlaces = () => {
    if (window.google && window.google.maps && window.google.maps.places) {
      autocompleteService.current =
        new window.google.maps.places.AutocompleteService();
      placesService.current = new window.google.maps.places.PlacesService(
        document.createElement("div")
      );
    }
  };

  // Fetch suggestions
  const fetchSuggestions = async (inputValue) => {
    if (!inputValue || inputValue.length < 3 || !autocompleteService.current) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const predictions = await new Promise((resolve, reject) => {
        autocompleteService.current.getPlacePredictions(
          {
            input: inputValue,
            types: ["geocode"],
            componentRestrictions: { country: ["au"] }, // Australia only
          },
          (predictions) => {
            if (predictions) {
              resolve(predictions);
            } else {
              reject(new Error("No predictions found"));
            }
          }
        );
      });
      setSuggestions(predictions || []);
    } catch (error) {
      console.error("Autocomplete error:", error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle input change
  const handleInputChange = (e) => {
    const value = e.target.value;
    setInput(value);
    fetchSuggestions(value);
    setIsOpen(true);
  };

  // Parse address components from place details
  const parseAddressComponents = (result) => {
    const address = {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
    };

    if (result.address_components) {
      result.address_components.forEach((component) => {
        const types = component.types;

        if (types.includes("street_number")) {
          address.street = component.long_name + " " + address.street;
        }
        if (types.includes("route")) {
          address.street += component.long_name;
        }
        if (types.includes("locality")) {
          address.city = component.long_name;
        }
        if (types.includes("administrative_area_level_1")) {
          address.state = component.short_name;
        }
        if (types.includes("postal_code")) {
          address.zipCode = component.long_name;
        }
        if (types.includes("country")) {
          address.country = component.long_name;
        }
      });
    }

    return address;
  };

  // Handle suggestion click
  const handleSuggestionClick = (placeId, description) => {
    setInput(description);
    setIsOpen(false);
    setSuggestions([]);

    if (placesService.current) {
      placesService.current.getDetails(
        { placeId, fields: ["address_components", "formatted_address"] },
        (place, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK) {
            const parsedAddress = parseAddressComponents(place);
            onAddressSelect({
              ...parsedAddress,
              fullAddress: description,
            });
          }
        }
      );
    }
  };

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target) &&
        inputRef.current &&
        !inputRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="address-search-wrapper">
      <label className="address-search-label">Street Address</label>
      <div className="address-search-input-group">
        <span className="address-search-icon">📍</span>
        <input
          ref={inputRef}
          type="text"
          className="address-search-input"
          placeholder="Start typing your address..."
          value={input}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          autoComplete="off"
        />
        {isLoading && <span className="address-search-loader">⟳</span>}
      </div>

      {isOpen && suggestions.length > 0 && (
        <div ref={suggestionsRef} className="address-suggestions">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="address-suggestion-item"
              onClick={() =>
                handleSuggestionClick(
                  suggestion.place_id,
                  suggestion.description
                )
              }
            >
              <span className="suggestion-icon">📍</span>
              <div className="suggestion-content">
                <div className="suggestion-main">
                  {suggestion.main_text}
                </div>
                <div className="suggestion-secondary">
                  {suggestion.secondary_text}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isOpen && input && suggestions.length === 0 && !isLoading && (
        <div className="address-no-results">
          No addresses found. Try a different search.
        </div>
      )}
    </div>
  );
};

export default AddressSearch;
