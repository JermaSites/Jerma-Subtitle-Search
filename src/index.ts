import m from 'mithril';
import MiniSearch from 'minisearch';
import { AsyncGunzip, strFromU8 } from 'fflate';
import { Header } from './components/Header.ts';
import { SearchBar } from './components/SearchBar.ts';
import { Results } from './components/Results.ts';
import { ProgressSpinner } from './components/ProgressSpinner.ts';
import { changeSetting } from './components/Settings.ts';
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
const subtitlesURL: string = window.location.hostname === 'localhost'
    ? '/assets/SubtitleIndex.json.gzip'
    : 'https://subtitlefiles.jerma.io/file/jerma-subtitles/SubtitleIndex.json.gzip';

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
    loadingLimit = contentLengthHeader ? +contentLengthHeader : 0
    loadingState = response.headers.get('Intercepted-By-Service-Worker') === 'true' ? 'Using cached index' : 'Downloading';

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

        const minisearchOptions = {
            autoVacuum: false,
            fields: ['subtitles'],
            idField: 'id',
            searchOptions: { fields: ['subtitles'] },
            storeFields: ['id', 'title', 'duration', 'thumbnail', 'upload_date', 'stream_title', 'stream_date', 'subtitle_filename', 'subtitles']
        }

        let storedSyncLoadingPreference = localStorage.getItem('synchronous-loading');
        if (storedSyncLoadingPreference === 'true') {
            await new Promise(resolve => setTimeout(resolve, 500));
            subtitles = MiniSearch.loadJSON(text, minisearchOptions);
        } else {
            subtitles = await MiniSearch.loadJSONAsync(text, minisearchOptions);
        }

        subtitlesLoaded = true;
        m.redraw();

        (window as any).subtitles = subtitles;

        console.debug(`Subtitles parsed in ${((performance.now() - startingTime) / 1000).toFixed(2)} seconds.`);
    }
};

loadSubtitles(subtitlesURL).catch(e => {
    console.error(`Failed to load subtitles: ${e}`);
    [loadingLimit, loadingState] = [0, 'Error encountered :('];
    m.redraw();
});
// #endregion

const Page = () => {
    return {
        view: () => {
            const searchQuery = m.route.param('query') ? m.route.param('query').replace(/-/g, ' ').trim() : '';
            return [
                m(Header),
                m('div#page-container', [
                    m(SearchBar, {
                        query: searchQuery
                    }),
                    !subtitlesLoaded &&
                        m(ProgressSpinner, {
                            limit: loadingLimit,
                            phase: loadingState,
                            value: loadingValue
                        }),
                    (!searchQuery || !subtitlesLoaded) &&
                        m('div#page-info', [
                            m('section', [
                                m('h1', 'Welcome'),
                                (!subtitlesLoaded && mobileSafariUA) &&
                                    m('h2', [
                                        'Seems like you\'re using Safari. If the site crashes you should try ',
                                        m('a', {
                                            href: 'https://apps.apple.com/us/app/firefox-private-safe-browser/id989804926'
                                        }, 'Firefox'),
                                        ' and closing all other apps.'
                                    ]),
                                m('p', 'This page lets you search through transcriptions of all Jerma\'s main channel videos, archived streams and more.')
                            ]),
                            subtitlesLoaded && m('section', [
                                m('h2', 'Index statistics'),
                                m('p', `Loaded ${subtitles.documentCount} video's subtitles containing ${subtitles.termCount} unique terms.`),
                            ]),
                        ]),
                    searchQuery &&
                        m(Results, {
                            query: searchQuery
                        })
                ])
            ];
        }
    };
};

// https://mithril.js.org/route.html#routing-strategies
// hashbang or querystring is needed when hosted using GitHub Pages
m.route.prefix = '?';

m.route(document.body, '/', {
    '/': {
        view: () => m(Page)
    },
    '/:query': {
        view: () => m(Page)
    }
});

window.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.altKey && e.key.toLowerCase() === 'w') {
        e.preventDefault();
        changeSetting('use-word-boundaries', (!(localStorage.getItem('use-word-boundaries') === 'true')).toString());
        m.redraw();
    }

    if (e.altKey && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        const searchBar = document.querySelector('input[name="searchQuery"]') as HTMLInputElement;
        if (searchBar) {
            searchBar.focus();
        }
    }
});
