import { State, Subscriber } from '../../utils/types'

export function useState(initialState?: any, ...subscribers: Subscriber[]) {
    const state: State = {
        state: initialState,
        setState(newState: any) {
            state.state = newState

            for (const sub of subscribers) {
                sub(newState)
            }
        },
        subscribers
    }

    return state
}

export function useEffect(subscriber: Subscriber, states: any[]) {
    for (const state of states) state.subscribers.push(subscriber)
}
