import type { Account } from '../store/store.js';
import { folderName } from '../translation/folders.js';
import { LANGUAGE_CODES, LANGUAGES, languageName } from '../translation/languages.js';
import { releaseUrl, VERSION } from '../version.js';
import { ApiKeyHelp, Layout, Notice, splitTemplate, type PageContext } from './layout.js';

export interface SettingsPageProps {
  ctx: PageContext;
  account: Account;
  /** A key is set on the server (SUPERTEXT_API_KEY). */
  serverKey: boolean;
  saved?: boolean;
  invalidCodes?: string;
  foldersError?: string;
  bothOff?: boolean;
}

export function SettingsPage(props: SettingsPageProps) {
  const { ctx, account } = props;
  const { t } = ctx;
  const heading = t.t('settings.heading');
  const [versionBefore, versionAfter] = splitTemplate(t.t('settings.about.version'), ['{version}']);
  const [accountBefore, accountAfter] = splitTemplate(t.t('settings.connection.account'), ['{account}']);
  const example = account.targets[0] ?? 'de';
  const [foldersBefore, foldersAfter] = splitTemplate(t.t('settings.start.foldersHint'), ['{folder}']);
  const exampleFolder = folderName({ ...account, folderLocale: t.locale }, example);
  // Chosen languages first, in their order; then all others by name.
  const others = LANGUAGE_CODES.filter((code) => !account.targets.includes(code)).sort((a, b) =>
    languageName(a, t.locale).localeCompare(languageName(b, t.locale), t.locale),
  );
  const ordered = [...account.targets.filter((code) => code in LANGUAGES), ...others];

  return (
    <Layout ctx={ctx} title={heading}>
      <h1>{heading}</h1>
      {props.saved && !props.invalidCodes && !props.foldersError && !props.bothOff && (
        <Notice tone="success">{t.t('settings.saved')}</Notice>
      )}
      {props.invalidCodes && <Notice tone="warning">{t.t('settings.invalidCodes', { codes: props.invalidCodes })}</Notice>}
      {props.foldersError && <Notice tone="warning">{t.t('settings.foldersFailed', { reason: props.foldersError })}</Notice>}
      {props.bothOff && <Notice tone="warning">{t.t('settings.start.none')}</Notice>}

      <form method="post" action="/settings" class="settings">
        <input type="hidden" name="csrf" value={ctx.csrf} />

        <section class="card">
          <h2>{t.t('settings.apiKey.heading')}</h2>
          <label class="field">
            <span>{t.t('settings.apiKey.label')}</span>
            <input
              type="password"
              name="apiKey"
              autocomplete="off"
              placeholder={account.apiKey ? t.t('settings.apiKey.placeholderSaved') : t.t('settings.apiKey.placeholder')}
            />
          </label>
          <ApiKeyHelp t={t} />
          {!account.apiKey && props.serverKey && <p class="muted">{t.t('settings.apiKey.server')}</p>}
          {account.apiKey && (
            <label class="inline">
              <input type="checkbox" name="removeKey" value="1" />
              {t.t('settings.apiKey.remove')}
            </label>
          )}
          <div class="actions">
            <button type="button" id="test-button" data-testing={t.t('settings.testing')}>
              {t.t('settings.test')}
            </button>
            <span id="test-result" role="status"></span>
          </div>
        </section>

        <section class="card">
          <h2>{t.t('settings.languages.heading')}</h2>
          <p class="help">{t.t('settings.languages.text')}</p>
          <label class="field">
            <span>{t.t('settings.languages.source')}</span>
            <select name="sourceLanguage">
              <option value="" selected={!account.sourceLanguage}>
                {t.t('settings.languages.auto')}
              </option>
              {[...LANGUAGE_CODES]
                .sort((a, b) => languageName(a, t.locale).localeCompare(languageName(b, t.locale), t.locale))
                .map((code) => (
                  <option value={code} selected={account.sourceLanguage === code}>
                    {languageName(code, t.locale)}
                  </option>
                ))}
            </select>
          </label>
          <h3>{t.t('settings.languages.targets')}</h3>
          <p class="help">{t.t('settings.languages.codeHint')}</p>
          <table class="codes" id="targets">
            <thead>
              <tr>
                <th></th>
                <th></th>
                <th>{t.t('settings.languages.code')}</th>
              </tr>
            </thead>
            <tbody>
              {ordered.map((code) => {
                const chosen = account.targets.includes(code);
                return (
                  <tr class={chosen ? 'chosen' : 'other'}>
                    <td class="check">
                      <input type="checkbox" name="target" value={code} id={`t-${code}`} checked={chosen} />
                    </td>
                    <td>
                      <label for={`t-${code}`}>{languageName(code, t.locale)}</label>
                    </td>
                    <td>
                      <input
                        name={`code:${code}`}
                        value={account.languageCodes[code] ?? ''}
                        placeholder={LANGUAGES[code]}
                        size={10}
                        aria-label={`${t.t('settings.languages.code')}: ${languageName(code, t.locale)}`}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        <section class="card">
          <h2>{t.t('settings.start.heading')}</h2>
          <label class="inline strong">
            <input type="checkbox" name="folderTrigger" value="1" checked={account.folderTrigger} />
            {t.t('settings.start.folders')}
          </label>
          <p class="help">
            {foldersBefore}
            <strong>{exampleFolder}</strong>
            {foldersAfter}
          </p>
          <p class="help warning-text">{t.t('settings.start.foldersWarning')}</p>
          <label class="inline strong">
            <input type="checkbox" name="appTrigger" value="1" checked={account.appTrigger} />
            {t.t('settings.start.app')}
          </label>
          <p class="help">{t.t('settings.start.appHint')}</p>
        </section>

        <section class="card">
          <h2>{t.t('settings.audience.heading')}</h2>
          <label class="inline">
            <input type="checkbox" name="limitOriginal" value="1" checked={account.limitOriginal} />
            {t.t('settings.audience.limit')}
          </label>
          <p class="help">{t.t('settings.audience.limitHint')}</p>
        </section>

        <section class="card">
          <h2>{t.t('settings.style.heading')}</h2>
          <label class="field">
            <span>{t.t('settings.style.label')}</span>
            <select name="tone">
              {(['default', 'more', 'less'] as const).map((tone) => (
                <option value={tone} selected={account.tone === tone}>
                  {t.t(`settings.style.${tone}`)}
                </option>
              ))}
            </select>
          </label>
        </section>

        <div class="actions">
          <button type="submit" class="primary">
            {t.t('settings.save')}
          </button>
        </div>
      </form>

      <section class="card connection">
        <h2>{t.t('settings.connection.heading')}</h2>
        <p>
          {accountBefore}
          <strong>{account.accountName || account.accountId}</strong>
          {/\.$/.test(account.accountName) && accountAfter.startsWith('.') ? accountAfter.slice(1) : accountAfter}
        </p>
        <form method="post" action="/disconnect" id="disconnect-form" data-confirm={t.t('settings.connection.confirm')}>
          <input type="hidden" name="csrf" value={ctx.csrf} />
          <button type="submit" class="danger">
            {t.t('settings.connection.disconnect')}
          </button>
        </form>
        <p class="help">{t.t('settings.connection.disconnectHint')}</p>
      </section>

      <section class="card about">
        <h2>{t.t('settings.about.heading')}</h2>
        <p>
          {versionBefore}
          <a href={releaseUrl()} target="_blank" rel="noopener">
            {VERSION || '?'}
          </a>
          {versionAfter}
        </p>
      </section>
    </Layout>
  );
}
