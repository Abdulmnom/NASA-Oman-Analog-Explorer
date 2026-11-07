import { Link } from 'react-router-dom';
import { useI18n } from '../i18n';

/** Challenge statement, how each part is answered, team, AI disclosure, licence and glossary. */
export default function About() {
  const { t, tl } = useI18n();
  const rows = tl('about.rows') as unknown as [string, string, 'done' | 'partial' | 'notyet'][];
  const glossary = tl('about.glossary') as unknown as [string, string][];
  const counts = rows.reduce<Record<string, number>>((acc, r) => ({ ...acc, [r[2]]: (acc[r[2]] ?? 0) + 1 }), {});

  return (
    <div className="page about">
      <h1>{t('about.title')}</h1>

      <section className="panel challenge-box">
        <h2>{t('about.challengeTitle')}</h2>
        <p className="challenge-name">{t('home.kicker')}</p>
        <p>{t('about.challengeText')}</p>
      </section>

      <h2>{t('about.mapTitle')}</h2>
      <p className="status-summary">
        <span className="status done">{t('about.done')} · {counts.done ?? 0}</span>
        <span className="status partial">{t('about.partial')} · {counts.partial ?? 0}</span>
        <span className="status notyet">{t('about.notyet')} · {counts.notyet ?? 0}</span>
      </p>
      <div className="table-wrap">
        <table className="table challenge-map">
          <thead>
            <tr>
              <th>{t('about.colAsk')}</th>
              <th>{t('about.colWhere')}</th>
              <th>{t('about.colStatus')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([ask, where, status]) => (
              <tr key={ask}>
                <td>{ask}</td>
                <td className="muted">{where}</td>
                <td>
                  <span className={`status ${status}`}>{t(`about.${status}`)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid two about-cols">
        <section className="panel">
          <h2>{t('about.teamTitle')}</h2>
          <p>{t('home.footerTeam')}</p>
          <p className="muted small">{t('home.footerBuilt')}</p>
          <Link to="/present" className="btn primary small">
            {t('about.presentLink')}
          </Link>
        </section>
        <section className="panel">
          <h2>{t('about.aiTitle')}</h2>
          <p className="small">{t('about.aiText')}</p>
          <h2>{t('about.licenseTitle')}</h2>
          <p className="small">{t('about.licenseText')}</p>
        </section>
      </div>

      <h2>{t('about.glossaryTitle')}</h2>
      <dl className="glossary">
        {glossary.map(([term, def]) => (
          <div key={term}>
            <dt>{term}</dt>
            <dd>{def}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
