import { createReducer, on } from "@ngrx/store";
import { Messages } from "./message.action"

export interface MessageState {
    paginatedPrivateMessages:any[]
}

export const initialState: MessageState = {
    paginatedPrivateMessages: []
}


export const messageReducer = createReducer(
    initialState,


    /// API calls /// 
    
    //add paginated private messages to the state
    on(Messages.Api.Actions.loadPaginatedPrivateMessagesSucceeded, (state,{privateMessages})=>{
        console.log(`reducer:`, privateMessages)
        //semi working, to be continued
        const updateArray = privateMessages.concat(state.paginatedPrivateMessages)
        return {
            ...state,
            paginatedPrivateMessages: updateArray
        }
    }),

    //clear paginated private messages state
    on(Messages.Api.Actions.clearPaginatedPrivateMessagesSucceeded,(state,{userId})=>{

        return {
            ...state,
            paginatedPrivateMessages:[]
        }
    })
)