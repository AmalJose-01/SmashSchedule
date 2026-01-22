
import { googleMapsApiKey } from "../../utils/config.js";
 import {useJsApiLoader} from '@react-google-maps/api';

const libraries = ["places"];

const GoogleMapsProvider = ({ children }) => {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: googleMapsApiKey,
    libraries,
  });

  if (!isLoaded) return null; // or loading spinner

  return children;
};

export default GoogleMapsProvider;
