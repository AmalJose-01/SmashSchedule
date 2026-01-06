import { useNavigate } from "react-router-dom";
import ButtonWithIcon from "../../components/ButtonWithIcon";
import Navbar from "../../components/Navbar";
import bgImage from "/src/assets/icon/bg_Web.svg";
import HeroBanner from "../user/HeroBanner";
import bbIcon from "../../assets/icon/bb_s.png";
import bvIcon from "../../assets/icon/bv_s.jpeg";
import bmIcon from "../../assets/icon/bm_s.png";
import webfluenceLogo from "../../assets/icon/webfluence_logo.png"; 


const Home = () => {
  const navigate = useNavigate();

  return (
    <div id="home" className="min-h-screen  bg-gradient-to-r from-purple-300 to-purple-400">
      <div className="sticky top-0 z-50 bg-white shadow">
        <Navbar />
      </div>
      <div className="p-4">
  <HeroBanner />
      <div className=" bg-white rounded-lg shadow-xl p-4">
        <div className="flex flex-col  md:flex-row justify-between items-start">
          <div className="flex justify-center items-center w-full  mb-6 md:mb-0 ">
            <div>
              <h1 className="font-bold text-4xl text-blue-600 text-center">
               Our Partners
              </h1>
              <div className="flex flex-col md:flex-row items-center justify-center gap-8 mt-4">
                <img
                  src={bbIcon}
                  alt="Partner 1"
                  className="h-28"
                />
                <img
                  src={bvIcon}
                  alt="Partner 2"
                  className="h-28"
                />
                <img
                  src={bmIcon}
                  alt="Partner 3"
                  className="h-28"
                />
                 <img
                  src={webfluenceLogo}
                  alt="Partner 3"
                  className="h-28"
                />
              </div>
            
            </div>
          </div>
          
        </div>
      </div>
      </div>
    

  
    </div>
  );
};

export default Home;

