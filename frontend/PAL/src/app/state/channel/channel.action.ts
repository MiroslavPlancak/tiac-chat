import { createActionGroup, emptyProps, props } from "@ngrx/store";
import { Channel } from '../../Models/channel.model'
import { SafeType } from '../../Utilities/safeType.action'
import { UserChannel } from "../../Models/userChannel.model";
import { User } from "../../Models/user.model";

export const CHANNEL_SOURCE = 'Channels'

export namespace Channels {

    export namespace Api {

        export const SOURCE = SafeType.Source.from(CHANNEL_SOURCE, 'Api')

        export const Actions = createActionGroup({
            events: {

                //load all channels
                LoadAllChannelsStarted: emptyProps(),
                LoadAllChannelsSucceeded: props<{ channels: Channel[] }>(),
                LoadAllChannelsFailed: props<{ error: any }>(),

                //load private channels by user ID
                LoadPrivateChannelsByUserIdStarted: props<{ userId: number }>(),
                LoadPrivateChannelsByUserIdSucceeded: props<{ privateChannels: Channel[] }>(),
                LoadPrivateChannelsByUserIdFailed: props<{ error: any}>(),

                //load channel by channel ID
                LoadPrivateChannelByIdStarted: props<{ channelId: number }>(),
                LoadPrivateChannelByIdSucceeded: props<{ channelId: number }>(),
                LoadPrivateChannelByIdFailed: props<{ error: any}>(),

                //load userChannel objects by currently logged userId
                LoadUserChannelByUserIdStarted: props<{ userId: number }>(),
                LoadUserChannelByUserIdSucceeded:props<{ userChannels: UserChannel[] }>(),
                LoadUserChannelByUserIdFailed:props<{ error: any }>(),

                //load participants of the private channel by channelID
                LoadParticipantsOfPrivateChannelStarted: props<{ channelId: number }>(),
                LoadParticipantsOfPrivateChannelSucceeded: props<{ participants: UserChannel[] }>(),
                LoadParticipantsOfPrivateChannelFailed: props<{ error: any }>(),

                //load user to private channel by userChannel obj
                LoadPrivateUserChannelStarted: props<{ userChannelObj: UserChannel }>(),
                LoadPrivateUserChannelSucceeded: props<{ userChannelObj: UserChannel }>(),
                LoadPrivateUserChannelFailed: props<{ error: any }>(),

                //remove user from private channel by userId
                RemoveUserFromUserChannelStarted: props<{ userId: number, channelId: number }>(),
                RemoveUserFromUserChannelSucceeded: props<{ userId: number, channelId: number }>(),
                RemoveUserFromUserChannelFailed: props<{ error: any }>(),

            },
            source: SOURCE
        })
    }

    export namespace Hub{
        
        export const SOURCE = SafeType.Source.from(CHANNEL_SOURCE, 'Hub')

            export const Actions = createActionGroup({
                events:{
                    //add user to private channel
                    InviteUserToPrivateChannelStarted: props<{ privateChannel: Channel }>(),
                    InviteUserToPrivateChannelSucceeded: props<{ channelId: number }>(),
                    InviteUserToPrivateChannelFailed: props<{ error: any }>(),

                    //remove user from private channel
                    KickUserFromPrivateChannelStarted: props<{ privateChannelId: number }>(),
                    KickUserFromPrivateChannelSucceeded: props<{ privateChannelId: number }>(),
                    KickUserFromPrivateChannelFailed: props<{ error: any }>(),

                    //add new private channel to the state
                    AddNewPrivateChannelStarted: props<{ newPrivateChannel: Channel }>(),
                    AddNewPrivateChannelSucceeded: props<{ newPrivateChannel: Channel }>(),
                    AddNewPrivateChannelFailed: props<{ error: any }>(),
                },

                source:SOURCE
            })
    }

    export namespace Flag{

        export const SOURCE = SafeType.Source.from(CHANNEL_SOURCE, 'Flag')

            export const Actions = createActionGroup({
                events:{

                    //load currently clicked conversation   
                    LoadCurrentlyClickedConversationStarted: props<{ conversationId: number | undefined }>(),
                    LoadCurrentlyClickedConversationSucceeded: props<{ conversationId: number | undefined }>(),
                    LoadCurrentlyClickedConversationFailed: props<{ error: any}>(),
                },
                source: SOURCE
            })
    }

}