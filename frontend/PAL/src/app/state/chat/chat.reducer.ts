import { createReducer, on } from "@ngrx/store";
import { Chats } from '../chat/chat.action'

export interface ChatState{
    senderId: number,
    isUserTyping:boolean,
    currentlyTypingUserIds:number[],
    typingStatusMap?: Map<number,string>
}

export const initialState: ChatState = {
    senderId: 0,
    isUserTyping: false,
    currentlyTypingUserIds: [],
    typingStatusMap: undefined
}