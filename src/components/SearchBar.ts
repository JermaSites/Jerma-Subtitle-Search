import m, { type Vnode } from 'mithril';
import '../styles/SearchBar.scss';

export const SearchBar = () => {
    const illegalInputsRegex = new RegExp(/[^A-Za-z0-9* ]/, 'g');
    const illegalSubmitRegex = new RegExp(/^[* ]+|[* ]+$/, 'g');
    const wildcardCollapseRegex = new RegExp(/[*-]*\*[*-]*/g, 'g');
    let previousQuery: string;
    let searchQuery: string;

    function setRoute(query: string): string {
        if (query === '') {
            m.route.set('/');
        }

        query = query.trim();

        if (query !== previousQuery) {
            const processedQuery = query.replace(illegalSubmitRegex, '').replace(/\s+/g, '-').replace(wildcardCollapseRegex, '*');
            m.route.set('/:query', { query: processedQuery });
            previousQuery = query;
            return processedQuery.replace(/-/g, ' ');
        }

        return query;
    }

    return {
        oninit: (vnode: Vnode<{ query: string }>) => {
            searchQuery = vnode.attrs.query;
            searchQuery = setRoute(searchQuery);
        },
        view: () => {
            return m('form#search-bar', {
                onsubmit: function (e: Event) {
                    // @ts-ignore
                    e.redraw = false;
                    e.preventDefault();

                    searchQuery = setRoute(searchQuery);
                }
            },
            [
                m('input', {
                    autofocus: true,
                    name: 'searchQuery',
                    oninput: (e: Event) => {
                        // @ts-ignore
                        e.redraw = false;

                        const inputValue = (e.target as HTMLInputElement).value.replace(illegalInputsRegex, '');
                        (e.target as HTMLInputElement).value = inputValue;
                        searchQuery = inputValue;
                    },
                    placeholder: 'Enter search query',
                    spellcheck: false,
                    type: 'text',
                    value: searchQuery
                }),
                m('button', { type: 'submit' }, [
                    m('svg.icon#search-icon', { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 24 24', role: 'img', 'aria-label': 'search icon' }, [
                        m('path', { d: 'M10.25 2a8.25 8.25 0 0 1 6.34 13.53l5.69 5.69a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215l-5.69-5.69A8.25 8.25 0 1 1 10.25 2ZM3.5 10.25a6.75 6.75 0 1 0 13.5 0 6.75 6.75 0 0 0-13.5 0Z' })
                    ])
                ])
            ]);
        }
    };
};
