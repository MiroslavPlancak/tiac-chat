import { createReducer, on } from "@ngrx/store";
import { Messages } from "./message.action"

export interface TypingStatusState {

    currentlyTypingUsers: number[]

}

export interface MessageState {

    privateMessagesRecord: Record<number, any[]>
    publicMessagesRecord: Record<number, any[]>
    totalPublicMessagesCountRecord: Record<number, number>,
    totalPrivateMessagesCountRecord: Record<number, number>,
    loadedPublicMessagesCount: number,
    loadedPrivateMessagesCount: number,
    canLoadMorePrivateMessagesFlag: boolean,
    canLoadMorePublicMessagesFlag: boolean,
    typingStatus: TypingStatusState,
    initialPrivateAutoScrollFlag: boolean,
    initialPublicAutoScrollFlag: boolean,
    privateMessagePagination:{
        startIndex:number,
        endIndex:number
    },
    publicMessagePagination:{
        startIndex:number,
        endIndex: number
    }, 
    notificationMessagesRecord: Record<number, number>
}

export const initialState: MessageState = {
    privateMessagesRecord: {},
    publicMessagesRecord: {},
    totalPublicMessagesCountRecord: {},
    totalPrivateMessagesCountRecord: {},
    loadedPublicMessagesCount: 0,
    loadedPrivateMessagesCount: 0,
    canLoadMorePublicMessagesFlag: false,
    canLoadMorePrivateMessagesFlag: false,
    initialPrivateAutoScrollFlag: false,
    initialPublicAutoScrollFlag: false,
    privateMessagePagination:{
        startIndex:0,
        endIndex:0
    },
    publicMessagePagination:{
        startIndex:0,
        endIndex: 0
    },
    typingStatus: {
        currentlyTypingUsers: [],
    },
    notificationMessagesRecord:{}

}


