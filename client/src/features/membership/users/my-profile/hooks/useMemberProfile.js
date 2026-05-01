import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useGetMemberProfile,
  useGetMembershipHistory,
  useUpdateMemberProfile,
  useUploadVerificationDocument,
  useRenewMembership,
} from "../../services/memberRegistration.queries.js";
import { useGetMyMemberships, useCancelMembership } from "../../../../user-membership/services/userMembership.queries.js";

export const useMemberProfile = () => {
  const navigate = useNavigate();

  const [selectedMemberId, setSelectedMemberId] = useState(
    () => localStorage.getItem("memberId") || ""
  );
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ phoneNumber: "", address: {} });
  const [documentFile, setDocumentFile] = useState(null);
  const [documentType, setDocumentType] = useState("STUDENT_ID");
  const [previewImage, setPreviewImage] = useState(null);
  const [showUploadSection, setShowUploadSection] = useState(false);
  const [confirmCancelId, setConfirmCancelId] = useState(null);

  // All memberships list
  const { data: membershipsData, isLoading: isLoadingMemberships } = useGetMyMemberships();
  const memberships = membershipsData?.memberships || [];

  // Selected membership detail
  const { data: profileData, isLoading: isLoadingProfile } = useGetMemberProfile(selectedMemberId);
  const { data: historyData } = useGetMembershipHistory(selectedMemberId);

  const { mutate: updateProfile, isPending: isUpdating } = useUpdateMemberProfile(selectedMemberId);
  const { mutate: uploadDocument, isPending: isUploading } = useUploadVerificationDocument(selectedMemberId);
  const { mutate: renewMembership, isPending: isRenewing } = useRenewMembership(selectedMemberId);
  const { mutate: cancelMembership, isPending: isCancelling } = useCancelMembership();

  const member = profileData?.member;
  const membership = profileData?.membership;
  const history = historyData?.history || [];

  const handleSelectMembership = (memberId) => {
    localStorage.setItem("memberId", memberId);
    setSelectedMemberId(memberId);
    setIsEditing(false);
    setShowUploadSection(false);
  };

  const handleEditStart = () => {
    setEditData({
      phoneNumber: member?.phoneNumber || "",
      dateOfBirth: member?.dateOfBirth
        ? new Date(member.dateOfBirth).toISOString().split("T")[0]
        : "",
      address: { ...(member?.address || {}) },
    });
    setIsEditing(true);
  };

  const handleEditCancel = () => setIsEditing(false);

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("address_")) {
      const field = name.replace("address_", "");
      setEditData((prev) => ({ ...prev, address: { ...prev.address, [field]: value } }));
    } else {
      setEditData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleEditSave = () => {
    updateProfile(editData, { onSuccess: () => setIsEditing(false) });
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      import("sonner").then(({ toast }) => toast.error("File size must be less than 5MB"));
      return;
    }
    const validTypes = ["application/pdf", "image/jpeg", "image/png"];
    if (!validTypes.includes(file.type)) {
      import("sonner").then(({ toast }) => toast.error("Only PDF, JPG, PNG files are allowed"));
      return;
    }
    setDocumentFile(file);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setPreviewImage(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleDocumentUpload = () => {
    if (!documentFile) {
      import("sonner").then(({ toast }) => toast.error("Please select a document"));
      return;
    }
    uploadDocument(
      { file: documentFile, documentType },
      {
        onSuccess: () => {
          setDocumentFile(null);
          setPreviewImage(null);
          setShowUploadSection(false);
        },
      }
    );
  };

  const handleRenew = () => renewMembership();

  const handleRemoveRequest = (memberId) => setConfirmCancelId(memberId);

  const handleRemoveConfirm = () => {
    if (!confirmCancelId) return;
    cancelMembership(confirmCancelId, {
      onSuccess: () => {
        if (confirmCancelId === selectedMemberId) {
          const remaining = memberships.find(
            (m) => m._id !== confirmCancelId && m.membershipStatus !== "CANCELLED"
          );
          if (remaining) {
            handleSelectMembership(remaining._id);
          } else {
            setSelectedMemberId("");
            localStorage.removeItem("memberId");
          }
        }
      },
      onSettled: () => setConfirmCancelId(null),
    });
  };

  const handleRemoveCancel = () => setConfirmCancelId(null);

  const isExpiringSoon = () => {
    if (!member?.membershipExpiryDate) return false;
    const daysLeft = Math.ceil(
      (new Date(member.membershipExpiryDate) - new Date()) / (1000 * 60 * 60 * 24)
    );
    return daysLeft <= 30 && daysLeft > 0;
  };

  const isExpired = () => {
    if (!member?.membershipExpiryDate) return false;
    return new Date(member.membershipExpiryDate) < new Date();
  };

  return {
    memberships,
    isLoadingMemberships,
    selectedMemberId,
    member,
    membership,
    history,
    isLoadingProfile,
    isEditing,
    editData,
    documentFile,
    documentType,
    setDocumentType,
    previewImage,
    showUploadSection,
    setShowUploadSection,
    isUpdating,
    isUploading,
    isRenewing,
    isCancelling,
    confirmCancelId,
    handleSelectMembership,
    handleEditStart,
    handleEditCancel,
    handleEditChange,
    handleEditSave,
    handleFileSelect,
    handleDocumentUpload,
    handleRenew,
    handleRemoveRequest,
    handleRemoveConfirm,
    handleRemoveCancel,
    isExpiringSoon,
    isExpired,
    navigate,
  };
};
