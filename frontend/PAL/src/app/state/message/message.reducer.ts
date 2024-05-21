import { createReducer, on } from "@ngrx/store";
import { Messages } from "./message.action"

export interface MessageState {
    paginatedPrivateMessages:any[],
    paginatedRecords:Record<number,any[]>
}

export const initialState: MessageState = {
    paginatedPrivateMessages: [],
    paginatedRecords: {}
}


export const messageReducer = createReducer(
    initialState,


    /// API calls /// 
    
    //add paginated private messages to the state
    on(Messages.Api.Actions.loadPaginatedPrivateMessagesSucceeded, (state,{receiverId,privateMessages})=>{
        //console.log(`reducer:`, privateMessages)
        //console.log(`reducer receiverId:`,receiverId )
        //semi working, to be continued
        const currentMessages = state.paginatedRecords[receiverId] || []
        const paginatedRecords = [...privateMessages , ...currentMessages]
        //console.log('Updated messages for receiverId', receiverId, paginatedRecords);

        const updateArray = privateMessages.concat(state.paginatedPrivateMessages)
       
        return {
            ...state,
           // paginatedPrivateMessages: [...privateMessages, ...state.paginatedPrivateMessages],
            paginatedRecords:{
                ...state.paginatedRecords,
                [receiverId]:paginatedRecords
            }
        }
       
    }),

    //clear paginated private messages state
    on(Messages.Api.Actions.clearPaginatedPrivateMessagesSucceeded,(state,{userId})=>{
       // console.log(`reducer/userId (clearing)`,userId)
        return {
            ...state,
           // paginatedPrivateMessages:[],
            paginatedRecords:{
                ...state.paginatedRecords,
                [userId]:[]
            }
        }
    })
)