export const messageReducer = createReducer(
    initialState,


    /// API calls /// 

    //add paginated private messages to the state
    on(Messages.Api.Actions.loadPaginatedPrivateMessagesSucceeded, (state, { receiverId, privateMessages }) => {
        // console.log(`reducer/loadPaginatedPrivatemessagesSucceeded:`, privateMessages)
        const currentMessages = state.privateMessagesRecord[receiverId] || []
        const paginatedRecords = [...privateMessages, ...currentMessages]
        const loadedPrivateMessagesLength = paginatedRecords.length
        const totalPrivateMessagesLength = state.totalPrivateMessagesCountRecord[receiverId]
        
//        console.log(`currently loaded:`, loadedPrivateMessagesLength, `vs total:`, totalPrivateMessagesLength)
        let stopLoadingPrivateMessages = false;
        if(loadedPrivateMessagesLength <= totalPrivateMessagesLength ){
            stopLoadingPrivateMessages = true
        }
        if(loadedPrivateMessagesLength === totalPrivateMessagesLength){
            stopLoadingPrivateMessages = false
        }
        // console.log(`reducer :`, paginatedRecords)
        return {
            ...state,
            privateMessagesRecord: {
                ...state.privateMessagesRecord,
                [receiverId]: paginatedRecords
            },
            loadedPrivateMessagesCount: loadedPrivateMessagesLength,
            canLoadMorePrivateMessagesFlag: stopLoadingPrivateMessages
        }

    }),

    //clear paginated private messages state
    on(Messages.Api.Actions.clearPaginatedPrivateMessagesSucceeded, (state, { userId }) => {

        return {
            ...state,
            privateMessagesRecord: {
                ...state.privateMessagesRecord,
                [userId]: []
            },
            loadedPrivateMessagesCount: 0,


        }
    }),

    //add paginated public messages to the state
    on(Messages.Api.Actions.loadPaginatedPublicMessagesSucceeded, (state, { channelId, publicMessages }) => {
        console.log(`reducer/publicMessages:`, publicMessages)
        const currentMessages = state.publicMessagesRecord[channelId] || []
        const paginatedRecords = [...publicMessages, ...currentMessages]
        const loadedPublicMessagesLength = paginatedRecords.length
        const totalPublicMessagesLength = state.totalPublicMessagesCountRecord[channelId]
        //  console.log(`reducer/totalPublicMessages:`,loadedPublicMessagesLength)
        let stopLoadingPublicMessages = false;
        if(loadedPublicMessagesLength <= totalPublicMessagesLength){
            stopLoadingPublicMessages = true
        }
        if(loadedPublicMessagesLength === totalPublicMessagesLength){
            stopLoadingPublicMessages = false
        }
        return {
            ...state,
            publicMessagesRecord: {
                ...state.publicMessagesRecord,
                [channelId]: paginatedRecords
            },
            loadedPublicMessagesCount: loadedPublicMessagesLength,
            canLoadMorePublicMessagesFlag: stopLoadingPublicMessages
 
        }
    }),

    //clear pagianted public messages from the state
    on(Messages.Api.Actions.clearPaginatedPublicMessagesSucceeded, (state, { channelId }) => {
        return {
            ...state,
            publicMessagesRecord: {
                ...state.publicMessagesRecord,
                [channelId]: []
            },
            loadedPublicMessagesCount: 0
        }
    }),

    /// HUB calls /// 

    //send private message 
    on(Messages.Hub.Actions.sendPrivateMessageSucceeded, (state, { privateMessage, receiverId }) => {
        //console.log(`reducer output:`, privateMessage, receiverId)
        const currentMessages = state.privateMessagesRecord[receiverId] || []
        const updatedMessages = [...currentMessages, privateMessage]
        console.log(`updatedMessages/SendPrivateMessagesSucceeded`, updatedMessages)
        return {
            ...state,
            privateMessagesRecord: {
                ...state.privateMessagesRecord,
                [receiverId]: updatedMessages
            }
        }
    }),

    //receive private message 
    on(Messages.Hub.Actions.receivePrivateMessageSucceeded, (state, { privateMessage, senderId }) => {
        const currentMessages = state.privateMessagesRecord[senderId] || []
        const updatedMessages = [...currentMessages, privateMessage]
        // console.log(`updatedMessages/ReceivePrivateMessageSucceeded`, updatedMessages)
        return {
            ...state,
            privateMessagesRecord: {
                ...state.privateMessagesRecord,
                [senderId]: updatedMessages
            }
        }
    }),


    //receive public message 
    on(Messages.Hub.Actions.receivePublicMessageSucceeded, (state, { publicMessage, channelId }) => {
        console.log(`reducer output:`, publicMessage)
        const currentMessages = state.publicMessagesRecord[channelId] || []
        const updatedMessages = [...currentMessages, publicMessage]
        return {
            ...state,
            publicMessagesRecord: {
                ...state.publicMessagesRecord,
                [channelId]: updatedMessages
            }
        }
    }),
    //set private message as `seen` up on receiver's click on private conversation
    on(Messages.Hub.Actions.receivePrivateMessageClickConversationSucceeded, (state, { receiverId, messageId, isSeen }) => {
        const currentMessages = state.privateMessagesRecord[receiverId] || []
        //console.log(`reducer/current convo`, currentMessages)
        //console.log(`reducer/messageId`,messageId )
        const updatedMessages = currentMessages.map(message =>
            (message.isSeen === false) ? { ...message, isSeen: true } : message
        );
        //console.log(`reducer:`, updatedMessages)
        return {
            ...state,
            privateMessagesRecord: {
                ...state.privateMessagesRecord,
                [receiverId]: updatedMessages
            }
        }
    }),


    //receive and set `is typing...` status to the state
    on(Messages.Hub.Actions.receiveIsTypingStatusSucceeded, (state, { isTyping, senderId, typingUsers }) => {
        //console.log(`reducer/typingUsers:`, typingUsers)
        return {
            ...state,
            typingStatus: {
                ...state.typingStatus,
                currentlyTypingUsers: typingUsers
            }
        }
    }),


    //update the lastest number of public channel messages by channel ID
    on(Messages.Hub.Actions.recieveLatestNumberOfPublicMessagesByChannelIdSuccceded, (state, { channelId, totalPublicMessages }) => {
        const totalMessages = totalPublicMessages
        const totalLoadedMessages = state.loadedPublicMessagesCount
        //        console.log(`total messages ${totalMessages} / totalLoadedMessages ${totalLoadedMessages}`)

        let loadMoreFlag = true
        if (totalMessages === totalLoadedMessages) {
            loadMoreFlag = false
        }

        return {
            ...state,
            totalPublicMessagesCountRecord: {
                ...state.totalPublicMessagesCountRecord,
                [channelId]: totalPublicMessages
            },
            canLoadMorePublicMessagesFlag: loadMoreFlag
        }
    }),
    //update the lastest number of public channel messages by receiver ID
    on(Messages.Hub.Actions.recieveLatestNumberOfPrivateMessagesByReceiverIdSuccceded, (state, { receiverId, totalPrivateMessages }) => {
        const totalMessages = totalPrivateMessages
        const totalLoadedMessages = state.loadedPrivateMessagesCount

        let loadMoreFlag = true
        if (totalMessages === totalLoadedMessages) {
            loadMoreFlag = false
        }

        return {
            ...state,
            totalPrivateMessagesCountRecord: {
                ...state.totalPrivateMessagesCountRecord,
                [receiverId]: totalPrivateMessages
            },
           // canLoadMorePrivateMessagesFlag: loadMoreFlag
        }
    }),

    /// FLAG calls /// 
    on(Messages.Flag.Actions.setCanLoadMorePublicMessagesFlagSucceeded, (state, { canLoadMore }) => {
        // console.log(`reducer/flag/canloadMore:`, canLoadMore)
        return {
            ...state,
            canLoadMorePublicMessagesFlag: canLoadMore
        }
    }),

    on(Messages.Flag.Actions.setCanLoadMorePrivateMessagesFlagSucceeded, (state, { canLoadMore }) => {
        //  console.log(`reducer/flag/canloadMore:`, canLoadMore)
        return {
            ...state,
            canLoadMorePrivateMessagesFlag: canLoadMore
        }
    }),

    on(Messages.Flag.Actions.setPrivateStartEndIndexFlagSucceeded, (state, {startIndex, endIndex})=>{
        // console.log(`reducer:`, startIndex, endIndex)
        return {
            ...state,
            privateMessagePagination:{
                startIndex,
                endIndex
            }
        }
    }),

    on(Messages.Flag.Actions.resetPrivateStartEndIndexFlagSucceeded, (state,{})=>{
        return {
            ...state,
            privateMessagePagination:{
                startIndex: 0,
                endIndex:0
            }
        }
    }),

    on(Messages.Flag.Actions.setPublicStartEndIndexFlagSucceeded, (state, {startIndex, endIndex})=>{
        // console.log(`reducer:`, startIndex, endIndex)
        return {
            ...state,
            publicMessagePagination:{
                startIndex,
                endIndex
            }
        }
    }),

    on(Messages.Flag.Actions.resetPublicStartEndIndexFlagSucceeded, (state,{})=>{
        return {
            ...state,
            publicMessagePagination:{
                startIndex: 0,
                endIndex:0
            }
        }
    }),

    on(Messages.Flag.Actions.setPrivateInitialLoadingAutoScrollValueSucceeded, (state,{autoScrollValue})=>{
        return {
            ...state,
            initialPrivateAutoScrollFlag: autoScrollValue
        }
    }),

    on(Messages.Flag.Actions.setPublicInitialLoadingAutoScrollValueSucceeded, (state,{autoScrollValue})=>{
        return {
            ...state,
            initialPublicAutoScrollFlag: autoScrollValue
        }
    }),

    on(Messages.Flag.Actions.setNotificationMessageSucceeded, (state,{ senderId })=>{
        const currentCount = state.notificationMessagesRecord[senderId] || 0
        const updatedCount = currentCount + 1
        return {
            ...state,
            notificationMessagesRecord:{
                ...state.notificationMessagesRecord,
                [senderId]:updatedCount
            }
        }
    }),

    on(Messages.Flag.Actions.resetNotificationMessageSucceeded, (state,{ senderId })=>{
        return {
            ...state,
            notificationMessagesRecord:{
                ...state.notificationMessagesRecord,
                [senderId]: 0
            }
        }
    })
)