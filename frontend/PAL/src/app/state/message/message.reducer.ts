import { createReducer, on } from "@ngrx/store";
import { Messages } from "./message.action"

export interface MessageState {
    paginatedPrivateMessages: any[],
    paginatedRecords: Record<number, any[]>
}

export const initialState: MessageState = {
    paginatedPrivateMessages: [],
    paginatedRecords: {}
}


export const messageReducer = createReducer(
    initialState,


    /// API calls /// 

    //add paginated private messages to the state
    on(Messages.Api.Actions.loadPaginatedPrivateMessagesSucceeded, (state, { receiverId, privateMessages }) => {

        const currentMessages = state.paginatedRecords[receiverId] || []
        const paginatedRecords = [...privateMessages, ...currentMessages]

        return {
            ...state,
            paginatedRecords: {
                ...state.paginatedRecords,
                [receiverId]: paginatedRecords
            }
        }

    }),

    //clear paginated private messages state
    on(Messages.Api.Actions.clearPaginatedPrivateMessagesSucceeded, (state, { userId }) => {
  
        return {
            ...state,
            paginatedRecords: {
                ...state.paginatedRecords,
                [userId]: []
            }
        }
    }),

    /// HUB calls /// 

    //send private message 
    on(Messages.Hub.Actions.loadPrivateMessageSucceeded, (state,{ privateMessage, receiverId}) =>{
        console.log(`reducer output:`, privateMessage, receiverId)
        const currentMessages = state.paginatedRecords[receiverId] || []
        const updatedMessages = [...currentMessages, privateMessage]
        return {
            ...state,
            paginatedRecords:{
                ...state.paginatedRecords,
                [receiverId]:updatedMessages
            }
        }
    }),

    //receive private message 
    on(Messages.Hub.Actions.receivePrivateMessageSucceeded,(state,{privateMessage, senderId})=>{
        const currentMessages = state.paginatedRecords[senderId] || []
        const updatedMessages = [...currentMessages, privateMessage]
        return {
            ...state,
            paginatedRecords:{
                ...state.paginatedRecords,
                [senderId]:updatedMessages
            }
        }
    })
)