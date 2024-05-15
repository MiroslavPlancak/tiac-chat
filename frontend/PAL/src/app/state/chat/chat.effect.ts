import { Injectable, inject } from "@angular/core";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import { Store } from "@ngrx/store";
import * as rxjs from 'rxjs';
import { ChatService } from "../../Services/chat.service";

@Injectable()

export class ChatEffect {
    
        private chatService = inject(ChatService)
        private action$ = inject(Actions)


        /// API calls /// 
        
}