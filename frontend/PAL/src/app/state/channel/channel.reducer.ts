import { createReducer, on } from "@ngrx/store";
import { Channels } from "./channel.action"
import { Channel } from "../../Models/channel.model"

export interface ChannelState {
    allChannels: Channel[],
    error?:string,
    clickedPrivateChannelID?:number,
}

export const initialState: ChannelState = {
    allChannels: [],
    error:'',
    clickedPrivateChannelID: 0,
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

 //load private channel by channel ID
 on(Channels.Api.Actions.loadPrivateChannelByIdSucceeded, (state, {channelId})=>{
    
    return {
        ...state,
        clickedPrivateChannelID: channelId
    }
 })
)