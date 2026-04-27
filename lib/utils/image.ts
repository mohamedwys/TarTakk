import type { ImageSourcePropType } from "react-native";

// Reusable fallback for any <Image> whose URL might be null, undefined,
// or an empty string. React Native warns ("source.uri should not be an
// empty string") when those slip through, so callers wrap their URL like:
//
//   <Image source={safeUri(user.avatar_url)} />
//
// If the URL is missing or whitespace-only, we hand back the bundled
// icon as a placeholder so the layout still renders something. Replace
// with a dedicated placeholder asset when one is available.
const PLACEHOLDER = require("@/assets/images/icon.png");

export const safeUri = (url?: string | null): ImageSourcePropType => {
  if (typeof url === "string" && url.trim() !== "") {
    return { uri: url };
  }
  return PLACEHOLDER;
};

// Drop empty / null entries from an image-URL array (the kind that ends
// up in `<FlatList data={product.images}>`).
//
//   const cleaned = filterImages(product.images);
//   cleaned.map((url) => <Image source={safeUri(url)} ... />)
export const filterImages = (urls?: (string | null | undefined)[]): string[] =>
  (urls ?? []).filter(
    (u): u is string => typeof u === "string" && u.trim() !== ""
  );
