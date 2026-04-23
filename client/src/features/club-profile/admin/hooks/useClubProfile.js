import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  useGetMyClubProfile,
  useUpsertClubProfile,
  useUploadClubLogo,
} from "../services/clubProfile.queries.js";

const EMPTY_FORM = {
  name: "",
  registrationNumber: "",
  phoneNumber: "",
  email: "",
  location: { address: "", city: "", state: "", zipCode: "", country: "" },
};

export const useClubProfile = () => {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [isEditing, setIsEditing] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  const { data, isLoading } = useGetMyClubProfile();
  const { mutate: saveProfile, isPending: isSaving } = useUpsertClubProfile();
  const { mutate: uploadLogo, isPending: isUploadingLogo } = useUploadClubLogo();

  const club = data?.club;
  const isProfileComplete = data?.isProfileComplete || club?.isProfileComplete || false;

  // Pre-fill form when data loads — also auto-fill email from admin account
  useEffect(() => {
    if (club) {
      setFormData({
        name: club.name || "",
        registrationNumber: club.registrationNumber || "",
        phoneNumber: club.phoneNumber || "",
        email: club.email || data?.email || "",
        location: {
          address: club.location?.address || "",
          city: club.location?.city || "",
          state: club.location?.state || "",
          zipCode: club.location?.zipCode || "",
          country: club.location?.country || "",
        },
      });
    } else if (data?.email) {
      // No club yet — pre-fill email from admin account
      setFormData((prev) => ({ ...prev, email: data.email }));
    }
  }, [data, club]);

  // If no club exists yet, open edit mode automatically
  useEffect(() => {
    if (!isLoading && !club) setIsEditing(true);
  }, [isLoading, club]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("location_")) {
      const field = name.replace("location_", "");
      setFormData((prev) => ({
        ...prev,
        location: { ...prev.location, [field]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleAddressSelect = (addressData) => {
    // Auto-fill form fields from Google Places address data
    setFormData((prev) => ({
      ...prev,
      location: {
        ...prev.location,
        address: addressData.fullStreet || addressData.address || "",
        city: addressData.city || "",
        state: addressData.state || "",
        zipCode: addressData.zipCode || "",
        country: addressData.country || "Australia",
      },
    }));
    toast.success("Address selected! Complete other fields and save.");
  };

  const handleLogoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Logo must be under 2MB");
      return;
    }
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      toast.error("Only JPG, PNG, WEBP allowed");
      return;
    }

    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setLogoPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!formData.name || !formData.phoneNumber || !formData.location.city) {
      toast.error("Club name, phone number, and city are required");
      return;
    }

    // Use browser geolocation if available and no coordinates yet
    const save = (location = formData.location) => {
      saveProfile({ ...formData, location }, {
        onSuccess: () => {
          setIsEditing(false);
          if (logoFile) {
            uploadLogo(logoFile, { onSuccess: () => setLogoFile(null) });
          }
        },
      });
    };

    if (!club?.location?.coordinates?.coordinates?.[0] && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          save({
            ...formData.location,
            coordinates: {
              type: "Point",
              coordinates: [pos.coords.longitude, pos.coords.latitude],
            },
          });
        },
        () => save() // if denied, save without coordinates
      );
    } else {
      save();
    }
  };

  const handleEditStart = () => setIsEditing(true);
  const handleEditCancel = () => {
    setIsEditing(false);
    setLogoFile(null);
    setLogoPreview(null);
  };

  return {
    club,
    formData,
    isLoading,
    isEditing,
    isSaving,
    isUploadingLogo,
    isProfileComplete,
    logoPreview,
    logoFile,
    handleInputChange,
    handleAddressSelect,
    handleLogoSelect,
    handleSave,
    handleEditStart,
    handleEditCancel,
  };
};
