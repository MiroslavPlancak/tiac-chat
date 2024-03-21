import { Component } from '@angular/core';
import { UserService } from '../../Services/user.service';
import { ChannelService } from '../../Services/channel.service';

@Component({
  selector: 'app-chat-header',
  templateUrl: './chat-header.component.html',
  styleUrl: './chat-header.component.css',

})
export class ChatHeaderComponent {

constructor(
  public userService: UserService,
  public channelService: ChannelService
  ) {}
}
