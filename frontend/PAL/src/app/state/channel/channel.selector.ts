import { createFeatureSelector, createSelector } from "@ngrx/store";
import { ChannelState } from "./channel.reducer";

export const selectedChannelState = createFeatureSelector<ChannelState>("channelReducer")

//select ERROR
export const selectChannelError = createSelector(
    selectedChannelState,
    (state:ChannelState) =>
        state.error
)

/////// API calls /////////
//select all channels
export const selectAllChannels = createSelector(
    selectedChannelState,
    (state:ChannelState)=>
        state.allChannels
)