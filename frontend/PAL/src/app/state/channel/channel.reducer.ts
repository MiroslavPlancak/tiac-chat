import { createReducer, on } from "@ngrx/store";
import { Channels } from "./channel.action"
import { Channel } from "../../Models/channel.model"

export interface ChannelState {
    allChannels: Channel[],
    error?: string,
    clickedPrivateChannelID?: number,
    privateChannelIds?: number[],
    addedToPrivateChannelId?: number,
    newPrivateChannel:Channel[]
    
}

export const initialState: ChannelState = {
    allChannels: [],
    error: '',
    clickedPrivateChannelID: 0,
    privateChannelIds: [],
    addedToPrivateChannelId: 0,
    newPrivateChannel: []
}

export const channelReducer = createReducer(
    initialState,

    /// API calls ///

    //load all channels
    on(Channels.Api.Actions.loadAllChannelsSucceeded, (state, { channels }) => {
        // console.log(`channel reducer:`, channels)
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
        //console.log(`reducer output:`, userChannels)
        const extractedPrivateChannelIds = userChannels.map(userChannel => userChannel.channel_Id)
        //console.log(`reducer output #2:`, extractedPrivateChannelIds)
        return {
            ...state,
            privateChannelIds: extractedPrivateChannelIds
        }
    }),

    /// Hub calls ///

    //add user to private channel
    on(Channels.Hub.Actions.addUserToPrivateChannelSucceeded, (state, { channelId }) => {
        const addChannel = [...(state.privateChannelIds ?? []), channelId]
        return {
            ...state,
            privateChannelIds: addChannel
        }
    }),

    //remove user from private channel
    on(Channels.Hub.Actions.removeUserFromPrivateChannelSucceeded, (state, { privateChannelId }) => {
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
                // /allChannels: state.allChannels.concat(newPrivateChannel) - this is more efficient thant he approach below
                allChannels:[...state.allChannels,newPrivateChannel],
                newPrivateChannel: [newPrivateChannel],
                privateChannelIds:addNewPrivateChannelId
            }
    })


)