import {Navigate, Outlet} from "react-router"
import { useAuth } from "../hooks/authHook";
import InitResetPassword from "../pages/InitResetPassword";
const ProtectedRoute = () =>{
    const { user, loading } = useAuth();
    if(loading) return <div>Loading...</div>;
    console.log(user);
    return user? user.active === true? <Outlet></Outlet>: <InitResetPassword></InitResetPassword> : <Navigate to="/" replace></Navigate>;
}
export default ProtectedRoute;