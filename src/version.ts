import { readFileSync } from 'node:fs';

/** The app version from package.json (the release workflow's version file), read once. */
export const VERSION: string = (() => {
  try {
    const url = new URL('../package.json', import.meta.url);
    return (JSON.parse(readFileSync(url, 'utf8')) as { version?: string }).version ?? '';
  } catch {
    return '';
  }
})();

export const REPOSITORY = 'https://github.com/Supertext/Mailchimp-Supertext-Translation';

/** Link to the GitHub release of an X.Y.Z version, else to the releases list. */
export const releaseUrl = (version: string = VERSION): string =>
  /^\d+\.\d+\.\d+$/.test(version) ? `${REPOSITORY}/releases/tag/v${version}` : `${REPOSITORY}/releases`;
