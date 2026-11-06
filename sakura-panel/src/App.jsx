
import React, { useEffect, useState } from 'react';
import './App.css';

const API = 'http://localhost:3001';

const inviteUrl =
  'https://discord.com/oauth2/authorize?client_id=1567187274444177519&scope=bot+applications.commands&permissions=0';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [servers, setServers] = useState([]);
  const [selectedServer, setSelectedServer] = useState(null);
  const [error, setError] = useState('');
  const [selecting, setSelecting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [botStatus, setBotStatus] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  // ตรวจสอบ Discord Session
  async function checkAuth() {
    setLoading(true);

    try {
      const response = await fetch(`${API}/api/auth/me`, {
        credentials: 'include',
        cache: 'no-store'
      });

      if (!response.ok) {
        setUser(null);
        setServers([]);
        return;
      }

      const data = await response.json();

      if (data.authenticated && data.user) {
        setUser(data.user);
        await loadDashboard();
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('AUTH ERROR:', err);
      setError('ไม่สามารถเชื่อมต่อ SAKURA API ได้');
    } finally {
      setLoading(false);
    }
  }

  // โหลดข้อมูล Dashboard
  async function loadDashboard() {
    try {
      const [serverResponse, botResponse] = await Promise.all([
        fetch(`${API}/api/servers`, {
          credentials: 'include',
          cache: 'no-store'
        }),
        fetch(`${API}/api/bot/status`, {
          credentials: 'include',
          cache: 'no-store'
        })
      ]);

      if (serverResponse.status === 401) {
        setUser(null);
        return;
      }

      if (!serverResponse.ok) {
        throw new Error('ไม่สามารถโหลดรายชื่อเซิร์ฟเวอร์ได้');
      }

      const serverData = await serverResponse.json();
      setServers(serverData.servers || []);

      if (botResponse.ok) {
        const botData = await botResponse.json();
        setBotStatus(botData.bot);
      }
    } catch (err) {
      console.error('DASHBOARD ERROR:', err);
      setError(err.message);
    }
  }

  // Refresh Dashboard
  async function refreshDashboard() {
    setRefreshing(true);
    setError('');

    try {
      await loadDashboard();
    } finally {
      setRefreshing(false);
    }
  }

  // เลือกเซิร์ฟเวอร์
  async function selectServer(server) {
    if (!server.botAdded) {
      window.open(
        `${inviteUrl}&guild_id=${server.id}&disable_guild_select=true`,
        '_blank',
        'noopener,noreferrer'
      );
      return;
    }

    setSelecting(true);
    setError('');

    try {
      const response = await fetch(
        `${API}/api/servers/${server.id}/select`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'เลือกเซิร์ฟเวอร์ไม่สำเร็จ');
      }

      setSelectedServer(data.server);
    } catch (err) {
      setError(err.message);
    } finally {
      setSelecting(false);
    }
  }

  // Logout
  async function logout() {
    try {
      await fetch(`${API}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (err) {
      console.error('LOGOUT ERROR:', err);
    }

    setUser(null);
    setServers([]);
    setSelectedServer(null);
    setBotStatus(null);
    setError('');
    window.history.replaceState({}, '', '/');
  }

  // Loading
  if (loading) {
    return (
      <main className="sakura-loading">
        <div className="loading-orb">🌸</div>
        <h2>SAKURA SYSTEM</h2>
        <p>กำลังเชื่อมต่อระบบ...</p>
      </main>
    );
  }

  // HOME
  if (!user) {
    return (
      <main className="sakura-home">
        <img
          className="sakura-background"
          src="/anime.png"
          alt="Sakura Anime Background"
        />

        <div className="sakura-content">
          <span className="premium">✦ PREMIUM PANEL ✦</span>
          <h1>SAKURA</h1>

          <h2>
            Manage Your Server
            <br />
            <span>With Sakura.</span>
          </h2>

          <p className="subtitle">
            YOUR DISCORD, YOUR CONTROL
          </p>

          <p className="description">
            ระบบจัดการ Discord Bot
            ที่สวยงาม ใช้งานง่าย รวมทุกอย่างไว้ในที่เดียว
          </p>

          <div className="actions">
            <a
              href={`${API}/auth/discord`}
              className="login-button"
            >
              เข้าสู่ระบบด้วย Discord →
            </a>

            <a
              href={inviteUrl}
              className="invite-button"
              target="_blank"
              rel="noopener noreferrer"
            >
              🌸 เชิญบอทเข้าเซิร์ฟเวอร์
            </a>
          </div>

          {error && (
            <p className="error-message">{error}</p>
          )}

          <div className="features">
            <span>✦ Server Management</span>
            <span>✦ Bot Monitoring</span>
            <span>✦ Premium Dashboard</span>
          </div>

          <footer>
            🌸 SAKURA PANEL · DISCORD MANAGEMENT
          </footer>
        </div>
      </main>
    );
  }

  // DASHBOARD
  return (
    <main className="dashboard">
      <div className="dashboard-bg" />

      {/* HEADER */}
      <header className="dashboard-header">
        <div className="brand">
          <span className="brand-icon">🌸</span>

          <div>
            <h2>SAKURA</h2>
            <small>CONTROL PANEL</small>
          </div>
        </div>

        <div className="user-area">
          <div className="user-info">
            <strong>
              {user.global_name || user.username}
            </strong>
            <small>DISCORD ACCOUNT</small>
          </div>

          {user.avatar && (
            <img
              className="user-avatar"
              src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`}
              alt="Discord Avatar"
            />
          )}

          <button
            className="logout-button"
            onClick={logout}
          >
            ↪ Logout
          </button>
        </div>
      </header>

      {/* MAIN */}
      <section className="dashboard-main">

        {/* WELCOME */}
        <div className="welcome">
          <span className="premium">
            ✦ SAKURA MANAGEMENT SYSTEM ✦
          </span>

          <h1>
            Welcome Back,
            <span> {user.global_name || user.username}</span>
          </h1>

          <p>
            ยินดีต้อนรับสู่ Sakura Control Panel
            จัดการ Discord Server ของคุณได้จากที่นี่
          </p>

          <div className="welcome-status">
            <span className="online-dot" />
            SYSTEM CONNECTED
          </div>
        </div>

        {error && (
          <div className="error-message">
            🌸 {error}
          </div>
        )}

        {/* STATISTICS */}
        <div className="stats-grid">

          <div className="stat-card">
            <div className="stat-icon">🌐</div>
            <div>
              <small>YOUR SERVERS</small>
              <h2>{servers.length}</h2>
              <p>Discord Servers</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🤖</div>
            <div>
              <small>BOT STATUS</small>
              <h2 className={botStatus?.ready ? 'status-online' : 'status-checking'}>
                {botStatus?.ready ? 'ONLINE' : 'CHECKING'}
              </h2>
              <p>Sakura Bot System</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">⚡</div>
            <div>
              <small>BOT SERVERS</small>
              <h2>{botStatus?.servers ?? '-'}</h2>
              <p>Connected Guilds</p>
            </div>
          </div>

        </div>

        {/* SERVER MANAGEMENT */}
        <div className="server-section">

          <div className="section-heading">
            <div>
              <span className="premium">
                ✦ SERVER MANAGEMENT
              </span>

              <h2>My Discord Servers</h2>

              <p>
                เลือกเซิร์ฟเวอร์ที่คุณต้องการจัดการ
              </p>
            </div>

            <button
              className="refresh-button"
              onClick={refreshDashboard}
              disabled={refreshing}
            >
              {refreshing ? '⟳ Loading...' : '↻ Refresh'}
            </button>
          </div>

          {/* SERVER LIST */}
          {servers.length === 0 ? (
            <div className="empty-state">
              <span>🌸</span>
              <h3>ไม่พบเซิร์ฟเวอร์</h3>
              <p>
                บัญชี Discord นี้ยังไม่มีเซิร์ฟเวอร์ที่จัดการได้
              </p>
            </div>
          ) : (
            <div className="server-grid">
              {servers.map(server => (
                <div className="server-card" key={server.id}>

                  <div className="server-top">
                    {server.icon ? (
                      <img
                        src={`https://cdn.discordapp.com/icons/${server.id}/${server.icon}.png`}
                        alt={server.name}
                      />
                    ) : (
                      <div className="server-placeholder">
                        🌸
                      </div>
                    )}

                    <div className="server-info">
                      <h3>{server.name}</h3>
                      <small>
                        {server.owner
                          ? '✦ SERVER OWNER'
                          : 'MANAGE PERMISSION'}
                      </small>
                    </div>
                  </div>

                  <div className="server-status">
                    <span
                      className={
                        server.botAdded
                          ? 'online-dot'
                          : 'offline-dot'
                      }
                    />

                    {server.botAdded
                      ? 'SAKURA BOT CONNECTED'
                      : 'SAKURA BOT NOT ADDED'}
                  </div>

                  <button
                    className="server-action"
                    disabled={selecting}
                    onClick={() => selectServer(server)}
                  >
                    {selecting
                      ? 'กำลังดำเนินการ...'
                      : server.botAdded
                        ? 'จัดการเซิร์ฟเวอร์ →'
                        : 'เชิญบอทเข้าเซิร์ฟเวอร์ →'}
                  </button>

                </div>
              ))}
            </div>
          )}
        </div>

        {/* SELECTED SERVER */}
        {selectedServer && (
          <div className="selected-server">
            <h2>🌸 {selectedServer.name}</h2>
            <p>เลือกเซิร์ฟเวอร์สำเร็จแล้ว</p>
            <p>
              ขั้นตอนถัดไปสามารถเพิ่มหน้า Server Settings ได้
            </p>
          </div>
        )}

        <footer className="dashboard-footer">
          🌸 SAKURA PANEL © 2026 · POWERED BY DISCORD
        </footer>

      </section>
    </main>
  );
}
