import { toast } from "sonner";
import { subscriptionAPI } from "../services/paymentServices";
import { CardElement, useElements, useStripe } from "@stripe/react-stripe-js";

export const useSubscription = () => {
  const handleSubscription = async (payment) => {
    try {
//         const stripe = useStripe();
//   const elements = useElements();
      const loadingToastId = toast.loading("Processing payment...");
      const res = await subscriptionAPI(payment);
      toast.dismiss(loadingToastId);
      toast.success("Payment schedule created successfully!");
     
         const clientSecret = res.clientSecret;

              console.log("Payment schedule created successfully==============================",clientSecret);


    //   // 2. Confirm payment
    // const result = await stripe.confirmCardPayment(clientSecret, {
    //   payment_method: {
    //     card: elements.getElement(CardElement),
    //   },
    // });


     
      return clientSecret;
    } catch (err) {
      toast.dismiss();
      toast.error(err?.response?.data?.message || "Error processing payment");
      throw err;
    }
  };

  return { handleSubscription };
};
