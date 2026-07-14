import { Outlet } from 'react-router';
import "./i18n";
import Toast from './component/Toast';
import { useNotificationPopup } from './context/NotificationPopupContext';
import NotificationPopup from './component/NotificationPopup';

function App() {
  const { toast, closeToast, popup, closePopup } = useNotificationPopup();
  return (
    <div style={{
      // backgroundColor: '#0b0f14', // Nên đổi thành màu nền tối trùng với var(--bg-primary) của bạn
      // height: '100svh',           // Ép cứng bằng kích thước màn hình thực tế (Small Viewport Height)
      // width: '100%',              // Dùng 100% thay vì 100vw để tránh lỗi thanh cuộn
      // color: 'white',
      // display: 'flex',            // Biến App thành một Flex Container
      // flexDirection: 'column',
      // overflow: 'hidden'          // Chặn tuyệt đối không cho cuộn ở tầng App tổng
    }}>
      {/* Bỏ thẻ <main> ở đây đi vì trong Layout.tsx của bạn đã có thẻ <main> rồi */}
      <Outlet />
      <Toast 
        isOpen={toast.isOpen} 
        message={toast.message} 
        type={toast.type} 
        onClose={closeToast} 
      />
      <NotificationPopup 
        isOpen={popup.isOpen}
        message={popup.message}
        type={popup.type}
        onClose={closePopup} 
      />
    </div>
  );
}

export default App;