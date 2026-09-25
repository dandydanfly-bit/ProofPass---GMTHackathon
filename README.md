# PROOFPASS

### Your Presence. Your Proof.

**ProofPass** is a Web3 event participation platform built on **BOT Chain** that turns real-world event participation into verifiable, wallet-linked on-chain proof.

Instead of treating an event ticket as the final product, ProofPass is built around a bigger idea:

> **Your participation should be provable.**

ProofPass is designed to let users discover events, claim event passes, build a participation history, and eventually turn verified attendance into permanent, independently verifiable proof.

---

## ✦ Product Concept

ProofPass connects:

```text
REAL-WORLD EVENT
       ↓
   PARTICIPATION
       ↓
 BLOCKCHAIN RECORD
       ↓
 VERIFIABLE PROOF
```

The product distinguishes three important states:

### Ticket Ownership

The user has successfully claimed a pass for an event.

### Attendance Verification

The organizer confirms that the user actually attended the event.

### Participation Proof

The verified attendance becomes a persistent, independently verifiable ProofPass record.

Therefore:

```text
TICKET
  ↓
ATTENDANCE
  ↓
PROOF
```

The ticket is not the final product.

The real value is the user's growing **participation history**.

---

# 🚀 Hackathon

Built for:

**Girl Meets Tech Build Week Hackathon Vol.2**

ProofPass is designed around a real Web3 use case on **BOT Chain**, with a focus on:

* Real wallet interaction
* On-chain event participation
* Verifiable attendance
* Public proof verification
* Premium Web3 UX
* Responsive product design
* Production-oriented architecture

---

# 🧭 Core Application

ProofPass is organized around five primary application sections:

| Section        | Purpose                                                             |
| -------------- | ------------------------------------------------------------------- |
| **Home**       | Overview of the user's ProofPass activity and important information |
| **My Tickets** | Personal collection of claimed event passes                         |
| **Wallet**     | Wallet status, account information, connection state and activity   |
| **Event**      | Event discovery, search, filtering and event details                |
| **Settings**   | Theme, motion preferences and wallet/account controls               |

---

## Home

The Home dashboard is the user's personal ProofPass overview.

It is designed to surface the most important information without becoming an overwhelming analytics dashboard.

Potential information includes:

* Wallet status
* BOT Chain network status
* Event statistics
* Upcoming events
* Recent participation
* Recent proofs
* Quick actions

Example information hierarchy:

```text
YOUR PROOFPASS

Wallet
Network
Connection Status

KEY METRICS
Total Events
Verified Attendance
Active Tickets
Expired Tickets

UPCOMING EVENTS

RECENT PROOFS

QUICK ACTIONS
```

All blockchain-related statistics must be derived from actual application or contract state.

---

# 🎟️ My Tickets

**My Tickets** acts as the user's personal digital ticket collection.

The page is designed around ticket lifecycle states:

* **Active**
* **Available**
* **Expired**

Ticket status must be derived from authoritative event/application data.

### Active

A claimed ticket that is currently valid according to the event lifecycle.

### Available

A valid ticket/pass that is available to the user and has not yet reached the relevant event deadline/state.

### Expired

A ticket whose authoritative event deadline has already passed.

Expiration must NOT be determined from arbitrary frontend assumptions.

The UI must clearly distinguish:

```text
TICKET OWNERSHIP
        ≠
ATTENDANCE VERIFICATION
        ≠
FINAL PROOF
```

A claimed ticket does not automatically mean that attendance has been verified.

---

# 👛 Wallet

The **Wallet** section acts as the user's ProofPass account center.

It becomes fully available after the user connects ProofPass to **MetaMask** or another compatible EVM wallet.

When no wallet is connected, ProofPass should show a clear authentication state such as:

> Connect your wallet to access your ProofPass account.

The Wallet page is intended to provide:

### Account Overview

* Wallet address
* Shortened wallet address
* Copy address
* Explorer link
* Network
* Chain ID
* Connection status

### Account Activation

Possible states include:

* Not Connected
* Connected
* Ready
* Wrong Network
* Activation Required

The application must NOT invent an on-chain account activation process unless the real implementation requires it.

