import MainLayout from "../Layout/MainLayout";

const AddFood = () => {
  return (
    <MainLayout activeHref="/addfood">
      <div className="flex h-full w-full items-center justify-center">
        <div className="rounded-2xl bg-white/40 p-8 backdrop-blur-sm">
          <h1 className="text-3xl font-semibold">Add Food</h1>
          <p className="mt-2 text-sm">Use this page to create new food listings.</p>
        </div>
      </div>
    </MainLayout>
  );
};

export default AddFood;
