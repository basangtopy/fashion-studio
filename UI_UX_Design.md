FASHION STUDIO PLATFORM — COMPLETE UI/UX DESIGN BRIEF

You are designing a complete web platform for a high-end Nigerian fashion design business.
This is not a template, a portfolio site, or a landing page. It is a full-service business
platform with a public-facing marketing surface, a client self-service dashboard, and a
comprehensive admin panel. Every section must be designed with equal care and intentionality.

═══════════════════════════════════════════════════════════
SECTION 0 — CRITICAL DESIGN MANDATE
═══════════════════════════════════════════════════════════

DO NOT produce:

- Minimalist white-background fashion clichés
- Oversized serif hero text on a full-bleed image
- Generic grid-of-photos portfolio layouts
- Standard dashboard tables with blue accent colours
- Any design that resembles a Squarespace or Shopify template

DO produce:

- A design with a clear, distinctive visual personality that could only belong to this brand
- Layouts that feel architectural — structured, considered, with intentional negative space
- A colour story, not just a palette — colours that shift meaning and weight across contexts
- Motion that is choreographed, not decorative — every animation serves orientation or delight
- Typography that works as a visual element, not just a carrier of words
- A dashboard that feels like a bespoke tool, not a generic SaaS admin panel
- A client experience that feels like a luxury concierge service, not a checkout flow

The design must feel simultaneously:

- Aspirational and premium (this is a creative fashion business)
- Warm and personal (clients have long-term relationships with this designer)
- Efficient and trustworthy (real money and real orders are being managed)
- Nigerian in sensibility — not a Western fashion brand template with a Lagos address

═══════════════════════════════════════════════════════════
SECTION 1 — VISUAL IDENTITY & DESIGN SYSTEM
═══════════════════════════════════════════════════════════

COLOUR SYSTEM

Primary: #C2185B (deep rose/magenta — the brand's signature)
Secondary: #1A1A2E (near-black navy — weight, authority, structure)
Accent: #F8E8F0 (blush — warmth, femininity, breath)
Surface 1: #FFFFFF (pure white — clarity)
Surface 2: #FAFAFA (off-white — subtle depth)
Surface 3: #F4F0F8 (lavender tint — for cards on light backgrounds)
Text Dark: #0D0D0D (near-black — body text)
Text Mid: #555555 (secondary text, labels)
Text Light: #999999 (placeholders, captions)
Status colours:
Success: #2E7D32 (forest green)
Warning: #E65100 (deep amber)
Error: #C62828 (deep red)
Info: #1565C0 (deep blue)
Order status colours (use these precisely — they carry meaning):
PENDING_REVIEW: #FFF8E1 bg / #F9A825 text
AWAITING_CLIENT_RESPONSE: #E3F2FD bg / #1565C0 text
AGREED_AWAITING_PAYMENT: #E8F5E9 bg / #2E7D32 text
IN_PROGRESS: #F3E5F5 bg / #6A1B9A text
CUTTING: #EDE7F6 bg / #4527A0 text
SEWING: #E8EAF6 bg / #283593 text
FINISHING: #E0F7FA bg / #00695C text
AWAITING_FINAL_PAYMENT: #FFF3E0 bg / #E65100 text
READY_FOR_PICKUP: #F9FBE7 bg / #558B2F text
OUT_FOR_DELIVERY: #E8F5E9 bg / #1B5E20 text
COMPLETED: #1A1A2E bg / #FFFFFF text
CANCELLED: #FFEBEE bg / #B71C1C text

TYPOGRAPHY

Display: A humanist geometric sans — something with warmth but structural elegance
(think: DM Sans, Plus Jakarta Sans, or Sora at large sizes)
Used for: hero headlines, section titles, large stats
Weight: 700-800. Letter-spacing: -0.02em to -0.04em at large sizes.

Body: The same family, lighter weight. 400 for body, 500 for emphasis, 600 for UI labels.

Accent/Label: A geometric mono or tabular variant for: - Order numbers (ORD-2026-0042) - Prices (₦42,500) - Status codes, timestamps - Dashboard stats
This creates clear visual distinction between human language and data.

Type scale:
Type scale (Fluid CSS `clamp()` recommended for seamless scaling):
xs: 11px / 12px
sm: 13px / 14px
base: 15px / 16px
md: 18px / 20px
lg: 24px / 28px
xl: 32px / 38px
2xl: 48px / 56px
3xl: 64px / 72px
4xl: 80px+ / tight leading

SPACING & LAYOUT

8px base grid throughout.
Page max-width: 1280px, centered, with 24px (mobile) / 48px (tablet) / 80px (desktop) horizontal padding.
Section vertical rhythm: 80px (mobile) / 120px (tablet) / 160px (desktop) between major sections.
Use CSS `gap` properties and CSS Grid to avoid broken layout flows.

ELEVATION & DEPTH

Avoid flat design and avoid heavy drop shadows. Use instead:

- Subtle borders (1px, rgba(0,0,0,0.06)) for card definition on light surfaces
- Layered backgrounds (slightly different surface tones) to create depth without shadows
- Use shadow only for modals, dropdowns, and floating elements

MOTION PRINCIPLES

Duration scale:
Micro: 100ms (state changes: hover, active, focus)
Short: 200ms (reveals: tooltips, dropdowns)
Medium: 400ms (panels: sidebars, drawers, modals)
Long: 600ms (page sections: scroll-triggered reveals)
Cinematic: 800ms+ (hero sequences, empty states, first-load)

