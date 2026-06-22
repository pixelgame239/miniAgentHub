import type { LoaderFunction } from "react-router";
import { getSharedConversation } from "../api/shareApi";

export const sharedLoader: LoaderFunction = async ({ params }) => {
  const { shareId } = params; // Sửa từ sharedId thành shareId theo cấu trúc Router
  
  if (!shareId) {
    throw new Error("Missing shareId parameter");
  }
  
  const { data, error } = await getSharedConversation(shareId); 
  if (error) {
    console.error("Failed to fetch shared conversation:", error);
    throw new Error("Failed to fetch shared conversation");
  }
  
  if (data) {
    return data; // Dữ liệu này sẽ được useLoaderData() ở Component đón nhận
  }
  return null;
};