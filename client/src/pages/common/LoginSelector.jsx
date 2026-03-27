import React from "react";
import { useNavigate } from "react-router-dom";
import { Shield, User, Trophy } from "lucide-react";

const LoginSelector = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome to SmashSchedule</h1>
          <p className="text-gray-600">Choose your login type to continue</p>
        </div>

        <div className="space-y-4">
          {/* Admin Login Button */}
          <button
            onClick={() => navigate("/admin/login")}
            className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-xl transition-colors duration-200 shadow-lg hover:shadow-xl"
          >
            <Shield className="w-6 h-6" />
            Admin Login
            <Trophy className="w-5 h-5 ml-auto" />
          </button>

          {/* User Login Button */}
          <button
            onClick={() => navigate("/user/login")}
            className="w-full flex items-center justify-center gap-3 bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-6 rounded-xl transition-colors duration-200 shadow-lg hover:shadow-xl"
          >
            <User className="w-6 h-6" />
            User Login
            <User className="w-5 h-5 ml-auto" />
          </button>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Select your account type to access the appropriate dashboard
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginSelector;