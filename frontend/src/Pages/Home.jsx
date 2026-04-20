import MainLayout from "../Layout/MainLayout";
import Feed from "../component/Feed";

const Home = () => {
  return (
    <MainLayout activeHref="/home">
      <div className="mx-auto mt-3 mb-2 h-[calc(100%-12px)] w-full max-w-4xl overflow-auto rounded-[20px] px-1 md:mt-[24px] md:mb-[12px] md:h-[calc(100%-24px)] md:w-[60%] md:rounded-[25px] md:px-0">
        <Feed />
      </div>
    </MainLayout>
  );
};

export default Home;
