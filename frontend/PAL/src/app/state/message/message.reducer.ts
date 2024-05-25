import { createReducer, on } from "@ngrx/store";
import { Messages } from "./message.action"

export interface MessageState {
    
    privateMessageRecords: Record<number, any[]>
    publicMessageRecords: Record<number,any[]>
}

export const initialState: MessageState = {
    
    privateMessageRecords: {},
    publicMessageRecords: {}
}


export const messageReducer = createReducer(
    initialState,


    /// API calls /// 

    //add paginated private messages to the state
    on(Messages.Api.Actions.loadPaginatedPrivateMessagesSucceeded, (state, { receiverId, privateMessages }) => {

        const currentMessages = state.privateMessageRecords[receiverId] || []
        const paginatedRecords = [...privateMessages, ...currentMessages]

        return {
            ...state,
            privateMessageRecords: {
                ...state.privateMessageRecords,
                [receiverId]: paginatedRecords
            }
        }

    }),

    //clear paginated private messages state
    on(Messages.Api.Actions.clearPaginatedPrivateMessagesSucceeded, (state, { userId }) => {
  
        return {
            ...state,
            privateMessageRecords: {
                ...state.privateMessageRecords,
                [userId]: []
            }
        }
    }),

    //add paginated public messages to the state
    on(Messages.Api.Actions.loadPaginatedPublicMessagesSucceeded, (state,{channelId,publicMessages})=>{
        const currentMessages = state.publicMessageRecords[channelId] || []
        const paginatedRecords = [...publicMessages, ...currentMessages]

        return {
            ...state,
            publicMessageRecords:{
                ...state.publicMessageRecords,
                [channelId]: paginatedRecords
            }
        }
    }),

    //clear pagianted public messages from the state
    on(Messages.Api.Actions.clearPaginatedPublicMessagesSucceeded, (state,{channelId})=>{
        return {
            ...state,
            publicMessageRecords: {
                ...state.publicMessageRecords,
                [channelId]:[]
            }
        }
    }),

    /// HUB calls /// 

    //send private message 
    on(Messages.Hub.Actions.loadPrivateMessageSucceeded, (state,{ privateMessage, receiverId}) =>{
        console.log(`reducer output:`, privateMessage, receiverId)
        const currentMessages = state.privateMessageRecords[receiverId] || []
        const updatedMessages = [...currentMessages, privateMessage]
        return {
            ...state,
            privateMessageRecords:{
                ...state.privateMessageRecords,
                [receiverId]:updatedMessages
            }
        }
    }),

    //receive private message 
    on(Messages.Hub.Actions.receivePrivateMessageSucceeded,(state,{privateMessage, senderId})=>{
        const currentMessages = state.privateMessageRecords[senderId] || []
        const updatedMessages = [...currentMessages, privateMessage]
        return {
            ...state,
            privateMessageRecords:{
                ...state.privateMessageRecords,
                [senderId]:updatedMessages
            }
        }
    }),

    //set private message as seen up on receiver's click on private conversation
    on(Messages.Hub.Actions.receivePrivateMessageClickConversationSucceeded,(state, {receiverId,messageId,isSeen})=>{
        const currentMessages = state.privateMessageRecords[receiverId] || []
        console.log(`reducer/current convo`, currentMessages)
        console.log(`reducer/messageId`,messageId )
        const updatedMessages = currentMessages.map(message => 
            (message.isSeen === false) ? { ...message, isSeen: true } : message
        );
        console.log(`reducer:`, updatedMessages)
        return {
            ...state,
            privateMessageRecords: {
                ...state.privateMessageRecords,
                [receiverId]: updatedMessages
            }
        }
    })
)