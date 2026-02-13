import { Routes, Route } from 'react-router-dom'
import ModeSelection from './pages/ModeSelection'
import MultiplayerHome from './pages/MultiplayerHome'
import SinglePlayerSetup from './pages/SinglePlayerSetup'
import CreateRoom from './pages/CreateRoom'
import JoinRoom from './pages/JoinRoom'
import Lobby from './pages/Lobby'
import CharacterSetup from './pages/CharacterSetup'
import PasswordGuard from './components/PasswordGuard/PasswordGuard'

// Game Modes from AllGameMode
import Single_RandomKill from './AllGameMode/Single_RandomKill/Single_RandomKill'
import Single_Zombie from './AllGameMode/Single_Zombie/Single_Zombie'
import Single_TD from './AllGameMode/Single_TD/Single_TD'
import Multi_Team from './AllGameMode/Multi_Team/Multi_Team'
import Multi_Boam from './AllGameMode/Multi_Boam/Multi_Boam'
import Multi_Hostage from './AllGameMode/Multi_Hostage/Multi_Hostage'
import Multi_CQB from './AllGameMode/Multi_CQB/Multi_CQB'
import Multi_1v1 from './AllGameMode/Multi_1v1/Multi_1v1'
import Multi_LS from './AllGameMode/Multi_LS/Multi_LS'

function App() {
    return (
        <PasswordGuard>
            <Routes>
                <Route path="/" element={<ModeSelection />} />
                <Route path="/multiplayer" element={<MultiplayerHome />} />
                <Route path="/singleplayer" element={<SinglePlayerSetup />} />

                {/* Single Player Modes */}
                <Route path="/singleplayer/game/randomkill" element={<Single_RandomKill />} />
                <Route path="/singleplayer/game/zombie" element={<Single_Zombie />} />
                <Route path="/singleplayer/game/td" element={<Single_TD />} />

                {/* Multiplayer Modes */}
                <Route path="/multiplayer/game/team/:roomId" element={<Multi_Team />} />
                <Route path="/multiplayer/game/bomb/:roomId" element={<Multi_Boam />} />
                <Route path="/multiplayer/game/hostage/:roomId" element={<Multi_Hostage />} />
                <Route path="/multiplayer/game/cqb/:roomId" element={<Multi_CQB />} />
                <Route path="/multiplayer/game/1v1/:roomId" element={<Multi_1v1 />} />
                <Route path="/multiplayer/game/ls/:roomId" element={<Multi_LS />} />

                <Route path="/create" element={<CreateRoom />} />
                <Route path="/join" element={<JoinRoom />} />
                <Route path="/lobby/:roomId" element={<Lobby />} />
                <Route path="/setup/:roomId" element={<CharacterSetup />} />
            </Routes>
        </PasswordGuard>
    )
}

export default App