### Account Information

* Wallet address
* Network
* Chain ID
* Connection state
* Participation count
* Verified proof count

### Account History

Actual application activity may include:

* Ticket claims
* Attendance verification
* Proof creation
* Network changes
* Relevant blockchain transactions

The UI must not fabricate historical activity.

### Wallet Controls

* Connect
* Disconnect
* Switch network
* Copy address
* Open explorer

ProofPass never asks users for:

* Private keys
* Seed phrases
* Secret Recovery Phrases
* Wallet passwords

---

# 🎫 Event

The **Event** section is the main event discovery experience.

Primary message:

> **Find an event, claim your pass, and start building your proof history.**

The Event page is designed as a premium event discovery interface.

---

## Search

The search field MUST actually work.

Placeholder:

```text
Find an event
```

Search should be able to match relevant event information such as:

* Event name
* Organizer
* Category
* Location

Debouncing may be used where appropriate.

The search input must not be decorative.

---

## Sort

Required sorting options:

* Soonest first
* Latest first
* Largest capacity

Sorting must actually change the rendered event results.

---

## Location Filters

Required locations:

* All locations
* Jakarta, Indonesia
* London, United Kingdom
* Moscow, Russia
* Singapore
* Sydney, Australia
* Tokyo, Japan

---

## Category Filters

Required categories:

* All
* Hackathon
* Conference
* Workshop
* Community
* Creative
* University
* Technology
* Web3

---

## Status Filters

Required statuses:

* All status
* Open
* Full
* Closed

All filter controls must actually affect the event results.

Do not create UI controls that do nothing.

---

# 📅 Event Details

Every event should have a dedicated detail experience.

Event details may include:

* Event visual
* Event title
* Organizer
* Date
* Time
* Location
* Description
* Category
* Capacity
* Available spots
* Event status
* Claim status
* Deadline
* BOT Chain network
* Ticket information
* Attendance information
* Proof information

Primary action:

```text
Claim your pass
```

Possible states:

```text
Claim Pass
Claiming...
Pass Claimed
Event Full
Event Closed
Expired
```

If the user already claimed the ticket:

```text
TICKET CLAIMED
```

If attendance has been verified:

```text
ATTENDANCE VERIFIED
```

If a proof exists:

```text
VIEW PROOF
```

---

# 🎟️ Ticket Claim Flow

The claim flow must represent a real blockchain interaction.

Expected lifecycle:

```text
CLICK CLAIM
      ↓
CHECK WALLET
      ↓
CHECK NETWORK
      ↓
PREPARE TRANSACTION
      ↓
WALLET CONFIRMATION
      ↓
TRANSACTION SUBMITTED
      ↓
CONFIRMING
      ↓
CONFIRMED
      ↓
TICKET CLAIMED
      ↓
UI UPDATED
```

Transaction states should clearly communicate what is happening:

1. Preparing
2. Waiting for wallet
3. Transaction submitted
4. Confirming on BOT Chain
5. Confirmed
6. Ticket claimed

The interface must never show success before the blockchain transaction is confirmed.

After confirmation, relevant UI state should update without forcing a full page refresh.

---

# 🪪 ProofPass History

The participation history is the emotional center of the product.

ProofPass should communicate:

> **This is my history of things I actually participated in.**

Potential layouts include:

* Timeline
* Card grid
* Hybrid passport-style interface

Each proof record may contain:

* Event
* Category
* Date
* Organizer
* Attendance status
* Proof ID
* Network
* Transaction
* Verification state

The product must clearly distinguish:

```text
TICKET
   ↓
ATTENDANCE
   ↓
PROOF
```

---

# ✅ Individual Proof

Each ProofPass record should feel like a premium digital credential.

Example hierarchy:

```text
PROOFPASS

VERIFIED PARTICIPATION

Event:
[Event Name]

Participant:
[Wallet Address]

Organizer:
[Organizer]

Date:
[Date]

Proof ID:
[Proof ID]

Network:
BOT Chain

Transaction:
[Transaction Hash]

Contract:
[Contract Address]

Verification Status:
✓ VERIFIED
```

Actions may include:

* Copy
* Share
* View on Explorer

