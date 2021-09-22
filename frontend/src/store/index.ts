import { createStore, compose, applyMiddleware } from 'redux'
import { rootReducer } from './rootReducer'
import thunk from 'redux-thunk'

declare global {
    interface Window {
        __REDUX_DEVTOOLS_EXTENSION_COMPOSE__?: typeof compose
    }
}

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose

export default createStore(rootReducer, composeEnhancers(applyMiddleware(thunk)))
