import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useGetMembershipTypes, useRegisterMember, useUploadVerificationDocument } from "../services/memberRegistration.queries.js";

export const useMemberRegistration = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const getStoredUserId = () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      return user._id || "";
    } catch {
      return "";
    }
  };

  const [formData, setFormData] = useState({
    userId: getStoredUserId(),
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    dateOfBirth: "",
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
    },
    membershipType: "",
  });
  const [documentFile, setDocumentFile] = useState(null);
  const [documentType, setDocumentType] = useState("STUDENT_ID");
  const [previewImage, setPreviewImage] = useState(null);

  // Fetch membership types using the new query hook
  const { data: typesData } = useGetMembershipTypes();

  const membershipTypes = typesData?.types || [];
  const selectedType = membershipTypes.find((t) => t.name === formData.membershipType);

  // Auto-select first type once types load
  useEffect(() => {
    if (membershipTypes.length > 0 && !formData.membershipType) {
      setFormData((prev) => ({ ...prev, membershipType: membershipTypes[0].name }));
    }
  }, [membershipTypes]);

  // Register mutation using the new query hook
  const { mutate: registerMember, isPending: isRegistering } = useRegisterMember();

  // Handle registration response and navigate
  const handleRegistrationSuccess = (data) => {
    localStorage.setItem("memberId", data.member._id);
    if (data.member.clubId) {
      localStorage.setItem("selectedClubId", data.member.clubId.toString());
    }
    if (data.alreadyExists) {
      navigate("/user/memberships");
      return;
    }
    if (selectedType?.requiresDocumentVerification) {
      setStep(3);
    } else {
      navigate("/user/memberships");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("address_")) {
      const field = name.replace("address_", "");
      setFormData({
        ...formData,
        address: {
          ...formData.address,
          [field]: value,
        },
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }

      // Validate file type
      const validTypes = ["application/pdf", "image/jpeg", "image/png"];
      if (!validTypes.includes(file.type)) {
        toast.error("Only PDF, JPG, PNG files are allowed");
        return;
      }

      setDocumentFile(file);

      // Show preview for images
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => setPreviewImage(e.target.result);
        reader.readAsDataURL(file);
      }
    }
  };


  // Upload document mutation — always call unconditionally (Rules of Hooks)
  const memberId = localStorage.getItem("memberId") || "";
  const { mutate: uploadDocument, isPending: isUploading } = useUploadVerificationDocument(memberId);

  const handleDocumentUpload = () => {
    if (!documentFile) {
      toast.error("Please select a document");
      return;
    }

    if (!memberId) {
      toast.error("Member ID not found. Please register first.");
      return;
    }

    uploadDocument(
      { file: documentFile, documentType },
      {
        onSuccess: () => {
          navigate("/user/memberships");
        },
      }
    );
  };

  const handleStep1Next = (e) => {
    e.preventDefault();

    if (!formData.firstName || !formData.lastName) {
      toast.error("Please enter your first and last name");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      toast.error("Please enter your email address");
      return false;
    }
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return false;
    }

    const phoneRegex = /^\+?[\d\s\-()]{7,15}$/;
    if (!formData.phoneNumber) {
      toast.error("Please enter your phone number");
      return false;
    }
    if (!phoneRegex.test(formData.phoneNumber)) {
      toast.error("Please enter a valid phone number (7–15 digits)");
      return false;
    }

    if (!formData.dateOfBirth) {
      toast.error("Please enter your date of birth");
      return false;
    }

    setStep(2);
    return true;
  };

  const handleRegister = (e) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phoneNumber) {
      toast.error("Please fill in all required fields: First Name, Last Name, Email, and Phone Number");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    const phoneRegex = /^\+?[\d\s\-()]{7,15}$/;
    if (!phoneRegex.test(formData.phoneNumber)) {
      toast.error("Please enter a valid phone number (7–15 digits)");
      return;
    }

    // Membership type is mandatory
    if (!formData.membershipType) {
      toast.error("Please select a membership type");
      return;
    }

    // Ensure userId is present
    const userId = getStoredUserId();
    if (!userId) {
      toast.error("User ID not found. Please log in again.");
      return;
    }

    // Validate dateOfBirth
    if (!formData.dateOfBirth) {
      toast.error("Please enter your date of birth");
      return;
    }

    // Prepare data with proper types
    const dataToSend = {
      ...formData,
      userId: userId,
      clubId: localStorage.getItem("selectedClubId") || undefined,
    };

    console.log("Submitting registration with data:", dataToSend);
    
    registerMember(dataToSend, {
      onSuccess: (data) => {
        handleRegistrationSuccess(data);
      },
    });
  };

  return {
    // State
    step,
    setStep,
    formData,
    setFormData,
    documentFile,
    documentType,
    setDocumentType,
    previewImage,
    membershipTypes,
    selectedType,
    isRegistering,
    isUploading,
    
    // Handlers
    handleInputChange,
    handleFileSelect,
    handleDocumentUpload,
    handleStep1Next,
    handleRegister,
  };
};
