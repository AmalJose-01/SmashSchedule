import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, ShieldAlert } from "lucide-react";
import AppBackground from "../../../components/AppBackground";
import { BASE_URL } from "../../../../utils/config";
import { loginUser } from "../../../redux/slices/userSlice";
import { errorMessage, getUserDetailWithToken } from "../services/master.services";
import { setSupportMode } from "../services/supportMode";

// Landing page for "Open as admin". The master console opens this page on the
// target environment's own site with a short-lived token in the URL fragment
// (#t=...), which is never sent to a server. We read it, wipe it from the
// address bar, sign in as the club admin and go to their dashboard.
const MasterHandoff = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const started = useRef(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (started.current) return; // StrictMode runs effects twice in dev
    started.current = true;

    const p = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const token = p.get("t");
    const info = { clubName: p.get("c") || "", adminEmail: p.get("a") || "", masterEmail: p.get("m") || "" };
    window.history.replaceState(null, "", window.location.pathname); // remove the token from the URL

    const run = token
      ? getUserDetailWithToken(BASE_URL, token)
      : Promise.reject(
          new Error("This link is missing its access token. Go back to the console and click “Open as admin” again.")
        );

    run
      .then(({ user }) => {
        if (!user || user.accountType !== "admin") throw new Error("This token is not for a club admin account.");
        setSupportMode({ ...info, expiresAt: tokenExpiry(token) });
        dispatch(loginUser({ user, accessToken: token, refreshToken: "" }));
        navigate("/dashboard", { replace: true });
      })
      .catch((err) => setError(errorMessage(err, "Could not open the club account.")));
  }, [dispatch, navigate]);

  return (
    <AppBackground variant="master" className="flex items-center justify-center p-6">
      <div className="text-center text-slate-200 max-w-md">
        {error ? (
          <>
            <ShieldAlert className="w-10 h-10 text-rose-400 mx-auto mb-4" />
            <p className="mb-4">{error}</p>
            <Link to="/master/console" className="text-violet-300 hover:text-violet-200 underline">
              Back to Master Console
            </Link>
          </>
        ) : (
          <>
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-violet-300" />
            <p>Opening club account…</p>
          </>
        )}
      </div>
    </AppBackground>
  );
};

// JWT `exp` (seconds) → ms, or null if it can't be read.
const tokenExpiry = (token) => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return payload.exp ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
};

export default MasterHandoff;
