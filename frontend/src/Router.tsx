import { createBrowserRouter } from "react-router";
import App from "./App";
import LoginPage from "./pages/Login";
import ChatPage from "./pages/ChatPage";
import UserPage from "./pages/UserPage";
import Layout from "./component/Layout";
import ProtectedRoute from "./component/ProtectedRoute";
import SettingsPage from "./pages/SettingsPage";
import GroupsPage from "./pages/GroupsPage";
import AdminRoute from "./component/AdminRoute";
import { userLoader } from "./loader/userLoader";
import { groupLoader, layoutLoader } from "./loader/groupLoader";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
        element: <LoginPage />,
      },
      {
        element: <ProtectedRoute></ProtectedRoute>,
        children: [
          {
            element: <Layout></Layout>,
            loader: layoutLoader,
            id: "layout-data-loader",
            children:[
              {
                path: "chat", 
                element: <ChatPage></ChatPage>,
              },
              {
                element:<AdminRoute></AdminRoute>,
                children:[
                  {
                    path:"user",
                    element:<UserPage></UserPage>,
                    loader: userLoader
                  },
                  {
                    path:"groups",
                    element:<GroupsPage></GroupsPage>,
                    loader: groupLoader
                  },
                ]
              },
              {
                path:"settings",
                element:<SettingsPage></SettingsPage>
              }
            ]
          }
        ]
      }
    ] 
  },
]);