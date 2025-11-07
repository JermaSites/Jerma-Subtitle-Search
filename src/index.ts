import m from 'mithril';
import { Header } from './components/Header.ts';
import { SearchBar } from './components/SearchBar.ts';
import { Results } from './components/Results.ts';
import { changeSetting } from './components/Settings.ts';
import './styles/General.scss';

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
					!searchQuery &&
						m('div#page-info', [
							m('section', [
								m('h1', 'Welcome'),
								m('p', 'This page lets you search through transcriptions of all Jerma\'s main channel videos, archived streams and more.')
							])
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
	if (e.altKey && e.key.toUpperCase() === 'W') {
		e.preventDefault();
		changeSetting('use-word-boundaries', (!(localStorage.getItem('use-word-boundaries') === 'true')).toString());
		m.redraw();
	}

	if (e.altKey && e.key.toUpperCase() === 'L') {
		e.preventDefault();
		const searchBar = document.querySelector('input[name="searchQuery"]') as HTMLInputElement;
		if (searchBar) {
			searchBar.focus();
		}
	}
});

// clean up old service workers & cache (removed in a3bf64c)
if ('caches' in window) {
	caches.keys().then((keys) => {
		return Promise.all(keys.map((key) => caches.delete(key)));
	})
};

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
        return Promise.all(registrations.map((registration) => registration.unregister()));
    })
};
