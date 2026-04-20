import { useEffect, useMemo, useRef, useState } from "react";
import MainLayout from "../Layout/MainLayout";
import {
    fetchAcceptedHistory,
    fetchPostedHistory,
    updateAcceptedOrderProgress,
} from "../api/food";
import { fetchAssignmentChat, sendAssignmentChatMessage } from "../api/chat";
import { getUser } from "../api/auth";
import GlassSurface from "../component/GlassSurface";

const TABS = {
    POSTED: "posted",
    ACCEPTED: "accepted",
};

const AUTO_TRIGGER_DISTANCE_METERS = 10;
const AUTO_EXIT_DISTANCE_METERS = 20;

const STATUS_LABELS = {
    open: "Open",
    assigned: "Assigned",
    picked_up: "Picked Up",
    delivered: "Delivered",
    cancelled: "Cancelled",
    expired: "Expired",
    available: "Open",
    claimed: "Claimed",
};

const normalizeWorkflowStatus = (item) => {
    if (item?.workflowStatus) return String(item.workflowStatus).toLowerCase();
    if (item?.status) {
        const fallback = String(item.status).toLowerCase();
        if (fallback === "available") return "open";
        if (fallback === "claimed") return "assigned";
        return fallback;
    }
    return "unknown";
};

const formatDate = (rawDate) => {
    if (!rawDate) return "-";
    const parsed = new Date(rawDate);
    if (Number.isNaN(parsed.getTime())) return rawDate;
    return parsed.toLocaleString([], {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

const buildMapUrl = (item) => {
    const hasCoords = item?.pickupLatitude != null && item?.pickupLongitude != null;
    if (hasCoords) {
        return `https://www.google.com/maps/search/?api=1&query=${item.pickupLatitude},${item.pickupLongitude}`;
    }
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item?.address || "")}`;
};

const isInProcess = (status) => ["open", "assigned", "picked_up"].includes(status);

const toTime = (value) => {
    if (!value) return 0;
    const parsed = new Date(value).getTime();
    return Number.isFinite(parsed) ? parsed : 0;
};

const haversineDistanceMeters = (lat1, lon1, lat2, lon2) => {
    const toRad = (deg) => (deg * Math.PI) / 180;
    const R = 6371000;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const toCoordinates = (lat, lng) => {
    const latitude = Number(lat);
    const longitude = Number(lng);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
    return { latitude, longitude };
};

const getMostRecentEventTime = (item) => Math.max(
    toTime(item?.createdAt),
    toTime(item?.acceptedAt),
    toTime(item?.pickedUpAt),
    toTime(item?.deliveredAt)
);

const getAutoProgressTarget = (item) => {
    const workflowStatus = normalizeWorkflowStatus(item);
    if (workflowStatus === "assigned") {
        return {
            action: "PICKED_UP",
            target: toCoordinates(item.pickupLatitude, item.pickupLongitude),
        };
    }
    if (workflowStatus === "picked_up") {
        return {
            action: "DELIVERED",
            target: toCoordinates(item.targetZoneLatitude, item.targetZoneLongitude),
        };
    }
    return { action: null, target: null };
};

const toggleValue = (current, nextValue) => (current === nextValue ? null : nextValue);

const AssignmentChatPanel = ({ item, currentUser }) => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [draft, setDraft] = useState("");
    const [sending, setSending] = useState(false);
    const listRef = useRef(null);

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            if (!item?.assignmentId) return;
            setLoading(true);
            setError("");
            try {
                const rows = await fetchAssignmentChat(item.assignmentId);
                if (mounted) {
                    setMessages(rows);
                }
            } catch (err) {
                if (mounted) {
                    setError(err?.message || "Failed to load chat.");
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        load();
        return () => {
            mounted = false;
        };
    }, [item?.assignmentId]);

    useEffect(() => {
        if (!listRef.current) return;
        listRef.current.scrollTop = listRef.current.scrollHeight;
    }, [messages.length]);

    const handleSend = async () => {
        const payload = draft.trim();
        if (!payload || sending || !item?.assignmentId) return;

        setSending(true);
        setError("");
        try {
            const created = await sendAssignmentChatMessage(item.assignmentId, payload);
            setMessages((prev) => [...prev, created]);
            setDraft("");
        } catch (err) {
            setError(err?.message || "Could not send message.");
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="mt-3 rounded-xl border border-[#F0D9D3] bg-white/80 p-3">
            <p className="text-xs font-semibold text-[#7A5F5A] mb-2">Assignment Chat</p>

            {loading && (
                <p className="text-xs text-[#8D746E]">Loading chat...</p>
            )}

            {!loading && (
                <div
                    ref={listRef}
                    className="max-h-48 overflow-y-auto space-y-2 rounded-lg bg-[#FFF8F7] border border-[#F2E1DD] p-2"
                >
                    {messages.length === 0 && (
                        <p className="text-xs text-[#9A817B]">No messages yet. Start coordinating pickup timing and gate details.</p>
                    )}

                    {messages.map((msg) => {
                        const mine = Number(msg.senderUserId) === Number(currentUser?.userId);
                        return (
                            <div
                                key={msg.messageId}
                                className={`flex ${mine ? "justify-end" : "justify-start"}`}
                            >
                                <div className={`max-w-[82%] rounded-lg px-3 py-2 text-xs ${mine ? "bg-[#FF8B77] text-white" : "bg-white border border-[#EED9D4] text-[#664F4A]"}`}>
                                    <p className={`font-semibold mb-0.5 ${mine ? "text-white/90" : "text-[#8A7069]"}`}>
                                        {msg.senderName || "User"}
                                    </p>
                                    <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                                    <p className={`mt-1 text-[10px] ${mine ? "text-white/80" : "text-[#B49790]"}`}>
                                        {formatDate(msg.createdAt)}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="mt-2 flex items-center gap-2">
                <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                        }
                    }}
                    maxLength={1000}
                    placeholder="Type message (arrival time, gate number, contact note...)"
                    className="flex-1 rounded-full border border-[#E8D1CC] bg-white px-3 py-2 text-xs text-[#6B5454] outline-none focus:border-[#FF8B77]"
                />
                <button
                    onClick={handleSend}
                    disabled={sending || !draft.trim()}
                    className="rounded-full bg-[#FF8B77] px-3 py-2 text-xs font-semibold text-white hover:bg-[#FF7A66] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {sending ? "Sending..." : "Send"}
                </button>
            </div>

            {error && (
                <p className="mt-2 text-xs font-semibold text-[#A14B41]">{error}</p>
            )}
        </div>
    );
};

const TimelineRow = ({ item }) => {
    const nodes = [
        { key: "posted", label: "Posted", time: item?.createdAt },
        { key: "accepted", label: "Accepted", time: item?.acceptedAt },
        { key: "picked", label: "Picked Up", time: item?.pickedUpAt },
        { key: "delivered", label: "Delivered", time: item?.deliveredAt },
    ];

    return (
        <div className="mt-3 rounded-xl bg-white/70 px-3 py-3 border border-[#F0D9D3]">
            <p className="text-[#AA918C] text-xs mb-2">Timeline</p>
            <div className="flex items-start gap-2">
                {nodes.map((node, idx) => {
                    const complete = Boolean(node.time);
                    const isLast = idx === nodes.length - 1;

                    return (
                        <div key={node.key} className="flex flex-1 items-start">
                            <div className="w-full">
                                <div className="flex items-center">
                                    <div
                                        className={`h-6 w-6 rounded-full border text-[10px] font-bold flex items-center justify-center ${
                                            complete
                                                ? "bg-[#FF8B77] text-white border-[#FF8B77]"
                                                : "bg-white text-[#BCA29D] border-[#E8D1CC]"
                                        }`}
                                    >
                                        {idx + 1}
                                    </div>
                                    {!isLast && (
                                        <div
                                            className={`h-[2px] flex-1 mx-2 ${
                                                complete ? "bg-[#FF8B77]" : "bg-[#E8D1CC]"
                                            }`}
                                        />
                                    )}
                                </div>
                                <p className="mt-1 text-[11px] font-semibold text-[#6B5454]">{node.label}</p>
                                <p className="text-[11px] text-[#8D746E]">{formatDate(node.time)}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const HistoryCard = ({ item, tab, onProgressUpdate, updatingAction, currentUser, isChatOpen, onToggleChat }) => {
    const workflowStatus = normalizeWorkflowStatus(item);
    const mapUrl = buildMapUrl(item);
    const inProcess = isInProcess(workflowStatus);
    const statusLabel = STATUS_LABELS[workflowStatus] || STATUS_LABELS[item.status] || "Unknown";
    const canMarkPickedUp = tab === TABS.ACCEPTED && workflowStatus === "assigned";
    const canMarkDelivered = tab === TABS.ACCEPTED && workflowStatus === "picked_up";
    const hasPickedBy = Boolean(item.pickedByName || item.pickedByContact);
    const showLifecycleInfo = Boolean(item.pickedUpAt || item.deliveredAt || hasPickedBy);
    const canOpenChat = Boolean(item.assignmentId && item.donorId && item.pickedByUserId);

    return (
        <article className="rounded-[24px] bg-[#FFECEA] p-4 border border-[#F8D5CF] shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-xs text-[#A4847D] font-medium">{item.foodId || `#${item.id}`}</p>
                    <h3 className="text-lg font-bold text-[#4F4040] truncate">{item.description || "Food Listing"}</h3>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#7A5F5A] border border-[#EDD3CE]">
                    {statusLabel}
                </span>
            </div>

            <p className="mt-2 text-sm text-[#7E6661]">{item.address || "Address not available"}</p>

            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-[#6E5752]">
                <div className="rounded-xl bg-white/70 px-3 py-2 border border-[#F0D9D3]">
                    <p className="text-[#AA918C]">Quantity</p>
                    <p className="font-semibold text-sm">{item.quantity || "-"}</p>
                </div>
                <div className="rounded-xl bg-white/70 px-3 py-2 border border-[#F0D9D3]">
                    <p className="text-[#AA918C]">Posted At</p>
                    <p className="font-semibold text-sm">{formatDate(item.createdAt)}</p>
                </div>
            </div>

            {showLifecycleInfo && (
                <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-[#6E5752]">
                    {hasPickedBy && (
                        <div className="rounded-xl bg-white/70 px-3 py-2 border border-[#F0D9D3]">
                            <p className="text-[#AA918C]">Picked By</p>
                            <p className="font-semibold text-sm">{item.pickedByName || "Volunteer"}</p>
                            {item.pickedByContact && (
                                <p className="text-[#8D746E] text-xs">{item.pickedByContact}</p>
                            )}
                        </div>
                    )}

                    {(item.pickedUpAt || item.deliveredAt) && (
                        <div className="rounded-xl bg-white/70 px-3 py-2 border border-[#F0D9D3] grid grid-cols-2 gap-2">
                            <div>
                                <p className="text-[#AA918C]">Picked Up At</p>
                                <p className="font-semibold text-sm">{formatDate(item.pickedUpAt)}</p>
                            </div>
                            <div>
                                <p className="text-[#AA918C]">Delivered At</p>
                                <p className="font-semibold text-sm">{formatDate(item.deliveredAt)}</p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <TimelineRow item={item} />


            {inProcess && (
                <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
                    {canMarkPickedUp && (
                        <button
                            onClick={() => onProgressUpdate?.(item, "PICKED_UP")}
                            disabled={Boolean(updatingAction)}
                            className="inline-flex items-center gap-2 rounded-full bg-[#4C9A74] px-4 py-2 text-sm font-semibold text-white hover:bg-[#438867] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {updatingAction === "PICKED_UP" ? "Updating..." : "Mark Picked Up"}
                        </button>
                    )}

                    {canMarkDelivered && (
                        <button
                            onClick={() => onProgressUpdate?.(item, "DELIVERED")}
                            disabled={Boolean(updatingAction)}
                            className="inline-flex items-center gap-2 rounded-full bg-[#2D7BD8] px-4 py-2 text-sm font-semibold text-white hover:bg-[#256AC0] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {updatingAction === "DELIVERED" ? "Updating..." : "Mark Delivered"}
                        </button>
                    )}

                    <a
                        href={mapUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-full bg-[#FF8B77] px-4 py-2 text-sm font-semibold text-white hover:bg-[#FF7A66] transition-colors"
                    >
                        <span>View On Map</span>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
                        </svg>
                    </a>
                </div>
            )}

            {canOpenChat && (
                <div className="mt-3">
                    <button
                        type="button"
                        onClick={() => onToggleChat?.(item.assignmentId)}
                        className="inline-flex items-center gap-2 rounded-full border border-[#E7D3CF] bg-white px-4 py-2 text-xs font-semibold text-[#7A5F5A] hover:bg-[#FFF3F1]"
                    >
                        {isChatOpen ? "Hide Chat" : "Open Chat"}
                    </button>
                    {isChatOpen && (
                        <AssignmentChatPanel item={item} currentUser={currentUser} />
                    )}
                </div>
            )}
        </article>
    );
};

const History = () => {
    const currentUser = useMemo(() => getUser(), []);
    const [activeTab, setActiveTab] = useState(TABS.POSTED);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [postedItems, setPostedItems] = useState([]);
    const [acceptedItems, setAcceptedItems] = useState([]);
    const [progressUpdatingById, setProgressUpdatingById] = useState({});
    const [toast, setToast] = useState(null);
    const [openChatAssignmentId, setOpenChatAssignmentId] = useState(null);
    const [autoConfirmRequest, setAutoConfirmRequest] = useState(null);
    const autoAttemptedRef = useRef(new Set());
    const autoEnteredZoneRef = useRef(new Set());
    const autoPromptedRef = useRef(new Set());

    const loadHistory = async () => {
        setLoading(true);
        setError("");

        const [postedResult, acceptedResult] = await Promise.allSettled([
            fetchPostedHistory(),
            fetchAcceptedHistory(),
        ]);

        if (postedResult.status === "fulfilled") {
            setPostedItems(postedResult.value || []);
        } else {
            setPostedItems([]);
        }

        if (acceptedResult.status === "fulfilled") {
            setAcceptedItems(acceptedResult.value || []);
        } else {
            setAcceptedItems([]);
        }

        if (postedResult.status === "rejected" && acceptedResult.status === "rejected") {
            setError("Could not load history right now. Please try again.");
        }

        setLoading(false);
    };

    useEffect(() => {
        loadHistory();
    }, []);

    const activeItems = useMemo(() => {
        const source = activeTab === TABS.POSTED ? postedItems : acceptedItems;

        return source
            .map((item) => ({ item, recentTime: getMostRecentEventTime(item) }))
            .sort((a, b) => b.recentTime - a.recentTime)
            .map(({ item }) => item);
    }, [activeTab, postedItems, acceptedItems]);

    const handleProgressUpdate = async (item, action, options = {}) => {
        const foodId = item?.id;
        if (!foodId) return;

        setProgressUpdatingById((prev) => ({ ...prev, [foodId]: action }));

        try {
            await updateAcceptedOrderProgress(foodId, action);
            await loadHistory();
            const verb = action === "PICKED_UP" ? "picked up" : "delivered";
            const mode = options.source === "auto" ? "auto" : "manual";
            setToast({
                type: "success",
                message: `Order ${item.foodId || `#${foodId}`} marked ${verb} (${mode}).`,
            });
        } catch (err) {
            if (!options.silent) {
                setError(err?.message || "Failed to update order progress.");
            }
            setToast({
                type: "error",
                message: err?.message || "Failed to update order progress.",
            });
        } finally {
            setProgressUpdatingById((prev) => {
                const next = { ...prev };
                delete next[foodId];
                return next;
            });
        }
    };

    useEffect(() => {
        if (!toast) return;
        const timer = setTimeout(() => setToast(null), 2800);
        return () => clearTimeout(timer);
    }, [toast]);

    useEffect(() => {
        if (activeTab !== TABS.ACCEPTED || acceptedItems.length === 0) return;
        if (!navigator.geolocation) return;

        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                const userLat = position.coords.latitude;
                const userLng = position.coords.longitude;

                for (const item of acceptedItems) {
                    const { action, target } = getAutoProgressTarget(item);

                    if (!action || !target || !item?.id) continue;

                    const key = `${item.id}:${action}`;
                    if (autoAttemptedRef.current.has(key) || autoPromptedRef.current.has(key)) continue;

                    const distance = haversineDistanceMeters(
                        userLat,
                        userLng,
                        target.latitude,
                        target.longitude
                    );

                    if (distance <= AUTO_TRIGGER_DISTANCE_METERS) {
                        autoEnteredZoneRef.current.add(key);
                        continue;
                    }

                    if (
                        autoEnteredZoneRef.current.has(key) &&
                        distance >= AUTO_EXIT_DISTANCE_METERS
                    ) {
                        autoPromptedRef.current.add(key);
                        setAutoConfirmRequest({ item, action, key });
                        break;
                    }
                }
            },
            () => {},
            {
                enableHighAccuracy: true,
                timeout: 8000,
                maximumAge: 5000,
            }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, [activeTab, acceptedItems]);

    return (
        <MainLayout activeHref="/history">
            <div className="mx-auto mt-3 mb-2 h-[calc(100%-12px)] w-full overflow-auto rounded-[20px] bg-[#FFF8F7] border border-[#F4DDD8] p-3 md:mt-[24px] md:mb-[12px] md:h-[calc(100%-24px)] md:w-[60%] md:rounded-[25px] md:p-5">
                <GlassSurface
                    width="100%"
                    height="auto"
                    borderRadius={999}
                    backgroundOpacity={0.82}
                    blur={1}
                    saturation={1.4}

                    className="mb-4 md:mb-5 w-full sticky bg-[#FDE6E2] top-0 z-20"
                >
                    <div className="inline-flex rounded-full w-full">
                        <button
                            onClick={() => setActiveTab(TABS.POSTED)}
                                className={`rounded-full w-1/2 px-3 py-2 text-xs md:px-4 md:text-sm font-semibold transition-colors ${
                                activeTab === TABS.POSTED ? "bg-[#FF8B77] text-white" : "bg-white text-[#6A5450] border border-[#E8D1CC]"
                            }`}
                        >
                            Orders Posted By Me
                        </button>
                        <button
                            onClick={() => setActiveTab(TABS.ACCEPTED)}
                                className={`rounded-full w-1/2 px-3 py-2 text-xs md:px-4 md:text-sm font-semibold transition-colors ${
                                activeTab === TABS.ACCEPTED ? "bg-[#FF8B77] text-white" : "bg-white text-[#6A5450] border border-[#E8D1CC]"
                            }`}
                        >
                            Food Accepted By Me
                        </button>
                    </div>
                </GlassSurface>

                {loading && (
                    <div className="rounded-2xl border border-[#F1DCD7] bg-white p-8 text-center text-[#8E726C]">
                        Loading history...
                    </div>
                )}

                {!loading && error && (
                    <div className="rounded-2xl border border-[#F7C6C0] bg-[#FFF0EE] p-4 text-sm text-[#A14B41] mb-4">
                        {error}
                    </div>
                )}

                {!loading && activeItems.length === 0 && (
                    <div className="rounded-2xl border border-[#F1DCD7] bg-white p-8 text-center text-[#8E726C]">
                        {activeTab === TABS.POSTED
                            ? "No posted orders found yet."
                            : "No accepted orders found yet."}
                    </div>
                )}

                {!loading && activeItems.length > 0 && (
                    <div className="space-y-4">
                        {activeItems.map((item) => (
                            <HistoryCard
                                key={item.id || item.foodId}
                                item={item}
                                tab={activeTab}
                                onProgressUpdate={handleProgressUpdate}
                                updatingAction={progressUpdatingById[item.id]}
                                currentUser={currentUser}
                                isChatOpen={openChatAssignmentId === item.assignmentId}
                                onToggleChat={(assignmentId) => {
                                    setOpenChatAssignmentId((prev) => toggleValue(prev, assignmentId));
                                }}
                            />
                        ))}
                    </div>
                )}

                {autoConfirmRequest && (
                    <div className="fixed bottom-4 right-1/2 translate-x-1/2 md:translate-x-0 md:right-6 z-40 w-[92%] md:w-[330px] rounded-2xl border border-[#F2D0CA] bg-white shadow-xl p-4">
                        <p className="text-sm font-semibold text-[#5F4B47]">GPS Update Confirmation</p>
                        <p className="mt-1 text-xs text-[#846C67]">
                            You moved away from the location for {autoConfirmRequest.item.foodId || `#${autoConfirmRequest.item.id}`}. Confirm auto mark as {autoConfirmRequest.action === "PICKED_UP" ? "Picked Up" : "Delivered"}?
                        </p>
                        <div className="mt-3 flex justify-end gap-2">
                            <button
                                onClick={() => {
                                    autoPromptedRef.current.delete(autoConfirmRequest.key);
                                    autoEnteredZoneRef.current.delete(autoConfirmRequest.key);
                                    setAutoConfirmRequest(null);
                                }}
                                className="rounded-full px-3 py-1.5 text-xs font-semibold text-[#7A5F5A] border border-[#E7D3CF]"
                            >
                                Dismiss
                            </button>
                            <button
                                onClick={async () => {
                                    autoAttemptedRef.current.add(autoConfirmRequest.key);
                                    await handleProgressUpdate(autoConfirmRequest.item, autoConfirmRequest.action, {
                                        silent: true,
                                        source: "auto",
                                    });
                                    setAutoConfirmRequest(null);
                                }}
                                className="rounded-full bg-[#FF8B77] px-3 py-1.5 text-xs font-semibold text-white"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                )}

                {toast && (
                    <div className={`fixed bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 z-40 rounded-full px-4 py-2 text-xs font-semibold shadow-lg ${
                        toast.type === "error" ? "bg-[#B94A48] text-white" : "bg-[#4C9A74] text-white"
                    }`}>
                        {toast.message}
                    </div>
                )}
            </div>
        </MainLayout>
    );
};

export default History;