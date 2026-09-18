import { globalSeriesDetailsUrl } from "@/consts";
import { postJson } from "@/utils/fetch";

type GlobalSeriesAttribute = {
  name?: unknown;
  values?: { name?: unknown }[];
};

type GlobalSeriesDetailsResponse = {
  attributes?: GlobalSeriesAttribute[];
};

const japaneseScript = /[\u3040-\u30ff\u3400-\u9fff]/;

export async function fetchGlobalJapaneseTitle(
  seriesId: string,
  getCache = true,
): Promise<string | undefined> {
  const { unknownResponse } = await postJson(
    globalSeriesDetailsUrl(),
    { id: `CNT_${seriesId}` },
    getCache,
  );
  if (!unknownResponse || typeof unknownResponse !== "object") return;
  const attributes = (unknownResponse as GlobalSeriesDetailsResponse)
    .attributes;
  if (!Array.isArray(attributes)) return;
  const alternateTitle = attributes.find(
    (attribute) => attribute.name === "ALT TITLE(S)",
  );
  const japaneseTitle = alternateTitle?.values?.find(
    (value) =>
      typeof value.name === "string" && japaneseScript.test(value.name),
  )?.name;
  return typeof japaneseTitle === "string" ? japaneseTitle : undefined;
}
