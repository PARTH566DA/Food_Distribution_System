const Notification = () => {
  // Sample notification items - replace with actual data from API
  const notifications = [
    {
      id: 1,
      type: 'success',
      title: 'Food donation confirmed',
      message: 'Your food listing has been confirmed and is now available for pickup.',
      time: '2 hours ago'
    },
    {
      id: 2,
      type: 'success',
      title: 'Food donation confirmed',
      message: 'Your food listing has been confirmed and is now available for pickup.',
      time: '2 hours ago'
    },
    {
      id: 3,
      type: 'success',
      title: 'Food donation confirmed',
      message: 'Your food listing has been confirmed and is now available for pickup.',
      time: '2 hours ago'
    },
    {
      id: 4,
      type: 'success',
      title: 'Food donation confirmed',
      message: 'Your food listing has been confirmed and is now available for pickup.',
      time: '2 hours ago'
    },
    {
      id: 5,
      type: 'success',
      title: 'Food donation confirmed',
      message: 'Your food listing has been confirmed and is now available for pickup.',
      time: '2 hours ago'
    },
    {
      id: 6,
      type: 'location',
      title: 'New pickup location',
      message: 'A volunteer is nearby and ready to collect donations.',
      time: '5 hours ago'
    }
  ];

  const renderIcon = (type) => {
    if (type === 'location') {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="#FF8B77" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
        </svg>
      );
    }
    return (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="#FF8B77" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
      </svg>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto">
      {notifications.length > 0 ? (
        <div className="flex flex-col gap-3">
          {notifications.map((notification) => (
            <div key={notification.id} className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-[#FED0CB] flex items-center justify-center shrink-0">
                  {renderIcon(notification.type)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[#6B5454]">{notification.title}</p>
                  <p className="text-xs text-[#C0ABA6] mt-1">{notification.message}</p>
                  <p className="text-xs text-[#D9C7C3] mt-2">{notification.time}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-full py-12">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#C0ABA6" className="w-16 h-16 mb-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
          </svg>
          <p className="text-[#C0ABA6] text-sm">No notifications yet</p>
        </div>
      )}
    </div>
  );
};

export default Notification;
