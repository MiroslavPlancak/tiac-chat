import { createFeatureSelector, createSelector } from "@ngrx/store";
import { UserState } from "./user.reducer";

export const selectedUserState = createFeatureSelector<UserState>("userReducer")

//select  ERROR
export const selectUserError = createSelector(
    selectedUserState,
    (state: UserState) =>
        state.error
)

/////// API calls /////////
//select user by ID
export const selectUserById = createSelector(
    selectedUserState,
    (state:UserState) =>
        state.userById
)

export const selectUserByIdNew = (userId: number) => createSelector(
    selectedUserState,
    (state:UserState) =>{
        state.allUsers.find(user => user.id === userId)
    }
)
//select all users
export const selectAllUsers = createSelector(
    selectedUserState,
    (state:UserState) =>
        state.allUsers
)

/////// HUB calls /////////
//select connected users
export const selectConnectedUser = createSelector(
    selectedUserState,
    (state:UserState) =>
        state.onlineUser
)

//select connected users
export const selectConnectedUsers = createSelector(
    selectedUserState,
    (state:UserState) =>
        state.onlineUsers
)

