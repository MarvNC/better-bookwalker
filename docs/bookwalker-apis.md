# BookWalker API reference

This is a working reference for first-party BookWalker data endpoints observed
by Better Bookwalker. The endpoints are public site infrastructure, but they are
not documented public APIs. They may change without notice. Responses must be
treated as untrusted input and callers should validate the fields they use.

Examples use placeholder identifiers. No API key is required for the requests
described here.

## Transport and caching

The JP and Global storefronts have different origins and content-security
policies. A userscript should use its manager's cross-origin request primitive
(`GM.xmlHttpRequest`) instead of assuming that a page `fetch` will succeed.

Requests should have a finite timeout, reject non-success status codes, parse
JSON inside a guarded block, and validate the response shape before using it.
The current script's request helpers cache successful JSON in `GM` storage. A
cache key must include the endpoint and request body when the method is POST.
Optional enrichment requests should fail soft so a missing endpoint does not
prevent the main series view from loading.

Keep concurrency bounded. The JP series endpoint is inexpensive and can be
requested once; book metadata and Global volume details should be fetched in
small batches or on demand. Do not request these endpoints from a render loop.

## Identifier formats

| Store                | Page identifier                   | Example page                                     |
| -------------------- | --------------------------------- | ------------------------------------------------ |
| Japan Store          | Numeric series ID                 | `https://bookwalker.jp/series/283627/list/`      |
| English/Global Store | 12-character series ID            | `https://bookwalker.com/series/02CPC99MBTK0/...` |
| English/Global Store | `CNT_` content ID in API payloads | `CNT_02CPC99MBTK0`                               |
| English/Global Store | `PRD_` product ID in API payloads | `PRD_14FWH0VYT7CG`                               |
| Japan Store          | UUID for a volume                 | `ae4b4b91-a521-463f-8524-525e6c4d4591`           |

The numeric JP series ID and the Global `CNT_` series ID are different
identifier namespaces.

## Japan Store endpoints

### Series listing JSON

```text
GET https://seriesinfo.bookwalker.jp/series_info_{seriesId}_v2.json
```

`seriesId` is the numeric ID from the JP series URL. A successful response has
the following top-level fields:

```json
{
  "series_info": [],
  "update_date": "2026-09-17T00:00:00+09:00"
}
```

Each `series_info` item has the following observed fields:

| Field                 | Type           | Meaning                                        |
| --------------------- | -------------- | ---------------------------------------------- |
| `uuid`                | string         | Volume UUID used by the book endpoint          |
| `thumbnail_id`        | string         | JP thumbnail identifier                        |
| `product_name_kana`   | string         | Kana product title                             |
| `productName`         | string         | Product title                                  |
| `series_no`           | number         | Volume or listing number                       |
| `moral_type_code`     | string         | Store content-rating code                      |
| `deliveryServiceType` | string[]       | Delivery formats/services                      |
| `iOSNG`               | number         | iOS availability flag                          |
| `message`             | string or null | Store message, when present                    |
| `is_wauri`            | boolean        | Store-specific listing flag                    |
| `productPrice`        | number         | Product price in the response's currency units |
| `saleEndTime`         | string or null | Sale end timestamp, when present               |

This endpoint is the inexpensive way to enumerate a JP series' volume UUIDs. It
does not include the complete series heading, book descriptions, or Global store
identifiers. A response without an array-valued `series_info` or without
`update_date` should be rejected as invalid.

### Book metadata JSON

```text
GET https://member-app.bookwalker.jp/api/books/updates?fileType=EPUB&{uuid}=0
```

The response is an array. The first item is the metadata record for the UUID.
The observed fields are:

| Field                                 | Type            | Meaning                                  |
| ------------------------------------- | --------------- | ---------------------------------------- |
| `uuid`                                | string          | Volume UUID                              |
| `productId`                           | number          | JP product identifier                    |
| `productName`                         | string          | Display title                            |
| `productNameKana`                     | string          | Kana display title                       |
| `authors`                             | object[]        | Author records with name, kana, and role |
| `companyName`                         | string          | Publisher/company name                   |
| `labelId` / `labelName`               | number / string | Imprint identifier and name              |
| `productExplanationDetails`           | string          | Full description                         |
| `productExplanationShort`             | string          | Short description                        |
| `coverImageUrl`                       | string          | Cover image URL                          |
| `thumbnailImageUrl`                   | string          | Thumbnail URL                            |
| `seriesId`                            | number          | Numeric JP series ID                     |
| `seriesName`                          | string          | JP series name                           |
| `seriesNameKana`                      | string          | Kana series name                         |
| `seriesNo`                            | number          | Volume number before local normalization |
| `productTypeCode` / `productTypeName` | string          | Product type                             |
| `categoryId` / `categoryName`         | number / string | Store category                           |
| `comicFlag`                           | boolean         | Comic flag                               |
| `productVersionSys`                   | number          | Store product version                    |
| `versionupLimitTime`                  | string or null  | Version update limit                     |
| `bvFileVersion` / `fileVersion`       | number          | File versions                            |
| `bvOpenFlag`                          | number          | Viewer availability flag                 |
| `moralTypeCode`                       | string          | Content-rating code                      |
| `licenceUnitUrl`                      | string          | License URL                              |

The response may contain additional fields. A missing array item, `productId`,
`productName`, or `uuid` is an invalid book response. The endpoint supplies
book-level JP metadata; it does not supply a Global series ID.

