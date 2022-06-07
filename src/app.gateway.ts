import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'http';
import { Socket } from 'socket.io';

@WebSocketGateway()
export class AppGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {

  users = {};

  @WebSocketServer() wss: Server;

  getKeyByValue(object, value) {
    return Object.keys(object).find(key => object[key] === value);
  }

  handleDisconnect(client: Socket) {
    console.log("disconnected..", client.id)
    delete this.users[this.getKeyByValue(this.users, client)]
    this.wss.emit('userActivity', { users: Object.keys(this.users) })
  }

  handleConnection(client: Socket, ...args: any[]) {
    console.log("connected!", client.id)
    this.wss.emit('userActivity', { users: Object.keys(this.users) })
  }

  afterInit(server: any) {
    console.log("initialized")
  }

  @SubscribeMessage('messageToServer')
  handleMessage(client: Socket, text: { message: string, from: string, to: string }): any {
    console.log(text);
    if(this.users[text.to]) {
      if(text.to == text.from) {
        return { status: 1, message: `Make some friends dude...`}
      }
      this.users[text.to].emit('messageToClient', { from: text.from, message: text.message })
      client.emit('messageToClient', { from: text.from, message: text.message })
    } else {
      return { status: 1, message: `${text.to} is disconnected`}
    }
  }

  @SubscribeMessage('registerUser')
  registerUser(client: Socket, username: string): void {
    this.users[username] = client;
    this.wss.emit('userActivity', { users: Object.keys(this.users) })
  }

  @SubscribeMessage('userActivityToServer')
  sendActiveUsers(client: Socket) {
    let res = { users: Object.keys(this.users) }
    console.log(res);
    return res;
  }
}
