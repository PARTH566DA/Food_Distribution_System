import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Gradient from "../component/Gradient";
import { loginSendOtp, loginVerify, saveSession } from "../api/auth";

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

const Login = () => {
    const navigate = useNavigate();

    const [emailId, setEmailId] = useState("");
    const [otp, setOtp] = useState("");

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSendOtp = async (e) => {
        e.preventDefault();
        setError("");
        if (!emailId.trim()) {
            setError("Please enter your email address.");
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailId.trim())) {
            setError("Enter a valid email address.");
            return;
        }
        setLoading(true);
        try {
            await loginSendOtp(emailId.trim());
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
            const res = await loginVerify(emailId.trim(), otp.trim());
            saveSession(res.data);
            navigate("/home");
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

                    {/* Step indicator */}
                    <div className="flex items-center gap-2">
                        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step >= 1 ? "bg-[#FF8B77] text-white" : "bg-[#E8D8D3] text-gray-400"}`}>1</span>
                        <div className={`flex-1 h-0.5 ${step >= 2 ? "bg-[#FF8B77]" : "bg-[#E8D8D3]"}`} />
                        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step >= 2 ? "bg-[#FF8B77] text-white" : "bg-[#E8D8D3] text-gray-400"}`}>2</span>
                    </div>

                    <h1 className="text-3xl font-bold text-gray-900">
                        {step === 1 ? "Login" : "Verify Email"}
                    </h1>

                    {step === 1 ? (
                        <div className="flex flex-col gap-8 mt-2">
                            <input
                                type="text"
                                inputMode="email"
                                placeholder="Email ID"
                                value={emailId}
                                onChange={(e) => setEmailId(e.target.value)}
                                className="bg-transparent border-b border-[#D9C7C3] outline-none text-gray-700 placeholder-[#C0ABA6] py-2 text-base"
                            />

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
                                    Don&apos;t have an account?{" "}
                                    <span
                                        className="font-bold text-gray-800 cursor-pointer"
                                        onClick={() => navigate("/signup")}
                                    >
                                        Sign Up
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
                                    {loading ? "Verifying…" : "Login"}
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

export default Login;
