import { Routes, Route } from 'react-router-dom'
import ModeSelection from './pages/ModeSelection'
import MultiplayerHome from './pages/MultiplayerHome'
import SinglePlayerSetup from './pages/SinglePlayerSetup'
import SinglePlayerGame from './pages/SinglePlayerGame'
import CreateRoom from './pages/CreateRoom'
import JoinRoom from './pages/JoinRoom'
import Lobby from './pages/Lobby'
import CharacterSetup from './pages/CharacterSetup'
import Game from './pages/Game'
import PasswordGuard from './components/PasswordGuard/PasswordGuard'

function App() {
    return (
        <PasswordGuard>
            <Routes>
                <Route path="/" element={<ModeSelection />} />
                <Route path="/multiplayer" element={<MultiplayerHome />} />
                <Route path="/singleplayer" element={<SinglePlayerSetup />} />
                <Route path="/singleplayer/game" element={<SinglePlayerGame />} />
                <Route path="/create" element={<CreateRoom />} />
                <Route path="/join" element={<JoinRoom />} />
                <Route path="/lobby/:roomId" element={<Lobby />} />
                <Route path="/setup/:roomId" element={<CharacterSetup />} />
                <Route path="/game/:roomId" element={<Game />} />
            </Routes>
        </PasswordGuard>
    )
}

export default App
