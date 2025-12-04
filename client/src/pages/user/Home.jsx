import Navbar from "../../components/Navbar";
import bgImage from "/src/assets/icon/bg_Web.svg";

const Home = () => {
  return (
    <>
      <Navbar />

      <div className="w-screen h-screen flex justify-center">
        <div
          className="w-screen h-2/4 mt-0"
          style={{
            backgroundImage: `url(${bgImage})`,
            backgroundRepeat: "no-repeat",
            backgroundSize: "cover",
          }}
        >
          <h1 className="text-white text-2xl">Hello World</h1>
        </div>
      </div>
    </>
  );
};

export default Home;
