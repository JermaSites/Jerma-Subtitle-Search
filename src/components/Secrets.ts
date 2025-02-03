import m, { type Vnode } from 'mithril';
import { seekEmbed } from './Results';
import '../styles/Secrets.scss';

export const Secrets = () => {
    let backgroundVideoPlaying: boolean = false;
    let backgroundVideoPlayedThisSearch: boolean = false;
    let logoLinkChanged: boolean = false;
    let logoLinkChangedThisSearch: boolean = false;

    function setLogoLink(href: string) {
        const logoLink = document.querySelector('#logo > a');
        if (logoLink) {
            logoLink.setAttribute('href', href);
            [logoLinkChanged, logoLinkChangedThisSearch] = [true, true];
        }
    }

    function setSecretTheme(theme: string) {
        document.documentElement.setAttribute('secret-theme', theme);
    }


    function resetPage() {
        if (backgroundVideoPlaying && !backgroundVideoPlayedThisSearch) {
            const backgroundVideo = document.querySelector('lite-youtube[id="secret-embed"]');
            if (backgroundVideo) {
                backgroundVideo.remove();
                backgroundVideoPlaying = false;
            }
        } else {
            backgroundVideoPlayedThisSearch = false;
        }

        if (faviconChanged && !faviconChangedThisSearch) {
            setFavicon('/assets/images/favicon.avif');
            faviconChanged = false;
        } else {
            faviconChangedThisSearch = false;
        }

        if (logoLinkChanged && !logoLinkChangedThisSearch) {
            const logoLink = document.querySelector('#logo > a');
            if (logoLink) {
                logoLink.setAttribute('href', 'https://www.twitch.tv/jerma985');
                logoLinkChanged = false;
            }
        } else {
            logoLinkChangedThisSearch = false;
        }

        if (titleChanged && !titleChangedThisSearch) {
            setTitle('Jerma Search');
            titleChanged = false;
        } else {
            titleChangedThisSearch = false;
        }
    }

    return {
        view: (vnode: Vnode<{ query: string }>) => {
            const elements: Vnode[] = [];

            document.documentElement.removeAttribute('secret-theme');

            switch (true) {
                case vnode.attrs.query.includes('andy') || vnode.attrs.query.includes('terraria'):
                    if (localStorage.getItem('font') !== 'OpenDyslexic, sans-serif') {
                        setSecretTheme('terraria');
                    }
                    break;
                case vnode.attrs.query.includes('buffy'):
                    setSecretTheme('buffy');
                    break;
                case vnode.attrs.query.includes('gongo'):
                    setLogoLink('https://www.twitch.tv/greatsphynx');
                    setSecretTheme('gongo');

                    elements.push(
                        m('img#mornReal', { src: '/assets/images/mornReal.avif', alt: 'morn from star-trek spinning' }),
                        m('img#actualEntertainment', { src: '/assets/images/actualEntertainment.avif', alt: 'description of gongo: actual entertainment' }),
                        m('img#spynxHeart', { src: '/assets/images/spynxHeart.avif', alt: 'color changing text that reads: sphynx <3' }),
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
                case vnode.attrs.query.includes('minecraft'):
                    if (localStorage.getItem('font') !== 'OpenDyslexic, sans-serif') {
                        setSecretTheme('minecraft');
                    }
                    break;
                case vnode.attrs.query.includes('osmo'):
                    setLogoLink('https://www.twitch.tv/greatsphynx/clip/RamshackleUnsightlyBulgogiTwitchRPG-Uzk-4z1kJvKa_KVI');
                    setSecretTheme('osmo');

                    elements.push(
                        m('img#omoJam', { src: '/assets/images/omoJam.avif', alt: 'osmo from gongo jamming' }),
                        m('img#omoP', { src: '/assets/images/omoP.avif', alt: 'osmo from gongo looking happy' })
                    );
                    break;
                case vnode.attrs.query.includes('picmin') || vnode.attrs.query.includes('pikmin'):
                    setSecretTheme('picmin');

                    elements.push(
                        m('img#picMin', { src: '/assets/images/picMin.avif', alt: 'picard from star-trek as a pikmin in a dress' })
                    );
                    break;
                case vnode.attrs.query.includes('rickroll'):
                    setSecretTheme('rickroll');

                    if (!document.querySelector('lite-youtube[videoid="dQw4w9WgXcQ"]')) {
                        const embed = document.createElement('lite-youtube');
                        embed.setAttribute('class', 'video-embed hidden');
                        embed.setAttribute('id', 'secret-embed');
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
                                if (!backgroundVideoPlaying) {
                                    seekEmbed('dQw4w9WgXcQ', 0);
                                    backgroundVideoPlaying = true;
                                    backgroundVideoPlayedThisSearch = true;
                                }
                            }
                        });
                    });
                    break;
                case vnode.attrs.query.includes('scorn'):
                    elements.push(
                        m('audio', { autoplay: true, src: '/assets/audio/scorn.opus' })
                    );
                    break;
                case vnode.attrs.query.includes('sphynx') || vnode.attrs.query.includes('spynx'):
                    setLogoLink('https://www.twitch.tv/greatsphynx');
                    setSecretTheme('sphynx');

                    elements.push(
                        m('img#spynxSit', { src: '/assets/images/spynxSit.avif', alt: 'sphynx from gongo sitting awkwardly' }),
                        m('img#spynxP', { src: '/assets/images/spynxP.avif', alt: 'sphynx from gongo looking happy' }),
                    );
                    break;
            }

            resetPage();

            return m('div#secrets', elements);
        }
    }
};
