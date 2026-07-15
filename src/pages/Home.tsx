import "katex/dist/katex.min.css";

import { AppHeader } from "../components/AppHeader";
import { MarkdownEditorPanel } from "../components/MarkdownEditorPanel";
import { MobileViewTabs } from "../components/MobileViewTabs";
import { PreviewPanel } from "../components/PreviewPanel";
import { SettingsDialog } from "../components/settings/SettingsDialog";
import { WorkspaceResizer } from "../components/WorkspaceResizer";
import { usePresentationEditor } from "../hooks/usePresentationEditor";
import { useWorkspaceResize } from "../hooks/useWorkspaceResize";

function Home() {
  const editor = usePresentationEditor();
  const workspaceResize = useWorkspaceResize();
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
        onOpenSettings={() => {
          editor.setIsSettingsOpen(true);
        }}
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
      <main
        ref={workspaceResize.workspaceRef}
        className={[
          "workspace",

          workspaceResize.isResizing ? "is-resizing" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        style={workspaceResize.workspaceStyle}
      >
        <MarkdownEditorPanel
          markdown={editor.markdown}
          fileName={editor.fileName}
          mobileView={editor.mobileView}
          onMarkdownChange={editor.handleMarkdownChange}
          onFileNameChange={editor.setFileName}
        />
        <WorkspaceResizer
          editorRatio={workspaceResize.editorRatio}
          isResizing={workspaceResize.isResizing}
          onPointerDown={workspaceResize.handlePointerDown}
          onPointerMove={workspaceResize.handlePointerMove}
          onPointerUp={workspaceResize.handlePointerUp}
          onPointerCancel={workspaceResize.handlePointerCancel}
          onKeyDown={workspaceResize.handleKeyDown}
          onReset={workspaceResize.resetWorkspaceRatio}
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
        onClose={() => {
          editor.setIsSettingsOpen(false);
        }}
      />
    </div>
  );
}

export default Home;