Easing:
UI transitions: cubic-bezier(0.16, 1, 0.3, 1) — fast in, slow out (spring-like)
Page reveals: cubic-bezier(0.25, 0.46, 0.45, 0.94) — ease-out
Exit: cubic-bezier(0.55, 0, 1, 0.45) — ease-in

Animation vocabulary (use consistently):

- Fade + rise (8–16px Y offset): for content loading in from below
- Fade + scale (0.97 → 1.0): for cards and modals appearing
- Clip reveal (height 0 → auto): for accordions and expandable content
- Stagger: when multiple items appear, delay each by 60–80ms
- Luxury Hover Lift (Media): Garment images cross-fade or loop a subtle 2-second video/cinemagraph preview on hover, offering premium interactivity.
- Focus ring: 2px ring in Primary with 2px offset, animated in on focus
- Custom Luxury Cursor: A distinct custom cursor dot that expands into a ring over clickable elements, and transforms into text like "DRAG" over horizontal carousels.

═══════════════════════════════════════════════════════════
SECTION 2 — SHARED COMPONENTS (design every state)
═══════════════════════════════════════════════════════════

Design every component in these states: default, hover, focus, active, disabled, loading, error.

NAVIGATION (Desktop)

- Fixed top bar, 64px height
- Fixed top bar, 64px height
- Left: Logo (wordmark or custom mark in Primary colour)
- Centre: Navigation links — Home, Catalog, Portfolio, Testimonials. _The "Catalog" link triggers an expansive 'Mega-Menu' dropdown revealing featured style images alongside text categories._
- Right: Shopping Cart Icon (with unread item count badge), Book Appointment CTA button (Primary filled), Login/Avatar
- Background: Glassmorphism / Frosted Glass effect (semi-transparent Surface 1 with high backdrop-blur), fully transparent over hero sections
- Transition: smooth opacity and blur change on scroll threshold

NAVIGATION (Mobile)

- 56px top bar with logo, Shopping Cart Icon (with badge), and hamburger
- Full-screen overlay menu with staggered link reveal animation
- Links large (32px), one per line, with subtle left-border accent on hover
- CTA button at bottom of mobile menu

SIDEBAR (Admin + Client dashboards)

