import VegIcon from '../assets/veg-logo.png';
import NonVegIcon from '../assets/non-veg-logo.png';

const FeedItem = ({ item, onClaim }) => {
    const formatTimeAgo = (dateString) => {
        const now = new Date();
        const itemDate = new Date(dateString);
        const diffInMinutes = Math.floor((now - itemDate) / (1000 * 60));

        if (diffInMinutes < 60) {
            return `${diffInMinutes}m ago`;
        } else if (diffInMinutes < 1440) {
            return `${Math.floor(diffInMinutes / 60)}h ago`;
        } else {
            return `${Math.floor(diffInMinutes / 1440)}d ago`;
        }
    };

    const getExpiryTime = (expiryString) => {
        const expiry = new Date(expiryString);
        return expiry.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const getStatusColor = () => {
        switch (item.status) {
            case 'available':
                return 'text-green-400';
            case 'claimed':
                return 'text-yellow-400';
            case 'expired':
                return 'text-red-400';
            default:
                return 'text-gray-400';
        }
    };

    const handleClaimClick = () => {
        if (onClaim && item.status === 'available') {
            onClaim(item.foodId);
        }
    };

    return (
        <div className="w-full mb-4">
            <div className="w-full overflow-hidden rounded-[25px] p-4 bg-[#FFECEA]">
                <div className="flex items-start">
                    {/* Food Image */}
                    <div className="w-[37%] h-[93%] flex-shrink-0 m-[10px] relative">

                        <div className="relative w-full h-full">
                            {/* Main Image */}
                            <img
                                src={item.imageUrl || "/placeholder-food.jpg"}
                                alt={item.description}
                                className="w-full h-full rounded-[25px] object-cover"
                                onError={(e) => {
                                    e.target.src =
                                        "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjZjNmNGY2Ii8+CjxwYXRoIGQ9Ik0xMiAxNkM4LjY5IDIgNSA1LjY5IDUgOWMwIDMuMzEgMy4zMSA3IDcgN3M3LTMuNjkgNy03YzAtMy4zMS0zLjY5LTctNy03eiIgZmlsbD0iI2Q1ZDdkYSIvPgo8L3N2Zz4K";
                                }}
                            />

                            {/* Veg / Non-Veg Icon Overlay */}
                            <div className="absolute top-3 left-3 bg-white rounded-[6px] p-1 z-10">
                                {item.vegetarian ? (
                                    <img src={VegIcon} alt="Vegetarian" className="w-5 h-5" />
                                ) : (
                                    <img src={NonVegIcon} alt="Non-Vegetarian" className="w-5 h-5" />
                                )}
                            </div>
                        </div>

                    </div>


                    {/* Food Details */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="w-[75%] mt-[10px]">
                                    <span style={{ fontWeight: '600', fontSize: '20px', color: 'black' }}>{item.description}</span>
                                </div>

                                <div className="items-center">
                                    <span style={{ fontSize: '15px', color: '#797979' }}>{item.location}</span>
                                </div>

                                <div className="w-full h-[2px] bg-[#D9D9D9] mt-[10px]"></div>

                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-black/80 text-sm font-medium">
                                        {item.quantity}
                                    </span>
                                    <span className={`text-xs font-medium uppercase tracking-wide ${getStatusColor()}`}>
                                        {item.status}
                                    </span>
                                </div>

                                <div className="text-white/60 text-sm space-y-1">
                                    <div className="flex items-center gap-4">
                                        <span className="text-white/50">
                                            Fresh: {item.expiryTime}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Action Button */}
                            <div className="ml-4">
                                {item.status === 'available' && (
                                    <button
                                        onClick={handleClaimClick}
                                        className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-sm font-medium rounded-full backdrop-blur-sm transition-all duration-200 border border-white/20 hover:border-white/40"
                                    >
                                        Claim
                                    </button>
                                )}
                                {item.status === 'claimed' && (
                                    <span className="px-4 py-2 bg-yellow-500/20 text-yellow-300 text-sm font-medium rounded-full border border-yellow-500/30">
                                        Claimed
                                    </span>
                                )}
                                {item.status === 'expired' && (
                                    <span className="px-4 py-2 bg-red-500/20 text-red-300 text-sm font-medium rounded-full border border-red-500/30">
                                        Expired
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FeedItem;