import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react'
import './App.css'
import Sidebar from './components/Sidebar'

function App() {
  return (
    <div style={{display: "flex", height: "100vh"}}>
      <Sidebar />

      <div className="app-container" style={{flex:1}}>
        <header className="app-header">
          <SignedOut>
            <SignInButton mode="modal">
              <button className="login-button">Login</button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <UserButton />
          </SignedIn>
        </header>
        <main className="main-content">
          <h1 className="welcome-message">Welcome to LoanFit Copilot</h1>
        </main>
      </div>
    </div>
  )
}

export default App
