import { marked } from 'marked';

export type Tab = {
  id: string;
  filePath: string;
  fileName: string;
  rawText: string;
  status: 'loading' | 'done' | 'error';
};

type Props = {
  tabs: Tab[];
  activeTabId: string | null;
  onSwitch: (id: string) => void;
  onClose: (id: string) => void;
  onLinkClick: (href: string) => void;
};

export function Tabs({ tabs, activeTabId, onSwitch, onClose, onLinkClick }: Props) {
  const activeTab = tabs.find(t => t.id === activeTabId);

  let contentHtml = '';
  if (activeTab) {
    if (activeTab.status === 'error') {
      contentHtml = `<p class="explanation-error-text">${activeTab.rawText}</p>`;
    } else {
      contentHtml = marked.parse(activeTab.rawText) as string;
    }
  }

  function handleContentClick(e: React.MouseEvent<HTMLDivElement>) {
    const anchor = (e.target as HTMLElement).closest('a');
    if (!anchor) return;
    e.preventDefault();
    const href = anchor.getAttribute('href');
    if (!href || href.startsWith('http://') || href.startsWith('https://')) return;
    onLinkClick(href);
  }

  return (
    <>
      <div id="tab-bar">
        {tabs.map(tab => (
          <div
            key={tab.id}
            className={'tab' + (tab.id === activeTabId ? ' tab-active' : '')}
            onClick={() => onSwitch(tab.id)}
          >
            <span className="tab-title">{tab.fileName}</span>
            {tab.status === 'loading' && <span className="tab-spinner" />}
            <button
              className="tab-close"
              title="Close"
              onClick={e => { e.stopPropagation(); onClose(tab.id); }}
            >×</button>
          </div>
        ))}
      </div>
      <div
        id="explanation-content"
        onClick={handleContentClick}
        dangerouslySetInnerHTML={{ __html: contentHtml }}
      />
    </>
  );
}
