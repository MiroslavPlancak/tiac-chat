import { Injectable, inject } from "@angular/core";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import { Channels } from "../../state/channel/channel.action"
import { ChannelService } from "../../Services/channel.service";
import { Store } from "@ngrx/store";
import { ConnectionService } from "../../Services/connection.service";
import * as rxjs from 'rxjs';

@Injectable()

export class ChannelEffect {

    private channelService = inject(ChannelService)
    private connectionService = inject(ConnectionService)
    private action$ = inject(Actions)
    private store = inject(Store)

    /// API calls ///
    loadAllChannels$ = createEffect(() =>
        this.action$.pipe(
            ofType(Channels.Api.Actions.loadAllChannelsStarted),
            rxjs.switchMap(() =>
                this.channelService.getListOfChannels().pipe(
                    //rxjs.tap((res) => console.log(`effect output:`, res)),
                    rxjs.map((result) => Channels.Api.Actions.loadAllChannelsSucceeded({ channels: result })),
                    rxjs.catchError((error) => rxjs.of(Channels.Api.Actions.loadAllChannelsFailed({ error: error })))
                )
            )
        )
    )

    loadPrivateChannelsByUserId$ = createEffect(() =>
        this.action$.pipe(
            ofType(Channels.Api.Actions.loadPrivateChannelsByUserIdStarted),
            rxjs.switchMap((action) =>
                this.channelService.getListOfPrivateChannelsByUserId(action.userId).pipe(
                    rxjs.map((response) => Channels.Api.Actions.loadPrivateChannelsByUserIdSucceeded({ privateChannels: response })),
                    rxjs.catchError((error) => rxjs.of(Channels.Api.Actions.loadPrivateChannelsByUserIdFailed({ error: error })))
                )
            )
        )
    )

    loadPrivateChannelById$ = createEffect(() =>
        this.action$.pipe(
            ofType(Channels.Api.Actions.loadPrivateChannelByIdStarted),
            rxjs.switchMap((action) => {
                return rxjs.of(Channels.Api.Actions.loadPrivateChannelByIdSucceeded({ channelId: action.channelId }))
            })
        )
    )

    loadUserChannelsByUserId$ = createEffect(() =>
        this.action$.pipe(
            ofType(Channels.Api.Actions.loadUserChannelByUserIdStarted),
            rxjs.switchMap((action) =>
                this.channelService.getAllUserChannelsByUserId(action.userId).pipe(
                    rxjs.map((response) => Channels.Api.Actions.loadUserChannelByUserIdSucceeded({ userChannels: response })),
                    rxjs.catchError((error) => rxjs.of(Channels.Api.Actions.loadUserChannelByUserIdFailed({ error: error })))
                )
            )
        )
    )

    loadParticipantsOfPrivateChannel$ = createEffect(() =>
        this.action$.pipe(
            ofType(Channels.Api.Actions.loadParticipantsOfPrivateChannelStarted),
            rxjs.switchMap((action) =>
                this.channelService.getParticipantsOfPrivateChannel(action.channelId).pipe(
                    rxjs.map((response) => Channels.Api.Actions.loadParticipantsOfPrivateChannelSucceeded({ participants: response })),
                    rxjs.catchError((error) => rxjs.of(Channels.Api.Actions.loadParticipantsOfPrivateChannelFailed({ error: error })))
                )
            )
        )
    )

    loadPrivateUserChannelObj$ = createEffect(() =>
        this.action$.pipe(
            ofType(Channels.Api.Actions.loadPrivateUserChannelStarted),
            rxjs.switchMap((action) =>
                this.channelService.addUserToPrivateChannel(action.userChannelObj).pipe(
                    rxjs.map((response) => Channels.Api.Actions.loadPrivateUserChannelSucceeded({ userChannelObj: response })),
                    rxjs.catchError((error) => rxjs.of(Channels.Api.Actions.loadPrivateUserChannelFailed({ error: error })))
                )
            )
        )
    )

    removeUserFromUserChannelObj$ = createEffect(()=>
        this.action$.pipe(
            ofType(Channels.Api.Actions.removeUserFromUserChannelStarted),
            rxjs.switchMap((action) => 
                this.channelService.removeUserFromPrivateConversation(action.userId, action.channelId).pipe(
                    rxjs.map((response) => Channels.Api.Actions.removeUserFromUserChannelSucceeded({ userId: response.userId, channelId: response.channelId})),
                    rxjs.catchError((error) => rxjs.of(Channels.Api.Actions.removeUserFromUserChannelFailed({ error: error })))
                )
            )
        )
    )

    /// Hub calls ///

    addUserToPrivateChannel$ = createEffect(()=>
        this.action$.pipe(
            ofType(Channels.Hub.Actions.inviteUserToPrivateChannelStarted),
            rxjs.switchMap((action) =>
                rxjs.of(action.privateChannel).pipe(
                    rxjs.map((channel)=> Channels.Hub.Actions.inviteUserToPrivateChannelSucceeded({ channelId:channel.id })),
                    rxjs.catchError((error) => rxjs.of(Channels.Hub.Actions.inviteUserToPrivateChannelFailed({ error: error })))
                )
            )
        )
    )

    kickUserFromPrivateChannel$ = createEffect(() =>
        this.action$.pipe(
            ofType(Channels.Hub.Actions.kickUserFromPrivateChannelStarted),
            rxjs.switchMap((action) =>
                rxjs.of(action.privateChannelId).pipe(
                    rxjs.map((channelId) => Channels.Hub.Actions.kickUserFromPrivateChannelSucceeded({ privateChannelId: channelId })),
                    rxjs.catchError((error) => rxjs.of(Channels.Hub.Actions.kickUserFromPrivateChannelFailed({ error: error })))
                )
            )
        )
    )

    addNewPrivateChannel$ = createEffect(()=>
        this.action$.pipe(
            ofType(Channels.Hub.Actions.addNewPrivateChannelStarted),
            rxjs.switchMap((action) =>
                rxjs.of(action.newPrivateChannel).pipe(
                    rxjs.map((newPrivateChannel) => Channels.Hub.Actions.addNewPrivateChannelSucceeded({ newPrivateChannel: newPrivateChannel})),
                    rxjs.catchError((error) => rxjs.of(Channels.Hub.Actions.addNewPrivateChannelFailed({ error: error })))
                )
            )
        )
    )

    /// Flags /// 

    loadCurrentlyClickedConversation$ = createEffect(() =>
        this.action$.pipe(
            ofType(Channels.Flag.Actions.loadCurrentlyClickedConversationStarted),
            rxjs.switchMap((action) =>
                rxjs.of(action.conversationId).pipe(
                    rxjs.map((response) => Channels.Flag.Actions.loadCurrentlyClickedConversationSucceeded({ conversationId: response })),
                    rxjs.catchError((error) => rxjs.of(Channels.Flag.Actions.loadCurrentlyClickedConversationFailed({ error: error })))
                )
            )
        )
    )
}