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
//select all users
export const selectAllUsers = createSelector(
    selectedUserState,
    (state:UserState) =>
        state.users
)
