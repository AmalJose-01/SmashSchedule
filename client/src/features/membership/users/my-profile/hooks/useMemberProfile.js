import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useGetMemberProfile,
  useGetMembershipHistory,
  useUpdateMemberProfile,
  useUploadVerificationDocument,
  useRenewMembership,
} from "../../services/memberRegistration.queries.js";

export const useMemberProfile = () => {
  const navigate = useNavigate();
  const memberId = localStorage.getItem("memberId") || "";

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ phoneNumber: "", address: {} });
  const [documentFile, setDocumentFile] = useState(null);
  const [documentType, setDocumentType] = useState("STUDENT_ID");
  const [previewImage, setPreviewImage] = useState(null);
  const [showUploadSection, setShowUploadSection] = useState(false);

  const { data: profileData, isLoading: isLoadingProfile } = useGetMemberProfile(memberId);
  const { data: historyData, isLoading: isLoadingHistory } = useGetMembershipHistory(memberId);

  const { mutate: updateProfile, isPending: isUpdating } = useUpdateMemberProfile(memberId);
  const { mutate: uploadDocument, isPending: isUploading } = useUploadVerificationDocument(memberId);
  const { mutate: renewMembership, isPending: isRenewing } = useRenewMembership(memberId);

  const member = profileData?.member;
  const membership = profileData?.membership;
  const history = historyData?.history || [];

  const handleEditStart = () => {
    setEditData({
      phoneNumber: member?.phoneNumber || "",
      address: { ...(member?.address || {}) },
    });
    setIsEditing(true);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("address_")) {
      const field = name.replace("address_", "");
      setEditData((prev) => ({
        ...prev,
        address: { ...prev.address, [field]: value },
      }));
    } else {
      setEditData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleEditSave = () => {
    updateProfile(editData, {
      onSuccess: () => setIsEditing(false),
    });
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

  const handleRenew = () => {
    renewMembership();
  };

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
    memberId,
    member,
    membership,
    history,
    isLoadingProfile,
    isLoadingHistory,
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
    handleEditStart,
    handleEditCancel,
    handleEditChange,
    handleEditSave,
    handleFileSelect,
    handleDocumentUpload,
    handleRenew,
    isExpiringSoon,
    isExpired,
    navigate,
  };
};
