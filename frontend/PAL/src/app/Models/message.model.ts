export interface Message{
    id: number,
    body: string,
    sentFromUserId: number,
    sentToUser?: number,
    sentToChannel?:number,
    time: Date,
    isSeen:boolean
}