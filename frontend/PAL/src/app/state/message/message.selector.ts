import { createFeatureSelector, createSelector } from "@ngrx/store";
import { MessageState } from './message.reducer'


export const selectedMessageState = createFeatureSelector<MessageState>("messageReducer")

/// API calls ///

//select all paginated private messages
export const selectPaginatedPrivateMessages = createSelector(
    selectedMessageState,
    (messageState:MessageState) =>{
        console.log(`selector:`, messageState.paginatedPrivateMessages)
        return messageState.paginatedPrivateMessages
    }
)

