import { io } from 'socket.io-client';
export const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
    {
        transports: ['websocket'],
    }
);
export let socketId: string | undefined;
socket.on('connect', () => {
    socketId = socket.id;
});
