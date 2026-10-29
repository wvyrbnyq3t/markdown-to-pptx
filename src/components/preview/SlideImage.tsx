import type { ImageSize } from "../../features/images/imageSize";
import { useEffect, useState } from "react";
import type { ImageAsset } from "../../types/image";
import type { TextAlignment } from "../../types/slide";
import { getImageAsset } from "../../features/images/imageStore";
import {
  imageDisplaySize,
  MISSING_IMAGE_HEIGHT,
} from "../../features/images/imageLayout";

type ImageState =
  | { id: string; status: "loading" | "missing" | "error" }
  | { id: string; status: "ready"; asset: ImageAsset; url: string };

interface Props {
  assetId: string;
  alt: string;
  columnWidth: number;
  contentHeight: number;
  size?: ImageSize;
  align?: TextAlignment;
}

export function SlideImage({
  assetId,
  alt,
  columnWidth,
  contentHeight,
  size: requestedSize,
  align = "left",
}: Props) {
  const [state, setState] = useState<ImageState>({
    id: assetId,
    status: "loading",
  });
  useEffect(() => {
    let disposed = false;
    let objectUrl: string | undefined;
    void getImageAsset(assetId)
      .then((asset) => {
        if (disposed) return;
        if (!asset) {
          setState({ id: assetId, status: "missing" });
          return;
        }
        objectUrl = URL.createObjectURL(asset.blob);
        setState({ id: assetId, status: "ready", asset, url: objectUrl });
      })
      .catch(() => {
        if (!disposed) setState({ id: assetId, status: "error" });
      });
    return () => {
      disposed = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [assetId]);

  const current = state.id === assetId ? state : { status: "loading" as const };
  const justifyContent =
    align === "center"
      ? "center"
      : align === "right"
        ? "flex-end"
        : "flex-start";
  if (current.status !== "ready") {
    const message =
      current.status === "loading"
        ? "画像を読み込み中…"
        : current.status === "error"
          ? "画像を読み込めませんでした。"
          : "この端末に画像がありません。画像込みZIPを読み込むか、画像を再挿入してください。";
    return (
      <div
        className="c-slide__image-message"
        role="status"
        style={{ minHeight: MISSING_IMAGE_HEIGHT }}
      >
        {message}
      </div>
    );
  }
  const size = imageDisplaySize(
    current.asset,
    columnWidth,
    requestedSize,
    contentHeight,
  );
  return (
    <figure className="c-slide__image" style={{ justifyContent }}>
      <img
        className="c-slide__image-picture"
        src={current.url}
        alt={alt}
        width={size.width}
        height={size.height}
        style={size}
        onError={() => setState({ id: assetId, status: "error" })}
      />
    </figure>
  );
}
