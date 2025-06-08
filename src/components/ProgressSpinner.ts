import { appleUA } from '../index.ts';
import m, { type Vnode } from 'mithril';
import '../styles/ProgressSpinner.scss';

export const ProgressSpinner = () => {
    return {
        view: (vnode: Vnode<{ value?: number, limit?: number, phase: string }>) => {
            vnode.attrs.value = vnode.attrs.value ?? 0;
            vnode.attrs.limit = vnode.attrs.limit ?? 1;
            let containerClass: string = '';
            let imageSrc: string = '';

            switch (true) {
                case vnode.attrs.phase === 'Downloading' || vnode.attrs.phase === 'Using cached index':
                    containerClass = 'download';
                    // jermaT doesn't render, and jermaSpin's transparent background shows up white on WebKit browsers idk why
                    imageSrc = appleUA ? '/assets/images/jermaComet.avif' : '/assets/images/jermaT.avif';
                    break;
                case vnode.attrs.phase === 'Parsing subtitles':
                    containerClass = 'parse';
                    imageSrc = '/assets/images/jermaIQ.avif';
                    break;
                case vnode.attrs.phase.startsWith('Searching'):
                    imageSrc = '/assets/images/jermaIQ.avif';
                    break;
                case vnode.attrs.phase.startsWith('Error'):
                    containerClass = 'error';
                    imageSrc = '/assets/images/jermaPain.avif';
                    break;
                default:
                    imageSrc = '/assets/images/jermaReal.avif';
                    break;
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
                m('p',
                    vnode.attrs.phase === 'Downloading' ?
                        [
                            'Downloading index',
                            m('br'),
                            `${(vnode.attrs.value / 1e6).toFixed(2)} / ${(vnode.attrs.limit / 1e6).toFixed(2)} MB (${String(Math.round((vnode.attrs.value / vnode.attrs.limit) * 100)).padStart(2, '0')}%)`,
                        ]
                    : vnode.attrs.phase.startsWith('Error') ?
                        [
                            vnode.attrs.phase,
                            m('br'),
                            'Please try clearing your cache with ',
                            m('kbd', 'Ctrl'),
                            ' + ',
                            m('kbd', 'F5')
                        ]
                    : vnode.attrs.phase
                )
            ]);
        }
    };
};
