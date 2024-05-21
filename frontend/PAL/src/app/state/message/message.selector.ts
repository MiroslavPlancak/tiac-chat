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
    (messageState:MessageState) =>{
        console.log(`selector/receiverID:`, receiverId)
        const messages = messageState.paginatedRecords[receiverId] || []
        console.log(`selector record:`,messageState.paginatedRecords)
        console.log(`selector messages `, messages)
        return messages
    }
)

