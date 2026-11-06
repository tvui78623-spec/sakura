import React, { useState } from 'react';
import SakuraEffect from './SakuraEffect';

export default function DiscordDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  // ระบบเตะ/แบน/พักการใช้งาน (Timeout)
  const [targetUser, setTargetUser] = useState('');
  const [modAction, setModAction] = useState('timeout');
  const [timeoutDuration, setTimeoutDuration] = useState('60');
  const [modReason, setModReason] = useState('');

  // ระบบปุ่มแจกยศเยอะๆ
  const [roles, setRoles] = useState([
    { id: '1', name: 'Member 👤', color: '#3498db', count: 120 },
    { id: '2', name: 'VIP ⭐', color: '#f1c40f', count: 45 },
    { id: '3', name: 'Gamer 🎮', color: '#2ecc71', count: 88 },
    { id: '4', name: 'Streamer 🎥', color: '#9b59b6', count: 12 },
    { id: '5', name: 'Giveaway 🎉', color: '#e74c3c', count: 210 },
  ]);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleColor, setNewRoleColor] = useState('#ffffff');

  const handleAddRole = () => {
    if (!newRoleName.trim()) return;
    const newRole = {
      id: Date.now().toString(),
      name: newRoleName,
      color: newRoleColor,
      count: 0
    };
    setRoles([...roles, newRole]);
    setNewRoleName('');
  };

  const handleRemoveRole = (id) => {
    setRoles(roles.filter(role => role.id !== id));
  };

  const modules = [
    { id: 'discovery', title: 'Discovery', desc: 'จัดการโปรไฟล์เซิร์ฟเวอร์และโปรโมทเพื่อเพิ่มการมองเห็น', category: 'โซเชียล' },
    { id: 'logs', title: 'บันทึกเหตุการณ์', desc: 'ตั้งค่าห้อง Log สำหรับข้อความ สมาชิก ยศ ห้อง และกิจกรรม', category: 'พื้นฐาน' },
    { id: 'verify', title: 'ยืนยันตัวตน', desc: 'ตั้งค่าระบบยืนยันตัวตนและป้องกันไอดีอวตารเข้าเซิร์ฟเวอร์', category: 'สมาชิก' },
    { id: 'welcome', title: 'ต้อนรับสมาชิก', desc: 'ตั้งค่าข้อความต้อนรับและห้องแจ้งเตือนเมื่อมีคนเข้า', category: 'ข้อความ' },
    { id: 'leave', title: 'แจ้งสมาชิกออก', desc: 'ตั้งค่าข้อความเมื่อมีสมาชิกออกจากเซิร์ฟเวอร์', category: 'ข้อความ' },
    { id: 'ticket', title: 'ทิกเก็ต', desc: 'ตั้งค่าระบบทิกเก็ตและสร้างห้องช่วยเหลือสำหรับทีมงาน', category: 'ซัพพอร์ต' },
  ];

  return (
    <div className="relative min-h-screen bg-[#12131a] text-gray-200 font-sans selection:bg-pink-500 selection:text-white overflow-x-hidden">
      
      {/* 🌸 1. วางเอฟเฟกต์ซากุระไว้ใต้สุด */}
      <SakuraEffect />

      {/* 💻 2. ครอบเนื้อหาทั้งหมดด้วย z-10 เพื่อให้กดปุ่มได้จริง */}
      <div className="relative z-10 min-h-screen flex flex-col">
        
        {/* Navbar */}
        <nav className="bg-[#1a1b26]/80 backdrop-blur-md border-b border-gray-800 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('overview')}>
              <span className="text-2xl">🌸</span>
              <span className="font-bold text-xl tracking-wide bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                SAKURA PANEL
              </span>
            </div>
            <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-400">
              <button onClick={() => setActiveTab('overview')} className={`pb-1 transition ${activeTab === 'overview' ? 'text-pink-400 border-b-2 border-pink-400' : 'hover:text-gray-200'}`}>Dashboard</button>
              <a href="#games" className="hover:text-gray-200 transition">Games</a>
              <a href="#donate" className="hover:text-gray-200 transition">Donate</a>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-[#222436] px-3 py-1.5 rounded-full border border-gray-700">
              <div className="w-6 h-6 rounded-full bg-pink-500 flex items-center justify-center text-xs font-bold text-white">N</div>
              <span className="text-sm font-medium">NEXUS</span>
            </div>
          </div>
        </nav>

        <div className="flex flex-col md:flex-row flex-1">
          {/* Sidebar */}
          <aside className="w-full md:w-64 bg-[#161722]/90 backdrop-blur-sm p-4 border-r border-gray-800 flex flex-col gap-1">
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">เมนูหลัก</div>
            <button onClick={() => setActiveTab('overview')} className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition flex items-center gap-3 ${activeTab === 'overview' ? 'bg-gradient-to-r from-pink-500/20 to-purple-500/10 text-pink-400 border-l-4 border-pink-500 pl-3' : 'hover:bg-gray-800/55 text-gray-400'}`}>
              <span>📊</span> โมดูลทั้งหมด
            </button>
            
            <div className="px-3 py-2 mt-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">ระบบจัดการขั้นสูง</div>
            <button onClick={() => setActiveTab('moderation')} className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition flex items-center gap-3 ${activeTab === 'moderation' ? 'bg-gradient-to-r from-red-500/20 to-orange-500/10 text-red-400 border-l-4 border-red-500 pl-3' : 'hover:bg-gray-800/55 text-gray-400'}`}>
              <span>🛡️</span> เตะ / แบน / พักใช้งาน
            </button>
            <button onClick={() => setActiveTab('role-rewards')} className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition flex items-center gap-3 ${activeTab === 'role-rewards' ? 'bg-gradient-to-r from-purple-500/20 to-blue-500/10 text-purple-400 border-l-4 border-purple-500 pl-3' : 'hover:bg-gray-800/55 text-gray-400'}`}>
              <span>🏅</span> ระบบแจกยศเยอะๆ
            </button>
          </aside>

          {/* Workspace */}
          <main className="flex-1 p-6 md:p-8">
            {/* TAB: Overview */}
            {activeTab === 'overview' && (
              <div>
                <div className="mb-8">
                  <h1 className="text-2xl font-bold text-white mb-2">เมนูยอดนิยม</h1>
                  <p className="text-sm text-gray-400">เลือกโมดูลที่คุณต้องการตั้งค่าสำหรับเซิร์ฟเวอร์</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {modules.map((mod) => (
                    <div key={mod.id} className="bg-[#1a1b26]/90 border border-gray-800 rounded-2xl p-5 flex flex-col justify-between backdrop-blur-xs">
                      <div>
                        <span className="text-xs bg-[#222436] px-2.5 py-1 rounded text-gray-400">{mod.category}</span>
                        <h3 className="text-base font-semibold text-white mt-2 mb-1">{mod.title}</h3>
                        <p className="text-xs text-gray-400">{mod.desc}</p>
                      </div>
                      <div className="flex justify-end pt-4 mt-4 border-t border-gray-800">
                        <button type="button" className="text-xs font-semibold text-pink-400 bg-pink-500/10 px-4 py-2 rounded-xl hover:bg-pink-500/20 transition">ตั้งค่าระบบ</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: Moderation */}
            {activeTab === 'moderation' && (
              <div className="max-w-2xl bg-[#1a1b26]/90 border border-gray-800 rounded-2xl p-6 backdrop-blur-xs">
                <h2 className="text-xl font-bold text-white mb-2">🛡️ ระบบลงโทษสมาชิก (Kick / Ban / Timeout)</h2>
                <div className="space-y-4 mt-6">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5">User ID ของสมาชิก</label>
                    <input type="text" value={targetUser} onChange={(e) => setTargetUser(e.target.value)} placeholder="เช่น 459123456789012345" className="w-full bg-[#12131a] px-4 py-2.5 rounded-xl border border-gray-800 text-sm text-white focus:outline-none focus:border-pink-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5">รูปแบบการลงโทษ</label>
                    <div className="grid grid-cols-3 gap-3">
                      {['timeout', 'kick', 'ban'].map(action => (
                        <button key={action} type="button" onClick={() => setModAction(action)} className={`p-3 rounded-xl border text-xs font-medium uppercase transition ${modAction === action ? 'border-pink-500 text-pink-400 bg-pink-500/5' : 'bg-[#12131a] border-gray-800 text-gray-400 hover:bg-gray-800'}`}>
                          {action}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {modAction === 'timeout' && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1.5">ระยะเวลาการพักใช้งาน</label>
                      <select value={timeoutDuration} onChange={(e) => setTimeoutDuration(e.target.value)} className="w-full bg-[#12131a] px-4 py-2.5 rounded-xl border border-gray-800 text-sm text-white focus:outline-none focus:border-pink-500">
                        <option value="60">60 วินาที</option>
                        <option value="300">5 นาที</option>
                        <option value="3600">1 ชั่วโมง</option>
                        <option value="86400">1 วัน</option>
                        <option value="604800">1 สัปดาห์</option>
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5">เหตุผล</label>
