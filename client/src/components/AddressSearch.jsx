import React, { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import "./AddressSearch.css";

const AddressSearch = ({ onAddressSelect, placeholder = "Search address..." }) => {
  const inputRef = useRef(null);
  const [autocomplete, setAutocomplete] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadGoogleMapsAPI = async () => {
      // Check if Google Maps is already loaded
      if (window.google?.maps?.places) {
        initAutocomplete();
        return;
      }

      // Load Google Maps API
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = false;

      script.onload = () => {
        // Wait for Google to be fully initialized
        if (window.google?.maps?.places) {
          initAutocomplete();
        } else {
          // Retry after a short delay
          setTimeout(() => {
            if (window.google?.maps?.places) {
              initAutocomplete();
            }
          }, 100);
        }
      };

      script.onerror = () => {
        console.error("Failed to load Google Maps API");
        setIsLoading(false);
      };

      document.head.appendChild(script);
    };

    loadGoogleMapsAPI();
  }, []);

  const initAutocomplete = () => {
    if (!inputRef.current || !window.google?.maps?.places) {
      return;
    }

    try {
      const autocompleteInstance = new window.google.maps.places.Autocomplete(
        inputRef.current,
        {
          types: ["geocode"],
          componentRestrictions: { country: "au" },
        }
      );

      autocompleteInstance.addListener("place_changed", () => {
        const place = autocompleteInstance.getPlace();

        if (!place.geometry) {
          console.log("Place not found");
          return;
        }

        // Extract address components
        const addressComponents = place.address_components || [];
        const addressData = {
          address: place.formatted_address,
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        };

        // Parse address components
        addressComponents.forEach((component) => {
          const types = component.types;

          if (types.includes("street_number")) {
            addressData.streetNumber = component.long_name;
          }
          if (types.includes("route")) {
            addressData.streetName = component.long_name;
          }
          if (types.includes("locality")) {
            addressData.city = component.long_name;
          }
          if (types.includes("administrative_area_level_1")) {
            addressData.state = component.short_name;
          }
          if (types.includes("postal_code")) {
            addressData.zipCode = component.long_name;
          }
          if (types.includes("country")) {
            addressData.country = component.long_name;
          }
        });

        // Build full street address
        if (addressData.streetNumber && addressData.streetName) {
          addressData.fullStreet = `${addressData.streetNumber} ${addressData.streetName}`;
        } else if (addressData.streetName) {
          addressData.fullStreet = addressData.streetName;
        }

        onAddressSelect(addressData);
      });

      setAutocomplete(autocompleteInstance);
      setIsLoading(false);
    } catch (error) {
      console.error("Error initializing autocomplete:", error);
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center w-full">
        {/* <MapPin className="absolute left-3 text-gray-400" size={20} /> */}
        
        <input
          ref={inputRef}
          type="text"
          placeholder={isLoading ? "Loading..." : placeholder}
          className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-md text-sm font-sans focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100 disabled:text-gray-500"
          disabled={isLoading}
        />
      </div>
    </div>
  );
};

export default AddressSearch;
