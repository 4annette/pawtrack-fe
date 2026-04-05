import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Building2,
    LayoutDashboard,
    Users,
    Settings,
    X
} from "lucide-react";
import { useTranslation } from "react-i18next";

const OrganizationMenu = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
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
        {
            label: t('org_dashboard') || "Control Center",
            icon: LayoutDashboard,
            path: "/organization/dashboard",
            desc: "Overview & Analytics"
        },
        {
            label: t('staff_management') || "Staff & Members",
            icon: Users,
            path: "/organization/staff",
            desc: "Manage team access"
        },
    ];

    const handleNavigate = (path) => {
        navigate(path);
        setIsOpen(false);
    };

    return (
        <div className="relative flex items-center" ref={menuRef}>
            <button
                onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
                title={t('organization') || "Organization"}
                className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 ${isOpen
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                        : 'text-indigo-400 hover:bg-indigo-50 hover:text-indigo-600'
                    }`}
            >
                <Building2 className="w-5 h-5" />
            </button>

            {isOpen && (
                <>
                    <div className="md:hidden fixed inset-0 bg-black/5 z-[4999]" onClick={() => setIsOpen(false)} />

                    <div className="
                        absolute top-full right-0 mt-3 
                        w-[85vw] sm:w-64 
                        bg-white border border-indigo-50 shadow-2xl rounded-[1.5rem] 
                        p-2 z-[5000] 
                        animate-in fade-in zoom-in-95 duration-200 
                        origin-top-right
                        fixed md:absolute
                        left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0
                    ">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50 mb-1">
                            <p className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.2em]">Management</p>
                            <button onClick={() => setIsOpen(false)} className="md:hidden p-1 text-gray-400">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-1">
                            {menuItems.map((item) => (
                                <button
                                    key={item.path}
                                    onClick={(e) => { e.stopPropagation(); handleNavigate(item.path); }}
                                    className="w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all hover:bg-indigo-50 active:bg-indigo-100 group"
                                >
                                    <div className="p-2 bg-indigo-50 rounded-lg group-hover:bg-white transition-colors flex-shrink-0">
                                        <item.icon className="w-4 h-4 text-indigo-600" />
                                    </div>
                                    <div className="flex flex-col text-left overflow-hidden">
                                        <span className="text-xs font-black text-gray-800 uppercase tracking-tight truncate">{item.label}</span>
                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter truncate">{item.desc}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default OrganizationMenu;