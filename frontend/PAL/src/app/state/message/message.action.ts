import { createActionGroup, emptyProps, props } from "@ngrx/store";
import { SafeType } from '../../Utilities/safeType.action'
import { Message } from '../../Models/message.model'
import { PrivateMessage } from "../../Models/privateMessage.model";
import { User } from "../../Models/user.model";

export const MESSAGE_SOURCE = 'Messages'

export namespace Messages {

    export namespace Api {

        export const SOURCE = SafeType.Source.from(MESSAGE_SOURCE, 'Api')

        export const Actions = createActionGroup({
            events: {
                //load paginated private messages
                LoadPaginatedPrivateMessagesStarted: props<{ senderId: number, receiverId: number, startIndex: number, endIndex: number }>(),
                LoadPaginatedPrivateMessagesSucceeded: props<{ receiverId: number, privateMessages: any[] }>(),
                LoadPaginatedPrivateMessagesFailed: props<{ error: any }>(),

                //clear private messages 
                ClearPaginatedPrivateMessagesStarted: props<{ userId: number }>(),
                ClearPaginatedPrivateMessagesSucceeded: props<{ userId: number }>(),
                ClearPaginatedPrivateMessagesFailed: props<{ error: any }>(),

                //load paginated public messages
                LoadPaginatedPublicMessagesStarted: props<{ channelId: number, startIndex: number, endIndex: number }>(),
                LoadPaginatedPublicMessagesSucceeded: props<{ channelId: number, publicMessages: any[] }>(),
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

            events: {
                //send private message to the state
                SendPrivateMessageStarted: props<{ privateMessage: Message, receiverId: number }>(),
                SendPrivateMessageSucceeded: props<{ privateMessage: Message, receiverId: number }>(),
                SendPrivateMessageFailed: props<{ error: any }>(),

                //receive private message
                ReceivePrivateMessageStarted: props<{ privateMessage: Message, senderId: number }>(),
                ReceivePrivateMessageSucceeded: props<{ privateMessage: Message, senderId: number }>(),
                ReceivePrivateMessageFailed: props<{ error: any }>(),

                //send public message to the state
                SendPublicMessageStarted: props<{ senderId: number, publicMessage: Message, channelId: number }>(),
                SendPublicMessageSucceeded: props<{ senderId: number, publicMessage: Message, channelId: number, user: User }>(),
                SendPublicMessageFailed: props<{ error: any }>(),

                //receive public message to the state
                ReceivePublicMessageStarted: props<{ publicMessage: Message, channelId: number }>(),
                ReceivePublicMessageSucceeded: props<{ publicMessage: Message, channelId: number }>(),
                ReceivePublicMessageFailed: props<{ error: any }>(),

                //client receives confirmation of private message seen by the receiver
                ReceivePrivateMessageClickConversationStarted: props<{ receiverId: number, messageId: number, isSeen: boolean }>(),
                ReceivePrivateMessageClickConversationSucceeded: props<{ receiverId: number, messageId: number, isSeen: boolean }>(),
                ReceivePrivateMessageClickConversationFailed: props<{ error: any }>(),

                //send `is typing...` status 
                SendIsTypingStatusStarted: props<{ isTyping: boolean, senderId: number, receiverId: number }>(),
                SendIsTypingStatusSucceeded: props<{ isTyping: boolean, senderId: number, user: User }>(),
                SendIsTypingStatusFailed: props<{ error: any }>(),

                //receive `is typing...` status
                ReceiveIsTypingStatusStarted: emptyProps(),
                ReceiveIsTypingStatusSucceeded: props<{ isTyping: boolean, senderId: number, typingUsers: number[] }>(),
                ReceiveIsTypingStatusFailed: props<{ error: any }>(),

                //request latest number of public messages from the server by channelID
                RequestLatestNumberOfPublicMessagesByChannelIdStarted: emptyProps(),
                RequestLatestNumberOfPublicMessagesByChannelIdSuccceded: emptyProps(),
                RequestLatestNumberOfPublicMessagesByChannelIdFailed: props<{ error: any }>(),

                //request latest number of public messages from the server by channelID
                RecieveLatestNumberOfPublicMessagesByChannelIdStarted: emptyProps(),
                RecieveLatestNumberOfPublicMessagesByChannelIdSuccceded: props<{ channelId: number, totalPublicMessages: number }>(),
                RecieveLatestNumberOfPublicMessagesByChannelIdFailed: props<{ error: any }>(),

                //request latest number of Private messages from the server by channelID
                RequestLatestNumberOfPrivateMessagesByReceiverIdStarted: emptyProps(),
                RequestLatestNumberOfPrivateMessagesByReceiverIdSuccceded: emptyProps(),
                RequestLatestNumberOfPrivateMessagesByReceiverIdFailed: props<{ error: any }>(),

                //request latest number of Private messages from the server by ReceiverId
                RecieveLatestNumberOfPrivateMessagesByReceiverIdStarted: emptyProps(),
                RecieveLatestNumberOfPrivateMessagesByReceiverIdSuccceded: props<{ receiverId: number, totalPrivateMessages: number }>(),
                RecieveLatestNumberOfPrivateMessagesByReceiverIdFailed: props<{ error: any }>(),


            },
            source: SOURCE
        })
    }

