import { useEffect, useState, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import FeedItem from './FeedItem';
import FoodDetailModal from './FoodDetailModal';
import { fetchFoodPage, claimFood, deleteFood } from '../api/food';
import { fetchAllZones } from '../api/zones';
import { getUser } from '../api/auth';

const Feed = ({ pageSize = 5 }) => {
  const [page, setPage] = useState(0);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const [claiming, setClaiming] = useState(null);
  const [cancelling, setCancelling] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [zonePickerId, setZonePickerId] = useState(null);
  const [selectedZoneId, setSelectedZoneId] = useState(null);
  const [zones, setZones] = useState([]);
  const [zonesLoading, setZonesLoading] = useState(false);
  const [zonesError, setZonesError] = useState('');
  const currentUser = getUser();
  const loaderRef = useRef();

  const getItemId = (item) => item.id ?? item.foodId;

  const toNumberOrNull = (value) => {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : null;
  };

  // Load initial page
  useEffect(() => {
    loadPage(0, true);
  }, []);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!loaderRef.current || !hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          setPage(prevPage => {
            const nextPage = prevPage + 1;
            loadPage(nextPage, false);
            return nextPage;
          });
        }
      },
      { 
        rootMargin: '100px',
        threshold: 0.1
      }
    );

    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading]);

  const loadPage = async (pageNum, reset = false) => {
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetchFoodPage(pageNum, pageSize);
      
      setItems(prevItems => {
        if (reset) {
          return response.items || [];
        }
        return [...prevItems, ...(response.items || [])];
      });
      
      setHasMore(response.hasMore || false);
    } catch (err) {
      setError('Failed to load food items. Please try again.');
      console.error('Feed loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = (item) => {
    setSelectedItem(item);
  };

  const loadZones = async () => {
    if (zonesLoading || zones.length > 0) return;

    setZonesLoading(true);
    setZonesError('');
    try {
      const allZones = await fetchAllZones();
      const activeZones = (allZones || [])
        .filter((zone) => zone?.status === 'ACTIVE')
        .map((zone) => ({
          ...zone,
          needyZoneId: Number(zone.needyZoneId),
          latitude: toNumberOrNull(zone.latitude),
          longitude: toNumberOrNull(zone.longitude),
        }))
        .filter((zone) => Number.isFinite(zone.needyZoneId));
      setZones(activeZones);
    } catch (err) {
      setZonesError('Failed to load needy zones. You can still continue without selecting one.');
    } finally {
      setZonesLoading(false);
    }
  };

  const handleStartZoneSelection = (itemOrId) => {
    const foodId = typeof itemOrId === 'object' ? getItemId(itemOrId) : itemOrId;
    setSelectedItem(null);
    setExpandedId(foodId);
    setZonePickerId(foodId);
    setSelectedZoneId(null);
    loadZones();
  };

  const handleClaim = async (foodId, claimOptions = {}) => {
    if (claiming) return;

    setClaiming(foodId);
    try {
      await claimFood(foodId, {
        userId: currentUser?.userId,
        needyZoneId: claimOptions.needyZoneId ?? null,
      });
      
      // Update the item status locally
      setItems(prevItems =>
        prevItems.map(item =>
          getItemId(item) === foodId
            ? { ...item, status: 'claimed' }
            : item
        )
      );

      if (claimOptions.routeUrl) {
        window.open(claimOptions.routeUrl, '_blank', 'noopener,noreferrer');
      }

      setSelectedItem(null);
      setExpandedId(null);
      setZonePickerId(null);
      setSelectedZoneId(null);
    } catch (err) {
      setError('Failed to claim food item. Please try again.');
      console.error('Claim error:', err);
    } finally {
      setClaiming(null);
    }
  };

  const handleCancel = async (foodId) => {
    if (cancelling) return;
    setCancelling(foodId);
    try {
      await deleteFood(foodId);
      setItems(prevItems =>
        prevItems.map(item =>
          getItemId(item) === foodId ? { ...item, status: 'cancelled' } : item
        )
      );
      setExpandedId(null);
    } catch (err) {
      setError('Failed to cancel food listing. Please try again.');
      console.error('Cancel error:', err);
    } finally {
      setCancelling(null);
    }
  };

  const handleRefresh = () => {
    setPage(0);
    setItems([]);
    setHasMore(true);
    setError(null);
    loadPage(0, true);
  };

  const handleCloseZonePicker = () => {
    setZonePickerId(null);
    setSelectedZoneId(null);
  };

  if (error && items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-white/60 mb-4">⚠️</div>
        <h3 className="text-white font-medium mb-2">Something went wrong</h3>
        <p className="text-white/60 text-sm mb-4">{error}</p>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-sm font-medium rounded-full backdrop-blur-sm transition-all duration-200 border border-white/20"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">

      {/* Error banner (if there are items but new page failed) */}
      {error && items.length > 0 && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg backdrop-blur-sm">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* Feed Items */}
      <div className="space-y-4">
        {items.filter(item => item.status === 'available').map((item) => (
          <FeedItem
            key={getItemId(item)}
            item={item}
            onAccept={handleAccept}
            confirming={claiming === getItemId(item)}
            expanded={expandedId === getItemId(item)}
            onExpand={(id) => setExpandedId(prev => prev === id ? null : id)}
            isOwner={currentUser && item.donorId === currentUser.userId}
            onCancel={handleCancel}
            cancelling={cancelling === getItemId(item)}
            showZonePicker={zonePickerId === getItemId(item)}
            zones={zones}
            zonesLoading={zonesLoading}
            zonesError={zonesError}
            selectedZoneId={selectedZoneId}
            onSelectZone={setSelectedZoneId}
            onStartZoneSelection={handleStartZoneSelection}
            onConfirmWithZone={(foodId, options) => handleClaim(foodId, options)}
            onCloseZonePicker={handleCloseZonePicker}
          />
        ))}
      </div>

      {/* Loading States */}
      {loading && items.length === 0 && (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="w-full">
              <div className="p-6 bg-white/10 rounded-2xl backdrop-blur-sm animate-pulse">
                <div className="flex gap-4">
                  <div className="w-24 h-24 bg-white/20 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="h-6 bg-white/20 rounded w-3/4" />
                    <div className="h-4 bg-white/10 rounded w-1/2" />
                    <div className="h-4 bg-white/10 rounded w-2/3" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bottom Loading */}
      {loading && items.length > 0 && (
        <div className="flex justify-center py-6">
          <div className="text-white/60 text-sm">Loading more...</div>
        </div>
      )}

      {/* Infinite Scroll Trigger */}
      {hasMore && !loading && (
        <div ref={loaderRef} className="h-10" />
      )}

      {/* End of Feed */}
      {!hasMore && items.length > 0 && (
        <div className="flex flex-col items-center py-8 text-center">
          <p className="text-white/50 text-sm">You've reached the end of the feed</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && items.filter(item => item.status === 'available').length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <h3 className="text-white font-medium mb-2">No food items available</h3>
          <p className="text-white/60 text-sm mb-4">Check back later for new donations</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-sm font-medium rounded-full backdrop-blur-sm transition-all duration-200 border border-white/20"
          >
            Refresh
          </button>
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedItem && (
          <FoodDetailModal
            key={getItemId(selectedItem)}
            item={selectedItem}
            onClose={() => setSelectedItem(null)}
            onConfirm={handleStartZoneSelection}
            confirming={claiming === getItemId(selectedItem)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Feed;