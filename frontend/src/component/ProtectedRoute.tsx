import {Navigate, Outlet} from "react-router"
import { useAuth } from "../hooks/authHook";
const ProtectedRoute = () =>{
    const { user, loading } = useAuth();
    if(loading) return <div>Loading...</div>;
    return user?<Outlet></Outlet> : <Navigate to="/" replace></Navigate>;
}
export default ProtectedRoute;