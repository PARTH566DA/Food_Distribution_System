import { useEffect, useState, useRef } from 'react';
import FeedItem from './FeedItem';
import { fetchFoodPage, claimFood } from '../api/food';

const Feed = ({ pageSize = 5 }) => {
  const [page, setPage] = useState(0);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const [claiming, setClaiming] = useState(null);
  const loaderRef = useRef();

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

  const handleClaim = async (foodId) => {
    if (claiming) return;

    setClaiming(foodId);
    try {
      await claimFood(foodId);
      
      // Update the item status locally
      setItems(prevItems =>
        prevItems.map(item =>
          item.foodId === foodId 
            ? { ...item, status: 'claimed' }
            : item
        )
      );
    } catch (err) {
      setError('Failed to claim food item. Please try again.');
      console.error('Claim error:', err);
    } finally {
      setClaiming(null);
    }
  };

  const handleRefresh = () => {
    setPage(0);
    setItems([]);
    setHasMore(true);
    setError(null);
    loadPage(0, true);
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
            key={item.id || item.foodId}
            item={item}
            onClaim={claiming === item.foodId ? null : handleClaim}
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
          <div className="text-white/40 text-2xl mb-2">🎉</div>
          <p className="text-white/50 text-sm">You've reached the end of the feed</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && items.filter(item => item.status === 'available').length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="text-white/40 text-4xl mb-4">🍽️</div>
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
    </div>
  );
};

export default Feed;