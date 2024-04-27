import { Injectable, inject } from "@angular/core";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import * as rxjs from 'rxjs';
import { Users } from '../user/user.action'
import { UserService } from "../../Services/user.service";

@Injectable()

export class UserEffect{

    private userService = inject(UserService)
    private actions$ = inject(Actions)

        loadUserById$ = createEffect(()=>
            this.actions$.pipe(
                ofType(Users.Api.Actions.loadUserByIdStarted),
                rxjs.switchMap((action)=>
                    this.userService.getById(action.userId).pipe(
                        rxjs.map((response) => Users.Api.Actions.loadUserByIdSucceeded({ user: response})),
                        rxjs.catchError((error) => rxjs.of(Users.Api.Actions.loadUserByIdFailed({ error: error})))
                    )
                )
            )
        )
}