### JP series page data

The public page is normally:

```text
https://bookwalker.jp/series/{seriesId}/list/
```

The rendered markup contains the Japanese heading and volume links. Volume links
use `data-uuid` attributes on `a.m-thumb__image` elements. The page is a useful
preview while the JSON endpoints load, but markup should be considered an
unstable fallback surface.

## English/Global Store endpoints

### Series page data

Current Global pages use:

```text
https://bookwalker.com/series/{seriesId}/{slug}
```

The 12-character ID appears in the route and in the page's hydrated data. The
page exposes volume links under the volume-card container, and each volume route
contains JSON-LD with the title, authors, description, image, and publication
date. The current userscript uses these page surfaces for the initial list and
volume metadata.

### Kyon ContentService

The Global site exposes a JSON Connect endpoint:

```text
POST https://bookwalker.com/api/kyon/kyon.v1.ContentService/{Method}
Content-Type: application/json
```

The request body uses a Global content ID. For a series, use the canonical
`CNT_` form:

```json
{ "id": "CNT_02CPC99MBTK0" }
```

Observed methods:

| Method         | Request               | Response purpose                                      |
| -------------- | --------------------- | ----------------------------------------------------- |
| `Details`      | `{"id":"CNT_..."}`    | Series metadata, attributes, descriptions, tags       |
| `ChildDetails` | `{"id":"CNT_..."}`    | One Global volume, its next volume, and parent series |
| `Children`     | `{"id":"CNT_..."}`    | Global volumes for a series tab                       |
| `Related`      | `{"id":"CNT_..."}`    | Similar Global series                                 |
| `Search`       | Search request object | Currently returns HTTP 501 / `unimplemented`          |

#### Details

The response contains these observed top-level fields:

```json
{
  "serie": {
    "id": "CNT_...",
    "slug": "...",
    "format": "FORMAT_NOVEL",
    "title": "...",
    "image": {
      "templatedUrl": "https://img.sos-dan.net/{size}/...{format}",
      "originalWidth": 1100,
      "originalHeight": 1600
    },
    "tags": [],
    "childCount": 11
  },
  "shortDescription": "...",
  "fullDescription": "...",
  "attributes": [],
  "geoblocks": ["JP"],
  "availableTabs": ["CONTENT_TAB_VOLUMES"],
  "hints": []
}
```

`attributes` is an array of named attribute groups. Each group has a `name`,
optional `location`, and `values` array. Value objects can include a display
`name`, an ID, and browse-filter metadata. The site currently publishes Japanese
alternate-title text in an `ALT TITLE(S)` group when it exists.

Tags have an ID, display name, and namespace such as `NAMESPACE_GENRE` or
`NAMESPACE_TAG`. `geoblocks` and `availableTabs` describe Global storefront
availability and navigation.

#### ChildDetails

For a Global volume ID, the response includes a `child` object, optional
`nextChild`, a Global parent-series linkage, and reading/purchase metadata:

```json
{
  "child": {
    "id": "CNT_...",
    "productId": "PRD_...",
    "slug": "...",
    "title": "...",
    "number": { "typeName": "VOL", "number": "1" },
    "availability": {
      "consumableAt": "2022-08-04T07:00:00Z",
      "purchaseEnabled": true,
      "readingEnabled": true
    },
    "finalPrice": 999,
    "originalPrice": 999,
    "labels": []
  },
  "nextChild": { "id": "CNT_..." },
  "serie": { "id": "CNT_...", "tab": "CONTENT_TAB_VOLUMES" },
  "readingButton": { "productId": "PRD_...", "text": "Start Reading" },
  "format": "FORMAT_NOVEL"
}
```

The `serie` object is a Global parent link. It points to another Global `CNT_`
record.

#### Children

For a Global series ID, `Children` returns a tab name and a `children` array.
Each child contains the Global ID, product ID, slug, image template, volume
number, title, availability, prices, and labels. These are Global volume records
and can be used to avoid scraping individual volume pages when the response is
available.

#### Related

`Related` returns a `similarSeries` array. Each item uses the same Global
`Serie` shape (`id`, `slug`, `format`, `title`, `image`, `tags`, and counts).
The result is recommendation data, not a volume list.

#### Search and errors

The current `Search` method is advertised by the site's schema but responds
with:

```json
{
  "code": "unimplemented",
  "message": "kyon.v1.ContentService.Search is not implemented"
}
```

Callers should handle ordinary HTTP failures, a JSON error object, and a 501
response. The API's JSON is generated from the site's Connect/protobuf schema;
unknown fields should be ignored for forward compatibility.

## Legacy Global migration route

Some old Global numeric identifiers still resolve through:

```text
GET https://bookwalker.com/migration/series/{legacyGlobalId}
```

This is a redirect/migration namespace for old Global records. It is not the JP
numeric series endpoint and should not be used as a JP data request.

## Userscript integration checklist

1. Use the JP series JSON to enumerate UUIDs.
2. Use the JP book endpoint for detailed volume metadata.
3. Use Global `Details` for optional series attributes and descriptions.
4. Use Global `Children` or `ChildDetails` only when Global volume data is
   needed and the request is available.
5. Cache successful responses by endpoint plus identifier/body.
6. Validate required fields and keep optional API failures non-fatal.
7. Throttle requests and avoid polling while React renders.
