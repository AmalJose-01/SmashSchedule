import { CheckCircle, Trophy } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function Success() {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const navigate = useNavigate();

  return (
    <div className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <Trophy className="w-8 h-8 text-blue-600" />
            <div>
              <span className="text-xl font-semibold">Elite Sports Club</span>
              <p className="text-sm text-gray-600">Tournament Management</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-2xl mx-auto rounded-lg">
        <div className="bg-white rounded-2xl shadow-2xl mt-4 rounded-t-lg">
          {/* Header Section */}
          <div className="bg-green-600 rounded-t-lg p-5">
            <div className="flex justify-center mb-4">
              <div className="bg-white rounded-full p-2 animate-bounce">
                <CheckCircle className="w-16 h-16 text-green-600" />
              </div>
            </div>
            <h1 className="text-3xl mb-2">Payment Successful!</h1>
            <p className="text-green-100">
              Thank you for subscribing to Elite Sports Club
            </p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-8 space-y-8">
          <div className="border-b pb-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              Subscription Details
            </h2>
            <div className="space-y-3">
              <div className="flex flex-col justify-between">
                <div className="text-gray-600">Your Session ID:</div>
                <div className="font-small text-green-600">{sessionId}</div>
              </div>

              <div className="flex justify-between mt-4">
                <span className="text-gray-600">Name:</span>
                <span className="font-medium text-gray-900">John Doe</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Membership:</span>
                <span className="font-medium text-gray-900">
                  Premium Annual
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Valid Until:</span>
                <span className="font-medium text-green-600">Dec 31, 2024</span>
              </div>
            </div>
          </div>
         <button
  className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
  onClick={() => navigate("/create-tournament", { replace: true })}
>
  Return to Dashboard
</button>
        </div>
      </div>

      {/* <div className="p-4">
        <h1>Payment Successful 🎉</h1>
        <p>Your Session ID: {sessionId}</p>
      </div> */}
    </div>
  );
}
