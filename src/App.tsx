import { HashRouter, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { Icon, type IconName } from './components/icons';
import ClassPage from './pages/ClassPage';
import EditorPage from './pages/EditorPage';
import ImportPage from './pages/ImportPage';
import LibraryPage from './pages/LibraryPage';
import ListPage from './pages/ListPage';
import PrintPage from './pages/PrintPage';

// HashRouter: 서버 설정 없이 어디에 배포해도 새로고침/공유 링크가 동작
export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<WithNav><ListPage /></WithNav>} />
        <Route path="/poses" element={<WithNav><LibraryPage /></WithNav>} />
        <Route path="/s/:id" element={<EditorPage />} />
        <Route path="/s/:id/class" element={<ClassPage />} />
        <Route path="/s/:id/print" element={<PrintPage />} />
        <Route path="/import" element={<ImportPage />} />
        <Route path="*" element={<WithNav><ListPage /></WithNav>} />
      </Routes>
    </HashRouter>
  );
}

function WithNav({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto min-h-dvh max-w-2xl pb-24">
      {children}
      <BottomNav />
    </div>
  );
}

function BottomNav() {
  const { pathname } = useLocation();
  const tabs: { to: string; label: string; icon: IconName }[] = [
    { to: '/', label: '시퀀스', icon: 'list' },
    { to: '/poses', label: '포즈', icon: 'book' },
  ];
  return (
    <nav className="no-print pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-stone-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-2xl">
        {tabs.map((t) => {
          const active = t.to === '/' ? pathname === '/' : pathname.startsWith(t.to);
          return (
            <NavLink key={t.to} to={t.to} className={`flex flex-1 flex-col items-center gap-0.5 pt-2 text-xs ${active ? 'text-sage-700' : 'text-stone-400'}`}>
              <Icon name={t.icon} className="size-6" />
              {t.label}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
