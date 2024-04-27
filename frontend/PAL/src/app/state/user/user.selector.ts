import { createFeatureSelector, createSelector } from "@ngrx/store";
import { UserState } from "./user.reducer";

export const selectedUserState = createFeatureSelector<UserState>("userReducer")

//select  ERROR
export const selectUserError = createSelector(
    selectedUserState,
    (state: UserState) =>
        state.error
)

//select user by ID
export const selectUserById = createSelector(
    selectedUserState,
    (state:UserState) =>
        state.userById
)
