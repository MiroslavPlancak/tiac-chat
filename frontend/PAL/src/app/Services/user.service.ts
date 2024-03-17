import { HttpClient } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import { AuthService } from './auth.service';
import { BehaviorSubject, Observable, Subject, tap } from 'rxjs';
import * as rxjs from 'rxjs';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { ChannelService } from './channel.service';
import { AddUserToPrivateChannelComponent } from '../Components/add-user-to-private-channel/add-user-to-private-channel.component';

export interface User {
  id: number, 
  firstName: string, 
  lastName: string, 
  email: string
}

@Injectable({
  providedIn: 'root'
})
export class UserService implements OnDestroy{

  
  private destroy$ = new rxjs.Subject<void>();
  public allUsersSubject$ = new BehaviorSubject<User[]>([])
  isOnline: boolean = false
  
  writingTo = new BehaviorSubject<string> ("@public_root")
  fullName = ""
  writeToChannelName =  new BehaviorSubject<string> ("")
  
  private apiUrl = "http://localhost:5008/api/users/";

  constructor(
    private authService: AuthService,
    private http: HttpClient,
    private chanelService:ChannelService,
    private matDialog: MatDialog,
  ) { }
  
  ngOnDestroy(): void {
    this.destroy$.next(); 
    this.destroy$.complete();
  }

  getById(userId: number): Observable<User> {
    if(!userId){ throw new Error()}
    const url = `${this.apiUrl}${userId}`;
    // const token = this.auth.getAccessToken();
    return this.http.get<any>(url);
  }

  getAllUsers():Observable<User[]>{
    const url = `${this.apiUrl}getAll`
    return this.http.get<User[]>(url);
  }

  getAllUsersBS$(): Observable<User[]> {
    const url = `${this.apiUrl}getAll`;
    return this.http.get<User[]>(url).pipe(
      tap(users => this.allUsersSubject$.next(users))
    );
  }

  currentUserLogged$ = this.authService.userId$.pipe(                              
    rxjs.filter(userId => userId != null),
    rxjs.distinctUntilChanged(),
    rxjs.switchMap(userid => {
      return this.getById(userid as number);
    }),
    rxjs.map(user => {
      return {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
      }
    }),
    rxjs.takeUntil(this.destroy$)
  )

  currentUserName$ = this.authService.userId$.pipe(                                  
    rxjs.filter((userId: any) => userId != null),
    rxjs.distinctUntilChanged(),
    rxjs.switchMap((userid: number) => {
      return this.getById(userid as number);
    }),
    rxjs.map(user => user.firstName),
    rxjs.takeUntil(this.destroy$)
  )
  
  addUserToPrivateChannel(channelId: number) {

    const dialogConfig = new MatDialogConfig()
    dialogConfig.disableClose = false
    dialogConfig.autoFocus = true
  
  console.log(`this.chanelService.isCurrentUserOwner$.value`,this.chanelService.isCurrentUserOwner$.value)
  console.log(`privateChannelId`, this.chanelService.SelectedChannel$.value)
    const dialogData = {
      privateChannelId: this.chanelService.SelectedChannel$.value,
      isOwner: this.chanelService.isCurrentUserOwner$.value
    }
  
    dialogConfig.data = dialogData;
    const dialogRef = this.matDialog.open(AddUserToPrivateChannelComponent, dialogConfig);
  
  
  }
}
