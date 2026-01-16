import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  Save,
  Grid3x3,
  X,
  Building,
  ListPlus,
} from "lucide-react";
function CreateCourt({ setShowCourtModal }) {
  const [isMultipleCourts, setIsMultipleCourts] = useState(false);
  const {
    register: registerCourt,
    handleSubmit: handleSubmitCourt,
    formState: { errors: courtErrors },
  } = useForm();

  const onSubmitCourt = async (data) => {
    console.log("Court Form Data:", data);

    let courtsToCreate = [];

    if (isMultipleCourts) {
      const { start, end, prefix, courtType } = data;

      // Basic validation
      if (!start || !end) {
        toast.error("Start and End values are required for multiple creation.");
        return;
      }

      const isStartNum = !isNaN(start);
      const isEndNum = !isNaN(end);

      if (isStartNum && isEndNum) {
        // Numeric Series: Court 1 -> Court 5
        const s = parseInt(start);
        const e = parseInt(end);

        if (s > e) {
          toast.error("Start number cannot be greater than end number.");
          return;
        }
        console.log("Generated Courts:", prefix, courtType);

        for (let i = s; i <= e; i++) {
          const prefixValue = prefix || "Court";
          courtsToCreate.push({
            courtName: `${prefixValue} ${i}`.trim(),
            courtType,
          });
        }
      } else if (
        !isStartNum &&
        !isEndNum &&
        start.length === 1 &&
        end.length === 1
      ) {
        // Alphabetic Series: Court A -> Court F
        const sChar = start.toUpperCase().charCodeAt(0);
        const eChar = end.toUpperCase().charCodeAt(0);

        if (sChar > eChar) {
          toast.error("Start letter cannot be after end letter.");
          return;
        }

        for (let i = sChar; i <= eChar; i++) {
          courtsToCreate.push({
            courtName: `${prefix} ${String.fromCharCode(i)}`.trim(),
            courtType,
          });
        }
      } else {
        toast.error("Start and End must be both numbers or single letters.");
        return;
      }
    } else {
      // Single Court Creation
      courtsToCreate.push({
        courtName: data.courtName,
        courtType: data.courtType,
      });
    }

    console.log("Courts Generated:", courtsToCreate);
    toast.success(
      `Generated ${courtsToCreate.length} court(s)! Check console.`
    );

    setShowCourtModal(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl transform transition-all">
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <h3 className="text-xl font-bold text-slate-800">Create New Court</h3>
          <button
            onClick={() => setShowCourtModal(false)}
            className="text-slate-400 hover:text-slate-600 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form
          onSubmit={handleSubmitCourt(onSubmitCourt)}
          className="p-6 flex flex-col gap-4"
        >
          {/* Multiple Courts Toggle */}
          <div className="flex items-center gap-2 mb-2 p-3 bg-slate-50 rounded-lg border border-slate-100">
            <input
              type="checkbox"
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              checked={isMultipleCourts}
              onChange={(e) => setIsMultipleCourts(e.target.checked)}
              id="multiCourtToggle"
            />
            <label
              htmlFor="multiCourtToggle"
              className="text-slate-700 font-medium cursor-pointer select-none"
            >
              Add Multiple Courts
            </label>
          </div>

          {!isMultipleCourts ? (
            /* Single Court Input */
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Court Name/Number
              </label>
              <input
                type="text"
                {...registerCourt("courtName", {
                  required: !isMultipleCourts
                    ? "Court Name is required"
                    : false,
                })}
                placeholder="e.g. Court 5"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
              />
              {courtErrors.courtName && (
                <p className="text-red-500 text-xs mt-1">
                  {courtErrors.courtName.message}
                </p>
              )}
            </div>
          ) : (
            /* Multiple Court Inputs */
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Prefix (Optional)
                </label>
                <input
                  type="text"
                  {...registerCourt("prefix")}
                  placeholder="e.g. Court"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Start (1 or A)
                  </label>
                  <input
                    type="text"
                    maxLength={3}
                    {...registerCourt("start", {
                      required: isMultipleCourts,
                    })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                    placeholder="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    End (5 or F)
                  </label>
                  <input
                    type="text"
                    maxLength={3}
                    {...registerCourt("end", {
                      required: isMultipleCourts,
                    })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                    placeholder="5"
                  />
                </div>
              </div>
              <p className="text-xs text-slate-500 -mt-1">
                Enter range like 1-5 or A-F.
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Court Type
            </label>
            <select
              {...registerCourt("courtType")}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all bg-white"
            >
              <option value="Synthetic">Synthetic</option>
              <option value="Wooden">Wooden</option>
              <option value="Cement">Cement</option>
            </select>
          </div>

          <button
            type="submit"
            className="mt-4 w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition shadow-lg shadow-green-200"
          >
            {isMultipleCourts ? "Create Multiple Courts" : "Create Court"}
          </button>
        </form>
      </div>
    </div>
  );
}
export default CreateCourt;