The page should remain understandable to users who are unfamiliar with blockchain technology.

---

# 🔍 Public Verification

ProofPass is designed to provide a public verification experience.

Possible route:

```text
/verify/:proofId
```

A public visitor should NOT need to connect a wallet.

The verification page should communicate:

* What was verified
* Which event it relates to
* Which wallet is associated with it
* When it was verified
* Which blockchain network was used
* How the record can be independently inspected

Primary state:

```text
✓ VERIFIED
```

The experience should feel like opening a digital credential rather than inspecting a raw blockchain explorer.

Explorer and contract links should be available.

---

# ⛓️ BOT Chain

ProofPass is designed to operate on **BOT Chain**.

## BOT Chain Testnet

```text
Chain ID:
968

RPC:
https://rpc.bohr.life

Explorer:
https://scan.bohr.life/
```

## BOT Chain Mainnet

```text
Chain ID:
677

RPC:
https://rpc.botchain.ai

Explorer:
https://scan.botchain.ai/
```

## Developer Documentation

https://dev-docs.botchain.ai/docs/intro

## BOT Chain

https://botchain.ai/

Blockchain configuration should be centralized rather than scattered throughout the application.

Before production deployment, network configuration should be verified against the current official BOT Chain documentation.

---

# 🧠 Smart Contract

The current ProofPass prototype includes a Solidity ticket contract.

The current contract provides a simple foundation for wallet-based ticket claiming.

Current ticket structure:

```solidity
struct Ticket {
    address holder;
    uint256 claimDate;
    bool isValid;
}
```

Tickets are currently indexed by wallet address.

---

## Current Contract Capabilities

The current contract supports:

* Ticket claiming
* One claim per wallet
* Claim timestamp
* Ticket validity
* Total claimed count
* Wallet-based ticket verification
* `TicketClaimed` event

Current conceptual flow:

```text
CONNECT WALLET
      ↓
CLAIM TICKET
      ↓
SMART CONTRACT
      ↓
TICKET STORED ON-CHAIN
      ↓
TICKET CAN BE VERIFIED
```

The contract is intentionally simple as the foundation for a larger ProofPass architecture.

---

# 🔮 Product Architecture Direction

The intended long-term product flow is:

```text
ORGANIZER
Create Event
      ↓
BOT CHAIN
Event Exists
      ↓
ATTENDEE
Connect Wallet
      ↓
Discover Event
      ↓
Claim Pass
      ↓
Ticket Ownership Confirmed
      ↓
ORGANIZER
Verify Attendance
      ↓
BOT CHAIN
Attendance Recorded
      ↓
PROOFPASS
Participation Proof Created
      ↓
PUBLIC USER
Open Verification Page
      ↓
Independently Verify Proof
```

The system is ultimately designed to distinguish:

```text
Ticket Ownership
       ↓
Attendance Verification
       ↓
Participation Proof
```

---

# 🎨 Design Philosophy

ProofPass is designed to feel closer to a premium modern software product than a traditional crypto dashboard.

Visual principles:

* Minimal
* Premium
* Futuristic but restrained
* Technical
* Human
* Editorial
* Precise
* Trustworthy
* Responsive

The interface emphasizes:

* Strong typography
* Generous spacing
* Layered surfaces
* Elegant cards
* Subtle borders
* Restrained blur
* Controlled gradients
* Strong hierarchy
* Refined interaction design

Avoid:

* Excessive neon
* Huge glowing gradients
* Random 3D objects
* Excessive particles
* Unnecessary sci-fi interfaces
* Rainbow crypto aesthetics
* Visual clutter

---

# 🧩 Application Shell

The primary authenticated dashboard contains exactly five main navigation sections:

```text
Home
My Tickets
Wallet
Event
Settings
```

The application shell is designed around:

* Compact navigation
* Clear information hierarchy
* Premium account interaction
* Structured cards
* Subtle borders
* Restrained shadows
* Professional responsive behavior
* Clear active states
* Smooth transitions

The interaction quality may take inspiration from modern premium Web3 products such as Dynamic, while maintaining a completely independent ProofPass visual identity.

Reference:

https://www.dynamic.xyz/customers

