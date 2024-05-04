import { createReducer, on } from "@ngrx/store";
import { Users } from "./user.action"
import { User } from "../../Models/user.model";

export interface UserState{
    //need to have only allUsers here, User object should have a new property isOnline:true/false, which we then change.
    allUsers: User[],
    error?: string,
    userById:User[],
    onlineUser?:User,//onlineUserId: number, is what we return from the back end and then use it to filter from allUsers
    appliedFilter?: string
}

export const initialState:UserState ={
    allUsers: [],
    error: '',
    userById:[],
   
}

export const userReducer = createReducer(
    initialState,
    
    /// API calls /// 
    //load user by ID
    on(Users.Api.Actions.loadUserByIdSucceeded, (state,{user})=>{

        const isUserInState = state.userById.some(u => u.id === user.id);

        if (!isUserInState) {
           
            return {
                ...state,
                userById: [...state.userById, user]
            };
        } else {
            
            return state;
        }
    }),
     //load user by ID ERROR
     on(Users.Api.Actions.loadUserByIdFailed, (state,{error})=>{
        return {
            ...state,
            error:error,
            userById:[]
        }
    }),

    //load all users
    on(Users.Api.Actions.loadAllUsersSucceeded, (state,{users})=>{
      
        const loadAllUsersDeepCopy = users.map(user => ({...user, isOnline:false}))
       
        return {
            ...state,
            allUsers:loadAllUsersDeepCopy
        }
    }),
    //load all users ERROR
    on(Users.Api.Actions.loadAllUsersFailed, (state,{error})=>{
        return {
            ...state,
            error: error
        }
    }),

    /// HUB calls ///
    //load connected user
    on(Users.Hub.Actions.loadConnectedUserSucceeded, (state,{connectedUserId})=>{
        
        const currentUser = state.allUsers.filter(user => user.id == connectedUserId)
        const currentUserObj = currentUser[0]
      
        return {
            ...state,
            onlineUser: currentUserObj
        }
    }),

    //load connected users
    on(Users.Hub.Actions.loadConnectedUsersSucceeded, (state,{connectedUserIds})=>{
    

        const updatedOnlineUsers = state.allUsers.map(user => ({
            ...user,
            isOnline: connectedUserIds.includes(user.id)
        }))
        
        return {
            ...state,
            allUsers: updatedOnlineUsers
        }
    })
    //load connected user ERROR


)