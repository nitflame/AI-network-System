import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Layout() {
  return (
    <div className="flex w-full h-full bg-bg-primary overflow-hidden">
      <Sidebar />
      <main className="flex-1 min-w-0 h-full overflow-y-auto px-5 py-4">
        <Outlet />
      </main>
    </div>
  );
}
