import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

// Định nghĩa kiểu dữ liệu rõ ràng cho từng thành phần
interface PopupState {
  isOpen: boolean;
  message: string;
  type: "success" | "error";
}

interface ToastState {
  isOpen: boolean;
  message: string;
  type: "success" | "error";
}

interface NotificationPopupContextType {
  popup: PopupState;
  toast: ToastState;
  showPopup: (message: string, type: "success" | "error") => void;
  showToast: (message: string, type: "success" | "error") => void;
  closePopup: () => void;
  closeToast: () => void;
  // Giữ lại các hàm cũ để tránh lỗi compile nếu code cũ chưa refactor kịp
  showError: (message: string) => void;
  showInfo: (message: string) => void;
}

const NotificationPopupContext = createContext<NotificationPopupContextType | undefined>(undefined);

export const NotificationPopupProvider = ({ children }: { children: ReactNode }) => {
  // Quản lý trạng thái Popup tập trung
  const [popup, setPopup] = useState<PopupState>({
    isOpen: false,
    message: "",
    type: "success",
  });

  // Quản lý trạng thái Toast tập trung
  const [toast, setToast] = useState<ToastState>({
    isOpen: false,
    message: "",
    type: "success",
  });

  // Hàm mở Popup linh hoạt (Success hoặc Error)
  const showPopup = useCallback((message: string, type: "success" | "error") => {
    setPopup({ isOpen: true, message, type });
  }, []);

  // Hàm mở Toast linh hoạt (Success hoặc Error)
  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ isOpen: true, message, type });
  }, []);

  const closePopup = useCallback(() => {
    setPopup((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const closeToast = useCallback(() => {
    setToast((prev) => ({ ...prev, isOpen: false }));
  }, []);

  // --- Tương thích ngược với code cũ của bạn ---
  const showError = useCallback((message: string) => {
    showPopup(message, "error");
  }, [showPopup]);

  const showInfo = useCallback((message: string) => {
    showPopup(message, "success");
  }, [showPopup]);

  return (
    <NotificationPopupContext.Provider 
      value={{ 
        popup, 
        toast, 
        showPopup, 
        showToast, 
        closePopup, 
        closeToast,
        showError,
        showInfo
      }}
    >
      {children}
    </NotificationPopupContext.Provider>
  );
};

export const useNotificationPopup = () => {
  const context = useContext(NotificationPopupContext);
  if (!context) {
    throw new Error("useNotificationPopup must be used within an NotificationPopupProvider");
  }
  return context;
};