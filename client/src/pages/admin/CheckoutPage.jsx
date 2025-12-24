import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import CheckoutForm from "./CheckoutForm";
import { stripe_Publishable_key } from "../../../utils/config";

// const stripePromise = loadStripe(stripe_Publishable_key);
const stripePromise = loadStripe(stripe_Publishable_key, {
  locale: "en", // 🔥 FIXES './en' ERROR
});

export default function CheckoutPage() {
  return (
    <div className="w-full flex justify-center py-10">
      <Elements stripe={stripePromise}>
        <CheckoutForm />
      </Elements>
    </div>
  );
}
