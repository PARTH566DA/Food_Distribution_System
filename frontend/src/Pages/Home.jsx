import MainLayout from "../Layout/MainLayout";
import Feed from "../component/Feed";

const Home = () => {
  return (
    <MainLayout activeHref="/home">
      <div className="mx-auto mt-[24px] mb-[12px] h-[calc(100%-24px)] w-[60%] max-w-4xl overflow-auto rounded-[25px]">
        <Feed />
      </div>
    </MainLayout>
  );
};

export default Home;
