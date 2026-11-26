# Bulbula revenue plan

_As of 2026-11-26._

Bulbula should earn from owners who pay for visibility, starting with a Featured place pilot in January, while the directory itself stays free. Prices below are starting points to test: current traffic could not be checked while the Neon quota is exhausted (until about 1 Dec).

## What stays free, always

- Listing, claiming, editing, reviews and owner stats stay free. A directory is only worth paying for if it is complete; charging to be listed would leave half of Bulbula missing.
- Visitors never pay.

## What owners can pay for

Start with Featured place: the site already sorts places marked `featured` to the top (`lib/directory.ts`), so only a visible label, an end date and a payment record are missing. Category sponsors come later, once a category gets enough visits.

| Order | Product | What the owner gets | Starting price (Birr) |
| --- | --- | --- | --- |
| 1 | Featured place | Top of its category and of Recommended, plus a marked Featured card on the home page | 300–500 / month |
| 2 | Weekly offer | A highlighted line on the card, e.g. "10% off coffee this week", changeable | +150 / month, or included with Featured |
| 3 | Telegram shout-out | One post about the place in the channel | 200–400 / post |
| 4 | Category sponsor | "Pharmacies in Bulbula — supported by X" at the top of one category; one sponsor per category | 1,000–2,000 / month |

What to avoid:

- Google ads (AdSense): Ethiopian traffic earns very little, ads slow the site, and they break the privacy policy's "No ads" promise.
- Charging per call or lead: hard to prove, and it leads to arguments with owners.
- Selling data: the privacy policy promises it never happens.

## How to sell it: show the numbers first

Owner stats (PR #53) are the sales tool: owners pay once they see what a listing brings them.

1. Send stats links to the 10–15 owners whose places get the most visits.
2. After a month, message the best of them: "Your page had 120 visits and 18 calls. Featured places appear first; it's 400 Birr a month."
3. Run a pilot with 5 places, the first month free or half price. Afterwards, compare their calls with the month before; that becomes the sales pitch.
4. Set final prices only after the pilot. If nobody pays 400 Birr, try 250; if everyone says yes at once, it was too cheap.

## Before taking any money

First income should cover hosting, about $20–40 a month, so plan prices around that.

1. **Hosting rules:** Vercel's free Hobby plan is for non-commercial use only. Selling featured spots means moving to Vercel Pro (about $20 a month). Neon's free plan has already run out once.
2. **Legal:** regular business income in Ethiopia normally needs a trade licence and a TIN, and businesses may want receipts. The exact rules are not confirmed here; ask an accountant before the pilot ends. A free pilot month is fine.
3. **Payment:** the same way as the choir album bot: a Telebirr or CBE transfer, confirmed by hand. No payment gateway is needed for this step.
4. **Privacy policy:** change "No ads" to "No ads from ad networks; places can pay to be featured, and they are always labelled Featured." Paid placement is always labelled.

Open question: which licence and tax registration the accountant says is needed, and from what monthly income.

## What to build before the pilot

About a day of work and one database change, done after Neon is back (about 1 Dec).

- [ ] A "Featured until" date on each place, so featuring switches off by itself; the admin dashboard lists what expires soon.
- [ ] A "Featured" label on cards and place pages, and a featured row on the home page.
- [ ] A weekly offer field the owner can ask to change.
- [ ] A payments log in admin: who paid, how much, the transaction reference and the period. This gives receipts and an income record.
- [ ] "Featured until" shown on the owner's stats page.

## Timeline

The January pilot decides the prices.

| When | Phase | What happens |
| --- | --- | --- |
| Dec 2026 | Grow and measure | Merge the open PRs; send stats links to the top owners |
| Jan 2027 | Pilot | Build the Featured tools; pilot with 5 places, first month free or half price |
| Feb 2027 | Price and upgrade | Set prices from the pilot; move to Vercel Pro; get the accountant's answer |
| Later | More products | Telegram shout-outs; category sponsors |
