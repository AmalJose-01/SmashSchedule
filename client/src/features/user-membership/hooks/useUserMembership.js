import { useNavigate } from "react-router-dom";
import { useGetMyMemberships } from "../services/userMembership.queries.js";

export const useUserMembership = () => {
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = useGetMyMemberships();

  const memberships = data?.memberships || [];

  const handleAddMembership = () => {
    // Clear previous club selection so user picks a new club
    localStorage.removeItem("selectedClubId");
    localStorage.removeItem("clubAdminId");
    localStorage.removeItem("selectedClubName");
    navigate("/club-search");
  };

  const handleViewDetails = (member) => {
    localStorage.setItem("memberId", member._id);
    navigate("/user/profile");
  };

  const isExpired = (expiryDate) => expiryDate && new Date(expiryDate) < new Date();

  const isExpiringSoon = (expiryDate) => {
    if (!expiryDate) return false;
    const days = Math.ceil((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
    return days <= 30 && days > 0;
  };

  return {
    memberships,
    isLoading,
    error,
    refetch,
    handleAddMembership,
    handleViewDetails,
    isExpired,
    isExpiringSoon,
  };
};
