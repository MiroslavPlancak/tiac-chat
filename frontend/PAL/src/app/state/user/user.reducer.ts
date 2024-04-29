import { createReducer, on } from "@ngrx/store";
import { Users } from "./user.action"
import { User } from "../../Models/user.model";

export interface UserState{
    users: User[],
    error?: string,
    userById:User[]
}

export const initialState:UserState ={
    users: [],
    error: '',
    userById:[],
}

export const userReducer = createReducer(
    initialState,
    
    //load user by ID
    on(Users.Api.Actions.loadUserByIdSucceeded, (state,{user})=>{

        const isUserInState = state.userById.some(u => u.id === user.id);

        if (!isUserInState) {
            console.log(`return reducer output:`, [...state.userById, user]);
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
        const loadAllUsersDeepCopy = users.map(user => ({...user}))
        return {
            ...state,
            users:loadAllUsersDeepCopy
        }
    }),
    //load all users ERROR
    on(Users.Api.Actions.loadAllUsersFailed, (state,{error})=>{
        return {
            ...state,
            error: error
        }
    })


)