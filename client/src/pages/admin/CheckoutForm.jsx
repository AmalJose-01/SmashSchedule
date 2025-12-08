import React, { useState, useEffect } from "react";
import {
  CardElement,
  useStripe,
  useElements,
  
} from "@stripe/react-stripe-js";
import { toast } from "sonner";
import { useSubscription } from "../../hooks/useAccountSubscription";
import { Check } from "lucide-react";

export default function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const { handleSubscription } = useSubscription();

  const [loading, setLoading] = useState(false);
  const [paymentRequest, setPaymentRequest] = useState(null);

  // Initialize Google Pay / Apple Pay
//   useEffect(() => {
//     if (!stripe) return;

//     const pr = stripe.paymentRequest({
//       country: "AU",
//       currency: "aud",
//       total: { label: "Subscription", amount: 2900 }, // $29 AUD default
//       requestPayerName: true,
//       requestPayerEmail: true,
//     });

//     pr.canMakePayment().then((result) => {
//       if (result) setPaymentRequest(pr);
//     });

//     // Listen for PaymentRequest events
//     if (pr) {
//       pr.on("paymentmethod", async (ev) => {
//         try {
//           const clientSecret = await handleSubscription({
//             amount: 2900, // same amount as above
//             userEmail: ev.payerEmail,
//             metadata: { userId: "1234" },
//           });

//           const result = await stripe.confirmCardPayment(clientSecret, {
//             payment_method: ev.paymentMethod.id,
//           });

//           if (result.error) {
//             ev.complete("fail");
//             toast.error(result.error.message);
//           } else {
//             ev.complete("success");
//             toast.success("Payment successful!");
//           }
//         } catch (err) {
//           ev.complete("fail");
//           toast.error("Payment failed!");
//         }
//       });
//     }
//   }, [stripe, handleSubscription]);

  // Handle normal Card payments
  const handleCardPayment = async (amount) => {
    if (!stripe || !elements) return;
    setLoading(true);

    try {
      const clientSecret = await handleSubscription({
        amount: amount * 100, // convert dollars to cents
        userEmail: "user@gmail.com",
        metadata: { userId: "1234" },
      });

      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {
            name: "Customer Name",
            email: "user@gmail.com",
          },
        },
      });

      if (result.error) toast.error(result.error.message);
      else if (result.paymentIntent?.status === "succeeded")
        toast.success("Payment successful!");
    } catch (err) {
      console.error(err);
      toast.error("Payment failed!");
    }

    setLoading(false);
  };

  return (
    <div className="w-full space-y-4 p-6 bg-white rounded shadow">
      {/* PaymentRequestButton for Google Pay / Apple Pay */}
      {/* {paymentRequest && (
        <div className="mb-4">
          <PaymentRequestButtonElement options={{ paymentRequest }} />
        </div>
      )} */}

      {/* CardElement */}
      <div className="border p-3 rounded mb-4">
        <CardElement
          options={{
            style: {
              base: { fontSize: "16px", color: "#424770" },
              invalid: { color: "#9e2146" },
            },
            hidePostalCode: true,
          }}
        />
      </div>

      {/* Subscription Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* BASIC PLAN */}
        <PlanCard
          title="Basic"
          price={29}
          features={[
            "Up to 5 tournaments per month",
            "Maximum 50 participants per tournament",
            "Basic tournament management",
            "Email support",
            "Basic analytics",
          ]}
          onClick={() => handleCardPayment(29)}
        />

        {/* PROFESSIONAL PLAN */}
        <PlanCard
          title="Professional"
          price={79}
          billedAnnually
          features={[
            "Up to 20 tournaments per month",
            "Maximum 200 participants per tournament",
            "Advanced tournament management",
            "Priority email & chat support",
            "Advanced analytics & reports",
            "Custom branding",
            "Team registration management",
            "Automated notifications",
          ]}
          onClick={() => handleCardPayment(79)}
        />

        {/* ENTERPRISE PLAN */}
        <PlanCard
          title="Enterprise"
          price={199}
          features={[
            "Unlimited tournaments",
            "Unlimited participants",
            "Full tournament suite",
            "24/7 Priority support",
            "Custom analytics & reporting",
            "White-label solution",
            "API access",
            "Dedicated account manager",
            "Custom integrations",
            "Advanced security features",
          ]}
          onClick={() => handleCardPayment(199)}
        />
      </div>
    </div>
  );
}

// PlanCard Component
const PlanCard = ({ title, price, billedAnnually, features, onClick }) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6">
        <h3 className="text-2xl mb-2">{title}</h3>
        <div className="mb-4">
          <span className="text-4xl">${price}</span>
          <span className="text-gray-600">/month</span>
          {billedAnnually && (
            <div className="text-sm text-green-600 mt-1">
              ${price}/month billed annually
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
