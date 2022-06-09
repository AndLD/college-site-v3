import { setupApp } from './app'
import httpServer from 'http'
import { setupSocketServer } from './socket-connection'
import { setupRouters } from './routers'

export function setupServer() {
    const app = setupApp()
    setupRouters(app)

    const server = httpServer.createServer(app)
    setupSocketServer(server)

    return server
}
