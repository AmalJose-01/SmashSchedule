import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import apiClient from "../../../services/api/axiosInstance.js";

// ── Club payouts (Stripe Connect Express) ────────────────────────────────────
export const getStripeStatusAPI = () => apiClient.get("/admin/stripe/status").then((r) => r.data);
export const startStripeOnboardingAPI = () => apiClient.post("/admin/stripe/connect").then((r) => r.data);
export const getStripeDashboardLinkAPI = () => apiClient.get("/admin/stripe/dashboard").then((r) => r.data);

export const useStripeStatus = (options = {}) =>
  useQuery({ queryKey: ["stripe-status"], queryFn: getStripeStatusAPI, staleTime: 30000, ...options });

// Sends the admin to Stripe's hosted onboarding (club details + BSB/account number).
export const useStartStripeOnboarding = () =>
  useMutation({
    mutationFn: startStripeOnboardingAPI,
    onSuccess: (res) => {
      if (res?.data?.url) window.location.assign(res.data.url);
    },
    onError: (err) => toast.error(err.response?.data?.message || "Couldn't start payout setup"),
  });

export const useOpenStripeDashboard = () =>
  useMutation({
    mutationFn: getStripeDashboardLinkAPI,
    onSuccess: (res) => {
      if (res?.data?.url) window.open(res.data.url, "_blank", "noopener");
    },
    onError: (err) => toast.error(err.response?.data?.message || "Couldn't open Stripe"),
  });

// ── Round robin entry fee: player self-pay ───────────────────────────────────
export const payRoundRobinEntryFeeAPI = (roundRobinId) =>
  apiClient.post(`/club/round-robin/${roundRobinId}/pay`).then((r) => r.data);

export const usePayRoundRobinEntryFee = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: payRoundRobinEntryFeeAPI,
    onSuccess: (res) => {
      if (res?.data?.checkoutUrl) window.location.assign(res.data.checkoutUrl);
    },
    onError: (err, id) => {
      toast.error(err.response?.data?.message || "Couldn't start payment");
      qc.invalidateQueries({ queryKey: ["player-round-robin", id] });
    },
  });
};

export const formatCents = (cents) =>
  typeof cents === "number" ? `A$${(cents / 100).toFixed(2)}` : "—";
