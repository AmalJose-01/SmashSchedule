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
      title="Log out"
      aria-label="Log out"
      className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white hover:border-red-500 hover:shadow-lg hover:shadow-red-500/30 transition-all"
    >
      <Power size={18} />
      {/* Logout */}
    </button>
  );
};

export default Logout;