The project does NOT copy:

* Layout
* Branding
* Typography
* Assets
* Components
* Code
* Exact page structure

---

# 🌗 Theme System

ProofPass supports:

```text
LIGHT
DARK
```

Current visual foundations:

```text
Light Primary:
#BFB18C

Dark Primary:
#212324
```

These colors serve as theme foundations rather than colors that should dominate the entire interface.

Supporting tokens include:

* Background
* Surface
* Elevated Surface
* Text Primary
* Text Secondary
* Text Muted
* Border
* Accent
* Success
* Warning
* Error
* Info
* Focus
* Disabled

Theme values should be centralized.

---

# ✨ Motion System

Motion is an important part of the ProofPass experience.

The motion system includes:

### Page Transitions

* Fade
* Subtle vertical movement
* Soft scale

### Hero

* Floating proof cards
* Layered movement
* Subtle parallax
* Animated connection paths

### Scroll

* Progressive reveal
* Stagger
* Gentle movement

### Buttons

* Hover response
* Lift
* Active compression
* Loading
* Success

### Cards

* Subtle elevation
* Border response
* Shadow response
* Controlled metadata reveal

### Modals

* Backdrop fade
* Soft scale
* Smooth exit

### Transactions

* Progress states
* Waiting states
* Submission states
* Confirmation states
* Success transitions

### Success

* Checkmark animation
* Expanding ring
* Proof reveal
* Soft glow

Motion should always improve comprehension and feedback.

Do not use excessive animation simply for decoration.

---

# 🎚️ Motion Preferences

ProofPass provides:

## Full Motion

Normal ProofPass motion system.

## Minimal Motion

Reduces non-essential movement such as:

* Parallax
* Large transforms
* Decorative animation
* Continuous background animation
* Excessive scroll reveals

Essential states remain visible:

* Transaction status
* Errors
* Success
* Focus states
* Important state changes

ProofPass also respects:

```text
prefers-reduced-motion
```

---

# ⏳ Loading Experience

ProofPass uses a custom loading experience designed to feel intentional.

Concept:

```text
DARK BACKGROUND
      ↓
PROOFPASS MARK
      ↓
SUBTLE ANIMATION
      ↓
"Verifying your event passport..."
      ↓
APPLICATION
```

The loader must not intentionally slow down the application.

If loading is fast, the animation should shorten accordingly.

For slower loading states, the application should use:

* Skeletons
* Progressive rendering
* Route-level loading
* Content placeholders
* Safe optimistic updates

Users should never stare at an unnecessary blank screen.

---

# 💻 Responsive Design

ProofPass is designed for:

* Desktop
* Laptop
* Tablet
* Mobile

The mobile experience is not simply a scaled-down desktop layout.

Mobile should have:

* Proper navigation
* Comfortable touch targets
* Readable typography
* Reorganized cards
* Mobile-friendly filters
* Mobile-friendly organizer interfaces
* No horizontal overflow

The dashboard shell should adapt appropriately to smaller screens.

---

# ♿ Accessibility

ProofPass aims to provide real accessibility rather than accessibility as an afterthought.

The application should use:

* Semantic HTML
* Keyboard navigation
* Visible focus states
* Accessible dialogs
* Proper form labels
* Accessible buttons
* Appropriate ARIA
* Sufficient contrast
* Screen-reader support
* Reduced-motion support

Visual effects must never make the core interface unusable.

---

# ⚡ Performance

ProofPass prioritizes:

* Fast first render
* Efficient JavaScript
* Lazy loading
* Efficient animations
* GPU-friendly transforms
* Low layout thrashing
* Compressed assets
* Controlled RPC calls
* Limited dependencies

For animation, prefer:

```text
transform
opacity
```

over expensive layout properties where possible.

The interface should remain responsive on average laptops and mobile devices.

---

# 🛠️ Technology

Current frontend architecture:

* HTML
* CSS
* JavaScript

Blockchain:

* Solidity
* BOT Chain

Blockchain interaction:

* ethers.js

Current ethers.js version:

```text
6.13.4
```

Loaded through:

```html
<script src="https://cdn.jsdelivr.net/npm/ethers@6.13.4/dist/ethers.umd.min.js"></script>
```

