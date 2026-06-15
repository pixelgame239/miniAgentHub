import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { RouterProvider } from 'react-router'
import { router } from './Router.tsx'
import { AuthProvider } from './context/AuthContext.tsx'
import { ChatProvider } from './context/ChatContext.tsx'
import { NotificationPopupProvider } from './context/NotificationPopupContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <ChatProvider>
        <NotificationPopupProvider>
          <RouterProvider router={router}></RouterProvider>
        </NotificationPopupProvider>
      </ChatProvider>
    </AuthProvider>
  </StrictMode>,
)
