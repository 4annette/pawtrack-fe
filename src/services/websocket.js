import Stomp from 'stompjs';

const getWsUrl = () => {
    const apiUrl = import.meta.env.VITE_SPRING_BOOT_API_URL || 'http://localhost:8080/api/v1';
    const baseUrl = apiUrl.replace('/api/v1', '');
    const wsProtocol = baseUrl.startsWith('https') ? 'wss' : 'ws';
    const cleanBase = baseUrl.replace(/^https?:\/\//, '');
    return `${wsProtocol}://${cleanBase}/api/v1/ws`;
};

const WS_URL = getWsUrl();

class WebSocketService {
    constructor() {
        this.stompClient = null;
        this.connected = false;
        this.connectionPromise = null;
        this.messageListeners = new Map();
    }

    connect() {
        if (this.connected && this.stompClient?.connected) {
            return Promise.resolve();
        }

        if (this.connectionPromise) {
            return this.connectionPromise;
        }

        this.connectionPromise = new Promise((resolve, reject) => {
            const token = localStorage.getItem('token')?.replace(/"/g, '') || '';
            const socket = new WebSocket(WS_URL);
            this.stompClient = Stomp.over(socket);
            this.stompClient.debug = null;

            const headers = {
                Authorization: `Bearer ${token}`
            };

            this.stompClient.connect(headers, 
                (frame) => {
                    this.connected = true;
                    this.connectionPromise = null;
                    resolve(frame);
                }, 
                (error) => {
                    this.connected = false;
                    this.connectionPromise = null;
                    reject(error);
                }
            );
        });

        return this.connectionPromise;
    }

    disconnect() {
        if (this.stompClient) {
            this.stompClient.disconnect();
            this.connected = false;
            this.connectionPromise = null;
        }
    }

    sendMessage(recipientId, content) {
        if (!this.connected || !this.stompClient) {
            return Promise.reject('Not connected');
        }

        const message = {
            recipientId: recipientId,
            content: content
        };

        try {
            this.stompClient.send('/app/chat.send', {}, JSON.stringify(message));
            return Promise.resolve();
        } catch (error) {
            return Promise.reject(error);
        }
    }

    subscribeToUserMessages(userId, callback) {
        if (!this.connected || !this.stompClient) return;

        const subscription = this.stompClient.subscribe(`/user/${userId}/queue/messages`, (message) => {
            if (message.body) {
                callback(JSON.parse(message.body));
            }
        });

        this.messageListeners.set(userId, subscription);
        return subscription;
    }

    unsubscribeFromUserMessages(userId) {
        const subscription = this.messageListeners.get(userId);
        if (subscription) {
            subscription.unsubscribe();
            this.messageListeners.delete(userId);
        }
    }

    isConnected() {
        return this.connected;
    }
}

export default new WebSocketService();