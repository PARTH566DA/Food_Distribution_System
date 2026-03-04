import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Gradient from "../component/Gradient";
import { signUpSendOtp, signUpVerify } from "../api/auth";

const gradientProps = {
    color1: "#faaca2",
    color2: "#fcb594",
    color3: "#f88ca6",
    timeSpeed: 2.35,
    colorBalance: -0.02,
    warpStrength: 1.35,
    warpFrequency: 5,
    warpSpeed: 2,
    warpAmplitude: 50,
    blendAngle: 0,
    blendSoftness: 0.3,
    rotationAmount: 890,
    noiseScale: 2.25,
    grainAmount: 0.1,
    grainScale: 2,
    grainAnimated: false,
    contrast: 1.5,
    gamma: 1,
    saturation: 1,
    centerX: 0,
    centerY: 0,
    zoom: 1.65,
};

const ROLES = ["CITIZEN", "NGO"];

const SignUp = () => {
    const navigate = useNavigate();

    // Step 1 fields
    const [userName, setUserName] = useState("");
    const [mobileNumber, setMobileNumber] = useState("");
    const [emailId, setEmailId] = useState("");
    const [role, setRole] = useState("CITIZEN");

    // Step 2 field
    const [otp, setOtp] = useState("");

    // UI state
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSendOtp = async (e) => {
        e.preventDefault();
        setError("");
        if (!userName.trim() || !mobileNumber.trim() || !emailId.trim()) {
            setError("Please fill in all fields.");
            return;
        }
        if (!/^\d{10}$/.test(mobileNumber.trim())) {
            setError("Enter a valid 10-digit mobile number.");
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailId.trim())) {
            setError("Enter a valid email address.");
            return;
        }
        setLoading(true);
        try {
            await signUpSendOtp(userName.trim(), mobileNumber.trim(), emailId.trim(), role);
            setStep(2);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setError("");
        if (!otp.trim()) {
            setError("Please enter the OTP.");
            return;
        }
        setLoading(true);
        try {
            const res = await signUpVerify(emailId.trim(), otp.trim());
            // Persist user in localStorage
            localStorage.setItem("user", JSON.stringify(res.data));
            navigate("/");
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen w-full overflow-hidden">
            {/* Gradient Background */}
            <div className="absolute inset-0">
                <Gradient {...gradientProps} />
            </div>

            {/* Content */}
            <div className="relative z-10 flex h-screen w-full items-center justify-center">
                <div className="absolute top-1/2 left-1/2 transform -translate-y-1/2 w-[43.75%] min-w-[320px] bg-[#FFF5F2] rounded-[25px] px-10 py-12 flex flex-col gap-6 shadow-sm">
                    <h1 className="text-3xl font-bold text-gray-900">
                        {step === 1 ? "Sign Up" : "Verify Email"}
                    </h1>

                    {/* Step indicator */}
                    <div className="flex items-center gap-2">
                        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step >= 1 ? "bg-[#FF8B77] text-white" : "bg-[#E8D8D3] text-gray-400"}`}>1</span>
                        <div className={`flex-1 h-0.5 ${step >= 2 ? "bg-[#FF8B77]" : "bg-[#E8D8D3]"}`} />
                        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step >= 2 ? "bg-[#FF8B77] text-white" : "bg-[#E8D8D3] text-gray-400"}`}>2</span>
                    </div>

                    {step === 1 ? (
                        <div className="flex flex-col gap-8 mt-2">
                            <input
                                type="text"
                                placeholder="Full Name"
                                value={userName}
                                onChange={(e) => setUserName(e.target.value)}
                                className="bg-transparent border-b border-[#D9C7C3] outline-none text-gray-700 placeholder-[#C0ABA6] py-2 text-base"
                            />
                            <input
                                type="text"
                                inputMode="numeric"
                                placeholder="Mobile Number"
                                value={mobileNumber}
                                onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                                className="bg-transparent border-b border-[#D9C7C3] outline-none text-gray-700 placeholder-[#C0ABA6] py-2 text-base"
                            />
                            <input
                                type="text"
                                inputMode="email"
                                placeholder="Email ID"
                                value={emailId}
                                onChange={(e) => setEmailId(e.target.value)}
                                className="bg-transparent border-b border-[#D9C7C3] outline-none text-gray-700 placeholder-[#C0ABA6] py-2 text-base"
                            />

                            {/* Role selector */}
                            <div className="flex flex-col gap-1">
                                <div className="flex gap-3">
                                    {ROLES.map((r) => (
                                        <button
                                            key={r}
                                            type="button"
                                            onClick={() => setRole(r)}
                                            className={`flex-1 py-2 rounded-full text-sm font-semibold border transition-colors ${
                                                role === r
                                                    ? "bg-[#FF8B77] text-white border-[#FF8B77]"
                                                    : "bg-transparent text-[#C0ABA6] border-[#D9C7C3] hover:border-[#FF8B77]"
                                            }`}
                                        >
                                            {r.charAt(0) + r.slice(1).toLowerCase()}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {error && <p className="text-red-500 text-sm -mt-4">{error}</p>}

                            <div className="flex flex-col gap-3">
                                <button
                                    type="button"
                                    disabled={loading}
                                    onClick={handleSendOtp}
                                    className="w-full py-4 rounded-full bg-[#FF8B77] text-white font-semibold text-base hover:bg-[#d9735a] transition-colors disabled:opacity-60"
                                >
                                    {loading ? "Sending OTP…" : "Send OTP"}
                                </button>
                                <p className="text-center text-sm text-gray-500">
                                    Already have an account?{" "}
                                    <span
                                        className="font-bold text-gray-800 cursor-pointer"
                                        onClick={() => navigate("/login")}
                                    >
                                        Login
                                    </span>
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-8 mt-2">
                            <p className="text-sm text-gray-500 -mt-2">
                                We sent a 6-digit OTP to{" "}
                                <span className="font-semibold text-gray-700">{emailId}</span>.
                            </p>

                            <input
                                type="text"
                                placeholder="Enter OTP"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                maxLength={6}
                                className="bg-transparent border-b border-[#D9C7C3] outline-none text-gray-700 placeholder-[#C0ABA6] py-2 text-base tracking-[0.5em] text-center"
                            />

                            {error && <p className="text-red-500 text-sm -mt-4">{error}</p>}

                            <div className="flex flex-col gap-3">
                                <button
                                    type="button"
                                    disabled={loading}
                                    onClick={handleVerifyOtp}
                                    className="w-full py-4 rounded-full bg-[#FF8B77] text-white font-semibold text-base hover:bg-[#d9735a] transition-colors disabled:opacity-60"
                                >
                                    {loading ? "Verifying…" : "Verify & Create Account"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setStep(1); setOtp(""); setError(""); }}
                                    className="text-sm text-center text-[#C0ABA6] hover:text-gray-600 transition-colors"
                                >
                                    ← Back
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SignUp;
