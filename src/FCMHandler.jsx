import { useEffect } from "react";
import { messaging } from "./firebase/firebaseInitialization";
import { onMessage } from "firebase/messaging";
import { toast } from "sonner";

const FCMHandler = () => {
  useEffect(() => {
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log("Foreground Message received: ", payload);

      const { title, fromUserName, lostReportTitle } = payload.data || {};

      const customTitle = title || "🔔 Potential Match Found";

      let customBody;
      if (fromUserName && lostReportTitle) {
        customBody = `Good news! ${fromUserName} might have found the pet from your report "${lostReportTitle}".`;
      } else {
        customBody = "Good news might someone have found your pet";
      }

      toast.success(customTitle, {
        description: customBody,
        duration: 5000,
      });

      if (Notification.permission === "granted") {
        try {
          new Notification(customTitle, { 
            body: customBody,
            icon: "/paw-icon.png", 
            silent: false, 
          });
        } catch (e) {
          console.error("System notification error:", e);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  return null; 
};

export default FCMHandler;