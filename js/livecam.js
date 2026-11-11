"use strict";

/* Live cam section. Fills every element marked data-livecam.
   Needs js/i18n.js loaded first (OVT). The YouTube player is only loaded after a click,
   so visitors who don't press play never talk to YouTube. */

const LIVECAM = {
  videoId: "-iR3wqKW378", // the 24/7 live stream
  channelUrl: "https://www.youtube.com/@OpenVungTau",
};
// Embedding needs "Allow embedding" ticked on the video in YouTube Studio (done). If it is ever turned off, the poster
// links out to YouTube instead (set to true once embedding is allowed).
LIVECAM.embed = true;
LIVECAM.subscribeUrl = `${LIVECAM.channelUrl}?sub_confirmation=1`;
LIVECAM.watchUrl = `https://www.youtube.com/watch?v=${LIVECAM.videoId}`; // the like button and live chat live here
LIVECAM.embedUrl = `https://www.youtube-nocookie.com/embed/${LIVECAM.videoId}?autoplay=1&mute=1`;

(() => {
  const NS = "http://www.w3.org/2000/svg";

  function el(tag, className, text) {
    const n = document.createElement(tag);
    if (className) n.className = className;
    if (text != null) n.textContent = text;
    return n;
  }

  function link(className, href, text) {
    const a = el("a", className, text);
    a.href = href;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    return a;
  }

  // A drawn sea scene with a play button: stands in for the player until it is clicked.
  function poster() {
    const s = document.createElementNS(NS, "svg");
    s.setAttribute("viewBox", "0 0 320 180");
    s.setAttribute("class", "livecam-art");
    s.setAttribute("aria-hidden", "true");
    s.setAttribute("focusable", "false");
    const shapes = [
      ["rect", { width: 320, height: 180, fill: "#A9D3CE" }],
      ["circle", { cx: 236, cy: 60, r: 28, fill: "#F2B45A" }],
      ["path", { d: "M0 92 L70 62 L120 84 L170 70 L220 92 V110 H0Z", fill: "#7BA9A6" }],
      ["rect", { y: 104, width: 320, height: 76, fill: "#5B97A0" }],
      ["path", { d: "M0 126h320M0 146h320M0 166h320", stroke: "#E9F3EF", "stroke-width": 3, "stroke-dasharray": "30 20", fill: "none" }],
    ];
    for (const [tag, attrs] of shapes) {
      const n = document.createElementNS(NS, tag);
      for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
      s.append(n);
    }
    return s;
  }

  function play(frame) {
    const t = OVT.t;
    const iframe = el("iframe", "livecam-frame");
    iframe.src = LIVECAM.embedUrl;
    iframe.title = t("livecam.frameTitle");
    iframe.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
    iframe.setAttribute("allowfullscreen", "");
    iframe.referrerPolicy = "strict-origin-when-cross-origin";
    frame.replaceChildren(iframe);
  }

  function build(slot) {
    const t = OVT.t;
    const wasPlaying = slot.querySelector(".livecam-frame");

    const frame = el("div", "livecam-player");
    if (LIVECAM.embed && wasPlaying) {
      play(frame);
    } else {
      // Embedding allowed: a button that swaps in the player. Otherwise: a plain link to the stream.
      const btn = LIVECAM.embed ? el("button", "livecam-play") : link("livecam-play", LIVECAM.watchUrl, "");
      if (LIVECAM.embed) btn.type = "button";
      btn.setAttribute("aria-label", t(LIVECAM.embed ? "livecam.watch" : "livecam.watchOnYoutube"));
      const playBtn = el("span", "livecam-playbtn");
      const tri = document.createElementNS(NS, "svg");
      tri.setAttribute("viewBox", "0 0 24 24");
      tri.setAttribute("width", "28");
      tri.setAttribute("height", "28");
      tri.setAttribute("aria-hidden", "true");
      const path = document.createElementNS(NS, "path");
      path.setAttribute("d", "M8 5v14l11-7z");
      path.setAttribute("fill", "currentColor");
      tri.append(path);
      playBtn.append(tri);
      btn.append(poster(), el("span", "stamp stamp-live", "LIVE"), playBtn);
      if (!LIVECAM.embed) btn.append(el("span", "livecam-caption", t("livecam.watchOnYoutube")));
      if (LIVECAM.embed) btn.addEventListener("click", () => play(frame));
      frame.append(btn);
    }

    const text = el("div", "livecam-text");
    const title = el("h2", "hand", t("livecam.title"));
    const actions = el("div", "livecam-actions");
    actions.append(
      link("btn btn-primary", LIVECAM.subscribeUrl, t("livecam.subscribe")),
      link("btn", LIVECAM.watchUrl, t("livecam.chat"))
    );
    text.append(
      title,
      el("p", null, t("livecam.lead")),
      el("p", null, t("livecam.meet")),
      el("p", "sticky livecam-support", t("livecam.support")),
      actions,
      el("p", "livecam-privacy", t(LIVECAM.embed ? "livecam.privacy" : "livecam.opens"))
    );
    // If the stream won't play, point people at the channel.
    const fallback = el("p", "livecam-privacy", t("livecam.fallback") + " ");
    fallback.append(link("", LIVECAM.channelUrl, t("livecam.fallbackLink")));
    text.append(fallback);

    slot.className = "livecam";
    slot.replaceChildren(text, frame);
  }

  function renderAll() {
    document.querySelectorAll("[data-livecam]").forEach(build);
  }

  OVT.ready.then(() => {
    renderAll();
    document.addEventListener("ovt:lang", renderAll);
  });
})();
