import { useEffect } from "react";
import { messaging } from "./firebase/firebaseInitialization";
import { onMessage } from "firebase/messaging";
import { toast } from "sonner";

const FCMHandler = () => {
  useEffect(() => {
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log("Foreground Message received: ", payload);

      const { title, fromUserName, type } = payload.data || {};

      let defaultTitle = "PawTrack Notification";
      let customBody = "You have a new notification.";

      switch (type) {
        case 'LOST_REPORT_NOTIFICATION':
          defaultTitle = "Potential Match Found";
          customBody = `${fromUserName || 'Someone'} might have found your pet!`;
          break;
        case 'FOUND_REPORT_NOTIFICATION':
          defaultTitle = "Potential Owner Found";
          customBody = `Possible owner match: ${fromUserName || 'Someone'} lost a pet similar to the one you found.`;
          break;
        case 'FOUND_REPORT_NOTIFICATION_CONNECTED_FOUND':
          defaultTitle = "Sighting Match";
          customBody = `You and ${fromUserName || 'someone'} may have sighted the same pet.`;
          break;
        default:
          if (fromUserName) {
            customBody = `New notification from ${fromUserName}`;
          }
          break;
      }

      const finalTitle = title || defaultTitle;

      toast.success(finalTitle, {
        description: customBody,
        duration: 5000,
      });

      if (Notification.permission === "granted") {
        try {
          new Notification(finalTitle, { 
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