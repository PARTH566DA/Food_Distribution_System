import MainLayout from "../Layout/MainLayout";

const Home = () => {
  return (
    <MainLayout activeHref="/">
      <div className="flex h-full w-full items-center justify-center">
        <div className="rounded-2xl bg-white/40 p-8 backdrop-blur-sm">
          <h1 className="text-3xl font-semibold">Home</h1>
          <p className="mt-2 text-sm">Welcome to the Food Distribution System dashboard.</p>
        </div>
      </div>
    </MainLayout>
  );
};

export default Home;
