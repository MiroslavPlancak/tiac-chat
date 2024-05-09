import { createActionGroup, emptyProps, props } from "@ngrx/store";
import { Channel } from '../../Models/channel.model'
import { SafeType } from '../../Utilities/safeType.action'

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

            },
            source: SOURCE
        })
    }

}