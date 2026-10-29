import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, PointerEvent } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { MarkdownEditorPanel } from "../components/editor/MarkdownEditorPanel";
import { InsertSheet } from "../components/editor/InsertSheet";
import {
  createInsertion,
  type InsertDefinition,
} from "../components/editor/insertDefinitions";
import { PreviewPanel } from "../components/preview/PreviewPanel";
import { PresentationMode } from "../components/presentation/PresentationMode";
import { SettingsDialog } from "../components/settings/SettingsDialog";
import { ToastViewport } from "../components/ui/ToastViewport";
import {
  parseMarkdown,
  slideIndexAtCursor,
} from "../features/markdown/parseMarkdown";
import {
  useMarkdownHistory,
  type EditorSnapshot,
} from "../features/editor/useMarkdownHistory";
import { generatePptx } from "../features/pptx/generatePptx";
import {
  downloadBlob,
  downloadText,
  readTextFile,
  sanitizeFilename,
} from "../lib/files";
import { IMAGE_ACCEPT, prepareImageAsset } from "../features/images/imageFiles";
import {
  imageErrorMessage,
  saveImageAssets,
} from "../features/images/imageStore";
import { createImageMarkdown } from "../features/images/imageReferences";
import {
  createProjectArchive,
  importProjectArchive,
} from "../features/project/projectFile";
import {
  loadMarkdown,
  loadSettings,
  saveMarkdown,
  saveSettings,
} from "../lib/storage";
import { useToast } from "../hooks/useToast";
import type { PresentationSettings } from "../types/settings";

const PANEL_WIDTH_KEY = "pon-slide:editor-width:v1";

function initialPanelWidth(): number {
  try {
    const saved = Number(localStorage.getItem(PANEL_WIDTH_KEY));
    return saved >= 28 && saved <= 72 ? saved : 50;
  } catch {
    return 50;
  }
}

