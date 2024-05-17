import { createActionGroup, emptyProps, props } from "@ngrx/store";
import { SafeType } from '../../Utilities/safeType.action'
import { Message } from '../../Models/message.model'

export const MESSAGE_SOURCE = 'Messages'

export namespace Messages{

    export namespace Api {

        export const SOURCE = SafeType.Source.from(MESSAGE_SOURCE, 'Api')

        export const Actions = createActionGroup({
            events:{
                //load paginated private messages
                LoadPaginatedPrivateMessagesStarted: props<{ senderId: number, receiverId: number, startIndex: number, endIndex: number }>(),
                LoadPaginatedPrivateMessagesSucceeded: props<{ privateMessages: any[]}>(),
                LoadPaginatedPrivateMessagesFailed: props<{ error: any }>(),

                //clear private messages 
                ClearPaginatedPrivateMessagesStarted: props<{ userId: number }>(),
                ClearPaginatedPrivateMessagesSucceeded: props<{ userId: number }>(),
                ClearPaginatedPrivateMessagesFailed: props<{ error: any }>(),
            },
            source: SOURCE
        })
    }
}