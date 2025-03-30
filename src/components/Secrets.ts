import m, { type Children, type Vnode } from 'mithril';
import { seekEmbed } from './Results';
import '../styles/Secrets.scss';

const buffyRegex = new RegExp(/\bbuffy\b/, 'i');
const gongoRegex = new RegExp(/\bgongo\b/, 'i');
const minecraftRegex = new RegExp(/\bminecraft\b/, 'i');
const osmoRegex = new RegExp(/\bosmo\b/, 'i');
const picminRegex = new RegExp(/\bpicmin|pikmin\b/, 'i');
const rickrollRegex = new RegExp(/\brickroll\b/, 'i');
const scornRegex = new RegExp(/\bscorn\b/, 'i');
const sphynxRegex = new RegExp(/\bsphynx|spynx\b/, 'i');
const terrariaRegex = new RegExp(/\bandy|terraria\b/, 'i');
let backgroundVideoPlaying: boolean = false;
let backgroundVideoPlayedThisSearch: boolean = false;
let faviconChanged: boolean = false;
let faviconChangedThisSearch: boolean = false;
let logoLinkChanged: boolean = false;
let logoLinkChangedThisSearch: boolean = false;

export function playAudio(url: string, volume: number = 1) {
    const audio = new Audio(url);
    audio.volume = volume;
    audio.play();
}

export const Secrets = () => {
    function setFavicon(url: string) {
        const favicon = document.querySelector('link[rel="icon"]');
        if (favicon) {
            favicon.setAttribute('href', url);
            [faviconChanged, faviconChangedThisSearch] = [true, true];
        }
    }

    function setLogoLink(href: string) {
        const logoLink = document.querySelector('#logo > a');
        if (logoLink) {
            logoLink.setAttribute('href', href);
            [logoLinkChanged, logoLinkChangedThisSearch] = [true, true];
        }
    }

    function setSecretTheme(theme: string) {
        const currentTheme = document.documentElement.getAttribute('secret-theme');
        const newTheme = currentTheme ? `${currentTheme}  ${theme}` : theme;
        document.documentElement.setAttribute('secret-theme', newTheme);
    }

    function setTitle(title: string) {
        document.title = title;
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
    }

    return {
        onremove: () => {
            document.documentElement.removeAttribute('secret-theme');
            resetPage();
        },
        view: (vnode: Vnode<{ query: string }>) => {
            const elements: Children = [];

            document.documentElement.removeAttribute('secret-theme');

            switch (true) {
                case terrariaRegex.test(vnode.attrs.query):
                    if (localStorage.getItem('font') !== 'OpenDyslexic, sans-serif') {
                        setSecretTheme('terraria');
                    }
                    break;
                case buffyRegex.test(vnode.attrs.query):
                    setSecretTheme('buffy');
                    break;
                case gongoRegex.test(vnode.attrs.query):
                    setFavicon('/assets/images/daxMug.avif');
                    setLogoLink('https://www.twitch.tv/greatsphynx');
                    setSecretTheme('gongo');
                    setTitle('gongo');

                    elements.push(
                        m('img#mornReal', {
                            alt: 'morn from star-trek spinning',
                            src: '/assets/images/mornReal.avif'
                        }),
                        m('img#actualEntertainment', {
                            alt: 'description of gongo: actual entertainment',
                            src: '/assets/images/actualEntertainment.avif'
                        }),
                        m('img#spynxHeart', {
                            alt: 'color changing text that reads: sphynx <3',
                            src: '/assets/images/spynxHeart.avif'
                        }),
                        m('img#honseWalk', {
                            alt: 'fat horse walking in a circle around a bottle of glue',
                            src: '/assets/images/honseWalk.avif'
                        }),
                        m('img#spynx', {
                            alt: 'super tiny spynx',
                            src: '/assets/images/spynx.avif'
                        }),
                        m('img#patGlu', {
                            alt: 'bottle of glue',
                            src: '/assets/images/patGlu.avif'
                        }),
                        m('img#bounceDoc', {
                            alt: 'doc from star-trek bouncing up and down',
                            src: '/assets/images/bounceDoc.avif'
                        }),
                        m('img#bounceDok', {
                            alt: 'doc from star-trek bouncing up and down',
                            src: '/assets/images/bounceDok.avif'
                        }),
                        m('img#phloxB', {
                            alt: 'phlox from star-trek suppressing his laughter',
                            src: '/assets/images/phloxB.avif'
                        }),
                        m('img#tuvokLUL', {
                            alt: 'tuvok from star-trek looking up',
                            src: '/assets/images/tuvokLUL.avif'
                        }),
                        m('img#daxMug', {
                            alt: 'mug of jadzia dax from star-trek staring at you from behind tuvok',
                            src: '/assets/images/daxMug.avif'
                        })
                    );
                    break;
                case minecraftRegex.test(vnode.attrs.query):
                    if (localStorage.getItem('font') !== 'OpenDyslexic, sans-serif') {
                        setSecretTheme('minecraft');
                    }
                    break;
                case osmoRegex.test(vnode.attrs.query):
                    setFavicon('/assets/images/omoJam.avif');
                    setLogoLink('https://www.twitch.tv/greatsphynx/clip/RamshackleUnsightlyBulgogiTwitchRPG-Uzk-4z1kJvKa_KVI');
                    setSecretTheme('osmo');
                    setTitle('OSMO');
                    playAudio('/assets/audio/OSMO.opus', 0.50);

                    if (localStorage.getItem('use-word-boundaries') === 'false') {
                        setSecretTheme('repeat-background');
                    }

                    elements.push(
                        m('img#omoJam', {
                            alt: 'osmo from gongo jamming',
                            src: '/assets/images/omoJam.avif'
                        }),
                        m('img#omoP', {
                            alt: 'osmo from gongo looking happy',
                            src: '/assets/images/omoP.avif'
                        })
                    );
                    break;
                case picminRegex.test(vnode.attrs.query):
                    setSecretTheme('picmin');

                    elements.push(
                        m('img#picMin', {
                            alt: 'picard from star-trek as a pikmin in a dress',
                            src: '/assets/images/picMin.avif'
                        })
                    );
                    break;
                case rickrollRegex.test(vnode.attrs.query):
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
                                    setFavicon('/assets/images/trollface.avif');
                                    backgroundVideoPlaying = true;
                                    backgroundVideoPlayedThisSearch = true;
                                }
                            }
                        });
                    });
                    break;
                case scornRegex.test(vnode.attrs.query):
                    setSecretTheme('SCORN');
                    playAudio('/assets/audio/SCORN.opus');
                    break;
                case sphynxRegex.test(vnode.attrs.query):
                    setFavicon('/assets/images/spynx.avif');
                    setLogoLink('https://www.twitch.tv/greatsphynx');
                    setSecretTheme('sphynx');

                    elements.push(
                        m('img#spynxSit', {
                            alt: 'sphynx from gongo sitting awkwardly',
                            src: '/assets/images/spynxSit.avif'
                        }),
                        m('img#spynxP', {
                            alt: 'sphynx from gongo looking happy',
                            src: '/assets/images/spynxP.avif'
                        }),
                    );
                    break;
            }

            resetPage();

            return m('div#secrets', elements);
        }
    }
};

