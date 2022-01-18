import { Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import * as Stomp from '@stomp/stompjs';
import * as SockJS from 'sockjs-client';

@Injectable({
  providedIn: 'root'
})
export class NativeSocketService {

  private readonly endpoint: string = `${environment.socketApiURL}`;
  private readonly requestEndPoint: string = '/app';
  private readonly channel: string = '/topic/public';

  private _socket!: WebSocket;
  private _client!: Stomp.CompatClient;
  constructor() { }

  public connect(): void {
    this._socket = new SockJS(this.endpoint);
    this._client = Stomp.Stomp.over(this._socket);

    // Establish a communication between client and socket server
    this._client.connect({}, (frame: any) => {
      console.log(`Client was connected`);
      this.listen();
    })
  }

  public disconnect(): void {
    if (this._client !== null) {
      this._client.disconnect();
    }
  }

  private listen(): void {
    this._client.subscribe(
      this.channel,
      (response: any) => {
        console.log(`Socket server says : ${response}`);
      }
    );
  }

  public send(endpoint: string, message: any): void {
    this._client.send(
      `${this.requestEndPoint}/${endpoint}`,
      {
        priority: 9
      },
      JSON.stringify(message)
    );
  }
}
