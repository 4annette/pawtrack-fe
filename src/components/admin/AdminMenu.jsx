import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Users, FileText, ShieldCheck, BarChart3, LayoutGrid } from "lucide-react";

const AdminMenu = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const menuItems = [
        { icon: Users, label: 'user_management_title', path: '/admin/users', color: 'text-indigo-600' },
        { icon: FileText, label: 'reports_management_title', path: '/admin/reports', color: 'text-orange-500' },
        { icon: ShieldCheck, label: 'verification_management_title', path: '/admin/verifications', color: 'text-blue-600' },
        { icon: BarChart3, label: 'statistics_title', path: '/admin/statistics', color: 'text-emerald-600' },
    ];

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`p-2.5 rounded-full transition-all flex items-center justify-center ${isOpen
                    ? 'bg-emerald-50 text-emerald-600 shadow-sm'
                    : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50'
                    }`}
                title="Admin Tools"
            >
                <LayoutGrid className="w-5 h-5" />
            </button>

            {isOpen && (
                <div className="fixed md:absolute top-16 md:top-full right-4 md:right-0 mt-2 md:mt-3 w-[calc(100vw-32px)] md:w-64 bg-white border border-gray-100 shadow-2xl rounded-[2rem] z-[999] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-4 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">Management</p>
                        <button onClick={() => setIsOpen(false)} className="md:hidden p-1 text-gray-400">
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="p-2 max-h-[70vh] overflow-y-auto">
                        {menuItems.map((item) => {
                            const isActive = location.pathname === item.path;
                            return (
                                <button
                                    key={item.path}
                                    onClick={() => {
                                        if (!isActive) {
                                            navigate(item.path);
                                            setIsOpen(false);
                                        }
                                    }}
                                    className={`w-full flex items-center gap-4 px-4 py-4 md:py-3 rounded-2xl transition-colors group text-left ${isActive
                                            ? 'bg-emerald-50/50 cursor-default pointer-events-none opacity-80'
                                            : 'hover:bg-gray-50'
                                        }`}
                                >
                                    <div className={`p-2 rounded-xl bg-white shadow-sm border border-gray-50 ${!isActive && 'group-hover:scale-110'} transition-transform`}>
                                        <item.icon className={`w-5 h-5 ${isActive ? 'text-emerald-600' : item.color}`} />
                                    </div>
                                    <span className={`text-sm font-bold ${isActive ? 'text-emerald-900' : 'text-gray-700 group-hover:text-gray-900'}`}>
                                        {t(item.label) || item.label.replace(/_/g, ' ')}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminMenu;