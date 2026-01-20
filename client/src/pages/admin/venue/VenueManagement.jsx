import React, { use, useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import {
  MapPin,
  Clock,
  Plus,
  Save,
  Grid3x3,
  Building,
  Trash2,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import Logout from "../../../components/Logout";
import { toast } from "sonner";
import CreateCourt from "./CreateCourt";
import LocationSearch from "../../../components/LocationSearch";
import venueValidationSchemas from "../../../../utils/venueValidationSchemas";
import { yupResolver } from "@hookform/resolvers/yup";
import useSaveVenue from "../../../hooks/venue/useSaveVenue";
import { useSelector } from "react-redux";
import useGetDetailVenue from "../../../hooks/venue/useVenueDetail";

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const VenueManagement = () => {
  const navigate = useNavigate();
  const [showCourtModal, setShowCourtModal] = useState(false);
  const user = useSelector((state) => state.user.user);

  const { saveVenue, isSaving } = useSaveVenue();

  const { venue_Id } = useParams();
  const isEditMode = Boolean(venue_Id);
  // console.log("isEditMode", isEditMode);
  

  const { venueDetail, isLoading: isVenueDetailLoading } = useGetDetailVenue();

  // --- Form Schema ---
  const schema = venueValidationSchemas.pick(["venueName", "location"]);

  // --- useForm Setup ---
  const {
    register: registerVenue,
    handleSubmit: handleSubmitVenue,
    control,
    formState: { errors: venueErrors },
    setValue,
    trigger,
    watch,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      venueName: "",
      location: "",
      // status: "Open",
      userId: user._id,
    },
  });

  // --- Submit Handler ---
  const onSubmitVenue = async (data) => {
    // Filter out disabled days if needed, or send as is with enabled: false
    // Backend should handle validation based on 'enabled' flag if schema requires it.
    // However, schema says 'at least one availability day', so we ensure valid data.

    console.log("Venue Form Data:", data);
    await saveVenue(data);
  };


useEffect(() => {
  if (isEditMode && venueDetail) {

 console.log("venueDetail", venueDetail);
 
  }
}, [isEditMode, venueDetail, setValue]);



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
            Venue Management
          </h2>
        </div>
        <div className="flex gap-2">
          <Logout />
        </div>
      </div>

      <div className="max-full mx-auto p-6 mt-8">
        {/* Add Venue Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-100 rounded-xl">
              <MapPin className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                Add New Venue
              </h2>
              <p className="text-slate-500 text-sm">
                Create a new location for matches
              </p>
            </div>
          </div>

          <form
            onSubmit={handleSubmitVenue(onSubmitVenue)}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {/* Venue Name */}
            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Venue Name
              </label>
              <input
              value={venueDetail?.venueName || ""}
                type="text"
                {...registerVenue("venueName")}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder="e.g. City Sports Center"
              />
              {venueErrors.venueName && (
                <p className="text-red-500 text-xs mt-1">
                  {venueErrors.venueName.message}
                </p>
              )}
            </div>

            {/* Location */}
            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Location/Address
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                <div className="w-full left-3 top-3.5">
                  <LocationSearch
                    value={venueDetail?.location || ""}
                    onSelect={(location) => {
                      setValue("location", location.address, {
                        shouldDirty: true,
                        shouldTouch: true,
                      });
                      trigger("location");
                    }}
                  />
                </div>
              </div>
              {venueErrors.location && (
                <p className="text-red-500 text-xs mt-1">
                  {venueErrors.location.message}
                </p>
              )}
            </div>

            {/* Submit */}
            <div className="col-span-2 flex justify-end gap-3 mt-4 border-t pt-4 border-slate-100">
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition w-full md:w-auto justify-center"
              >
                <Save className="w-5 h-5" />
                Save Venue
              </button>
            </div>
          </form>
        </div>

        {/* Courts Section */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-slate-800">Courts</h3>
          <button
            onClick={() => setShowCourtModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition shadow-sm hover:shadow-md"
          >
            <Plus className="w-5 h-5" />
            New Court
          </button>
        </div>

        {/* Courts List */}
        {venueDetail?.courts && venueDetail.courts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {venueDetail.courts.map((court) => (
              <div key={court.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <Grid3x3 className="w-5 h-5 text-purple-500" />
                    <span className="font-bold text-slate-700">{court.courtName}</span>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${court.courtStatus === true ? "bg-green-100 text-green-700" : "bg-gray-100 text-red-700"}`}>
                    {court.courtStatus === true ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="text-sm text-slate-500">{court.courtType} </div>
                <button className="mt-auto text-red-500 hover:text-red-700 flex items-center gap-2 text-sm">
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500">No courts added yet</div>
        )}
       
      </div>

      {/* Create Court Modal */}
      {showCourtModal && <CreateCourt setShowCourtModal={setShowCourtModal} />}
    </div>
  );
};

export default VenueManagement;
