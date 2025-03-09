import { appleUA } from '../index.ts';
import m, { type Vnode } from 'mithril';
import '../styles/ProgressSpinner.scss';

export const ProgressSpinner = () => {
    return {
        view: (vnode: Vnode<{ value: number, limit: number, phase: string }>) => {
            let containerClass: string = '';
            let imageSrc: string = '';
            switch (true) {
                case vnode.attrs.phase === 'Downloading':
                    containerClass = 'download';
                    // jermaT doesn't render, and jermaSpin's transparent background shows up white on WebKit browsers idk why
                    imageSrc = appleUA ? '/assets/images/jermaComet.avif' : '/assets/images/jermaT.avif';
                    break;
                case vnode.attrs.phase === 'Parsing subtitles':
                    containerClass = 'parse';
                    imageSrc = '/assets/images/jermaIQ.avif';
                    break;
                case vnode.attrs.phase.startsWith('Error'):
                    containerClass = 'error';
                    imageSrc = '/assets/images/jermaPain.avif';
                    break;
                case vnode.attrs.phase === 'Done':
                    containerClass = 'done';
                    imageSrc = '/assets/images/jermaIQ.avif';
                    break;
                default:
                    imageSrc = '/assets/images/jermaReal.avif';
                    break;
            }

            return m('div#loading-indicator', [
                m(`div#loading-graphic-container.${containerClass}`, [
                    m('img#loading-graphic', {
                        src: imageSrc,
                        alt: 'loading indicator'
                    })
                ]),
                m('p',
                    vnode.attrs.phase === 'Downloading'
                        ? `${vnode.attrs.phase} (${String(Math.round((vnode.attrs.value / vnode.attrs.limit) * 100)).padStart(2, '0')}%)`
                        : `${vnode.attrs.phase}`
                )
            ]);
        }
    };
};
