# Email-first registration system (triwithms.com)

**Status:** Blueprint / not implemented

**Related:** Survive Sunday pool notifications

This document is a plan for how Survive Sunday participants start a mail relationship with the pool before the pool sends them anything. It does not change DNS, Zoho, hosting, or the app. The live pool remains [survive-sunday.vercel.app](https://survive-sunday.vercel.app). The owner domain is `triwithms.com`.

## 1. Core objective & deliverability strategy

### Problem

Pool emails and weekly standings land in junk. Filters treat a first message from an unknown address as unsolicited, especially when the same address later sends recurring standings. A verified domain alone does not fix that if the recipient has never written to the sender.

### Solution

Use an inbound-first trust handshake. The participant emails the pool address first. Their mailbox then has a sent message and, after staff reply, a thread with that address. Later pool mail is more likely to be treated as a known contact.

The handshake is the registration step. The landing page does not collect the address on a form. It opens the participant’s own mail client with the pool address, subject, and a short body already filled in. They send the message themselves.

### Sender identity

| Field | Value |
| --- | --- |
| Address | `pool@triwithms.com` |
| Display name | Pool Registration |
| Envelope / header From (when outbound is ready) | `Pool Registration <pool@triwithms.com>` |

Use this identity for registration replies and, later, for pool mail that should look like the same sender. Do not introduce a second public From address for the same conversation.

### Principles

- **Receive before broadcast.** Do not send standings or other pool mail to an address until that address has mailed `pool@` (or staff have an equivalent, recorded handshake).
- **Authenticate the domain.** Publish SPF, DKIM, and DMARC for `triwithms.com` before any broadcast. Inbound mail and later outbound mail should pass alignment checks.
- **Keep transactional app sends on the same From identity when ready.** Survive Sunday already sends some mail (including Forgot password codes) through its transactional provider. When that path is switched, the visible From should be Pool Registration at `pool@triwithms.com`, not a separate noreply identity. Authentication records must cover whichever service actually sends.

## 2. Phase 1 — Infrastructure & DNS (Zoho Mail Forever Free + GoDaddy)

Phase 1 creates the mailbox and the DNS that lets the rest of the internet accept mail for `triwithms.com`. Nothing in this phase is executed by the blueprint pull request.

### Forever Free limits

Zoho Mail Forever Free, as published for this plan:

| Limit | Value |
| --- | --- |
| Users | Up to 5 |
| Custom domains | 1 |
| Storage | 5 GB per user |
| Access | Web and mobile app |
| IMAP / POP | Not included on the free plan |

Free Zoho is a fit for a small shared inbox that staff read in the browser or the Zoho app. It is a poor fit for app SMTP, bulk standings, or a mail client that requires IMAP or POP. Those needs stay on a later phase.

### Signup

1. Open [Zoho Mail](https://mail.zoho.com) and choose **Forever Free**.
2. Add the custom domain `triwithms.com`.
3. Prefer the **US** data center so the MX hosts are `*.zoho.com`. Other regions use different MX hosts. Copy the hosts Zoho shows; do not assume the US set if the account was created elsewhere.

### Warning: MX affects every address on the domain

Changing MX routes **all** `@triwithms.com` mail to Zoho, not only `pool@`. Before any MX edit:

- List every address that already receives mail on `triwithms.com` (forwarders, other mailboxes, form notifications, registrar mail).
- Decide where each of those messages should go after the cutover, or confirm that no live mailbox depends on the current MX.
- Make the change in a window when a missed message can be noticed and recovered.

### GoDaddy DNS

Zoho’s console shows the records to add and a checker for this domain. Use that checker as the source of truth if a value below differs. Vendor walkthrough: [Zoho Mail with GoDaddy](https://www.zoho.com/mail/help/adminconsole/godaddy.html).

Add records in this order. Leave MX until the verification TXT is in place and existing mail has been inventoried.

| Purpose | Type | Host (GoDaddy) | Value | Priority / notes |
| --- | --- | --- | --- | --- |
| Domain ownership | TXT | `@` | Zoho-provided `zoho-verification=…` | Paste the exact token from Zoho. Do not invent it. |
| MX | MX | `@` | `mx.zoho.com` | 10. Add only after deleting conflicting MX. |
| MX | MX | `@` | `mx2.zoho.com` | 20. Same. |
| MX | MX | `@` | `mx3.zoho.com` | 50. Same. Confirm all three in Zoho Admin → Email Configuration. US data center expected. |
| SPF | TXT | `@` | `v=spf1 include:zohomail.com ~all` | **One SPF TXT only.** If an SPF TXT already exists, merge this `include:` into that record. Copy Zoho’s exact `include:` if the console shows a different one. |
| DKIM | TXT | Often `zoho._domainkey` | Value generated in Zoho Admin | Host and value come from Zoho. On GoDaddy the host is usually the selector label without the domain. |
| DMARC (optional at first) | TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:pool@triwithms.com` | Monitor only. Tighten policy after outbound mail is clean. |

SPF rules that avoid a silent failure:

- A domain may publish only one SPF TXT. Two SPF records mean neither is reliable.
- `~all` is a soft fail and is appropriate while outbound sending is still being proven. Do not jump to `-all` in this phase.
- When a second sender is added in Phase 3, edit this same record. Do not add a second TXT.

### Mailbox

1. In Zoho Admin, create `pool@triwithms.com`.
2. Set the display name to **Pool Registration**.
3. Sign in once on the web (and the mobile app if staff will use it) and confirm send and receive.

### Smoke test

Run this before anyone is asked to register, and again after SPF and DKIM are published.

1. From an external mailbox (Gmail and one non-Gmail account), send a message to `pool@triwithms.com`.
2. Confirm it arrives in the Zoho inbox, not a quarantine folder.
3. Reply from `pool@` back to that external mailbox.
4. On the received reply, open the message source and confirm SPF and DKIM pass for `triwithms.com`, and that the visible From is Pool Registration `<pool@triwithms.com>`.
5. If the reply lands in junk, fix authentication before building the registration page on top of a broken path.

### Phase 1 success criteria

- [ ] Existing `@triwithms.com` mail is inventoried and a destination is chosen for each address before MX changes.
- [ ] Zoho Forever Free organization exists on the US data center (or the published MX set matches the chosen region).
- [ ] Domain verification TXT is present and Zoho reports the domain as verified.
- [ ] Only the Zoho MX records remain on `@`. Priorities match Zoho Admin.
- [ ] Exactly one SPF TXT exists on `@`, and it includes Zoho’s mail include.
- [ ] DKIM TXT matches the selector Zoho generated, and Zoho reports DKIM as verified.
- [ ] Optional DMARC TXT is `p=none` and reports to `pool@triwithms.com`.
- [ ] Mailbox `pool@triwithms.com` exists with display name Pool Registration.
- [ ] External send, inbox delivery, and reply all succeed, with SPF and DKIM passing on the reply.

## 3. Phase 2 — Landing page & front-end architecture

Phase 2 is a static page. It does not create accounts, take payment, or post a form to a server.

### Host

Recommend a free static host in the same organization as the app repository: **GitHub Pages**, or **Netlify** on its free static tier. The page is one HTML file plus optional assets. It does not need the Survive Sunday server.

Requirements:

- Mobile-first layout. Most participants will open the link on a phone.
- Works without a signed-in session.
- Address is still open: a subdomain such as `register.triwithms.com`, or a path such as `/join` on an existing site. See open decisions.

Do not host this page by editing the Survive Sunday app in the same change as this blueprint.

### Page goal

Three clear register actions, each opening a compose window:

1. **Gmail on the web**
2. **Outlook on the web**
3. **Universal `mailto:`** (the participant’s default mail app)

A fourth control copies `pool@triwithms.com` for anyone whose compose link fails.

### Pre-filled message

| Field | Content |
| --- | --- |
| To | `pool@triwithms.com` |
| Subject | `Survive Sunday registration` |
| Body | Placeholders for name and phone, a one-line intent, plus an optional referral or invite tag when the page URL has one |

Example body:

```text
Name:
Phone:

I want to join the Survive Sunday pool.

Referral: CODE
```

Omit the referral or invite lines when those query parameters are absent.

Query parameters:

- `?ref=CODE` — append `Referral: CODE` to the body.
- `?invite=TOKEN` — append `Invite: TOKEN` to the body.

Both may appear together. Values are inserted as plain text in the body only. They are not secrets and they are not executed.

### Compose URLs

Build every query value with `encodeURIComponent`.

- Gmail: `https://mail.google.com/mail/?view=cm&fs=1&to=…&su=…&body=…`
- Outlook: `https://outlook.live.com/mail/0/deeplink/compose?to=…&subject=…&body=…`
- `mailto:`: `mailto:pool@triwithms.com?subject=…&body=…` with encoded subject and body

`su` is Gmail’s subject parameter. Outlook uses `subject`. Do not swap them.

### Edge cases

| Situation | Expected behavior |
| --- | --- |
| Desktop with no Gmail or Outlook account in the browser | Participant uses **Register with your mail app** (`mailto:`). |
| iOS or Android | Prefer `mailto:`. It opens the installed mail app. Web compose links are secondary. |
| Compose link blocked, or no mail app | **Copy pool address** puts `pool@triwithms.com` on the clipboard and shows the address if copy fails. |
| `ref` or `invite` missing, empty, or unexpected | Leave that line out. Still open a valid compose window. |
| Very long token | Still encode it. Mail clients truncate extreme bodies; keep tags short when the schema is chosen. |

### Out of scope for v1

- Server-side form POST
- Payment or entry-fee collection
- Account-creation APIs
- Writing to the Survive Sunday database from this page

### HTML starter

Single file. Save as `index.html` on the static host when Phase 2 is implemented. It is included here so the blueprint is implementable without inventing the compose links later.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Survive Sunday — Register by email</title>
  <style>
    :root {
      color-scheme: light dark;
      --bg: #0b1220;
      --card: #162033;
      --text: #f8fafc;
      --muted: #cbd5e1;
      --accent: #22c55e;
      --accent-text: #052e16;
      --line: #334155;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.45;
    }
    main {
      max-width: 32rem;
      margin: 0 auto;
      padding: 1.25rem 1rem 2.5rem;
    }
    h1 { font-size: 1.5rem; line-height: 1.2; margin: 0 0 0.5rem; }
    p { margin: 0 0 1rem; }
    .lede { color: var(--muted); }
    .actions { display: grid; gap: 0.75rem; margin: 0 0 1rem; }
    a.btn, button.btn {
      display: block;
      width: 100%;
      text-align: center;
      text-decoration: none;
      font: inherit;
      font-weight: 650;
      border-radius: 0.75rem;
      padding: 0.9rem 1rem;
      border: 1px solid var(--line);
      background: var(--card);
      color: var(--text);
      cursor: pointer;
    }
    a.btn.primary, button.btn.primary {
      background: var(--accent);
      color: var(--accent-text);
      border-color: transparent;
    }
    .note, #copied { font-size: 0.875rem; color: var(--muted); }
    #copied { min-height: 1.25rem; }
  </style>
</head>
<body>
  <main>
    <h1>Join Survive Sunday</h1>
    <p class="lede">Email the pool first. Sending this message tells your mail filters that later standings are from someone you already wrote to.</p>
    <div class="actions">
      <a id="gmail" class="btn" href="#">Register with Gmail</a>
      <a id="outlook" class="btn" href="#">Register with Outlook</a>
      <a id="mailto" class="btn primary" href="#">Register with your mail app</a>
      <button id="copy" class="btn" type="button">Copy pool address</button>
    </div>
    <p id="copied" role="status"></p>
    <p class="note">On a phone, “your mail app” is the surest path. On a computer without Gmail or Outlook, use that same button. The pool address is pool@triwithms.com.</p>
  </main>
  <script>
    (function () {
      var POOL = "pool@triwithms.com";
      var SUBJECT = "Survive Sunday registration";
      var params = new URLSearchParams(window.location.search);
      var ref = (params.get("ref") || "").trim();
      var invite = (params.get("invite") || "").trim();
      var lines = [
        "Name: ",
        "Phone: ",
        "",
        "I want to join the Survive Sunday pool."
      ];
      if (ref) lines.push("", "Referral: " + ref);
      if (invite) lines.push("", "Invite: " + invite);
      var body = lines.join("\n");

      var encTo = encodeURIComponent(POOL);
      var encSubject = encodeURIComponent(SUBJECT);
      var encBody = encodeURIComponent(body);

      document.getElementById("gmail").href =
        "https://mail.google.com/mail/?view=cm&fs=1&to=" + encTo +
        "&su=" + encSubject +
        "&body=" + encBody;

      document.getElementById("outlook").href =
        "https://outlook.live.com/mail/0/deeplink/compose?to=" + encTo +
        "&subject=" + encSubject +
        "&body=" + encBody;

      document.getElementById("mailto").href =
        "mailto:" + encTo + "?subject=" + encSubject + "&body=" + encBody;

      var mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || "");
      if (!mobile) {
        document.getElementById("mailto").classList.remove("primary");
        document.getElementById("gmail").classList.add("primary");
      }

      document.getElementById("copy").addEventListener("click", function () {
        var status = document.getElementById("copied");
        function done(ok) {
          status.textContent = ok
            ? "Copied " + POOL
            : "Select and copy this address: " + POOL;
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(POOL).then(
            function () { done(true); },
            function () { done(false); }
          );
        } else {
          done(false);
        }
      });
    })();
  </script>
</body>
</html>
```

### Phase 2 success criteria

- [ ] Static page is live at the chosen host and address, and it is usable at a phone width.
- [ ] Gmail, Outlook, and `mailto:` links open a compose window To `pool@triwithms.com` with the subject `Survive Sunday registration`.
- [ ] Body contains name and phone placeholders.
- [ ] `?ref=CODE` adds `Referral: CODE`. `?invite=TOKEN` adds `Invite: TOKEN`. Absent params omit those lines.
- [ ] Every compose query value is passed through `encodeURIComponent`.
- [ ] On a phone-sized browser, the mail-app action is the primary control. On desktop, Gmail is primary and `mailto:` remains available.
- [ ] Copy control writes `pool@triwithms.com` or shows it when clipboard access fails.
- [ ] The page does not POST a form, create a user, or take payment.

## 4. Phase 3 — Operations, edge cases, outbound transition

Phase 3 is how staff handle the inbox, how account recovery stays safe, and how weekly mail starts only after the handshake and authentication are real.

### Registration operations

Inbox triage for each new message to `pool@triwithms.com`:

1. Confirm it is a registration (subject and body from the landing page, or a clear equivalent).
2. Read the name, phone, and any `Referral:` or `Invite:` line. Ignore tags that do not match the schema once that schema exists.
3. Reply from `pool@` so the participant has a thread with Pool Registration. Use the confirm template below.
4. Create or attach their Survive Sunday login with the flows that already exist in Admin. The app does not email passwords today. Administrators set a temporary password under **Admin → Players → Add user** and send it themselves, or they share **Admin → Pool → Shared join link** so the person chooses their own email and password. A personal join link only attaches email and password to a seat that already exists.
5. Record that this address completed the handshake before any standings or broadcast go to it.

Confirm reply template (send as Pool Registration, from `pool@triwithms.com`):

```text
Subject: Re: Survive Sunday registration

You are on the list for pool email. Keep this thread.

Next step: we will send a separate note with how to sign in to Survive Sunday.
Sign-in help for an existing account is Forgot password on the sign-in page.

Pool Registration
pool@triwithms.com
```

Do not put a temporary password or a reset code in this template. Those stay on the existing Admin and Forgot password paths.

### Forgot password and account security

Survive Sunday already has **Forgot password** on Sign in. It emails a 6-digit code through the app’s transactional sender. Prefer that path for account recovery.

Use a password-reset email **from** `pool@triwithms.com` only if that in-app reset is unavailable. Preconditions:

- The address already completed the inbound handshake.
- SPF and DKIM pass for that From identity.
- The message body carries the code or link. The subject stays generic.

Rules for any account change that arrives by email:

- Never put passwords, reset codes, or other secrets in the subject line. Subjects are logged, previewed, and forwarded more widely than bodies.
- Staff verify the sender identity before changing an account. A message that asks to change email, password, or pool membership must come from the address already on the account, or staff must confirm out of band (a known phone number, or the person signing in).
- Do not accept a registration email as proof that the sender may take over someone else’s existing login.

### Transition plan for broadcasts and weekly updates

Follow this order. Skip a step and junk-folder rates return.

1. **Confirm the handshake and authentication.** Inbound mail to `pool@` works. Replies show SPF and DKIM pass. DMARC is at least `p=none` and collecting reports.
2. **Keep the app’s transactional provider for app-sent mail.** Survive Sunday already sends through that provider (Resend, configured with `RESEND_FROM_EMAIL`). Free Zoho has no IMAP/POP and is a poor bulk SMTP path for the app. If a host requires SMTP instead of the current API, use Zoho Mail Lite (or the current provider’s SMTP) rather than Forever Free. Visible From in either case: `Pool Registration <pool@triwithms.com>`.
3. **Align DNS for every sender.** Keep a single SPF TXT. Add the transactional provider’s published `include:` beside Zoho’s, using the exact token that provider documents. Shape: `v=spf1 include:zohomail.com include:<provider-include> ~all`. Publish DKIM for the service that actually signs the message. Zoho’s DKIM does not cover mail that Resend or another provider sends.
4. **Pilot, then the full pool.** Send the first weekly update only to addresses that completed the handshake and that staff can check (their own Gmail, Outlook, and one mobile client). Read the raw headers. Expand to the pool only after those land in the inbox.
5. **Watch complaints, then tighten DMARC.** Track bounces and spam complaints on the sending service. Stay on `p=none` until reports are clean. Move to `p=quarantine`, then `p=reject`, only after legitimate mail is aligned. Point `rua` at a mailbox someone reads.

### Phase 3 success criteria

- [ ] Staff have a written triage path and the confirm reply is sent from Pool Registration.
- [ ] New participants are attached through existing Admin add-user or join-link flows. Passwords are not sent inside the registration subject.
- [ ] Forgot password remains the default recovery path. A `pool@` reset mail exists only as a fallback after the handshake, with no secret in the subject.
- [ ] Account-change requests are matched to the address on the account, or confirmed out of band.
- [ ] A pilot weekly message to known-good addresses arrives in the inbox with SPF, DKIM, and From alignment.
- [ ] SPF is still a single TXT and includes every service that sends as `@triwithms.com`.
- [ ] DKIM is published for the transactional sender, not only for Zoho.
- [ ] Bounce and complaint review has an owner. DMARC stays at `p=none` until that review is clean.

## 5. Roadmap / open decisions

These are unresolved. Do not treat a default below as a build instruction until the owner picks one.

| Decision | Options | Notes |
| --- | --- | --- |
| Landing-page address | Subdomain `register.triwithms.com`, or a path such as `/join` on a site that already exists | Subdomain needs its own DNS and host. A path is simpler if a static site on `triwithms.com` already exists. Either way, the page stays outside the Survive Sunday app deploy. |
| What a registration email creates | Manual Admin only, or a later automation that creates the app user | v1 is manual. Automation needs a defined match between the From address and the pool, duplicate handling, and a decision about who sets the password. |
| Referral tag schema | Free-text `ref`, a fixed code list, or no referral in v1 | The starter copies `?ref=` into the body as `Referral:`. Staff should ignore unknown codes until a list exists. |
| Relationship to existing Survive Sunday invite and Join links | Handshake only, handshake plus a shared join link in the confirm reply, or handshake that carries `?invite=` for a personal seat | Today, **Admin → Pool → Shared join link** lets a person choose email, password, and display name for one pool. A personal join link attaches credentials to a seat that already exists. **Admin → Players → Add user** creates the login and the administrator texts the temporary password. The registration email does not replace those links. It is the step that makes later pool mail deliverable. The confirm reply can point at a join link the administrator already created. |

Recommended sequence once the open items are decided: finish Phase 1, publish the Phase 2 page, run registration by hand, then pilot outbound mail in Phase 3.

## 6. Non-goals

This pull request does not:

- Change DNS at GoDaddy or any other host
- Create or configure a Zoho organization, mailbox, SPF, DKIM, or DMARC record
- Deploy the landing page
- Change Survive Sunday application code, environment variables, Help content, or `README.md`
- Send pool mail, standings, or a test message

Implementation of Phases 1–3 is follow-on work, each with its own change and its own check against the success criteria above.
