import { createFeatureSelector, createSelector } from "@ngrx/store";
import { MessageState } from './message.reducer'
import { selectedUserState } from "../user/user.selector";
import { UserState } from "../user/user.reducer";
import { selectCurrentlyClickedPrivateConversation, selectedChannelState } from "../channel/channel.selector";
import { ChannelState } from "../channel/channel.reducer";



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
export const selectPaginatedRecordById = createSelector(
    selectedMessageState,
    selectedUserState,
    selectCurrentlyClickedPrivateConversation,
    (messageState: MessageState, userState: UserState, currentPrivateConvoSelected: number | undefined) =>{
        //console.log(`selector/receiverID:`, receiverId)
        const currentPrivateConvoSelectedNum = Number(currentPrivateConvoSelected)
        const messages = messageState.privateMessagesRecord[currentPrivateConvoSelectedNum] || []

        console.log(`selector extracted user:`, messages)
            // Create a map of user IDs to their first names
        const userIdToNameMap = userState.allUsers.reduce((map, user) => {
            map[user.id] = user.firstName;
            return map;
        }, {} as { [key: number]: string });
    
        // Add senderName to each message
        const messagesWithSenderName = messages.map(message => ({
            ...message,
            senderName: userIdToNameMap[message.sentFromUserId] || 'Unknown'
        }));
    
        return messagesWithSenderName;
        
     
    }
)

//select paginated public messages by record id
export const selectPublicRecordById = (channelId: number) => createSelector(
    selectedMessageState,
    (messagesState: MessageState) => {
        const messages = messagesState.publicMessagesRecord[channelId] || []
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

//select latest number of public message by  channel ID
export const selectPublicMessagesNumberFromChannelId = createSelector(
    selectedMessageState,
    selectedChannelState,
    (messageState: MessageState,channelState:ChannelState) =>{
        const currentlyClickedChannel = Number(channelState.currentConversationId)
        console.log(`selector number of public messages:`,messageState.totalPublicMessagesCountRecord[currentlyClickedChannel])
        return messageState.totalPublicMessagesCountRecord[currentlyClickedChannel]
    }
)

//select latest number of private messages by receiver ID
export const selectPrivateMessagesNumberFromReceiverId = createSelector(
    selectedMessageState,
    selectedChannelState,
    (messageState: MessageState,channelState:ChannelState) =>{
        const currentlyClickedChannel = Number(channelState.clickedPrivateChannelID)

        return messageState.totalPrivateMessagesCountRecord[currentlyClickedChannel]
    }
)

/// FLAG selectors ///
export const selectCanLoadMorePublicMessages = createSelector(
    selectedMessageState,
    (messageState:MessageState) =>{
        return messageState.canLoadMorePublicMessagesFlag
    }
)

export const selectCanLoadMorePrivateMessages = createSelector(
    selectedMessageState,
    (messageState:MessageState) =>{
       // console.log(`can load more private messages flag:`, messageState.canLoadMorePrivateMessagesFlag)
        return messageState.canLoadMorePrivateMessagesFlag
    }
)

export const selectInitialPrivateAutoScrollFlag = createSelector(
    selectedMessageState,
    (messageState: MessageState) => {
        //console.log(`flag state: `,messageState.initialPrivateAutoScrollFlag)
        return messageState.initialPrivateAutoScrollFlag
    }
)

export const selectInitialPublicAutoScrollFlag = createSelector(
    selectedMessageState,
    (messageState: MessageState) => {
        // console.log(`flag state: `,messageState.initialPublicAutoScrollFlag)
        return messageState.initialPublicAutoScrollFlag
    }
)
/// Helper selectors ///
export const totalPublicMessagesCount = createSelector(
    selectedMessageState,
    (messageState: MessageState) =>{
        return messageState.loadedPublicMessagesCount
    }
)

export const totalPrivateMessagesCount = createSelector(
    selectedMessageState,
    (messageState: MessageState) =>{
        return messageState.loadedPrivateMessagesCount
    }
)

export const privateMessagesStartEndIndex = createSelector(
    selectedMessageState, 
    (messageState: MessageState) =>{
        // console.log(`SELECTOR/privateMessagesStartEndIndex`, messageState.privateMessagePagination)
        return messageState.privateMessagePagination
    }
)
export const publicMessagesStartEndIndex = createSelector(
    selectedMessageState, 
    (messageState: MessageState) =>{
        // console.log(`SELECTOR/privateMessagesStartEndIndex`, messageState.privateMessagePagination)
        return messageState.publicMessagePagination
    }
)

export const selectNotificationBySenderId =  createSelector(
    selectedChannelState,
    selectedMessageState,
    selectCurrentlyClickedPrivateConversation,
    (channelState: ChannelState, messageState: MessageState, currentConversation: number| undefined) =>{
        const selectedSenderId = Number(channelState.clickedPrivateChannelID)
        console.log(`selector notificationRecord:`, messageState.notificationMessagesRecord)
        if(selectedSenderId === currentConversation){
            //big problem with this, multiple outputs, this should be uncommented and re-factored somehow.
            // console.log(`selector: they match`)
            return {
                ...messageState.notificationMessagesRecord,
                [currentConversation]:0
            }
        }
       
        return messageState.notificationMessagesRecord
    }
)

export const selectNotificationBySenderId2 = (senderId: number) => createSelector(
    selectedChannelState,
    selectedMessageState,
    (channelState: ChannelState, messageState: MessageState) =>{
        const selectedSenderId = Number(channelState.clickedPrivateChannelID)
        if(selectedSenderId === senderId){
            console.log(`selector: they match`)
            return messageState.notificationMessagesRecord
        }
        console.log(`selector output:`, messageState.notificationMessagesRecord)
        return messageState.notificationMessagesRecord
    }
)
