import { createFeatureSelector, createSelector } from "@ngrx/store";
import { MessageState } from './message.reducer'



export const selectedMessageState = createFeatureSelector<MessageState>("messageReducer")

/// API calls ///

//select all paginated private messages
// export const selectPaginatedPrivateMessages = createSelector(
//     selectedMessageState,
//     (messageState:MessageState) =>{
//         console.log(`selector:`, messageState.paginatedPrivateMessages)
//         return messageState.paginatedPrivateMessages
//     }
// )

//select paginated private messages by record id
export const selectPaginatedRecordById = (receiverId:number) => createSelector(
    selectedMessageState,
    (messageState: MessageState) =>{
        //console.log(`selector/receiverID:`, receiverId)
        const messages = messageState.privateMessageRecords[receiverId] || []
       console.log(`selector record(private):`,messageState.privateMessageRecords)
       // console.log(`selector messages `, messages)
        return messages
    }
)

//select paginated public messages by record id
export const selectPublicRecordById = (channelId: number) => createSelector(
    selectedMessageState,
    (messagesState: MessageState) => {
        const messages = messagesState.publicMessageRecords[channelId] || []
        console.log(`selector record(public)`, messagesState.publicMessageRecords)
        return messages
    }
)

