import { useVault } from "./hooks/useVault";
import LoginScreen from "./components/LoginScreen";
import VaultScreen from "./components/VaultScreen";
import "./styles/global.css";

function App() {
  const { vault, loading, error, isLocked, unlock, lock, addCredential, updateCredential, deleteCredential, reorderCredentials } =
    useVault();

  return (
    <div className="app">
      {isLocked ? (
        <LoginScreen onUnlock={unlock} loading={loading} error={error} />
      ) : (
        <VaultScreen
          vault={vault!}
          onLock={lock}
          onAdd={addCredential}
          onUpdate={updateCredential}
          onDelete={deleteCredential}
          onReorder={reorderCredentials}
        />
      )}
    </div>
  );
}

export default App;
