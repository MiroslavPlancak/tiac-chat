import { Injectable, OnDestroy, OnInit } from '@angular/core';
import * as rxjs from 'rxjs';
import * as signalR from '@microsoft/signalr';
import { AuthService } from './auth.service';
import { NotificationDialogService } from './notification-dialog.service';
import { Store } from '@ngrx/store';
import { Users } from '../state/user/user.action'
import { selectAllUsers, selectCurrentUser, selectUserById } from '../state/user/user.selector';

@Injectable({
  providedIn: 'root'
})
export class ConnectionService implements OnInit, OnDestroy{


  public hubConnection: signalR.HubConnection
  private destroy$ = new rxjs.Subject<void>();
  currentUserId$ = this.authService.userId$;
  private tokenRefreshTimer: any; // Timer variable

  constructor(
    private authService: AuthService,
    private dialogService:NotificationDialogService,
    private store: Store
    ) {

    //extract the expiration time of access token and set the BS of it to that value
    this.authService.getAccessTokenExpTime()

    // set the status of the RefreshToken by subscription to refreshTokenStatus bs
    this.authService.refreshTokenStatus
    .subscribe(res => {
     // console.log(`refreshTokenStatus from connection:`, res)
      if(res == null){
        this.authService.logout()
        this.dialogService.openNotificationDialog(
          `Your session expired`,
          `please log in again.`,
          `okay`,
          true,
          )
      }
     
    })

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

        //ng Rx here we load the currently connected user into the state
        this.store.dispatch(Users.Hub.Actions.loadConnectedUserStarted({ connectedUserId: this.currentUserId$.getValue() as number }))
    
       // console.log("connection started with connectionId:", this.hubConnection.connectionId);
       // console.log(`expiration time of access token`, this.authService.accessTokenExpirationTime.subscribe(res => console.log(res)))
       this.setupTokenRefreshTimer()
        this.authService.tokenRefreshTimer$.subscribe(timer => {
          if (timer) {
           // console.log('Token refresh timer:', timer);
            // Put any logic that depends on the timer here
          }
        });
      }
      
    })
    .catch(err => {
     // console.log('Error while starting connection:' + err)
    })

    this.hubConnection.onclose((error) => {
      console.log('Connection closed.');
      console.log(error);
     // clearInterval(this.tokenRefreshTimer); 
   
    });
    console.log(`connection state:`, this.hubConnection.state)
    
  }

  ngOnInit(): void {
   
  }

  ngOnDestroy(): void {
    this.destroy$.next(); 
    this.destroy$.complete();
    
  }
    // method to set up token refresh timer
   public setupTokenRefreshTimer(): void {

    if(this.authService.tokenRefreshTimer$){
      clearInterval(this.authService.tokenRefreshTimer$.getValue())
    }

    this.authService.tokenRefreshTimer$.next(setInterval(() => {
        console.log('Token refresh timer triggered');
        //todo: edge case - this is 0 when the token expires first time naturally and causes infinite refreshes when logged in afterwards
        console.log(this.authService.accessTokenExpirationTimer.value);
        const accessToken = this.authService.getAccessToken();
        const refreshToken = this.authService.getRefreshToken();
        if (accessToken && refreshToken) {
            this.authService.refreshTokens(accessToken, refreshToken)
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
    }, (this.authService.accessTokenExpirationTimer.value * 1000) - 3));
}
}
