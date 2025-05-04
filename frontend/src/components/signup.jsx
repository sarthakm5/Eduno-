import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import Modal from "react-modal";
import { FaEye, FaEyeSlash } from "react-icons/fa";

// Bind modal to appElement for accessibility
Modal.setAppElement('#root');

function Signup() {
  const [fullname, setFullname] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rePassword, setRePassword] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showRePassword, setShowRePassword] = useState(false);
  const navigate = useNavigate();

  const validatePassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (password.length < minLength) {
      return "Password must be at least 8 characters long";
    }
    if (!hasUpperCase) {
      return "Password must contain at least one uppercase letter";
    }
    if (!hasLowerCase) {
      return "Password must contain at least one lowercase letter";
    }
    if (!hasNumber) {
      return "Password must contain at least one number";
    }
    if (!hasSpecialChar) {
      return "Password must contain at least one special character";
    }
    return "";
  };

  const handleSignup = async () => {
    setErrors({});
    setLoading(true);

    // Validation - trim only during validation, not during input
    let newErrors = {};
    if (!fullname.trim()) newErrors.fullname = "Full name is required";
    if (!username.trim()) newErrors.username = "Username is required";
    if (!password) newErrors.password = "Password is required";
    else {
      const passwordError = validatePassword(password);
      if (passwordError) newErrors.password = passwordError;
    }
    if (password !== rePassword) newErrors.rePassword = "Passwords don't match";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      toast.error("Please fix the errors in the form");
      return;
    }

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API}/api/register`,
        { fullname: fullname.trim(), username: username.trim(), password },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.usertoken) {
        localStorage.setItem('edunotoken', response.data.usertoken);
        toast.success("Account created successfully!");
        
        setIsSuccessModalOpen(true);
        
        setTimeout(() => {
          navigate("/uploadprofilepic");
        }, 2000);
      } else {
        throw new Error("Registration successful but no token received");
      }
    } catch (error) {
      console.error("Signup error:", error);
      const errorMessage = error.response?.data?.message || "Signup failed. Please try again.";
      setErrors({ api: errorMessage });
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const closeSuccessModal = () => {
    setIsSuccessModalOpen(false);
    navigate("/uploadprofilepic");
  };

  return (
    <div className="flex justify-center items-center h-screen bg-white">
      <Toaster position="top-center" reverseOrder={false} />
      
      <Modal
        isOpen={isSuccessModalOpen}
        onRequestClose={closeSuccessModal}
        contentLabel="Signup Success Modal"
        className="modal"
        overlayClassName="modal-overlay"
      >
        <div className="bg-white p-8 rounded-lg w-96 max-w-full text-center">
          <h2 className="text-2xl font-semibold mb-4">🎉 Welcome to Eduno!</h2>
          <p className="mb-6">Your account has been created successfully.</p>
          <button
            onClick={closeSuccessModal}
            className="bg-blue-600 text-white py-2 px-6 rounded-md font-semibold hover:bg-blue-700"
          >
            Get Started
          </button>
        </div>
      </Modal>

      <div className="bg-white p-8 rounded-lg w-96 border-2 border-black font-poppins">
        <h2 className="text-3xl font-semibold text-center mb-2">Eduno</h2>
        <p className="text-gray-500 text-center mb-6 mt-8">
          Create an account to get started
        </p>

        <input
          type="text"
          placeholder="Full Name"
          className={`w-full px-4 py-2 border rounded-md mb-1 focus:outline-2 ${
            errors.fullname ? "border-red-500" : "border-gray-300 outline-blue-600"
          }`}
          value={fullname}
          onChange={(e) => setFullname(e.target.value)}  {/* Removed .trim() here */}
        />
        {errors.fullname && <p className="text-red-500 text-sm">{errors.fullname}</p>}

        <input
          type="text"
          placeholder="Username"
          className={`w-full px-4 py-2 border rounded-md mb-1 focus:outline-2 mt-4 ${
            errors.username ? "border-red-500" : "border-gray-300 outline-blue-600"
          }`}
          value={username}
          onChange={(e) => setUsername(e.target.value.trim())}
        />
        {errors.username && <p className="text-red-500 text-sm">{errors.username}</p>}

        <div className="relative mt-4">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
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

        <div className="relative mt-4">
          <input
            type={showRePassword ? "text" : "password"}
            placeholder="Re-enter Password"
            className={`w-full px-4 py-2 border rounded-md mb-1 focus:outline-2 ${
              errors.rePassword ? "border-red-500" : "border-gray-300 outline-blue-600"
            }`}
            value={rePassword}
            onChange={(e) => setRePassword(e.target.value)}
          />
          <button
            type="button"
            className="absolute right-3 top-2.5 text-gray-500 hover:text-blue-600"
            onClick={() => setShowRePassword(!showRePassword)}
            aria-label={showRePassword ? "Hide password" : "Show password"}
          >
            {showRePassword ? <FaEyeSlash /> : <FaEye />}
          </button>
        </div>
        {errors.rePassword && <p className="text-red-500 text-sm">{errors.rePassword}</p>}

        {errors.api && (
          <p className="text-red-500 text-sm text-center mt-2">
            {errors.api}
          </p>
        )}

        <button
          onClick={handleSignup}
          className="w-full bg-blue-600 text-white py-2 rounded-md font-semibold hover:bg-blue-700 mt-4 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Creating account..." : "Sign Up"}
        </button>

        <p className="text-center text-sm mt-6">
          Already have an account?{" "}
          <Link 
            to="/login" 
            className="text-blue-600 cursor-pointer hover:underline"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Signup;
