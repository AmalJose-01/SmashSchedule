import React, { useState, useEffect } from "react";
import {
  CardElement,
  useStripe,
  useElements,
  PaymentRequestButtonElement,
} from "@stripe/react-stripe-js";
import { toast } from "sonner";
import { useSubscription } from "../../hooks/useAccountSubscription";
import { Check } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import { stripe_Publishable_key } from "../../../utils/config";

// const stripePromise = loadStripe(stripe_Publishable_key);

const stripePromise = loadStripe(stripe_Publishable_key, {
  locale: "en", 
});

export default function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const { handleSubscription } = useSubscription();

  const [paymentRequest, setPaymentRequest] = useState(null);
  const [loading, setLoading] = useState(false);

  // -------------------------------
  // GOOGLE PAY / APPLE PAY SETUP
  // -------------------------------
  useEffect(() => {
    if (!stripe) return;

    const pr = stripe.paymentRequest({
      country: "AU",
      currency: "aud",
      total: { label: "Subscription", amount: 2900 }, // $29 AUD
      requestPayerName: true,
      requestPayerEmail: true,
    });

    pr.canMakePayment().then((result) => {
      if (result) setPaymentRequest(pr);
    });

    pr.on("paymentmethod", async (ev) => {
      try {
        const clientSecret = await handleSubscription({
          amount: 2900,
          email: ev.payerEmail,
          cardHolderName: ev.payerName,
        });

        const result = await stripe.confirmCardPayment(clientSecret, {
          payment_method: ev.paymentMethod.id,
        });

        if (result.error) {
          ev.complete("fail");
          toast.error(result.error.message);
        } else {
          ev.complete("success");
          toast.success("Payment successful!");
        }
      } catch (err) {
        ev.complete("fail");
        toast.error("Google Pay payment failed!");
        console.error(err);
      }
    });
  }, [stripe]);

  // -------------------------------
  // CARD PAYMENT
  // -------------------------------
  const handleCardPayment = async (amount) => {
    if (!stripe || !elements) {
      toast.error("Stripe not ready");
      return;
    }

    setLoading(true);

    try {
      const clientSecret = await handleSubscription({
        amount: amount * 100,
        email: "amaljvv@gmail.com",
        cardHolderName: "Amal Jose",
      });

      if (!clientSecret) {
        toast.error("Payment failed: No client secret returned");
        setLoading(false);
        return;
      }

      const cardElement = elements.getElement(CardElement);

      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: cardElement },
      });

      if (result.error) {
        toast.error(result.error.message);
      } else {
        toast.success("Payment successful!");
      }
    } catch (e) {
      toast.error("Payment failed!");
      console.error(e);
    }

    setLoading(false);
  };

  // -------------------------------
  // STRIPE CHECKOUT (Subscription Products)
  // -------------------------------
  // const createCheckout = async (priceId) => {
  //   try {
  //     const sessionId = await handleSubscription({
  //       priceId,
  //       email: "amaljvv@gmail.com",
  //     });
  //     console.log("sessionId", sessionId);

  //     //  const stripe = await stripePromise;
  //     //  await stripe.redirectToCheckout({ sessionId });

  //     window.location.href = sessionId.url;
  //   } catch (error) {
  //     console.error("Checkout error:", error);
  //     toast.error("Checkout failed!");
  //   }
  // };

// -------------------------------
// STRIPE CHECKOUT (Subscription Products)
// -------------------------------
const createCheckout = async (priceId) => {
  try {
    const response = await handleSubscription({
      priceId,
      email: "amaljvv@gmail.com",
    });

    console.log("Checkout response:", response);

    if (!response?.url) {
      throw new Error("Checkout URL not received");
    }

    

    // 🔥 Redirect to Stripe Checkout
    window.location.href = response.url;

  } catch (error) {
    console.error("Checkout error:", error);
    toast.error(
      error?.response?.data?.message ||
      error?.message ||
      "Checkout failed!"
    );
  }
};



  return (
    <div className="w-full space-y-4 p-6 bg-white rounded shadow">
      {/* Google / Apple Pay Button */}
      {paymentRequest && (
        <PaymentRequestButtonElement
          options={{ paymentRequest }}
          className="mb-6"
        />
      )}

      {/* PLANS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <PlanCard
          title="Basic"
          price={29}
          features={[
            "Up to 5 tournaments per month",
            "Maximum 50 participants",
            "Basic management",
            "Email support",
            "Basic analytics",
          ]}
          onClick={() => createCheckout("price_123_basic")} // replace with your Price ID
        />

        <PlanCard
          title="Professional"
          price={79}
          billedAnnually
          features={[
            "Up to 20 tournaments per month",
            "200 participants",
            "Advanced management",
            "Priority support",
            "Advanced analytics",
            "Custom branding",
            "Team registration",
            "Automated notifications",
          ]}
          onClick={() => handleCardPayment(79)}
        />

        <PlanCard
          title="Enterprise"
          price={199}
          features={[
            "Unlimited tournaments",
            "Unlimited participants",
            "Full suite",
            "24/7 support",
            "Custom reporting",
            "White-label",
            "API access",
            "Account manager",
            "Custom integrations",
            "Enterprise security",
          ]}
          onClick={() => handleCardPayment(199)}
        />
      </div>

      {/* CARD ELEMENT */}
      <div className="mt-6">
        <CardElement
          options={{
            style: {
              base: { fontSize: "16px", color: "#424770" },
              invalid: { color: "#9e2146" },
            },
          }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------
// PLAN CARD COMPONENT
// ---------------------------------------------------------
const PlanCard = ({ title, price, billedAnnually, features, onClick }) => {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    await onClick();
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6">
        <h3 className="text-2xl mb-2">{title}</h3>
        <div className="mb-4">
          <span className="text-4xl font-semibold">${price}</span>
          <span className="text-gray-600">/month</span>
          {billedAnnually && (
            <div className="text-sm text-green-600 mt-1">Billed annually</div>
          )}
        </div>
        <ul className="space-y-3 mb-6">
          {features.map((f, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <Check className="w-5 h-5 text-green-600 mt-0.5" />
              <span className="text-gray-700 text-sm">{f}</span>
            </li>
          ))}
        </ul>
        <button
          onClick={handleClick}
          disabled={loading}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {loading ? "Processing..." : "Pay Now"}
        </button>
      </div>
    </div>
  );
};
