import { createFeatureSelector, createSelector } from "@ngrx/store";
import { MessageState } from './message.reducer'
import { selectedUserState } from "../user/user.selector";
import { UserState } from "../user/user.reducer";



export const selectedMessageState = createFeatureSelector<MessageState>("messageReducer")

/// API selectors ///

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
       //console.log(`selector record(private):`,messageState.privateMessageRecords)
       // console.log(`selector messages `, messages)
        return messages
    }
)

//select paginated public messages by record id
export const selectPublicRecordById = (channelId: number) => createSelector(
    selectedMessageState,
    (messagesState: MessageState) => {
        const messages = messagesState.publicMessageRecords[channelId] || []
       // console.log(`selector record(public)`, messagesState.publicMessageRecords)
        return messages
    }
)

/// HUB selectors ///

//select Map<number,string> where number = userId, string = FirstName
export const selectIsTypingStatusMap = createSelector(
    selectedMessageState,
    selectedUserState,
    (messageState: MessageState, userState: UserState) =>{
        const currentTypingUserIds = messageState.typingStatus.currentlyTypingUsers
        const typingStatusMap = new Map <number, string> ()

        currentTypingUserIds.forEach(userId =>{
            const user = userState.allUsers.find(user => user.id === userId)
            if(user) {
                typingStatusMap.set(userId, user.firstName)
            }
        })
        return typingStatusMap
    }
)

//select number[userId1, userId2, userId3]
export const selectIsTypingStatusIds = createSelector(
    selectedMessageState,
   
    (messageState: MessageState) =>{
        const currentTypingUserIds = messageState.typingStatus.currentlyTypingUsers
  
        return currentTypingUserIds
    }
)


/// Helper selectors ///
export const totalPublicMessagesCount = createSelector(
    selectedMessageState,
    (messageState: MessageState) =>{
        return messageState.publicMessageCounter
    }
)

