# App Style Scheme

## Colors

1. **Primary**: `bg-sky-100` (lightest blue, main background)
2. **Background**: `white` (white, content background)
3. **Secondary**: `bg-sky-200` (light blue, sidebar, hover states)
4. **Accent**: `text-sky-500` (medium blue, icons, highlights)
5. **Text**: `text-sky-800` (darkest blue, text, headers)
6. **Muted Text**: `text-slate-400` (light gray, secondary text)

## Typography

- **Font Sizes**:

  - Large Titles: `text-5xl`
  - Section Titles: `text-3xl`
  - Subtitles: `text-2xl`
  - Body Text: `text-xl`
  - Light Text: `font-light`

- **Font Weights**:
  - Regular: `font-normal`
  - Light: `font-light`
  - Semibold: `font-semibold`

## Spacing

- Consistent 4px or 8px increments (e.g., `p-2`, `m-4`)
- Common gaps:
  - Small: `gap-2`
  - Medium: `gap-4`
  - Large: `gap-10`

## Layout

- **Containers**:
  - Rounded corners: `rounded-lg` (6px)
  - Shadow: `shadow-md`
  - Padding: `p-4`
  - Flexbox for layout:
    - Flex Column: `flex flex-col`
    - Flex Row: `flex flex-row`
    - Justify Between: `justify-between`
    - Center Alignment: `items-center justify-center`

## Components

### SeriesHeader

- **Container**:
  `flex flex-col gap-2 rounded-lg bg-white p-4 text-sky-800 shadow-md`
- **Top Line**: `flex flex-row justify-between`
- **Authors**: `flex flex-row gap-10 text-2xl`
- **Publisher and Label**: `flex flex-row gap-5 text-xl text-sky-800`
- **Title**: `text-center text-5xl font-semibold leading-normal`
- **Dates / Volume Count**:
  `flex flex-row items-center gap-2 text-2xl font-light text-sky-800`

### SeriesComponent

- **Container**: `flex flex-col gap-4`
- **Data Options**:
  `flex w-full cursor-pointer flex-row items-center justify-center gap-2 text-center text-2xl text-sky-800`
- **Book Grid**:
  `flex flex-col gap-2 rounded-lg bg-white p-4 text-sky-800 shadow-md`

### HoverCard

- **Trigger**: `flex justify-center !no-underline`
- **Content**: `min-w-max text-center text-3xl`

### Collapsible

- **Trigger**:
  `flex w-full cursor-pointer flex-row items-center justify-center gap-2 text-center text-2xl text-sky-800`
- **Content**: `flex flex-col gap-2`

## Interactions

- **Copy to Clipboard**:
  - Cursor: `cursor-pointer`
  - Success Toast: `toast.success("Message")`

## Icons

- **Library Icon**: `<Library />` (used for volume count)
- **ChevronsUpDown Icon**: `<ChevronsUpDown />` (used for collapsible trigger)

## External Libraries

- **React Toastify**: Used for displaying success messages on copy actions.
- **Lucide React**: Used for icons.
- **React Copy to Clipboard**: Used for copy-to-clipboard functionality.
