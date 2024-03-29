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
  private tokenRefreshTimer: any; // Timer variable

  constructor(private authService: AuthService) {

    //extract the expiration time of access token and set the BS of it to that value
    this.authService.getAccessTokenExpTime()

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
       // console.log(`expiration time of access token`, this.authService.accessTokenExpirationTime.subscribe(res => console.log(res)))

      }
      
    })
    .catch(err => {
      console.log('Error while starting connection:' + err)
    })

    this.hubConnection.onclose((error) => {
      console.log('Connection closed.');
      console.log(error);
      clearInterval(this.tokenRefreshTimer); 
    });
    console.log(`connection state:`, this.hubConnection.state)
    this.setupTokenRefreshTimer()

  }

  ngOnInit(): void {
   
  }

  ngOnDestroy(): void {
    this.destroy$.next(); 
    this.destroy$.complete();
    
  }
    // method to set up token refresh timer
    private setupTokenRefreshTimer(): void {
      this.tokenRefreshTimer = setInterval(() => {
        console.log('Token refresh timer triggered');
        console.log(this.authService.accessTokenExpirationTimer.value);
        const accessToken = this.authService.getAccessToken();
        const refreshToken = this.authService.getRefreshToken();
        if(accessToken && refreshToken){
        this.authService.refreshTokens(accessToken,refreshToken)
        .pipe(rxjs.take(1))
          .subscribe({
            next: () => {
              console.log('Access token refreshed successfully');
            },
            error: (err) => {
              console.log('Error refreshing access token:', err);
            }
          });
        }
      }, (this.authService.accessTokenExpirationTimer.value * 1000)- 3);
    }
}