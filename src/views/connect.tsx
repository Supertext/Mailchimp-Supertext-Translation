import type { ErrorInfo } from '../i18n/error.js';
import { Layout, Notice, type PageContext } from './layout.js';

/** The start page without a session: what the app does and "Connect Mailchimp". */
export function ConnectPage(props: { ctx: PageContext; error?: ErrorInfo; notice?: 'denied' | 'disconnected'; configured: boolean }) {
  const { ctx } = props;
  const { t } = ctx;
  const heading = t.t('connect.heading');
  return (
    <Layout ctx={ctx} title={heading}>
      <section class="card connect">
        <h1>{heading}</h1>
        <p class="intro">{t.t('connect.intro')}</p>
        {props.notice === 'denied' && <Notice tone="warning">{t.t('connect.denied')}</Notice>}
        {props.notice === 'disconnected' && <Notice tone="success">{t.t('connect.disconnected')}</Notice>}
        {props.error && <Notice tone="error">{t.error(props.error)}</Notice>}
        {!props.configured && <Notice tone="error">{t.t('error.notConfigured')}</Notice>}
        <ol class="points">
          <li>{t.t('connect.point1')}</li>
          <li>{t.t('connect.point2')}</li>
          <li>{t.t('connect.point3')}</li>
        </ol>
        <div class="actions">
          <a class="button primary" href="/oauth/start" aria-disabled={props.configured ? undefined : 'true'}>
            {t.t('connect.button')}
          </a>
        </div>
        <p class="help">{t.t('connect.hint')}</p>
      </section>
    </Layout>
  );
}
