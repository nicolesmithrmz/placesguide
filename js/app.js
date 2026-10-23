/* Nicole's Guide: tabs, home highlights, map, filters and swipe cards. */
(function () {
  "use strict";

  var CATEGORIES = {
    restaurant: { label: "Restaurants" },
    coffee: { label: "Coffee" },
    bar: { label: "Bars" },
    special: { label: "Special places" }
  };
  var STATUSES = [
    { value: "all", label: "All" },
    { value: "been", label: "Been" },
    { value: "want_to_try", label: "Want to try" }
  ];

  var places = [];
  var filters = { city: "", types: {}, status: "all" };
  var filtered = [];

  var map = null;
  var cluster = null;
  var swiper = null;
  var markers = {};
  var selectedId = null;

  function $(id) { return document.getElementById(id); }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function initialOf(p) { return String(p.name || "?").trim().charAt(0).toUpperCase(); }

  function stars(n) {
    if (!n) return "";
    return '<span class="stars" aria-label="' + n + ' out of 5">' + "★".repeat(n) + "☆".repeat(5 - n) + "</span>";
  }

  function formatDate(s) {
    if (!s) return "";
    var d = new Date(s + "T00:00:00");
    return isNaN(d) ? "" : d.toLocaleDateString(undefined, { month: "short", year: "numeric" });
  }

  /* ---------------- data ---------------- */

  function load() {
    return fetch("data/places.json", { cache: "no-cache" })
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      });
  }

  /* ---------------- routing ---------------- */

  function parseHash() {
    var parts = location.hash.replace(/^#/, "").split("/");
    var tab = parts[0] === "map" ? "map" : "home";
    return { tab: tab, id: tab === "map" && parts[1] ? decodeURIComponent(parts[1]) : null };
  }

  function route() {
    var r = parseHash();
    ["home", "map"].forEach(function (t) {
      $(t).classList.toggle("active", t === r.tab);
    });
    document.querySelectorAll(".tabs a").forEach(function (a) {
      if (a.dataset.tab === r.tab) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
    if (r.tab === "map") showMap(r.id);
    else window.scrollTo(0, 0);
  }

  /* ---------------- home ---------------- */

  function miniCard(p) {
    var thumb = p.photos && p.photos.length
      ? '<img src="' + esc(p.photos[0]) + '" alt="' + esc(p.name) + '" loading="lazy">'
      : '<span class="initial">' + esc(initialOf(p)) + "</span>";
    var meta = [(CATEGORIES[p.category] || {}).label, p.city].filter(Boolean).join(" · ");
    return '<article class="mini">' +
      '<div class="thumb">' + thumb + "</div>" +
      '<div class="body">' +
        "<h3>" + esc(p.name) + "</h3>" +
        '<div class="meta">' + esc(meta) + "</div>" +
        stars(p.rating) +
        (p.review ? '<p class="snippet">' + esc(p.review) + "</p>" : "") +
        '<a class="see" href="#map/' + encodeURIComponent(p.id) + '"><span>See on map</span></a>' +
      "</div></article>";
  }

  function fillBlock(id, list, emptyText) {
    $(id).innerHTML = list.length ? list.map(miniCard).join("") : '<p class="note">' + esc(emptyText) + "</p>";
  }

  function renderHome() {
    var been = places.filter(function (p) { return p.status === "been"; });
    var want = places.filter(function (p) { return p.status === "want_to_try"; });
    var cities = {}, countries = {};
    places.forEach(function (p) { cities[p.city] = 1; countries[p.country] = 1; });

    $("stats").innerHTML = [
      [been.length, "places visited"],
      [Object.keys(cities).length, "cities"],
      [Object.keys(countries).length, "countries"],
      [want.length, "want to try"]
    ].map(function (s) {
      return '<div class="stat"><strong>' + s[0] + "</strong><span class=\"label\">" + s[1] + "</span></div>";
    }).join("");

    var favs = been.filter(function (p) { return p.rating >= 4; }).sort(function (a, b) {
      return b.rating - a.rating || String(b.visited_on).localeCompare(String(a.visited_on));
    }).slice(0, 3);
    var recent = places.slice().sort(function (a, b) {
      return String(b.added).localeCompare(String(a.added));
    }).slice(0, 3);

    fillBlock("favourites", favs, "Favourites will show up here once places have a 4 or 5 star rating.");
    fillBlock("recent", recent, "Nothing added yet.");
    fillBlock("wishlist", want.slice(0, 3), "Nothing on the wish list yet.");
  }

  /* ---------------- filters ---------------- */

  function applyFilters() {
    var typeKeys = Object.keys(filters.types).filter(function (k) { return filters.types[k]; });
    filtered = places.filter(function (p) {
      if (filters.city && p.city !== filters.city) return false;
      if (typeKeys.length && typeKeys.indexOf(p.category) === -1) return false;
      if (filters.status !== "all" && p.status !== filters.status) return false;
      return true;
    }).sort(function (a, b) {
      return a.city.localeCompare(b.city) || a.name.localeCompare(b.name);
    });
  }

  function buildFilters() {
    var cities = {};
    places.forEach(function (p) { cities[p.city] = p.country; });
    var sel = $("city-filter");
    sel.innerHTML = '<option value="">All cities</option>' + Object.keys(cities).sort().map(function (c) {
      return '<option value="' + esc(c) + '">' + esc(c) + ", " + esc(cities[c]) + "</option>";
    }).join("");
    sel.onchange = function () { filters.city = sel.value; refresh(true); };

    var chips = $("type-chips");
    chips.innerHTML = Object.keys(CATEGORIES).map(function (k) {
      return '<button type="button" class="chip" data-type="' + k + '" aria-pressed="false">' +
        esc(CATEGORIES[k].label) + "</button>";
    }).join("");
    chips.onclick = function (e) {
      var b = e.target.closest("button");
      if (!b) return;
      var k = b.dataset.type;
      filters.types[k] = !filters.types[k];
      b.setAttribute("aria-pressed", String(!!filters.types[k]));
      refresh(true);
    };

    var seg = $("status-toggle");
    seg.innerHTML = STATUSES.map(function (s) {
      return '<button type="button" data-status="' + s.value + '" aria-pressed="' + (s.value === filters.status) + '">' + esc(s.label) + "</button>";
    }).join("");
    seg.onclick = function (e) {
      var b = e.target.closest("button");
      if (!b) return;
      filters.status = b.dataset.status;
      seg.querySelectorAll("button").forEach(function (x) {
        x.setAttribute("aria-pressed", String(x === b));
      });
      refresh(true);
    };
  }

  function resetFilters() {
    filters = { city: "", types: {}, status: "all" };
    $("city-filter").value = "";
    $("type-chips").querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-pressed", "false"); });
    $("status-toggle").querySelectorAll("button").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.dataset.status === "all"));
    });
  }

  /* ---------------- map ---------------- */

  function pinIcon(p, selected) {
    return L.divIcon({
      className: "pin " + p.status + (selected ? " selected" : ""),
      html: "<span></span>",
      iconSize: selected ? [22, 22] : [14, 14],
      iconAnchor: selected ? [11, 11] : [7, 7]
    });
  }

  function slideHtml(p) {
    var photos = p.photos && p.photos.length
      ? p.photos.map(function (src) {
          return '<img src="' + esc(src) + '" alt="' + esc(p.name) + '" loading="lazy">';
        }).join("")
      : '<div class="ph"><span class="initial">' + esc(initialOf(p)) + "</span></div>";
    var tags = (p.tags || []).map(function (t) { return '<span class="tag">' + esc(t) + "</span>"; }).join("");
    var status = p.status === "been" ? "Been" : "Want to try";
    var meta = [(CATEGORIES[p.category] || {}).label, p.city + ", " + p.country, formatDate(p.visited_on)]
      .filter(Boolean).join(" · ");
    return '<div class="swiper-slide"><article class="place">' +
      "<header><h3>" + esc(p.name) + '</h3><span class="badge ' + p.status + '">' + status + "</span></header>" +
      '<div class="meta">' + esc(meta) + "</div>" +
      stars(p.rating) +
      '<div class="photos swiper-no-swiping">' + photos + "</div>" +
      (p.review ? '<p class="review">' + esc(p.review) + "</p>" : "") +
      (tags ? '<div class="tags">' + tags + "</div>" : "") +
      (p.address ? '<p class="addr">' + esc(p.address) + "</p>" : "") +
      "</article></div>";
  }

  function initMap() {
    map = L.map("leaflet-map", { worldCopyJump: true, minZoom: 2, zoomControl: true }).setView([25, 10], 2);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    cluster = L.markerClusterGroup({ showCoverageOnHover: false, maxClusterRadius: 40 });
    map.addLayer(cluster);

    swiper = new Swiper("#place-swiper", {
      slidesPerView: 1.06,
      spaceBetween: 10,
      noSwipingClass: "swiper-no-swiping",
      navigation: { prevEl: ".swiper-button-prev", nextEl: ".swiper-button-next" },
      breakpoints: { 900: { slidesPerView: 1, spaceBetween: 12 } },
      on: { slideChange: function (s) { select(s.activeIndex, true); } }
    });
  }

  function select(index, fly) {
    var p = filtered[index];
    if (!p) return;
    if (selectedId && markers[selectedId]) {
      var prev = places.filter(function (x) { return x.id === selectedId; })[0];
      if (prev) markers[selectedId].setIcon(pinIcon(prev, false));
    }
    selectedId = p.id;
    markers[p.id].setIcon(pinIcon(p, true));
    if (fly) map.flyTo([p.lat, p.lng], Math.max(map.getZoom(), 13), { duration: 0.8 });
  }

  function goTo(index) {
    if (swiper.activeIndex === index) select(index, true);
    else swiper.slideTo(index); // slideChange selects and flies
  }

  function refresh(fit) {
    applyFilters();
    cluster.clearLayers();
    markers = {};
    selectedId = null;

    filtered.forEach(function (p, i) {
      var m = L.marker([p.lat, p.lng], { icon: pinIcon(p, false), title: p.name, keyboard: true });
      m.on("click", function () { goTo(i); });
      markers[p.id] = m;
      cluster.addLayer(m);
    });

    $("place-slides").innerHTML = filtered.map(slideHtml).join("");
    swiper.update();
    swiper.slideTo(0, 0, false);

    var n = filtered.length;
    $("result-count").textContent = n + (n === 1 ? " place" : " places");
    $("empty").hidden = n > 0;
    $("place-swiper").hidden = n === 0;

    if (n) {
      select(0, false);
      if (fit) {
        var b = L.latLngBounds(filtered.map(function (p) { return [p.lat, p.lng]; }));
        map.flyToBounds(b.pad(0.25), { maxZoom: filters.city ? 14 : 5, duration: 0.8 });
      }
    }
  }

  function showMap(id) {
    if (!map) {
      initMap();
      refresh(!id);
    } else {
      map.invalidateSize(); // otherwise the map renders grey after the tab was hidden
      swiper.update();
    }
    if (id) {
      var i = indexOf(id);
      if (i === -1) {
        resetFilters();
        refresh(false);
        i = indexOf(id);
      }
      if (i > -1) setTimeout(function () { map.invalidateSize(); goTo(i); }, 50);
    }
  }

  function indexOf(id) {
    for (var i = 0; i < filtered.length; i++) if (filtered[i].id === id) return i;
    return -1;
  }

  /* ---------------- start ---------------- */

  load().then(function (data) {
    places = data;
    buildFilters();
    renderHome();
    window.addEventListener("hashchange", route);
    route();
  }).catch(function (err) {
    $("stats").innerHTML = '<p class="note">Could not load the places (' + esc(err.message) + "). Try refreshing the page.</p>";
    console.error(err);
  });
})();
