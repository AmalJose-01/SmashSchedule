import React from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Power } from "lucide-react";
import { logOut } from "../redux/slices/userSlice"; // adjust path

const Logout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    // Dispatch Redux logOut action
    dispatch(logOut());

    // Redirect to login page
    navigate("/");
  };

  return (
    <button
      onClick={handleLogout}
      className="px-4 py-2 flex items-center gap-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
    >
      <Power size={18} />
      {/* Logout */}
    </button>
  );
};

export default Logout;
