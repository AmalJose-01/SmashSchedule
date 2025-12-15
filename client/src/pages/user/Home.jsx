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
          <div className="flex justify-between items-start">
            <div>
              <h1 className="font-bold text-lg text-blue-600">
                Club Tournament Schedule
              </h1>
              <p className="text-gray-600 mb-4">
                Date: Saturday, 10 January 2026 <br />
                Time: 9:00 AM – 4:00 PM <br />
                Venue: Ken Kay Badminton Stadium, Wendouree <br />
                Event: Men’s Doubles (18+)
              </p>
            </div>
          </div>
          <div className="items-center justify-center">
            <ButtonWithIcon
              title="View Tournaments"
              icon="trophy"
              buttonBGColor="bg-green-600"
              textColor="text-white"
              onClick={() => navigate("/tournamentList")}
            />
          </div>
        </div>
      </div>
      </div>
    

  
    </div>
  );
};

export default Home;

