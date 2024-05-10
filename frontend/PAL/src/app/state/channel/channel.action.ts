import { createActionGroup, emptyProps, props } from "@ngrx/store";
import { Channel } from '../../Models/channel.model'
import { SafeType } from '../../Utilities/safeType.action'
import { UserChannel } from "../../Models/userChannel.model";

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

            },
            source: SOURCE
        })
    }

    export namespace Hub{
        
        export const SOURCE = SafeType.Source.from(CHANNEL_SOURCE, 'Hub')

            export const Actions = createActionGroup({
                events:{
                    //add user to private channel
                    AddUserToPrivateChannelStarted: props<{ privateChannel: Channel }>(),
                    AddUserToPrivateChannelSucceeded: props<{ channelId: number }>(),
                    AddUserToPrivateChannelFailed: props<{ error: any }>(),

                    //remove user from private channel
                    RemoveUserFromPrivateChannelStarted: props<{ privateChannelId: number }>(),
                    RemoveUserFromPrivateChannelSucceeded: props<{ privateChannelId: number }>(),
                    RemoveUserFromPrivateChannelFailed: props<{ error: any }>(),
                },

                source:SOURCE
            })
    }

}