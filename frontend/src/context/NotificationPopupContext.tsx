import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

interface NotificationPopupContextType {
  error: boolean;
  info: boolean;
  errorMessage: string;
  infoMessage: string;
  showError: (message: string) => void;
  showInfo: (message: string) => void;
  closePopup: () => void;
}

const NotificationPopupContext = createContext<NotificationPopupContextType | undefined>(undefined);

interface NotificationPopupProviderProps {
  children: ReactNode;
}

export const NotificationPopupProvider = ({ children }: NotificationPopupProviderProps) => {
  const [error, setError] = useState(false);
  const [info, setInfo] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [infoMessage, setInfoMessage] = useState("");

  const resetPopup = useCallback(() => {
    setError(false);
    setInfo(false);
    setErrorMessage("");
    setInfoMessage("");
  }, []);

  const showError = useCallback((message: string) => {
    resetPopup();
    setError(true);
    setErrorMessage(message);
  }, [resetPopup]);

  const showInfo = useCallback((message: string) => {
    resetPopup();
    setInfo(true);
    setInfoMessage(message);
  }, [resetPopup]);

  const closePopup = useCallback(() => {
    resetPopup();
  }, [resetPopup]);

  return (
    <NotificationPopupContext.Provider value={{ error, info, errorMessage, infoMessage, showError, showInfo, closePopup }}>
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
