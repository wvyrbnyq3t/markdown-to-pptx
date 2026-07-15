import "katex/dist/katex.min.css";

import { AppHeader } from "../components/AppHeader";
import { MarkdownEditorPanel } from "../components/MarkdownEditorPanel";
import { MobileViewTabs } from "../components/MobileViewTabs";
import { PreviewPanel } from "../components/PreviewPanel";
import { SettingsDialog } from "../components/settings/SettingsDialog";
import { usePresentationEditor } from "../hooks/usePresentationEditor";

function Home() {
  const editor = usePresentationEditor();
  const canExport =
    editor.slides.length > 0 || editor.settings.includeTitleSlide;

  return (
    <div className="app">
      <AppHeader
        fileInputRef={editor.fileInputRef}
        slides={editor.slides}
        settings={editor.settings}
        slideStyle={editor.slideStyle}
        markdownIsEmpty={editor.markdown.length === 0}
        isExporting={editor.isExporting}
        canExport={canExport}
        onFileChange={editor.handleFileChange}
        onSaveMarkdown={editor.handleSaveMarkdown}
        onOpenSettings={() => editor.setIsSettingsOpen(true)}
        onExport={editor.handleExport}
      />

      {editor.errorMessage && (
        <div className="error-message" role="alert">
          {editor.errorMessage}
        </div>
      )}

      <MobileViewTabs
        currentView={editor.mobileView}
        totalSlideCount={editor.totalSlideCount}
        onChange={editor.setMobileView}
      />

      <main className="workspace">
        <MarkdownEditorPanel
          markdown={editor.markdown}
          fileName={editor.fileName}
          mobileView={editor.mobileView}
          onMarkdownChange={editor.handleMarkdownChange}
          onFileNameChange={editor.setFileName}
        />

        <PreviewPanel
          slides={editor.slides}
          settings={editor.settings}
          slideStyle={editor.slideStyle}
          totalSlideCount={editor.totalSlideCount}
          mobileView={editor.mobileView}
        />
      </main>

      <SettingsDialog
        isOpen={editor.isSettingsOpen}
        settings={editor.settings}
        onChange={editor.updateSetting}
        onReset={editor.resetSettings}
        onClose={() => editor.setIsSettingsOpen(false)}
      />
    </div>
  );
}

export default Home;
