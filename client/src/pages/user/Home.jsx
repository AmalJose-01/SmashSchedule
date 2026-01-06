import { useNavigate } from "react-router-dom";
import ButtonWithIcon from "../../components/ButtonWithIcon";
import Navbar from "../../components/Navbar";
import bgImage from "/src/assets/icon/bg_Web.svg";
import HeroBanner from "../user/HeroBanner";

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
                  src="/src/assets/icon/BB.jpeg"
                  alt="Partner 1"
                  className="h-28"
                />
                <img
                  src="/src/assets/icon/BV.png"
                  alt="Partner 2"
                  className="h-28"
                />
                <img
                  src="/src/assets/icon/BM.jpeg"
                  alt="Partner 3"
                  className="h-28"
                />
                 <img
                  src="/src/assets/icon/Logo (2).png"
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

