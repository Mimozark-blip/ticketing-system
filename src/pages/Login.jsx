import { useState } from "react";
import { auth, db } from "../firebase";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";

const provider = new GoogleAuthProvider();

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;
      await handleUserRole(user);
    } catch (err) {
      console.error("Log-in Error:", err);
      setError("Invalid email or password");
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      console.log("Google user:", user);
      await handleUserRole(user);
    } catch (err) {
      console.error("Google Sign-in Error:", err);
      setError("Google sign-in failed");
    }
  };

  const itStaffRoles = [
    "finance_officer",
    "account_manager",
    "network_engineer",
    "hardware_technician",
    "software_engineer",
    "cybersecurity_analyst",
    "product_manager",
    "customer_support",
    "operations_manager",
  ];

  const handleUserRole = async (user) => {
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (!userDoc.exists()) {
      await setDoc(doc(db, "users", user.uid), {
        role: "user",
        email: user.email,
        createdAt: serverTimestamp(),
      });
    }
    const userData = (await getDoc(doc(db, "users", user.uid))).data();
    if (userData.role === "admin") {
      navigate("/admin-dashboard");
    } else if (itStaffRoles.includes(userData.role)) {
      navigate("/it-staff-dashboard");
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 p-4">
      <div className="w-full max-w-md">
        {/* Card with glass effect */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/20">
          {/* Logo/Brand Section */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-white rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg">
              <span className="text-3xl font-bold text-blue-600">TZ</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
            <p className="text-blue-100/80">Sign in to access your account</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-100 px-4 py-3 rounded-xl text-sm mb-6">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="relative">
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-blue-200/50 focus:outline-none focus:border-white/30 transition-colors"
                required
              />
            </div>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-blue-200/50 focus:outline-none focus:border-white/30 transition-colors"
                required
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="showPassword"
                className="w-4 h-4 rounded border-white/30 bg-white/5 text-blue-500 focus:ring-offset-0 focus:ring-1 focus:ring-white/30"
                checked={showPassword}
                onChange={() => setShowPassword(!showPassword)}
              />
              <label
                htmlFor="showPassword"
                className="ml-2 text-sm text-white/80"
              >
                Show Password
              </label>
            </div>

            <button
              type="submit"
              className="w-full bg-white text-blue-600 py-3 px-4 rounded-xl font-medium hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600 transition-colors"
            >
              Sign In
            </button>
          </form>

          <div className="relative flex items-center my-8">
            <div className="flex-grow border-t border-white/10"></div>
            <span className="mx-4 text-white/60 text-sm">or continue with</span>
            <div className="flex-grow border-t border-white/10"></div>
          </div>

          {/* Google Sign In */}
          <button
            onClick={handleGoogleLogin}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all flex items-center justify-center gap-3"
          >
            <FcGoogle size={20} className="bg-white rounded-full" />
            <span className="text-sm font-medium">Sign in with Google</span>
          </button>

          {/* Sign Up Link */}
          <p className="text-center text-sm text-white/60 mt-8">
            Don't have an account yet?{" "}
            <Link
              to="/signup"
              className="font-medium text-white hover:text-blue-200 focus:outline-none focus:underline transition-colors"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
