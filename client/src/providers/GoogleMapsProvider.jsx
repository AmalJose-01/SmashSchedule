import { useJsApiLoader } from "@react-google-maps/api";

const libraries = ["places"];

const GoogleMapsProvider = ({ children }) => {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_KEY,
    libraries,
  });

  if (!isLoaded) return null; // or loading spinner

  return children;
};

export default GoogleMapsProvider;