---

# 📁 Project Structure

The current repository can contain:

```text
ProofPass/
├── index.html
├── proofpass.css
├── proofpass.js
├── TicketContract.sol
├── GMT BOTCHAIN Logo.jpeg
└── README.md
```

As the project evolves, the structure may expand to include:

```text
contracts/
services/
utils/
components/
assets/
config/
```

Blockchain logic should remain separated from visual presentation as the codebase grows.

---

# 🔐 Security Principles

ProofPass follows several fundamental Web3 security principles.

### Never request

* Private keys
* Seed phrases
* Secret Recovery Phrases
* Wallet passwords
* Secret credentials

### Application principles

* The frontend must not be the source of truth for authorization
* Network must be validated before transactions
* Transaction confirmation must be verified before showing success
* Contract configuration must be centralized
* No secrets should be stored in frontend code
* Wallet/account changes must be handled safely
* Stale blockchain state should be revalidated

---

# 🧪 Current Prototype vs Product Vision

ProofPass is developed incrementally.

## Current Foundation

The current prototype includes the foundation for:

* ProofPass application shell
* Home
* My Tickets
* Wallet
* Event
* Settings
* Theme support
* Motion preference
* Wallet interaction UX
* Basic ticket smart contract
* Ticket claim / verification foundation

## Product Vision

The broader ProofPass system is intended to include:

* Event creation
* Event lifecycle management
* Organizer authorization
* Attendance verification
* On-chain participation records
* Permanent proof generation
* Public proof verification
* Proof sharing
* Participation history

A feature should only be described as production-ready once it is backed by actual application or blockchain state.

---

# 🗺️ Roadmap

## Phase 1 — Foundation

* [x] ProofPass product identity
* [x] Application shell
* [x] Home
* [x] My Tickets
* [x] Wallet
* [x] Event
* [x] Settings
* [x] Theme system
* [x] Motion preference
* [x] Basic ticket smart contract

## Phase 2 — Core Web3 Flow

* [ ] BOT Chain wallet integration
* [ ] Production contract deployment
* [ ] Real event creation
* [ ] Real event discovery
* [ ] Real ticket lifecycle
* [ ] Transaction lifecycle handling

## Phase 3 — Attendance & Proof

* [ ] Organizer authorization
* [ ] Attendance verification
* [ ] On-chain attendance records
* [ ] Proof creation
* [ ] Public `/verify/:proofId` page
* [ ] Explorer verification

## Phase 4 — Product Polish

* [ ] Advanced transaction UX
* [ ] Responsive refinement
* [ ] Accessibility refinement
* [ ] Performance optimization
* [ ] Advanced motion system
* [ ] Social sharing
* [ ] Production hardening

---

# 🔭 Future Product Ideas

Possible future capabilities include:

* QR attendance
* Event reputation
* Organizer reputation
* Proof sharing
* Social profiles
* Event badges
* Participation streaks
* Achievement levels
* Portable credentials
* Campus verification
* Community integrations
* Third-party verification APIs
* Event credential SDKs
* Third-party application integrations

These features should not compromise the reliability of the core ProofPass flow.

---

# 🌐 Production Deployment

The official ProofPass production website is:

## https://proofpass.site

The project uses a dedicated custom domain for the public ProofPass experience.

Production deployment must ensure:

* `proofpass.site` is publicly accessible
* HTTPS is correctly configured
* Wallet connection works correctly
* BOT Chain configuration is correct
* Contract addresses are correct
* Explorer links point to the correct BOT Chain network
* Public proof routes are accessible
* Responsive layouts work correctly
* No private credentials are exposed
* Blockchain transactions work correctly in production

The production website is:

**https://proofpass.site**

---

# 🔗 Important Links

### ProofPass

https://proofpass.site

### BOT Chain

https://botchain.ai/

### BOT Chain Mainnet Explorer

https://scan.botchain.ai/

### BOT Chain Testnet Explorer

https://scan.bohr.life/

### BOT Chain Developer Documentation

https://dev-docs.botchain.ai/docs/intro

### BOT Chain Faucet

https://faucet.botchain.ai/basic

