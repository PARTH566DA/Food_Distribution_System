import Gradient from "../component/Gradient";
import GlassSurface from "../component/GlassSurface";

const defaultGradientProps = {
  color1: "#f3e4d5",
  color2: "#ffc7ad",
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
  zoom: 1.65
};

const MainLayout = ({
  children,
  gradientProps = {},
  title = "Food Distribution",
  subtitle = "Dashboard",
}) => {
  return (
    <div className="relative h-full w-full overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full">
        <Gradient {...defaultGradientProps} {...gradientProps} />
      </div>

      <div className="relative z-10 flex h-full w-full flex-col px-3 pb-3">
        <header className="pointer-events-none">
          <div className="absolute top-[12px] left-[12px] right-[12px] h-[80px] min-h-[80px]">
            <GlassSurface
              width="100%"
              height={80}
              borderRadius={25}
              blur={30}
              backgroundOpacity={0.5}
              opacity={0.5}
              className="pointer-events-auto h-full w-full"
            >
            </GlassSurface>
          </div>
        </header>
        <main className="mt-[120px] flex-1">{children}</main>
      </div>
    </div>
  );
};

export default MainLayout;
