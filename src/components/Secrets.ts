import m, { type Vnode } from 'mithril';
import { seekEmbed } from './Results';
import '../styles/Secrets.scss';

export const Secrets = () => {
    let logoLinkChanged: boolean = false;
    let rickrollPlaying: boolean = false;

    return {
        view: (vnode: Vnode<{ query: string }>) => {
            const elements: Vnode[] = [];

            switch (true) {
                case vnode.attrs.query.includes('buffy'):
                    document.documentElement.setAttribute('secret-theme', 'buffy');
                    break;
                case vnode.attrs.query.includes('rickroll'):
                    document.documentElement.setAttribute('secret-theme', 'rickroll');

                    if (!document.querySelector('lite-youtube[videoid="dQw4w9WgXcQ"]')) {
                        const embed = document.createElement('lite-youtube');
                        embed.setAttribute('class', 'video-embed hidden');
                        embed.setAttribute('js-api', 'true');
                        embed.setAttribute('params', 'color=white');
                        embed.setAttribute('videoid', 'dQw4w9WgXcQ');

                        const body = document.querySelector('body');
                        if (body) {
                            body.appendChild(embed);
                        }
                    }

                    const seekButtons = document.querySelectorAll('button.seek');
                    seekButtons.forEach((button) => {
                        button.addEventListener('click', () => {
                            const rickrollVideo = document.querySelector('lite-youtube[videoid="dQw4w9WgXcQ"]');
                            if (rickrollVideo) {
                                rickrollVideo.classList.remove('hidden');
                                if (!rickrollPlaying) {
                                    seekEmbed('dQw4w9WgXcQ', 0);
                                    rickrollPlaying = true;
                                }
                            }
                        });
                    });
                    break;
                case vnode.attrs.query.includes('gongo'):
                    const logoLink = document.querySelector('#logo > a');
                    if (logoLink) {
                        logoLink.setAttribute('href', 'https://www.twitch.tv/greatsphynx');
                        logoLinkChanged = true;
                    }

                    document.documentElement.setAttribute('secret-theme', 'gongo');
                    elements.push(
                        m('img#mornReal', { src: '/assets/images/mornReal.avif', alt: 'morn from star-trek spinning' }),
                        m('img#actualEntertainment', { src: '/assets/images/actualEntertainment.avif', alt: 'description of gongo: actual entertainment' }),
                        m('img#honseWalk', { src: '/assets/images/honseWalk.avif', alt: 'fat horse walking in a circle around a bottle of glue' }),
                        m('img#spynx', { src: '/assets/images/spynx.avif', alt: 'super tiny spynx' }),
                        m('img#patGlu', { src: '/assets/images/patGlu.avif', alt: 'bottle of glue' }),
                        m('img#bounceDoc', { src: '/assets/images/bounceDoc.avif', alt: 'doc from star-trek bouncing up and down' }),
                        m('img#bounceDok', { src: '/assets/images/bounceDok.avif', alt: 'doc from star-trek bouncing up and down' }),
                        m('img#phloxB', { src: '/assets/images/phloxB.avif', alt: 'phlox from star-trek suppressing his laughter' }),
                        m('img#tuvokLUL', { src: '/assets/images/tuvokLUL.avif', alt: 'tuvok from star-trek looking up' }),
                        m('img#daxMug', { src: '/assets/images/daxMug.avif', alt: 'mug of jadzia dax from star-trek staring at you from behind tuvok' })
                    );
                    break;
                default:
                    document.documentElement.removeAttribute('secret-theme');
                    break;
            }

            if (logoLinkChanged && !vnode.attrs.query.includes('gongo')) {
                if (logoLinkChanged) {
                    const logoLink = document.querySelector('#logo > a');
                    if (logoLink) {
                        logoLink.setAttribute('href', 'https://www.twitch.tv/jerma985');
                    }
                    logoLinkChanged = false;
                }
            }

            if (rickrollPlaying && !vnode.attrs.query.includes('rickroll')) {
                const rickrollVideo = document.querySelector('lite-youtube[videoid="dQw4w9WgXcQ"]');
                if (rickrollVideo) {
                    rickrollVideo.remove();
                    rickrollPlaying = false;
                }
            }

            return m('div#secrets', elements);
        }
    }
};
