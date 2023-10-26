import { State } from './core/state';

declare interface Logs {
   from: string
   to: string
   content: string
}

export interface _global {
   version: string
   editors: Map<string, Editor>
   HTMLElementIDs: Set<string>
   logs: Logs
   currentState: State
}







