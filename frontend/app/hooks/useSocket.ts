import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export const useSocket = (userId?: string) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [lastMessage, setLastMessage] = useState<{ orderId: string, status: string, customerEmail?: string } | null>(null);

    useEffect(() => {
        const socketIoUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        
        const socketInstance = io(socketIoUrl, {
            transports: ['websocket', 'polling']
        });

        socketInstance.on('connect', () => {
            console.log('Socket connected:', socketInstance.id);
            if (userId) {
                socketInstance.emit('join_user_room', userId);
            }
        });

        socketInstance.on('order_status_changed', (data) => {
            console.log('Order status changed:', data);
            setLastMessage(data);
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
        };
    }, [userId]);

    return { socket, lastMessage };
};
