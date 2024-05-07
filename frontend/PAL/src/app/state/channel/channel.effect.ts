import { Injectable, inject } from "@angular/core";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import { Channels } from "../../state/channel/channel.action"
import { ChannelService } from "../../Services/channel.service";
import { Store } from "@ngrx/store";
import { ConnectionService } from "../../Services/connection.service";
import * as rxjs from 'rxjs';

@Injectable()

export class ChannelEffect{

    private channelService = inject(ChannelService)
    private connectionService = inject(ConnectionService)
    private action$ = inject(Actions)
    private store = inject(Store)

    loadAllChannels$ = createEffect(()=>
        this.action$.pipe(
            ofType(Channels.Api.Actions.loadAllChannelsStarted),
            rxjs.switchMap(()=>
                this.channelService.getListOfChannels().pipe(
                    rxjs.tap((res) => console.log(`effect output:`,res)),
                    rxjs.map((result) => Channels.Api.Actions.loadAllChannelsSucceeded({ channels: result})),
                    rxjs.catchError((error) => rxjs.of(Channels.Api.Actions.loadAllChannelsFailed({ error: error })))
                )
            )
        )
    )
}