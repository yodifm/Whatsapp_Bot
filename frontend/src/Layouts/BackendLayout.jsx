import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/hooks/useNotifications';
import { useState } from 'react';

const NAV_ITEMS = [
    { to: '/', label: 'Dashboard', icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
    )},
    { to: '/form-bookings', label: 'Form Booking', icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
    )},
    { to: '/upload-frame', label: 'Upload Frame', icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
    )},
    { to: '/sales', label: 'Sales', icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    )},
    { to: '/logistics', label: 'Logistik', icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
    )},
    { to: '/packages', label: 'Paket', icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
    )},
    { to: '/bookings', label: 'Kalender', icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
    )},
    { to: '/broadcast', label: 'Broadcast', icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
        </svg>
    )},
    { to: '/analytics', label: 'Analytics', icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
    )},
    { to: '/gallery', label: 'Galeri', icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
    )},
    { to: '/discounts', label: 'Diskon', icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
    )},
    { to: '/faqs', label: 'FAQ', icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    )},
    { to: '/test-ai', label: 'Test AI', icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
    )},
    { to: '/kiosks', label: 'Kiosks', icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
    )},
    { to: '/settings', label: 'Settings', icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
    )},
];

export default function BackendLayout({ children }) {
    const { user, logout }  = useAuth();
    const location          = useLocation();
    const navigate          = useNavigate();
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [notifGranted, setNotifGranted] = useState(
        typeof Notification !== 'undefined' && Notification.permission === 'granted'
    );

    const { requestPermission } = useNotifications({ enabled: notifGranted });

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const handleEnableNotif = async () => {
        const granted = await requestPermission();
        setNotifGranted(granted);
    };

    const initials = user?.name
        ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
        : 'A';

    const SidebarContent = ({ mobile = false }) => (
        <div className="flex flex-col h-full">
            {/* Brand */}
            <div className={`flex items-center gap-3 px-4 py-5 ${collapsed && !mobile ? 'justify-center px-0' : ''}`}>
                <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-lg flex-shrink-0">📸</div>
                {(!collapsed || mobile) && (
                    <div>
                        <p className="font-bold text-gray-900 text-sm leading-tight">Poonya Bot</p>
                        <p className="text-[10px] text-gray-400">Photobooth Manager</p>
                    </div>
                )}
            </div>

            <div className="px-3 mb-2">
                <div className="h-px bg-gray-100" />
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
                {NAV_ITEMS.map(item => {
                    const active = location.pathname === item.to;
                    return (
                        <Link key={item.to} to={item.to}
                            onClick={() => mobile && setMobileOpen(false)}
                            title={collapsed && !mobile ? item.label : undefined}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group
                                ${active
                                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                                }
                                ${collapsed && !mobile ? 'justify-center px-2' : ''}
                            `}>
                            <span className={`flex-shrink-0 ${active ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'}`}>
                                {item.icon}
                            </span>
                            {(!collapsed || mobile) && <span>{item.label}</span>}
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom user section */}
            <div className="px-3 py-4 border-t border-gray-100 space-y-2">
                {/* Notif bell */}
                <button onClick={handleEnableNotif}
                    title={notifGranted ? 'Notifikasi aktif' : 'Aktifkan notifikasi'}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                        ${notifGranted ? 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}
                        ${collapsed && !mobile ? 'justify-center px-2' : ''}
                    `}>
                    {notifGranted ? (
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                    ) : (
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.73 21a2 2 0 01-3.46 0M18.63 13A17.888 17.888 0 0118 8M6.26 6.26A5.86 5.86 0 006 8c0 7-3 9-3 9h14M18 8a6 6 0 00-9.33-4.99M3 3l18 18" />
                        </svg>
                    )}
                    {(!collapsed || mobile) && (
                        <span>{notifGranted ? 'Notifikasi aktif' : 'Notifikasi'}</span>
                    )}
                </button>

                {/* User info */}
                <div className={`flex items-center gap-3 px-3 py-2 ${collapsed && !mobile ? 'justify-center' : ''}`}>
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold flex-shrink-0">
                        {initials}
                    </div>
                    {(!collapsed || mobile) && (
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
                            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                        </div>
                    )}
                </div>

                {/* Logout */}
                <button onClick={handleLogout}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all
                        ${collapsed && !mobile ? 'justify-center px-2' : ''}
                    `}>
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    {(!collapsed || mobile) && <span>Logout</span>}
                </button>
            </div>
        </div>
    );

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">

            {/* Desktop Sidebar */}
            <aside className={`hidden lg:flex flex-col bg-white border-r border-gray-100 transition-all duration-300 flex-shrink-0
                ${collapsed ? 'w-16' : 'w-56'}`}>
                {/* Collapse toggle */}
                <button onClick={() => setCollapsed(c => !c)}
                    className="absolute left-0 mt-16 ml-[calc(var(--sidebar-w)-12px)] z-10 hidden lg:flex w-6 h-6 bg-white border border-gray-200 rounded-full items-center justify-center shadow-sm hover:bg-gray-50 transition"
                    style={{ '--sidebar-w': collapsed ? '64px' : '224px', marginLeft: collapsed ? '52px' : '212px' }}>
                    <svg className={`w-3 h-3 text-gray-500 transition-transform ${collapsed ? 'rotate-180' : ''}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <SidebarContent />
            </aside>

            {/* Mobile overlay */}
            {mobileOpen && (
                <div className="fixed inset-0 z-40 lg:hidden">
                    <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
                    <aside className="absolute left-0 top-0 bottom-0 w-64 bg-white shadow-xl z-50">
                        <SidebarContent mobile />
                    </aside>
                </div>
            )}

            {/* Main content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Mobile topbar */}
                <header className="lg:hidden bg-white border-b border-gray-100 h-14 flex items-center gap-3 px-4 flex-shrink-0">
                    <button onClick={() => setMobileOpen(true)}
                        className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition">
                        <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center text-sm">📸</div>
                        <span className="font-bold text-gray-900 text-sm">Poonya Bot</span>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
