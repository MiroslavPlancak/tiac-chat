import { createFeatureSelector, createSelector } from "@ngrx/store";
import { MessageState } from './message.reducer'

export const selectedMessageState = createFeatureSelector<MessageState>("messageReducer")