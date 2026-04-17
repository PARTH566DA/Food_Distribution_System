import React from 'react';
import Grainient from '../component/Gradient';
import GlassSurface from '../component/GlassSurface';

const Temp = () => {
  return (
    <div className="relative w-full h-screen overflow-hidden">

      <div className="w-full h-full absolute top-0 left-0">
        <Grainient
          color1="#afafaf"
          color2="#ffc7ad"
          color3="#f88ca6"
          timeSpeed={0.5}
          colorBalance={-0.02}
          warpStrength={1.35}
          warpFrequency={5}
          warpSpeed={2}
          warpAmplitude={50}
          blendAngle={0}
          blendSoftness={0.3}
          rotationAmount={890}
          noiseScale={2.25}
          grainAmount={0.1}
          grainScale={2}
          grainAnimated={false}
          contrast={1.5}
          gamma={1}
          saturation={1}
          centerX={0}
          centerY={0}
          zoom={1.65}
        />
      </div>

      <div className="absolute top-[12px] left-[12px] right-[12px] w-auto h-[80px]">
          <GlassSurface
            width="100%"
            height={80}
            borderRadius={25}
            blur={30}
            backgroundOpacity={0.5}
            opacity={0.5}
            className="w-full"
          >
            <div className="flex items-center justify-between px-20 w-full h-full">
              <div className="text-xl font-bold text-white drop-shadow-md">
                Food Distribution
              </div>
              <div className="text-base text-white/90 font-medium drop-shadow-md">
                Dashboard
              </div>
            </div>
          </GlassSurface>
      </div>



    </div>
  );
};

export default Temp;