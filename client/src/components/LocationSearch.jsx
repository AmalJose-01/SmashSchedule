import { Autocomplete } from "@react-google-maps/api";
import { useRef } from "react";

const LocationSearch = ({ onSelect, value }) => {
  const autoRef = useRef(null);

  const onLoad = (autocomplete) => {
    autoRef.current = autocomplete;
  };

  const onPlaceChanged = () => {
    const place = autoRef.current.getPlace();

    if (!place.geometry) return;

    const result = {
      name: place.name,
      address: place.formatted_address,
      lat: place.geometry.location.lat(),
      lng: place.geometry.location.lng(),
      placeId: place.place_id,
    };

    console.log("Selected Place:", result);
    onSelect(result);
  };

  return (
    <Autocomplete
      onLoad={onLoad}
      onPlaceChanged={onPlaceChanged}
      options={{
        types: ["establishment", "geocode"],
        componentRestrictions: { country: "au" },
        fields: [
          "name",
          "formatted_address",
          "geometry",
          "place_id",
        ],
      }}
    >
      <input
        defaultValue={value}
        type="text"
        placeholder="Search business or address"
        className="w-full pl-10 px-4 py-3 border rounded-xl"
        
      />
    </Autocomplete>
  );
};

export default LocationSearch;
