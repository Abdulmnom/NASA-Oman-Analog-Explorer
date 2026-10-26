import { useI18n } from '../i18n';
import { DATA_SOURCES } from '../lib/sources';

export default function Sources() {
  const { t, loc } = useI18n();
  return (
    <div className="page prose">
      <h1>{t('sources.title')}</h1>
      <p className="lead">{t('sources.intro')}</p>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>{t('sources.colDataset')}</th>
              <th>{t('sources.colBody')}</th>
              <th>{t('sources.colUse')}</th>
              <th>{t('sources.colRes')}</th>
              <th>{t('sources.colProvider')}</th>
            </tr>
          </thead>
          <tbody>
            {DATA_SOURCES.map((d) => (
              <tr key={d.id}>
                <td><a href={d.url} target="_blank" rel="noreferrer">{d.name}</a></td>
                <td className="nowrap"><span className={`dot ${d.body}`} /> {t(`body.${d.body}`)}</td>
                <td>{loc(d.use)}</td>
                <td className="nowrap" dir="ltr">{d.resolution}</td>
                <td>{d.provider}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h2>{t('sources.mapsTitle')}</h2>
      <p>{t('sources.mapsText')}</p>
      <h2>{t('sources.teamTitle')}</h2>
      <p>{t('sources.team')}</p>
    </div>
  );
}
