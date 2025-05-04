import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa"; // Import eye icons
import toast, { Toaster } from "react-hot-toast";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    setErrors({});
    setLoading(true);

    // Validation checks
    let newErrors = {};
    if (!username) newErrors.username = "Username is required.";
    if (!password) newErrors.password = "Password is required.";

    if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        setLoading(false);
        toast.error("Please fill in all fields");
        return;
    }

    try {
        const response = await axios.post(
            `${import.meta.env.VITE_API}/api/login`,
            { username, password }
        );

        if (response.data.token) {
            localStorage.setItem("edunotoken", response.data.token);
            // Store user data if needed
            if (response.data.user) {
                localStorage.setItem("currentUser", JSON.stringify(response.data.user));
            }
            toast.success("Login successful!");
            navigate("/"); // Redirect to home page after successful login
        } else {
            throw new Error("No token received");
        }
    } catch (error) {
        console.error("Login error:", error.response?.data || error.message);
        setErrors({
            api: error.response?.data?.message || "Login failed. Please try again.",
        });
        toast.error(error.response?.data?.message || "Login failed. Please try again.");
    } finally {
        setLoading(false);
    }
};

  return (
    <div className="flex justify-center items-center h-screen bg-white">
      <Toaster position="top-center" reverseOrder={false} />
      
      <div className="bg-white p-8 rounded-lg w-96 border-2 border-black font-poppins">
        <h2 className="text-3xl font-semibold text-center mb-2">Eduno</h2>
        <p className="text-gray-500 text-center mb-6 mt-8">
          Login to get the best notes from your friends
        </p>

        {/* Username Input */}
        <input
          type="text"
          placeholder="Enter your username"
          className={`w-full px-4 py-2 border rounded-md mb-1 focus:outline-2 ${
            errors.username ? "border-red-500" : "border-gray-300 outline-blue-600"
          }`}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        {errors.username && <p className="text-red-500 text-sm">{errors.username}</p>}

        {/* Password Input with toggle */}
        <div className="relative mt-4">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            className={`w-full px-4 py-2 border rounded-md mb-1 focus:outline-2 ${
              errors.password ? "border-red-500" : "border-gray-300 outline-blue-600"
            }`}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            className="absolute right-3 top-2.5 text-gray-500 hover:text-blue-600"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </button>
        </div>
        {errors.password && <p className="text-red-500 text-sm">{errors.password}</p>}

        {/* API Error Message */}
        {errors.api && (
          <p className="text-red-500 text-sm text-center mt-2">
            {errors.api}
          </p>
        )}

        {/* Login Button */}
        <button
          onClick={handleLogin}
          className="w-full bg-blue-600 text-white py-2 rounded-md font-semibold hover:bg-blue-700 mt-4 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <p className="text-center text-sm mt-6">
          Don't have an account?{" "}
          <Link 
            to="/signup" 
            className="text-blue-600 cursor-pointer hover:underline"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;