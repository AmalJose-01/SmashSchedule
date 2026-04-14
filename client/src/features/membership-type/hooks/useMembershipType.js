import { useState, useEffect } from "react";
import {
  useGetAllMembershipTypes,
  useCreateMembershipType,
  useUpdateMembershipType,
  useDeleteMembershipType,
} from "../services/membershipType.queries.js";

const EMPTY_FORM = {
  name: "STANDARD",
  displayName: "",
  description: "",
  price: "",
  discountPercentage: 0,
  validityMonths: 12,
  requiresDocumentVerification: false,
  requiredDocumentType: [],
  isActive: true,
};

export const useMembershipType = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingType, setEditingType] = useState(null); // null = create mode
  const [formData, setFormData] = useState(EMPTY_FORM);

  const { data, isLoading } = useGetAllMembershipTypes();

  // Persist this admin's ID so user registration fetches the correct club's types
  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      if (user._id) localStorage.setItem("clubAdminId", user._id);
    } catch {
      // ignore parse errors
    }
  }, []);

  const { mutate: createType, isPending: isCreating } = useCreateMembershipType();
  const { mutate: updateType, isPending: isUpdating } = useUpdateMembershipType();
  const { mutate: deleteType, isPending: isDeleting } = useDeleteMembershipType();

  const types = data?.types || [];

  const handleOpenCreate = () => {
    setEditingType(null);
    setFormData(EMPTY_FORM);
    setShowForm(true);
  };

  const handleOpenEdit = (type) => {
    setEditingType(type);
    setFormData({
      name: type.name,
      displayName: type.displayName,
      description: type.description || "",
      price: type.price,
      discountPercentage: type.discountPercentage || 0,
      validityMonths: type.validityMonths || 12,
      requiresDocumentVerification: type.requiresDocumentVerification || false,
      requiredDocumentType: type.requiredDocumentType || [],
      isActive: type.isActive !== false,
    });
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingType(null);
    setFormData(EMPTY_FORM);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox" && name !== "requiredDocumentType") {
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleDocTypeToggle = (docType) => {
    setFormData((prev) => {
      const current = prev.requiredDocumentType;
      const updated = current.includes(docType)
        ? current.filter((d) => d !== docType)
        : [...current, docType];
      return { ...prev, requiredDocumentType: updated };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      price: parseFloat(formData.price),
      discountPercentage: parseFloat(formData.discountPercentage) || 0,
      validityMonths: parseInt(formData.validityMonths) || 12,
    };

    if (editingType) {
      updateType({ typeId: editingType._id, ...payload }, { onSuccess: handleCloseForm });
    } else {
      createType(payload, { onSuccess: handleCloseForm });
    }
  };

  const handleDelete = (typeId) => {
    if (window.confirm("Delete this membership type? This cannot be undone.")) {
      deleteType(typeId);
    }
  };

  const handleToggleActive = (type) => {
    updateType({ typeId: type._id, isActive: !type.isActive });
  };

  return {
    types,
    isLoading,
    showForm,
    editingType,
    formData,
    isCreating,
    isUpdating,
    isDeleting,
    handleOpenCreate,
    handleOpenEdit,
    handleCloseForm,
    handleInputChange,
    handleDocTypeToggle,
    handleSubmit,
    handleDelete,
    handleToggleActive,
  };
};
