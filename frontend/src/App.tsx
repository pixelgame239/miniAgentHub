import { Outlet } from 'react-router';

function App() {
  return (
    <div style={{
      backgroundColor: '#3b3b3b', // Màu xám đen
      minHeight: '100vh', 
      minWidth:"100vw",
      color: 'white'
      }}>
    <main>
      <Outlet></Outlet>
    </main>
    </div>
  );
}

export default App;
