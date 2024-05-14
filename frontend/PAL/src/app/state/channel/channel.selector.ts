import { createFeatureSelector, createSelector } from "@ngrx/store";
import { ChannelState } from "./channel.reducer";
import { UserState } from "../user/user.reducer";
import { selectedUserState } from "../user/user.selector";
import { Channel } from "../../Models/channel.model";

export const selectedChannelState = createFeatureSelector<ChannelState>("channelReducer")
export const selectUserState = createFeatureSelector<UserState>("userReducer")

//select currently logged in user
export const selectCurrentlyLoggedUser = createSelector(
    selectUserState,
    (state: UserState) =>
        state.currentUserId
)
//select ERROR
export const selectChannelError = createSelector(
    selectedChannelState,
    (state: ChannelState) =>
        state.error
)

/////// API calls /////////
//select all channels
export const selectAllChannels = createSelector(
    selectedChannelState,
    (state: ChannelState) =>
        state.allChannels
)

//select privately owned channels by user ID
export const selectPrivateChannels = createSelector(
    selectedChannelState,
    selectedUserState,
    (channelState: ChannelState, currentUser: UserState) => {
        const privateChannels = channelState.allChannels.
            filter(channel => channel.createdBy === currentUser.currentUserId
                && channel.visibility === 0)
        //  console.log(`private channels selector:`, privateChannels)
        return privateChannels
    })

//select private channel by channel ID
export const selectPrivateChannelById = createSelector(
    selectedChannelState,
    selectedUserState,
    selectPrivateChannels,
    (channelState: ChannelState, userState: UserState, privateChannels: Channel[]) => {
       
        const clickedPrivateChannel = privateChannels.filter(channel => channel.createdBy === userState.currentUserId
            && channel.id === channelState.clickedPrivateChannelID
        )
       // console.log(`selector`,clickedPrivateChannel)
        return clickedPrivateChannel
    }
)

//select all private channels that the current user participates in (both where he is the owner and where he is a participant)
export const selectAllPrivateChannels = createSelector(
    selectedChannelState,
    (channelState:ChannelState) =>{
        //console.log(`newprivatechannel selector:`, channelState.newPrivateChannel)
        //console.log(`selector all channels:`, channelState.allChannels)
        const allPrivateChannels = channelState.allChannels.filter(
            channel => channelState.privateChannelIds?.includes(channel.id) &&
            channel.visibility === 0
        )
       // console.log(`selector:`, allPrivateChannels)
        return allPrivateChannels
    }
)

//select all public channels
export const selectAllPublicChannels = createSelector(
    selectedChannelState,
    (channelState:ChannelState)=> {
        const allPublicChannels = channelState.allChannels.filter(channel=> channel.visibility === 1)
        return allPublicChannels
    }
)

//select current participants of the private channel 
export const selectParticipantsOfPrivateChannel = createSelector(
    selectedChannelState,
    selectedUserState,
    (channelState:ChannelState, userState: UserState) =>{
        const extractParticipantIds = channelState.privateChannelParticipants.map(participant => participant.user_Id)
        const participantsUserObjects = userState.allUsers.filter(user => extractParticipantIds.includes(user.id))
       
        return participantsUserObjects
    }
)

// select remaining participants of the private channel
export const selectRemainingParticipantsOfPrivateChannel = createSelector(
    selectedChannelState,
    selectedUserState,
    (channelState:ChannelState, userState: UserState) =>{
        const extractCurrentParticipantIds = channelState.privateChannelParticipants.map(participant => participant.user_Id)
        const remainingParticipantsUserObjects = userState.allUsers.filter(user => !extractCurrentParticipantIds.includes(user.id))
        console.log(`remaining users selector`,remainingParticipantsUserObjects)
        return remainingParticipantsUserObjects
    }
)


/////// Flag selectors /////////

// select currently clicked conversation

export const selectCurrentlyClickedConversation = createSelector(
    selectedChannelState,
    (channelState:ChannelState) =>
        channelState.currentConversationId
)
