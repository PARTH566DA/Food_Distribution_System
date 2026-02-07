import React from 'react';
import MainLayout from '../Layout/MainLayout';

const gradientSettings = {
  color1: '#afafaf',
  color2: '#ffc7ad',
  color3: '#f88ca6',
  timeSpeed: 0.5,
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

const Temp = () => {
  return (
    <MainLayout gradientProps={gradientSettings}>
      <section className="flex h-full flex-col justify-center text-center text-white">
        <p className="text-lg font-medium text-white/90">Content goes here</p>
      </section>
    </MainLayout>
  );
};

export default Temp;