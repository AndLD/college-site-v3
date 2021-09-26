import { render, screen } from '@testing-library/react'
import '../configs/firebase-config'
import store from '../store'
import { Provider } from 'react-redux'
import App from '../App'

test('renders page title', () => {
    render(
        <Provider store={store}>
            <App />
        </Provider>
    )
    const titleElement = screen.getByText(/Main Page/i)
    expect(titleElement).toBeInTheDocument()
})
