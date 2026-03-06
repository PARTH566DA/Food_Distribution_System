import { useNavigate } from "react-router-dom";
import { useState } from "react";
import Gradient from "../component/Gradient";
import GlassSurface from "../component/GlassSurface";
import PillNav from "../component/PillNav";
import { clearSession, getUser } from "../api/auth";
import Notification from "../Pages/Notification";

const defaultGradientProps = {
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

// Role-based navigation items
const NAV_BY_ROLE = {
    CITIZEN:   [
        { label: "Home",         href: "/home" },
        { label: "Add Food",     href: "/addfood" },
        { label: "Map", href: "/map" },
    ],
    NGO:       [
        { label: "Home",         href: "/home" },
        { label: "Map", href: "/map" },
    ],
    VOLUNTEER: [
        { label: "Home",         href: "/home" },
        { label: "Map", href: "/map" },
    ],
    ADMIN:     [
        { label: "Home",         href: "/home" },
        { label: "Add Food",     href: "/addfood" },
        { label: "Map", href: "/map" },
    ],
};

const DEFAULT_NAV = [
    { label: "Home",         href: "/home" },
    { label: "Add Food",     href: "/addfood" },
    { label: "Map", href: "/map" },
];

const MainLayout = ({
    children,
    gradientProps = {},
    activeHref = "/",
}) => {
    const navigate = useNavigate();
    const user = getUser();
    const navItems = (user && NAV_BY_ROLE[user.role]) || DEFAULT_NAV;
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);

    const handleLogout = () => {
        clearSession();
        navigate("/login", { replace: true });
    };

    const toggleNotification = () => {
        setIsNotificationOpen(!isNotificationOpen);
    };

    return (
        <div className="relative h-screen w-full overflow-hidden bg-white">
            {/* 1. Background Gradient */}
            <div className="absolute top-0 left-0 w-full h-full">
                <Gradient {...defaultGradientProps} {...gradientProps} />
            </div>

            {/* 2. Content Layer */}
            <div className="relative z-10 flex h-full w-full flex-col p-4">

                {/* Header Area */}
                <header className="">
                    {/* Solid Bar background */}
                    <div className="absolute top-[12px] left-[12px] right-[12px] h-[80px]">
                        <div 
                            className="w-full h-full rounded-[25px] flex items-center justify-center px-5"
                            style={{ backgroundColor: '#FFECEA' }}
                        >
                        {/* Centered Pill Navigation */}
                        <div className="relative z-20 flex items-center justify-center">
                            <PillNav
                                items={navItems}
                                activeHref={activeHref}
                                pillColor="#FED0CB"
                                pillTextColor="#6B5454"
                                hoveredPillTextColor="#6B5454"
                            />
                        </div>
                        </div>
                    </div>
                </header>

                {/* Main Content Area */}
                <main className={`mt-[64px] flex-1 overflow-auto rounded-3xl transition-opacity duration-300 ${isNotificationOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                    {children}
                </main>

                {/* Notification Button / Panel */}
                {user && (
                    <div
                        className={`
                            fixed z-40 bg-[#FFECEA] rounded-[25px] shadow-lg
                            transition-all duration-500 ease-in-out
                            ${isNotificationOpen 
                                ? 'left-[12px] right-[12px] top-[105px] bottom-[12px]' 
                                : 'bottom-[90px] left-5 w-12 h-12'
                            }
                        `}
                    >
                        {/* Notification Button (visible when collapsed) */}
                        {!isNotificationOpen && (
                            <button
                                onClick={toggleNotification}
                                className="w-full h-full flex items-center justify-center rounded-2xl bg-[#FFECEA] hover:bg-[#FED0CB] transition-colors"
                            >
                                <svg 
                                    xmlns="http://www.w3.org/2000/svg" 
                                    fill="none" 
                                    viewBox="0 0 24 24" 
                                    strokeWidth={2} 
                                    stroke="#6B5454" 
                                    className="w-6 h-6"
                                >
                                    <path 
                                        strokeLinecap="round" 
                                        strokeLinejoin="round" 
                                        d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" 
                                    />
                                </svg>
                            </button>
                        )}

                        {/* Notification Panel Content (visible when expanded) */}
                        {isNotificationOpen && (
                            <div className="w-full h-full p-6 flex flex-col">
                                {/* Header with close button */}
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-2xl font-bold text-[#6B5454]">Notifications</h2>
                                    <button
                                        onClick={toggleNotification}
                                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#FED0CB] transition-colors"
                                    >
                                        <svg 
                                            xmlns="http://www.w3.org/2000/svg" 
                                            fill="none" 
                                            viewBox="0 0 24 24" 
                                            strokeWidth={2} 
                                            stroke="#6B5454" 
                                            className="w-6 h-6"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Notification List */}
                                <Notification />
                            </div>
                        )}
                    </div>
                )}

                {/* Floating profile + logout – bottom-left */}
                {user && (
                    <div className="absolute bottom-5 left-5 z-30 flex items-center gap-2 bg-[#FFECEA] rounded-2xl px-4 py-3 shadow-md">
                        {/* Avatar circle */}
                        <div className="w-8 h-8 rounded-full bg-[#FED0CB] flex items-center justify-center shrink-0">
                            <span className="text-sm font-bold text-[#FF8B77]">
                                {user.userName.charAt(0).toUpperCase()}
                            </span>
                        </div>

                        {/* Name + role */}
                        <div className="flex flex-col leading-tight">
                            <span className="text-xs font-semibold text-[#6B5454] max-w-[110px] truncate">
                                {user.userName}
                            </span>
                            <span className="text-[10px] text-[#C0ABA6]">
                                {user.role.charAt(0) + user.role.slice(1).toLowerCase()}
                            </span>
                        </div>

                        {/* Divider */}
                        <div className="w-px h-6 bg-[#D9C7C3] mx-1" />

                        {/* Logout button */}
                        <button
                            onClick={handleLogout}
                            className="text-xs font-semibold text-[#9B7B75] hover:text-[#FF8B77] transition-colors"
                        >
                            Logout
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MainLayout;