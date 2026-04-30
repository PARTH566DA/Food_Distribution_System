import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import Gradient from "../component/Gradient";
import GlassSurface from "../component/GlassSurface";
import PillNav from "../component/PillNav";
import { clearSession, getUser } from "../api/auth";
import Notification from "../Pages/Notification";
import Profile from "../Pages/Profile";

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

const NAV_BY_ROLE = {
    CITIZEN:   [
        { label: "Home",         href: "/home" },
        { label: "Add Food",     href: "/addfood" },
        { label: "Map", href: "/map" },
        { label: "History",      href: "/history" },
    ],
    NGO:       [
        { label: "Home",         href: "/home" },
        { label: "Map", href: "/map" },
        { label: "History",      href: "/history" },
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
    { label: "History",      href: "/history" },
];

const MainLayout = ({
    children,
    gradientProps = {},
    activeHref = "/",
}) => {
    const navigate = useNavigate();
    const [currentUser, setCurrentUser] = useState(getUser());
    const navItems = (currentUser && NAV_BY_ROLE[currentUser.role]) || DEFAULT_NAV;
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const notificationPanelRef = useRef(null);
    const profilePanelRef = useRef(null);

    const handleLogout = () => {
        clearSession();
        navigate("/login", { replace: true });
    };

    const toggleNotification = () => {
        setIsProfileOpen(false);
        setIsNotificationOpen(!isNotificationOpen);
    };

    const toggleProfile = () => {
        setIsNotificationOpen(false);
        setIsProfileOpen(!isProfileOpen);
    };

    useEffect(() => {
        if (!isNotificationOpen && !isProfileOpen) return;

        const handleOutsideClick = (event) => {
            const clickedInsideNotification = notificationPanelRef.current?.contains(event.target);
            const clickedInsideProfile = profilePanelRef.current?.contains(event.target);
            if (clickedInsideNotification || clickedInsideProfile) return;
            setIsNotificationOpen(false);
            setIsProfileOpen(false);
        };

        document.addEventListener("mousedown", handleOutsideClick);
        return () => document.removeEventListener("mousedown", handleOutsideClick);
    }, [isNotificationOpen, isProfileOpen]);

    return (
        <div className="relative min-h-[100dvh] w-full overflow-hidden bg-white">
            <div className="absolute top-0 left-0 w-full h-full">
                <Gradient {...defaultGradientProps} {...gradientProps} />
            </div>

            <div className="relative z-10 flex h-full w-full flex-col p-2 md:p-4">

                <header className="relative z-50">
                    <div className="absolute top-[calc(env(safe-area-inset-top,0px)+8px)] left-[8px] right-[8px] h-[64px] md:top-[12px] md:left-[12px] md:right-[12px] md:h-[80px]">
                        <div 
                            className="w-full h-full rounded-[20px] md:rounded-[25px] flex items-center justify-center px-2 md:px-5"
                            style={{ backgroundColor: '#FFECEA' }}
                        >
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

                <main className={`relative z-10 mt-[calc(env(safe-area-inset-top,0px)+72px)] md:mt-[92px] flex-1 overflow-auto rounded-2xl md:rounded-3xl pb-16 md:pb-0 transition-opacity duration-300 ${isNotificationOpen || isProfileOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                    {children}
                </main>

                {currentUser && (
                    <div
                        ref={notificationPanelRef}
                        className={`
                            fixed z-40 bg-[#FFECEA] rounded-[25px] shadow-lg
                            transition-all duration-500 ease-in-out
                            ${isNotificationOpen 
                                ? 'left-1/2 top-[80px] bottom-[8px] w-[96%] -translate-x-1/2 md:top-[105px] md:bottom-[12px] md:w-[60%]' 
                                : 'fixed right-3 bottom-[calc(env(safe-area-inset-bottom,0px)+12px)] w-11 h-11 md:bottom-[90px] md:left-5 md:right-auto md:w-12 md:h-12'
                            }
                        `}
                    >
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

                        {isNotificationOpen && (
                            <div className="w-full h-full p-6 flex flex-col">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl md:text-2xl font-bold text-[#6B5454]">Notifications</h2>
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

                                <Notification />
                            </div>
                        )}
                    </div>
                )}

                {currentUser && isProfileOpen && (
                    <div
                        ref={profilePanelRef}
                        className="fixed z-40 bg-[#FFECEA] rounded-[20px] md:rounded-[25px] shadow-lg left-1/2 top-[80px] bottom-[8px] w-[96%] -translate-x-1/2 md:top-[105px] md:bottom-[12px] md:w-[60%]"
                    >
                        <Profile
                            user={currentUser}
                            onClose={() => setIsProfileOpen(false)}
                            onLogout={handleLogout}
                            onProfileSaved={setCurrentUser}
                        />
                    </div>
                )}

                {currentUser && (
                    <button
                        type="button"
                        onClick={toggleProfile}
                        className="fixed left-3 z-30 flex items-center gap-2 bg-[#FFECEA] rounded-2xl px-3 py-2.5 md:px-4 md:py-3 shadow-md hover:bg-[#FED0CB] transition-colors md:left-5 md:bottom-5"
                        style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}
                    >
                        <div className="w-8 h-8 rounded-full bg-[#FED0CB] flex items-center justify-center shrink-0">
                            <span className="text-sm font-bold text-[#FF8B77]">
                                {currentUser.userName.charAt(0).toUpperCase()}
                            </span>
                        </div>

                        <div className="hidden md:flex flex-col leading-tight">
                            <span className="text-xs font-semibold text-[#6B5454] max-w-[110px] truncate">
                                {currentUser.userName}
                            </span>
                            <span className="text-[10px] text-[#C0ABA6]">
                                {currentUser.role.charAt(0) + currentUser.role.slice(1).toLowerCase()}
                            </span>
                        </div>

                        <div className="hidden md:block w-px h-6 bg-[#D9C7C3] mx-1" />

                        <span
                            role="button"
                            tabIndex={0}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleLogout();
                            }}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleLogout();
                                }
                            }}
                            className="hidden md:inline text-xs font-semibold text-[#9B7B75] hover:text-[#FF8B77] transition-colors"
                        >
                            Logout
                        </span>

                    </button>
                )}
            </div>
        </div>
    );
};

export default MainLayout;