import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayInit,
    OnGatewayConnection,
    OnGatewayDisconnect,
    ConnectedSocket,
    SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SocketService } from '../service/socket.service';
@WebSocketGateway({
    namespace: '/',
    cors: {
        origin: '*', // this should be changed to the frontend url like http://localhost:3000, http://localhost:3001, http://localhost:3002, etc.
        methods: '*', // this should be changed to the allowed methods like GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD, CONNECT, TRACE, etc.
        allowedHeaders: '*', // this should be changed to the allowed headers && right now it's for testing purposes
        credentials: true,
    },
    transports: ['polling', 'websocket'],
    pingTimeout: 60000,
    pingInterval: 30000,
})
export class SocketGateway
    implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server = new Server();

    constructor(
        private readonly socketService: SocketService,
    ) { }

    async afterInit() {
        console.log('Socket server is running!');
        this.socketService.setServer(this.server);
    }

    async handleConnection(@ConnectedSocket() client: Socket) {
        console.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        console.log(`Client disconnected: ${client.id}`);
    }

    @SubscribeMessage('session-id')
    handleSessionId(client: Socket, sessionId: string) {
        console.log(`Session ID received: ${sessionId}`);
        client.join(sessionId);
    }

}
