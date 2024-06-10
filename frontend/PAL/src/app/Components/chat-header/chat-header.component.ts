import { Component } from '@angular/core';
import { UserService } from '../../Services/user.service';
import { ChannelService } from '../../Services/channel.service';
import { Store } from '@ngrx/store';
import { Channels } from '../../state/channel/channel.action'
import { selectPrivateChannelById } from '../../state/channel/channel.selector';
import * as rxjs from 'rxjs';
@Component({
  selector: 'app-chat-header',
  templateUrl: './chat-header.component.html',
  styleUrl: './chat-header.component.css',

})
export class ChatHeaderComponent {
  // curentlyClickedPrivateChannel$ = this.channelService.curentlyClickedPrivateChannel$.subscribe((clickedChannel)=> {
  //     this.store.dispatch(Channels.Api.Actions.loadPrivateChannelByIdStarted({ channelId: clickedChannel}))
  // })
 selectedPrivateChannel$ = this.store.select(selectPrivateChannelById).pipe(
   rxjs.map(privateChannel => privateChannel.length > 0)
 )
  
constructor(
  public userService: UserService,
  public channelService: ChannelService,
  private store: Store,
  ) {}
}
