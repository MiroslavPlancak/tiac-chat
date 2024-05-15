import { createActionGroup, emptyProps, props } from "@ngrx/store";
import { SafeType } from '../../Utilities/safeType.action'

export const CHAT_SOURCE = 'Chats'

export namespace Chats{
    
    export namespace Api{

        export const SOURCE = SafeType.Source.from(CHAT_SOURCE, 'Api')

        export const Actions = createActionGroup({
            events:{
                
            },
            source:SOURCE
        })
    }
}