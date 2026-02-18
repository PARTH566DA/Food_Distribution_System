import Gradient from "../component/Gradient";
import GlassSurface from "../component/GlassSurface";
import PillNav from "../component/PillNav";

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

const MainLayout = ({
    children,
    gradientProps = {},
    navItems = [
        { label: "Home", href: "/home" },
        { label: "Add Food", href: "/addfood" },
        { label: "Notification", href: "/notification" }
    ],
    activeHref = "/",
}) => {
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
                            className="w-full h-full rounded-[25px] flex items-center justify-center"
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
                <main className="mt-[64px] flex-1 overflow-auto rounded-3xl">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default MainLayout;