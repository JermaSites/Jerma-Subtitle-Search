import m from 'mithril';
import '../styles/Settings.scss';

document.addEventListener('DOMContentLoaded', () => {
    const storedFont = localStorage.getItem('font');
    if (storedFont) {
        changeFont(storedFont);
        const checkedInput = document.querySelector(`input[value="${storedFont}"]`) as HTMLInputElement;
        if (checkedInput) {
            checkedInput.setAttribute('checked', 'true');
        }
    } else {
        changeFont('Courier New, monospace');
        const checkedInput = document.querySelector(`input[value="Courier New, monospace"]`) as HTMLInputElement;
        if (checkedInput) {
            checkedInput.setAttribute('checked', 'true');
        }
    }

    const storedTheme = localStorage.getItem('theme');
    if (storedTheme) {
        changeTheme(storedTheme);
    } else {
        const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
        if (prefersDarkScheme.matches) {
            changeTheme('dark');
        } else {
            changeTheme('light');
        }
    }
})

let hasPreloadedFonts: boolean = false;

function changeFont(font: string): void {
    localStorage.setItem('font', font);
    document.documentElement.style.setProperty('--fonts', font);
}

function changeTheme(theme: string): void {
    localStorage.setItem('theme', theme);

    document.documentElement.setAttribute('data-theme', theme);

    document.querySelectorAll('.theme-choice button').forEach(element => element.classList.remove('selected'));

    const selectedButton = document.getElementById(theme) as HTMLButtonElement;
    if (selectedButton) {
        selectedButton.classList.add('selected');
    }
}

export function toggleSettingsModal(_e: Event) {
    function showSettingsModal(dialogElement: HTMLDialogElement) {
        if (!hasPreloadedFonts) {
            const fontURLs = [
                '/assets/fonts/OpenDyslexic/OpenDyslexic-Bold.woff2',
                '/assets/fonts/OpenDyslexic/OpenDyslexic-Italic.woff2',
                '/assets/fonts/OpenDyslexic/OpenDyslexic-Bold-Italic.woff2'
            ]

            fontURLs.forEach((url: string) => {
                const link = document.createElement('link');
                link.href = url;
                link.as = 'font';
                link.rel = 'preload';
                link.type = 'font/woff2';
                link.crossOrigin = 'anonymous';

                document.head.appendChild(link);
            });

            hasPreloadedFonts = true;
        }

        const dialog = document.getElementById('settings-dialog') as HTMLDialogElement;
        if (dialog) {
            dialogElement.showModal();
        }
    }

    const dialog = document.getElementById('settings-dialog') as HTMLDialogElement;
    if (dialog) {
        dialog.open ? dialog.close() : showSettingsModal(dialog);
    }
}

export const SettingsModal = () => {
    const themes = [
        'light',
        'dark',
        'dark-blue'
    ];
    
    const fonts = [
        { id: 'arial', name: 'Arial', value: 'Arial, sans-serif' },
        { id: 'courier-new', name: 'Courier New', value: 'Courier New, monospace' },
        { id: 'garamond', name: 'Garamond', value: 'Garamond, serif' },
        { id: 'georgia', name: 'Georgia', value: 'Georgia, serif' },
        { id: 'open-dyslexic', name: 'OpenDyslexic', value: 'OpenDyslexic, sans-serif' },
        { id: 'times-new-roman', name: 'Times New Roman', value: 'Times New Roman, serif' },
        { id: 'va11halla', name: 'VA-11 HALL-A', value: 'CyberpunkWaifus, sans-serif' },
        { id: 'verdana', name: 'Verdana', value: 'Verdana, sans-serif' }
    ];

    return {
        view: () => {
            return m('dialog#settings-dialog', [
                m('button.close-button', { autofocus: true, onclick: toggleSettingsModal }, [
                    m('svg.icon', { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 24 24', role: 'img', 'aria-label': 'close icon' }, [
                        m('path', { d: 'M5.72 5.72a.75.75 0 0 1 1.06 0L12 10.94l5.22-5.22a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734L13.06 12l5.22 5.22a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L12 13.06l-5.22 5.22a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L10.94 12 5.72 6.78a.75.75 0 0 1 0-1.06Z' })
                    ])
                ]),
                m('h3', 'Theme'),
                m('div.theme-choice', [
                    themes.map(theme => 
                        m(`button.circle#${theme}`, { onclick: () => changeTheme(theme) })
                    )
                ]),
                m('h3', 'Font'),
                m('div.font-choice', [
                    fonts.map(font => 
                        m('label', { for: font.id }, [
                            m(`input#${font.id}`, {
                                type: 'radio',
                                name: 'font',
                                value: font.value,
                                onchange: (e: Event) => {
                                    const target = e.target as HTMLInputElement;
                                    if (target) {
                                        changeFont(target.value)
                                    }
                                    if (target.value === 'Times New Roman, serif') {
                                        window.open('https://www.youtube.com/watch?v=73gGwGI8Z7E&t=139s', '_blank');
                                    }
                                }
                            }),
                            font.name
                        ])
                    )
                ]),
            ])
        }
    }
}
