export interface Message{
    id: number,
    body: string,
    sentFromUser: number,
    sentToUser?: number,
    sentToChannel?:number,
    time: Date,
    IsSeen:boolean
}