(function(){
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------- Reticle cursor ---------------- */
  var reticle = document.getElementById("reticle");
  var hasFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (reticle && hasFinePointer && !reduceMotion) {
    var rx = window.innerWidth/2, ry = window.innerHeight/2, cx = rx, cy = ry;
    window.addEventListener("mousemove", function(e){ rx = e.clientX; ry = e.clientY; }, { passive:true });

    function loop(){
      cx += (rx - cx) * 0.18;
      cy += (ry - cy) * 0.18;
      reticle.style.transform = "translate(" + cx + "px," + cy + "px) translate(-50%,-50%)";
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);

    var interactiveSel = "a, button, .btn";
    document.querySelectorAll(interactiveSel).forEach(function(el){
      el.addEventListener("mouseenter", function(){ reticle.classList.add("is-active"); });
      el.addEventListener("mouseleave", function(){ reticle.classList.remove("is-active"); });
    });
    var zoomSel = ".case-gallery figure";
    document.querySelectorAll(zoomSel).forEach(function(el){
      el.addEventListener("mouseenter", function(){ reticle.classList.add("is-zoom"); });
      el.addEventListener("mouseleave", function(){ reticle.classList.remove("is-zoom"); });
    });
  } else if (reticle) {
    reticle.style.display = "none";
  }

  /* ---------------- Mobile nav show/hide ---------------- */
  var nav = document.getElementById("nav");
  var lastY = window.scrollY;
  window.addEventListener("scroll", function(){
    var y = window.scrollY;
    if (nav) {
      nav.classList.toggle("scrolled", y > 40);
      if (y > lastY && y > 200) { nav.classList.add("nav-hidden"); }
      else { nav.classList.remove("nav-hidden"); }
    }
    lastY = y;
  }, { passive:true });

  /* ---------------- Side TOC visibility control ---------------- */
  var sideToc = document.getElementById("sideToc");
  var hero = document.querySelector(".hero");
  var isMouseOnLeft = false;

  function showSideToc(){
    if (sideToc) {
      var heroRect = hero ? hero.getBoundingClientRect() : null;
      var isPastHero = heroRect ? heroRect.bottom <= 0 : true;

      if (isPastHero) {
        sideToc.classList.add("is-visible");
      }
    }
  }

  function hideSideToc(){
    if (sideToc) {
      sideToc.classList.remove("is-visible");
    }
  }

  // Track mouse position on left edge
  window.addEventListener("mousemove", function(e){
    var wasOnLeft = isMouseOnLeft;
    isMouseOnLeft = e.clientX < 80;

    if (isMouseOnLeft !== wasOnLeft) {
      if (isMouseOnLeft) {
        showSideToc();
      } else {
        hideSideToc();
      }
    }
  }, { passive:true });

  // Hide on any click
  window.addEventListener("click", function(e){
    // Don't hide if clicking inside the sidebar itself
    if (sideToc && !sideToc.contains(e.target)) {
      hideSideToc();
    }
  }, { passive:true });

  // Hide on scroll
  window.addEventListener("scroll", function(){
    if (!isMouseOnLeft) {
      hideSideToc();
    }
  }, { passive:true });

  /* ---------------- Scroll reveal (staggered) ---------------- */
  var revealTargets = document.querySelectorAll(".reveal");
  // add stagger to figures inside galleries
  document.querySelectorAll(".case-gallery").forEach(function(grid){
    var figs = grid.querySelectorAll("figure");
    figs.forEach(function(fig, i){
      fig.classList.add("reveal", "reveal-stagger");
      fig.style.setProperty("--stagger-delay", (Math.min(i,4) * 0.09) + "s");
    });
  });
  revealTargets = document.querySelectorAll(".reveal");

  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -60px 0px" });
    revealTargets.forEach(function(el){ io.observe(el); });
  } else {
    revealTargets.forEach(function(el){ el.classList.add("is-in"); });
  }

  /* ---------------- Experience website previews ---------------- */
  var experiencePreview = document.getElementById("experienceSitePreview");
  var sitePreviewImage = document.getElementById("sitePreviewImage");
  var sitePreviewName = document.getElementById("sitePreviewName");
  var sitePreviewDomain = document.getElementById("sitePreviewDomain");
  var experienceLinks = document.querySelectorAll(".experience-link[data-preview]");

  function showExperiencePreview(link){
    if (!experiencePreview || !sitePreviewImage) return;
    var previewSrc = link.getAttribute("data-preview");
    var siteName = link.getAttribute("data-site") || link.textContent;
    var domain = link.getAttribute("data-domain") || "";

    if (sitePreviewImage.getAttribute("src") !== previewSrc) {
      sitePreviewImage.src = previewSrc;
    }
    sitePreviewImage.alt = siteName + " website preview";
    sitePreviewName.textContent = siteName;
    sitePreviewDomain.textContent = domain;
    experiencePreview.setAttribute("aria-hidden", "false");
    experiencePreview.classList.add("is-visible");
  }

  function hideExperiencePreview(){
    if (!experiencePreview) return;
    experiencePreview.setAttribute("aria-hidden", "true");
    experiencePreview.classList.remove("is-visible");
  }

  experienceLinks.forEach(function(link){
    link.addEventListener("mouseenter", function(){ showExperiencePreview(link); });
    link.addEventListener("mouseleave", function(){
      if (document.activeElement !== link) hideExperiencePreview();
    });
    link.addEventListener("focus", function(){ showExperiencePreview(link); });
    link.addEventListener("blur", hideExperiencePreview);
  });

  /* ---------------- Independent media parallax ----------------
     Scroll only updates the media variable. Copy positioning stays entirely
     under CSS --copy-x / --copy-y controls and is never mutated here. */
  var heroPhoto = document.getElementById("heroPhoto");
  var hero = document.querySelector(".hero");

  /* ---------------- Cover media parallax ---------------- */
  var covers = Array.prototype.slice.call(document.querySelectorAll(".cover"));

  function updateParallax(){
    if (reduceMotion) return;
    if (heroPhoto && hero) {
      var hRect = hero.getBoundingClientRect();
      if (!(hRect.bottom < 0 || hRect.top > window.innerHeight)) {
        var hProgress = -hRect.top / (hRect.height || 1);
        heroPhoto.style.setProperty("--parallax-y", (hProgress * 34) + "px");
      }
    }
    covers.forEach(function(cover){
      var rect = cover.getBoundingClientRect();
      if (rect.bottom < -200 || rect.top > window.innerHeight + 200) return;
      var img = cover.querySelector("[data-parallax]");
      var progress = -rect.top / (rect.height || 1); // 0 at enter-top, 1 at fully scrolled past
      if (img) {
        var mediaLayer = cover.querySelector(".cover-bg");
        (mediaLayer || img).style.setProperty("--parallax-y", (progress * 30) + "px");
      }
    });
  }
  window.addEventListener("scroll", updateParallax, { passive:true });
  window.addEventListener("resize", updateParallax, { passive:true });
  updateParallax();

  /* ---------------- Lightbox with zoom and pan ---------------- */
  var lightbox = document.getElementById("lightbox");
  var lightboxImg = document.getElementById("lightboxImg");
  var imgScale = 1;
  var imgX = 0, imgY = 0;
  var isDragging = false;
  var startX = 0, startY = 0;
  var imgContainer = null;

  function openLightbox(src, alt){
    lightboxImg.src = src;
    lightboxImg.alt = alt || "";
    lightbox.classList.add("is-open");
    document.body.classList.add("lb-open");
    imgScale = 1;
    imgX = 0;
    imgY = 0;
    updateImageTransform();
  }

  function closeLightbox(){
    lightbox.classList.remove("is-open");
    document.body.classList.remove("lb-open");
    window.setTimeout(function(){
      if(!lightbox.classList.contains("is-open")) {
        lightboxImg.src="";
        imgScale = 1;
        imgX = 0;
        imgY = 0;
        updateImageTransform();
      }
    }, 400);
  }

  function updateImageTransform(){
    if (!imgContainer) {
      imgContainer = document.createElement('div');
      imgContainer.className = 'lightbox-img-container';
      lightboxImg.parentNode.insertBefore(imgContainer, lightboxImg);
      imgContainer.appendChild(lightboxImg);
    }

    if (imgScale > 1) {
      imgContainer.classList.add('zoomed');
    } else {
      imgContainer.classList.remove('zoomed');
      imgX = 0;
      imgY = 0;
    }

    lightboxImg.style.transform = 'scale(' + imgScale + ') translate(' + imgX + 'px, ' + imgY + 'px)';
  }

  // Wheel zoom
  if (lightbox) {
    lightbox.addEventListener("wheel", function(e){
      if (lightbox.classList.contains("is-open")) {
        e.preventDefault();
        e.stopPropagation();

        var delta = e.deltaY > 0 ? 0.9 : 1.1;
        imgScale = Math.max(0.5, Math.min(5, imgScale * delta));
        updateImageTransform();
      }
    }, { passive: false });

    // Click background to close
    lightbox.addEventListener("click", function(e){
      if (e.target === lightbox || e.target.classList.contains('lightbox-hint')) {
        closeLightbox();
      }
    });

    // Drag to pan when zoomed
    lightboxImg.addEventListener("mousedown", function(e){
      if (imgScale > 1) {
        e.preventDefault();
        isDragging = true;
        startX = e.clientX - imgX;
        startY = e.clientY - imgY;
        imgContainer.classList.add('dragging');
      }
    });

    window.addEventListener("mousemove", function(e){
      if (isDragging) {
        imgX = e.clientX - startX;
        imgY = e.clientY - startY;
        updateImageTransform();
      }
    });

    window.addEventListener("mouseup", function(){
      isDragging = false;
      if (imgContainer) {
        imgContainer.classList.remove('dragging');
      }
    });
  }

  document.querySelectorAll(".case-gallery figure img").forEach(function(img){
    img.addEventListener("click", function(){ openLightbox(img.getAttribute("src"), img.getAttribute("alt")); });
  });

  window.addEventListener("keydown", function(e){ if (e.key === "Escape") closeLightbox(); });

  /* ---------------- TOC scrollspy (sidebar + mobile nav) ---------------- */
  var tocLinks = document.querySelectorAll(".toc-list a, .nav-links a");
  var targets = [];
  tocLinks.forEach(function(a){
    var id = a.getAttribute("data-target");
    if (!id) return;
    var el = document.getElementById(id);
    if (el) targets.push({ id: id, el: el });
  });
  // de-dup targets
  var seen = {};
  targets = targets.filter(function(t){ if (seen[t.id]) return false; seen[t.id]=true; return true; });

  function pageTop(el){
    return el.getBoundingClientRect().top + window.scrollY;
  }
  function syncTOC(){
    var y = window.scrollY + window.innerHeight * 0.28;
    var current = targets[0];
    targets.forEach(function(t){
      if (pageTop(t.el) <= y) current = t;
    });
    tocLinks.forEach(function(a){
      var id = a.getAttribute("data-target");
      a.classList.toggle("is-active", current && id === current.id);
    });
  }
  window.addEventListener("scroll", syncTOC, { passive:true });
  window.addEventListener("resize", syncTOC, { passive:true });
  syncTOC();

})();
