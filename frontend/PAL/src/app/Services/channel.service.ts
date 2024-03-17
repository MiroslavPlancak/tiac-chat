import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import * as rxjs from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChannelService {

  private apiUrl = "http://localhost:5008/api/channels"
  SelectedChannel$ = new rxjs.BehaviorSubject<number | undefined>(8); 
  isPrivateChannel$ = new rxjs.BehaviorSubject<boolean>(false);
  selectedConversation$ = new rxjs.BehaviorSubject<number>(8);
  isCurrentUserOwner$ = new rxjs.BehaviorSubject<object>({});
  isOwnerOfPrivateChannel$ = new rxjs.BehaviorSubject<boolean>(false);

  constructor(
    private http: HttpClient
  ) { }

 getListOfChannels():Observable<any>{
  const url = `${this.apiUrl}/getAll`
  return this.http.get(url);
 }

 createNewChannel(name:string,visibility:number, createdBy:number):Observable<any>{
  const url =`${this.apiUrl}`
  const channel:any =
  {
    name: name,
    visibility: visibility,
    createdBy: createdBy
  }
  //console.log("channel service side:",channel)
  return this.http.post(url,channel);
 }

 getListOfPrivateChannelsByUserId(loggedUserId:number):Observable<any>{
  const url = `${this.apiUrl}/privateChannels?userId=${loggedUserId}`
  return this.http.get(url)
 }

 addUserToPrivateChannel(userChannel:any):Observable<any>{
  const url = `${this.apiUrl}/userChannel`;
  return this.http.post(url,userChannel);
 }

 getListOfPrivateChannelsUserhasAccessTo(userId: number):Observable<any>{
  const url =`${this.apiUrl}/privateChannels?userId=${userId}`
  return this.http.get(url);
 }

 getParticipantsOfPrivateChannel(channelId: number):Observable<any>{
  const url = `${this.apiUrl}/participants?channelId=${channelId}`
  return this.http.get(url);
 }

 removeUserFromPrivateConversation(userId: number, channelId:number):Observable<any>{
  const url=`${this.apiUrl}/userchannel?userId=${userId}&channelId=${channelId}`
  return this.http.delete(url);
 }

 
 
}
