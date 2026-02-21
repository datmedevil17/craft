import React, { useState, useCallback, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useMinecraftProgram } from './hooks/use-minecraft-program';
import { useCubeStore } from './useStore';

export const TestPage = () => {
    const wallet = useWallet();
    const {
        profile,
        erAccount,
        delegationStatus,
        sessionToken,
        isLoading,
        isSessionLoading,
        initialize,
        delegateSession,
        enterGame,
        placeBlock,
        attack,
        killEntity,
        endGame,
        commitSession,
        undelegateSession,
        createSession,
    } = useMinecraftProgram();

    const [logs, setLogs] = useState([]);

    const addLog = useCallback((msg, type = 'info') => {
        const timestamp = new Date().toLocaleTimeString();
        setLogs(prev => [{ timestamp, msg, type }, ...prev].slice(0, 50));
        console.log(`[TestLog] ${msg}`);
    }, []);

    // Helper to wrap async functions with logging
    const runTest = async (name, fn, ...args) => {
        addLog(`Starting: ${name}...`, 'process');
        try {
            const result = await fn(...args);
            const logMsg = result === undefined ? 'Success' :
                (typeof result === 'object' ? JSON.stringify(result) : result);
            addLog(`Success: ${name} | Hash: ${logMsg}`, 'success');
        } catch (err) {
            addLog(`Error: ${name} | ${err.message}`, 'error');
        }
    };

    return (
        <div style={{
            padding: '40px',
            color: '#fff',
            fontFamily: 'monospace',
            background: '#121212',
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            pointerEvents: 'auto'
        }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333', paddingBottom: '20px' }}>
                <div>
                    <h1 style={{ margin: 0, color: '#4a90e2' }}>Blockchain Debugger</h1>
                    <p style={{ opacity: 0.5 }}>Meinkraft v5 (Simplified Single Account)</p>
                </div>
                <WalletMultiButton />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                {/* Left: State & Controls */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {/* State Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div style={cardStyle}>
                            <div style={labelStyle}>Wallet</div>
                            <div style={valueStyle}>{wallet.publicKey ? wallet.publicKey.toBase58().slice(0, 8) + '...' : 'Disconnected'}</div>
                        </div>
                        <div style={cardStyle}>
                            <div style={labelStyle}>Delegation</div>
                            <div style={{ ...valueStyle, color: delegationStatus === 'delegated' ? '#55FF55' : '#FF5555' }}>
                                {delegationStatus.toUpperCase()}
                            </div>
                        </div>
                        <div style={cardStyle}>
                            <div style={labelStyle}>Session Key</div>
                            <div style={valueStyle}>{sessionToken ? 'Active ✅' : 'None ❌'}</div>
                        </div>
                        <div style={cardStyle}>
                            <div style={labelStyle}>Account PDA</div>
                            <div style={valueStyle}>{profile ? 'Initialized ✅' : 'Missing ❌'}</div>
                        </div>
                    </div>

                    {/* Instruction Buttons */}
                    <div style={{ background: '#1e1e1e', padding: '20px', borderRadius: '8px', border: '1px solid #444' }}>
                        <h3 style={{ marginTop: 0, color: '#4a90e2' }}>Lifecycle Actions</h3>
                        <div style={buttonGridStyle}>
                            <button onClick={() => runTest('Initialize', initialize)} style={{ ...btnStyle, background: '#3b82f6' }}>Init Profile</button>
                            <button onClick={() => runTest('Create Session', createSession)} style={{ ...btnStyle, background: '#2563eb' }}>Create Session</button>
                            <button onClick={() => runTest('Delegate', delegateSession)} style={{ ...btnStyle, background: '#1d4ed8' }} disabled={isLoading}>Delegate</button>
                            <button onClick={() => runTest('Enter Game', enterGame, 'Jungle')} style={{ ...btnStyle, background: '#1e40af' }}>Enter (Jungle)</button>
                        </div>

                        <h3 style={{ marginTop: '20px', color: '#10b981' }}>In-Game Actions (ER)</h3>
                        <div style={buttonGridStyle}>
                            <button onClick={() => runTest('Place Block', placeBlock, 'Block_Grass')} style={{ ...btnStyle, background: '#059669' }}>Place Grass</button>
                            <button onClick={() => runTest('Attack', attack, 'Zombie', 10)} style={{ ...btnStyle, background: '#047857' }}>Attack Zombie</button>
                            <button onClick={() => runTest('Kill Entity', killEntity, 'Wolf', 25)} style={{ ...btnStyle, background: '#065f46' }}>Kill Skeleton</button>
                            <button onClick={() => runTest('End Game', endGame)} style={{ ...btnStyle, background: '#064e3b' }} disabled={isLoading}>End Game</button>
                        </div>

                        <h3 style={{ marginTop: '20px', color: '#f59e0b' }}>Settlement Actions</h3>
                        <div style={buttonGridStyle}>
                            <button onClick={() => runTest('Commit', commitSession)} style={{ ...btnStyle, background: '#d97706' }}>Commit Session</button>
                            <button onClick={() => runTest('Undelegate', undelegateSession)} style={{ ...btnStyle, background: '#b45309', border: '1px solid white' }}>Undelegate & Settle</button>
                        </div>
                    </div>

                    {/* Account Data Viewer */}
                    {profile && (
                        <div style={{ background: '#1e1e1e', padding: '20px', borderRadius: '8px', border: '1px solid #444' }}>
                            <h3 style={{ marginTop: 0 }}>On-Chain Account Data</h3>
                            <pre style={{ fontSize: '11px', background: '#000', padding: '10px', borderRadius: '5px', overflowX: 'auto' }}>
                                {JSON.stringify(profile, (k, v) => typeof v === 'bigint' ? v.toString() : v, 2)}
                            </pre>
                            {erAccount && (
                                <>
                                    <h3 style={{ marginTop: '10px' }}>ER Ephemeral Data</h3>
                                    <pre style={{ fontSize: '11px', background: '#000', padding: '10px', borderRadius: '5px', color: '#55FF55' }}>
                                        {JSON.stringify(erAccount, (k, v) => typeof v === 'bigint' ? v.toString() : v, 2)}
                                    </pre>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Right: Logs */}
                <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 150px)' }}>
                    <div style={{ flex: 1, background: '#000', borderRadius: '8px', border: '1px solid #444', padding: '15px', overflowY: 'auto', display: 'flex', flexDirection: 'column-reverse' }}>
                        {logs.length === 0 && <div style={{ color: '#444' }}>Waiting for actions...</div>}
                        {logs.map((log, i) => (
                            <div key={i} style={{
                                padding: '4px 0',
                                borderBottom: '1px solid #1a1a1a',
                                color: log.type === 'error' ? '#ff5555' : log.type === 'success' ? '#55ff55' : log.type === 'process' ? '#4a90e2' : '#aaa',
                                fontSize: '12px'
                            }}>
                                <span style={{ opacity: 0.4, marginRight: '8px' }}>[{log.timestamp}]</span>
                                {log.msg}
                            </div>
                        ))}
                    </div>
                    <button onClick={() => setLogs([])} style={{ marginTop: '10px', padding: '8px', background: '#333', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Clear Logs</button>
                </div>
            </div>
        </div>
    );
};

// Styles
const cardStyle = { background: '#1e1e1e', padding: '12px', borderRadius: '8px', border: '1px solid #333' };
const labelStyle = { fontSize: '10px', opacity: 0.5, textTransform: 'uppercase' };
const valueStyle = { fontSize: '13px', fontWeight: 'bold', marginTop: '4px', wordBreak: 'break-all' };
const buttonGridStyle = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' };
const btnStyle = { padding: '10px', background: '#444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' };
const btnActionStyle = { padding: '10px', background: '#4a90e2', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' };
