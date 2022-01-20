import * as moment from 'moment';

export enum MessageType {
    CHAT='CHAT',
    LEAVE='LEAVE',
    JOIN='JOIN',
    TYPING='TYPING',
    UNTYPING='UNTYPING',
    LIST='LIST'
}

export interface MessageInterface {
    sender: string;
    content?: string;
    recipient?: string;
    date: moment.Moment;
    type: MessageType;
}
