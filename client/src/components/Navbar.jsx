import React, { use, useState } from "react";
import { MdHome } from "react-icons/md";
import { FaBars, FaTimes, FaUserShield } from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";
import ButtonWithIcon from "./ButtonWithIcon";
import { Home, Trophy, LogIn, Space } from "lucide-react";
import { useSelector } from "react-redux";
import { div } from "framer-motion/client";

// import { useDispatch, useSelector } from "react-redux";
// import { logOut } from "../redux/slices/userSlice";

const Navbar = () => {
  const navigate = useNavigate();

  const location = useLocation(); // get current route
  const currentPage = location.pathname;

  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const userData = useSelector((state) => state.user.user);

  console.log("userData", userData);

  return (
    <>
      <div className="w-full bg-white shadow-md sticky top-0">
        <div className="flex  h-18 md:h-16 items- justify-between ml-4 mr-4">
          <div className="flex items-center gap-2">
            <Trophy
              className="w-8 h-8 text-blue-600"
              onClick={() => navigate("/")}
            />
            <div>
              <span className="text-xl font-semibold">
               Club Hero
              </span>
              <p className="text-sm text-gray-600">Tournament Management</p>
            </div>
          </div>

          <div className="hidden md:flex  items-center justify-center gap-6">
            {userData && (
              <div
                className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors cursor-pointer"
                onClick={() => {
                  if (userData.accountType === "admin") {
                    navigate("/dashboard");
                  } else if (userData.accountType === "user") {
                    navigate("/user/dashboard");
                  }
                }}
              >
                <Home
                  className={`${
                    (currentPage === "/dashboard" || currentPage === "/user/dashboard") ? "text-blue-500" : "text-black"
                  } w-5 h-5`}
                />
                <span
                  className={`${
                    (currentPage === "/dashboard" || currentPage === "/user/dashboard") ? "text-blue-500" : "text-black"
                  }`}
                >
                  Dashboard
                </span>
              </div>
            )}
            <div
              className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors cursor-pointer"
            >
              <Trophy
                className={`${
                  currentPage === "/tournamentList"
                    ? "text-blue-500"
                    : "text-black"
                } w-5 h-5`}
              />
              <span
                className={`${
                  currentPage === "/tournamentList"
                    ? "text-blue-500"
                    : "text-black"
                }`}
              >
                Tournaments
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center justify-end">
            {!userData && currentPage === "/" && (
              <div className="flex gap-2">
                <ButtonWithIcon
                  title={"Admin Login"}
                  icon={"Admin"}
                  buttonBGColor={"bg-blue-600"}
                  textColor={"text-white"}
                  onClick={() => navigate("/admin/login")}
                />
                <ButtonWithIcon
                  title={"User Login"}
                  icon={"User"}
                  buttonBGColor={"bg-green-600"}
                  textColor={"text-white"}
                  onClick={() => navigate("/user/login")}
                />
              </div>
            )}
          </div>

          <div className="md:hidden flex items-center gap-3 ml-auto">
            {!userData && currentPage === "/" && (
              <div className="flex gap-2">
                <button
                  onClick={() => navigate("/admin/login")}
                  className="flex w-10 h-10 bg-blue-600 text-white rounded-lg items-center justify-center"
                >
                  <FaUserShield />
                </button>
                <button
                  onClick={() => navigate("/user/login")}
                  className="flex w-10 h-10 bg-green-600 text-white rounded-lg items-center justify-center"
                >
                  <LogIn />
                </button>
              </div>
            )}

            <button
              onClick={toggleMenu}
              className="text-blue focus:outline-none hover:text-blue-400"
            >
              {isOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
            </button>
          </div>
        </div>

        {isOpen && (
          <div className="md:hidden flex flex-col items-start  space-y-2 shadow-md mt-2 bg-slate-50 p-3">
            {userData && (
              <div
                className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors cursor-pointer"
                onClick={() => {
                  if (userData.accountType === "admin") {
                    navigate("/dashboard");
                  } else if (userData.accountType === "user") {
                    navigate("/user/dashboard");
                  }
                }}
              >
                <Home
                  className={`${
                    (currentPage === "/dashboard" || currentPage === "/user/dashboard") ? "text-blue-500" : "text-black"
                  } w-5 h-5`}
                />
                <span
                  className={`${
                    (currentPage === "/dashboard" || currentPage === "/user/dashboard") ? "text-blue-500" : "text-black"
                  }`}
                >
                  Dashboard
                </span>
              </div>
            )}
            <div
              className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors cursor-pointer"
              onClick={() => navigate("/tournamentList")}
            >
              <Trophy
                className={`${
                  currentPage === "/tournamentList"
                    ? "text-blue-500"
                    : "text-black"
                } w-5 h-5`}
              />
              <span
                className={`${
                  currentPage === "/tournamentList"
                    ? "text-blue-500"
                    : "text-black"
                }`}
              >
                Tournaments
              </span>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Navbar;
