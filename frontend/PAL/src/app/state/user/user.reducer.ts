import { createReducer, on } from "@ngrx/store";
import { Users } from "./user.action"
import { User } from "../../Models/user.model";

export interface UserState{
    users: User[],
    error?: string,
    userById:User | undefined
}

export const initialState:UserState ={
    users: [],
    error: '',
    userById: undefined
}

export const userReducer = createReducer(
    initialState,
    
    //get user by ID
    on(Users.Api.Actions.loadUserByIdSucceeded, (state,{user})=>{
        return {
            ...state,
            userById:user
        }
    }),
    //get user by ID ERROR
    on(Users.Api.Actions.loadUserByIdFailed, (state,{error})=>{
        return {
            ...state,
            error:error,
            userById:undefined
        }
    })

)