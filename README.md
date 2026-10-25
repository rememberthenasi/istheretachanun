# Is There Tachanun? (Chabad)

A streamlined, responsive static web app designed to answer the daily question: **"Do we say Tachanun today?"** This tool follows the fixed, date-based omission schedule according to Chabad-Lubavitch custom.

*Disclaimer: This app is a tool to assist with the schedule and should not replace a Luach or a Rav for final halachic rulings.*

---

## 🚀 Features

* **Today at a Glance:** Instant "Yes/No" answer for the current date.
* **Hebrew Calendar Integration:** Runs entirely in the browser using the Hebrew calendar (no server-side API; a zmanim library is loaded from a CDN only when GPS is allowed).
* **Smart Date Picker:** Look up any past or future date to check its status.
* **Rule Transparency:** Displays the specific halachic rule or occasion triggered for that date.
* **Mincha Awareness:** Includes a "Mincha Eve" note to remind users when Tachanun is omitted the afternoon prior.
* **Modern UI:** A clean, responsive design with automatic **Light/Dark mode** support.
* **URL Mobile Override:** Open `/?mobile=1` (or `/mobile`) to force the compact mobile layout on any device.
* **URL Kiosk Override:** Open `/?kiosk=1` (or `/kiosk`) for a fixed 1080x1920 portrait kiosk layout with title, Shacharis/Mincha status, and the current secular/Hebrew date display (without the date selector).
* **Traffic Visibility:** Open `/visits` to view the running total site visit count.

---

## 📜 Halachic Logic & Sources

The app’s logic is based on the fixed-date omissions published by:
* **Chabad.org**
* **Shulchanaruchharav.com**

### Important Scope Note
> **Please Note:** This app tracks **fixed-date omissions** (e.g., Rosh Chodesh, the month of Nissan, specific Chassidic holidays). 
>
> This schedule **does not include** Eretz Yisroel specific dates or Daati Le'umi dates like Yom Ha'atzmaut, alternate Chagim dates, etc.

---

## 📖 How it Works

The application calculates the current Hebrew date and cross-references it against a database of Chabad customs. 

1.  **Date Detection:** The app fetches the system time and converts it to the corresponding Hebrew date.
2.  **Rule Matching:** It iterates through a list of month-based and date-specific rules.
3.  **Result Display:** * **Green/Blue UI:** Indicates Tachanun is omitted.
    * **Standard UI:** Indicates Tachanun is recited.
4.  **Mincha Logic:** If tomorrow is a day where Tachanun is omitted, the app displays a notice during the current day's Mincha window.

---

## 🔌 JSON feed and rules module (for other displays)

The decision logic lives in one dependency-free file, `lib/tachanun.js`, which
the page, the tests and the feed generator all load. A rule change there
reaches all three at once, and `LOGIC_VERSION` inside it is bumped whenever an
answer changes.

Every deploy also publishes a machine-readable feed under `/feed/`:

| File | Contents |
|---|---|
| `/feed/latest.json` | this civil year and the next, every date |
| `/feed/tachanun-YYYY.json` | one civil year |
| `/feed/index.json` | what is published, with versions |

Each file carries `schema_version`, `logic_version` and `generated_at`. Each
date has `today` (daytime Shacharis and Mincha, with the Hebrew date),
`after_sunset` (the Hebrew day that begins at nightfall, for displays that
switch at their own local sunset) and `krias_shema` (the night that follows).
The three "custom varies" days (3 Tammuz, 18 Elul, 5 Teves) are published with
`varies: true` and `recite: true`; a display with its own setting for them
should apply it. Consumers should cache by civil date and keep serving the
cached copy if a fetch fails; a different `schema_version` major means the
shape changed.

Locally: `npm test` runs the rules tests, `npm run build:feed` writes `feed/`
(ignored by git; the Pages workflow builds it on every deploy).

Attribution is required when the feed is shown elsewhere (CC BY-NC 4.0).

---

## 🤝 Contributing

If you find a missing date or a bug in the calendar logic, feel free to open an issue or submit a pull request. 

---

## ⚖️ License

Distributed under the Creative Commons Attribution-NonCommercial 4.0 International License. 

**Note:** Credit must be provided to the original author. For commercial use inquiries, please contact the repository owner via an Issue or the contact information provided in this profile.
