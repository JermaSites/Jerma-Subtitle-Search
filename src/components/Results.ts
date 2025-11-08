import m, { type Children, type Vnode } from 'mithril';
import { ProgressSpinner } from './ProgressSpinner.ts';
import { Secrets } from './Secrets.ts';
import '../styles/Results.scss';
import type {
	SearchResult,
	ServerResponse,
	SubtitleLine
} from 'jerma-subtitle-search-types';

const expandState: Record<string, boolean> = {};
let latestPlayedVideoID: string;

export async function seekEmbed(videoID: string, second: number) {
	latestPlayedVideoID = videoID;
	const embed = document.querySelector(`lite-youtube[videoid='${videoID}']`);
	try {
		// @ts-ignore
		const player: YT.Player = await embed.getYTPlayer();

		player.addEventListener('onStateChange', (event: YT.OnStateChangeEvent) => {
			if (event.data === YT.PlayerState.BUFFERING) {
				latestPlayedVideoID = videoID;
			}

			if (event.data === YT.PlayerState.PLAYING && localStorage.getItem('one-player-limit') === 'true') {
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

		player.seekTo(second, true);
		player.playVideo();
	} catch {
		console.error('Failed to seek video', videoID);
	}
}

async function performSearch(
	query: string,
	useWordBoundaries: boolean,
	wildcardMatchLimit: number,
	contextLevel: number,
	start: number,
	limit: number,
	signal: AbortSignal
): Promise<ServerResponse> {
	const params = new URLSearchParams({
		q: query,
		wordBoundaries: useWordBoundaries.toString(),
		wildcardMatchLimit: wildcardMatchLimit.toString(),
		contextLevel: contextLevel.toString(),
		start: start.toString(),
		limit: limit.toString()
	});

	const baseUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://jerma-search.paulekas.eu';
	const response = await fetch(`${baseUrl}/search?${params}`, { signal });
    const data = await response.json();

    if (data.error || !response.ok) {
        throw new Error(data.message || 'Search failed');
    }

    return data;
}

function formatStreamTitle(title: string): Children[] {
	const elements: Children[] = [];
	const usernameRegex = /@(\w+)/g;
	let match;
	let lastIndex = 0;

	while ((match = usernameRegex.exec(title)) !== null) {
		if (match.index > lastIndex) {
			elements.push(title.slice(lastIndex, match.index));
		}

		const username = match[1];
		elements.push(
			m('a', {
				href: `https://www.twitch.tv/${username.toLowerCase()}`,
				target: '_blank',
				rel: 'noopener noreferrer'
			}, `@${username}`)
		);

		lastIndex = usernameRegex.lastIndex;
	}

	if (lastIndex < title.length) {
		elements.push(title.slice(lastIndex));
	}

	return elements;
}

function formatTimestamp(timestamp: string): string {
	const [minutes, seconds] = timestamp.split(':').map(Number);
	let totalSeconds = Math.floor(minutes * 60 + seconds);
	const hours = Math.floor(totalSeconds / 3600);
	totalSeconds %= 3600;
	const mins = Math.floor(totalSeconds / 60);
	const secs = totalSeconds % 60;
	const pad = (num: number) => num.toString().padStart(2, '0');
	return `${pad(hours)}:${pad(mins)}:${pad(secs)}`;
}

function renderSubtitleLine(line: SubtitleLine, videoID: string, subtitleFilename: string): Children {
	const splitTimestamp = line.timestamp.split(':');
	const second = parseInt(splitTimestamp[0]) * 60 + parseInt(splitTimestamp[1]);

	const textFragments: Children[] = [];
	let offset = 0;

	if (line.highlights && line.highlights.length > 0) {
		line.highlights.forEach(({ start, end }) => {
			if (start > offset) {
				textFragments.push(line.text.slice(offset, start));
			}
			textFragments.push(m('mark', line.text.slice(start, end)));
			offset = end;
		});
	}

	if (offset < line.text.length) {
		textFragments.push(line.text.slice(offset));
	}

	return m('li.line', [
		m('button.seek', {
			onclick: (e: Event) => {
				// @ts-ignore
				e.redraw = false;
				seekEmbed(videoID, second);
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
					window.open(`https://www.youtube.com/watch?v=${videoID}&t=${second}s`, '_blank');
				} else if (e.button === 2) {
					e.preventDefault();
					navigator.clipboard.writeText(`https://www.youtube.com/watch?v=${videoID}&t=${second}s`);
				}
			},
			ontouchstart: (e: TouchEvent) => {
				// @ts-ignore
				e.redraw = false;
				const touchDuration = 420;
				const timer = setTimeout(() => {
					window.open(`https://www.youtube.com/watch?v=${videoID}&t=${second}s`, '_blank');
				}, touchDuration);
				if (e.currentTarget) {
					e.currentTarget.addEventListener('touchend', () => clearTimeout(timer));
				}
			},
			title: 'HH:MM:SS'
		}, formatTimestamp(line.timestamp)),
		textFragments,
		m('button.edit', {
			onclick: (e: Event) => {
				// @ts-ignore
				e.redraw = false;
				const timestampEscaped = line.timestamp.replace('.', '\\.');
				const match = new RegExp(timestampEscaped).exec(subtitleFilename);
				const lineCount = match && match.index >= 0 ?
					(subtitleFilename.slice(0, match.index).match(/\[/g) || []).length + 3 : 4;
				window.open(`https://github.com/JermaSites/Jerma-Subtitle-Search/edit/main/src/assets/subtitles/${subtitleFilename}#L${lineCount}`, '_blank');
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
	]);
}

export const Results = () => {
	let allResults: SearchResult[] = [];
	let currentLimit: number = 50;
	let currentSearchController: AbortController | null = null;
	let currentStart: number = 0;
	let errorMessage: string = '';
	let observedResultItem: Element | null = null;
	let previousQuery: string;
	let previousUseWordBoundaries: boolean = false;
	let previousWildcardMatchLimit: number = -1;
	let searchFinished: boolean = false;
	let searchQuery: string;
	let searchResponse: ServerResponse | null = null;

   	const performSearchWithState = async (
		query: string,
		useWordBoundaries: boolean,
		wildcardMatchLimit: number,
		contextLevel: number,
		append: boolean = false
	) => {
		if (currentSearchController) {
			currentSearchController.abort();
		}

		currentSearchController = new AbortController();
		const { signal } = currentSearchController;

		try {
			const limit = parseInt(localStorage.getItem('render-amount') || (window.innerWidth <= 768 ? '100' : '200'));
			currentLimit = limit === 0 ? 10000 : limit;

			searchResponse = await performSearch(
				query,
				useWordBoundaries,
				wildcardMatchLimit,
				contextLevel,
				append ? currentStart : 0,
				currentLimit,
				signal
			);

			if (append) {
				allResults = [...allResults, ...searchResponse.results];
			} else {
				allResults = searchResponse.results;
				currentStart = 0;
			}

			currentStart = Math.min(searchResponse.totalResults, searchResponse.start + searchResponse.limit);
			searchFinished = true;
			errorMessage = '';
			m.redraw();
		} catch (e) {
			if ((e as DOMException).name !== 'AbortError') {
				errorMessage = (e as Error).message;
				searchFinished = true;
				m.redraw();
			}
		}
	};

	let paginationObserver = new IntersectionObserver(
		(entries: IntersectionObserverEntry[]) => {
			const lastResultItem = entries[0];
			if (!lastResultItem.isIntersecting || !searchResponse) return;

			const end = Math.min(searchResponse.totalResults, searchResponse.start + searchResponse.limit);
			if (end >= searchResponse.totalResults) return;

			const contextLevel = 1;
			const useWordBoundaries = localStorage.getItem('use-word-boundaries') === 'true';
			const wildcardMatchLimit = parseInt(localStorage.getItem('wildcard-match-length-limit') || (window.innerWidth <= 768 ? '50' : '100'), 10);

			performSearchWithState(searchQuery, useWordBoundaries, wildcardMatchLimit, contextLevel, true);
		},
		{
			root: null,
			rootMargin: '0px',
			threshold: 0.1
		}
	);

	return {
		onupdate: () => {
			if (allResults.length > 0) {
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
			if (resultCountElement && searchResponse) {
				const matchCount = allResults.reduce((total, result) =>
					total + result.matches.length, 0
				);
				resultCountElement.textContent = searchResponse.totalResults === 0
					? 'Found no matches'
					: `Found ${matchCount} ${matchCount > 1 ? 'matches across' : 'match in'} ${searchResponse.totalResults} ${searchResponse.totalResults > 1 ? 'videos' : 'video'}`;
			}
		},
		view: (vnode: Vnode<{ query: string }>) => {
			searchQuery = vnode.attrs.query;

			if (!searchQuery) {
				return;
			}

			const contextLevel = 1;
			const useWordBoundaries = localStorage.getItem('use-word-boundaries') === 'true';
			const wildcardMatchLimit = parseInt(localStorage.getItem('wildcard-match-length-limit') || (window.innerWidth <= 768 ? '50' : '100'), 10);

			if (searchQuery !== previousQuery ||
				useWordBoundaries !== previousUseWordBoundaries ||
				previousWildcardMatchLimit !== wildcardMatchLimit) {
				currentStart = 0;
				previousUseWordBoundaries = useWordBoundaries;
				previousWildcardMatchLimit = wildcardMatchLimit;
				previousQuery = searchQuery;
				searchFinished = false;
				searchResponse = null;
				allResults = [];
				Object.keys(expandState).forEach(key => delete expandState[key]);

				performSearchWithState(searchQuery, useWordBoundaries, wildcardMatchLimit, contextLevel, false);
			}

			if (!searchFinished) {
				return m(ProgressSpinner, {
					phase: `Searching for "${searchQuery}"`
				});
			}

			if (errorMessage) {
				return m('div#results', [
					m('h1', `Results for "${searchQuery}"`),
					m(ProgressSpinner, {
						phase: errorMessage
					})
				]);
			}

			if (!searchResponse) {
				return null;
			}

			return m('div#results', [
				m('h1', `Results for "${searchQuery}"`),
				m('h2'),
				m('ul#results-list',
					allResults.map((result) => {
						const isExpanded = expandState[result.id] || false;
						const displayedMatches = isExpanded ? result.matches : result.matches.slice(0, 3);

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
								m('h3.title', result.title),
								result.stream_title &&
									m('p.stream-title', [
										m('b', 'Stream Title: '),
										formatStreamTitle(result.stream_title)
									]),
								result.stream_date &&
									m('p.stream-date', {
										title: result.stream_date.length === 4 ? 'YYYY' : 'YYYY-MM-DD'
									},
									[
										m('b', 'Streamed: '),
										result.stream_date
									]),
								m('p.upload-date', {
									title: 'YYYY-MM-DD'
								},
								[
									m('b', 'Uploaded: '),
									result.upload_date
								]),
								m('p.duration', {
									title: result.duration.split(':').length - 1 === 2 ? 'H:MM:SS' : 'M:SS'
								},
								[
									m('b', 'Duration: '),
									result.duration.includes(':') ? result.duration : `0:${result.duration}`
								])
							]),
							m('ul.subtitle-matches',
								displayedMatches.map((match, _idx) =>
									m('li.match', [
										match.lines.map(line =>
											renderSubtitleLine(line, result.id, result.subtitle_filename)
										),
										m('hr')
									])
								)
							),
							result.matches.length > 3 &&
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
											`${result.matches.length - 3} more`,
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
						])
					})
				),
				searchResponse.totalResults === 0 &&
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
									'The subtitle files are downloadable if you\'d like to search through them externally.',
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
