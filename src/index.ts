import m from 'mithril';
import MiniSearch from 'minisearch';
import { AsyncGunzip, strFromU8 } from 'fflate';
import { Header } from './components/Header.ts';
import { SearchBar } from './components/SearchBar.ts';
import { ResultsGrid } from './components/Results.ts';
import { ProgressSpinner } from './components/ProgressSpinner.ts';
import './styles/General.scss';

export const appleUA = /(iPhone|iPad|Macintosh)/i.test(navigator.userAgent);
const mobileSafariUA = /(?!.*FxiOS)(iPhone|iPad).*Mobile.*Safari/i.test(navigator.userAgent);

// #region Service Worker Registration
if ('serviceWorker' in navigator) {
    try {
        navigator.serviceWorker.register('/service-worker.js');
    } catch (e) {
        console.error(`Registration failed with ${e}`);
    }
}
// #endregion

// #region Subtitle Loading
const loadFromGitHub: boolean = !(window.location.hostname === 'localhost');
const subtitlesURL: string = loadFromGitHub ? 'https://media.githubusercontent.com/media/Bergbok/Jerma-Subtitle-Search/refs/heads/main/public/assets/SubtitleIndex.json.gzip' : '/assets/SubtitleIndex.json.gzip';

let loadingValue: number = 0;
let loadingLimit: number = 1000;
let loadingState: string = '';

export let subtitles: MiniSearch;
export let subtitlesLoaded: boolean = false;

async function loadSubtitles(url: string) {
    let startingTime = performance.now();
    let text = '';

    const response = await fetch(url);

    if (!response.body) {
        throw new Error('Response body is null');
    }

    const contentLengthHeader = response.headers.get('Content-Length');
    [loadingLimit, loadingState] = [contentLengthHeader ? +contentLengthHeader : 0, 'Downloading'];

    // would prefer to use DecompressionStream, but only seemed to work on dev server
    // fails on prod with: JSON.parse: unterminated string at inconsistent position
    // if you can determine what's wrong with this, please open a PR:
    // --------------------------------------------------------------
    // const gzipDecompressionStream = new DecompressionStream('gzip');
    // const responseData = new Response(new Blob(chunks).stream().pipeThrough(gzipDecompressionStream));
    // const text = await responseData.text();

    const gzipDecompressionStream = new AsyncGunzip((err, chunk, final) => {
        if (err) {
            throw err;
        }
        if (chunk) {
            text += strFromU8(chunk)
        }
        if (final) {
            console.debug(`Subtitles loaded in ${((performance.now() - startingTime) / 1000).toFixed(2)} seconds.`);
            parseSubtitles(text);
        }
    });

    const reader = response.body.getReader();

    while (true) {
        const { done, value } = await reader.read();
        if (done) {
            gzipDecompressionStream.push(new Uint8Array(), true);
            break;
        }
        loadingValue += value.length;
        gzipDecompressionStream.push(value);
        m.redraw();
    }

    async function parseSubtitles(text: string) {
        startingTime = performance.now();

        [loadingValue, loadingLimit, loadingState] = [0, 0, 'Parsing subtitles'];
        m.redraw();
        
        let storedSyncLoadingPreference = localStorage.getItem('synchronous-loading');
        if (storedSyncLoadingPreference === 'true') {
            await new Promise(resolve => setTimeout(resolve, 500));
            subtitles = MiniSearch.loadJSON(text, {
                autoVacuum: false,
                fields: ['subtitles'],
                idField: 'id',
                searchOptions: { fields: ['subtitles'] },
                storeFields: ['id', 'title', 'duration', 'thumbnail', 'upload_date', 'stream_title', 'stream_date', 'subtitles']
            });
        } else {
            subtitles = await MiniSearch.loadJSONAsync(text, {
                autoVacuum: false,
                fields: ['subtitles'],
                idField: 'id',
                searchOptions: { fields: ['subtitles'] },
                storeFields: ['id', 'title', 'duration', 'thumbnail', 'upload_date', 'stream_title', 'stream_date', 'subtitles']
            });
        }

        subtitlesLoaded = true;
        m.redraw();

        (window as any).subtitles = subtitles;

        console.debug(`Subtitles parsed in ${((performance.now() - startingTime) / 1000).toFixed(2)} seconds.`);
    }
}

loadSubtitles(subtitlesURL).catch(e => {
    console.error(`Failed to load subtitles: ${e}`);
    [loadingLimit, loadingState] = [0, 'Error encountered :('];
    m.redraw();
});
// #endregion

// https://mithril.js.org/route.html#routing-strategies
// hashbang or querystring is needed when hosted using GitHub Pages
m.route.prefix = '?';

m.route(document.body, '/', {
    '/': {
        view: () => {
            return m('div', [
                m(Header),
                m('div#page-container', [
                    m(SearchBar),
                    subtitlesLoaded ? null : m(ProgressSpinner, { value: loadingValue, limit: loadingLimit, phase: loadingState }),
                    m('div#page-info', [
                        m('section', [
                            m('h1', 'Welcome'),
                            !subtitlesLoaded && mobileSafariUA ? m('h2', [
                                    'Seems like you\'re using Safari. If the site crashes you should try ',
                                    m('a', { href: 'https://apps.apple.com/us/app/firefox-private-safe-browser/id989804926' }, 'Firefox'),
                                    ' and closing all other apps.'
                                ]) : null,
                            m('p', 'This webpage lets you search through transcriptions of all Jerma\'s main channel videos, archived streams and more.')
                        ]),
                        subtitlesLoaded ?
                            m('section', [
                                m('h2', 'Index statistics'),
                                m('p', `Loaded ${subtitles.documentCount} video\'s subtitles, containing ${subtitles.termCount} unique terms.`),
                            ]) : null,
                    ])
                ])
            ]);
        }
    },
    '/gongo': {
        view: () => {
            return m('img.full-page', { src: '/assets/images/omo.avif', alt: 'color changing cat staring into your soul' });
        }
    },
    '/:query': {
        view: () => {
            return m('div', [
                m(Header),
                m('div#page-container', [
                    m(SearchBar),
                    subtitlesLoaded ? null : m(ProgressSpinner, { value: loadingValue, limit: loadingLimit, phase: loadingState }),
                    !subtitlesLoaded ? 
                        m('div#page-info', [
                            m('section', [
                                m('h1', 'Welcome'),
                                mobileSafariUA ? m('h2', [
                                        'Seems like you\'re using Safari. If the site crashes you should try ',
                                        m('a', { href: 'https://apps.apple.com/us/app/firefox-private-safe-browser/id989804926' }, 'Firefox'),
                                        ' and closing all other apps.'
                                    ]) : null,
                                m('p', 'This webpage lets you search through transcriptions of all Jerma\'s main channel videos, archived streams and more.')
                            ]),
                        ]) : null,
                    m(ResultsGrid, { query: m.route.param('query') || '' })
                ])
            ]);
        }
    },
});
