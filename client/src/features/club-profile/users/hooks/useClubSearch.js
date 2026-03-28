import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useSearchClubs } from "../services/clubSearch.queries.js";

export const useClubSearch = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");
  const [userLocation, setUserLocation] = useState(null); // { lat, lng }
  const [isLocating, setIsLocating] = useState(false);
  const debounceRef = useRef(null);

  // Debounce search input
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedTerm(searchTerm), 400);
    return () => clearTimeout(debounceRef.current);
  }, [searchTerm]);

  const queryParams = {
    ...(debouncedTerm && { q: debouncedTerm }),
    ...(userLocation && { lat: userLocation.lat, lng: userLocation.lng }),
  };

  const { data, isLoading } = useSearchClubs(queryParams);
  const clubs = data?.clubs || [];

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setIsLocating(false);
        toast.success("Showing clubs near your location");
      },
      () => {
        toast.error("Could not get your location. Please search by name.");
        setIsLocating(false);
      }
    );
  };

  const handleClearLocation = () => setUserLocation(null);

  const handleSelectClub = (club) => {
    // Store selected club so membership registration knows which club and admin
    localStorage.setItem("selectedClubId", club._id);
    localStorage.setItem("clubAdminId", club.adminId);
    localStorage.setItem("selectedClubName", club.name);
    navigate("/membership");
  };

  return {
    searchTerm,
    setSearchTerm,
    clubs,
    isLoading,
    isLocating,
    userLocation,
    handleLocateMe,
    handleClearLocation,
    handleSelectClub,
  };
};
