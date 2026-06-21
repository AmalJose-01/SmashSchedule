import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, CreditCard, CheckCircle2, XCircle, Smartphone, MapPin, KeyRound } from "lucide-react";
import { toast } from "sonner";
import Logout from "../../../../components/Logout.jsx";
import {
  useGetSquareStatus,
  useSaveSquareCredentials,
  useConnectSquare,
  useDisconnectSquare,
  useGetSquareLocations,
  useSaveSquareSettings,
} from "../services/roundRobin.queries.js";

const SquareSettings = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [applicationId, setApplicationId] = useState("");
  const [applicationSecret, setApplicationSecret] = useState("");
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [selectedDeviceId, setSelectedDeviceId] = useState("");

  const { data: statusData, isLoading: statusLoading } = useGetSquareStatus();
  const status = statusData?.data;
  const hasCredentials = !!status?.hasCredentials;
  const connected = !!status?.connected;

  const { mutate: saveCredentials, isPending: isSavingCredentials } = useSaveSquareCredentials();
  const { mutate: connectSquare, isPending: isConnecting } = useConnectSquare();
  const { mutate: disconnectSquare, isPending: isDisconnecting } = useDisconnectSquare();
  const { data: locationsData, isLoading: locationsLoading } = useGetSquareLocations(connected);
  const { mutate: saveSettings, isPending: isSaving } = useSaveSquareSettings();

  const locations = locationsData?.data ?? [];

  useEffect(() => {
    if (searchParams.get("square_connected")) {
      toast.success("Square account connected");
      setSearchParams({}, { replace: true });
    }
    const err = searchParams.get("square_error");
    if (err) {
      toast.error(`Square connection failed (${err})`);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Note: we deliberately do NOT prefill the Application ID/Secret inputs
  // from status — the server only ever returns a masked preview, never the
  // real value, so updating credentials always means typing both in full.
  useEffect(() => {
    if (status?.locationId) setSelectedLocationId(status.locationId);
    if (status?.deviceId) setSelectedDeviceId(status.deviceId);
  }, [status?.locationId, status?.deviceId]);

  const selectedLocation = locations.find((l) => l.id === selectedLocationId);

  const handleSaveCredentials = () => {
    if (!applicationId.trim() || !applicationSecret.trim()) {
      toast.error("Enter both your Application ID and Application Secret");
      return;
    }
    saveCredentials(
      { applicationId: applicationId.trim(), applicationSecret: applicationSecret.trim() },
      {
        onSuccess: () => {
          setApplicationId("");
          setApplicationSecret("");
        },
      }
    );
  };

  const handleSave = () => {
    if (!selectedLocationId) {
      toast.error("Choose a location first");
      return;
    }
    saveSettings({
      locationId: selectedLocationId,
      locationName: selectedLocation?.name,
      deviceId: selectedDeviceId || null,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white">
      <div className="flex justify-between items-center bg-white p-4 shadow-lg sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h2 className="text-xl font-semibold text-teal-800">Square Payments</h2>
        </div>
        <Logout />
      </div>

      <div className="p-6 max-w-2xl mx-auto space-y-6">
        {/* Square Application credentials — each admin brings their own Square
            Developer app (Application ID + Secret) since this is multi-tenant. */}
        <div className="bg-white rounded-2xl shadow border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-teal-50">
              <KeyRound className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Square Application Credentials</h3>
              <p className="text-xs text-gray-400">
                From your own Square Developer Dashboard app — never shared with other admins.
              </p>
            </div>
          </div>

          {connected ? (
            <div className="flex items-center justify-between bg-green-50 border border-green-100 rounded-xl px-4 py-3">
              <div className="flex items-center gap-2 text-green-700 text-sm font-medium">
                <CheckCircle2 className="w-4 h-4" />
                Saved — Application ID: {status?.maskedApplicationId}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {hasCredentials && (
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-xs text-gray-500">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-500 flex-shrink-0" />
                  Currently saved: {status?.maskedApplicationId}. Enter new values below to replace it.
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Application ID</label>
                <input
                  type="text"
                  value={applicationId}
                  onChange={(e) => setApplicationId(e.target.value)}
                  placeholder={hasCredentials ? "Enter to replace saved Application ID" : "sandbox-sq0idb-..."}
                  autoComplete="off"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Application Secret</label>
                <input
                  type="password"
                  value={applicationSecret}
                  onChange={(e) => setApplicationSecret(e.target.value)}
                  placeholder={hasCredentials ? "Enter to replace saved secret" : "sq0csp-..."}
                  autoComplete="new-password"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
                />
                <p className="text-xs text-gray-400 mt-1">Encrypted before it's stored. Never shown again after saving.</p>
              </div>
              <button
                onClick={handleSaveCredentials}
                disabled={isSavingCredentials}
                className="w-full flex items-center justify-center gap-2 bg-gray-800 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-900 disabled:opacity-60 transition-colors"
              >
                <KeyRound className="w-4 h-4" />
                {isSavingCredentials ? "Saving..." : hasCredentials ? "Update Credentials" : "Save Credentials"}
              </button>
            </div>
          )}
        </div>

        {/* Connection card */}
        <div className="bg-white rounded-2xl shadow border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-teal-50">
              <CreditCard className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Square Account</h3>
              <p className="text-xs text-gray-400">Connect your own Square business to take Terminal payments.</p>
            </div>
          </div>

          {statusLoading ? (
            <p className="text-sm text-gray-400">Checking connection status...</p>
          ) : connected ? (
            <div className="flex items-center justify-between bg-green-50 border border-green-100 rounded-xl px-4 py-3">
              <div className="flex items-center gap-2 text-green-700 text-sm font-medium">
                <CheckCircle2 className="w-4 h-4" />
                Connected {status?.merchantId ? `(merchant ${status.merchantId})` : ""}
              </div>
              <button
                onClick={() => disconnectSquare()}
                disabled={isDisconnecting}
                className="flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-600 disabled:opacity-60"
              >
                <XCircle className="w-3.5 h-3.5" />
                {isDisconnecting ? "Disconnecting..." : "Disconnect"}
              </button>
            </div>
          ) : !hasCredentials ? (
            <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
              Save your Square Application credentials above first, then connect your account.
            </p>
          ) : (
            <button
              onClick={() => connectSquare()}
              disabled={isConnecting}
              className="w-full flex items-center justify-center gap-2 bg-teal-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-teal-700 disabled:opacity-60 transition-colors"
            >
              <CreditCard className="w-4 h-4" />
              {isConnecting ? "Redirecting..." : "Connect Square Account"}
            </button>
          )}
        </div>

        {/* Location & device card */}
        {connected && (
          <div className="bg-white rounded-2xl shadow border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-800 mb-1">Location & Terminal Device</h3>
            <p className="text-xs text-gray-400 mb-4">
              Choose the Square location and the paired Terminal device that should pop up checkouts.
            </p>

            {locationsLoading ? (
              <p className="text-sm text-gray-400">Loading locations...</p>
            ) : locations.length === 0 ? (
              <p className="text-sm text-gray-400">No locations found on this Square account.</p>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 mb-1.5">
                    <MapPin className="w-3.5 h-3.5" /> Location
                  </label>
                  <select
                    value={selectedLocationId}
                    onChange={(e) => {
                      setSelectedLocationId(e.target.value);
                      setSelectedDeviceId("");
                    }}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
                  >
                    <option value="">Select a location...</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedLocation && (
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 mb-1.5">
                      <Smartphone className="w-3.5 h-3.5" /> Terminal Device
                    </label>
                    {selectedLocation.devices?.length > 0 ? (
                      <select
                        value={selectedDeviceId}
                        onChange={(e) => setSelectedDeviceId(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
                      >
                        <option value="">Select a device...</option>
                        {selectedLocation.devices.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name} {d.status ? `(${d.status})` : ""}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                        No paired Terminal devices found at this location yet. Pair your Square Terminal to this
                        location from the Square Dashboard, then refresh this page.
                      </p>
                    )}
                  </div>
                )}

                <button
                  onClick={handleSave}
                  disabled={isSaving || !selectedLocationId}
                  className="w-full flex items-center justify-center gap-2 bg-teal-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-teal-700 disabled:opacity-60 transition-colors"
                >
                  {isSaving ? "Saving..." : "Save Settings"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SquareSettings;
