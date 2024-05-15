import { createFeatureSelector, createSelector } from "@ngrx/store";
import { ChatState } from "./chat.reducer";
import { UserState } from "../user/user.reducer";

export const selectedChatState = createFeatureSelector<ChatState>("chatReducer")