    export namespace Flag {

        export const SOURCE = SafeType.Source.from(MESSAGE_SOURCE, 'Flag')

        export const Actions = createActionGroup({
            events: {
                //set can load more public messages flag
                SetCanLoadMorePublicMessagesFlagStarted: props<{ canLoadMore: boolean }>(),
                SetCanLoadMorePublicMessagesFlagSucceeded: props<{ canLoadMore: boolean }>(),
                SetCanLoadMorePublicMessagesFlagFailed: props<{ error: any }>(),

                //set can load more public messages flag
                SetCanLoadMorePrivateMessagesFlagStarted: props<{ canLoadMore: boolean }>(),
                SetCanLoadMorePrivateMessagesFlagSucceeded: props<{ canLoadMore: boolean }>(),
                SetCanLoadMorePrivateMessagesFlagFailed: props<{ error: any }>(),

                //Set private starting and ending index flags
                SetPrivateStartEndIndexFlagStarted: props<{startIndex: number, endIndex: number}>(),
                SetPrivateStartEndIndexFlagSucceeded: props<{startIndex: number, endIndex: number}>(),
                SetPrivateStartEndIndexFlagFailed: props<{ error: any }>(),

                //Reset private starting and ending index flags
                ResetPrivateStartEndIndexFlagStarted: emptyProps(),
                ResetPrivateStartEndIndexFlagSucceeded: emptyProps(),
                ResetPrivateStartEndIndexFlagFailed: props<{ error: any }>(),

                //Set public starting and ending index flags
                SetPublicStartEndIndexFlagStarted: props<{ startIndex: number, endIndex: number }>(),
                SetPublicStartEndIndexFlagSucceeded: props<{ startIndex: number, endIndex: number }>(),
                SetPublicStartEndIndexFlagFailed: props<{ error: any }>(),

                //Reset public starting and ending index flags
                ResetPublicStartEndIndexFlagStarted: emptyProps(),
                ResetPublicStartEndIndexFlagSucceeded: emptyProps(),
                ResetPublicStartEndIndexFlagFailed: props<{ error: any }>(),

                //Set initial private loadingAutoScroll value
                SetPrivateInitialLoadingAutoScrollValueStarted: props<{autoScrollValue: boolean}>(),
                SetPrivateInitialLoadingAutoScrollValueSucceeded:props<{autoScrollValue: boolean}>(),
                SetPrivateInitialLoadingAutoScrollValueFailed:props<{ error: any }>(),

                //Set initial public loadingAutoScroll value
                SetPublicInitialLoadingAutoScrollValueStarted: props<{ autoScrollValue: boolean }>(),
                SetPublicInitialLoadingAutoScrollValueSucceeded: props<{ autoScrollValue: boolean }>(),
                SetPublicInitialLoadingAutoScrollValueFailed: props<{ error: any }>(),

                //Set notification message 
                SetNotificationMessageStarted: props<{ senderId: number }>(),
                SetNotificationMessageSucceeded: props<{ senderId: number }>(),
                SetNotificationMessageFailed: props<{ error: any }>(),

                //Reset notification message 
                ResetNotificationMessageStarted: props<{ senderId: number }>(),
                ResetNotificationMessageSucceeded: props<{ senderId: number }>(),
                ResetNotificationMessageFailed: props<{ error: any }>(),
                

            },
            source: SOURCE
        })
    }
}