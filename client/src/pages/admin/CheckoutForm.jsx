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

export default function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const { handleSubscription } = useSubscription();

  const [paymentRequest, setPaymentRequest] = useState(null);
  const [loading, setLoading] = useState(false);

  // ---------------------------------------------------------
  // GOOGLE PAY / APPLE PAY SETUP
  // ---------------------------------------------------------
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

    if (!pr) return;

    pr.on("paymentmethod", async (ev) => {
      try {
        const clientSecret = await handleSubscription({
          amount: 2900,
          email: ev.payerEmail,
          cardHolderName: ev.payerName,
        });

        

        // const result = await stripe.confirmCardPayment(clientSecret, {
        //   payment_method: ev.paymentMethod.id,
        // });

        // if (result.error) {
        //   ev.complete("fail");
        //   toast.error(result.error.message);
        // } else {
        //   ev.complete("success");
        //   toast.success("Payment successful!");
        // }
      } catch (err) {
        ev.complete("fail");
        toast.error("Google Pay payment failed!");
      }
    });
  }, [stripe, handleSubscription]);

  // ---------------------------------------------------------
  // NORMAL CARD PAYMENT (CardElement)
  // ---------------------------------------------------------
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

    console.log("Returned clientSecret:", clientSecret);

    if (!clientSecret) {
      toast.error("Payment failed: No client secret returned");
      setLoading(false);
      return;
    }

    toast.success("Payment completed!");
  } catch (e) {
    toast.error("Payment failed!");
    console.log("Payment error:", e);
  }

  setLoading(false);
};

const createCheckout = async(price) => {
    try {
         const clientSecret = await handleSubscription({
      amount: price * 100,
      email: "amaljvv@gmail.com",
      cardHolderName: "Amal Jose",
      priceId: "prod_TaHZCxbbgMmy1v",
    });
    } catch (error) {
            console.log("Payment error:", error);  
       toast.error("Payment failed!");
    }
}




  return (
    <div className="w-full space-y-4 p-6 bg-white rounded shadow">


 

      {/* PLANS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* BASIC PLAN */}
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
          onClick={() => createCheckout(29)}
        />

        {/* PROFESSIONAL */}
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

        {/* ENTERPRISE */}
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
    </div>
  );
}

// ---------------------------------------------------------
// PLAN CARD COMPONENT
// ---------------------------------------------------------
const PlanCard = ({ title, price, billedAnnually, features, onClick }) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6">
        <h3 className="text-2xl mb-2">{title}</h3>

        <div className="mb-4">
          <span className="text-4xl font-semibold">${price}</span>
          <span className="text-gray-600">/month</span>

          {billedAnnually && (
            <div className="text-sm text-green-600 mt-1">
              Billed annually
            </div>
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
          onClick={onClick}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Pay Now
        </button>
      </div>
    </div>
  );
};
