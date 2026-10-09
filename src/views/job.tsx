import type { Translator } from '../i18n/index.js';
import { campaignUrl } from '../mailchimp/client.js';
import type { Job, JobItem } from '../store/store.js';
import { jobTotals } from '../translation/jobs.js';
import { languageName } from '../translation/languages.js';

/** Progress and results of a translation job (rendered on the server, refreshed by polling). */
export function JobPanel(props: { t: Translator; job: Job; dc: string }) {
  const { t, job, dc } = props;
  const totals = jobTotals(job);
  return (
    <div class="card job">
      <h2>
        {t.t('job.heading')}: {job.campaignTitle || job.campaignId}
      </h2>
      <p class="muted">{t.t(job.trigger === 'folder' ? 'job.trigger.folder' : 'job.trigger.app')}</p>
      {job.status === 'running' && (
        <p class="progress" role="status">
          <span class="spinner" aria-hidden="true"></span>
          {t.t('job.running', {
            campaign: job.campaignTitle || job.campaignId,
            completed: job.items.length,
            total: job.languages.length,
          })}
        </p>
      )}
      {job.status === 'done' && (
        <div class={`notice ${totals.failed > 0 ? 'warning' : 'success'}`}>{t.t('job.done', totals)}</div>
      )}
      {job.status === 'failed' && job.error && (
        <div class="notice error">{t.t('job.failed', { reason: t.error(job.error) })}</div>
      )}
      {job.items.length > 0 && (
        <table class="results">
          <tbody>
            {job.items.map((item) => (
              <tr>
                <td class="title">{languageName(item.language, t.locale)}</td>
                <td>
                  <ItemResult t={t} item={item} />
                </td>
                <td class="link">
                  {item.state !== 'failed' && campaignUrl(dc, item.webId) && (
                    <a href={campaignUrl(dc, item.webId)} target="_blank" rel="noopener">
                      {t.t('job.open')}
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {job.status === 'done' && job.originalLimited === true && <p class="help">{t.t('job.originalLimited')}</p>}
      {job.status === 'done' && job.originalLimited === false && <p class="help">{t.t('job.originalNotLimited')}</p>}
    </div>
  );
}

function ItemResult(props: { t: Translator; item: JobItem }) {
  const { t, item } = props;
  if (item.state === 'failed') {
    return <span class="result failed">{item.error ? t.error(item.error) : ''}</span>;
  }
  const notes = [
    item.notes?.includes('segmentNotCombined') ? t.t('job.segmentNotCombined') : '',
    item.notes?.includes('html') ? t.t('job.htmlOnly') : '',
  ].filter(Boolean);
  return (
    <span class={`result ${item.state}`}>
      {t.t(`job.${item.state}`)}
      {notes.map((note) => (
        <span class="note">{note}</span>
      ))}
    </span>
  );
}

/** The last translations, newest first (folder and app). */
export function History(props: { t: Translator; jobs: Job[] }) {
  const { t, jobs } = props;
  const date = new Intl.DateTimeFormat(t.locale, { dateStyle: 'medium', timeStyle: 'short' });
  return (
    <section class="card history">
      <h2>{t.t('history.heading')}</h2>
      {jobs.length === 0 ? (
        <p class="muted">{t.t('history.empty')}</p>
      ) : (
        <table class="results">
          <tbody>
            {jobs.map((job) => {
              const totals = jobTotals(job);
              return (
                <tr>
                  <td class="when">{date.format(new Date(job.createdAt))}</td>
                  <td class="title">{job.campaignTitle || job.campaignId}</td>
                  <td>{job.languages.map((code) => code.toUpperCase()).join(', ')}</td>
                  <td class="muted">{t.t(job.trigger === 'folder' ? 'job.trigger.folder' : 'job.trigger.app')}</td>
                  <td>
                    {job.status === 'running' ? (
                      <span class="spinner" aria-hidden="true"></span>
                    ) : job.status === 'failed' && job.error ? (
                      <span class="result failed">{t.error(job.error)}</span>
                    ) : (
                      <span class={totals.failed > 0 ? 'result failed' : 'result created'}>{t.t('job.done', totals)}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </section>
  );
}
