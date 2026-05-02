import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Send, Loader, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { getChatHistory, setMessagesAsRead } from '@/services/api';
import websocketService from '@/services/websocket';

const ChatWindow = ({ recipientId, recipientName, onClose }) => {
    const { t, i18n } = useTranslation();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const messagesEndRef = useRef(null);
    const currentUserId = useRef(null);
    const currentUserFirstName = useRef(null);

    useEffect(() => {
        const loadChatData = async () => {
            try {
                const token = localStorage.getItem('token');
                if (token) {
                    const base64Url = token.replace(/"/g, '').split('.')[1];
                    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                    const decoded = JSON.parse(window.atob(base64));
                    currentUserId.current = String(decoded.sub || decoded.userId);
                    // Μετάφραση για το "Εσείς" αν δεν υπάρχει όνομα
                    currentUserFirstName.current = decoded.firstName || t('chat_you');
                }

                const history = await getChatHistory(recipientId);
                setMessages(Array.isArray(history) ? history : []);
                setLoading(false);

                await websocketService.connect();
                
                websocketService.subscribeToUserMessages(currentUserId.current, (message) => {
                    if (String(message.senderId) === String(recipientId) || String(message.recipientId) === String(recipientId)) {
                        setMessages((prev) => [...prev, message]);
                    }
                });
            } catch (error) {
                setLoading(false);
            }
        };

        loadChatData();

        return () => {
            if (currentUserId.current) {
                websocketService.unsubscribeFromUserMessages(currentUserId.current);
            }
        };
    }, [recipientId, t]);

    useEffect(() => {
        if (messages.length > 0 && !isMinimized) {
            const unreadIds = messages
                .filter(msg => String(msg.senderId) === String(recipientId) && !msg.read)
                .map(msg => msg.id);

            if (unreadIds.length > 0) {
                setMessagesAsRead(unreadIds)
                    .then(() => {
                        setMessages(prev => 
                            prev.map(msg => 
                                unreadIds.includes(msg.id) ? { ...msg, read: true } : msg
                            )
                        );
                    })
                    .catch(error => {
                        console.error("Error marking messages as read:", error);
                    });
            }
        }
    }, [messages, recipientId, isMinimized]);

    useEffect(() => {
        if (!isMinimized) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isMinimized]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || sending) return;

        setSending(true);
        try {
            await websocketService.sendMessage(recipientId, newMessage);
            
            const myMsg = {
                id: Date.now(),
                content: newMessage,
                senderId: currentUserId.current,
                senderFirstName: currentUserFirstName.current,
                recipientId: recipientId,
                timestamp: new Date().toISOString(),
                read: false
            };
            
            setMessages((prev) => [...prev, myMsg]);
            setNewMessage('');
        } catch (error) {
            toast.error(t('chat_error_send'));
        } finally {
            setSending(false);
        }
    };

    const formatTime = (timestamp) => {
        return new Date(timestamp).toLocaleTimeString(i18n.language, { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    };

    if (isMinimized) {
        return createPortal(
            <button 
                onClick={() => setIsMinimized(false)}
                className="fixed bottom-6 right-6 w-16 h-16 bg-emerald-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-all z-[10000]"
            >
                <MessageCircle className="w-8 h-8" />
            </button>,
            document.body
        );
    }

    return createPortal(
        <div className="fixed inset-0 flex items-center justify-center p-4 sm:inset-auto sm:bottom-6 sm:right-6 sm:p-0 z-[10000] animate-in slide-in-from-bottom-4 duration-300">
            <div className="w-full max-w-lg sm:w-[380px] h-[80vh] sm:h-[600px] flex flex-col bg-white rounded-[32px] shadow-2xl border border-gray-100 overflow-hidden">
                <div className="bg-emerald-600 p-5 text-white flex justify-between items-center shrink-0 cursor-pointer" onClick={() => setIsMinimized(true)}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-bold">
                            {recipientName?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h3 className="font-bold text-sm leading-none">{recipientName}</h3>
                            <p className="text-[10px] text-emerald-100 mt-1 uppercase font-black tracking-widest">{t('chat_active_status')}</p>
                        </div>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                    {loading ? (
                        <div className="flex items-center justify-center h-full"><Loader className="w-6 h-6 text-emerald-600 animate-spin" /></div>
                    ) : (
                        messages.map((message, idx) => {
                            const isMe = String(message.senderId) === String(currentUserId.current);
                            return (
                                <div key={message.id || idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                    <span className="text-[9px] font-black text-gray-400 mb-1 px-1 uppercase tracking-tighter">
                                        {isMe ? currentUserFirstName.current : recipientName}
                                    </span>
                                    <div className={`max-w-[85%] px-4 py-2 rounded-2xl shadow-sm ${
                                        isMe 
                                        ? 'bg-emerald-600 text-white rounded-tr-none' 
                                        : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                                    }`}>
                                        <p className="text-sm leading-relaxed">{message.content}</p>
                                        <p className={`text-[8px] mt-1 font-black text-right ${isMe ? 'text-emerald-100' : 'text-gray-400'}`}>
                                            {formatTime(message.timestamp)}
                                        </p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <form onSubmit={handleSendMessage} className="p-5 bg-white border-t border-gray-100 flex gap-2">
                    <input 
                        type="text" 
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={t('chat_input_placeholder')}
                        className="flex-1 bg-gray-100 border-none rounded-2xl px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                    />
                    <button type="submit" disabled={!newMessage.trim() || sending} className="w-10 h-10 bg-emerald-600 text-white rounded-full flex items-center justify-center hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200">
                        {sending ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                </form>
            </div>
        </div>,
        document.body
    );
};

export default ChatWindow;