if (new Date().getDay() === 3) {
    console.log(`
                *+**#%*##*
               **-...=#%%%%*
               #+.....::-+%%
               =:.::..-===**
                :..:::++=+*
                 -.:::=+**
                *-:-=**#*=*
          *#%%@%@@@%****#%@@%%%
      @@@@@@@@@@@@@@@@@@@@@@@@@@@@@
    @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@%
  %@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@*
*@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@#
::*@@@@@   @@@@@@@@@@@@@@@@@@@@@@@@%#
-==*%      #@@@@@@@@@@@@@@@@@@@@@@#++=
::=+*       %@@@@@@@@@@@@@@@@@@@@@%*+=
======*#     %@@@@@@@@@@@@@@@@@@@@%*=-
  *=::-=+%    %@@@@@@@@@@@@@@@@@@@ #=-
     *=--:-=*==-*%@@@@@@@@@@@@@@@@  *=
       %*-::::-=-+@@@@@@@@@@@@@@@@@  *

                Sparkle on!
              It's Wednesday!
                Don't forget
              to be yourself!
    `);
} else {
    console.log(`
⠉⠉⠉⣿⡿⠿⠛⠋⠉⠉⠉⠉⠉⠉⠉⠉⠉⠉⠉⠉⠉⠉⠉⠉⠉⣻⣩⣉⠉⠉
⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⢀⣀⣀⣀⣀⣀⣀⡀⠄⠄⠉⠉⠄⠄⠄
⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⣠⣶⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣶⣤⠄⠄⠄⠄
⠄⠄⠄⠄⠄⠄⠄⠄⠄⢤⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡀⠄⠄⠄
⡄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠉⠄⠉⠉⠉⣋⠉⠉⠉⠉⠉⠉⠉⠉⠙⠛⢷⡀⠄⠄
⣿⡄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠠⣾⣿⣷⣄⣀⣀⣀⣠⣄⣢⣤⣤⣾⣿⡀⠄
⣿⠃⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⣹⣿⣿⡿⠿⣿⣿⣿⣿⣿⣿⣿⣿⢟⢁⣠
⣿⣿⣄⣀⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠉⠉⣉⣉⣰⣿⣿⣿⣿⣷⣥⡀⠉⢁⡥⠈
⣿⣿⣿⢹⣇⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠒⠛⠛⠋⠉⠉⠛⢻⣿⣿⣷⢀⡭⣤⠄
⣿⣿⣿⡼⣿⠷⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⢀⣀⣠⣿⣟⢷⢾⣊⠄⠄
⠉⠉⠁⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠈⣈⣉⣭⣽⡿⠟⢉⢴⣿⡇⣺⣿⣷
⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠁⠐⢊⣡⣴⣾⣥⣿⣿⣿
    `);
}
