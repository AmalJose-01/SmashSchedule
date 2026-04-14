import { useState } from "react";
import { toast } from "sonner";
import {
  useGetMemberProfile,
  useGetMembershipHistory,
  useUpdateMemberProfile,
  useUploadVerificationDocument,
  useRenewMembership,
} from "../../services/memberRegistration.queries.js";

export const useMemberProfile = () => {
  const memberId = localStorage.getItem("memberId") || "";

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [documentFile, setDocumentFile] = useState(null);
  const [documentType, setDocumentType] = useState("STUDENT_ID");
  const [previewImage, setPreviewImage] = useState(null);

  const { data: profileData, isLoading: isLoadingProfile } = useGetMemberProfile(memberId);
  const { data: historyData, isLoading: isLoadingHistory } = useGetMembershipHistory(memberId);

  const { mutate: updateProfile, isPending: isUpdating } = useUpdateMemberProfile(memberId);
  const { mutate: uploadDocument, isPending: isUploading } = useUploadVerificationDocument(memberId);
  const { mutate: renewMembershipMutation, isPending: isRenewing } = useRenewMembership(memberId);

  const member = profileData?.member;
  const membership = profileData?.membership;
  const document = member?.verificationDocumentId;
  const history = historyData?.history || [];

  const handleEditStart = () => {
    setEditData({
      phoneNumber: member?.phoneNumber || "",
      address: {
        street: member?.address?.street || "",
        city: member?.address?.city || "",
        state: member?.address?.state || "",
        zipCode: member?.address?.zipCode || "",
        country: member?.address?.country || "",
      },
    });
    setIsEditing(true);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setEditData({});
  };

  const handleInputChange = (e) => {
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

  const handleSaveProfile = () => {
    updateProfile(editData, {
      onSuccess: () => {
        setIsEditing(false);
      },
    });
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    const validTypes = ["application/pdf", "image/jpeg", "image/png"];
    if (!validTypes.includes(file.type)) {
      toast.error("Only PDF, JPG, PNG files are allowed");
      return;
    }

    setDocumentFile(file);

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => setPreviewImage(ev.target.result);
      reader.readAsDataURL(file);
    } else {
      setPreviewImage(null);
    }
  };

  const handleDocumentUpload = () => {
    if (!documentFile) {
      toast.error("Please select a document");
      return;
    }
    uploadDocument(
      { file: documentFile, documentType },
      {
        onSuccess: () => {
          setDocumentFile(null);
          setPreviewImage(null);
        },
      }
    );
  };

  const handleRenewMembership = () => {
    renewMembershipMutation();
  };

  return {
    memberId,
    member,
    membership,
    document,
    history,
    isLoadingProfile,
    isLoadingHistory,
    isEditing,
    editData,
    documentFile,
    documentType,
    setDocumentType,
    previewImage,
    isUpdating,
    isUploading,
    isRenewing,
    handleEditStart,
    handleEditCancel,
    handleInputChange,
    handleSaveProfile,
    handleFileSelect,
    handleDocumentUpload,
    handleRenewMembership,
  };
};
