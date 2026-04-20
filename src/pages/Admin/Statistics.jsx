import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
    Loader2, Users, Map as MapIcon, BarChart3,
    CheckCircle2, AlertCircle, FileText,
    TrendingUp, Calendar, Share2, ClipboardCheck, ChevronDown, Filter
} from "lucide-react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from "recharts";
import { MapContainer, TileLayer } from "react-leaflet";
import { HeatmapLayer } from "react-leaflet-heatmap-layer-v3";
import "leaflet/dist/leaflet.css";
import { toast } from "sonner";
import { fetchAdminStatistics } from "@/services/api";
import Header from "@/pages/Header";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

const VERIFICATION_COLORS = {
    APPROVED: "#10b981",
    PENDING: "#10b981",
    REJECTED: "#ef4444"
};

const CustomSelect = ({ value, onChange, options, label }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectedOption = options.find(opt => opt.value === value);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between min-w-[80px] md:min-w-[100px] text-[9px] md:text-[10px] font-black uppercase bg-white border border-gray-200 rounded-xl px-2 md:px-3 py-1 md:py-1.5 shadow-sm hover:border-indigo-300 transition-all focus:ring-2 focus:ring-indigo-100"
            >
                <span className="truncate">{selectedOption ? selectedOption.label : label}</span>
                <ChevronDown className={`w-3 h-3 ml-1 md:ml-2 text-gray-400 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-1 w-full min-w-[110px] md:min-w-[120px] bg-white border border-gray-100 rounded-2xl shadow-2xl z-[999] py-1 animate-in fade-in zoom-in duration-150">
                    <div className="max-h-60 overflow-y-auto p-1">
                        {options.map((opt) => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => {
                                    onChange(opt.value);
                                    setIsOpen(false);
                                }}
                                className={`w-full text-left px-3 py-2 text-[10px] font-black uppercase rounded-lg transition-colors hover:bg-indigo-50 ${value === opt.value ? 'text-indigo-600 bg-indigo-50/50' : 'text-gray-600'
                                    }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const StatCard = ({ title, value, icon: Icon, gradient }) => (
    <div className="bg-white p-4 md:p-6 rounded-3xl md:rounded-[2rem] border border-gray-100 shadow-soft flex items-center gap-3 md:gap-4 transition-all hover:scale-[1.02]">
        <div className={`p-3 md:p-4 rounded-xl md:rounded-2xl bg-gradient-to-br ${gradient} text-white shadow-lg`}>
            <Icon className="w-5 h-5 md:w-6 md:h-6" />
        </div>
        <div className="min-w-0">
            <p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-gray-400 mb-0.5 truncate">{title}</p>
            <h3 className="text-lg md:text-2xl font-black text-gray-900 leading-none">{value}</h3>
        </div>
    </div>
);

const ChartFilter = ({ year, setYear, month, setMonth }) => {
    const { t, i18n } = useTranslation();
    const currentYear = new Date().getFullYear();

    const yearOptions = [currentYear, currentYear - 1].map(y => ({
        value: y,
        label: y.toString()
    }));

    const monthOptions = useMemo(() => {
        const lang = i18n.language || 'el';
        return [
            { value: "ALL", label: t('all') || 'ALL' },
            ...[...Array(12)].map((_, i) => ({
                value: i + 1,
                label: new Date(currentYear, i, 1).toLocaleString(lang, { month: 'short' }).toUpperCase()
            }))
        ];
    }, [t, i18n.language, currentYear]);

    return (
        <div className="flex items-center gap-1 md:gap-2 bg-gray-100/50 p-1 md:p-1.5 rounded-xl md:rounded-2xl border border-gray-100">
            <CustomSelect
                value={year}
                onChange={(val) => setYear(parseInt(val))}
                options={yearOptions}
            />

            {setMonth && (
                <>
                    <div className="w-px h-3 md:h-4 bg-gray-200 mx-0.5 md:mx-1" />
                    <CustomSelect
                        value={month}
                        onChange={setMonth}
                        options={monthOptions}
                    />
                </>
            )}
        </div>
    );
};

const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const RADIAN = Math.PI / 180;
    const radius = outerRadius * 0.6;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
        <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-[8px] md:text-[10px] font-black">
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};

const Statistics = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const logoMenuRef = useRef(null);

    const currentYear = new Date().getFullYear();
    const [reportsYear, setReportsYear] = useState(currentYear);
    const [reportsMonth, setReportsMonth] = useState("ALL");
    const [usersYear, setUsersYear] = useState(currentYear);
    const [usersMonth, setUsersMonth] = useState("ALL");
    const [verificationsYear, setVerificationsYear] = useState(currentYear);
    const [verificationsMonth, setVerificationsMonth] = useState("ALL");
    
    const [heatmapType, setHeatmapType] = useState("ALL");

    useEffect(() => {
        loadStats();
    }, [reportsYear, usersYear, verificationsYear]);

    const loadStats = async () => {
        setLoading(true);
        try {
            const data = await fetchAdminStatistics({
                yearOfMonthlyReportsStats: reportsYear,
                yearOfMonthlyUserStats: usersYear,
                yearOfMonthlyOrgReqStats: verificationsYear
            });
            setStats(data);
        } catch (error) {
            toast.error(t('load_stats_failed'));
        } finally {
            setLoading(false);
        }
    };

    const heatmapPoints = useMemo(() => {
        if (!stats) return [];
        const lost = (stats.lostHeatmapLocations || []).map(l => [l.lat, l.lng, 100]);
        const found = (stats.foundHeatmapLocations || []).map(f => [f.lat, f.lng, 100]);
        
        if (heatmapType === "LOST") return lost;
        if (heatmapType === "FOUND") return found;
        return [...lost, ...found];
    }, [stats, heatmapType]);

    const filterByMonth = (dataArray, selectedMonth) => {
        if (!dataArray) return [];
        if (selectedMonth === "ALL") return dataArray;
        return dataArray.filter(item => item.month === parseInt(selectedMonth));
    };

    const monthlyReportData = useMemo(() => {
        if (!stats) return [];
        const lang = i18n.language || 'el';
        const combined = [];
        for (let i = 1; i <= 12; i++) {
            const lost = stats.monthlyLostStats?.find(s => s.month === i)?.count || 0;
            const found = stats.monthlyFoundStats?.find(s => s.month === i)?.count || 0;
            combined.push({
                name: new Date(currentYear, i - 1, 1).toLocaleString(lang, { month: 'short' }).toUpperCase(),
                lost,
                found,
                month: i
            });
        }
        return filterByMonth(combined, reportsMonth);
    }, [stats, reportsMonth, i18n.language, currentYear]);

    const monthlyUserData = useMemo(() => {
        if (!stats?.monthlyUserStats) return [];
        const lang = i18n.language || 'el';
        const formatted = stats.monthlyUserStats.map(s => ({
            name: new Date(currentYear, s.month - 1, 1).toLocaleString(lang, { month: 'short' }).toUpperCase(),
            userCount: s.userCount,
            organizationCount: s.organizationCount,
            totalCount: s.totalCount,
            month: s.month
        }));
        return filterByMonth(formatted, usersMonth);
    }, [stats, usersMonth, i18n.language, currentYear]);

    const monthlyVerificationData = useMemo(() => {
        if (!stats) return [];
        const lang = i18n.language || 'el';
        const formatted = [];
        for (let i = 1; i <= 12; i++) {
            const entry = stats.monthlyOrgVerificationReqStats?.find(s => s.month === i);
            formatted.push({
                name: new Date(currentYear, i - 1, 1).toLocaleString(lang, { month: 'short' }).toUpperCase(),
                count: entry ? entry.count : 0,
                month: i
            });
        }
        return filterByMonth(formatted, verificationsMonth);
    }, [stats, verificationsMonth, i18n.language, currentYear]);

    if (loading && !stats) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-4">
                <Loader2 className="w-10 h-10 md:w-12 md:h-12 text-emerald-500 animate-spin" />
                <p className="font-black uppercase text-[10px] md:text-xs tracking-widest text-gray-400 text-center">{t('loading_data')}</p>
            </div>
        );
    }

    if (!stats) return null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 font-sans text-gray-900">
            <Header
                showNav={false}
                isAdmin={true}
                isMobileMenuOpen={isMobileMenuOpen}
                setIsMobileMenuOpen={setIsMobileMenuOpen}
                logoMenuRef={logoMenuRef}
            />

            <main className="w-full px-4 py-6 md:py-8 space-y-6 md:space-y-8 relative z-0">
                <div className="mb-2 md:mb-4">
                    <h1 className="text-xl md:text-3xl font-black text-gray-900 flex items-center gap-2 md:gap-3">
                        <BarChart3 className="w-6 h-6 md:w-8 md:h-8 text-emerald-600" />
                        {t('statistics_analytics')}
                    </h1>
                    <p className="text-gray-500 mt-1 md:mt-2 font-black uppercase text-[8px] md:text-[10px] tracking-widest">{t('database_control_center')}</p>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                    <StatCard title={t('active_users')} value={stats.activeUsers} icon={Users} gradient="from-blue-500 to-indigo-600" />
                    <StatCard title={t('success_rate')} value={`${stats.successRate}%`} icon={TrendingUp} gradient="from-emerald-400 to-teal-600" />
                    <StatCard title={t('lost_reports_total')} value={stats.lostReports} icon={AlertCircle} gradient="from-orange-400 to-red-500" />
                    <StatCard title={t('found_reports_total')} value={stats.foundReports} icon={CheckCircle2} gradient="from-emerald-500 to-emerald-700" />
                    <StatCard title={t('lost_resolved')} value={stats.foundedLostReports} icon={FileText} gradient="from-orange-300 to-orange-500" />
                    <StatCard title={t('found_resolved')} value={stats.foundedFoundReports} icon={FileText} gradient="from-teal-300 to-teal-500" />
                    <StatCard title={t('found_to_lost')} value={stats.totalConnectionsFoundToLost} icon={Share2} gradient="from-indigo-400 to-indigo-600" />
                    <StatCard title={t('found_to_found')} value={stats.totalConnectionsFoundToFound} icon={Share2} gradient="from-purple-400 to-purple-600" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                    <div className="bg-white p-5 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border border-gray-100 shadow-xl min-h-[400px]">
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6 md:mb-8">
                            <h3 className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                <BarChart3 className="w-4 h-4 text-indigo-600" /> {t('monthly_activity')}
                            </h3>
                            <ChartFilter
                                year={reportsYear} setYear={setReportsYear}
                                month={reportsMonth} setMonth={setReportsMonth}
                            />
                        </div>
                        <div className="h-[250px] md:h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={monthlyReportData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 800 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 800 }} />
                                    <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', fontSize: '11px' }} />
                                    <Legend align="right" verticalAlign="top" iconType="circle" wrapperStyle={{ paddingBottom: '10px', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }} />
                                    <Bar dataKey="found" name={t('found')} fill="#10b981" radius={[4, 4, 0, 0]} barSize={reportsMonth === 'ALL' ? 12 : 40} />
                                    <Bar dataKey="lost" name={t('lost')} fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={reportsMonth === 'ALL' ? 12 : 40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-white p-5 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border border-gray-100 shadow-xl min-h-[400px]">
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6 md:mb-8">
                            <h3 className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                <Users className="w-4 h-4 text-blue-600" /> {t('registrations_by_type')}
                            </h3>
                            <ChartFilter
                                year={usersYear} setYear={setUsersYear}
                                month={usersMonth} setMonth={setUsersMonth}
                            />
                        </div>
                        <div className="h-[250px] md:h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={monthlyUserData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 800 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 800 }} />
                                    <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', fontSize: '11px' }} />
                                    <Legend
                                        align="right"
                                        verticalAlign="top"
                                        iconType="circle"
                                        wrapperStyle={{ paddingBottom: '10px', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }}
                                        payload={[
                                            { value: t('users'), type: 'circle', color: '#3b82f6' },
                                            { value: t('organizations'), type: 'circle', color: '#10b981' },
                                            { value: t('total'), type: 'circle', color: '#8b5cf6' }
                                        ]}
                                    />
                                    <Bar dataKey="userCount" name={t('users')} fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={usersMonth === 'ALL' ? 10 : 30} />
                                    <Bar dataKey="organizationCount" name={t('organizations')} fill="#10b981" radius={[4, 4, 0, 0]} barSize={usersMonth === 'ALL' ? 10 : 30} />
                                    <Bar dataKey="totalCount" name={t('total')} fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={usersMonth === 'ALL' ? 10 : 30} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                    <div className="bg-white p-5 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border border-gray-100 shadow-xl min-h-[400px]">
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6 md:mb-8">
                            <h3 className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                <ClipboardCheck className="w-4 h-4 text-emerald-600" /> {t('monthly_verification_requests')}
                            </h3>
                            <ChartFilter
                                year={verificationsYear} setYear={setVerificationsYear}
                                month={verificationsMonth} setMonth={setVerificationsMonth}
                            />
                        </div>
                        <div className="h-[250px] md:h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={monthlyVerificationData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 800 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 800 }} />
                                    <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', fontSize: '12px' }} />
                                    <Legend align="right" verticalAlign="top" iconType="circle" wrapperStyle={{ paddingBottom: '10px', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }} />
                                    <Bar dataKey="count" name={t('requests')} fill="#10b981" radius={[4, 4, 0, 0]} barSize={verificationsMonth === 'ALL' ? 20 : 60} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-[1.5rem] md:rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden min-h-[350px]">
                        <div className="p-3 md:p-4 flex justify-between items-center">
                            <h3 className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                <MapIcon className="w-4 h-4 text-indigo-600" /> {t('incident_geographic_distribution')}
                            </h3>
                            <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-xl border border-gray-100">
                                <CustomSelect 
                                    value={heatmapType} 
                                    onChange={setHeatmapType} 
                                    options={[
                                        { value: "ALL", label: t('all') },
                                        { value: "LOST", label: t('lost') },
                                        { value: "FOUND", label: t('found') }
                                    ]} 
                                />
                            </div>
                        </div>
                        <div className="h-[250px] md:h-[312px] rounded-[1.2rem] md:rounded-[2rem] overflow-hidden border border-gray-50 mx-2 mb-2">
                            <MapContainer center={[37.9838, 23.7275]} zoom={6} className="w-full h-full z-10">
                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                <HeatmapLayer
                                    points={heatmapPoints}
                                    longitudeExtractor={m => m[1]}
                                    latitudeExtractor={m => m[0]}
                                    intensityExtractor={m => m[2]}
                                    radius={40}
                                    blur={30}
                                    max={100}
                                    minOpacity={0.4}
                                    gradient={heatmapType === "LOST" ? { 0.4: 'orange', 1.0: 'red' } : heatmapType === "FOUND" ? { 0.4: 'cyan', 1.0: 'green' } : { 0.4: 'blue', 0.6: 'cyan', 0.7: 'lime', 0.8: 'yellow', 1.0: 'red' }}
                                />
                            </MapContainer>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 pb-10">
                    <div className="bg-white p-6 rounded-[1.5rem] md:rounded-[2.5rem] border border-gray-100 shadow-xl">
                        <h3 className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 md:mb-6 text-center">{t('user_distribution')}</h3>
                        <div className="h-[220px] md:h-[250px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={stats.userDistribution || []}
                                        innerRadius={0}
                                        outerRadius={70}
                                        dataKey="count" nameKey="role"
                                        label={renderCustomizedLabel}
                                        labelLine={false}
                                    >
                                        {(stats.userDistribution || []).map((entry, i) => {
                                            let color = COLORS[i % COLORS.length];
                                            if (entry.role === 'ORGANIZATIONS') color = "#10b981";
                                            if (entry.role === 'USER') color = "#3b82f6";
                                            return <Cell key={i} fill={color} stroke="none" />;
                                        })}
                                    </Pie>
                                    <Tooltip formatter={(value, name) => [value, t(name.toLowerCase())]} />
                                    <Legend
                                        verticalAlign="bottom" align="center" layout="horizontal"
                                        formatter={(value) => t(value.toLowerCase())}
                                        wrapperStyle={{ paddingTop: '15px', fontSize: '8px', fontWeight: 800, textTransform: 'uppercase' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-[1.5rem] md:rounded-[2.5rem] border border-gray-100 shadow-xl">
                        <h3 className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 md:mb-6 text-center">{t('popular_species_lost')}</h3>
                        <div className="h-[220px] md:h-[250px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={stats.speciesLostStats || []}
                                        innerRadius={0}
                                        outerRadius={70}
                                        dataKey="count" nameKey="species"
                                        label={renderCustomizedLabel}
                                        labelLine={false}
                                    >
                                        {(stats.speciesLostStats || []).map((_, i) => <Cell key={i} fill={COLORS[(i + 2) % COLORS.length]} stroke="none" />)}
                                    </Pie>
                                    <Tooltip formatter={(value, name) => [value, t(name.toLowerCase())]} />
                                    <Legend
                                        verticalAlign="bottom" align="center" layout="horizontal"
                                        formatter={(value) => t(value.toLowerCase())}
                                        wrapperStyle={{ paddingTop: '15px', fontSize: '8px', fontWeight: 800, textTransform: 'uppercase' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-[1.5rem] md:rounded-[2.5rem] border border-gray-100 shadow-xl">
                        <h3 className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 md:mb-6 text-center">{t('popular_species_found')}</h3>
                        <div className="h-[220px] md:h-[250px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={stats.speciesFoundStats || []}
                                        innerRadius={0}
                                        outerRadius={70}
                                        dataKey="count" nameKey="species"
                                        label={renderCustomizedLabel}
                                        labelLine={false}
                                    >
                                        {(stats.speciesFoundStats || []).map((_, i) => <Cell key={i} fill={COLORS[(i + 3) % COLORS.length]} stroke="none" />)}
                                    </Pie>
                                    <Tooltip formatter={(value, name) => [value, t(name.toLowerCase())]} />
                                    <Legend
                                        verticalAlign="bottom" align="center" layout="horizontal"
                                        formatter={(value) => t(value.toLowerCase())}
                                        wrapperStyle={{ paddingTop: '15px', fontSize: '8px', fontWeight: 800, textTransform: 'uppercase' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-[1.5rem] md:rounded-[2.5rem] border border-gray-100 shadow-xl">
                        <h3 className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 md:mb-6 text-center">{t('verification_status')}</h3>
                        <div className="h-[220px] md:h-[250px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={stats.orgVerificReqStats || []}
                                        innerRadius={0}
                                        outerRadius={70}
                                        dataKey="count" nameKey="status"
                                        label={renderCustomizedLabel}
                                        labelLine={false}
                                    >
                                        {(stats.orgVerificReqStats || []).map((entry, i) => {
                                            const normalizedStatus = entry.status ? entry.status.trim().toUpperCase() : '';
                                            const color = VERIFICATION_COLORS[normalizedStatus] || COLORS[i % COLORS.length];
                                            return <Cell key={i} fill={color} stroke="none" />;
                                        })}
                                    </Pie>
                                    <Tooltip formatter={(value, name) => [value, t(name.toLowerCase())]} />
                                    <Legend
                                        verticalAlign="bottom" align="center" layout="horizontal"
                                        formatter={(value) => t(value.toLowerCase())}
                                        wrapperStyle={{ paddingTop: '15px', fontSize: '8px', fontWeight: 800, textTransform: 'uppercase' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Statistics;