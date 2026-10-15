import { EventEmitter } from 'events';

class ChatEventEmitter extends EventEmitter {}

export const chatEvents = new ChatEventEmitter();
