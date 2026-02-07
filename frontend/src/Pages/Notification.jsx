import MainLayout from "../Layout/MainLayout";

const Notification = () => {
  return (
    <MainLayout activeHref="/notification">
      <div className="flex h-full w-full items-center justify-center">
        <div className="rounded-2xl bg-white/40 p-8 backdrop-blur-sm">
          <h1 className="text-3xl font-semibold">Notifications</h1>
          <p className="mt-2 text-sm">View recent notifications and alerts here.</p>
        </div>
      </div>
    </MainLayout>
  );
};

export default Notification;
