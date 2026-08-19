import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";

export default function CheckoutForm() {
  const navigate = useNavigate();

  // TODO: wire up new payment provider here.
  // For now, selecting a plan goes straight to the dashboard.
  const handleSelectPlan = () => {
    navigate("/dashboard");
  };

  return (
    <div className="w-full space-y-4 p-6 bg-white rounded shadow">
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
          onClick={handleSelectPlan}
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
          onClick={handleSelectPlan}
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
          onClick={handleSelectPlan}
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
          {loading ? "Processing..." : "Choose Plan"}
        </button>
      </div>
    </div>
  );
};
