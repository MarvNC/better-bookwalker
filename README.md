# Better Bookwalker

### [Install](https://github.com/MarvNC/better-bookwalker/releases/latest/download/better-bookwalker.user.js)

A script that enhances Bookwalker with a better UI for viewing information about
book series on the site.

## Usage

- Install [Violentmonkey](https://violentmonkey.github.io/) as for a userscript
  manager (it's the best).
- [Install the script](https://github.com/MarvNC/better-bookwalker/releases/latest/download/better-bookwalker.user.js).
- Navigate to a series page on Bookwalker (JP or global) and the script will
  run, displaying information about the series and a chart of the release dates.

## Images

![msedge_bookwalker_2024-08-18_22-44-56](https://github.com/user-attachments/assets/ff17e424-18e6-4c75-8611-84118f3b42dd)
![msedge_bookwalker_2024-08-18_22-46-17](https://github.com/user-attachments/assets/39520084-a150-401a-8345-22a29ef19ed1)

## Development

This project was built using
[vite-plugin-monkey](https://github.com/lisonge/vite-plugin-monkey), a great
tool for bundling userscripts using Vite.

To start development, install Node and pnpm, then run:

```bash
pnpm install
pnpm dev
```

The script will automatically open in your browser.

To build the script, run:

```bash
pnpm build
```

# Book Stats Charts (Deprecated)

<!-- prettier-ignore -->
> [!WARNING] 
> This is the legacy version of the script that I made four years
> ago; it sucks but you may use it if you wish.

<details>
<summary>Click to show legacy version</summary>

### [Install](https://raw.githubusercontent.com/MarvNC/Book-Stats-Charts/main/release-dates.user.js)

Creates charts on Bookwalker displaying information about book series.

## Usage

Navigate to the series page for a series on Bookwalker (JP or global) and charts
will appear after some time. Example series pages:

- https://global.bookwalker.jp/series/169915/lazy-dungeon-master/
- https://bookwalker.jp/series/70804/list/

For Bookwalker JP, make sure it is the URL with the /list/ at the end of it.

## Support

This script is developed and tested on Violentmonkey; Tampermonkey should also
work fine but isn't thoroughly tested.
[Greasemonkey is not supported.](https://www.greasespot.net/2017/09/greasemonkey-4-for-users.html)

## Example

![example](https://i.fiery.me/wfhjY.png)

</details>
