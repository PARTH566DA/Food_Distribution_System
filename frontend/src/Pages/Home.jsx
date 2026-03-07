import MainLayout from "../Layout/MainLayout";
import Feed from "../component/Feed";

const Home = () => {
  return (
    <MainLayout activeHref="/home">
      <div className="flex h-full w-full items-start justify-center py-6">
        <div className="w-[60%] max-w-4xl">
          <Feed />
        </div>
      </div>
    </MainLayout>
  );
};

export default Home;
