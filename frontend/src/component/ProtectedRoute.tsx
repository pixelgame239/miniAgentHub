import {Navigate, Outlet} from "react-router"
import { useAuth } from "../hooks/authHook";
import InitResetPassword from "../pages/InitResetPassword";
import InitAPIKey from "../pages/InitAPIKey";
const ProtectedRoute = () =>{
    const { user, loading } = useAuth();
    if(loading) return <div>Loading...</div>;
    console.log(user);
    if(!user) return <Navigate to="/" replace></Navigate>;
    if(user.active === false) return <InitResetPassword></InitResetPassword>;
    if(!localStorage.getItem("APIKey")||localStorage.getItem("APIKey") === "null") return <InitAPIKey></InitAPIKey>;
    return <Outlet></Outlet>;
}
export default ProtectedRoute;