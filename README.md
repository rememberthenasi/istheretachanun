# Is There Tachanun? (Chabad)

A streamlined, responsive static web app designed to answer the daily question: **"Do we say Tachanun today?"** This tool follows the fixed, date-based omission schedule according to Chabad-Lubavitch custom.

*Disclaimer: This app is a tool to assist with the schedule and should not replace a Luach or a Rav for final halachic rulings.*

---

## 🚀 Features

* **Today at a Glance:** Instant "Yes/No" answer for the current date.
* **Hebrew Calendar Integration:** Runs entirely in the browser using the Hebrew calendar (no external API dependencies).
* **Smart Date Picker:** Look up any past or future date to check its status.
* **Rule Transparency:** Displays the specific halachic rule or occasion triggered for that date.
* **Mincha Awareness:** Includes a "Mincha Eve" note to remind users when Tachanun is omitted the afternoon prior.
* **Modern UI:** A clean, responsive design with automatic **Light/Dark mode** support.

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

## 🤝 Contributing

If you find a missing date or a bug in the calendar logic, feel free to open an issue or submit a pull request. 

---

## ⚖️ License

Distributed under the Creative Commons Attribution-NonCommercial 4.0 International License. 

**Note:** Credit must be provided to the original author. For commercial use inquiries, please contact the repository owner via an Issue or the contact information provided in this profile.
