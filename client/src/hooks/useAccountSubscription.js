import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { loadStripe } from "@stripe/stripe-js";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";

import { createCheckoutAPI } from "../services/paymentServices";
import { stripe_Publishable_key } from "../../utils/config";
import { logOut } from "../redux/slices/userSlice";

export const useSubscription = () => {
  const stripePromise = loadStripe(stripe_Publishable_key, {
  locale: "en", // 🔥 FIXES './en' ERROR
});
  // const stripePromise = loadStripe(stripe_Publishable_key);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationKey: ["payment"],
    mutationFn: createCheckoutAPI,

    onError: (error) => {
      if (error?.response?.status === 401) {
        toast.error(error.response.data.message || "Session expired");
        dispatch(logOut());
        navigate("/");
      }
    },
  });

  const handleSubscription = async (paymentData) => {
    const stripe = await stripePromise;

    if (!stripe) {
      toast.error("Stripe not loaded yet");
      return null;
    }

    // ⭐ Capture promise
    const promise = mutation.mutateAsync(paymentData);

    toast.promise(promise, {
      loading: "Checkout...",
      success: "Redirecting to payment...",
      error: (err) =>
        err?.response?.data?.message ||
        err?.message ||
        "Checkout failed",
    });

    // ✅ Await & return API response
    const response = await promise;
    return response;
  };

  return {
    handleSubscription,
    subscriptionDetail: mutation.data,
    isSuccess: mutation.isSuccess,
    isLoading: mutation.isPending,
  };
};
