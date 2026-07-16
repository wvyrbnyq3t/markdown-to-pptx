// components
import { EditorHeader } from "../components/EditorHeader";
import { MarkdownEditorPanel } from "../components/MarkdownEditorPanel";
import { MobileViewTabs } from "../components/MobileViewTabs";
import { PreviewPanel } from "../components/PreviewPanel";
import { SettingsDialog } from "../components/settings/SettingsDialog";
import { WorkspaceResizer } from "../components/WorkspaceResizer";
import { Toast } from "../components/Toast";
import { ToastContainer } from "../components/ToastContainer";

// hooks
import { usePresentationEditor } from "../hooks/usePresentationEditor";
import { useWorkspaceResize } from "../hooks/useWorkspaceResize";
import { useCallback, useEffect, useState } from "react";

// stylesheets
import "katex/dist/katex.min.css";

function Home() {
  const [activeMarkdownSlideIndex, setActiveMarkdownSlideIndex] = useState(0);
  const [dismissedError, setDismissedError] = useState("");

  const editor = usePresentationEditor();
  const workspaceResize = useWorkspaceResize();
  const canExport =
    editor.slides.length > 0 || editor.settings.includeTitleSlide;
  const activePreviewSlideIndex =
    activeMarkdownSlideIndex + (editor.settings.includeTitleSlide ? 1 : 0);

  useEffect(() => {
    /*
     * エラーが一度解消されたら、
     * 同じ内容のエラーも再表示できるようにします。
     */
    if (!editor.errorMessage) {
      setDismissedError("");
    }
  }, [editor.errorMessage]);

  const shouldShowErrorToast =
    Boolean(editor.errorMessage) && dismissedError !== editor.errorMessage;

  const handleErrorToastClose = useCallback((): void => {
    setDismissedError(editor.errorMessage);
  }, [editor.errorMessage]);

  return (
    <div className="app">
      <ToastContainer>
        {shouldShowErrorToast && (
          <Toast
            key={editor.errorMessage}
            type="error"
            message={editor.errorMessage}
            duration={5000}
            onClose={handleErrorToastClose}
          />
        )}
      </ToastContainer>
      <EditorHeader
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
          onCursorSlideChange={setActiveMarkdownSlideIndex}
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
          activeSlideIndex={activePreviewSlideIndex}
        />
      </main>
      <SettingsDialog
        isOpen={editor.isSettingsOpen}
        settings={editor.settings}
        onChange={editor.updateSetting}
        onReset={editor.resetSettings}
        onSaveSettings={editor.handleSaveSettings}
        onOpenSettingsFile={() => {
          editor.settingsFileInputRef.current?.click();
        }}
        onClose={() => {
          editor.setIsSettingsOpen(false);
        }}
      />
      <input
        ref={editor.settingsFileInputRef}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={editor.handleSettingsFileChange}
      />
    </div>
  );
}

export default Home;
