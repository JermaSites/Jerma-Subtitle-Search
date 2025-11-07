import m, { type Vnode } from 'mithril';
import '../styles/ProgressSpinner.scss';

export const ProgressSpinner = () => {
	return {
		view: (vnode: Vnode<{ value?: number, limit?: number, phase: string }>) => {
			vnode.attrs.value = vnode.attrs.value ?? 0;
			vnode.attrs.limit = vnode.attrs.limit ?? 1;
			let containerClass: string = '';
			let imageSrc: string = '';

			if (vnode.attrs.phase.startsWith('Searching')) {
				containerClass = 'loading';
				imageSrc = '/assets/images/jermaIQ.avif';
			} else {
				containerClass = 'error';
				imageSrc = '/assets/images/jermaPain.avif';
			}

			return m('div#loading-indicator', {
				title: vnode.attrs.phase
			},
			[
				m(`div#loading-graphic-container.${containerClass}`, [
					m('img#loading-graphic', {
						alt: 'loading indicator',
						src: imageSrc
					})
				]),
				m('p', vnode.attrs.phase)
			]);
		}
	};
};
