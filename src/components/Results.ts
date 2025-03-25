import m, { type Vnode } from 'mithril';
import { Secrets } from './Secrets.ts';
import type { SearchResult } from 'minisearch';
import { subtitles, subtitlesLoaded } from '../index.ts';
import '../styles/Results.scss';

let queryRegex: RegExp;
let useWordBoundaries: boolean;
let latestPlayedVideoID: string;
const expandState: Record<string, boolean> = {};

function debounce(func: Function, delay: number) {
    let timeoutId: ReturnType<typeof setTimeout>;

    return (...args: any[]) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), delay);
    };
};

function formatTimestamp(timestamp: string): string {
    const [minutes, seconds] = timestamp.split(':').map(Number);
    let totalSeconds = Math.floor(minutes * 60 + seconds);
    const hours = Math.floor(totalSeconds / 3600);
    totalSeconds %= 3600;
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    const pad = (num: number) => num.toString().padStart(2, '0');
    return `${pad(hours)}:${pad(mins)}:${pad(secs)}`;
};

async function performSearch(query: string, signal: AbortSignal): Promise<SearchResult[]> {
    while (!subtitlesLoaded) {
        if (signal.aborted) throw new DOMException('Search aborted', 'AbortError');
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    if (signal.aborted) throw new DOMException('Search aborted', 'AbortError');

    // Accounts for punctuation within words, and timestamps between words
    const timeBeforeFilter = performance.now();
    useWordBoundaries = localStorage.getItem('use-word-boundaries') === 'true';
    const wordBoundary = useWordBoundaries ? '\\b' : '';

    queryRegex = new RegExp(
        '(?<=[^\\d\\[:.])' + wordBoundary +
        query
            .split(/\s+/)
            .map((word, wordIndex, words) => {
                const chars = word.split('');
                return chars
                    .map((char, charIndex) => {
                        const isLastCharOfLastTerm = wordIndex === words.length - 1 && charIndex === chars.length - 1;
                        if (char === '*') {
                            return isLastCharOfLastTerm ? '' : '.*?';
                        }
                        return isLastCharOfLastTerm ? char : `${char}[^\\[A-Za-z0-9]*?`;
                    })
                    .join('') + '(?:\\[[\\d:.]+\\])?';
            })
            .join('')
            .slice(0, -1) + '{0}' + wordBoundary,
        'gi'
    );

    // console.debug('Query regex:', queryRegex);

    if (signal.aborted) throw new DOMException('Search aborted', 'AbortError');

    const result: SearchResult[] = subtitles.search(query, {
        combineWith: query.includes('*') ? 'OR' : 'AND',
        fuzzy: false,
        prefix: useWordBoundaries ? false : true,
        filter: (entry) => {
            queryRegex.lastIndex = 0;
            return queryRegex.test(entry.subtitles);
        }
    });

    console.debug(`Search took ${performance.now() - timeBeforeFilter}ms`);

    if (signal.aborted) throw new DOMException('Search aborted', 'AbortError');

    // console.debug('Search results:', result);

    Object.keys(expandState).forEach((key) => {
        delete expandState[key];
    });

    return result;
};

export async function seekEmbed(videoID: string, second: number) {
    latestPlayedVideoID = videoID;
    const embed = document.querySelector(`lite-youtube[videoid='${videoID}']`);
    try {
        // @ts-ignore
        const player: YT.Player = await embed.getYTPlayer();

        if (localStorage.getItem('one-player-limit') === 'true') {
            player.addEventListener('onStateChange', (event: YT.OnStateChangeEvent) => {
                if (event.data === YT.PlayerState.BUFFERING) {
                    latestPlayedVideoID = videoID;
                }

                if (event.data === YT.PlayerState.PLAYING) {
                    if (videoID !== latestPlayedVideoID) {
                        player.pauseVideo();
                    } else {
                        document.querySelectorAll('lite-youtube > iframe').forEach((iframe) => {
                            const liteYtEmbed = iframe.closest('lite-youtube');
                            if (liteYtEmbed && liteYtEmbed.getAttribute('videoid') !== latestPlayedVideoID) {
                                (iframe as HTMLIFrameElement).contentWindow?.postMessage(JSON.stringify({ event: 'command', func: 'pauseVideo', args: [] }), '*')
                            }
                        });
                    }
                }
            });
        }

        player.seekTo(second, true);
        player.playVideo();
    } catch {
        console.error('Failed to seek video', videoID);
    }
};

export const Results = () => {
    const contextLevel = 1;
    const timestampRegex = new RegExp(/\[[\d:.]+\]/, 'g');
    let contextStart: number;
    let contextEnd: number;
    let currentPage: number = 1;
    let currentSearchController: AbortController | null = null;
    let matchCount: number;
    let observedResultItem: Element | null = null;
    let previousQuery: string;
    let resultsPerPage: number;
    let searched: boolean = false;
    let searchQuery: string;
    let searchResults: SearchResult[] = [];
    let visibleResults: SearchResult[] = [];
    let wordBoundaryPreviouslyEnabled: boolean = false;

    const debouncedSearch = debounce(async (query: string) => {
        if (currentSearchController) {
            currentSearchController.abort();
        }

        currentSearchController = new AbortController();
        const { signal } = currentSearchController;

        try {
            searchResults = await performSearch(query, signal);
            searched = true;

            matchCount = searchResults.reduce((total, result) => {
                let count = 0;
                queryRegex.lastIndex = 0;
                while (queryRegex.exec(result.subtitles) !== null) {
                    count++;
                }
                return total + count;
            }, 0);

            m.redraw();
        } catch (e) {
            if ((e as DOMException).name === 'AbortError') {
                // console.debug('Previous search aborted');
            } else {
                throw e;
            }
        }
    }, 690);

    let paginationObserver = new IntersectionObserver(
        (entries: IntersectionObserverEntry[]) => {
            const lastResultItem = entries[0];
            if (!lastResultItem.isIntersecting || searchResults.length <= currentPage * resultsPerPage) return;
            currentPage++;
            m.redraw();
        },
        {
            root: null,
            rootMargin: '0px',
            threshold: 0.1
        }
    );

    return {
        onupdate: () => {
            if (subtitlesLoaded) {
                const lastResultItem = document.querySelector('.result-item:last-child');
                if (lastResultItem && lastResultItem !== observedResultItem) {
                    if (observedResultItem) {
                        paginationObserver.unobserve(observedResultItem);
                    }
                    paginationObserver.observe(lastResultItem);
                    observedResultItem = lastResultItem;
                }
            }

            const resultCountElement = document.querySelector('#results > h2');
            if (resultCountElement) {
                resultCountElement.textContent = searchResults.length === 0
                    ? 'Found no matches'
                    : `Found ${matchCount} ${matchCount > 1 ? 'matches across' : 'match in'} ${searchResults.length} ${searchResults.length > 1 ? 'videos' : 'video'}`;
            }
        },
        view: (vnode: Vnode<{ query: string }>) => {
            searchQuery = vnode.attrs.query;

            if (!searchQuery || !subtitlesLoaded) {
                return;
            }

            const wordBoundaryEnabled = localStorage.getItem('use-word-boundaries') === 'true';

            if (searchQuery !== previousQuery || wordBoundaryEnabled !== wordBoundaryPreviouslyEnabled) {
                currentPage = 1;
                previousQuery = searchQuery;
                wordBoundaryPreviouslyEnabled = wordBoundaryEnabled;
                debouncedSearch(searchQuery);
            }

            if (!searched) {
                return;
            }

            resultsPerPage = parseInt(localStorage.getItem('render-amount') || (window.innerWidth <= 768 ? '100' : '200'));
            visibleResults = resultsPerPage === 0 ? searchResults : searchResults.slice(0, currentPage * resultsPerPage);

            return m('div#results', [
                m('h1', `Results for "${searchQuery}"`),
                m('h2'),
                m('ul#results-list', [
                    visibleResults.map((result) => {
                        let match: RegExpExecArray | null;
                        const matches: { index: number; match: string }[] = [];

                        queryRegex.lastIndex = 0;

                        while (match = queryRegex.exec(result.subtitles)) {
                            matches.push({ index: match.index, match: match[0] });
                        }

                        if (matches.length === 0) return;

                        const isExpanded = expandState[result.id] || false;
                        const displayedMatches = isExpanded ? matches : matches.slice(0, 3);

                        return m('li.result-item', [
                            [m('lite-youtube.video-embed', {
                                key: `${result.id}${searchQuery}`,
                                'js-api': true,
                                params: 'color=white', // https://developers.google.com/youtube/player_parameters
                                style: `background-image: url('${result.thumbnail}')`,
                                title: result.title,
                                videoid: result.id,
                                onclick: (e: Event) => {
                                    // @ts-ignore
                                    e.redraw = false;
                                    e.preventDefault();
                                    seekEmbed(result.id, 0);
                                }
                            })],
                            m('div.video-info', [
                                m('h3#title', result.title),
                                result.stream_title &&
                                    m('p#stream-title', [
                                        m('b', 'Stream Title: '),
                                        result.stream_title
                                    ]),
                                result.stream_date &&
                                    m('p#stream-date', {
                                        title: result.stream_date.length === 4 ? 'YYYY' : 'YYYY-MM-DD'
                                    },
                                    [
                                        m('b', 'Streamed: '),
                                        result.stream_date
                                    ]),
                                m('p#upload-date', {
                                    title: 'YYYY-MM-DD'
                                },
                                [
                                    m('b', 'Uploaded: '),
                                    result.upload_date
                                ]),
                                m('p#duration', {
                                    title: result.duration.split(':').length - 1 === 2 ? 'H:MM:SS' : 'M:SS'
                                },
                                [
                                    m('b', 'Duration: '),
                                    result.duration.includes(':') ? result.duration : `0:${result.duration}`
                                ])
                            ]),
                            m('ul.subtitle-matches',
                                displayedMatches.map((match) => {
                                    const elements: Vnode[] = [];

                                    contextStart = match.index - 1;
                                    contextEnd = match.index + match.match.length;
                                    let bracketsFound = 0;

                                    while (contextStart > 0 && bracketsFound < contextLevel + 1) {
                                        contextStart--;
                                        if (result.subtitles[contextStart] === '[') {
                                            bracketsFound++;
                                        }
                                    }

                                    bracketsFound = 0;

                                    while (contextEnd < result.subtitles.length && bracketsFound < contextLevel + 1) {
                                        if (result.subtitles[contextEnd + 1] === '[') {
                                            bracketsFound++;
                                        }
                                        contextEnd++;
                                    }

                                    const context = result.subtitles.slice(contextStart, contextEnd);
                                    const highlights = context.match(queryRegex)[0].split(timestampRegex) || [];

                                    const contextLines = context.split('[').slice(1);
                                    contextLines.forEach((line: string) => {
                                        const [timestamp, text] = line.split(']');
                                        const splitTimestamp = timestamp.split(':');
                                        const second = parseInt(splitTimestamp[0]) * 60 + parseInt(splitTimestamp[1]);

                                        elements.push(
                                            m('li.line', [
                                                m('button.seek', {
                                                    onclick: (e: Event) => {
                                                        // @ts-ignore
                                                        e.redraw = false;
                                                        seekEmbed(result.id, second);
                                                    },
                                                    oncontextmenu: (e: MouseEvent) => {
                                                        // @ts-ignore
                                                        e.redraw = false;
                                                        e.preventDefault();
                                                    },
                                                    onmouseup: (e: MouseEvent) => {
                                                        // @ts-ignore
                                                        e.redraw = false;
                                                        if (e.button === 1) {
                                                            e.preventDefault();
                                                            window.open(`https://www.youtube.com/watch?v=${result.id}&t=${second}s`, '_blank');
                                                        } else if (e.button === 2) {
                                                            e.preventDefault();
                                                            navigator.clipboard.write([
                                                                new ClipboardItem({
                                                                    'text/plain': `https://www.youtube.com/watch?v=${result.id}&t=${second}s`
                                                                })
                                                            ]);
                                                        }
                                                    },
                                                    ontouchstart: (e: TouchEvent) => {
                                                        // @ts-ignore
                                                        e.redraw = false;
                                                        const touchDuration = 420;
                                                        const timer = setTimeout(() => {
                                                            window.open(`https://www.youtube.com/watch?v=${result.id}&t=${second}s`, '_blank');
                                                        }, touchDuration);
                                                        if (e.currentTarget) {
                                                            e.currentTarget.addEventListener('touchend', () => clearTimeout(timer));
                                                        }
                                                    },
                                                    title: 'HH:MM:SS'
                                                }, formatTimestamp(timestamp)),
                                                // This is kinda cursed, but it works
                                                // Maybe once FlexSearch matures this can be done more elegantly (v0.8 should return highlights along with search results)
                                                (() => {
                                                    let offset = 0;
                                                    const indices: { start: number; end: number }[] = [];
                                                    const lowerText = text.toLowerCase();

                                                    highlights.forEach((h: string) => {
                                                        const lowerHighlight = h.toLowerCase();
                                                        let pos = 0;
                                                        while ((pos = lowerText.indexOf(lowerHighlight, pos)) !== -1) {
                                                            indices.push({ start: pos, end: pos + h.length });
                                                            pos += h.length;
                                                        }
                                                    });

                                                    indices.sort((a, b) => a.start - b.start);

                                                    const mergedIndices = indices.reduce((merged, current) => {
                                                        if (merged.length === 0 || current.start > merged[merged.length - 1].end) {
                                                            merged.push(current);
                                                        } else {
                                                            merged[merged.length - 1].end = Math.max(merged[merged.length - 1].end, current.end);
                                                        }
                                                        return merged;
                                                    }, [] as { start: number; end: number }[]);

                                                    const fragments: (m.Vnode | string)[] = [];
                                                    mergedIndices.forEach(({ start, end }) => {
                                                        if (start > offset) {
                                                            fragments.push(text.slice(offset, start));
                                                        }

                                                        if (useWordBoundaries) {
                                                            const charBefore = start === 0 ? '' : text.charAt(start - 1);
                                                            const charAfter = end >= text.length ? '' : text.charAt(end);

                                                            if (!((start === 0 || !/\w/.test(charBefore)) && (end === text.length || !/\w/.test(charAfter)))) {
                                                                fragments.push(text.slice(start, end));
                                                                offset = end;
                                                                return;
                                                            }
                                                        } else if (searchQuery.includes('*', 1) && (end - start) === 1) {
                                                            fragments.push(text.slice(start, end));
                                                            offset = end;
                                                            return;
                                                        }

                                                        fragments.push(m('mark', text.slice(start, end)));
                                                        offset = end;
                                                    });

                                                    if (offset < text.length) {
                                                        fragments.push(text.slice(offset));
                                                    }

                                                    return fragments;
                                                })(),
                                                m('button.edit', {
                                                    onclick: (e: Event) => {
                                                        // @ts-ignore
                                                        e.redraw = false;

                                                        const match = new RegExp(timestamp.replace('.', '\.')).exec(result.subtitles);
                                                        if (match && match.index >= 0) {
                                                            const precedingText = result.subtitles.slice(0, match.index);
                                                            const lineCount = (precedingText.match(/\[/g) || []).length + 3;
                                                            window.open(`https://github.com/JermaSites/Jerma-Subtitle-Search/edit/main/src/assets/subtitles/${result.subtitle_filename}#L${lineCount}`, '_blank');
                                                        } else {
                                                            window.open(`https://github.com/JermaSites/Jerma-Subtitle-Search/edit/main/src/assets/subtitles/${result.subtitle_filename}#L4`, '_blank');
                                                        }
                                                    },
                                                    title: 'Edit on GitHub'
                                                },
                                                [
                                                    m('svg.icon', {
                                                        role: 'img', 'aria-label': 'edit icon',
                                                        viewBox: '0 0 24 24',
                                                        xmlns: 'http://www.w3.org/2000/svg'
                                                    },
                                                    [
                                                        m('path', {
                                                            d: 'M17.263 2.177a1.75 1.75 0 0 1 2.474 0l2.586 2.586a1.75 1.75 0 0 1 0 2.474L19.53 10.03l-.012.013L8.69 20.378a1.753 1.753 0 0 1-.699.409l-5.523 1.68a.748.748 0 0 1-.747-.188.748.748 0 0 1-.188-.747l1.673-5.5a1.75 1.75 0 0 1 .466-.756L14.476 4.963ZM4.708 16.361a.26.26 0 0 0-.067.108l-1.264 4.154 4.177-1.271a.253.253 0 0 0 .1-.059l10.273-9.806-2.94-2.939-10.279 9.813ZM19 8.44l2.263-2.262a.25.25 0 0 0 0-.354l-2.586-2.586a.25.25 0 0 0-.354 0L16.061 5.5Z'
                                                        })
                                                    ])
                                                ])
                                            ])
                                        );
                                    });

                                    return m('li.match', [
                                        elements,
                                        m('hr')
                                    ]);
                                })
                            ),
                            matches.length > 3 &&
                                m('button.show-more', {
                                    onclick: () => expandState[result.id] = !expandState[result.id]
                                },
                                [
                                    isExpanded ?
                                        m('svg.icon', {
                                            xmlns: 'http://www.w3.org/2000/svg',
                                            viewBox: '0 0 24 24',
                                            role: 'img', 'aria-label': 'upwards chevron'
                                        },
                                        [
                                            m('path', {
                                                d: 'M18.78 15.78a.749.749 0 0 1-1.06 0L12 10.061 6.28 15.78a.749.749 0 1 1-1.06-1.06l6.25-6.25a.749.749 0 0 1 1.06 0l6.25 6.25a.749.749 0 0 1 0 1.06Z'
                                            })
                                        ])
                                        :
                                        [
                                            `${matches.length - 3} more`,
                                            m('svg.icon', {
                                                role: 'img', 'aria-label': 'downwards chevron',
                                                viewBox: '0 0 24 24',
                                                xmlns: 'http://www.w3.org/2000/svg'
                                            },
                                            [
                                                m('path', {
                                                    d: 'M5.22 8.22a.749.749 0 0 0 0 1.06l6.25 6.25a.749.749 0 0 0 1.06 0l6.25-6.25a.749.749 0 1 0-1.06-1.06L12 13.939 6.28 8.22a.749.749 0 0 0-1.06 0Z'
                                                })
                                            ])
                                        ]
                                ])
                        ]);
                    })
                ]),
                searchResults.length === 0 &&
                m('div#page-info', [
                    m('section', [
                        m('h2', 'Not finding what you\'re looking for?'),
                        m('section#query-tips', [
                            m('ul', [
                                m('li', 'For numbers: try different combinations of typing out and digitizing.'),
                                m('li', 'Substitute potential special characters with spaces or a wildcard (*).'),
                                m('li', [
                                    'Generally American spelling should be used (',
                                    m('a', {
                                        href: 'https://en.wikipedia.org/wiki/Wikipedia:List_of_spelling_variants'
                                    }, 'list of spelling variants'),
                                    ').'
                                ])
                            ]),
                            m('p', [
                                'Wildcard characters (*) match zero or more characters.',
                                m('br'),
                                'Spaces match non-alphanumeric characters.'
                            ])
                        ]),
                        m('details#advanced-usage', [
                            m('summary', 'Advanced Usage'),
                            m('p', [
                                'You can interact with the underlying ',
                                m('a', {
                                    href: 'https://github.com/lucaong/minisearch'
                                }, 'MiniSearch'),
                                ' instance in your browser console.',
                                m('br'),
                                'It\'s accessible from a global variable called ',
                                m('code', 'subtitles'),
                                '.',
                                m('br'),
                                'For example: ',
                                m('code', `subtitles.search('${searchQuery}', { combineWith: 'OR', fuzzy: true })`)
                            ]),
                            m('p', [
                                'The subtitle files are also downloadable if you\'d like to search through them externally.',
                                m('br'),
                                'Individual files are on ',
                                m('a', {
                                    href: 'https://github.com/JermaSites/Jerma-Subtitle-Search/tree/main/src/assets/subtitles'
                                }, 'GitHub'),
                                ' and the bundled JSON is available ',
                                m('a', {
                                    href: 'https://subtitlefiles.jerma.io/file/jerma-subtitles/Subtitles.json'
                                }, 'here'),
                                '.'
                            ])
                        ])
                    ])
                ]),
                m(Secrets, {
                    query: vnode.attrs.query
                })
                // m('div#page-end', [
                //     m('h5', "You've reached the end")
                // ])
            ]);
        }
    };
};
