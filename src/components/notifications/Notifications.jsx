import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Bell, Search, AlertCircle, X } from "lucide-react";
import { fetchNotifications, markNotificationAsRead } from "@/services/api";
import MatchModal from "@/components/notifications/MatchModal";
import ReminderModal from "@/components/notifications/ReminderModal";
import FoundClaimModal from "@/components/notifications/FoundClaimModal";
import FoundMatchModal from "@/components/notifications/FoundMatchModal";

const Notifications = () => {
    const [isNotificationMenuOpen, setIsNotificationMenuOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [selectedNotification, setSelectedNotification] = useState(null);
    const notificationMenuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notificationMenuRef.current && !notificationMenuRef.current.contains(event.target)) {
                setIsNotificationMenuOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("touchstart", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("touchstart", handleClickOutside);
        };
    }, []);

    useEffect(() => {
        const loadNotifications = () => {
            fetchNotifications().then(setNotifications).catch(console.error);
        };
        loadNotifications();
        const intervalId = setInterval(loadNotifications, 60000);
        return () => clearInterval(intervalId);
    }, []);

    const handleNotificationClick = async (notification) => {
        if (!notification.read) {
            try {
                await markNotificationAsRead(notification.notificationId);
                setNotifications(prev => prev.map(n => n.notificationId === notification.notificationId ? { ...n, read: true } : n));
            } catch (e) {
                console.error(e);
            }
        }

        if (
            notification.notificationType === 'LOST_REPORT_NOTIFICATION' ||
            notification.notificationType === 'FOUND_REPORT_NOTIFICATION' ||
            notification.notificationType === 'LOST_REPORT_NOTIFICATION_REMINDER' ||
            notification.notificationType === 'FOUND_REPORT_NOTIFICATION_CONNECTED_FOUND'
        ) {
            setSelectedNotification(notification);
            setIsNotificationMenuOpen(false);
        }
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <>
            {selectedNotification && createPortal(
                <>
                    {selectedNotification.notificationType === 'LOST_REPORT_NOTIFICATION_REMINDER' ? (
                        <ReminderModal
                            notification={selectedNotification}
                            onClose={() => setSelectedNotification(null)}
                        />
                    ) : selectedNotification.notificationType === 'FOUND_REPORT_NOTIFICATION' ? (
                         <FoundClaimModal
                            notification={selectedNotification}
                            onClose={() => setSelectedNotification(null)}
                         />
                    ) : selectedNotification.notificationType === 'FOUND_REPORT_NOTIFICATION_CONNECTED_FOUND' ? (
                        <FoundMatchModal
                           notification={selectedNotification}
                           onClose={() => setSelectedNotification(null)}
                        />
                   ) : (
                        <MatchModal
                            notification={selectedNotification}
                            onClose={() => setSelectedNotification(null)}
                        />
                    )}
                </>,
                document.body
            )}

            <div className="relative" ref={notificationMenuRef}>
                <button
                    onClick={() => setIsNotificationMenuOpen(!isNotificationMenuOpen)}
                    className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all duration-200 relative active:scale-95 ${isNotificationMenuOpen ? 'bg-emerald-50 border-emerald-200 text-emerald-600 ring-4 ring-emerald-50' : 'bg-white border-gray-100 text-gray-500 hover:bg-gray-50 hover:border-gray-200 shadow-sm'}`}
                >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-0 right-0 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-white"></span>
                        </span>
                    )}
                </button>

                {isNotificationMenuOpen && (
                    <div className="fixed sm:absolute right-0 sm:right-0 top-16 sm:top-auto left-4 sm:left-auto right-4 sm:mt-4 sm:w-96 bg-white rounded-3xl sm:rounded-[32px] shadow-2xl shadow-emerald-900/10 border border-gray-100 py-3 z-50 overflow-hidden animate-in fade-in zoom-in-95 origin-top-right ring-4 ring-gray-50/50">
                        <div className="px-6 py-4 border-b border-gray-50 flex justify-between items-center bg-white/50 backdrop-blur-sm sticky top-0 z-10">
                            <h3 className="font-black text-gray-800 text-sm tracking-wide">Notifications</h3>
                            <div className="flex items-center gap-3">
                                {unreadCount > 0 && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-black uppercase tracking-widest">{unreadCount} New</span>}
                                <button 
                                    onClick={() => setIsNotificationMenuOpen(false)}
                                    className="sm:hidden p-1 text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="max-h-[70vh] sm:max-h-[60vh] overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="py-12 px-6 text-center flex flex-col items-center gap-4">
                                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
                                        <Bell className="w-8 h-8 opacity-50" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-400">All caught up!</p>
                                        <p className="text-xs text-gray-300 mt-1">No new notifications for now.</p>
                                    </div>
                                </div>
                            ) : (
                                notifications.map(n => {
                                    const isLostMatch = n.notificationType === 'LOST_REPORT_NOTIFICATION';
                                    const isFoundMatch = n.notificationType === 'FOUND_REPORT_NOTIFICATION';
                                    const isConnectedFound = n.notificationType === 'FOUND_REPORT_NOTIFICATION_CONNECTED_FOUND';
                                    const isReminder = n.notificationType === 'LOST_REPORT_NOTIFICATION_REMINDER';
                                    const isMatch = isLostMatch || isFoundMatch || isConnectedFound;
                                    
                                    return (
                                        <div
                                            key={n.notificationId}
                                            onClick={() => handleNotificationClick(n)}
                                            className={`group px-5 py-4 border-b border-gray-50 last:border-0 cursor-pointer transition-all hover:bg-gray-50 relative overflow-hidden ${n.read ? 'bg-white opacity-70' : 'bg-emerald-50/30'}`}
                                        >
                                            {!n.read && <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500" />}

                                            <div className="flex gap-4 items-start">
                                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border ${isMatch || isReminder ? 'bg-emerald-100 border-emerald-200 text-emerald-600' : 'bg-gray-100 border-gray-200 text-gray-500'}`}>
                                                    {isMatch ? <Search className="w-5 h-5" /> : (isReminder ? <AlertCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />)}
                                                </div>

                                                <div className="flex-1 min-w-0 pt-0.5">
                                                    <p className={`text-sm leading-snug ${n.read ? 'text-gray-600' : 'text-gray-900 font-bold'}`}>
                                                        {isLostMatch ? (
                                                            <>
                                                                <span className="text-emerald-700 font-black">{n.fromUserName}</span> might have found your pet!
                                                            </>
                                                        ) : isFoundMatch ? (
                                                            <>
                                                                Might you found <span className="text-emerald-700 font-black">{n.fromUserName}'s</span> pet!
                                                            </>
                                                        ) : isConnectedFound ? (
                                                            <>
                                                                Might you and <span className="text-emerald-700 font-black">{n.fromUserName}</span> found the same pet!
                                                            </>
                                                        ) : isReminder ? (
                                                            "Did you find your pet?"
                                                        ) : (
                                                            n.notificationType
                                                        )}
                                                    </p>
                                                    {!isMatch && (
                                                        <p className="text-xs text-gray-400 mt-1">System Notification</p>
                                                    )}
                                                </div>

                                                {!n.read && (
                                                    <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 shrink-0 shadow-sm shadow-emerald-200" />
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default Notifications;