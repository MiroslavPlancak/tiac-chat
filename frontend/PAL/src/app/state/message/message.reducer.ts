import { createReducer, on } from "@ngrx/store";
import { Messages } from "./message.action"

export interface TypingStatusState{
    isTyping:boolean
    currentlyTypingUsers: number[]
    typingStatusMap: Map<number,string>
}

export interface MessageState {
    
    privateMessageRecords: Record<number, any[]>
    publicMessageRecords: Record<number,any[]>
    typingStatus:TypingStatusState
}

export const initialState: MessageState = {
    privateMessageRecords: {},
    publicMessageRecords: {},
    typingStatus: {
        isTyping:false,
        currentlyTypingUsers:[],
        typingStatusMap: new Map<number, string>()
    }
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
        console.log(`reducer:`, paginatedRecords)
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
    on(Messages.Hub.Actions.sendPrivateMessageSucceeded, (state,{ privateMessage, receiverId}) =>{
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

    //send public message 
    // on(Messages.Hub.Actions.sendPublicMessageSucceeded, (state,{senderId, publicMessage, channelId, user})=>{
    //     const currentMessages = state.publicMessageRecords[channelId] || []
    //     const transformPrivateMessage = {...publicMessage, sentFromUserDTO: user}
    //     console.log(`reducer/transformPrivateMessage:`, transformPrivateMessage)        
    //     const updatedMessages = [...currentMessages,transformPrivateMessage]
    //     console.log(`reducer/updatedMessages:`, updatedMessages)
    //     return {
    //         ...state,
    //         publicMessageRecords:{
    //             ...state.publicMessageRecords,
    //             [channelId]:updatedMessages
    //         }
    //     }
    // }),
    //receive public message 
    on(Messages.Hub.Actions.receivePublicMessageSucceeded,(state,{publicMessage, channelId})=>{
        const currentMessages = state.publicMessageRecords[channelId] || []
        const updatedMessages = [...currentMessages, publicMessage]
        return {
            ...state,
            publicMessageRecords:{
                ...state.publicMessageRecords,
                [channelId]:updatedMessages
            }
        }
    }),
    //set private message as `seen` up on receiver's click on private conversation
    on(Messages.Hub.Actions.receivePrivateMessageClickConversationSucceeded,(state, {receiverId,messageId,isSeen})=>{
        const currentMessages = state.privateMessageRecords[receiverId] || []
        //console.log(`reducer/current convo`, currentMessages)
        //console.log(`reducer/messageId`,messageId )
        const updatedMessages = currentMessages.map(message => 
            (message.isSeen === false) ? { ...message, isSeen: true } : message
        );
        //console.log(`reducer:`, updatedMessages)
        return {
            ...state,
            privateMessageRecords: {
                ...state.privateMessageRecords,
                [receiverId]: updatedMessages
            }
        }
    }),

    //set `is typing...` status to the state
    // on(Messages.Hub.Actions.sendIsTypingStatusSucceeded, (state,{isTyping, senderId, user})=>{
    //     const senderFirstName = user.firstName
    //     const typingStatusUpdated = {
    //         ...state.typingStatus,
    //             isTyping: isTyping,
    //             typingStatusMap: new Map(state.typingStatus.typingStatusMap).set(senderId,senderFirstName)
    //     }
    //     console.log("Sender ID:", senderId);
    //     console.log("Is Typing:", isTyping);
    //     console.log("Sender First Name:", senderFirstName);
    //     console.log("Updated Typing Status:", typingStatusUpdated);
    //     return {
    //         ...state,
    //         typingStatus:typingStatusUpdated
            
    //     }
    // })

    //receive and set `is typing...` status to the state
    on(Messages.Hub.Actions.receiveIsTypingStatusSucceeded, (state, {isTyping, senderId, typingUsers })=>{
        console.log(`reducer/typingUsers:`, typingUsers)
        return {
            ...state,
            typingStatus:{
                ...state.typingStatus,
                currentlyTypingUsers:typingUsers
            }
        }
    })


)