- Desktop: fixed left sidebar, 240px wide
- Mobile: slides in from left as drawer
- Sections grouped with category labels (Operations / Catalog / Finance)
- Active item: Primary colour left border (4px) + light Primary tint background
- Icons: consistent icon set (Lucide or Phosphor), 20px, aligned with labels
- Bottom of sidebar: user avatar, name, role badge, logout link
- Sidebar background: Secondary (#1A1A2E) with white text

BUTTONS
Primary: #C2185B bg, white text, 6px radius, 14px/600, 12px 24px padding
Secondary: transparent bg, 1.5px #C2185B border, #C2185B text
Ghost: transparent bg, no border, #C2185B text
Danger: #C62828 bg, white text
All buttons: hover state shifts bg by 10% darker, 200ms, cursor pointer
Loading state: spinner replaces label, button disabled, same width maintained

INPUT FIELDS
Height: 44px
Border: 1.5px solid #E0E0E0, 6px radius
Focus: border changes to Primary, focus ring (2px Primary, 2px offset)
Error: border changes to Error colour, error message fades in below
Label: above input, 13px/500, Text Dark
Placeholder: Text Light
Prefix/suffix slots: for ₦ currency prefix, icons, etc.

BADGES / STATUS PILLS
Use the order status colour system from Section 1
Shape: fully rounded (pill), 6px 12px padding, 12px/600 text
Small variant: 4px 8px, 11px text (for compact list views)

CARDS
Surface 1 bg, 1px border (rgba(0,0,0,0.06)), 12px radius
Hover: translateY(-2px), 200ms, border colour slightly darkens
Content padding: 24px

NOTIFICATIONS / TOASTS
Slide in from top-right, 320px wide, 12px radius
4 variants: success (green left border), warning (amber), error (red), info (blue)
Auto-dismiss after 4 seconds with progress bar animation at bottom
Manual dismiss X button

MODALS
Backdrop: rgba(0,0,0,0.5) blur(4px)
Modal panel: Surface 1, 12px radius, max-width 480px (small) / 640px (medium) / 800px (large)
Animation: scale(0.97) + fade in → scale(1), 300ms spring easing
Header: title (18px/600) + optional subtitle + X close
Footer: action buttons right-aligned

CONFIRMATION / DESTRUCTIVE MODALS
Required for all destructive or critical state-change actions (e.g., Delete Item, Cancel Order, Reject Payment, Remove Image, Archive Style).
Layout: Small modal (480px).
Icon: Warning or Error icon (Error tint) centered at the top.
Content: Clear headline ("Are you sure you want to delete this style?"), explanatory subtext ("This action cannot be undone and will remove it from the public catalog.").
Footer: "Cancel" (Secondary) + "[Destructive Action]" (Danger style) buttons.

SHOPPING CART DRAWER
Slides in from right, 400px wide, full height
Header: "Your Cart" + item count + X close
Content: Scrollable list of cart items. Each item: image thumbnail, name, selected size, qty stepper (+/-), price, remove (trash) icon.
Footer: Subtotal, VAT calculation note, "Proceed to Checkout" primary button.
Empty state: "Your cart is empty", "Start browsing" button.

EMPTY STATES
For every list/table that can be empty, design a specific empty state:

- Illustrated icon (SVG, on-brand colours)
- Heading (what's empty)
- Subtext (why it's empty and what to do)
- Optional CTA button
  Examples: no orders, no messages, no portfolio items, no notifications

LOADING STATES

- Skeleton loaders for all list/table/card views (shimmer animation)
- Inline spinner for button loading
- Full-page loading: subtle centered brand mark animation on first load

═══════════════════════════════════════════════════════════
SECTION 3 — PUBLIC PAGES (SEO-critical, conversion-focused)
═══════════════════════════════════════════════════════════

PAGE 1 — HOMEPAGE (/)

HERO SECTION
Full viewport height (100dvh).
DO NOT use a full-bleed background photo. Instead:

- Left half (60%): rich Secondary (#1A1A2E) background
  - Large display headline (3xl-4xl) in white, tightly leaded
  - Tagline in Accent tinted text (F8E8F0), lighter weight
  - Two CTAs: "Explore Our Styles" (Primary filled) + "Book a Fitting" (outlined white)
  - Animated word cycling: "Designed for you" → "Crafted in Lagos" → "Made to last"
    (words fade out and new words fade+rise in, 3-second loop)
- Right half (40%): a geometric composition, NOT a photo
  - Overlapping rectangles in varying opacity Primary/Accent tones
  - A single high-quality garment image in a portrait frame
    with a frame offset (the image sits slightly off-centre within its container,
    with coloured geometric shapes peeking behind it)
  - Parallax Dept Scrolling: The geometric shapes and primary portrait move at slightly different Y-axis speeds during user scroll, establishing profound depth and editorial magazine pacing.
  - Floating badge: "Est. [Year]" or a quality/craft indicator
    On mobile: stacks vertically, image section becomes a horizontal strip above the headline

PROCESS / HOW IT WORKS SECTION
Headline: "Three ways to work with us"
Three distinct model cards side by side:
Card 1 — Model 1: "You bring the fabric"
Card 2 — Model 2: "We source it for you"
Card 3 — Model 3: "Ready to wear now"
Each card: - Icon or illustrated number (large, in Primary/tinted) - Short headline - 2–3 sentence explanation - "Learn more" ghost link
Cards reveal with stagger on scroll entry.
On mobile: horizontal scroll carousel.

FEATURED STYLES SECTION
Headline: "Styles we create"
A masonry-style or editorial grid (NOT a uniform grid) of 4-6 style images.
Alternate sizes: one large portrait, two square, one wide landscape.
Each item: hovering reveals a dark overlay with the style name and a "View" arrow.
Section ends with "View all styles →" link.

READY-TO-WEAR PREVIEW SECTION
Dark background (Secondary). Headline in white.
Horizontal scroll on all viewports — cards slide smoothly.
Each card: garment image, name, price in Accent mono font, size availability pills, "View" button.
Feels like a curated shop moment, not a product catalogue.

PORTFOLIO / WORK SECTION
Headline: "From our studio to your wardrobe"
An editorial layout — NOT a simple grid. Consider:

- One large featured piece (full-width or 2/3 width)
- Smaller supporting pieces alongside
- Alternating layout rhythm as you add more pieces
- Each piece: hover reveals category and a brief description
  Section: "See the full portfolio →" link.

TESTIMONIALS SECTION
Background: Surface 3 (lavender tint) or a textured Secondary.
NOT a carousel with dots. Instead:

- 3 testimonials visible simultaneously on desktop, stacked on mobile
- Each testimonial: client name (first name only), rating stars, review text
- Large decorative quotation mark in Primary colour behind each card
- Reveal with stagger and subtle rotation correction animation (slight tilt → straight, 0.5deg)

MEASUREMENT APPOINTMENT CTA SECTION
Full-width band with Primary background.
Large headline: "Your measurements, your fit — every time."
Subtext about the bespoke measurement process.
CTA: "Book a Fitting" (white filled button).
Subtle diagonal pattern or grain overlay on the Primary background for texture.

FOOTER
Dark background (Secondary).
4-column layout on desktop, stacked on mobile:

- Column 1: Logo, tagline, social links (Instagram icon prominent)
- Column 2: Quick links (Home, Catalog, Portfolio, Testimonials)
- Column 3: Client links (My Orders, My Measurements, My Profile)
- Column 4: Contact info, WhatsApp link, email
  Bottom bar: copyright, privacy policy, terms (minimal text)

---

PAGE 2 — CATALOG — STYLES (/catalog/styles)

Sticky filter bar at top:

- Category filter pills (horizontally scrollable on mobile)
- Model availability toggles: Model 1 / Model 2 / Both
- Search input (inline, expands on focus)
  Filters animate in/out — results reflow with fade+scale animation.

Results grid: 3-column on desktop, 2 on tablet, 1 on mobile.
Results grid: 3-column on desktop, 2 on tablet, 1 on mobile.
Each style card: - Image (4:5 portrait ratio) - Style name (medium weight) - Category badge - Model availability indicator (small M1/M2 pills) - "Quick View" button appears on hover centered over the image, skipping page loads to show details in a popup modal.

Individual Style Page (/catalog/styles/:id) - Large image gallery: main image + thumbnails with smooth switching - Image zoom on hover (CSS transform scale on the image within a clipped container) - Style name, description, category, model availability - Fabric notes (if any) - "Order this style" CTA — large Primary button - Related styles section below

---

PAGE 3 — CATALOG — READY-TO-WEAR (/catalog/ready-to-wear)

Filter bar: category, size availability, price range (slider or range inputs), in/out of stock toggle.

Results grid: same card structure as styles.
Each card additionally shows: - Price (₦ + number, mono font, prominent) - Stock status pill (IN_STOCK: green, LOW_STOCK: amber, OUT_OF_STOCK: red/greyed out) - Size pills (greyed out if not available)

Individual Item Page (/catalog/ready-to-wear/:id) - Image gallery - Price (large, prominent, mono font) - Available sizes: size selector (pill buttons, selected = Primary, out of stock = strikethrough) - Quantity selector (+/-) - Fabric details, care instructions - Stock status indicator (updates dynamically based on quantity vs actual stock) - Buy Action Group: "Add to Cart" (Secondary style, opens Cart Drawer) + "Buy Now" (Primary style, auto-adds to cart and instantly redirects to checkout flow) - Size guide modal (triggered by "Size Guide" link near size selector)

---

PAGE 4 — PORTFOLIO (/portfolio)

Hero: short text intro — "Work from our studio" — on a dark background, full-width.

Layout: Horizontal Native Scroll (Lookbook experience).
Think of how a high-end magazine layout works — wide horizontal scroll containing varied sizes, intentional white space, behaving like swiping pages.
Items are grouped by category with a subtle category label appearing as a vertical rule with text spanning boundaries.

Each portfolio item: - Image (quality, full-bleed within its container) - On hover: dark overlay fades in with title and category, and an expand icon - Clicking opens a lightbox modal with larger view + description

Filter: Category filter at top (pill-based), animated reflow.

Lightbox modal: - Dark overlay, close button top-right - Large image, left or top - Right or below: title, category, description (no client names — privacy) - Previous/Next navigation

---

PAGE 5 — TESTIMONIALS (/testimonials)

Hero: headline + average rating stat (large number + stars).

Masonry layout of testimonial cards (varying heights based on review length).
Each card: rating stars, review text, client first name, date.
Featured testimonials (isFeatured: true) get a larger card variant.

Filter by rating (optional pill filter at top).

CTA at bottom: "Share your experience" — opens a review submission form in a modal.
Review submission form: star rating (interactive), name (optional), review text.

---

PAGE 6 — AUTH PAGES (/login, /signup)

Full-height, two-column layout:
Left column (55%): animated brand panel - Secondary background - Large decorative typography or geometric composition - Rotating micro-copy: "Made for you." → "Worn with pride." → "Crafted with care." - Brand testimonial quote fades in at bottom
Right column (45%): form panel, white/light background, vertically centred

Login form: - Email input - Password input (show/hide toggle) - "Forgot password?" link - Login button (full-width) - Divider: "or continue with" - OAuth buttons: Google, Facebook, Twitter/X (icon + label, outlined style) - "Don't have an account? Sign up" link
_Note: Handle 429 Too Many Requests (Rate Limiting) with a graceful notification toast if user spams login._

Signup form: - Full name, email, phone (with +234 prefix), password - Sex selector (MALE / FEMALE / OTHER — styled as segmented control, not dropdown) - Terms checkbox - "Sign up" button - OAuth options - "Already have an account? Log in" link

Email Verification State: Post-signup, a dedicated full-page screen "Check your email" with an illustration.
Email Verification Success: A `/verify-email?token=` route that shows a success animation and auto-redirects to login/dashboard.

Password Reset Flows:

- "Forgot Password" Form: Enter email, "Send Reset Link" button.
- "Check your email" confirmation screen.
- "Reset Password" Form: (`/reset-password?token=`) Enter new password, confirm new password, "Save Password" button.

Mobile: full-screen form only (no brand panel), brand mark at top.

═══════════════════════════════════════════════════════════
SECTION 4 — CLIENT DASHBOARD (authenticated)
═══════════════════════════════════════════════════════════

Layout: Fixed sidebar (240px, Secondary bg) + main content area.
Mobile: Sidebar becomes a bottom navigation bar (5 icons max) + hamburger for full menu.

Top bar in content area:

- Page title (left)
- Notification bell (with unread count badge) — clicking opens notification drawer from right
- User avatar + name (right)

NOTIFICATION DRAWER (slides in from right, 360px wide, full height)

- Layered over content with backdrop
- Header: "Notifications" + "Mark all read" link
- List of notifications, grouped by date (Today / Yesterday / Earlier)
- Each notification: icon (type-based), title, message, timestamp, unread dot
- Clicking a notification: marks as read, navigates to relevant page
- Empty state: illustrated empty bell

SIDEBAR NAVIGATION (Client)
Dashboard (home icon)
My Orders (shopping bag icon)
Measurements (ruler icon)
Payments (credit card icon)
Chat (message icon) — unread count badge
Profile (user icon)
── bottom ──
Logout

---

CLIENT PAGE 1 — DASHBOARD OVERVIEW (/client/dashboard)

Welcome header: "Good morning, [Name]" (time-aware greeting)
Subtitle: current date

Stat cards row (4 cards): - Active Orders (count) - Total Paid (₦ amount) - Outstanding Balance (₦ amount) - Upcoming Appointment (date or "None booked")
Each stat card: icon, label, value (large, mono font), subtle trend or context line.
Cards animate in with stagger on page load.

Active Orders section:
Order cards in a 2-column grid (1 on mobile).
Each order card: - Order number (mono, top-left) - Status pill (coloured, prominent) - Order type badge (Model 1 / Model 2 / Ready-to-Wear) - Style name or item name - Progress indicator: a horizontal progress bar or step dots showing the
current stage in the order lifecycle (steps: Review → Agreement → Payment →
Production → Delivery → Complete) - "View order" link - Unread message indicator if chat has unread messages
Hover: card lifts.

Quick Actions row: - "Place New Order" - "Update Measurements" - "Book Appointment" - "View Portfolio"

Recent Notifications strip (last 3, with "View all" link).

---

CLIENT PAGE 2 — ORDERS (/client/orders)

Tab bar: All | Active | Completed | Cancelled
Each tab filters the order list, with count badges.

Order list: full-width cards (not a table on mobile).
Each card: - Left: order number + order type tag - Centre: style/item name, status pill, progress steps (compact horizontal) - Right: total agreed fee (if set), outstanding balance (if any), date placed - Arrow → to detail page
Sorting: Date (newest first, toggle)

ORDER DETAIL PAGE (/client/orders/:id)

    Breadcrumb: My Orders / ORD-2026-0042

    Two-column layout on desktop (left: 65%, right: 35%), stacked on mobile.

    LEFT COLUMN:

    Order Status Card:
      - Large status pill at top
      - Visual timeline: vertical stepper with all stages, current stage highlighted,
        completed stages checked, future stages greyed
      - Each step has timestamp if completed
      - Latest status note (from admin) shown below the active step

    If status is AWAITING_CLIENT_RESPONSE:
      - Quote card: highlighted in Accent, showing proposed fee
      - Two large action buttons: "Accept Quote" (Primary) + "Decline & Negotiate" (Secondary)
      - Decline opens inline form for negotiation note

    Order Details Card:
      - Order type, fulfillment method
      - **For Model 1 & 2**: Style name, Measurements linked (yes/no indicator), Custom description, Fabric notes.
      - **For Model 3 (Ready-to-Wear)**: A scrollable list/array of Order Items (reflecting the cart checkout). Each item shows thumbnail, product name, selected size, quantity, and price locked at purchase.
      - Delivery address (if delivery)

    Payment History Card:
      - List of all payments: date, amount (mono), type, status pill
      - Total paid vs total agreed fee: visual progress bar
      - Outstanding balance (if any) in Warning colour
      - "Submit Payment" button (if in payable status)

    Payment Submission:
      - Appears as a modal or inline slide-down form
      - Amount input (₦ prefix), payment type selector
      - Proof upload: drag-and-drop zone + click to upload, preview of uploaded image
      - Submit button

    RIGHT COLUMN:

    Chat Panel:
      - Order chat — full message history in scrollable container
      - Messages: client messages right-aligned (Primary bg), admin messages left-aligned
        (Surface 3 bg), timestamps below each message
      - Read receipt indicator on client messages (single tick = sent, double tick = read)
      - Attachment: image thumbnails in messages (click to view full size)
      - Input area: text field + attachment icon + send button
      - Real-time: new messages appear without page refresh (SSE)
      - Typing indicator (optional visual enhancement)

    Back to top of page: floating "↑" button appears on scroll.

---

CLIENT PAGE 3 — MEASUREMENTS (/client/measurements)

Header: "Your Measurements" + last updated date

If no measurement record exists:
Empty state: explanation that measurements are taken in-studio,
CTA: "Book a fitting appointment" button

If measurements exist:
Interactive Body Measurement Diagram (SVG silhouette figure). The SVG is highly interactive: hovering over "Waist" on the figure highlights the form field, and clicking the sleeve input triggers a soft glow on the SVG's arm, making the mechanical process highly engaging. Also, a clean card layout with grouped measurements. Make both options available for the user to switch between. Grouped measurements:

    Group 1: Upper Body
      Bust, Waist, Hips, Shoulder Width, Sleeve Length, Arm Length
    Group 2: Lower Body
      Inseam, Thigh, Knee, Calf, Ankle
    Group 3: Length
      Full Height, Dress Length, Skirt Length
    Group 4: Custom
      Any custom params in key-value list

    Each measurement: label + value (Xcm) in mono font.

    "Request Update" button — opens appointment booking flow.

    "Update My Measurements" section (if client self-update is available):
      Form with all measurement inputs, disclaimer text above submit,
      checkbox: "I confirm these measurements are accurate" (required).

Measurement History:
Collapsible accordion below the current record.
Each entry: date, who changed it, what changed (shows before/after diffs).
Diff display: "Bust: 88cm → 92cm" with an up or down arrow indicator.

---

CLIENT PAGE 4 — PAYMENTS (/client/payments)

Summary strip at top:
3 stat cards: Total Paid | Outstanding Balance | Pending Confirmation

Payment list: all payments across all orders, most recent first.
Each row: - Order number (mono, links to order) - Payment type (Installment / Full) - Amount (mono, prominent) - Status pill (Pending / Confirmed / Rejected) - Date submitted - If Rejected: rejection reason shown inline in Warning/Error tint row

Clicking a payment: expands inline to show proof image and full details.

---

CLIENT PAGE 5 — PROFILE (/client/profile)

Two-column layout:
Left: profile card (avatar with upload affordance, name, email, phone, sex, member since date)
Right: edit form (same fields, inline editing, save button)
Verification Banner: If the user's email is unverified, show a persistent Warning-tinted banner at the top of the profile with a "Resend Verification Link" button.

Account Security section (below): - Change password (if LOCAL auth provider) - Connected accounts (shows OAuth providers linked)

═══════════════════════════════════════════════════════════
SECTION 5 — ADMIN PANEL (staff_admin + super_admin)
═══════════════════════════════════════════════════════════

Layout: identical sidebar structure to client dashboard but with admin navigation.
Sidebar is Secondary (#1A1A2E) with section groupings.
Command Palette: Pressing `Cmd+K` / `Ctrl+K` invokes a global frosted-glass search modal. Admins can instantly type an Order ID, Client Name, or App route to bypass manual clicking entirely.

ADMIN SIDEBAR NAVIGATION:
OVERVIEW
Dashboard

ORDERS & CLIENTS
Orders
Clients
Chat Inbox

CATALOG
Styles
Ready-to-Wear
Portfolio
Testimonials

MEASUREMENTS
Measurements
Appointments

FINANCE (SUPER_ADMIN only — hide entirely for STAFF_ADMIN)
Payments
Finance Summary
Export

SETTINGS (SUPER_ADMIN only)
Settings

---

ADMIN PAGE 1 — DASHBOARD OVERVIEW (/admin/dashboard)

Header: Welcome back + Date Range Filter (This Month, Last Month, YTD) + "Export Report" split button (Download CSV / Download PDF).

Stat cards row (6 cards, 3+3 on tablet, 2+2+2 on desktop): - Total Active Orders (count) - Orders Pending Review (count, Warning colour if > 0) - Total Revenue (₦ amount) - Outstanding Payments (₦ amount) - Clients This Month (count) - Appointments Pending (count)
_(Note: These stats dynamically update based on the Date Range filter)._

Live indicator: small pulsing green dot + "X clients online now" (SSE-driven, updates live)

Recent Orders table (last 10):
Columns: Order # | Client | Type | Status | Agreed Fee | Paid | Action
Sortable columns. Status has colour-coded pills.
"Manage" button on each row.
Expandable row: clicking shows brief preview without leaving page.

Pending Payments section:
Cards for each payment awaiting confirmation.
Each card: order number, client name, amount, payment type, time since submitted.
Action buttons: "Confirm" + "Reject" directly on the card (no navigation required).
"Confirm" shows a confirmation popover. "Reject" opens a small modal with reason input.

Upcoming Appointments:
Timeline-style list for the next 7 days.

---

ADMIN PAGE 2 — ORDERS (/admin/orders)

Filter bar: Status (multi-select dropdown) | Order Type | Client (search) | Date range picker | Search
All filters apply simultaneously. Active filters shown as dismissible pills below the bar.

View toggle: Table view / Kanban view (remember preference)

TABLE VIEW:
Sortable columns: Order # | Client | Type | Status | Agreed Fee | Total Paid | Date | Actions
Bulk actions checkbox: select multiple, bulk status update or export
Sticky header on scroll
Row hover: subtle highlight, "Manage →" button appears on right

KANBAN VIEW (Primary Operational Flow):
A horizontal drag-and-drop board containing columns representing lifecycle states (PENDING_REVIEW, CUTTING, SEWING, FINISHING).
Admins drag order cards between columns to silently update statuses in the background via precise API hits. This acts as the studio's true operation dashboard.

ORDER DETAIL PAGE (/admin/orders/:id)

    Two-column layout: same structure as client order detail but with admin controls.

    LEFT COLUMN:

    Status Update Card:
      - Current status (large pill)
      - Visual stepper (same as client view)
      - "Update Status" button: opens a modal with:
        - Allowed next statuses shown as selectable options (NOT a free dropdown)
        - Optional note field
        - Confirm button
      - Cancellation: if CANCELLED is an option, selecting it shows a required reason field

    Quote Management Card (for Model 1 + 2 orders in PENDING_REVIEW or AWAITING_CLIENT_RESPONSE):
      - Current proposed fee (if any) displayed
      - Amount input (₦) to set or update the quote
      - "Send Quote to Client" button
      - Negotiation history: shows client's decline notes from status history

    Delivery Fee Card:
      - For DELIVERY orders only
      - Current delivery fee displayed
      - Editable amount input + "Update" button

    Admin Notes Card:
      - Private admin notes (clients do not see these)
      - Freeform text area + save button

    Created By / Assigned To:
      - "Created by admin: [Name]" badge if createdByAdminId is set
      - "Assigned to: [Name]" dropdown to assign to a staff admin (Assign Order feature)

    RIGHT COLUMN:

    Client Info Card:
      - Avatar (initials-based if no photo), name, email, phone
      - Online status indicator (pulsing green dot if currently online, grey if not)
      - "View full profile" link
      - Measurements: brief summary or "No measurements on file"

    Chat Panel: identical to client chat panel but from admin's perspective.
      Admin messages right-aligned, client messages left-aligned.

    Payment History: same as client view, but with Confirm/Reject actions on each PENDING payment.

---

ADMIN PAGE 3 — CLIENTS (/admin/clients)

Search bar (prominent, full-width at top) with real-time search.

Client cards grid (2-column desktop, 1 on mobile):
Each card: - Avatar circle (initials-based, colour-coded by name initial) - Name, email, phone - Online indicator (green dot = online, grey = offline) - Total orders count + total paid amount - Last active: relative time - "View Profile" button

CLIENT PROFILE PAGE (/admin/clients/:id)

    Header: avatar, name, online status, member since.
    Tabs: Overview | Orders | Measurements | Payments | Chat History

    Overview tab:
      - Contact info card (edit inline)
      - Stats: total orders, total spend, average order value

    Orders tab:
      - Same order list as admin orders page but pre-filtered to this client

    Measurements tab:
      - Full measurements display (same as client view)
      - "Edit Measurements" button (admin can edit directly without disclaimer)
      - History accordion

    Payments tab:
      - Payment list pre-filtered to this client

---

ADMIN PAGE 4 — CHAT INBOX (/admin/chat)

Two-panel layout (email client style):
Left panel (360px): conversation list
Right panel: active conversation

Left panel — conversation list:
Each item: order number, client name, last message preview (truncated),
time, unread count badge (Primary, bold)
Sorted: unread first, then by most recent message
Active conversation highlighted with Primary left border + light bg

Right panel — conversation:
Identical to the chat panel in order detail, but full-height
Header shows order number, client name, online status, link to order

On mobile: list view only → tapping opens full-screen conversation

---

ADMIN PAGE 5 — CATALOG MANAGEMENT (/admin/catalog/styles, /admin/catalog/ready-to-wear, /admin/catalog/portfolio)

STYLES PAGE:
Two-column layout: filter sidebar (left) + item grid (right)
Filter sidebar: category, model availability, active/archived toggle
Item grid: same card design as public catalog but with edit/archive controls overlaid on hover
"Add New Style" button: prominent, top-right
Add/Edit form: opens as a large modal or full-width panel sliding in from right
Fields: name, description, category (dropdown), model availability (toggle switches),
images (multi-upload with drag-and-drop reorder, individual delete per image — requires confirmation modal),
isFeatured toggle, isActive toggle

READY-TO-WEAR PAGE:
Same structure. Additional fields:
price (₦ input), availableSizes (tag-style multi-input), stockCount (number input with +/- stepper),
stockStatus (auto-calculated, shown read-only with override toggle),
fabricDetails, careInstructions (text areas)

PORTFOLIO PAGE:
Same structure. Additional fields:
orderId (search + select from completed orders), title, description, category,
clientConsent toggle (must be ON to publish), isFeatured toggle, isPublished toggle
Unpublished items shown with a "DRAFT" watermark overlay on the card

TESTIMONIALS MODERATION:
List view of testimonials submitted by clients.
Tabs: Pending | Approved | Rejected
Each row: Client Name, Rating (stars), Review snippet, Date.
Actions: "Approve", "Reject", "Toggle Featured" (stars indicator).
"Create Testimonial" button: Admin can manually input a testimonial on behalf of a client (fields: Client Name, Rating, Review, Photo, status override).

---

ADMIN PAGE 6 — MEASUREMENTS & APPOINTMENTS (/admin/measurements, /admin/appointments)

MEASUREMENTS PAGE:
Search bar: search clients by name or email
Client list: table with columns: Client | Bust | Waist | Hips | Last Updated | Actions
"View/Edit" expands a detailed measurement panel inline (or navigates to client profile)
Export button (top-right): downloads CSV of all measurements

APPOINTMENTS PAGE:
Calendar-style view toggle (list / calendar)
List view: table — Client | Requested Date | Status | Admin Notes | Actions
Status actions: "Confirm" sets a confirmed date (date picker) + saves
"Cancel" requires a reason
Confirmed appointments shown in a "This week" strip at the top

---

ADMIN PAGE 7 — FINANCE (SUPER_ADMIN ONLY)

PAYMENTS PAGE (/admin/payments):
Filter bar: Status | Date range | Order type
"Pending Confirmation" tab shown first (most urgent).
Payment cards layout for PENDING (same quick-confirm UI as dashboard).
Full table for CONFIRMED and REJECTED with sortable columns.
Export button: opens a modal to select format (CSV / PDF) and date range.
PDF export option: "Include summary" checkbox.

FINANCE SUMMARY PAGE (/admin/finance):
Date range picker at top (defaults to current month).
Stat cards: Total Revenue | Confirmed Payments | Pending Amount | Outstanding Balance
Chart 1: Revenue over time (Area/Line chart) — displays totalRevenue mapping across dates.
Chart 2: Orders by Status (Donut/Pie chart) — PENDING, IN_PROGRESS, COMPLETED, etc.
Chart 3: Orders by Type (Bar chart) — Model 1 / Model 2 / Ready-to-Wear comparison.
Outstanding Orders section: table of orders where totalPaid < totalAgreedFee
Charts use Primary colour family: primary for main series, tints for secondary.

═══════════════════════════════════════════════════════════
SECTION 6 — RESPONSIVE BEHAVIOUR SPECIFICATION
═══════════════════════════════════════════════════════════

Breakpoints:
Mobile: < 640px
Tablet: 640px – 1023px
Desktop: ≥ 1024px

Mobile-specific behaviours:

- Sidebar becomes bottom navigation bar (5 items max: Dashboard, Orders, Chat, Notifications, Profile)
  remaining items accessible via "More" or hamburger menu
- Tables become card lists (no horizontal scroll tables on mobile)
- Two-column layouts stack vertically
- Chat panel takes full viewport height
- Floating action button (FAB) for primary CTA on key pages (e.g., "Place Order")
- All tap targets ≥ 44px
- Swipe gestures: swipe right on order cards to reveal quick actions
- Sticky bottom bar for key order detail actions (Accept Quote, Submit Payment)
- **Mega-Menu:** Reverts to a standard nested accordion list within the mobile hamburger overlay menu.
- **Interactive SVG:** Bypasses hover requirements and defaults to visual body measurement diagram (SVG silhouette figure) with measurement points annotated and a clean card layout with grouped measurements on mobile input views, and make both options available for the user to switch between.
- **Horizontal Lookbook (Portfolio):** Maintains horizontal scroll but snaps to full viewport-width cards.
- **Kanban Board:** Bypasses drag-and-drop on mobile, reverting to a toggleable stacked-card view grouped by status.

Tablet-specific:

- Sidebar may collapse to icon-only mode (64px wide), expanding on hover
- Most two-column layouts preserved but with adjusted proportions
- **Kanban Board:** Remains horizontal but requires horizontal container scrolling if columns exceed viewport width.

═══════════════════════════════════════════════════════════
SECTION 7 — ANIMATION & TRANSITION SPECIFICATIONS
═══════════════════════════════════════════════════════════

PAGE TRANSITIONS
Between public pages: content fades out (150ms) then new content fades+rises in (300ms).
Dashboard navigation: content area fades and translates (subtle, 200ms) — sidebar stays fixed.

SCROLL-TRIGGERED REVEALS
Elements below the fold: fade + rise (12px Y) triggered when 20% of element enters viewport.
Stagger delay: 60ms between sibling elements.
Use Intersection Observer. No animation on elements already in viewport on load.

REAL-TIME EVENTS (SSE-driven)
New notification arrives: bell icon bounces (keyframe: scale 1 → 1.2 → 0.95 → 1, 400ms),
count badge scales in with spring (scale 0 → 1.1 → 1).
New chat message: message slides in from the appropriate side (left for incoming, right for outgoing),
fade + translateX(20px → 0), 250ms.
Order status update: status pill animates — old fades out, new fades in with a colour wash.
Online status change: indicator dot fades between green and grey.

LOADING STATES
Skeleton loaders: shimmer animation (gradient sweeps left to right, 1.5s loop).
Button loading: label fades out, spinner fades in — button width unchanged.
Page load: stagger reveal of content sections top to bottom.

INTERACTIVE MICRO-ANIMATIONS
Toggle switches: thumb slides with spring easing.
Checkboxes: custom animated checkmark (path draw animation).
Star ratings: stars fill in with a scale bounce when selected.
Progress bars: fill from 0% to value on mount, eased.
Number counters (stats): count up from 0 to value on reveal.
Accordion: smooth height animation (not clip), content fades in.
Tab switches: underline indicator slides between tabs, content crossfades.

═══════════════════════════════════════════════════════════
SECTION 8 — TECHNICAL CONSTRAINTS FOR THE DESIGN
═══════════════════════════════════════════════════════════

- All components must be implementable in React with Tailwind CSS and Shadcn/ui
- Animations must be achievable with Framer Motion
- Charts: Recharts library (already part of the stack)
- Icons: Lucide React (consistent set throughout)
- No custom fonts requiring self-hosting — use Google Fonts (Plus Jakarta Sans recommended)
- All designs must support both light mode (default) and a future dark mode
  (use CSS custom properties / Tailwind dark: classes)
- Image placeholders: use aspect-ratio containers with gradient backgrounds,
  not broken image icons
- Loading skeleton components must be designed for every data-fetching view
- Error states (API failures, 404) must be designed — not just the success states

═══════════════════════════════════════════════════════════
SECTION 9 — WHAT SUCCESS LOOKS LIKE
═══════════════════════════════════════════════════════════

A user landing on the homepage should immediately understand:

1. This is a premium fashion business (visual quality signals trust)
2. Exactly what services are offered (three models, clearly explained)
3. How to start (one clear primary CTA always visible)

A first-time client using the dashboard should feel:

1. Their order is being cared for — progress is visible and meaningful
2. Communication is effortless — chat is right there, messages feel instant
3. They know exactly what they owe and have paid — no financial ambiguity

An admin managing orders should feel:

1. Everything urgent is visible without hunting
2. Taking action is fast — confirming a payment, updating a status, responding to a message
   requires as few clicks as possible
3. The system is showing them the full picture — they can always see what's happening
   across all clients and orders

The platform should feel native to Nigeria — not because it has Nigerian colours or iconography,
but because it serves the actual context: local currency (₦), WhatsApp as primary comms,
local fashion categories, local measurement conventions, local payment behaviours.

═══════════════════════════════════════════════════════════

Generate the full design for every page and component listed above.
Produce desktop, tablet, and mobile variants for every page.
Design every interactive state (hover, active, focus, error, loading, empty).
Be specific about spacing, type sizes, and colour usage — this brief contains exact values to use.
Do not simplify or omit any section — the completeness is intentional.
