import VegIcon from '../assets/veg-logo.png';
import NonVegIcon from '../assets/non-veg-logo.png';
import QuantityIcon from '../assets/Group.svg';
import ClockIcon from '../assets/clock.svg';
import PackageIcon from '../assets/package.svg';

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

    const getButtonStyles = () => {
        return {
            base: "relative overflow-hidden rounded-full bg-[#FF8B77] text-white font-semibold text-lg transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg active:scale-95",
            dimensions: "w-[180px] h-[50px]",
            hover: "hover:bg-[#FF7A66]",
            animation: "before:content-[''] before:absolute before:top-0 before:left-[-100%] before:w-full before:h-full before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:transition-all before:duration-700 hover:before:left-[100%]"
        };
    };

    const renderAnimatedButton = (onClick, children, disabled = false) => {
        const styles = getButtonStyles();
        return (
            <button
                onClick={onClick}
                disabled={disabled}
                className={`${styles.base} ${styles.dimensions} ${styles.hover} ${styles.animation} ${
                    disabled ? 'opacity-50 cursor-not-allowed hover:scale-100 hover:translate-y-0' : 'cursor-pointer'
                }`}
                style={{
                    background: disabled ? '#cd5c3f' : '',
                }}
            >
                <span className="relative z-10">{children}</span>
            </button>
        );
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
        <div className="w-full mb-4 mx-auto">
            <div className="w-full overflow-hidden rounded-[25px] p-[10px] bg-[#FFECEA]">
                <div className="flex gap-[10px]">
                    {/* Food Image */}
                    <div className="w-[35%] flex-shrink-0 relative">
                        <div className="relative w-full aspect-square">
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
                            <div className="absolute top-3 right-3 bg-[#FFECEA] rounded-[6px] p-1 z-10">
                                {item.vegetarian ? (
                                    <img src={VegIcon} alt="Vegetarian" className="w-6 h-6" />
                                ) : (
                                    <img src={NonVegIcon} alt="Non-Vegetarian" className="w-6 h-6" />
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Food Details */}
                    <div className="flex-1 flex flex-col justify-between">
                        {/* Top Section */}
                        <div className="w-[60%]">
                            <h3 className="text-2xl font-semibold text-black">
                                {item.description}
                            </h3>

                            <p className="text-base text-[#797979] mb-4">
                                {item.location}
                            </p>
                        </div>
                        <div>

                            <div className="w-full h-[2px] bg-[#D9D9D9] mb-4"></div>

                            {/* Details and Action Button Container */}
                            <div className="flex justify-between">
                                {/* Details */}
                                <div className="flex flex-col gap-6 flex-1">
                                    <div className="flex items-center gap-2 text-base">
                                        <img src={QuantityIcon} alt="Quantity" className="w-5 h-5" />
                                        <span className="font-semibold text-black">Serve:</span>
                                        <span className="text-gray-700">{item.quantity}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-base">
                                        <img src={ClockIcon} alt="Expiry" className="w-5 h-5" />
                                        <span className="font-semibold text-black">Fresh:</span>
                                        <span className="text-gray-700">{item.expiryTime} hrs.</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-base">
                                        <img src={PackageIcon} alt="Package" className="w-5 h-5" />
                                        <span className="font-semibold text-black">
                                            {item.packed ? 'Pre-Packed' : 'Not Packed'}
                                        </span>
                                    </div>
                                </div>
                                
                                {/* Action Button */}
                                <div className="flex flex-col justify-end mr-[10px]">
                                    {item.status === 'available' && 
                                        renderAnimatedButton(handleClaimClick, "Accept")
                                    }
                                    {item.status === 'claimed' && (
                                        <span className="px-6 py-2 bg-yellow-500/20 text-yellow-700 text-sm font-semibold rounded-full border border-yellow-500/30 transition-all duration-300 hover:bg-yellow-500/30 hover:scale-105">
                                            Claimed
                                        </span>
                                    )}
                                    {item.status === 'expired' && (
                                        <span className="px-6 py-2 bg-red-500/20 text-red-700 text-sm font-semibold rounded-full border border-red-500/30 transition-all duration-300 hover:bg-red-500/30 hover:scale-105">
                                            Expired
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FeedItem;