export function EditorPage() {
  const history = useMarkdownHistory(loadMarkdown());
  const [settings, setSettings] = useState<PresentationSettings>(loadSettings);
  const [filename, setFilename] = useState("プレゼンテーション");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [presentationOpen, setPresentationOpen] = useState(false);
  const [insertOpen, setInsertOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [imageBusy, setImageBusy] = useState(false);
  const [projectBusy, setProjectBusy] = useState(false);
  const [mobilePane, setMobilePane] = useState<"editor" | "preview">("editor");
  const [panelWidth, setPanelWidth] = useState(initialPanelWidth);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const projectInputRef = useRef<HTMLInputElement>(null);
  const imageOperationRef = useRef(false);
  const latestHistoryRef = useRef(history);
  latestHistoryRef.current = history;
  const selectionRef = useRef({ start: 0, end: 0 });
  const layoutRef = useRef<HTMLDivElement>(null);
  const { toasts, notify, dismiss } = useToast();

  const slides = useMemo(() => parseMarkdown(history.text), [history.text]);
  useEffect(() => saveMarkdown(history.text), [history.text]);
  useEffect(() => saveSettings(settings), [settings]);
  useEffect(() => {
    try {
      localStorage.setItem(PANEL_WIDTH_KEY, String(panelWidth));
    } catch {
      /* 保存できなければ省略 */
    }
  }, [panelWidth]);

  function restoreSelection(start: number, end: number, focus = false) {
    selectionRef.current = { start, end };
    const scrollTop = textareaRef.current?.scrollTop;
    requestAnimationFrame(() => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      textarea.setSelectionRange(start, end);
      if (focus) textarea.focus({ preventScroll: true });
      if (scrollTop !== undefined) textarea.scrollTop = scrollTop;
    });
  }

  function onChange(
    snapshot: EditorSnapshot,
    kind: "typing" | "command" = "typing",
  ) {
    history.edit(snapshot, kind);
    selectionRef.current = { start: snapshot.start, end: snapshot.end };
    setActiveSlideIndex(slideIndexAtCursor(snapshot.text, snapshot.start));
    if (kind === "command")
      restoreSelection(snapshot.start, snapshot.end, true);
  }

  function applyHistory(action: "undo" | "redo") {
    const next = action === "undo" ? history.undo() : history.redo();
    if (!next) return;
    restoreSelection(next.start, next.end, true);
    setActiveSlideIndex(slideIndexAtCursor(next.text, next.start));
  }

  function insertElement(definition: InsertDefinition) {
    const start =
      textareaRef.current?.selectionStart ?? selectionRef.current.start;
    const end = textareaRef.current?.selectionEnd ?? selectionRef.current.end;
    const insertion = createInsertion(
      definition,
      history.text.slice(start, end),
    );
    const next =
      history.text.slice(0, start) + insertion.text + history.text.slice(end);
    onChange(
      {
        text: next,
        start: start + insertion.selectionStart,
        end: start + insertion.selectionEnd,
      },
      "command",
    );
    setInsertOpen(false);
  }

  function openImagePicker() {
    setInsertOpen(false);
    imageInputRef.current?.click();
  }

  async function insertImages(files: File[]) {
    if (files.length === 0) return;
    if (imageOperationRef.current || projectBusy) {
      notify("ファイルの処理が終わるまでお待ちください。");
      return;
    }
    if (files.length > 20) {
      notify("一度に挿入する画像は20枚以内にしてください。", "error");
      return;
    }
    imageOperationRef.current = true;
    setImageBusy(true);
    try {
      // 大きな画像を同時に展開しないよう、1枚ずつ検証する。
      const assets = [];
      for (const file of files) assets.push(await prepareImageAsset(file));
      await saveImageAssets(assets);
      // 読み込み中に編集されても、その入力を上書きしない。
      const current = latestHistoryRef.current;
      const start = Math.min(selectionRef.current.start, current.text.length);
      const end = Math.min(selectionRef.current.end, current.text.length);
      const insertion =
        "\n\n" +
        assets
          .map((asset) =>
            createImageMarkdown(asset.id, asset.name.replace(/\.[^.]+$/, "")),
          )
          .join("\n\n") +
        "\n\n";
      const next =
        current.text.slice(0, start) + insertion + current.text.slice(end);
      const cursor = start + insertion.length;
      current.edit({ text: next, start: cursor, end: cursor }, "command");
      restoreSelection(cursor, cursor, true);
      setActiveSlideIndex(slideIndexAtCursor(next, cursor));
      notify(
        `${assets.length}枚の画像を挿入しました。持ち出すときはメニューから画像込みZIPを保存できます。`,
        "success",
      );
    } catch (error) {
      notify(imageErrorMessage(error), "error");
    } finally {
      imageOperationRef.current = false;
      setImageBusy(false);
    }
  }

  async function exportProject() {
    if (projectBusy || imageBusy) return;
    setProjectBusy(true);
    setMenuOpen(false);
    try {
      const archive = await createProjectArchive({
        markdown: history.text,
        settings,
        filename,
      });
      downloadBlob(`${sanitizeFilename(filename)}.pon.zip`, archive);
      notify("Markdown・設定・画像をまとめて保存しました。", "success");
    } catch (error) {
      notify(imageErrorMessage(error), "error");
    } finally {
      setProjectBusy(false);
    }
  }

  async function importProject(file: File | undefined) {
    if (!file || projectBusy || imageBusy) return;
    setProjectBusy(true);
    try {
      const project = await importProjectArchive(file);
      history.reset(project.markdown);
      setSettings(project.settings);
      setFilename(project.filename);
      restoreSelection(0, 0);
      setActiveSlideIndex(0);
      notify("Markdown・設定・画像を読み込みました。", "success");
    } catch (error) {
      notify(imageErrorMessage(error), "error");
    } finally {
      setProjectBusy(false);
    }
  }

  async function importMarkdown(file: File | undefined) {
    if (!file) return;
    try {
      const text = await readTextFile(file);
      history.reset(text);
      selectionRef.current = { start: 0, end: 0 };
      setActiveSlideIndex(0);
      setFilename(
        file.name.replace(/\.(md|markdown|txt)$/i, "") || "プレゼンテーション",
      );
      notify("Markdownを読み込みました。", "success");
    } catch {
      notify("Markdownファイルを読み込めませんでした。", "error");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function exportPowerPoint() {
    if (exporting) return;
    setExporting(true);
    try {
      await generatePptx(slides, settings, filename);
      notify("PowerPointファイルを出力しました。", "success");
    } catch (error) {
      console.error(error);
      notify(
        error instanceof Error
          ? `PPTX出力に失敗しました: ${error.message}`
          : "PPTX出力に失敗しました。",
        "error",
      );
    } finally {
      setExporting(false);
    }
  }

  function startPresentation() {
    setMenuOpen(false);
    setPresentationOpen(true);
    // ブラウザの全画面APIはユーザーのクリック中に呼び出す必要がある。
    // 許可されなくてもCSSの全画面オーバーレイで発表は可能。
    if (
      !document.fullscreenElement &&
      document.documentElement.requestFullscreen
    ) {
      void document.documentElement.requestFullscreen().catch(() => undefined);
    }
  }

  function handleSeparatorPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    event.preventDefault();
    const separator = event.currentTarget;
    separator.setPointerCapture(event.pointerId);
    const handleMove = (move: globalThis.PointerEvent) => {
      const frame = layoutRef.current?.getBoundingClientRect();
      if (!frame) return;
      const value = Math.min(
        72,
        Math.max(28, (100 * (move.clientX - frame.left)) / frame.width),
      );
      setPanelWidth(
        move.ctrlKey || move.metaKey
          ? Math.round(value / 10) * 10
          : Math.round(value * 10) / 10,
      );
    };
    const handleUp = () => {
      separator.removeEventListener("pointermove", handleMove);
      separator.removeEventListener("pointerup", handleUp);
      separator.removeEventListener("pointercancel", handleUp);
    };
    separator.addEventListener("pointermove", handleMove);
    separator.addEventListener("pointerup", handleUp);
    separator.addEventListener("pointercancel", handleUp);
  }

  return (
    <div className="l-app">
      <header className="l-header">
        <div className="l-header__brand">
          <label className="c-field u-gap--none">
            <span>ファイル名</span>
            <input
              id="export-file-name"
              name="export-file-name"
              className="p-editor__exportFileName"
              value={filename}
              onChange={(event) => setFilename(event.target.value)}
              aria-label="PPTXファイル名"
            />
          </label>
        </div>
        <div className="l-header__actions">
          <button
            className="c-button c-button--subtle l-header__desktop-button"
            onClick={() => {
              setSettingsOpen(true);
              setMenuOpen(false);
            }}
          >
            スライド設定
          </button>
          <button
            className="c-button c-button--primary l-header__desktop-button"
            onClick={startPresentation}
            aria-label="発表モードを開始"
          >
            <span>発表をはじめる</span>
          </button>
          <button
            className="c-icon-button l-header__menu-button"
            aria-label="メニュー"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((value) => !value)}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>
      {menuOpen && (
        <nav className="p-editor__menu" aria-label="メニュー">
          <ul className="c-separated-list">
            <li className="c-separated-list__item">
              <button
                disabled={imageBusy || projectBusy}
                onClick={() => {
                  fileInputRef.current?.click();
                  setMenuOpen(false);
                }}
              >
                Markdownを読み込む
              </button>
              <button
                onClick={() => {
                  downloadText(
                    `${sanitizeFilename(filename)}.md`,
                    history.text,
                    "text/markdown;charset=utf-8",
                  );
                  setMenuOpen(false);
                }}
              >
                Markdown形式でエクスポート
              </button>
              <button
                disabled={imageBusy || projectBusy}
                onClick={() => void exportProject()}
              >
                {projectBusy ? "処理中…" : "画像込みZIPを保存"}
              </button>
              <button
                disabled={imageBusy || projectBusy}
                onClick={() => {
                  projectInputRef.current?.click();
                  setMenuOpen(false);
                }}
              >
                画像込みZIPを読み込む
              </button>
              <button
                type="button"
                onClick={() => {
                  void exportPowerPoint();
                }}
              >
                PPTX形式でエクスポート
              </button>
            </li>
            <li className="c-separated-list__item">
              <button onClick={startPresentation}>発表をはじめる</button>
              <button
                onClick={() => {
                  setSettingsOpen(true);
                  setMenuOpen(false);
                }}
              >
                スライド設定
              </button>
            </li>
            <li className="c-separated-list__item">
              <Link to="/guide" onClick={() => setMenuOpen(false)}>
                使い方を見る
              </Link>
            </li>
          </ul>
        </nav>
      )}
      <div
        className="p-editor__mobile-switch"
        role="group"
        aria-label="表示切替"
      >
        <button
          className={`c-tab ${mobilePane === "editor" ? "c-tab--active" : ""}`}
          onClick={() => setMobilePane("editor")}
        >
          エディタ
        </button>
        <button
          className={`c-tab ${mobilePane === "preview" ? "c-tab--active" : ""}`}
          onClick={() => setMobilePane("preview")}
        >
          プレビュー
        </button>
      </div>
      <main
        className="p-editor__layout"
        ref={layoutRef}
        style={{ "--editor-panel-width": `${panelWidth}%` } as CSSProperties}
      >
        <div
          className={`p-editor__editor-wrap ${mobilePane === "editor" ? "p-editor__editor-wrap--active" : ""}`}
        >
          <MarkdownEditorPanel
            markdown={history.text}
            textareaRef={textareaRef}
            canUndo={history.canUndo}
            canRedo={history.canRedo}
            onChange={onChange}
            onSelectionChange={(start, end) => {
              selectionRef.current = { start, end };
              history.updateSelection(start, end);
              setActiveSlideIndex(slideIndexAtCursor(history.text, start));
            }}
            onUndo={() => applyHistory("undo")}
            onRedo={() => applyHistory("redo")}
            onOpenSheet={() => setInsertOpen(true)}
            onOpenImagePicker={openImagePicker}
            onImageFiles={(files) => void insertImages(files)}
            imageBusy={imageBusy || projectBusy}
          />
        </div>
        <div
          role="separator"
          tabIndex={0}
          className="p-editor__separator"
          aria-label="エディタ幅を調整"
          aria-orientation="vertical"
          aria-valuenow={panelWidth}
          onPointerDown={handleSeparatorPointerDown}
          onDoubleClick={() => setPanelWidth(50)}
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft")
              setPanelWidth((v) => Math.max(28, v - 5));
            if (event.key === "ArrowRight")
              setPanelWidth((v) => Math.min(72, v + 5));
          }}
        />
        <div
          className={`p-editor__preview-wrap ${mobilePane === "preview" ? "p-editor__preview-wrap--active" : ""}`}
        >
          <PreviewPanel
            slides={slides}
            settings={settings}
            activeSlideIndex={activeSlideIndex}
          />
        </div>
      </main>
      <input
        className="u-visually-hidden"
        ref={fileInputRef}
        type="file"
        accept=".md,.markdown,.txt,text/markdown,text/plain"
        onChange={(event) => void importMarkdown(event.target.files?.[0])}
      />
      <input
        className="u-visually-hidden"
        ref={imageInputRef}
        type="file"
        accept={IMAGE_ACCEPT}
        multiple
        aria-label="挿入する画像ファイル"
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          event.target.value = "";
          void insertImages(files);
        }}
      />
      <input
        className="u-visually-hidden"
        ref={projectInputRef}
        type="file"
        accept=".zip,application/zip"
        aria-label="画像込みZIPファイル"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          void importProject(file);
        }}
      />
      <InsertSheet
        open={insertOpen}
        onClose={() => setInsertOpen(false)}
        onInsert={insertElement}
        onInsertImage={openImagePicker}
        imageBusy={imageBusy || projectBusy}
      />
      <SettingsDialog
        open={settingsOpen}
        settings={settings}
        onChange={setSettings}
        onClose={() => setSettingsOpen(false)}
        onNotify={notify}
      />
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
      {presentationOpen && (
        <PresentationMode
          slides={slides}
          settings={settings}
          initialIndex={0}
          onClose={() => setPresentationOpen(false)}
        />
      )}
    </div>
  );
}
