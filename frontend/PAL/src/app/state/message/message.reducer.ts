import { createReducer, on } from "@ngrx/store";
import { Messages } from "./message.action"

export interface MessageState {

}

export const initialState: MessageState = {

}


export const messageReducer = createReducer(
    initialState,


    /// API calls /// 
    
    //on()...
)