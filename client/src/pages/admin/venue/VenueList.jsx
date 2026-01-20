import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Plus, Edit2, Trash2, MapPin, Building } from "lucide-react";
import Logout from "../../../components/Logout";
import useGetVenue from "../../../hooks/venue/useGetVenue";
import { useEffect, useState } from "react";
import { FaTrash } from "react-icons/fa";
import ConfirmModal from "../../../components/AlertView";
import useDeleteVenue from "../../../hooks/venue/useDeleteVenue";
import { setVenueData } from "../../../redux/slices/venueSlice";

const VenueList = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteVenueId, setDeleteVenueId] = useState(null);

  // Fetch Venues using Hook
  const { venues, isLoading, isError } = useGetVenue();
  const { deleteVenue, isPending } = useDeleteVenue();
const handleDelete = async () => {
  console.log("handleDelete id:", deleteVenueId);

  await deleteVenue(deleteVenueId);  // wait first
  setShowConfirm(false);             // then close
};

  useEffect(() => {}, [venues]);


  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-4 shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Building
            className="w-8 h-8 text-blue-600 cursor-pointer"
            onClick={() => navigate("/admin-home")}
          />
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">
            Venues
          </h2>
        </div>
        <div className="flex gap-2">
          <Logout />
        </div>
      </div>

      <div className="max-w-full mx-auto p-6 mt-8">
        {/* Actions */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Registered Venues
            </h1>
            <p className="text-slate-500 text-sm">Manage your sports venues</p>
          </div>
          <button
            onClick={() => navigate("/venue-management/add")}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition shadow-sm hover:shadow-md"
          >
            <Plus className="w-5 h-5" />
            Add Venue
          </button>
        </div>

        {/* Grid */}
        {venues?.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-slate-100">
            <MapPin className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-600">
              No venues found
            </h3>
            <p className="text-slate-400">
              Get started by creating your first venue.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {venues?.map((venue) => (
              <div
                key={venue.id}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden group"
              >
                <div className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                      {venue.venueName}
                    </h3>
                  </div>

                  <div className="flex items-start gap-2 text-slate-500 text-sm mb-4 min-h-[40px]">
                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-2">{venue.location}</span>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                    <div className="text-xs text-slate-400">
                      {/* Could add court count here if available */}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setVenueData(venue);
                          navigate(`/venue-management/edit/${venue.id}`);
                        }}
                        className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center justify-center"
                        title="Edit"
                      >
                        <Edit2 className="" />
                      </button>

                      <button
                        className="p-2 bg-red-500 text-white rounded hover:bg-red-600 flex items-center justify-center"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent li click
                          setDeleteVenueId(venue.id);
                          setShowConfirm(true);
                        }}
                      >
                        <Trash2 />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={showConfirm}
        title="Delete Tournament"
        message="This action cannot be undone. Do you want to proceed?"
        confirmText="YES"
        cancelText="NO"
        danger
        loading={isLoading}
        onConfirm={handleDelete} // call delete function here
        onCancel={() => setShowConfirm(false)} // close modal
      />
    </div>
  );
};

export default VenueList;
