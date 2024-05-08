import { createFeatureSelector, createSelector } from "@ngrx/store";
import { ChannelState } from "./channel.reducer";
import { UserState } from "../user/user.reducer";
import { selectedUserState } from "../user/user.selector";

export const selectedChannelState = createFeatureSelector<ChannelState>("channelReducer")
export const selectUserState = createFeatureSelector<UserState>("userReducer")

//select currently logged in user
export const selectCurrentlyLoggedUser = createSelector(
    selectUserState,
    (state:UserState) =>
        state.currentUserId
)
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

//select privately owned channels by user ID
export const selectPrivateChannels = createSelector(
    selectedChannelState,
    selectedUserState,
    (channelState: ChannelState, currentUser: UserState) =>{
      const privateChannels = channelState.allChannels.
      filter(channel => channel.createdBy === currentUser.currentUserId 
           && channel.visibility === 0)
      console.log(`private channels selector:`, privateChannels)
      return privateChannels
})       