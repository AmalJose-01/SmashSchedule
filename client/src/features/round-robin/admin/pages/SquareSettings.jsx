import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, CreditCard, CheckCircle2, XCircle, Smartphone, MapPin, KeyRound, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import Logout from "../../../../components/Logout.jsx";
import {
  useGetSquareStatus,
  useSaveSquareCredentials,
  useConnectSquare,
  useDisconnectSquare,
  useGetSquareLocations,
  useSaveSquareSettings,
  useCreateSquareDeviceCode,
  useSquareDeviceCodeStatus,
} from "../services/roundRobin.queries.js";

const SquareSettings = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [applicationId, setApplicationId] = useState("");
  const [applicationSecret, setApplicationSecret] = useState("");
  const [manualLocationId, setManualLocationId] = useState("");
  const [manualLocationName, setManualLocationName] = useState("");
  const [signatureKey, setSignatureKey] = useState("");
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [pairingCode, setPairingCode] = useState(null); // { id, code }

  const { data: statusData, isLoading: statusLoading } = useGetSquareStatus();
  const status = statusData?.data;
  const hasCredentials = !!status?.hasCredentials;
  const hasSignatureKey = !!status?.hasSignatureKey;
  const connected = !!status?.connected;

  const { mutate: saveCredentials, isPending: isSavingCredentials } = useSaveSquareCredentials();
  const { mutate: connectSquare, isPending: isConnecting } = useConnectSquare();
  const { mutate: disconnectSquare, isPending: isDisconnecting } = useDisconnectSquare();
  const { data: locationsData, isLoading: locationsLoading } = useGetSquareLocations(connected);
  const { mutate: saveSettings, isPending: isSaving } = useSaveSquareSettings();
  const { mutate: createDeviceCode, isPending: isCreatingCode } = useCreateSquareDeviceCode();
  const { data: deviceCodeStatusData } = useSquareDeviceCodeStatus(pairingCode?.id, !!pairingCode);

  const locations = locationsData?.data ?? [];
  const pairingStatus = deviceCodeStatusData?.data;

  // Once Square reports the code as PAIRED, grab the new deviceId, select it,
  // and clear the pairing UI.
  useEffect(() => {
    if (pairingStatus?.status === "PAIRED" && pairingStatus?.deviceId) {
      setSelectedDeviceId(pairingStatus.deviceId);
      toast.success("Terminal paired!");
      setPairingCode(null);
    }
  }, [pairingStatus]);

  useEffect(() => {
    if (searchParams.get("square_connected")) {
      toast.success("Square account connected");
      setSearchParams({}, { replace: true });
    }
    const err = searchParams.get("square_error");
    if (err) {
      const detail = searchParams.get("square_error_detail");
      toast.error(detail ? `Square connection failed: ${detail}` : `Square connection failed (${err})`, {
        duration: 10000,
      });
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
    // Once credentials already exist (whether or not OAuth has finished),
    // the Application ID/Secret don't need to be re-entered just to add or
    // change the Location ID / Webhook Signature Key.
    const onlyUpdatingExtras = hasCredentials && (manualLocationId.trim() || signatureKey.trim());
    if (!onlyUpdatingExtras && (!applicationId.trim() || !applicationSecret.trim())) {
      toast.error("Enter both your Application ID and Application Secret");
      return;
    }
    saveCredentials(
      {
        applicationId: applicationId.trim(),
        applicationSecret: applicationSecret.trim(),
        locationId: manualLocationId.trim() || undefined,
        locationName: manualLocationName.trim() || undefined,
        signatureKey: signatureKey.trim() || undefined,
      },
      {
        onSuccess: () => {
          setApplicationId("");
          setApplicationSecret("");
          setSignatureKey("");
          if (manualLocationId.trim()) setSelectedLocationId(manualLocationId.trim());
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

  const handleCreateDeviceCode = () => {
    if (!selectedLocationId) {
      toast.error("Choose a location first");
      return;
    }
    createDeviceCode(
      { locationId: selectedLocationId },
      {
        onSuccess: (res) => setPairingCode({ id: res?.data?.id, code: res?.data?.code }),
      }
    );
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

          {connected && (
            <div className="flex items-center justify-between bg-green-50 border border-green-100 rounded-xl px-4 py-3 mb-3">
              <div className="flex items-center gap-2 text-green-700 text-sm font-medium">
                <CheckCircle2 className="w-4 h-4" />
                Saved — Application ID: {status?.maskedApplicationId}
              </div>
            </div>
          )}
          {connected && (
            <div className="space-y-3 border-t border-gray-100 pt-4">
              <p className="text-xs text-gray-400">
                Already connected — you can still update your Location ID or Webhook Signature Key below without
                re-entering your Application ID/Secret.
              </p>
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 mb-1.5">
                  <MapPin className="w-3.5 h-3.5" /> Location ID <span className="text-gray-300">(optional)</span>
                </label>
                <input
                  type="text"
                  value={manualLocationId}
                  onChange={(e) => setManualLocationId(e.target.value)}
                  placeholder="e.g. L9W5JG29DAG2Z"
                  autoComplete="off"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
                />
                <input
                  type="text"
                  value={manualLocationName}
                  onChange={(e) => setManualLocationName(e.target.value)}
                  placeholder="Location name (e.g. Ballarat Masters Badminton Club)"
                  autoComplete="off"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm mt-2 focus:outline-none focus:ring-2 focus:ring-teal-300"
                />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 mb-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" /> Webhook Signature Key{" "}
                  <span className="text-gray-300">(optional)</span>
                </label>
                {hasSignatureKey && (
                  <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-xs text-gray-500 mb-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-500 flex-shrink-0" />
                    A signature key is already saved. Enter a new one below to replace it.
                  </div>
                )}
                <input
                  type="password"
                  value={signatureKey}
                  onChange={(e) => setSignatureKey(e.target.value)}
                  placeholder={hasSignatureKey ? "Enter to replace saved signature key" : "e.g. 9qOhVE1JITFpvQULUQUYQA"}
                  autoComplete="new-password"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
                />
                <p className="text-xs text-gray-400 mt-1">
                  From your Square Developer Dashboard → Webhooks. Encrypted before it's stored.
                </p>
              </div>
              <button
                onClick={handleSaveCredentials}
                disabled={isSavingCredentials || (!manualLocationId.trim() && !signatureKey.trim())}
                className="w-full flex items-center justify-center gap-2 bg-gray-800 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-900 disabled:opacity-60 transition-colors"
              >
                <KeyRound className="w-4 h-4" />
                {isSavingCredentials ? "Saving..." : "Save"}
              </button>
            </div>
          )}
          {!connected && (
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
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 mb-1.5">
                  <MapPin className="w-3.5 h-3.5" /> Location ID <span className="text-gray-300">(optional)</span>
                </label>
                <input
                  type="text"
                  value={manualLocationId}
                  onChange={(e) => setManualLocationId(e.target.value)}
                  placeholder="e.g. L9W5JG29DAG2Z"
                  autoComplete="off"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
                />
                <input
                  type="text"
                  value={manualLocationName}
                  onChange={(e) => setManualLocationName(e.target.value)}
                  placeholder="Location name (e.g. Ballarat Masters Badminton Club)"
                  autoComplete="off"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm mt-2 focus:outline-none focus:ring-2 focus:ring-teal-300"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Already know your Square Location ID (from the Square Dashboard or API reference)? Save it here so
                  it's set immediately — you can still connect your Square account separately below for payments.
                </p>
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 mb-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" /> Webhook Signature Key{" "}
                  <span className="text-gray-300">(optional)</span>
                </label>
                {hasSignatureKey && (
                  <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-xs text-gray-500 mb-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-500 flex-shrink-0" />
                    A signature key is already saved. Enter a new one below to replace it.
                  </div>
                )}
                <input
                  type="password"
                  value={signatureKey}
                  onChange={(e) => setSignatureKey(e.target.value)}
                  placeholder={hasSignatureKey ? "Enter to replace saved signature key" : "e.g. 9qOhVE1JITFpvQULUQUYQA"}
                  autoComplete="new-password"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
                />
                <p className="text-xs text-gray-400 mt-1">
                  From your Square Developer Dashboard → Webhooks. Used to verify that webhook events (e.g. Terminal
                  checkout updates) really came from Square. Encrypted before it's stored.
                </p>
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
                        No paired Terminal devices found at this location yet. Pair one below.
                      </p>
                    )}

                    {/* Pair a new Terminal device by generating a code the admin enters
                        on the physical device — no need to leave the app. */}
                    {pairingCode ? (
                      <div className="mt-3 bg-teal-50 border border-teal-100 rounded-xl px-4 py-3 text-center">
                        <p className="text-xs text-teal-700 mb-1">
                          Enter this code on your Square Terminal to pair it:
                        </p>
                        <p className="text-2xl font-bold tracking-widest text-teal-800">{pairingCode.code}</p>
                        <p className="text-xs text-gray-400 mt-2">
                          {pairingStatus?.status === "PAIRED" ? "Paired!" : "Waiting for the Terminal to pair..."}
                        </p>
                        <button
                          onClick={() => setPairingCode(null)}
                          className="mt-2 text-xs font-semibold text-gray-400 hover:text-gray-600"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={handleCreateDeviceCode}
                        disabled={isCreatingCode}
                        className="mt-3 w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-2 rounded-xl font-semibold text-xs hover:bg-gray-200 disabled:opacity-60 transition-colors"
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                        {isCreatingCode ? "Generating code..." : "Pair a new Terminal device"}
                      </button>
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
