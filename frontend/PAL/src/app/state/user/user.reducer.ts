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
    
    //get user by ID
    on(Users.Api.Actions.loadUserByIdSucceeded, (state,{user})=>{

        console.log(`reducer output:`, state.userById);
    
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
     //get user by ID ERROR
     on(Users.Api.Actions.loadUserByIdFailed, (state,{error})=>{
        return {
            ...state,
            error:error,
            userById:[]
        }
    })

)