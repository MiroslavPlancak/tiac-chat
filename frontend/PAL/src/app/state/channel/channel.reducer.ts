import { createReducer, on } from "@ngrx/store";
import { Channels } from "./channel.action"
import { Channel } from "../../Models/channel.model"
import { UserChannel } from "../../Models/userChannel.model";


export interface ChannelState {
    allChannels: Channel[],
    error?: string,
    clickedPrivateChannelID?: number,
    privateChannelIds?: number[],
    addedToPrivateChannelId?: number,
    newPrivateChannel:Channel[],
    privateChannelParticipants:UserChannel[],
    //flags
    currentConversationId:number | undefined

    
}

export const initialState: ChannelState = {
    allChannels: [],
    error: '',
    clickedPrivateChannelID: 0,
    privateChannelIds: [],
    addedToPrivateChannelId: 0,
    newPrivateChannel: [],
    privateChannelParticipants: [],
    currentConversationId: 8
}

export const channelReducer = createReducer(
    initialState,

    /// API calls ///

    //load all channels
    on(Channels.Api.Actions.loadAllChannelsSucceeded, (state, { channels }) => {

        const loadAllChannelsDeepCopy = channels.map(channel => ({ ...channel }))

        return {
            ...state,
            allChannels: loadAllChannelsDeepCopy
        }
    }),

    //load private channel by channel ID
    on(Channels.Api.Actions.loadPrivateChannelByIdSucceeded, (state, { channelId }) => {
        return {
            ...state,
            clickedPrivateChannelID: channelId
        }
    }),

    //load userChannel objects by userID
    on(Channels.Api.Actions.loadUserChannelByUserIdSucceeded, (state, { userChannels }) => {

        const extractedPrivateChannelIds = userChannels.map(userChannel => userChannel.channel_Id)

        return {
            ...state,
            privateChannelIds: extractedPrivateChannelIds
        }
    }),

    //load participants of the private channel
    on(Channels.Api.Actions.loadParticipantsOfPrivateChannelSucceeded, (state, { participants })=>{
        console.log(`private channel participants:`, participants)
        return {
            ...state,
            privateChannelParticipants: participants
        }
    }),

    //load user to private channel
    on(Channels.Api.Actions.loadPrivateUserChannelSucceeded, (state,{userChannelObj})=>{
        console.log(`after addition:`,[...state.privateChannelParticipants, userChannelObj])
        return {
            ...state,
            privateChannelParticipants: [...state.privateChannelParticipants, userChannelObj]
        }
    }),

    //filter out user from the private channel
    on(Channels.Api.Actions.removeUserFromUserChannelSucceeded, (state,{userId,channelId})=>{
        const updatedPrivateChannelParticipants = state.privateChannelParticipants.filter(
            userChannelObj => userChannelObj.user_Id !== userId &&
            userChannelObj.channel_Id == channelId 
       
        )
       
        return {
            ...state,
            privateChannelParticipants: updatedPrivateChannelParticipants
        }
    }),

    /// Hub calls ///

    //add user to private channel
    on(Channels.Hub.Actions.inviteUserToPrivateChannelSucceeded, (state, { channelId }) => {
        const addChannel = [...(state.privateChannelIds ?? []), channelId]
        return {
            ...state,
            privateChannelIds: addChannel
        }
    }),

    //remove user from private channel
    on(Channels.Hub.Actions.kickUserFromPrivateChannelSucceeded, (state, { privateChannelId }) => {
        const updatedPrivateChannelIds = state.privateChannelIds?.filter(channelId => channelId !== privateChannelId)
        return {
            ...state,
            privateChannelIds: updatedPrivateChannelIds
        }
    }),

    //add newly created private channel to the state
    on(Channels.Hub.Actions.addNewPrivateChannelSucceeded, (state,{ newPrivateChannel }) =>{
           
            const addNewPrivateChannelId = [...(state.privateChannelIds ?? []), newPrivateChannel.id]
            console.log(`reducer:`, addNewPrivateChannelId)
            return {
                ...state,
                allChannels:[...state.allChannels,newPrivateChannel],
                newPrivateChannel: [newPrivateChannel],
                privateChannelIds:addNewPrivateChannelId
            }
    }),

    /// Flags changes ///

    // set currently clicked conversation flag
    on(Channels.Flag.Actions.loadCurrentlyClickedConversationSucceeded, (state, {conversationId})=>{
//        console.log(`channel reducer fires:`, conversationId)
        return {
            ...state,
            currentConversationId: conversationId
        }
    })

)