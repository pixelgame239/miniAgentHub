const MouseTracker = ({ render }) => {
  const [coords, setCoords] = React.useState({ x: 0, y: 0 });

  React.useEffect(() => {
    const handleMouseMove = (e) => setCoords({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return render(coords); 
};
const useMousePosition = () => {
  const [coords, setCoords] = React.useState({ x: 0, y: 0 });

  React.useEffect(() => {
    const handleMouseMove = (e) => setCoords({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return coords; 
};
const App = () => {
    //Render props
//  return  <MouseTracker render={({ x, y }) => (
//     <h1>Tọa độ chuột: {x}, {y}</h1>
//   )} />
  //custom Hook
  const { x, y } = useMousePosition();
  return <h1>Tọa độ chuột: {x}, {y}</h1>
};