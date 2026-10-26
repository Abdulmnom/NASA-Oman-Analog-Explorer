import { HashRouter, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import { useI18n } from './i18n';
import { useDataState } from './lib/data';
import Compare from './pages/Compare';
import Explorer from './pages/Explorer';
import Home from './pages/Home';
import Methodology from './pages/Methodology';
import SiteDetail from './pages/SiteDetail';
import Sources from './pages/Sources';

export default function App() {
  const state = useDataState();
  const { t } = useI18n();

  if (state.status === 'loading') return <div className="center-msg">{t('app.loading')}</div>;
  if (state.status === 'error') return <div className="center-msg error">{t('app.loadError')}</div>;

  // HashRouter: static hosting (GitHub Pages / Firebase) needs no rewrite rules.
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="explorer" element={<Explorer />} />
          <Route path="site/:id" element={<SiteDetail />} />
          <Route path="compare" element={<Compare />} />
          <Route path="methodology" element={<Methodology />} />
          <Route path="sources" element={<Sources />} />
          <Route path="*" element={<Home />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
