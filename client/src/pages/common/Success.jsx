import { CheckCircle, Trophy } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useGetUserDetail } from "../../hooks/useGetUserDetail";
import { useEffect } from "react";
import { clearUser, loginUser } from "../../redux/slices/userSlice";


export default function Success() {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const user = useSelector((state) => state.user.user);
const { userDetail, isLoading } = useGetUserDetail();

useEffect(() => {
  if (userDetail?.user) {
dispatch(clearUser())
    console.log("userDetail",userDetail);
    
    dispatch(updateUser(userDetail));
  }
}, [userDetail, dispatch]);

  return (
    <div className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-2 py-4">
          <Trophy className="w-8 h-8 text-blue-600" />
          <div>
            <span className="text-xl font-semibold">Elite Sports Club</span>
            <p className="text-sm text-gray-600">Tournament Management</p>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-2xl mx-auto">
        <div className="bg-green-600 p-6 rounded-t-lg text-center text-white">
          <CheckCircle className="w-16 h-16 mx-auto mb-4 animate-bounce" />
          <h1 className="text-3xl mb-2">Payment Successful!</h1>
          <p>Thank you for subscribing to Elite Sports Club</p>
        </div>

        <div className="bg-gray-50 p-8 rounded-b-lg space-y-6">
          <div>
            <p className="text-gray-600">Session ID</p>
            <p className="text-green-600 break-all">{sessionId}</p>
          </div>

          <button
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            disabled={!user}
            onClick={() => {
if (user?.accountType === "admin" && user?.isVerified) {
  navigate("/tournament-list", { replace: true });
} else {
                navigate("/", { replace: true });
              }
            }}
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
