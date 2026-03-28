import { useState } from "react";
import {
  useGetAllMembershipTypes,
  useCreateMembershipType,
  useUpdateMembershipType,
  useDeleteMembershipType,
} from "../services/membershipTypeManagement.queries.js";

export const useMembershipTypeManagement = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    displayName: "",
    description: "",
    price: "",
    discountPercentage: 0,
    validityMonths: 12,
    requiresDocumentVerification: false,
    requiredDocumentType: [],
  });

  // Queries and Mutations
  const { data, isLoading, error } = useGetAllMembershipTypes();
  const { mutate: createType, isPending: isCreating } =
    useCreateMembershipType();
  const { mutate: updateType, isPending: isUpdating } =
    useUpdateMembershipType();
  const { mutate: deleteType, isPending: isDeleting } =
    useDeleteMembershipType();

  const membershipTypes = data?.types || [];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === "checkbox") {
      if (name === "requiredDocumentType") {
        const selected = formData.requiredDocumentType || [];
        const newSelected = checked
          ? [...selected, value]
          : selected.filter((doc) => doc !== value);
        setFormData({ ...formData, [name]: newSelected });
      } else {
        setFormData({ ...formData, [name]: checked });
      }
    } else if (type === "number") {
      setFormData({ ...formData, [name]: parseFloat(value) || 0 });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      displayName: "",
      description: "",
      price: "",
      discountPercentage: 0,
      validityMonths: 12,
      requiresDocumentVerification: false,
      requiredDocumentType: [],
    });
    setEditingType(null);
    setShowForm(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.name || !formData.displayName || !formData.price) {
      alert("Please fill in all required fields");
      return;
    }

    const submitData = {
      ...formData,
      price: parseFloat(formData.price),
      validityMonths: parseInt(formData.validityMonths),
    };

    if (editingType) {
      updateType(
        { typeId: editingType._id, typeData: submitData },
        {
          onSuccess: () => {
            resetForm();
          },
        }
      );
    } else {
      createType(submitData, {
        onSuccess: () => {
          resetForm();
        },
      });
    }
  };

  const handleEdit = (type) => {
    setEditingType(type);
    setFormData({
      name: type.name,
      displayName: type.displayName,
      description: type.description,
      price: type.price,
      discountPercentage: type.discountPercentage || 0,
      validityMonths: type.validityMonths || 12,
      requiresDocumentVerification: type.requiresDocumentVerification || false,
      requiredDocumentType: type.requiredDocumentType || [],
    });
    setShowForm(true);
  };

  const handleDelete = (typeId) => {
    if (window.confirm("Are you sure you want to delete this membership type?")) {
      deleteType(typeId);
    }
  };

  return {
    // State
    showForm,
    setShowForm,
    editingType,
    formData,
    membershipTypes,
    isLoading,
    error,

    // Mutation states
    isCreating,
    isUpdating,
    isDeleting,

    // Handlers
    handleInputChange,
    handleSubmit,
    handleEdit,
    handleDelete,
    resetForm,
  };
};
