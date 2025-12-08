import { Link, useLocation } from "react-router-dom";
import TextField from "../../components/TextField";
import validationSchema from "../../../utils/validationSchemas";
import { set, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { useState } from "react";
import { useLogin } from "../../hooks/useLogin";
import { useGoogleLogin } from "../../hooks/useGoogleLogin";
import { X, LogIn, User, Lock, Shield } from "lucide-react";
import ButtonWithIcon from "../../components/ButtonWithIcon";
import { FaUserShield } from "react-icons/fa";

const Login = () => {
  // 1. Define Yup schema for validation
  const schema = validationSchema.pick(["email", "password"]);
  const { handleLogin, isLoading, isError, error } = useLogin();
  const [selectedTab, setSelectedTab] = useState("Trade"); // 👈 track tab value
  const { handleLoginWithGoogle, isLoading: isGoogleLoading } =
    useGoogleLogin();

  const location = useLocation();
  const isAdmin = location.pathname === "/admin/login";

  // 2. Initialize react-hook-form with Yup resolver
  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onClickLoginWithGoogle = async (credentialResponse) => {
    try {
      const decoded = jwtDecode(credentialResponse.credential);
      console.log("Decoded Google user:", decoded);

      const accountType = "admin";
      // isAdmin === true
      //   ? "admin"
      //   : selectedTab === "Trade"
      //   ? "trade"
      //   : selectedTab === "User"
      //   ? "user"
      //   : "";

      const inputData = {
        email: decoded.email,
        firstName: decoded.given_name,
        lastName: decoded.family_name,
        googleId: decoded.sub,
        accountType,
      };

      handleLoginWithGoogle(inputData);
    } catch (error) {
      console.log("Login", error);

      alert(error.response?.data?.message || "Login failed");
    }
  };

  const onSubmit = (data) => {
    const accountType = "admin";
    // isAdmin === true
    //   ? "admin"
    //   : selectedTab === "Trade"
    //   ? "trade"
    //   : selectedTab === "User"
    //   ? "user"
    //   : "";
    const loginData = { ...data, accountType };
    handleLogin(loginData);
  };

  const handleTabSelect = (tab) => {
    console.log("Selected Tab:", tab);
    setSelectedTab(tab);
  };

  return (
    <>
      <div className="flex w-full min-h-screen justify-center items-center bg-gray-400">
       
       
       
        <div className="card w-full max-w-md mx-auto shadow-lg rounded-lg bg-blue-600">
          <div className="card-body rounded-lg ">
            <div className="flex flex-col items-center justify-center text-center p-4">
              <FaUserShield className="w-24 h-24 text-white" />
              <h2 className="text-2xl font-bold text-white card-title-text">
                Welcome back
              </h2>
              <h4 className="text-white">
                Enter your credentials to access your account
              </h4>
            </div>
            <div className="text-center p-4 bg-white rounded-b-lg">
              <form
                className="mt-4 flex flex-col gap-2 bg"
                onSubmit={handleSubmit(onSubmit)}
              >
                <div className="flex items-center gap-2 text-gray-700 mb-2 ">
                  <User className="w-4 h-4" />
                  <div>Password</div>
                </div>

                <TextField
                  register={register}
                  name="email"
                  error={errors.email}
                  placeholder="Enter your email"
                  type={"email"}
                />

                <div className="flex items-center gap-2 text-gray-700 mb-2 ">
                  <Lock className="w-4 h-4" />
                  <div>Username</div>
                </div>

                <TextField
                  register={register}
                  name="password"
                  error={errors.password}
                  placeholder="Enter your password"
                  type={"password"}
                />

                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input type="checkbox" className="rounded border-border" />
                    <span className="text-sm">Remember me</span>
                  </label>

                  <Link
                    to="/forgot-password" // Use 'to' prop for the destination path
                    className="text-primary hover:underline text-blue-500"
                  >
                    Forgot password?
                  </Link>
                </div>

                <ButtonWithIcon
                  title="Sign In"
                  icon="login"
                  buttonBGColor="bg-blue-600"
                  textColor="text-white"
                  onClick={() => navigate("/teams")}
                />
              </form>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">OR</span>
                </div>
              </div>
              <div className="w-full ">
                <div className="w-full ">
                  <GoogleLogin
                    onSuccess={(credentialResponse) => {
                      onClickLoginWithGoogle(credentialResponse);
                    }}
                    onError={() => {
                      console.log("Login Failed");
                    }}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Don't have an account?{" "}
                  <Link
                    to="/signup" // Use 'to' prop instead of 'href'
                    className="text-primary hover:underline"
                  >
                    Sign up
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
