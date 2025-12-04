import React from "react";
import { FaCalculator, FaPlus, FaSave, FaTimes, FaUserShield } from "react-icons/fa";
import { BiLogIn, BiLogOut } from "react-icons/bi";

// Icon map
const iconMap = {
  calculator: FaCalculator,
  login: BiLogIn,
  logout: BiLogOut,
  plus: FaPlus,
  close: FaTimes,
  save: FaSave,
  admin: FaUserShield,
};

const ButtonWithIcon = ({ title, icon, buttonBGColor, textColor, onClick, type = "button", }) => {
  const IconComponent = iconMap[icon?.toLowerCase()];

  return (
    <button
    type={type}
      onClick={onClick}
      className={`flex items-center justify-center gap-2 h-8 px-4 rounded-lg border border-gray-300 shadow-md transition duration-200
        ${buttonBGColor ? buttonBGColor : "bg-white"}
        ${textColor ? textColor : "text-black"}
        hover:bg-blue-800 hover:text-white`}
    >
      {IconComponent && <IconComponent className="w-5 h-5" />}
      <span>{title}</span>
    </button>
  );
};

export default ButtonWithIcon;
