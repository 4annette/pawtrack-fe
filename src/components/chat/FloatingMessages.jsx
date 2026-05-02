import React, { useState, useEffect } from "react";
import { MessageSquare, X, ChevronRight, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { fetchActiveChats, getUnreadCount } from "@/services/api";
import ChatWindow from "@/components/chat/ChatWindow";

const FloatingMessages = () => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [chats, setChats] = useState([]);
    const [loading, setLoading] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [selectedChat, setSelectedChat] = useState(null);

    useEffect(() => {
        const checkUnread = async () => {
            try {
                const count = await getUnreadCount();
                setUnreadCount(count);
            } catch (error) {
                console.error("Error fetching unread count", error);
            }
        };

        const initialFetchChats = async () => {
            try {
                const activeChats = await fetchActiveChats();
                setChats(activeChats);
            } catch (error) {
                console.error("Error fetching active chats", error);
            }
        };

        checkUnread();
        initialFetchChats();
        
        const interval = setInterval(() => {
            checkUnread();
            fetchActiveChats().then(setChats).catch(console.error);
        }, 15000);
        
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (isOpen) {
            setLoading(true);
            fetchActiveChats()
                .then(setChats)
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [isOpen]);

    if (chats.length === 0 && !isOpen && unreadCount === 0) {
        return null;
    }

    return (
        <>
            <div className="fixed bottom-6 left-6 z-[9999]">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 ${
                        isOpen ? 'bg-gray-800 text-white' : 'bg-emerald-600 text-white'
                    }`}
                >
                    {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
                    
                    {!isOpen && unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black min-w-[20px] h-5 px-1 rounded-full border-2 border-white flex items-center justify-center">
                            {unreadCount}
                        </span>
                    )}
                </button>

                {isOpen && (
                    <div className="absolute bottom-16 left-0 w-[320px] sm:w-[380px] bg-white rounded-[32px] shadow-2xl border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-4 zoom-in-95 duration-200 origin-bottom-left">
                        <div className="bg-emerald-600 p-5 text-white">
                            <h3 className="font-black text-sm uppercase tracking-widest">{t('fm_messages_title')}</h3>
                        </div>
                        
                        <div className="max-h-[400px] overflow-y-auto bg-gray-50/50">
                            {loading ? (
                                <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-emerald-600" /></div>
                            ) : chats.length === 0 ? (
                                <div className="p-10 text-center text-gray-400 font-bold text-xs">{t('fm_no_chats')}</div>
                            ) : (
                                <div className="divide-y divide-gray-100">
                                    {chats.map(user => (
                                        <div 
                                            key={user.id} 
                                            onClick={() => {
                                                setSelectedChat(user);
                                                setIsOpen(false);
                                            }}
                                            className="p-4 flex items-center justify-between hover:bg-white cursor-pointer transition-colors"
                                        >
                                            <div className="flex items-center gap-3 text-gray-700">
                                                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 font-bold uppercase">
                                                    {(user.firstName || user.username || '?').charAt(0)}
                                                </div>
                                                <p className="text-sm font-bold truncate">
                                                    {user.firstName ? `${user.firstName} ${user.lastName || ''}` : user.username}
                                                </p>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-gray-300" />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {selectedChat && (
                <ChatWindow 
                    recipientId={selectedChat.id}
                    recipientName={(selectedChat.firstName ? `${selectedChat.firstName} ${selectedChat.lastName || ''}` : selectedChat.username).trim()}
                    onClose={() => setSelectedChat(null)}
                />
            )}
        </>
    );
};

export default FloatingMessages;