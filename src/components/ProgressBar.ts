import m, { type Vnode } from 'mithril';
import '../styles/ProgressBar.scss';

export const ProgressBar = () => {
  return {
    view: (vnode: Vnode<{ max: number, value: number, message: string }>) => {
        return m('div#progress-container', [
            m('progress#progress-bar', { max: vnode.attrs.max, value: vnode.attrs.value }),
            m('label#progress-label', { for: 'progress-bar' }, vnode.attrs.message)
        ]);
    }
  };
};
