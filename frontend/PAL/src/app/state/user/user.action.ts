import { createActionGroup, emptyProps, props } from "@ngrx/store";
import { User } from '../../Models/user.model'
import { SafeType } from "../../Utilities/safeType.action";

export const USER_SOURCE = 'Users'

export namespace Users{
    export namespace Api{

        export const SOURCE = SafeType.Source.from(USER_SOURCE, 'Api')

            export const Actions = createActionGroup({
                events:{
                    LoadUserByIdIfNeeded: props<{ userId: number }>(),

                    //load user by ID
                    LoadUserByIdStarted: props<{ userId: number }>(),
                    LoadUserByIdSucceeded: props<{ user: User }>(),
                    LoadUserByIdFailed: props<{ error: any }>(),
                    
                    //load all users
                    LoadAllUsersStarted: emptyProps(),
                    LoadAllUsersSucceeded: props<{ users: User[] }>(),
                    LoadAllUsersFailed: props<{ error: any }>(),
                },
                source:SOURCE
            })
    }

    export namespace Hub{

        export const SOURCE = SafeType.Source.from(USER_SOURCE, 'Hub')

            export const Actions = createActionGroup({
                events:{    

                    //load connected user
                    LoadConnectedUserStarted: props<{ connectedUserId: number }>(),
                    LoadConnectedUserSucceeded: props<{ connectedUserId: number }>(),
                    LoadConnectedUserFailed: props<{ error: any }>(),

                    //load connected users 
                    LoadConnectedUsersStarted: props<{ connectedUserIds: number[] }>(),
                    LoadConnectedUsersSucceeded: props<{ connectedUserIds: number[] }>(),
                    LoadConnectedUsersFailed: props<{ error: any }>(),
                },  
                source:SOURCE
            })
    }
}