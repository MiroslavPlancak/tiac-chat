import { createActionGroup, emptyProps, props } from "@ngrx/store";
import { SafeType } from '../../Utilities/safeType.action'
import { Message } from '../../Models/message.model'
import { PrivateMessage } from "../../Models/privateMessage.model";

export const MESSAGE_SOURCE = 'Messages'

export namespace Messages{

    export namespace Api {

        export const SOURCE = SafeType.Source.from(MESSAGE_SOURCE, 'Api')

        export const Actions = createActionGroup({
            events:{
                //load paginated private messages
                LoadPaginatedPrivateMessagesStarted: props<{ senderId: number, receiverId: number, startIndex: number, endIndex: number }>(),
                LoadPaginatedPrivateMessagesSucceeded: props<{ receiverId: number, privateMessages: any[]}>(),
                LoadPaginatedPrivateMessagesFailed: props<{ error: any }>(),

                //clear private messages 
                ClearPaginatedPrivateMessagesStarted: props<{ userId: number }>(),
                ClearPaginatedPrivateMessagesSucceeded: props<{ userId: number }>(),
                ClearPaginatedPrivateMessagesFailed: props<{ error: any }>(),

                //load paginated public messages
                LoadPaginatedPublicMessagesStarted: props<{ channelId: number, startIndex: number, endIndex: number }>(),
                LoadPaginatedPublicMessagesSucceeded: props<{ channelId: number, publicMessages: any[]}>(),
                LoadPaginatedPublicMessagesFailed: props<{ error: any }>(),

                //clear paginated public messages
                ClearPaginatedPublicMessagesStarted: props<{ channelId: number }>(),
                ClearPaginatedPublicMessagesSucceeded: props<{ channelId: number }>(),
                ClearPaginatedPublicMessagesFailed: props<{ error: any }>(),
            },
            source: SOURCE
        })
    }

    export namespace Hub {
        
        export const SOURCE = SafeType.Source.from(MESSAGE_SOURCE, 'Hub')

        export const Actions = createActionGroup({

            events:{
                //load private message to the state
                LoadPrivateMessageStarted: props<{ privateMessage: Message, receiverId: number }>(),
                LoadPrivateMessageSucceeded: props<{ privateMessage: Message, receiverId: number }>(),
                LoadPrivateMessageFailed: props<{ error: any }>(),

                //receive private message
                ReceivePrivateMessageStarted: props<{ privateMessage: Message, senderId: number }>(),
                ReceivePrivateMessageSucceeded: props<{ privateMessage: Message, senderId: number  }>(),
                ReceivePrivateMessageFailed: props<{ error: any }>(),
            },
            source:SOURCE
        })
    }
}