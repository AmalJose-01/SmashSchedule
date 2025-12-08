import React, { use, useState } from "react";
import { MdHome } from "react-icons/md";
import { FaBars, FaTimes } from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";
import ButtonWithIcon from "./ButtonWithIcon";
import { Home, Trophy, LogIn, Space } from "lucide-react";

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

  const handleLogin = async () => {
    navigate("/login");
  };

  return (
    <>
      <div className="w-full bg-white shadow-md sticky top-0">
        <div className="flex h-16 items-center justify-between ml-4 mr-4">
          <div className="flex items-center gap-2">
            <Trophy
              className="w-8 h-8 text-blue-600"
              onClick={() => navigate("/")}
            />
            <div>
              <span className="text-xl font-semibold">
                Ballarat Masters Badminton Club
              </span>
              <p className="text-sm text-gray-600">Tournament Management</p>
            </div>
          </div>

          <div className="hidden md:flex items-center justify-center gap-6">
            <div
              className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors"
              onClick={() => navigate("/")}
            >
              <Home
                className={`${
                  currentPage === "/" ? "text-blue-500" : "text-black"
                } w-5 h-5`}
              />
              <span
                className={`${
                  currentPage === "/" ? "text-blue-500" : "text-black"
                }`}
              >
                Home
              </span>
            </div>
            <div
              className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors"
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

          <div className="flex items-end justify-end">
            {/* <ButtonWithIcon
              title="Register Team"
              icon="plus"
              buttonBGColor="bg-green-600"
              textColor="text-white"
              onClick={() => navigate("/teams")}
            /> */}

            {currentPage === "/" && (
              <ButtonWithIcon
                title={"Admin"}
                icon={"Admin"}
                buttonBGColor={"bg-blue-600"}
                textColor={"text-white"}
                onClick={handleLogin}
              />
            )}
          </div>

          <div className="md:hidden">
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
           
           <div
              className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors"
              onClick={() => navigate("/")}
            >
              <Home
                className={`${
                  currentPage === "/" ? "text-blue-500" : "text-black"
                } w-5 h-5`}
              />
              <span
                className={`${
                  currentPage === "/" ? "text-blue-500" : "text-black"
                }`}
              >
                Home
              </span>
            </div>
            <div
              className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors"
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
