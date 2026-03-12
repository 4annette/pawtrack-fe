import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { X, Check, HelpCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { fetchLostReportById, markLostReportAsFound } from "@/services/api";

const ReminderModal = ({ notification, onClose }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!notification) return;

    if (!notification.lostReportId) {
      console.error("Notification is missing lostReportId:", notification);
      setError(t('reminder_modal_final_err_id'));
      setLoading(false);
      return;
    }

    const loadReport = async () => {
      try {
        const data = await fetchLostReportById(notification.lostReportId);

        if (data.found) {
          toast.info(t('reminder_modal_final_err_found'));
          onClose(); 
          return;
        }

        setReport(data);
        setLoading(false); 
      } catch (error) {
        console.error("Failed to load report", error);
        setError(t('reminder_modal_final_err_load'));
        setLoading(false);
      }
    };
    loadReport();
  }, [notification, onClose, t]);

  const handleYes = async () => {
    if (!notification.lostReportId) return;
    try {
      await markLostReportAsFound(notification.lostReportId);
      toast.success(t('reminder_modal_final_success_msg'));
      onClose();
    } catch (error) {
      console.error(error);
      toast.error(t('reminder_modal_final_err_update'));
    }
  };

  if (!notification || loading) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-emerald-900/40 backdrop-blur-md p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden flex flex-col ring-4 ring-emerald-50/50"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-emerald-600 p-5 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/30 rounded-xl backdrop-blur-sm">
              <HelpCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-black text-lg tracking-tight">{t('reminder_modal_final_title')}</h2>
              <p className="text-xs text-emerald-100 opacity-90">{t('reminder_modal_final_subtitle')}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-emerald-500 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 text-center space-y-6">

          {error ? (
            <div className="py-4 flex flex-col items-center gap-2 text-red-500">
              <AlertTriangle className="w-8 h-8" />
              <p className="font-bold text-sm">{error}</p>
              <p className="text-xs text-gray-400">Notification ID: {notification.notificationId}</p>
            </div>
          ) : (
            <>
              {report?.imageUrl && (
                <div className="w-32 h-32 mx-auto rounded-full border-4 border-emerald-100 shadow-sm overflow-hidden relative group">
                  <img src={report.imageUrl} alt="Pet" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                </div>
              )}

              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-gray-800 leading-tight">
                  {t('reminder_modal_final_question', { name: report?.title || t('reminder_modal_final_default_pet') })}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto">
                  {t('reminder_modal_final_desc')}
                </p>
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <button
                  onClick={handleYes}
                  className="w-full py-4 rounded-2xl bg-emerald-600 text-white font-bold text-sm uppercase tracking-widest shadow-lg shadow-emerald-200 hover:bg-emerald-700 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                >
                  <Check className="w-5 h-5" /> {t('reminder_modal_final_yes_btn')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ReminderModal;