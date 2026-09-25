/* ============================================================================
   PROOFPASS — Application
   ========================================================================== */

let S = {
  connected: false,
  account: null,
  provider: null,
  signer: null,
  readProvider: null,
  readContract: null,
  writeContract: null,
  myContractTicket: null, // <-- Taruh di sini di dalam objek S
  events: [],
  myPasses: [],
  myProofs: [],
  orgEvents: [],
  // dan seterusnya...
};
(function () {
  "use strict";

  /* ─────────────────────────── 1. CONFIG ─────────────────────────── */
  /*  ⚠️  EDIT THIS BLOCK AFTER DEPLOYING ProofPass.sol
    Nothing else in this file needs to change for a new deployment.          */
  const CONFIG = {
    contractAddresses: {
      968: "0x406AB5033423Dcb6391Ac9eEEad73294FA82Cfbc", // ← BOT Chain Testnet address  (e.g. "0x1234…")
      677: "", // ← BOT Chain Mainnet address  (e.g. "0xabcd…")
    },
    defaultNetworkId: 968,
    appName: "ProofPass",
    appUrl: (location.origin + location.pathname).replace(/\/$/, ""),
  };

  const NETWORKS = {
    968: {
      id: 968,
      key: "testnet",
      name: "BOT Chain Testnet",
      short: "TESTNET",
      hex: "0x3c8",
      rpc: "https://rpc.bohr.life",
      explorer: "https://scan.bohr.life",
      currency: "BOT",
      faucet: "https://faucet.botchain.ai/basic",
    },
    677: {
      id: 677,
      key: "mainnet",
      name: "BOT Chain Mainnet",
      short: "MAINNET",
      hex: "0x2a5",
      rpc: "https://rpc.botchain.ai",
      explorer: "https://scan.botchain.ai",
      currency: "BOT",
    },
  };
  const SUPPORTED_IDS = Object.keys(NETWORKS).map(Number);

  /* ─────────────────────────── 2. ABI ─────────────────────────── */
  const ABI = [
    {
      inputs: [],
      stateMutability: "nonpayable",
      type: "constructor",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "user",
          type: "address",
        },
      ],
      name: "TicketClaimed",
      type: "event",
    },
    {
      inputs: [],
      name: "claimTicket",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [],
      name: "owner",
      outputs: [
        {
          internalType: "address",
          name: "",
          type: "address",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "",
          type: "address",
        },
      ],
      name: "tickets",
      outputs: [
        {
          internalType: "address",
          name: "holder",
          type: "address",
        },
        {
          internalType: "uint256",
          name: "claimDate",
          type: "uint256",
        },
        {
          internalType: "bool",
          name: "isValid",
          type: "bool",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "totalClaimed",
      outputs: [
        {
          internalType: "uint256",
          name: "",
          type: "uint256",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "userAddress",
          type: "address",
        },
      ],
      name: "verifyTicket",
      outputs: [
        {
          internalType: "bool",
          name: "",
          type: "bool",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
  ];

  /* ─────────────────────────── 3. STATE ─────────────────────────── */
  const S = {
    theme: "dark",
    motion: "full",
    tz: "UTC",
    account: null,
    chainId: null,
    connected: false,
    readProvider: null,
    browserProvider: null,
    signer: null,
    readContract: null,
    writeContract: null,
    events: [],
    eventsLoading: false,
    eventsLoaded: false,
    eventsError: null,
    myPasses: [],
    myProofs: [],
    orgEvents: [],
    orgAttendees: {},
    status: "ONLINE",
    lastActivity: Date.now(),
    rpcOk: true,
    busy: false,
    route: { path: "/", param: null },
    verifyCache: null,
  };

  /* ─────────────────────────── 4. UTILITIES ─────────────────────────── */
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = (s) =>
    String(s == null ? "" : s).replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  const shortAddr = (a) => (a ? a.slice(0, 6) + "…" + a.slice(-4) : "—");
  const isAddr = (a) => {
    try {
      return ethers.isAddress(a);
    } catch (e) {
      return false;
    }
  };
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

  function b64encode(str) {
    const bytes = new TextEncoder().encode(str);
    let bin = "";
    bytes.forEach((b) => (bin += String.fromCharCode(b)));
    return btoa(bin);
  }
  function b64decode(b64) {
    const bin = atob(b64);
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }
  function parseMetadata(uri) {
    const out = { d: "", c: "Community", l: "", tz: "", img: "", org: "" };
    if (!uri) return out;
    if (uri.startsWith("data:application/json;base64,")) {
      try {
        return Object.assign(out, JSON.parse(b64decode(uri.split(",")[1])));
      } catch (e) {
        return out;
      }
    }
    out.d = uri;
    return out;
  }
  function buildMetadata(o) {
    return "data:application/json;base64," + b64encode(JSON.stringify(o));
  }

  /* formatting */
  function fmtDate(ts, tz) {
    try {
      return new Intl.DateTimeFormat("en-GB", {
        timeZone: tz,
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(new Date(ts));
    } catch (e) {
      return new Date(ts).toDateString();
    }
  }
  function fmtDateLong(ts, tz) {
    try {
      return new Intl.DateTimeFormat("en-GB", {
        timeZone: tz,
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date(ts));
    } catch (e) {
      return new Date(ts).toDateString();
    }
  }
  function fmtTime(ts, tz) {
    try {
      return new Intl.DateTimeFormat("en-GB", {
        timeZone: tz,
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(new Date(ts));
    } catch (e) {
      return "";
    }
  }
  function fmtDateTime(ts, tz) {
    return fmtDate(ts, tz) + " · " + fmtTime(ts, tz);
  }
  function relTime(ts) {
    const diff = Date.now() - ts;
    const s = Math.floor(diff / 1000);
    if (s < 60) return "just now";
    const m = Math.floor(s / 60);
    if (m < 60) return m + "m ago";
    const h = Math.floor(m / 60);
    if (h < 24) return h + "h ago";
    const d = Math.floor(h / 24);
    if (d < 30) return d + "d ago";
    return fmtDate(ts, S.tz);
  }
  function copy(text, label) {
    navigator.clipboard.writeText(text).then(
      () => toast((label || "Copied") + " to clipboard", "ok"),
      () => toast("Unable to copy", "err"),
    );
  }

  /* toast */
  function toast(msg, kind) {
    const root = $("#toasts");
    const el = document.createElement("div");
    el.className =
      "toast " + (kind === "err" ? "err" : kind === "ok" ? "ok" : "");
    el.innerHTML =
      '<span class="bar"></span><span class="msg">' + esc(msg) + "</span>";
    root.appendChild(el);
    setTimeout(() => {
      el.classList.add("out");
      setTimeout(() => el.remove(), 320);
    }, 4600);
  }

  /* errors */
  function humanError(err) {
    if (!err) return "Something went wrong.";
    const code =
      err.code || (err.info && err.info.error && err.info.error.code);
    if (code === 4001 || code === "ACTION_REJECTED")
      return "Transaction cancelled in wallet.";
    const msg = err.shortMessage || err.reason || err.message || "";
    if (/insufficient funds/i.test(msg))
      return "Insufficient BOT for gas. Use the BOT Chain faucet.";
    if (/Already claimed/i.test(msg))
      return "This wallet has already claimed a pass for this event.";
    if (/Event full/i.test(msg)) return "This event has reached capacity.";
    if (/Not authorized/i.test(msg))
      return "Only the event organizer can perform this action.";
    if (/Already verified/i.test(msg))
      return "Attendance has already been verified for this pass.";
    if (/Event not active/i.test(msg)) return "This event is closed.";
    if (/network|fetch|timeout|failed to fetch/i.test(msg))
      return "BOT Chain connection is temporarily unavailable.";
    if (/user rejected/i.test(msg)) return "Transaction cancelled in wallet.";
    return (
      msg.replace(/^execution reverted:?\s*/i, "") ||
      "Transaction failed. Please try again."
    );
  }

  /* ─────────────────────────── 5. THEME ─────────────────────────── */
  function applyTheme(t) {
    S.theme = t;
    document.documentElement.setAttribute("data-theme", t);
    localStorage.setItem("pp.theme", t);
    const btn = $("#themeBtn");
    if (btn)
      btn.innerHTML =
        t === "dark"
          ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4"/></svg>'
          : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M20.5 14.2A8.5 8.5 0 1 1 9.8 3.5a6.8 6.8 0 0 0 10.7 10.7Z"/></svg>';
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta)
      meta.setAttribute("content", t === "dark" ? "#212324" : "#F4F1E9");
  }
  function applyMotion(m) {
    S.motion = m;
    document.documentElement.setAttribute("data-motion", m);
    localStorage.setItem("pp.motion", m);
  }
  function initPrefs() {
    const savedTheme = localStorage.getItem("pp.theme");
    const sysDark =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    applyTheme(savedTheme || (sysDark ? "dark" : "light"));

    const savedMotion = localStorage.getItem("pp.motion");
    const sysReduced =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    applyMotion(savedMotion || (sysReduced ? "reduced" : "full"));

    /* S.tz is kept only for date/time display and for the event-creation timezone
     conversion. It is derived from the browser and is not user-configurable. */
    try {
      S.tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    } catch (e) {
      S.tz = "UTC";
    }
  }

  /* ─────────────────────────── 6. TIMEZONE UTILITIES (event data only) ─────────────────────────── */
  const TIMEZONES = [
    { id: "Asia/Jakarta", city: "Jakarta", region: "Indonesia", abbr: "WIB" },
    {
      id: "Asia/Makassar",
      city: "Makassar",
      region: "Indonesia",
      abbr: "WITA",
    },
    { id: "Asia/Jayapura", city: "Jayapura", region: "Indonesia", abbr: "WIT" },
    {
      id: "Asia/Singapore",
      city: "Singapore",
      region: "Singapore",
      abbr: "SGT",
    },
    {
      id: "Asia/Kuala_Lumpur",
      city: "Kuala Lumpur",
      region: "Malaysia",
      abbr: "MYT",
    },
    { id: "Asia/Bangkok", city: "Bangkok", region: "Thailand", abbr: "ICT" },
    { id: "Asia/Manila", city: "Manila", region: "Philippines", abbr: "PHT" },
    {
      id: "Asia/Ho_Chi_Minh",
      city: "Ho Chi Minh",
      region: "Vietnam",
      abbr: "ICT",
    },
    { id: "Asia/Hong_Kong", city: "Hong Kong", region: "China", abbr: "HKT" },
    { id: "Asia/Shanghai", city: "Shanghai", region: "China", abbr: "CST" },
    { id: "Asia/Tokyo", city: "Tokyo", region: "Japan", abbr: "JST" },
    { id: "Asia/Seoul", city: "Seoul", region: "South Korea", abbr: "KST" },
    { id: "Asia/Kolkata", city: "Mumbai", region: "India", abbr: "IST" },
    { id: "Asia/Dubai", city: "Dubai", region: "UAE", abbr: "GST" },
    { id: "Europe/Istanbul", city: "Istanbul", region: "Türkiye", abbr: "TRT" },
    { id: "Europe/Moscow", city: "Moscow", region: "Russia", abbr: "MSK" },
    { id: "Africa/Cairo", city: "Cairo", region: "Egypt", abbr: "EET" },
    { id: "Europe/Berlin", city: "Berlin", region: "Germany", abbr: "CET" },
    { id: "Europe/Paris", city: "Paris", region: "France", abbr: "CET" },
    {
      id: "Europe/Amsterdam",
      city: "Amsterdam",
      region: "Netherlands",
      abbr: "CET",
    },
    {
      id: "Europe/London",
      city: "London",
      region: "United Kingdom",
      abbr: "GMT",
    },
    {
      id: "America/Sao_Paulo",
      city: "São Paulo",
      region: "Brazil",
      abbr: "BRT",
    },
    {
      id: "America/New_York",
      city: "New York",
      region: "United States",
      abbr: "ET",
    },
    {
      id: "America/Chicago",
      city: "Chicago",
      region: "United States",
      abbr: "CT",
    },
    {
      id: "America/Denver",
      city: "Denver",
      region: "United States",
      abbr: "MT",
    },
    {
      id: "America/Los_Angeles",
      city: "Los Angeles",
      region: "United States",
      abbr: "PT",
    },
    {
      id: "America/Vancouver",
      city: "Vancouver",
      region: "Canada",
      abbr: "PT",
    },
    {
      id: "Pacific/Auckland",
      city: "Auckland",
      region: "New Zealand",
      abbr: "NZST",
    },
    {
      id: "Australia/Sydney",
      city: "Sydney",
      region: "Australia",
      abbr: "AEST",
    },
    {
      id: "UTC",
      city: "UTC",
      region: "Coordinated Universal Time",
      abbr: "UTC",
    },
  ];
  function tzInfo(id) {
    return (
      TIMEZONES.find((t) => t.id === id) || {
        id: id,
        city: id,
        region: "",
        abbr: "",
      }
    );
  }
  function tzOffset(id, date) {
    try {
      const p = new Intl.DateTimeFormat("en-US", {
        timeZone: id,
        timeZoneName: "shortOffset",
      })
        .formatToParts(date || new Date())
        .find((x) => x.type === "timeZoneName");
      if (!p) return "UTC";
      return p.value.replace("GMT", "UTC").replace(/^UTC$/, "UTC+0");
    } catch (e) {
      return "UTC";
    }
  }

  /* ─────────────────────────── 7. CONNECTION STATUS ─────────────────────────── */
  const STATUS_META = {
    ONLINE: {
      color: "var(--ok)",
      label: "ONLINE",
      tip: "Connected and active.",
    },
    RECONNECTING: {
      color: "var(--warn)",
      label: "RECONNECTING",
      tip: "Reaching BOT Chain…",
    },
    OFFLINE: {
      color: "var(--bad)",
      label: "OFFLINE",
      tip: "Your browser is offline.",
    },
    IDLE: {
      color: "var(--idle)",
      label: "IDLE",
      tip: "Waiting quietly — interact to resume.",
    },
  };
  function computeStatus() {
    if (!navigator.onLine) return "OFFLINE";
    if (!S.rpcOk) return "RECONNECTING";
    if (Date.now() - S.lastActivity > 10000) return "IDLE";
    return "ONLINE";
  }
  function renderStatus() {
    const st = computeStatus();
    S.status = st;
    const m = STATUS_META[st];
    const el = $("#sysStatus");
    if (el) {
      el.title = m.tip;
      el.innerHTML =
        '<i class="dot" style="color:' +
        m.color +
        ";box-shadow:0 0 8px " +
        m.color +
        '"></i><span style="color:' +
        m.color +
        '">' +
        m.label +
        "</span>";
    }
  }
  [
    "mousemove",
    "mousedown",
    "click",
    "keydown",
    "touchstart",
    "scroll",
    "wheel",
    "focus",
  ].forEach((ev) => {
    window.addEventListener(
      ev,
      () => {
        S.lastActivity = Date.now();
      },
      { passive: true, capture: true },
    );
  });
  window.addEventListener("online", () => {
    S.rpcOk = true;
    renderStatus();
    toast("Back online", "ok");
  });
  window.addEventListener("offline", () => {
    renderStatus();
    toast("You are offline.", "err");
  });

  async function healthCheck() {
    if (!navigator.onLine) {
      S.rpcOk = false;
      renderStatus();
      return;
    }
    try {
      const net =
        NETWORKS[
          S.chainId && NETWORKS[S.chainId] ? S.chainId : CONFIG.defaultNetworkId
        ];
      const p = new ethers.JsonRpcProvider(net.rpc, net.id, {
        staticNetwork: true,
      });
      await Promise.race([
        p.getBlockNumber(),
        new Promise((_, rej) =>
          setTimeout(() => rej(new Error("timeout")), 8000),
        ),
      ]);
      S.rpcOk = true;
    } catch (e) {
      S.rpcOk = false;
      console.warn("[ProofPass] RPC health check failed:", e && e.message);
    }
    renderStatus();
  }

  /* ─────────────────────────── 8. WEB3 SERVICE ─────────────────────────── */
  function currentNetwork() {
    const id =
      S.chainId && NETWORKS[S.chainId] ? S.chainId : CONFIG.defaultNetworkId;
    return NETWORKS[id];
  }
  function contractAddress(netId) {
    return CONFIG.contractAddresses[netId || currentNetwork().id] || "";
  }
  function isConfigured() {
    return !!contractAddress();
  }

  function explorerTx(hash) {
    return currentNetwork().explorer + "/tx/" + hash;
  }
  function explorerAddr(addr) {
    return currentNetwork().explorer + "/address/" + addr;
  }
  function explorerBlock(n) {
    return currentNetwork().explorer + "/block/" + n;
  }

  async function initReadProvider() {
    const net = currentNetwork();
    try {
      S.readProvider = new ethers.JsonRpcProvider(net.rpc, net.id, {
        staticNetwork: true,
      });
      const addr = contractAddress(net.id);
      S.readContract = addr
        ? new ethers.Contract(addr, ABI, S.readProvider)
        : null;
    } catch (e) {
      console.warn("[ProofPass] read provider init failed", e);
      S.readContract = null;
    }
  }

  async function connectWallet() {
    const eth = window.ethereum;
    if (!eth) {
      toast("Please install or unlock your wallet (MetaMask).", "err");
      return;
    }
    try {
      S.busy = true;
      const accounts = await eth.request({ method: "eth_requestAccounts" });
      if (!accounts || !accounts.length) {
        S.busy = false;
        return;
      }
      S.browserProvider = new ethers.BrowserProvider(eth);
      const net = await S.browserProvider.getNetwork();
      S.chainId = Number(net.chainId);
      S.account = ethers.getAddress(accounts[0]);
      S.connected = true;

      if (!NETWORKS[S.chainId]) {
        toast(
          "Wrong network. Please switch to " +
            NETWORKS[CONFIG.defaultNetworkId].name +
            ".",
          "err",
        );
      } else {
        await attachSigner();
        toast("Wallet connected", "ok");
      }
      S.busy = false;
      await afterWalletChange();
    } catch (e) {
      S.busy = false;
      toast(humanError(e), "err");
    }
  }

  async function attachSigner() {
    if (!S.browserProvider) return;
    try {
      S.signer = await S.browserProvider.getSigner();
      const addr = contractAddress(S.chainId);
      S.writeContract = addr ? new ethers.Contract(addr, ABI, S.signer) : null;
    } catch (e) {
      console.warn("[ProofPass] signer attach failed", e);
    }
  }

  function disconnectWallet() {
    S.account = null;
    S.connected = false;
    S.signer = null;
    S.writeContract = null;
    S.myPasses = [];
    S.myProofs = [];
    S.orgEvents = [];
    toast("Wallet disconnected from this interface", "ok");
    afterWalletChange();
  }

  async function switchNetwork(netId) {
    const net = NETWORKS[netId];
    if (!net) return;
    const eth = window.ethereum;
    if (!eth) {
      toast("No wallet provider detected.", "err");
      return;
    }
    try {
      await eth.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: net.hex }],
      });
    } catch (e) {
      const code =
        e &&
        (e.code ||
          (e.data && e.data.originalError && e.data.originalError.code));
      if (code === 4902 || code === -32603) {
        try {
          await eth.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: net.hex,
                chainName: net.name,
                nativeCurrency: {
                  name: net.currency,
                  symbol: net.currency,
                  decimals: 18,
                },
                rpcUrls: [net.rpc],
                blockExplorerUrls: [net.explorer],
              },
            ],
          });
          toast(net.name + " added to wallet", "ok");
        } catch (e2) {
          toast(
            "Could not add network automatically. Add it manually in your wallet.",
            "err",
          );
          console.warn(e2);
        }
      } else {
        toast("Could not switch network automatically.", "err");
      }
    }
  }

  async function afterWalletChange() {
    await initReadProvider();
    updateWalletUI();
    if (S.connected) {
      await loadUserData();
    }
    if (["/events", "/event", "/tickets", "/wallet"].includes(S.route.path))
      render();
  }

  function updateWalletUI() {
    const btn = $("#connectBtn");
    if (btn) {
      if (S.connected && S.account) {
        btn.textContent = shortAddr(S.account);
        btn.classList.remove("btn-primary");
        btn.classList.add("btn-ghost");
        btn.title = S.account + " — click to disconnect";
      } else {
        btn.textContent = "Connect Wallet";
        btn.classList.add("btn-primary");
        btn.classList.remove("btn-ghost");
        btn.title = "Connect a browser wallet";
      }
    }
    const sysAddr = $("#sysAddr");
    if (sysAddr)
      sysAddr.textContent =
        S.connected && S.account ? shortAddr(S.account) : "NOT CONNECTED";
    const sysNet = $("#sysNet");
    if (sysNet) sysNet.textContent = currentNetwork().name.toUpperCase();
    const footNet = $("#footNet");
    if (footNet) footNet.textContent = currentNetwork().name.toUpperCase();
    const footC = $("#footContract");
    if (footC)
      footC.textContent =
        "CONTRACT: " +
        (contractAddress() ? shortAddr(contractAddress()) : "NOT CONFIGURED");
  }

  /* ─────────────────────────── 9. TX MODAL ─────────────────────────── */
  function openModal(html) {
    const m = $("#modal");
    m.innerHTML =
      '<div class="modal-card" role="dialog" aria-modal="true">' +
      html +
      "</div>";
    m.hidden = false;
    document.body.style.overflow = "hidden";
  }
  function closeModal() {
    const m = $("#modal");
    m.hidden = true;
    m.innerHTML = "";
    document.body.style.overflow = "";
  }
  $("#modal").addEventListener("click", (e) => {
    if (e.target.id === "modal") closeModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !$("#modal").hidden) closeModal();
  });

  function txModal(title, sub, steps, activeIdx, doneIdxs) {
    steps = steps || [];
    const list = steps
      .map((s, i) => {
        const cls =
          doneIdxs && doneIdxs.indexOf(i) > -1
            ? "done"
            : i === activeIdx
              ? "active"
              : "";
        const bullet =
          doneIdxs && doneIdxs.indexOf(i) > -1
            ? "✓"
            : i === activeIdx
              ? ""
              : "";
        return (
          '<div class="txstep ' +
          cls +
          '"><span class="bullet">' +
          bullet +
          '</span><span class="t">' +
          esc(s.t) +
          (s.s ? "<small>" + esc(s.s) + "</small>" : "") +
          "</span></div>"
        );
      })
      .join("");
    openModal(
      '<div class="kicker acc">' +
        esc(title) +
        "</div>" +
        '<h2 style="margin-top:8px;font-size:1.3rem">' +
        esc(sub) +
        "</h2>" +
        '<div class="txsteps">' +
        list +
        "</div>" +
        '<div id="txExtra"></div>' +
        '<div class="row gap10" style="margin-top:20px;justify-content:flex-end">' +
        '<button class="btn btn-ghost btn-sm" id="txClose">Close</button>' +
        "</div>",
    );
    const c = $("#txClose");
    if (c) c.onclick = closeModal;
  }

  async function runTransaction(opts) {
    const steps = [
      { t: "Wallet confirmation", s: "Approve the request in your wallet." },
      { t: "Submitted to BOT Chain", s: "Waiting for block inclusion." },
      {
        t: "Confirmed",
        s: opts.successNote || "Transaction confirmed on-chain.",
      },
    ];
    txModal(
      "Confirm transaction",
      "Waiting for your wallet confirmation…",
      steps,
      0,
      [],
    );
    try {
      const tx = await opts.send();
      txModal(
        "Transaction processing",
        "Your transaction has been submitted. Waiting for confirmation…",
        steps,
        1,
        [0],
      );
      const receipt = await tx.wait();
      const hash = receipt.hash || tx.hash;
      txModal(
        "Transaction confirmed",
        opts.successTitle || "Done.",
        steps,
        -1,
        [0, 1, 2],
      );
      const extra = $("#txExtra");
      if (extra) {
        extra.innerHTML =
          '<div class="card-flat" style="margin-top:4px">' +
          '<div class="kicker">Transaction hash</div>' +
          '<div class="mono xs" style="word-break:break-all;margin-top:6px">' +
          esc(hash) +
          "</div>" +
          '<a class="link-out small" style="margin-top:10px" target="_blank" rel="noopener noreferrer" href="' +
          explorerTx(hash) +
          '">View on BOT Chain Explorer ↗</a>' +
          "</div>";
      }
      try {
        opts.onSuccess && opts.onSuccess(receipt);
      } catch (e) {
        console.warn(e);
      }
      return receipt;
    } catch (err) {
      console.warn("[ProofPass] tx error", err);
      const code =
        err &&
        (err.code || (err.info && err.info.error && err.info.error.code));
      const rejected = code === 4001 || code === "ACTION_REJECTED";
      const stepsErr = steps.slice(0, 1);
      txModal(
        rejected ? "Transaction cancelled" : "Transaction failed",
        rejected ? "You rejected the request in your wallet." : humanError(err),
        stepsErr,
        -1,
        [],
      );
      if (opts.onError) opts.onError(err);
      return null;
    }
  }

  /* ─────────────────────────── 10. DEMO DATA (clearly labelled) ─────────────────────────── */
  const DEMO_EVENTS = [
    {
      demo: true,
      id: 1,
      name: "Build Week Vol.2 Hackathon",
      category: "Hackathon",
      description:
        "A 7-day build sprint for women and non-binary builders shipping real products on BOT Chain. Mentors, workshops and a demo day.",
      location: "Jakarta, Indonesia",
      tz: "Asia/Jakarta",
      timestamp: new Date("2026-09-18T09:00:00+07:00").getTime(),
      capacity: 120,
      totalClaimed: 86,
      organizer: "0x91A4C2f0b8B4A1d2E7C9a0F3b6D8e1A4c7B2Ca20",
      active: true,
    },
    {
      demo: true,
      id: 2,
      name: "On-Chain Identity Workshop",
      category: "Workshop",
      description:
        "Hands-on session on verifiable credentials, attestations and portable reputation primitives.",
      location: "Singapore",
      tz: "Asia/Singapore",
      timestamp: new Date("2026-08-02T14:00:00+08:00").getTime(),
      capacity: 60,
      totalClaimed: 41,
      organizer: "0x7A91bB3c4D5e6F7a8B9c0D1e2F3a4B5c6D7E91F2",
      active: true,
    },
    {
      demo: true,
      id: 3,
      name: "Women in Web3 Community Meetup",
      category: "Community",
      description:
        "An evening of short talks, live demos and open networking for the local Web3 community.",
      location: "Moscow, Russia",
      tz: "Europe/Moscow",
      timestamp: new Date("2026-07-24T18:30:00+03:00").getTime(),
      capacity: 150,
      totalClaimed: 150,
      organizer: "0x3C4d5E6f7A8b9C0d1E2f3A4b5C6d7E8f9A0b1C2d",
      active: true,
    },
    {
      demo: true,
      id: 4,
      name: "Smart Contract Security Bootcamp",
      category: "Technology",
      description:
        "Two-day intensive on auditing Solidity, common vulnerability classes and safe deployment practice.",
      location: "London, United Kingdom",
      tz: "Europe/London",
      timestamp: new Date("2026-10-09T09:30:00+01:00").getTime(),
      capacity: 40,
      totalClaimed: 12,
      organizer: "0x91A4C2f0b8B4A1d2E7C9a0F3b6D8e1A4c7B2Ca20",
      active: true,
    },
    {
      demo: true,
      id: 5,
      name: "Creative Coding Exhibition",
      category: "Creative",
      description:
        "Generative art and interactive installations from students and independent artists.",
      location: "Tokyo, Japan",
      tz: "Asia/Tokyo",
      timestamp: new Date("2026-11-15T11:00:00+09:00").getTime(),
      capacity: 200,
      totalClaimed: 73,
      organizer: "0x5E6f7A8b9C0d1E2f3A4b5C6d7E8f9A0b1C2d3E4f",
      active: true,
    },
  ];

  const CATEGORIES = [
    "Hackathon",
    "Conference",
    "Workshop",
    "Community",
    "Creative",
    "Technology",
    "Web3",
  ];

  /* ─────────────────────────── 11. CONTRACT READS ─────────────────────────── */
  function normalizeEvent(e) {
    const meta = parseMetadata(e.metadataURI);
    return {
      demo: false,
      id: Number(e.id),
      organizer: e.organizer,
      name: e.name,
      description: meta.d || "",
      category: meta.c || "Community",
      location: meta.l || "",
      tz: meta.tz || S.tz,
      org: meta.org || "",
      img: meta.img || "",
      timestamp: Number(e.eventTimestamp) * 1000,
      capacity: Number(e.capacity),
      totalClaimed: Number(e.totalClaimed),
      active: e.active,
    };
  }

  async function loadEvents(force) {
    if (S.eventsLoaded && !force) return;
    S.eventsLoading = true;
    S.eventsError = null;

    try {
      S.events = DEMO_EVENTS.slice();
      S.eventsLoaded = true;
    } catch (e) {
      console.warn("[ProofPass] loadEvents failed", e);
      S.eventsError = "Unable to load events.";
      S.events = [];
    } finally {
      S.eventsLoading = false;
    }
  }

  async function loadEvent(id) {
    if (!isConfigured())
      return DEMO_EVENTS.find((e) => String(e.id) === String(id)) || null;
    try {
      const c =
        S.readContract ||
        new ethers.Contract(contractAddress(), ABI, S.readProvider);
      if (!c) return null;
      const e = await c.getEvent(id);
      return normalizeEvent(e);
    } catch (e) {
      console.warn("[ProofPass] loadEvent failed", e);
      return null;
    }
  }

  async function loadUserData() {
    if (!S.connected || !S.account) return;
    if (!isConfigured()) {
      S.myContractTicket = null;
      return;
    }
    const c =
      S.readContract ||
      new ethers.Contract(contractAddress(), ABI, S.readProvider);
    if (!c) return;
    try {
      if (c.tickets) {
        const t = await c.tickets(S.account);
        const holder = t.holder || t[0];
        if (holder && holder !== "0x0000000000000000000000000000000000000000") {
          S.myContractTicket = {
            holder: holder,
            claimDate: Number(t.claimDate || t[1]) * 1000,
            isValid: t.isValid ?? t[2],
          };
        } else {
          S.myContractTicket = null;
        }
      }
    } catch (e) {
      console.warn("[ProofPass] loadUserData info:", e);
      S.myContractTicket = null;
    }
  }

  /* cached tx hashes (interface convenience only — never authoritative) */
  function cacheTx(proofId, hash) {
    try {
      const map = JSON.parse(localStorage.getItem("pp.tx") || "{}");
      map[proofId] = hash;
      localStorage.setItem("pp.tx", JSON.stringify(map));
    } catch (e) {}
  }
  function getCachedTx(proofId) {
    try {
      return JSON.parse(localStorage.getItem("pp.tx") || "{}")[proofId] || null;
    } catch (e) {
      return null;
    }
  }

  /* ─────────────────────────── 12. QR-STYLE VISUAL ─────────────────────────── */
  function qrSVG(seed, size) {
    size = size || 21;
    let h = 2166136261;
    for (let i = 0; i < seed.length; i++) {
      h ^= seed.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    let x = h >>> 0;
    const cells = [];
    for (let i = 0; i < size * size; i++) {
      x ^= x << 13;
      x >>>= 0;
      x ^= x >>> 17;
      x ^= x << 5;
      x >>>= 0;
      cells.push(x & 1);
    }
    function finder(cx, cy) {
      for (let y = 0; y < 7; y++)
        for (let xx = 0; xx < 7; xx++) {
          const on =
            y === 0 ||
            y === 6 ||
            xx === 0 ||
            xx === 6 ||
            (y >= 2 && y <= 4 && xx >= 2 && xx <= 4);
          cells[(cy + y) * size + (cx + xx)] = on ? 1 : 0;
        }
    }
    finder(0, 0);
    finder(size - 7, 0);
    finder(0, size - 7);
    let rects = "";
    for (let y = 0; y < size; y++)
      for (let xx = 0; xx < size; xx++) {
        if (cells[y * size + xx])
          rects += '<rect x="' + xx + '" y="' + y + '" width="1" height="1"/>';
      }
    return (
      '<svg viewBox="0 0 ' +
      size +
      " " +
      size +
      '" shape-rendering="crispEdges" fill="currentColor" style="color:var(--text)">' +
      rects +
      "</svg>"
    );
  }

  /* ─────────────────────────── 13. SHARED COMPONENTS ─────────────────────────── */
  function ticketHTML(o) {
    const status = o.status || "CLAIMED";
    const statusPill =
      status === "VERIFIED"
        ? '<span class="pill ok"><i class="dot"></i>VERIFIED</span>'
        : status === "REVOKED"
          ? '<span class="pill bad"><i class="dot"></i>REVOKED</span>'
          : '<span class="pill acc"><i class="dot"></i>CLAIMED</span>';
    return (
      '<div class="ticket' +
      (o.small ? " small" : "") +
      '">' +
      '<div class="ticket-top">' +
      '<div class="ticket-brandrow">' +
      '<span class="ticket-brand"> PROOFPASS</span>' +
      '<span class="mono xs dim">' +
      esc(o.serial || "—") +
      "</span>" +
      "</div>" +
      '<div class="ticket-event">' +
      esc(o.eventName || "Event") +
      "</div>" +
      '<div class="row gap8 wrapflex">' +
      statusPill +
      '<span class="pill">' +
      esc(o.network || currentNetwork().short) +
      "</span></div>" +
      '<div class="ticket-meta">' +
      '<div class="mi"><span>Date</span><b>' +
      esc(o.date || "—") +
      "</b></div>" +
      '<div class="mi"><span>Location</span><b>' +
      esc(o.location || "—") +
      "</b></div>" +
      "</div>" +
      "</div>" +
      '<div class="perf"></div>' +
      '<div class="ticket-bottom">' +
      '<div class="ticket-code">' +
      "PASS ID<b>" +
      esc(o.passId || "—") +
      "</b>" +
      '<div style="margin-top:10px">HOLDER<b>' +
      esc(o.wallet || "—") +
      "</b></div>" +
      "</div>" +
      '<div class="ticket-qr">' +
      qrSVG(String(o.passId || o.eventName || "proofpass")) +
      "</div>" +
      "</div>"
    );
  }

  function eventCardHTML(e) {
    const pct = e.capacity
      ? clamp(Math.round((e.totalClaimed / e.capacity) * 100), 0, 100)
      : 0;
    const full = e.capacity > 0 && e.totalClaimed >= e.capacity;
    return (
      '<article class="evcard" data-event="' +
      e.id +
      '" tabindex="0" role="link" aria-label="' +
      esc(e.name) +
      '">' +
      '<div class="evcard-cover">' +
      '<div class="pat"></div>' +
      '<div class="cat row gap6">' +
      '<span class="pill acc">' +
      esc(e.category) +
      "</span>" +
      (e.demo ? '<span class="pill">DEMO</span>' : "") +
      (!e.active
        ? '<span class="pill bad">CLOSED</span>'
        : full
          ? '<span class="pill warn">FULL</span>'
          : "") +
      "</div>" +
      "</div>" +
      '<div class="evcard-body">' +
      "<h3>" +
      esc(e.name) +
      "</h3>" +
      '<div class="row gap12 wrapflex small muted">' +
      "<span>" +
      esc(fmtDate(e.timestamp, S.tz)) +
      "</span>" +
      "<span>·</span>" +
      "<span>" +
      esc(e.location || "—") +
      "</span>" +
      "</div>" +
      '<div class="evcard-foot">' +
      '<div style="flex:1;min-width:120px">' +
      '<div class="row between xs dim mono"><span>' +
      e.totalClaimed +
      " / " +
      e.capacity +
      "</span><span>" +
      pct +
      "%</span></div>" +
      '<div class="capbar"><i style="width:' +
      pct +
      '%"></i></div>' +
      "</div>" +
      '<span class="mono xs dim">#' +
      String(e.id).padStart(4, "0") +
      "</span>" +
      "</div>" +
      "</div>" +
      "</article>"
    );
  }

  function sectionHead(kicker, title, sub, action) {
    return (
      '<div class="row between wrapflex gap16" style="margin-bottom:22px;align-items:flex-end">' +
      "<div>" +
      '<div class="kicker acc" style="margin-bottom:9px">' +
      esc(kicker) +
      "</div>" +
      "<h2>" +
      esc(title) +
      "</h2>" +
      (sub
        ? '<p class="muted" style="margin-top:9px;max-width:58ch">' +
          esc(sub) +
          "</p>"
        : "") +
      "</div>" +
      (action || "") +
      "</div>"
    );
  }

  function emptyState(icon, title, text) {
    return (
      '<div class="empty">' +
      '<div class="ic">' +
      (icon || "") +
      "</div>" +
      "<h3>" +
      esc(title) +
      "</h3>" +
      "<p>" +
      esc(text) +
      "</p>" +
      "</div>"
    );
  }

  const ICONS = {
    ticket:
      '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8.5A2.5 2.5 0 0 1 5.5 6h13A2.5 2.5 0 0 1 21 8.5v1a2.5 2.5 0 0 0 0 5v1A2.5 2.5 0 0 1 18.5 18h-13A2.5 2.5 0 0 1 3 15.5v-1a2.5 2.5 0 0 0 0-5v-1Z"/><path d="M12 8v.01M12 12v.01M12 16v.01"/></svg>',
    shield:
      '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7 3v6c0 4.4-3 7.9-7 9-4-1.1-7-4.6-7-9V6l7-3Z"/><path d="m9 12 2 2 4-4"/></svg>',
    globe:
      '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18Z"/></svg>',
    link: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7L11.5 5"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7L12.5 19"/></svg>',
    clock:
      '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></svg>',
    pin: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M12 21s7-5.3 7-11a7 7 0 1 0-14 0c0 5.7 7 11 7 11Z"/><circle cx="12" cy="10" r="2.6"/></svg>',
    search:
      '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/></svg>',
    ext: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4h6v6"/><path d="M20 4 10 14"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>',
    copy: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>',
    wallet:
      '<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18"/><circle cx="16" cy="14" r="1.2"/></svg>',
  };

  /* ─────────────────────────── 14. VIEWS ─────────────────────────── */

  /* -------- HOME -------- */
  function viewHome() {
    const featured = (S.events.length ? S.events : DEMO_EVENTS).slice(0, 3);
    const demoNote = !isConfigured()
      ? '<div class="banner warn"><div><b class="kicker acc">Development configuration</b><p class="small muted" style="margin-top:6px">No contract address is configured, so blockchain actions are disabled. Events shown below are clearly labelled demo data. Set <span class="mono">CONFIG.contractAddresses</span> in <span class="mono">index.html</span> after deploying <span class="mono">ProofPass.sol</span>.</p></div></div>'
      : "";

    return (
      demoNote +
      '<section class="hero">' +
      '<div class="hero-grid"></div>' +
      '<div class="hero-glow"></div>' +
      '<div class="hero-inner">' +
      "<div>" +
      '<div class="kicker acc" style="margin-bottom:16px">ProofPass · On BOT Chain</div>' +
      '<h1>Your Presence.<br><span class="l2">Your Proof.</span></h1>' +
      '<p class="hero-sub">Turn real-world participation into verifiable on-chain proof. Claim your pass, show up, get verified — and carry a permanent record of every event you attended.</p>' +
      '<div class="hero-cta">' +
      '<a class="btn btn-primary btn-lg" href="#/events">Explore Events</a>' +
      '<button class="btn btn-ghost btn-lg" id="heroConnect">Connect Wallet</button>' +
      "</div>" +
      '<div class="hero-meta">' +
      '<div class="m"><b>' +
      (S.events.length || DEMO_EVENTS.length) +
      '</b><span class="kicker">Events</span></div>' +
      '<div class="m"><b id="heroStatPasses">—</b><span class="kicker">Passes</span></div>' +
      '<div class="m"><b id="heroStatProofs">—</b><span class="kicker">Proofs</span></div>' +
      '<div class="m"><b>BOT</b><span class="kicker">Chain 968 / 677</span></div>' +
      "</div>" +
      "</div>" +
      '<div class="ticket-wrap">' +
      ticketHTML({
        eventName: "Build Week Vol.2 Hackathon",
        date: fmtDate(DEMO_EVENTS[0].timestamp, S.tz),
        location: "Jakarta, Indonesia",
        passId: "#00421",
        wallet: "0x7A91…91F2",
        serial: "PP-8F29A1",
        status: "VERIFIED",
        network: currentNetwork().short,
      }) +
      "</div>" +
      "</div>" +
      "</section>" +
      "<section>" +
      sectionHead(
        "Process",
        "How it works",
        "Four steps from presence to permanent proof.",
      ) +
      '<div class="steps">' +
      '<div class="step"><span class="n">01</span><h3>Claim</h3><p>Claim your event pass. The claim is written to BOT Chain and owned by your wallet.</p></div>' +
      '<div class="step"><span class="n">02</span><h3>Attend</h3><p>Show up in the real world. Your pass is your entry and your identity at the event.</p></div>' +
      '<div class="step"><span class="n">03</span><h3>Verify</h3><p>The organizer verifies your participation — a transaction only they can execute.</p></div>' +
      '<div class="step"><span class="n">04</span><h3>Prove</h3><p>Your participation becomes a public proof that anyone can verify on BOT Chain.</p></div>' +
      "</div>" +
      "</section>" +
      "<section>" +
      sectionHead(
        "Discovery",
        "Featured events",
        "A sample of events issuing ProofPass credentials.",
        '<a class="btn btn-ghost btn-sm" href="#/events">View all events</a>',
      ) +
      '<div class="eventgrid">' +
      featured.map(eventCardHTML).join("") +
      "</div>" +
      "</section>" +
      "<section>" +
      sectionHead(
        "Why ProofPass",
        "Participation you can actually verify",
        "Traditional tickets prove access temporarily. ProofPass creates a verifiable record of participation.",
      ) +
      '<div class="feats">' +
      '<div class="feat"><div class="ic">' +
      ICONS.shield +
      "</div><h3>Permanent</h3><p>Proofs live on-chain. They do not expire when a ticket does, and they cannot be quietly edited.</p></div>" +
      '<div class="feat"><div class="ic">' +
      ICONS.link +
      "</div><h3>Verifiable</h3><p>Anyone can check a proof ID against BOT Chain — no account, no permission, no trust required.</p></div>" +
      '<div class="feat"><div class="ic">' +
      ICONS.globe +
      "</div><h3>Portable</h3><p>Your history belongs to your wallet, not to a platform. Take it anywhere.</p></div>" +
      '<div class="feat"><div class="ic">' +
      ICONS.clock +
      "</div><h3>Transparent</h3><p>Every claim and verification is a public transaction with a timestamp and a hash.</p></div>" +
      "</div>" +
      "</section>" +
      "<section>" +
      '<div class="card" style="padding:34px;display:grid;grid-template-columns:1fr 1fr;gap:34px;align-items:center" id="passportTeaser">' +
      "<div>" +
      '<div class="kicker acc" style="margin-bottom:12px">My Tickets</div>' +
      "<h2>A portable record of everywhere you showed up.</h2>" +
      '<p class="muted" style="margin-top:14px;max-width:46ch">Every verified participation is added to your ticket history — a chronological, publicly verifiable record tied to your wallet. It proves presence. It does not claim skill.</p>' +
      '<div style="margin-top:22px"><a class="btn btn-primary" href="#/tickets">Open My Tickets</a></div>' +
      "</div>" +
      '<div class="stack gap10">' +
      '<div class="card-flat row between"><span class="mono xs dim">VERIFIED PARTICIPATIONS</span><b class="mono" id="teaserCount">-</b></div>' +
      '<div class="card-flat row between"><span class="mono xs dim">FIRST PROOF</span><b class="mono xs" id="teaserFirst">—</b></div>' +
      '<div class="card-flat row between"><span class="mono xs dim">LATEST PROOF</span><b class="mono xs" id="teaserLast">—</b></div>' +
      "</div>" +
      "</div>" +
      "</section>" +
      "<section>" +
      '<div class="card" style="padding:34px">' +
      sectionHead(
        "Verification",
        "Verify a ProofPass",
        "Paste a proof ID, event ID, or wallet address. Results come directly from BOT Chain.",
      ) +
      '<form id="homeVerifyForm" class="row gap10 wrapflex">' +
      '<input class="input mono grow" id="homeVerifyInput" placeholder="PP-8F29A1 / event ID / 0x…" style="min-width:240px" aria-label="Proof ID, event ID or wallet address">' +
      '<button class="btn btn-primary" type="submit">' +
      ICONS.search +
      " Verify</button>" +
      "</form>" +
      "</div>" +
      "</section>" +
      "<section>" +
      '<div class="card" style="padding:34px;border-color:var(--accent-line)">' +
      '<div class="row between wrapflex gap20">' +
      '<div style="max-width:62ch">' +
      '<div class="kicker acc" style="margin-bottom:12px">Network</div>' +
      "<h2>Built on BOT Chain</h2>" +
      '<p class="muted" style="margin-top:14px">ProofPass contracts are deployed on BOT Chain, an EVM-compatible network. Every pass claim, attendance verification and proof is a real transaction you can inspect in the explorer.</p>' +
      '<div class="row gap12 wrapflex" style="margin-top:20px">' +
      '<a class="btn btn-ghost btn-sm" href="https://botchain.ai/" target="_blank" rel="noopener noreferrer">botchain.ai ↗</a>' +
      '<a class="btn btn-ghost btn-sm" href="https://scan.botchain.ai/" target="_blank" rel="noopener noreferrer">Mainnet explorer ↗</a>' +
      '<a class="btn btn-ghost btn-sm" href="https://scan.bohr.life/" target="_blank" rel="noopener noreferrer">Testnet explorer ↗</a>' +
      '<a class="btn btn-ghost btn-sm" href="https://dev-docs.botchain.ai/docs/intro" target="_blank" rel="noopener noreferrer">Docs ↗</a>' +
      "</div>" +
      "</div>" +
      '<div class="stack gap8" style="min-width:210px">' +
      '<div class="card-flat row between"><span class="mono xs dim">TESTNET</span><b class="mono xs">968</b></div>' +
      '<div class="card-flat row between"><span class="mono xs dim">MAINNET</span><b class="mono xs">677</b></div>' +
      '<div class="card-flat row between"><span class="mono xs dim">CURRENCY</span><b class="mono xs">BOT</b></div>' +
      '<a class="btn btn-ghost btn-sm" href="https://faucet.botchain.ai/basic" target="_blank" rel="noopener noreferrer">Get testnet BOT ↗</a>' +
      "</div>" +
      "</div>" +
      "</div>" +
      "</section>"
    );
  }

  /* -------- EVENTS -------- */
  const F = { q: "", cat: "all", status: "all", sort: "soonest", loc: "all" };
  function viewEvents() {
    const all = S.events.length ? S.events : DEMO_EVENTS;
    let list = all.slice();

    if (F.q) {
      const q = F.q.toLowerCase();
      list = list.filter((e) =>
        (e.name + " " + e.description + " " + e.location + " " + e.category)
          .toLowerCase()
          .includes(q),
      );
    }
    if (F.cat !== "all") list = list.filter((e) => e.category === F.cat);
    if (F.status === "open")
      list = list.filter((e) => e.active && e.totalClaimed < e.capacity);
    if (F.status === "full")
      list = list.filter((e) => e.totalClaimed >= e.capacity);
    if (F.status === "closed") list = list.filter((e) => !e.active);
    if (F.loc !== "all") list = list.filter((e) => e.location === F.loc);
    if (F.sort === "soonest") list.sort((a, b) => a.timestamp - b.timestamp);
    if (F.sort === "latest") list.sort((a, b) => b.timestamp - a.timestamp);
    if (F.sort === "capacity") list.sort((a, b) => b.capacity - a.capacity);

    const locations = Array.from(
      new Set(all.map((e) => e.location).filter(Boolean)),
    ).sort();

    const cats = [
      '<button class="chip' +
        (F.cat === "all" ? " on" : "") +
        '" data-cat="all">All</button>',
    ]
      .concat(
        CATEGORIES.map(
          (c) =>
            '<button class="chip' +
            (F.cat === c ? " on" : "") +
            '" data-cat="' +
            c +
            '">' +
            c +
            "</button>",
        ),
      )
      .join("");

    const body = S.eventsLoading
      ? '<div class="eventgrid">' +
        Array(3)
          .fill('<div class="skel" style="height:250px"></div>')
          .join("") +
        "</div>"
      : list.length
        ? '<div class="eventgrid">' +
          list.map(eventCardHTML).join("") +
          "</div>"
        : emptyState(
            '<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/></svg>',
            "No events found",
            "Try another category, location or search term.",
          );

    const banner = !isConfigured()
      ? '<div class="banner warn"><div><b class="kicker acc">Development configuration</b><p class="small muted" style="margin-top:6px">No contract address configured — showing clearly labelled demo events. Blockchain actions are disabled until <span class="mono">CONFIG.contractAddresses</span> is set.</p></div></div>'
      : S.eventsError
        ? '<div class="banner warn"><div><p class="small">' +
          esc(S.eventsError) +
          "</p></div></div>"
        : "";

    return (
      banner +
      sectionHead(
        "Events",
        "Find an event, claim your pass, and start building your proof history.",
      ) +
      '<div class="card" style="padding:18px;margin-bottom:22px">' +
      '<div class="row gap12 wrapflex" style="margin-bottom:14px">' +
      '<div class="grow" style="min-width:220px;position:relative">' +
      '<span style="position:absolute;left:13px;top:50%;transform:translateY(-50%);color:var(--text-3)">' +
      ICONS.search +
      "</span>" +
      '<input class="input" id="evSearch" placeholder="Search events…" value="' +
      esc(F.q) +
      '" style="padding-left:38px" aria-label="Search events">' +
      "</div>" +
      '<select class="select" id="evSort" style="width:auto;min-width:170px" aria-label="Sort events">' +
      '<option value="soonest"' +
      (F.sort === "soonest" ? " selected" : "") +
      ">Soonest first</option>" +
      '<option value="latest"' +
      (F.sort === "latest" ? " selected" : "") +
      ">Latest first</option>" +
      '<option value="capacity"' +
      (F.sort === "capacity" ? " selected" : "") +
      ">Largest capacity</option>" +
      "</select>" +
      '<select class="select" id="evLoc" style="width:auto;min-width:170px" aria-label="Filter by location">' +
      '<option value="all">All locations</option>' +
      locations
        .map(
          (l) =>
            '<option value="' +
            esc(l) +
            '"' +
            (F.loc === l ? " selected" : "") +
            ">" +
            esc(l) +
            "</option>",
        )
        .join("") +
      "</select>" +
      "</div>" +
      '<div class="chips" style="margin-bottom:12px">' +
      cats +
      "</div>" +
      '<div class="chips">' +
      ["all:All status", "open:Open", "full:Full", "closed:Closed"]
        .map((s) => {
          const parts = s.split(":");
          return (
            '<button class="chip' +
            (F.status === parts[0] ? " on" : "") +
            '" data-status="' +
            parts[0] +
            '">' +
            parts[1] +
            "</button>"
          );
        })
        .join("") +
      "</div>" +
      "</div>" +
      '<div class="row between" style="margin-bottom:14px"><span class="mono xs dim">' +
      list.length +
      " RESULT" +
      (list.length === 1 ? "" : "S") +
      "</span>" +
      '<button class="btn btn-quiet btn-sm" id="evReset">Reset filters</button></div>' +
      body
    );
  }

  /* -------- EVENT DETAILS -------- */
  async function viewEventDetail(id) {
    const view = $("#view");
    view.innerHTML =
      '<div class="skel" style="height:220px;margin-bottom:20px"></div><div class="skel" style="height:320px"></div>';

    // Ambil data event dari daftar demo lokal berdasarkan ID yang diklik
    const e =
      DEMO_EVENTS.find((ev) => String(ev.id) === String(id)) || DEMO_EVENTS[0];

    const pct = e.capacity
      ? clamp(Math.round((e.totalClaimed / e.capacity) * 100), 0, 100)
      : 0;
    const full = e.capacity > 0 && e.totalClaimed >= e.capacity;

    let cta;
    if (!S.connected) {
      cta =
        '<button class="btn btn-primary btn-lg" id="claimConnect">Hubungkan Dompet untuk Klaim</button>';
    } else if (!isConfigured()) {
      cta =
        '<button class="btn btn-primary btn-lg is-disabled" disabled>Contract Address Belum Diset</button>';
    } else {
      cta =
        '<button class="btn btn-primary btn-lg" id="claimBtn">Klaim Tiket Saya (claimTicket)</button>';
    }

    view.innerHTML =
      '<a class="btn btn-quiet btn-sm" href="#/events" style="margin-bottom:18px">← Kembali ke Event</a>' +
      '<div class="grid2" style="grid-template-columns:1.35fr .65fr;gap:34px;align-items:start" id="evDetailGrid">' +
      "<div>" +
      '<div class="row gap8 wrapflex" style="margin-bottom:16px">' +
      '<span class="pill acc">' +
      esc(e.category) +
      "</span>" +
      '<span class="pill">TICKET CONTRACT READY</span>' +
      "</div>" +
      '<h1 style="font-size:clamp(1.9rem,4.4vw,2.9rem);margin-bottom:14px">' +
      esc(e.name) +
      "</h1>" +
      '<p class="muted" style="font-size:1.02rem;max-width:62ch">' +
      esc(
        e.description ||
          "Klaim tiket on-chain langsung ke smart contract kamu.",
      ) +
      "</p>" +
      '<div class="grid2" style="margin-top:30px">' +
      '<div class="card-flat"><div class="kicker">Waktu</div><div style="margin-top:8px;font-weight:500">' +
      esc(fmtDateLong(e.timestamp, S.tz)) +
      "</div></div>" +
      '<div class="card-flat"><div class="kicker">Lokasi</div><div style="margin-top:8px;font-weight:500">' +
      esc(e.location || "—") +
      "</div></div>" +
      '<div class="card-flat"><div class="kicker">Organizer</div><div class="mono small" style="margin-top:8px">' +
      esc(shortAddr(e.organizer)) +
      "</div>" +
      (e.org ? '<div class="small muted">' + esc(e.org) + "</div>" : "") +
      "</div>" +
      '<div class="card-flat"><div class="kicker">Event ID</div><div class="mono" style="margin-top:8px;font-size:1.1rem">#' +
      String(e.id).padStart(4, "0") +
      "</div></div>" +
      "</div>" +
      "</div>" +
      "<div>" +
      '<div class="card" style="position:sticky;top:120px">' +
      '<div class="kicker" style="margin-bottom:10px">Status Klaim Tiket</div>' +
      '<div style="margin-top:22px">' +
      cta +
      "</div>" +
      '<p class="xs dim" style="margin-top:12px">Tombol ini akan memanggil fungsi <b>claimTicket()</b> di Smart Contract kamu secara langsung.</p>' +
      "</div>" +
      "</div>" +
      "</div>";

    // Event listener untuk tombol klaim
    const cc = $("#claimConnect");
    if (cc) cc.onclick = connectWallet;

    const cb = $("#claimBtn");
    if (cb) {
      cb.onclick = async () => {
        if (!S.connected) {
          toast("Hubungkan dompet terlebih dahulu.", "err");
          return;
        }
        if (!isConfigured()) {
          toast("Contract Address belum dikonfigurasi.", "err");
          return;
        }
        await runTransaction({
          send: () => S.writeContract.claimTicket(),
          successTitle: "Tiket Berhasil Diklaim!",
          successNote: "Transaksi claimTicket sukses di-mining ke blockchain.",
          onSuccess: async () => {
            await loadUserData();
          },
        });
      };
    }
  }

  /* -------- MY TICKETS (former Dashboard) -------- */
  function viewTickets() {
    if (!S.connected) {
      return (
        sectionHead(
          "My Tickets",
          "Connect your wallet to see your passes and proofs.",
        ) +
        emptyState(
          '<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18"/></svg>',
          "Wallet not connected",
          "Connect a browser wallet to view your ProofPass tickets.",
        ) +
        '<div class="row center" style="margin-top:20px"><button class="btn btn-primary" id="ticketsConnect">Connect Wallet</button></div>'
      );
    }
    const claimedCount = S.myPasses.length + (S.myContractTicket ? 1 : 0);
    const verifiedCount = S.myPasses.filter((p) => p.attended).length;
    const proofCount = S.myProofs.length;

    let userTicketHTML = "";
    if (S.myContractTicket) {
      const t = S.myContractTicket;
      userTicketHTML =
        '<div class="card-flat row between gap12 wrapflex" style="margin-bottom:10px">' +
        '<div style="min-width:180px"><div style="font-weight:500">TicketContract Pass</div>' +
        '<div class="mono xs dim" style="margin-top:4px">HOLDER: ' +
        esc(shortAddr(t.holder)) +
        " · DIKLAIM: " +
        fmtDate(t.claimDate, S.tz) +
        "</div></div>" +
        '<div class="row gap8"><span class="pill ' +
        (t.isValid ? "ok" : "bad") +
        '"><i class="dot"></i>' +
        (t.isValid ? "VALID" : "INVALID") +
        "</span></div>" +
        "</div>";
    }

    const passRows =
      userTicketHTML ||
      emptyState(
        "",
        "No tickets yet",
        "Claim a pass for an event to start your participation record.",
      );

    const proofRows = S.myProofs.length
      ? S.myProofs
          .map(
            (p) =>
              '<div class="card-flat row between gap12 wrapflex" style="margin-bottom:10px">' +
              '<div><div class="mono" style="font-weight:600">' +
              esc(p.proofId) +
              "</div>" +
              '<div class="xs dim" style="margin-top:4px">Event #' +
              p.eventId +
              " · " +
              esc(fmtDate(p.verifiedAt, S.tz)) +
              "</div></div>" +
              '<div class="row gap8">' +
              (p.valid
                ? '<span class="pill ok">VALID</span>'
                : '<span class="pill bad">REVOKED</span>') +
              '<a class="btn btn-ghost btn-sm" href="#/verify/' +
              encodeURIComponent(p.proofId) +
              '">Verify</a>' +
              "</div>" +
              "</div>",
          )
          .join("")
      : emptyState(
          "",
          "No verified proofs yet",
          "Once an organizer verifies your attendance, the proof appears here.",
        );

    return (
      sectionHead(
        "Account",
        "My Tickets",
        "Your claimed passes, verified attendances and on-chain proofs.",
      ) +
      '<div class="stats" style="margin-bottom:26px">' +
      '<div class="stat"><span class="bar"></span><b>' +
      String(claimedCount).padStart(2, "0") +
      "</b><span>Claimed passes</span></div>" +
      '<div class="stat"><span class="bar"></span><b>' +
      String(verifiedCount).padStart(2, "0") +
      "</b><span>Verified attendances</span></div>" +
      '<div class="stat"><span class="bar"></span><b>' +
      String(proofCount).padStart(2, "0") +
      "</b><span>On-chain proofs</span></div>" +
      '<div class="stat"><span class="bar"></span><b style="font-size:1.05rem;letter-spacing:0">' +
      esc(shortAddr(S.account)) +
      "</b><span>Connected wallet</span></div>" +
      "</div>" +
      '<div class="grid2" style="gap:22px">' +
      '<div class="card"><div class="kicker" style="margin-bottom:16px">Claimed passes</div>' +
      passRows +
      "</div>" +
      '<div class="card"><div class="kicker" style="margin-bottom:16px">On-chain proofs</div>' +
      proofRows +
      "</div>" +
      "</div>" +
      '<div class="card" style="margin-top:22px">' +
      '<div class="kicker" style="margin-bottom:16px">System</div>' +
      '<div class="kv">' +
      '<div><div class="k">Network</div><div class="v">' +
      esc(currentNetwork().name) +
      "</div></div>" +
      '<div><div class="k">Chain ID</div><div class="v mono">' +
      currentNetwork().id +
      "</div></div>" +
      '<div><div class="k">Status</div><div class="v">' +
      esc(STATUS_META[computeStatus()].label) +
      "</div></div>" +
      '<div><div class="k">Contract</div><div class="v mono">' +
      (contractAddress()
        ? esc(shortAddr(contractAddress()))
        : "Not configured") +
      "</div></div>" +
      "</div>" +
      "</div>"
    );
  }

  /* -------- WALLET -------- */
  function viewWallet() {
    if (!S.connected) {
      return (
        sectionHead(
          "Wallet",
          "Manage your connected wallet and BOT Chain network.",
        ) +
        emptyState(
          ICONS.wallet,
          "Wallet not connected",
          "Connect a browser wallet to interact with ProofPass on BOT Chain.",
        ) +
        '<div class="row center" style="margin-top:20px"><button class="btn btn-primary" id="walletConnect">Connect Wallet</button></div>'
      );
    }
    const net = currentNetwork();
    const st = STATUS_META[computeStatus()];
    return (
      sectionHead(
        "Wallet",
        "Wallet",
        "Your connected wallet, network and connection status.",
      ) +
      '<div class="grid2" style="gap:22px">' +
      '<div class="card">' +
      '<div class="kicker" style="margin-bottom:14px">Connected wallet</div>' +
      '<div class="mono" style="font-size:.95rem;word-break:break-all">' +
      esc(S.account) +
      "</div>" +
      '<div class="row gap10 wrapflex" style="margin-top:16px">' +
      '<button class="btn btn-ghost btn-sm" data-copy="' +
      esc(S.account) +
      '">' +
      ICONS.copy +
      " Copy address</button>" +
      '<button class="btn btn-ghost btn-sm" id="walletDisconnect">Disconnect</button>' +
      "</div>" +
      "</div>" +
      '<div class="card">' +
      '<div class="kicker" style="margin-bottom:14px">Network</div>' +
      '<div style="font-weight:500;font-size:1.05rem">' +
      esc(net.name) +
      "</div>" +
      '<div class="small muted" style="margin-top:6px">Chain ID ' +
      net.id +
      " · " +
      esc(net.currency) +
      "</div>" +
      '<div class="row gap10 wrapflex" style="margin-top:16px">' +
      '<button class="btn btn-ghost btn-sm" id="walletSwitch">Switch network</button>' +
      '<a class="btn btn-ghost btn-sm" target="_blank" rel="noopener noreferrer" href="' +
      net.explorer +
      '">Explorer ↗</a>' +
      "</div>" +
      "</div>" +
      '<div class="card">' +
      '<div class="kicker" style="margin-bottom:14px">Status</div>' +
      '<div class="row gap8"><i class="dot" style="color:' +
      st.color +
      ";box-shadow:0 0 8px " +
      st.color +
      '"></i>' +
      '<b style="font-family:var(--mono);font-size:.82rem;color:' +
      st.color +
      '">' +
      st.label +
      "</b></div>" +
      '<p class="small muted" style="margin-top:10px">' +
      esc(st.tip) +
      "</p>" +
      "</div>" +
      '<div class="card">' +
      '<div class="kicker" style="margin-bottom:14px">Contract</div>' +
      '<div class="mono small" style="word-break:break-all">' +
      (contractAddress() ? esc(contractAddress()) : "Not configured") +
      "</div>" +
      (contractAddress()
        ? '<a class="link-out small" style="margin-top:12px" target="_blank" rel="noopener noreferrer" href="' +
          explorerAddr(contractAddress()) +
          '">View on BOT Chain Explorer ↗</a>'
        : "") +
      "</div>" +
      "</div>"
    );
  }

  /* -------- VERIFY -------- */
  async function viewVerify(prefill) {
    const view = $("#view");
    const q = prefill || "";
    view.innerHTML =
      '<div style="max-width:720px;margin:20px auto 40px;text-align:center">' +
      '<div class="kicker acc" style="margin-bottom:14px">Public verification</div>' +
      '<h1 style="font-size:clamp(1.8rem,4.6vw,2.7rem)">Verify a ProofPass</h1>' +
      '<p class="muted" style="margin-top:14px">Verify an on-chain participation proof. No wallet required — results are read directly from BOT Chain.</p>' +
      '<form id="verifyForm" class="row gap10 wrapflex" style="margin-top:26px;justify-content:center">' +
      '<input class="input mono grow" id="verifyInput" placeholder="Proof ID · Event ID · Wallet address" value="' +
      esc(q) +
      '" style="min-width:260px;max-width:420px" aria-label="Proof ID, event ID or wallet address">' +
      '<button class="btn btn-primary" type="submit">' +
      ICONS.search +
      " Verify</button>" +
      "</form>" +
      '<div class="row gap8 wrapflex center" style="margin-top:14px">' +
      '<span class="xs dim mono">EXAMPLES</span>' +
      '<button class="copychip" data-fill="PP-8F29A1">PP-8F29A1</button>' +
      '<button class="copychip" data-fill="1">event ID 1</button>' +
      "</div>" +
      "</div>" +
      '<div id="verifyResult"></div>';

    if (q) doVerify(q);
  }

  async function doVerify(raw) {
    const out = $("#verifyResult");
    if (!out) return;
    const q = String(raw || "").trim();
    if (!q) {
      out.innerHTML = "";
      return;
    }

    if (!isConfigured()) {
      out.innerHTML =
        '<div class="verdict warn"><div class="verdict-head"><span class="verdict-mark">!</span><h2>Not available</h2></div>' +
        '<p class="muted">No ProofPass contract address is configured for ' +
        esc(currentNetwork().name) +
        '. Deploy <span class="mono">ProofPass.sol</span> and set <span class="mono">CONFIG.contractAddresses</span> in <span class="mono">index.html</span> to enable verification.</p></div>';
      return;
    }

    out.innerHTML = '<div class="skel" style="height:190px"></div>';

    try {
      const c =
        S.readContract ||
        new ethers.Contract(contractAddress(), ABI, S.readProvider);

      /* --- Proof ID --- */
      if (/^PP-/i.test(q)) {
        const id = q.toUpperCase();
        const res = await c.verifyProof(id);
        const found = res[0];
        const p = res[1];
        if (!found) {
          out.innerHTML = verdictNotFound(q);
          return;
        }
        const proof = {
          proofId: p.proofId,
          eventId: Number(p.eventId),
          passId: Number(p.passId),
          attendee: p.attendee,
          organizer: p.organizer,
          verifiedAt: Number(p.verifiedAt) * 1000,
          valid: p.valid,
        };
        if (!proof.valid) {
          out.innerHTML = verdictRevoked(proof);
          return;
        }
        const ev =
          S.events.find((e) => e.id === proof.eventId) ||
          (await loadEvent(proof.eventId));
        out.innerHTML = verdictValid(proof, ev);
        return;
      }

      /* --- Wallet address --- */
      if (isAddr(q)) {
        const ids = await c.getProofIdsOf(q);
        if (!ids.length) {
          out.innerHTML = verdictNotFound(q);
          return;
        }
        const proofs = [];
        for (const id of ids) {
          try {
            const p = await c.getProof(id);
            proofs.push(p);
          } catch (e) {}
        }
        out.innerHTML = verdictList(
          q,
          proofs.map((p) => ({
            proofId: p.proofId,
            eventId: Number(p.eventId),
            passId: Number(p.passId),
            attendee: p.attendee,
            organizer: p.organizer,
            verifiedAt: Number(p.verifiedAt) * 1000,
            valid: p.valid,
          })),
        );
        return;
      }

      /* --- Event ID --- */
      if (/^\d+$/.test(q)) {
        const ev = await loadEvent(Number(q));
        if (!ev) {
          out.innerHTML = verdictNotFound(q);
          return;
        }
        const passIds = await c.getEventAttendees(Number(q));
        const proofs = [];
        for (const pid of passIds) {
          try {
            const proofId = await c.getProofOfPass(pid);
            if (proofId) {
              const p = await c.getProof(proofId);
              proofs.push({
                proofId: p.proofId,
                eventId: Number(p.eventId),
                passId: Number(p.passId),
                attendee: p.attendee,
                organizer: p.organizer,
                verifiedAt: Number(p.verifiedAt) * 1000,
                valid: p.valid,
              });
            }
          } catch (e) {}
        }
        out.innerHTML = verdictEvent(ev, proofs);
        return;
      }

      out.innerHTML = verdictNotFound(q);
    } catch (e) {
      console.warn("[ProofPass] verify failed", e);
      out.innerHTML =
        '<div class="verdict bad"><div class="verdict-head"><span class="verdict-mark">×</span><h2>Unable to read ProofPass contract state</h2></div>' +
        '<p class="muted">The BOT Chain connection is temporarily unavailable. Please try again.</p></div>';
    }
  }

  function proofMetaBlock(proof) {
    const txHash = getCachedTx(proof.proofId);
    return (
      '<div class="kv">' +
      '<div><div class="k">Participant</div><div class="v mono">' +
      esc(proof.attendee) +
      "</div></div>" +
      '<div><div class="k">Organizer</div><div class="v mono">' +
      esc(proof.organizer) +
      "</div></div>" +
      '<div><div class="k">Verified</div><div class="v">' +
      esc(fmtDateLong(proof.verifiedAt, S.tz)) +
      "</div></div>" +
      '<div><div class="k">Proof ID</div><div class="v mono">' +
      esc(proof.proofId) +
      "</div></div>" +
      '<div><div class="k">Event ID</div><div class="v mono">#' +
      String(proof.eventId).padStart(4, "0") +
      "</div></div>" +
      '<div><div class="k">Network</div><div class="v">' +
      esc(currentNetwork().name) +
      "</div></div>" +
      "</div>" +
      '<div class="row gap10 wrapflex" style="margin-top:22px">' +
      (txHash
        ? '<a class="btn btn-primary btn-sm" target="_blank" rel="noopener noreferrer" href="' +
          explorerTx(txHash) +
          '">View transaction on BOT Chain Explorer ↗</a>'
        : '<a class="btn btn-primary btn-sm" target="_blank" rel="noopener noreferrer" href="' +
          explorerAddr(contractAddress()) +
          '">View contract on BOT Chain Explorer ↗</a>') +
      '<button class="btn btn-ghost btn-sm" id="shareProof" data-proof="' +
      esc(proof.proofId) +
      '">Share proof</button>' +
      '<button class="btn btn-ghost btn-sm" data-copy="' +
      esc(proof.proofId) +
      '">' +
      ICONS.copy +
      " Copy ID</button>" +
      "</div>" +
      (txHash
        ? '<p class="xs dim" style="margin-top:10px">Transaction hash cached locally in this browser. The authoritative record is on BOT Chain.</p>'
        : "")
    );
  }

  function verdictValid(proof, ev) {
    return (
      '<div class="verdict ok">' +
      '<div class="scanline"></div>' +
      '<div class="verdict-head"><span class="verdict-mark">✓</span><div><h2>Verified</h2>' +
      '<p class="small muted" style="margin-top:4px">This participation proof exists on BOT Chain.</p></div></div>' +
      (ev
        ? '<div style="margin-top:20px"><div class="kicker">Event</div><div style="font-size:1.15rem;font-weight:600;margin-top:6px">' +
          esc(ev.name) +
          "</div>" +
          '<div class="small muted" style="margin-top:4px">' +
          esc(fmtDate(ev.timestamp, S.tz)) +
          " · " +
          esc(ev.location || "—") +
          "</div></div>"
        : "") +
      proofMetaBlock(proof) +
      "</div>"
    );
  }
  function verdictRevoked(proof) {
    return (
      '<div class="verdict warn">' +
      '<div class="verdict-head"><span class="verdict-mark">!</span><div><h2>Proof revoked</h2>' +
      '<p class="small muted" style="margin-top:4px">This proof exists, but it is no longer valid.</p></div></div>' +
      proofMetaBlock(proof) +
      "</div>"
    );
  }
  function verdictNotFound(q) {
    return (
      '<div class="verdict bad">' +
      '<div class="verdict-head"><span class="verdict-mark">×</span><div><h2>Proof not found</h2>' +
      '<p class="small muted" style="margin-top:4px">No matching on-chain proof was found.</p></div></div>' +
      '<div class="kv"><div><div class="k">Query</div><div class="v mono">' +
      esc(q) +
      "</div></div>" +
      '<div><div class="k">Network</div><div class="v">' +
      esc(currentNetwork().name) +
      "</div></div></div>" +
      "</div>"
    );
  }
  function verdictList(q, proofs) {
    const rows = proofs
      .map(
        (p) =>
          '<div class="card-flat row between gap12 wrapflex" style="margin-bottom:10px">' +
          '<div><div class="mono" style="font-weight:600">' +
          esc(p.proofId) +
          "</div>" +
          '<div class="xs dim" style="margin-top:4px">Event #' +
          p.eventId +
          " · " +
          esc(fmtDate(p.verifiedAt, S.tz)) +
          "</div></div>" +
          '<div class="row gap8">' +
          (p.valid
            ? '<span class="pill ok">VALID</span>'
            : '<span class="pill bad">REVOKED</span>') +
          '<a class="btn btn-ghost btn-sm" href="#/verify/' +
          encodeURIComponent(p.proofId) +
          '">Open</a></div>' +
          "</div>",
      )
      .join("");
    return (
      '<div class="verdict ok"><div class="verdict-head"><span class="verdict-mark">✓</span>' +
      "<div><h2>" +
      proofs.length +
      " proof" +
      (proofs.length === 1 ? "" : "s") +
      " found</h2>" +
      '<p class="small muted" style="margin-top:4px">Results read directly from BOT Chain for <span class="mono">' +
      esc(shortAddr(q)) +
      "</span>.</p></div></div>" +
      '<div style="margin-top:20px">' +
      rows +
      "</div></div>"
    );
  }
  function verdictEvent(ev, proofs) {
    return (
      '<div class="verdict ok"><div class="verdict-head"><span class="verdict-mark">✓</span>' +
      "<div><h2>" +
      esc(ev.name) +
      "</h2>" +
      '<p class="small muted" style="margin-top:4px">Event #' +
      String(ev.id).padStart(4, "0") +
      " · " +
      proofs.length +
      " verified participation" +
      (proofs.length === 1 ? "" : "s") +
      "</p></div></div>" +
      '<div class="kv" style="margin-top:20px">' +
      '<div><div class="k">Date</div><div class="v">' +
      esc(fmtDate(ev.timestamp, S.tz)) +
      "</div></div>" +
      '<div><div class="k">Location</div><div class="v">' +
      esc(ev.location || "—") +
      "</div></div>" +
      '<div><div class="k">Capacity</div><div class="v">' +
      ev.totalClaimed +
      " / " +
      ev.capacity +
      "</div></div>" +
      '<div><div class="k">Status</div><div class="v">' +
      (ev.active ? "Active" : "Closed") +
      "</div></div>" +
      "</div>" +
      '<div style="margin-top:22px">' +
      (proofs.length
        ? proofs
            .map(
              (p) =>
                '<div class="card-flat row between gap12 wrapflex" style="margin-bottom:10px"><div><div class="mono" style="font-weight:600">' +
                esc(p.proofId) +
                '</div><div class="xs dim" style="margin-top:4px">' +
                esc(shortAddr(p.attendee)) +
                "</div></div>" +
                '<div class="row gap8">' +
                (p.valid
                  ? '<span class="pill ok">VALID</span>'
                  : '<span class="pill bad">REVOKED</span>') +
                '<a class="btn btn-ghost btn-sm" href="#/verify/' +
                encodeURIComponent(p.proofId) +
                '">Open</a></div></div>',
            )
            .join("")
        : '<p class="small muted">No proofs have been issued for this event yet.</p>') +
      "</div>" +
      "</div>"
    );
  }

  /* -------- SETTINGS -------- */
  function viewSettings() {
    const net = currentNetwork();
    return (
      sectionHead(
        "Settings",
        "Appearance, network and motion preferences are stored locally in your browser.",
      ) +
      '<div class="grid2" style="gap:22px">' +
      '<div class="card">' +
      '<div class="kicker" style="margin-bottom:16px">Appearance</div>' +
      '<div class="row gap10">' +
      '<button class="chip' +
      (S.theme === "dark" ? " on" : "") +
      '" data-theme-set="dark">Dark</button>' +
      '<button class="chip' +
      (S.theme === "light" ? " on" : "") +
      '" data-theme-set="light">Light</button>' +
      "</div>" +
      '<p class="small muted" style="margin-top:14px">ProofPass uses a warm graphite dark theme and a parchment light theme.<span class="mono"></span></p>' +
      "</div>" +
      '<div class="card">' +
      '<div class="kicker" style="margin-bottom:16px">Network</div>' +
      '<div class="row between gap12 wrapflex">' +
      '<div><div style="font-weight:500">' +
      esc(net.name) +
      '</div><div class="small muted">Chain ID ' +
      net.id +
      " · " +
      esc(net.currency) +
      "</div></div>" +
      '<button class="btn btn-ghost btn-sm" id="switchNetBtn">Switch network</button>' +
      "</div>" +
      '<div class="mono xs dim" style="margin-top:12px">RPC ' +
      esc(net.rpc) +
      "</div>" +
      "</div>" +
      '<div class="card">' +
      '<div class="kicker" style="margin-bottom:16px">Contract</div>' +
      '<div class="mono small">' +
      (contractAddress() ? esc(contractAddress()) : "Not configured") +
      "</div>" +
      '<p class="small muted" style="margin-top:12px">Testnet and mainnet addresses are configured in <span class="mono">CONFIG.contractAddresses</span> inside <span class="mono">index.html</span>.</p>' +
      (contractAddress()
        ? '<a class="link-out small" style="margin-top:10px" target="_blank" rel="noopener noreferrer" href="' +
          explorerAddr(contractAddress()) +
          '">View on BOT Chain Explorer ↗</a>'
        : "") +
      "</div>" +
      "</div>"
    );
  }

  /* ─────────────────────────── 15. ROUTER ─────────────────────────── */
  function parseRoute() {
    const raw = (location.hash || "#/").replace(/^#/, "") || "/";
    const parts = raw.split("/").filter(Boolean);
    return {
      path: "/" + (parts[0] || ""),
      param: parts[1] ? decodeURIComponent(parts[1]) : null,
      raw,
    };
  }

  async function render() {
    const r = parseRoute();
    S.route = r;
    const view = $("#view");
    window.scrollTo({
      top: 0,
      behavior: "instant" in window ? "instant" : "auto",
    });

    $$("#navlinks a").forEach((a) => {
      const target = a.getAttribute("data-route");
      a.classList.toggle(
        "active",
        target === r.path || (r.path === "/event" && target === "/events"),
      );
    });

    switch (r.path) {
      case "/":
        view.innerHTML = viewHome();
        bindHome();
        if (!S.eventsLoaded) {
          loadEvents().then(() => {
            if (S.route.path === "/") {
              view.innerHTML = viewHome();
              bindHome();
            }
          });
        }
        updateHomeStats();
        break;

      case "/events":
        view.innerHTML = viewEvents();
        bindEvents();
        if (!S.eventsLoaded && !S.eventsLoading)
          loadEvents().then(() => {
            if (S.route.path === "/events") render();
          });
        break;

      case "/event":
        await viewEventDetail(r.param);
        bindEventDetail();
        if (!S.eventsLoaded) loadEvents().then(() => {});
        break;

      case "/tickets":
        view.innerHTML = viewTickets();
        bindSimple();
        break;

      case "/wallet":
        view.innerHTML = viewWallet();
        bindWallet();
        break;

      case "/verify":
        await viewVerify(r.param);
        bindVerify();
        break;

      case "/settings":
        view.innerHTML = viewSettings();
        bindSettings();
        break;

      default:
        view.innerHTML =
          emptyState(
            '<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16v.01"/></svg>',
            "Page not found",
            "The route you requested does not exist.",
          ) +
          '<div class="row center" style="margin-top:20px"><a class="btn btn-primary" href="#/">Back to home</a></div>';
    }
    updateWalletUI();
  }

  /* ─────────────────────────── 16. BINDINGS ─────────────────────────── */
  function bindSimple() {
    const c1 = $("#ticketsConnect");
    if (c1) c1.onclick = connectWallet;
    $$("[data-copy]").forEach(
      (b) => (b.onclick = () => copy(b.getAttribute("data-copy"), "Address")),
    );
  }

  function bindWallet() {
    const wc = $("#walletConnect");
    if (wc) wc.onclick = connectWallet;
    const wd = $("#walletDisconnect");
    if (wd)
      wd.onclick = () => {
        disconnectWallet();
        render();
      };
    const ws = $("#walletSwitch");
    if (ws) ws.onclick = openNetworkModal;
    $$("[data-copy]").forEach(
      (b) => (b.onclick = () => copy(b.getAttribute("data-copy"), "Address")),
    );
  }

  async function updateHomeStats() {
    const set = (id, v) => {
      const el = document.getElementById(id);
      if (el) el.textContent = v;
    };
    if (!isConfigured() || !S.readContract) {
      set("heroStatPasses", "—");
      set("heroStatProofs", "—");
      return;
    }
    // Menggunakan totalClaimed dari TicketContract buatanmu
    S.readContract
      .totalClaimed()
      .then((n) => set("heroStatPasses", Number(n)))
      .catch(() => set("heroStatPasses", "—"));

    // Karena contract kustom tidak punya proofCount, kita set 0 atau strip
    set("heroStatProofs", "0");

    set("teaserCount", String(S.myProofs.length).padStart(2, "0"));
  }

  function bindHome() {
    const hc = $("#heroConnect");
    if (hc)
      hc.onclick = () => {
        S.connected ? (location.hash = "#/tickets") : connectWallet();
      };
    const hw = $("#homeWallet");
    if (hw)
      hw.onclick = () => {
        S.connected ? (location.hash = "#/wallet") : connectWallet();
      };
    const hv = $("#homeVerifyForm");
    if (hv)
      hv.onsubmit = (e) => {
        e.preventDefault();
        const v = $("#homeVerifyInput").value.trim();
        if (v) location.hash = "#/verify/" + encodeURIComponent(v);
      };
    updateHomeStats();
  }

  function bindEvents() {
    const s = $("#evSearch");
    if (s) {
      let tmr;
      s.oninput = () => {
        clearTimeout(tmr);
        tmr = setTimeout(() => {
          F.q = s.value;
          render();
          const el = $("#evSearch");
          if (el) {
            el.focus();
            el.setSelectionRange(el.value.length, el.value.length);
          }
        }, 260);
      };
    }
    const so = $("#evSort");
    if (so)
      so.onchange = () => {
        F.sort = so.value;
        render();
      };
    const lo = $("#evLoc");
    if (lo)
      lo.onchange = () => {
        F.loc = lo.value;
        render();
      };
    const rs = $("#evReset");
    if (rs)
      rs.onclick = () => {
        F.q = "";
        F.cat = "all";
        F.status = "all";
        F.sort = "soonest";
        F.loc = "all";
        render();
      };
    $$("[data-cat]").forEach(
      (b) =>
        (b.onclick = () => {
          F.cat = b.getAttribute("data-cat");
          render();
        }),
    );
    $$("[data-status]").forEach(
      (b) =>
        (b.onclick = () => {
          F.status = b.getAttribute("data-status");
          render();
        }),
    );
    bindEventCards();
  }
  function bindEventCards() {
    $$("[data-event]").forEach((card) => {
      const go = () => {
        location.hash = "#/event/" + card.getAttribute("data-event");
      };
      card.onclick = go;
      card.onkeydown = (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          go();
        }
      };
    });
  }

  function bindEventDetail() {
    const cc = $("#claimConnect");
    if (cc) cc.onclick = connectWallet;
    const cb = $("#claimBtn");
    if (cb) {
      cb.onclick = async () => {
        if (!S.connected) {
          toast("Hubungkan dompet terlebih dahulu.", "err");
          return;
        }
        if (!isConfigured()) {
          toast("Contract Address belum dikonfigurasi.", "err");
          return;
        }
        await runTransaction({
          send: () => S.writeContract.claimTicket({ gasLimit: 300000 }),
          successTitle: "Tiket Berhasil Diklaim!",
          successNote: "Transaksi claimTicket sukses di-mining ke blockchain.",
          onSuccess: async () => {
            await loadUserData();
            if (typeof render === "function") render();
          },
        });
      };
    }
  }

  function bindVerify() {
    const f = $("#verifyForm");
    if (f)
      f.onsubmit = (e) => {
        e.preventDefault();
        const v = $("#verifyInput").value.trim();
        if (!v) return;
        history.replaceState(null, "", "#/verify/" + encodeURIComponent(v));
        doVerify(v);
      };
    $$("[data-fill]").forEach(
      (b) =>
        (b.onclick = () => {
          const el = $("#verifyInput");
          el.value = b.getAttribute("data-fill");
          el.focus();
        }),
    );
    const sp = $("#shareProof");
    if (sp)
      sp.onclick = () => {
        const id = sp.getAttribute("data-proof");
        const url = CONFIG.appUrl + "/#/verify/" + encodeURIComponent(id);
        copy(url, "Verification link");
      };
    $$("[data-copy]").forEach(
      (b) => (b.onclick = () => copy(b.getAttribute("data-copy"), "Proof ID")),
    );
  }

  /* Convert a local wall-clock date+time in an IANA zone to an epoch timestamp. */
  function zonedTimeToEpoch(dateStr, timeStr, tz) {
    try {
      const [y, m, d] = dateStr.split("-").map(Number);
      const [hh, mm] = timeStr.split(":").map(Number);
      const guess = Date.UTC(y, m - 1, d, hh, mm, 0);
      const off1 = zoneOffsetMs(tz, guess);
      let ts = guess - off1;
      const off2 = zoneOffsetMs(tz, ts);
      if (off2 !== off1) ts = guess - off2;
      return ts;
    } catch (e) {
      return null;
    }
  }
  function zoneOffsetMs(tz, epochMs) {
    try {
      const dtf = new Intl.DateTimeFormat("en-US", {
        timeZone: tz,
        hour12: false,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      const parts = dtf.formatToParts(new Date(epochMs));
      const o = {};
      parts.forEach((p) => {
        if (p.type !== "literal") o[p.type] = p.value;
      });
      const asUTC = Date.UTC(
        Number(o.year),
        Number(o.month) - 1,
        Number(o.day),
        Number(o.hour === "24" ? "0" : o.hour),
        Number(o.minute),
        Number(o.second),
      );
      return asUTC - epochMs;
    } catch (e) {
      return 0;
    }
  }

  function bindSettings() {
    $$("[data-theme-set]").forEach(
      (b) =>
        (b.onclick = () => {
          applyTheme(b.getAttribute("data-theme-set"));
          render();
        }),
    );
    $$("[data-motion-set]").forEach(
      (b) =>
        (b.onclick = () => {
          applyMotion(b.getAttribute("data-motion-set"));
          render();
        }),
    );
    const sn = $("#switchNetBtn");
    if (sn) sn.onclick = openNetworkModal;
    const dc = $("#disconnectBtn");
    if (dc)
      dc.onclick = () => {
        disconnectWallet();
        render();
      };
    const sc = $("#settingsConnect");
    if (sc) sc.onclick = connectWallet;
    $$("[data-copy]").forEach(
      (b) => (b.onclick = () => copy(b.getAttribute("data-copy"), "Address")),
    );
  }

  /* ─────────────────────────── 17. NETWORK MODAL ─────────────────────────── */
  function openNetworkModal() {
    openModal(
      '<div class="kicker acc">Network</div>' +
        '<h2 style="margin-top:8px;font-size:1.35rem">BOT Chain networks</h2>' +
        SUPPORTED_IDS.map((id) => {
          const n = NETWORKS[id];
          const active = currentNetwork().id === id;
          return (
            '<div class="card-flat row between gap12 wrapflex" style="margin-top:14px">' +
            '<div><div style="font-weight:500">' +
            esc(n.name) +
            (active
              ? ' <span class="pill acc" style="margin-left:6px">ACTIVE</span>'
              : "") +
            "</div>" +
            '<div class="mono xs dim" style="margin-top:5px">CHAIN ' +
            n.id +
            " · " +
            esc(n.rpc) +
            "</div></div>" +
            '<button class="btn ' +
            (active ? "btn-ghost" : "btn-primary") +
            ' btn-sm" data-net="' +
            id +
            '">' +
            (active ? "Reconnect" : "Switch") +
            "</button>" +
            "</div>"
          );
        }).join("") +
        '<div class="card-flat" style="margin-top:16px">' +
        '<div class="kicker">Testnet faucet</div>' +
        '<p class="small muted" style="margin-top:8px">Need gas? Get testnet BOT from the official faucet.</p>' +
        '<a class="link-out small" style="margin-top:10px" target="_blank" rel="noopener noreferrer" href="' +
        NETWORKS[968].faucet +
        '">faucet.botchain.ai ↗</a>' +
        "</div>" +
        '<div class="row" style="justify-content:flex-end;margin-top:20px"><button class="btn btn-ghost btn-sm" id="netClose">Close</button></div>',
    );
    $("#netClose").onclick = closeModal;
    $$("[data-net]").forEach(
      (b) =>
        (b.onclick = async () => {
          await switchNetwork(Number(b.getAttribute("data-net")));
          closeModal();
          setTimeout(render, 800);
        }),
    );
  }

  /* ─────────────────────────── 18. GLOBAL BINDINGS ─────────────────────────── */
  $("#themeBtn").onclick = () =>
    applyTheme(S.theme === "dark" ? "light" : "dark");
  $("#connectBtn").onclick = () => {
    if (S.connected) {
      openModal(
        '<div class="kicker acc">Wallet</div>' +
          '<h2 style="margin-top:8px;font-size:1.3rem">' +
          esc(shortAddr(S.account)) +
          "</h2>" +
          '<div class="card-flat" style="margin-top:16px"><div class="kicker">Full address</div>' +
          '<div class="mono xs" style="margin-top:6px;word-break:break-all">' +
          esc(S.account) +
          "</div></div>" +
          '<div class="card-flat" style="margin-top:10px"><div class="kicker">Network</div>' +
          '<div class="small" style="margin-top:6px">' +
          esc(currentNetwork().name) +
          " · Chain " +
          currentNetwork().id +
          "</div></div>" +
          (NETWORKS[S.chainId]
            ? ""
            : '<div class="banner warn" style="margin-top:14px"><div><p class="small"><b>Wrong network.</b> Please switch to ' +
              esc(NETWORKS[CONFIG.defaultNetworkId].name) +
              ".</p>" +
              '<button class="btn btn-primary btn-sm" id="mSwitch" style="margin-top:12px">Switch Network</button></div></div>') +
          '<div class="row gap10 wrapflex" style="margin-top:20px;justify-content:flex-end">' +
          '<button class="btn btn-ghost btn-sm" data-copy="' +
          esc(S.account) +
          '">Copy address</button>' +
          '<button class="btn btn-ghost btn-sm" id="mDisconnect">Disconnect</button>' +
          "</div>",
      );
      $$("[data-copy]").forEach(
        (b) => (b.onclick = () => copy(b.getAttribute("data-copy"), "Address")),
      );
      const sw = $("#mSwitch");
      if (sw)
        sw.onclick = () => {
          switchNetwork(CONFIG.defaultNetworkId);
          closeModal();
        };
      const md = $("#mDisconnect");
      if (md)
        md.onclick = () => {
          disconnectWallet();
          closeModal();
          render();
        };
    } else {
      connectWallet();
    }
  };

  window.addEventListener("hashchange", render);

  /* ─────────────────────────── 19. WALLET EVENTS ─────────────────────────── */
  if (window.ethereum) {
    window.ethereum.on &&
      window.ethereum.on("accountsChanged", async (accounts) => {
        if (!accounts || !accounts.length) {
          S.account = null;
          S.connected = false;
          S.signer = null;
          S.writeContract = null;
          toast("Wallet disconnected", "err");
        } else {
          S.account = ethers.getAddress(accounts[0]);
          S.connected = true;
          await attachSigner();
        }
        await afterWalletChange();
      });
    window.ethereum.on &&
      window.ethereum.on("chainChanged", async (hexId) => {
        S.chainId = parseInt(hexId, 16);
        if (!NETWORKS[S.chainId]) {
          toast("Unsupported network. Please switch to BOT Chain.", "err");
          S.writeContract = null;
        } else {
          await attachSigner();
          toast("Network: " + NETWORKS[S.chainId].name, "ok");
        }
        await afterWalletChange();
      });
  }

  /* ─────────────────────────── 20. BOOT ─────────────────────────── */
  function boot() {
    $("#year").textContent = new Date().getFullYear();
    initPrefs();
    renderStatus();

    const firstVisit = !sessionStorage.getItem("pp.booted");
    const reduce =
      document.documentElement.getAttribute("data-motion") === "reduced" ||
      (window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const bootEl = $("#boot");
    const appEl = $("#app");

    if (firstVisit && !reduce) {
      setTimeout(() => bootEl.classList.add("done"), 2950);
      setTimeout(() => {
        appEl.classList.add("ready");
        bootEl.style.display = "none";
      }, 3450);
    } else {
      bootEl.classList.add("boot--short");
      setTimeout(() => bootEl.classList.add("done"), 700);
      setTimeout(() => {
        appEl.classList.add("ready");
        bootEl.style.display = "none";
      }, 1050);
    }
    try {
      sessionStorage.setItem("pp.booted", "1");
    } catch (e) {}

    // Routing + data
    render();
    initReadProvider().then(() => {
      updateWalletUI();
      loadEvents(true).then(() => {
        if (["/", "/events"].includes(S.route.path)) render();
        updateHomeStats();
      });
    });

    // Auto-reconnect if the wallet is already authorised
    if (window.ethereum && window.ethereum.request) {
      window.ethereum
        .request({ method: "eth_accounts" })
        .then(async (accounts) => {
          if (accounts && accounts.length) {
            S.browserProvider = new ethers.BrowserProvider(window.ethereum);
            const net = await S.browserProvider.getNetwork();
            S.chainId = Number(net.chainId);
            S.account = ethers.getAddress(accounts[0]);
            S.connected = true;
            await attachSigner();
            await afterWalletChange();
          }
        })
        .catch(() => {});
    }

    // Timers
    setInterval(() => {
      renderStatus();
    }, 1000);
    setInterval(healthCheck, 25000);
    setTimeout(healthCheck, 2500);

    // Home live widgets
    setInterval(() => {
      const el = $("#homeStatus");
      if (el) {
        const m = STATUS_META[computeStatus()];
        el.innerHTML =
          '<div class="row gap8"><i class="dot" style="color:' +
          m.color +
          ";box-shadow:0 0 8px " +
          m.color +
          '"></i>' +
          '<b style="font-family:var(--mono);font-size:.8rem;color:' +
          m.color +
          '">' +
          m.label +
          "</b></div>" +
          '<p class="xs dim" style="margin-top:8px">' +
          esc(m.tip) +
          "</p>";
      }
    }, 1000);

    // Refresh on-chain data when the tab regains focus
    let lastFocus = 0;
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden && Date.now() - lastFocus > 20000) {
        lastFocus = Date.now();
        if (S.connected)
          loadUserData().then(() => {
            if (["/tickets", "/wallet"].includes(S.route.path)) render();
          });
      }
    });
  }

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
