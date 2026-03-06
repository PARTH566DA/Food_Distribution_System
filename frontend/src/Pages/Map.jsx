import MainLayout from "../Layout/MainLayout";

const Map = () => {
  return (
    <MainLayout activeHref="/map">
      <div className="flex h-full w-full items-center justify-center">
        <div className="rounded-2xl bg-white/40 p-8 backdrop-blur-sm">
          <h1 className="text-3xl font-semibold">Map</h1>
        </div>
      </div>
    </MainLayout>
  );
};

export default Map;
