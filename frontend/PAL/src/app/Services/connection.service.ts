import { Injectable, OnDestroy, OnInit } from '@angular/core';
import * as rxjs from 'rxjs';
import * as signalR from '@microsoft/signalr';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ConnectionService implements OnInit, OnDestroy{


  public hubConnection: signalR.HubConnection
  private destroy$ = new rxjs.Subject<void>();
  currentUserId$ = this.authService.userId$;
  
  constructor(private authService: AuthService) {

    console.log(`currentUserId$`, this.currentUserId$.getValue())
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl('http://localhost:5008/Chathub', {
        accessTokenFactory: () => {
          const token = this.authService.getAccessToken();
          if (token) {
            return token;
          }
          throw new Error("Cannot establish connection without access token.");
        }
      })
      .build();

      
    this.hubConnection
    .start()
    .then(() => {
      if (this.hubConnection.connectionId != undefined) {
        console.log("connection started with connectionId:", this.hubConnection.connectionId);
      }
      
    })
    .catch(err => {
      console.log('Error while starting connection:' + err)
    })

    this.hubConnection.onclose((error) => {
      console.log('Connection closed.');
      console.log(error);
    });

  }

  ngOnInit(): void {
   
  }

  ngOnDestroy(): void {
    this.destroy$.next(); 
    this.destroy$.complete();
  }

}
