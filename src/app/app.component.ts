import { Component, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { MessageInterface, MessageType } from './core/interfaces/message-interface';
import { NativeSocketService } from './core/services/native-socket.service';

import { takeUntil } from 'rxjs/operators';
import * as moment from 'moment';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'sockjs';

  public nickname: string = '';
  public message: string = '';

  public incomingMessages: MessageInterface[] = [];
  public emitMessages: MessageInterface[] = [];

  public chatters: {name: string, isTyping$: BehaviorSubject<boolean>}[] = [];

  public constructor(public chatService: NativeSocketService) {}

  public onConnect(): void {
    this.doConnect();
  }

  public processMessage(): void {
    const emitMessage: MessageInterface = {
      sender: this.nickname,
      content: this.message,
      date: moment(),
      type: MessageType.CHAT
    };

    this.chatService.send(
      '/chat.message',
      emitMessage
    );
    this.message = '';
    this.incomingMessages.push(emitMessage);
  }
  
  public ngOnInit(): void {}

  public ngOnDestroy(): void {
      this.disconnect();
  }

  private doConnect(): void {
    this.chatService.connect();

    this.chatService.isConnected
      .pipe(
        takeUntil(this.chatService.keepSocket)
      )
      .subscribe((isConnected: boolean) => {
        if (isConnected) {
          this.chatService.send(
            '/chat.register',
            {
              sender: this.nickname,
              date: moment(),
              type: MessageType.JOIN
            }
          );

          // Get User list from socket
          this.chatService.send(
            '/chat.welcome',
            {
              sender: this.nickname,
              date: moment(),
              type: MessageType.LIST
            }
          );

          // Subscribe to incoming socket messages
          this.chatService.onReceive
            .pipe(
              takeUntil(this.chatService.keepSocket)
            )
            .subscribe((response: MessageInterface) => {
              console.log(`Server sent : ${JSON.stringify(response)}`);
              if (response.sender !== this.nickname && response.type === MessageType.CHAT) {
                // Push new incoming message
                this.incomingMessages.push(response);

                // Push chatter if new...
                this._addChatter(response.sender);

                // Update typing status after getting message
                this._updateTypingStatus(response.sender, false);
              }

              if (response.sender !== this.nickname && response.type === MessageType.TYPING) {
                // Update typing status for user
                this._updateTypingStatus(response.sender, true);
              }

              if (response.type === MessageType.LIST) {
                // My Logic here
                console.log(JSON.stringify(response));
              }
          });
        }
      });
  }

  public sendTypingMessage(): void {
    this.chatService.send(
      '/chat.typing',
      {
        sender: this.nickname,
        content: `${this.nickname} is typing...`,
        date: moment(),
        type: MessageType.TYPING
      }
    );    
  }

  public disconnect(): void {
    this.chatService.disconnect();
    this.incomingMessages = [];
  }

  private _addChatter(chatter: string): void {
    if (this.chatters.filter((existingChatter: any) => existingChatter.name === chatter).length === 0) {
      this.chatters.push(
        {
          name: chatter,
          isTyping$: new BehaviorSubject<boolean>(false)
        }
      );
    }
  }

  private _updateTypingStatus(chatter: string, state: boolean): void {
    const theChatter: any = this.chatters.find((existingChatter: any) => existingChatter.name === chatter);
    const newState: any = {... theChatter, isTyping$: new BehaviorSubject<boolean>(state)};
    this.chatters.splice(
      this.chatters.findIndex((existingChatter: any) => existingChatter.name === chatter),
      1,
      newState
    )
  }
}