### Girl Meets Tech

https://www.girlmeetstech.org/

### Girl Meets Tech Build Week Guidebook

https://www.girlmeetstech.org/guidebook-build-week-hackathon-vol2

### BOT Chain X

https://x.com/BOTChain_ai

### Girl Meets Tech X

https://x.com/gmtech_

---

# 📣 Product Positioning

ProofPass is not intended to be:

* Another NFT marketplace
* Another crypto wallet dashboard
* Another generic ticketing platform
* Another frontend blockchain demo

Instead, ProofPass is positioned as:

> **A decentralized event passport for building a verifiable history of real-world participation.**

The product connects physical participation with portable digital proof.

---

# 🎯 MVP

The minimum fully functional ProofPass experience should be:

```text
ORGANIZER
Create Event
      ↓
BOT Chain
Event Exists
      ↓
ATTENDEE
Connect Wallet
      ↓
Discover Event
      ↓
Claim Pass
      ↓
Ticket Ownership Confirmed
      ↓
ORGANIZER
Select Attendee
      ↓
Verify Attendance
      ↓
Transaction Confirmed
      ↓
PROOFPASS
Attendance Proof Exists
      ↓
ATTENDEE
Sees Verified Proof
      ↓
PUBLIC USER
Opens Verification Page
      ↓
Proof Independently Verified
```

This is the central product loop.

Everything else is secondary.

---

# 🚫 Features That Should Not Delay the MVP

The following features should remain secondary to the core product:

* QR attendance
* Social profiles
* Event reputation
* Organizer reputation
* Achievement systems
* Streaks
* Leaderboards
* Cross-chain identity
* Recommendation engine
* Complex ticket trading
* Advanced anti-scalping
* Social graph
* Gamification
* Large third-party integrations

Reliability is more important than feature count.

---

# 💡 Product Copy

ProofPass prefers concise, human UI copy.

Avoid:

* Corporate filler
* Generic AI phrasing
* Excessive crypto jargon
* Empty buzzwords
* "Revolutionary"
* "Next-generation"
* "The future of everything"

Prefer:

```text
Claim your spot.

Attendance verified.

Your participation is now on-chain.

Anyone can verify this proof.

Your history, backed by proof.
```

---

# 📝 Example Product Story

ProofPass tells a simple story:

```text
I found an event.
      ↓
I claimed my pass.
      ↓
I attended the event.
      ↓
The organizer verified my attendance.
      ↓
My participation became an on-chain record.
      ↓
I can now prove that I was there.
      ↓
Anyone can independently verify it.
```

That is the core idea behind ProofPass.

---

# 🧱 Architectural Principles

The application should maintain a clean separation between:

```text
SMART CONTRACT
        ↓
Authoritative ownership / attendance / authorization

BLOCKCHAIN SERVICE LAYER
        ↓
Wallet / transactions / blockchain reads

APPLICATION STATE
        ↓
UI-friendly derived state

UI COMPONENTS
        ↓
Visual presentation and interaction

PAGES
        ↓
Product workflows

DESIGN SYSTEM
        ↓
Consistent visual language
```

This separation prevents blockchain logic from becoming scattered across UI components.

---

# 🤝 Contributing

ProofPass is currently being developed as a hackathon project.

When modifying the project:

* Preserve existing functionality
* Avoid unnecessary rewrites
* Keep blockchain logic organized
* Avoid random dependencies
* Never commit secrets
* Test wallet flows carefully
* Test transactions on the correct network
* Keep production behavior separate from visual demos

---

# ⚠️ Disclaimer

ProofPass is an active hackathon project and its architecture may continue to evolve.

Some features described in the product vision may still be under development.

Do not treat the current prototype as production financial infrastructure.

Never share private keys, seed phrases, Secret Recovery Phrases, or wallet passwords with anyone.

---

# 📜 License

This project is released under the **MIT License**.

---

<p align="center">

# PROOFPASS

### Your Presence. Your Proof.

Turn real-world participation into verifiable on-chain proof.

**Built for Girl Meets Tech Build Week Hackathon Vol.2**

**Built on BOT Chain**

**https://proofpass.site**

</p>
