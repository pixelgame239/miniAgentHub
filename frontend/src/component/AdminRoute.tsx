// import {Navigate, Outlet} from "react-router"
// import { useAuth } from "../hooks/authHook";
// const AdminRoute = () =>{
//     const { user, loading } = useAuth();
//     if(loading) return <div>Loading...</div>;
//     return user?.userRole==="ADMIN"?<Outlet></Outlet> : <Navigate to="/chat" replace></Navigate>;
// }
// export default AdminRoute;