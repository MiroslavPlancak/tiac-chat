import { Injectable, inject } from "@angular/core";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import { Messages } from "./message.action"
import * as rxjs from 'rxjs';
import { MessageService } from "../../Services/message.service";

@Injectable()

export class MessageEffects {
    
    private messageService = inject(MessageService)
    private action$ = inject(Actions)

    /// API calls /// 
}