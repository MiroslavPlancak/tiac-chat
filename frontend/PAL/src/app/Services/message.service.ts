import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap, BehaviorSubject } from 'rxjs';
import { PrivateMessage } from './chat.service';
import * as rxjs from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MessageService {

  canLoadMorePrivateMessages$ = new rxjs.BehaviorSubject<boolean>(false);
  canLoadMorePublicMessages$ = new rxjs.BehaviorSubject<boolean>(false);

  initialPublicMessageStartIndex$ = new rxjs.BehaviorSubject<number>(0);
  initialPrivateMessageStartIndex$ = new rxjs.BehaviorSubject<number>(0);

  public totalPublicChannelMessagesNumber$ = new rxjs.BehaviorSubject<number>(0);
  public totalPrivateConversationMessagesNumber$ = new rxjs.BehaviorSubject<number>(0);
  
  receivedPublicMessages$ = new rxjs.BehaviorSubject<any[]>([]);
  receivedPrivateMessages$ = new rxjs.BehaviorSubject<PrivateMessage[]>([]);
  
  privateMessageSeenStatus$ = new rxjs.BehaviorSubject<boolean>(false)
  isDirectMessage = new rxjs.BehaviorSubject<boolean>(false);
  isDirectMessageOffline = new rxjs.BehaviorSubject<boolean>(false);
  
  private apiUrl = "http://localhost:5008/api/messages/";

  constructor(private http: HttpClient) { 
 
  }




  //check this- what does it even do? Can it be deleted?
  
  getTheLastPrivateConversation(sentFromUserId: number): Observable<number[]> {
    return this.http.get<any[]>(this.apiUrl + 'getAll').pipe(
      map(messages => {
        // Filter messages based on sentFromUser ID
        const filteredMessages = messages.filter(message => message.sentFromUserId === sentFromUserId);

        // Extract sentToUser IDs from filtered messages
        return filteredMessages.map(message => message.sentToUser);
      })
    );
  }
  
  loadPaginatedPrivateMessages
  (  senderId:number,
     receiverId:number, 
     startIndex: number, 
     endIndex: number
  ) : Observable<any[]>
  {
    const fullPath = `getPaginatedPrivateMessages?senderId=${senderId}&receiverId=${receiverId}&startIndex=${startIndex}&endIndex=${endIndex}`;
    return this.http.get<PrivateMessage[]>(this.apiUrl+fullPath).pipe(
      map(messages=> messages.reverse())
    )
  }

  loadPublicMessages(): Observable<any> {
    return this.http.get(this.apiUrl + 'getAll');

  }

  loadMessagesByChannelId(channelId: number): Observable<any> {
    return this.http.get(this.apiUrl + 'getMessagesByChannelId?channelId=' + channelId);
  }

  loadPaginatedPublicMessagesById
    (
      channelId: number,
      startIndex: number,
      endIndex: number
    ): Observable<any[]> 
    {
    return this.http.get<Observable <any>[]>
      (this.apiUrl + `getPaginatedPublicChannelMessages?channelId=${channelId}&startIndex=${startIndex}&endIndex=${endIndex}`)
      .pipe(
        map(messages => messages.reverse())
      )
    }

  loadPrivateMessages(senderId: number, receiverId: number): Observable<any> {
    //return this.http.get(this.apiUrl+`sender:${senderId}receiver:${receiverId}`);
    if (receiverId !== undefined) {
      return this.http.get(this.apiUrl, {
        params: {
          senderId,
          receiverId
        }
      })
    }
    else {
      throw new Error();

    }
  }

  loadPrivateChannelMessages(senderId: number, receiverId:number, channelId: number):Observable<any>{
    if(receiverId !==undefined && channelId !== undefined){
      return this.http.get(this.apiUrl,{
        params: {
          senderId,
          receiverId,
          channelId
        }
      })
    }else{
      throw new Error();
    }
  }

}
