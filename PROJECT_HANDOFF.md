# HR Fieldwork

This file is the shared project notebook for the California employer review kits. Read the latest copy on GitHub before starting a task. Agents with write access to the project can edit the same file. A downloaded copy is a snapshot.

**Live site** [HR Fieldwork](https://mary-gendron.vercel.app)  
**Canonical notebook** [PROJECT_HANDOFF.md on main](https://github.com/starlos290/mary-gendron/blob/main/PROJECT_HANDOFF.md)  
**Project** [Mary Gendron on Vercel](https://vercel.com/meaphase-projects/mary-gendron)

## How to leave a handoff

1. Read Decisions, Open work and Messages. Start from the latest main branch.
2. Add your name and task under Active work. If two agents need the same file, agree on ownership in Messages.
3. After a change, record the date, result, files or commit, verification and next owner. Move resolved items out of Open work. Keep earlier decisions and message history.
4. Pull the current version before saving. Merge concurrent entries and preserve other agents’ work.
5. The repository is public. Use fictional examples in this notebook. Keep employee records, credentials, paid kit contents and confidential business discussions in authorized private systems.

## Project and audience

California small business owners handling HR themselves are the primary audience. The secondary audiences are HR practitioners and managers who want a repeatable process for their team. The product consists of three downloadable skills used in the buyer’s own Claude or ChatGPT account. The seller does not receive the user's review inputs. The chosen AI provider processes what its user submits.

## Website and source

The homepage is `index.html`. The four landing pages are static HTML in `hr-kits/`. Shared presentation and interactions live in `hr-kits/assets/`. The Vercel project uses clean URLs. Each page contains its own static header and footer. Apply shared navigation changes to all five pages. Fonts are included locally with their licenses.

**Homepage** [HR Fieldwork](https://mary-gendron.vercel.app/)  
**California** [California Employer Review Kit](https://mary-gendron.vercel.app/hr-kits/california)  
**Payroll** [Payroll Review Kit](https://mary-gendron.vercel.app/hr-kits/payroll)  
**Handbook** [HR and Handbook Audit Kit](https://mary-gendron.vercel.app/hr-kits/handbook)  
**Bundle** [California Employer Review Bundle](https://mary-gendron.vercel.app/hr-kits/bundle)  
**Existing training** [Manager training](https://mary-gendron.vercel.app/ftm-core-value-manager-training)

## Decisions

1. HR Fieldwork is the public brand. Credit HR consultant Mary Gendron as the creator in the About section. The print studio scene is generated editorial imagery and does not depict Mary or a customer. The earlier editions below are retained as release history.
2. The storefront is an offer preview. The proposed prices are $197 for payroll, $247 for handbook, $297 for California and $497 for the bundle. All three individually total $741. The proposed bundle difference is $244.
3. Make examples inspectable. Label illustrative records and walkthroughs as fictional. Replace them with actual skill runs on fictional records once verified. Do not claim that the illustrations are generated reports.
4. The seller provides educational HR tools. Keep legal determinations with qualified counsel. Avoid promises about compliance, penalty reductions, lawsuit outcomes, time savings or client results.
5. Keep digital kit checkout closed until the downloadable products, license, approved terms and fulfillment are ready. The launch list collects email addresses, selected kit and approved campaign source tags. The storefront has no payment collection or employee document upload.

## Active work

No open claims at the time of the initial handoff. Append the owner, task and expected deliverable when picking up work.

## Open work

1. **Product owner.** Confirm launch prices, final kit names and the contents of each paid ZIP. Decide on the proposed 14 day refund, 30 day upgrade credit, annual California edition and team license.
2. **HR reviewer.** Supply the dated California coverage list, update owner and employer scope. Validate actual runs against fictional inputs in Claude and ChatGPT. Provide approved input and output pairs for the proof section and recorded demo.
3. **Domain owner.** Supply the chosen domain. Attach it to the existing Mary Gendron project, verify DNS and HTTPS, and test the homepage, the four marketing routes and the original training route on the chosen host.
4. **Commerce owner.** Once the offer is approved, connect each product to the correct checkout and private zip. Validate a purchase through delivery, receipt, support and the approved refund process.
5. **Creative owner.** After approval, use the verified demo to develop the angles, screen recorded VSL, final landing page copy and ad hooks.

## Messages and release notes

### 2026 11 19 | Web build | Initial storefront

Added the homepage, three product pages, the bundle detail page, mobile navigation, accessible sample tabs, and FAQs. The original manager training lives on its existing route. The new public pages identify planned prices and fictional examples. Next owner is the product owner for offer confirmation and demo inputs.

### 2026 11 19 | Design | Review desk redesign

Replaced the illustrated book storefront with a documentary payroll image, an accessible magnifying lens, and three interactive fictional case files. Each file discloses a specific review question. The kit and bundle pages use individual annotated records and step by step walkthroughs. Shared visual assets live in `hr-kits/assets`.

Design references are MotionSites’ [Interactive Discovery](https://motionsites.ai/?prompt=interactive-discovery) for the lens and [Lumenvox Atelier](https://www.motionsites.ai/lesson/build-animated-website-with-ai) for the masked headline entrance. The animated selection indicator and arrow key behavior adapt [Animated Tabs by educalvolpz](https://21st.dev/@educalvolpz/components/animated-tabs) to plain JavaScript. The desk supports keyboard navigation, touch and reduced motion.

### 2026 11 19 | Expert product pages and launch list

The homepage and four kit pages share a static masthead and footer. On the homepage the anchor links are `#mary`, `#sample`, `#how`, `#kits`, `#privacy`, `#faq` and `#launch-list`. The older `#desk` and `#library` links lead to the corresponding sections. The printable Fresno excerpt contains only the supplied fictional figures. Mary’s portrait, bio and credentials use the literal placeholders [PHOTO], [BIO] and [CREDENTIALS]. The product owner should replace those with approved material.

The signup form posts to `/api/launch-list`. The Node function uses a private Vercel Blob store named `mary-gendron-launch-list` attached to the Mary Gendron project. Each normalized email maps to one private record. Production and preview entries use separate folders. Only the email address, last request time and launch notification purpose are recorded. Both standard form posts and enhanced submissions are supported. The owner can access the list from the project’s private storage dashboard. Never paste contacts or access tokens into this repository. Sending launch emails is a separate operation.

### 2026 11 19 | Printable report and downloadable findings sheet

The five pages now use a compact masthead, a mobile menu, DM Sans headings and blue signup buttons. The homepage shows the Fresno pay shortfall as a worksheet excerpt. The public sample files are `hr-kits/assets/samples/fresno-payroll-review.pdf` and `hr-kits/assets/samples/fresno-payroll-review.xlsx`. Both cover three of the seven findings supplied for the fictional 15 person store. The workbook includes editable notes and follow up status. These samples are free to download without signing up. They do not contain the paid review skills.

The payroll, handbook and California pages each link to their own findings section. The bundle compares all three prices and links to the individual kits. Keep [PHOTO], [BIO], and [CREDENTIALS] visible until the owner supplies them.

### 2026 11 19 | HR Fieldwork brand and traffic landing pages

HR Fieldwork is the primary brand on all five pages. Mary appears as the kit creator. Her portrait, bio and credentials placeholders are retired from public pages. The domain name is the existing host and can be changed when the owner supplies a brand domain.

The main wordmark, reversed lockup, standalone mark, favicons and downloadable logo kit live in `hr-kits/assets/brand/`. The visual identity combines a field furrow F mark, Instrument Serif titles, DM Sans body, evergreen, warm paper, and saffron buttons. Original generated visuals show an illustrative print shop scene, the files on a worktable, and four custom linocut illustrations representing each digital kit. The media are in `hr-kits/assets/images/`. Share images are in `hr-kits/assets/social/`. Inspiration included [Patagonia Workwear](https://www.patagonia.com/workwear/) for working environments and [Field Notes](https://fieldnotesbrand.com/) for a visually distinguishable product catalog.

The homepage and four kit pages accept launch list signups in place. Private records include the email, time, signup purpose, signup page, selected kit, landing page and recognized campaign tags. The first landing page and campaign are carried within the tab on internal clicks. A fresh tagged entry replaces previous tags. Successful enhanced submissions emit a local signup event without personal data. No Meta or Google advertising tags are installed. Ads have not been launched. A repeated signup refreshes its existing private record. The form itself does not send the launch email.

The current conversion goal is joining the launch list. Link each campaign directly to its relevant kit. All five pages have a canonical, a social preview and an entry in sitemap.xml. On a domain change, update those absolute URLs and robots.txt. Checkout and paid digital delivery require the approved product files, terms and payment setup. Keep those files in private storage.

### 2026 11 19 | Free sample delivery

The homepage and Payroll Review page offer a single [free Fresno download](https://mary-gendron.vercel.app/hr-kits/assets/samples/hr-fieldwork-payroll-sample.zip). It contains the existing fictional PDF report and editable Excel worksheet. Both are also available individually at their existing URLs. The launch form returns a useful next step after the address is saved. Payroll, bundle and homepage signups get the sample ZIP. Handbook and California signups get the related fictional review. Native and enhanced forms use the same destinations.

### 2026 11 19 | Checkout preview

The draft branch adds `/checkout/preview` and `/checkout/complete`. The storefront continues to collect launch notices. The purchase button becomes available for configured kits in preview. The free Fresno sample is accessible independently. A hosted Stripe test session grants access to its matching private ZIP only when payment is verified. The order records the edition so a later edition change preserves access to the purchased archive.

**Preview configuration.** Select the HR Fieldwork merchant’s Stripe sandbox. Set `STRIPE_SECRET_KEY` to its test key in the Vercel preview environment. Set `HR_FIELDWORK_EDITION` to a version such as `sample-v1`. Set `STRIPE_PRICE_PAYROLL`, `STRIPE_PRICE_HANDBOOK`, `STRIPE_PRICE_CALIFORNIA`, and `STRIPE_PRICE_BUNDLE` to the intended one time USD test prices. Only configure prices for kits with private ZIPs already staged. Use private Vercel Blob storage and upload each test archive as `commerce-preview/<edition>/<sku>.zip` with the content type `application/zip`. Allowed sku values are `payroll`, `handbook`, `california`, and `bundle`. Keep credentials in environment settings. Verify a complete test purchase and download in the designated merchant sandbox. Local tests can be run with `node --test tests/commerce.test.cjs`.

**Moving to paid sales.** The current implementation deliberately accepts only test keys in preview. The product owner still needs to supply the release archives, merchant and approved buyer terms. A production implementation must also support reliable fulfillment after an interrupted return from Stripe, receipts, customer support and the agreed refund process. The draft does not send purchase email.

### Entry format

Date and agent / Task or question / Change or decision / Evidence or verification / Next owner.
