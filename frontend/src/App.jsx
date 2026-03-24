import VoiceOrderPage from './pages/VoiceOrderPage.jsx';
import { useSocket } from './hooks/useSocket.js';

export default function App() {
  useSocket(); // Initialize real-time WebSocket connection

  return (
    <div className="app-shell">
      <VoiceOrderPage />
    </div>
  );
}
