import React, { use, useState } from "react";
import { MdHome } from "react-icons/md";
import { FaBars, FaTimes } from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";
import ButtonWithIcon from "./ButtonWithIcon";
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
navigate("/login")
};





  return (
    <>
      <header className="bg-gradient-to-t from-slate-200 to-slate-300   sticky top-0 z-50 w-full border-p shadow-lg">
        <div className="flex h-16 items-center justify-between ml-4 mr-4">
          <div className="hidden md:flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg">
              <button
                className="h-4 w-4 text-primary-foreground"
                onClick={() => navigate("/")}
              >
                <MdHome size={20} className="text-black" />
              </button>
            </div>
            <span className="font-semibold text-black">Dashboard</span>
          </div>

          <nav className="hidden md:flex items-center space-x-6">
            <button
              className={`${
                currentPage === "/" ? "text-blue-500" : "text-black"
              }
           transition-colors hover:text-foreground/80`}
            >
              Home
            </button>
        
           
            <button
              onClick={() => navigate("/create-tournament")}
              className="text-foreground/60 transition-colors hover:text-foreground/80  text-black"
            >
              Tournament
            </button>
          </nav>

<div className="flex flex-row gap-3">
              <ButtonWithIcon
              title="Register Team"
              icon="plus"
              buttonBGColor="bg-green-600"
              textColor="text-white"
                onClick={() => navigate("/teams")}
            />

 {currentPage === "/" && (
             <ButtonWithIcon
            title={ "Admin" }
            icon={"Admin"}
            buttonBGColor={ "bg-blue-600" }
            textColor={"text-white"}
            onClick={handleLogin}
          />
          )}
          </div>

       


          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="text-white focus:outline-none hover:text-blue-400"
            >
              {isOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
            </button>
          </div>


         

         

        </div>

        {isOpen && (
          <div className="md:hidden flex flex-col items-start  space-y-2">
            <button
              className={`transition-colors hover:text-foreground/80 text-black hover:text-blue-500`}
            >
              Home
            </button>
            <button
              onClick={() => navigate("features")}
              className="text-foreground/60 transition-colors hover:text-foreground/80  text-black hover:text-blue-500"
            >
              Features
            </button>
            <button
              onClick={() => navigate("about")}
              className="text-foreground/60 transition-colors hover:text-foreground/80  text-black hover:text-blue-500"
            >
              About
            </button>
            <button
              onClick={() => navigate("contact")}
              className="text-foreground/60 transition-colors hover:text-foreground/80  text-black hover:text-blue-500"
            >
              Contact
            </button>
          </div>
        )}
      </header>
    </>
  );
};

export default Navbar;
