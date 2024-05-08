import { createReducer, on } from "@ngrx/store";
import { Channels } from "./channel.action"
import { Channel } from "../../Models/channel.model"

export interface ChannelState {
    allChannels: Channel[],
    error?:string
}

export const initialState: ChannelState = {
    allChannels: []
}

export const channelReducer  = createReducer(
    initialState,

    /// API calls ///

    //load all channels
    on(Channels.Api.Actions.loadAllChannelsSucceeded, (state,{channels})=>{
       // console.log(`channel reducer:`, channels)
        const loadAllChannelsDeepCopy = channels.map( channel => ({...channel}))

        return{
            ...state,
            allChannels:loadAllChannelsDeepCopy
        }
    }),

    // //load private channels by user ID
    // on(Channels.Api.Actions.loadPrivateChannelsByUserIdSucceeded, (state, { privateChannels }) => {

    //     return {
    //         ...state
    //     }
    // })
)