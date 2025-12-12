import { useElements, useStripe } from "@stripe/react-stripe-js";
import { toast } from "sonner";
import { createCheckoutAPI } from "../services/paymentServices";
import { useMutation } from "@tanstack/react-query";
import { loadStripe } from "@stripe/stripe-js";
import { stripe_Publishable_key } from "../../utils/config";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logOut } from "../redux/slices/userSlice";

export const useSubscription = () => {
  const stripePromise = loadStripe(stripe_Publishable_key);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // React Query Mutation
  const mutation = useMutation({
    mutationKey: ["payment"],
    mutationFn: createCheckoutAPI,

    // 🔥 HANDLE AXIOS ERRORS HERE
    onError: (error) => {
      console.log("MUTATION ERROR:", error);

      if (error?.response?.status === 401) {
        toast.error(error.response.data.message || "Session expired");

        dispatch(logOut());
        navigate("/");

        return;
      }

      // Fallback for other errors
      toast.error(error?.response?.data?.message || error.message);
    },
  });

  const handleSubscription = async (paymentData) => {
    const stripe = await stripePromise;

    if (!stripe) {
      toast.error("Stripe not loaded yet");
      return;
    }

    // 🔥 NO TRY-CATCH NEEDED HERE
    toast.promise(
      mutation.mutateAsync(paymentData),
      {
        loading: "Checkout...",

        success: async (res) => {
          console.log("Checkout URL:", res.url);
          window.location.href = res.url;
        },

        error: (err) => {
          console.log("TOAST ERROR BLOCK:", err);

          return (
            err?.response?.data?.message ||
            err?.message ||
            "Checkout failed"
          );
        },
      }
    );
  };

  return { handleSubscription };
};
