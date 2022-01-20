import { Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import * as Stomp from '@stomp/stompjs';
import { BehaviorSubject, Observable, of, Subject } from 'rxjs';
import * as SockJS from 'sockjs-client';
import { MessageInterface } from '../interfaces/message-interface';

@Injectable({
  providedIn: 'root'
})
export class NativeSocketService {

  private readonly endpoint: string = `${environment.socketApiURL}`;
  private readonly requestEndPoint: string = '/app';
  private readonly channel: string = '/topic/public';

  private _socket!: WebSocket;
  private _client!: Stomp.CompatClient;

  private _isConnected: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  private _onReceive: Subject<any> = new Subject<any>();

  private _keepSocket: Subject<boolean> = new Subject();

  constructor() { }

  public get isConnected(): BehaviorSubject<boolean> {
    return this._isConnected;
  }

  public get onReceive(): Subject<any> {
    return this._onReceive;
  }

  public get keepSocket(): Subject<boolean> {
    return this._keepSocket;
  }

  public connect(): void {
    this._socket = new SockJS(this.endpoint);
    this._client = Stomp.Stomp.over(this._socket);

    // Establish a communication between client and socket server
    this._client.connect({}, (frame: any) => {
      console.log(`Client was connected`);
      this._isConnected.next(true);
      this.listen();
    })
  }

  public disconnect(): void {
    if (this._client !== null) {
      this._client.disconnect();
      this._isConnected.next(false);
      this._keepSocket.next(false);
    }
  }

  private listen(): void {
    this._client.subscribe(
      this.channel,
      (response: any) => {
        console.log(`Socket server says : ${response}`);
        this._onReceive.next(JSON.parse(response.body));
      }
    );
  }

  public send(endpoint: string, message: MessageInterface): void {
    this._client.send(
      `${this.requestEndPoint}${endpoint}`,
      {
        priority: 9
      },
      JSON.stringify(message)
    );
  }
}
