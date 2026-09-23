// ==========================================================================
// Scene-SAM3D project page — shared interactions
// Sections implemented: hero, pipeline, instance/scene comparisons,
// plus lightbox / nav / bibtex utilities.
// ==========================================================================

let SITE_DATA = null;

document.addEventListener('DOMContentLoaded', () => {
  initTopNav();
  initScrollReveal();
  initLightbox();
  initBibtexCopy();
  fetch('assets/data/scenes.json?v=20260923hd1440')
    .then((res) => res.json())
    .then((data) => {
      SITE_DATA = data;
      initShowcase(data);
      initPipeline(data);
      initComparison(data);
    })
    .catch((err) => {
      console.error('Failed to load assets/data/scenes.json', err);
    });
});

// ---------------------------------------------------------------------
// Placeholder media helper
// Renders a labeled placeholder whenever an expected asset file is
// missing, so it's obvious what to drop in and where.
// ---------------------------------------------------------------------
function placeholderNode(kind, expectedPath) {
  const div = document.createElement('div');
  div.className = 'placeholder-media';
  div.innerHTML = `${kind} placeholder<br>drop file at:<code>${expectedPath}</code>`;
  return div;
}

function mountVideo(container, src, kindLabel) {
  container.innerHTML = '';
  const video = document.createElement('video');
  video.autoplay = true;
  video.loop = true;
  video.muted = true;
  video.playsInline = true;
  video.src = src;
  video.addEventListener('error', () => {
    container.innerHTML = '';
    container.appendChild(placeholderNode(kindLabel, src));
  });
  container.appendChild(video);
}

function mountImage(container, src, alt, kindLabel, clickable) {
  container.innerHTML = '';
  const img = document.createElement('img');
  img.alt = alt || '';
  img.src = src;
  if (clickable) {
    img.style.cursor = 'zoom-in';
    img.addEventListener('click', () => openLightbox(src, alt));
  }
  img.addEventListener('error', () => {
    container.innerHTML = '';
    container.appendChild(placeholderNode(kindLabel, src));
  });
  container.appendChild(img);
}

// ---------------------------------------------------------------------
// Top nav — reveal after hero, highlight active section
// ---------------------------------------------------------------------
function initTopNav() {
  const nav = document.getElementById('topNav');
  const hero = document.querySelector('.hero');
  if (!nav || !hero) return;

  const io = new IntersectionObserver(
    ([entry]) => nav.classList.toggle('visible', !entry.isIntersecting),
    { threshold: 0 }
  );
  io.observe(hero);

  const links = nav.querySelectorAll('.top-nav-links a');
  links.forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        window.scrollTo({ top: target.offsetTop - 70, behavior: 'smooth' });
      }
    });
  });

  const sections = Array.from(document.querySelectorAll('.hero[id], section.page-section'));
  const sectionIO = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = entry.target.id;
        links.forEach((l) => l.classList.toggle('active', l.dataset.section === id));
      });
    },
    { threshold: 0.4 }
  );
  sections.forEach((s) => sectionIO.observe(s));
}

// ---------------------------------------------------------------------
// Scroll reveal
// ---------------------------------------------------------------------
function initScrollReveal() {
  const items = document.querySelectorAll('.scroll-reveal');
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add('visible');
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );
  items.forEach((el) => io.observe(el));
}

// ---------------------------------------------------------------------
// Lightbox
// ---------------------------------------------------------------------
function openLightbox(src, alt, kind) {
  const lb = document.getElementById('lightbox');
  const img = document.getElementById('lightboxImg');
  const video = document.getElementById('lightboxVideo');
  const isVideo = kind === 'video';

  img.hidden = isVideo;
  video.hidden = !isVideo;
  if (isVideo) {
    video.src = src;
    video.play().catch(() => {});
  } else {
    img.src = src;
    img.alt = alt || '';
  }
  lb.classList.add('active');
}

function closeLightbox() {
  const lb = document.getElementById('lightbox');
  const video = document.getElementById('lightboxVideo');
  video.pause();
  video.removeAttribute('src');
  lb.classList.remove('active');
}

function initLightbox() {
  const lb = document.getElementById('lightbox');
  document.getElementById('lightboxClose').addEventListener('click', closeLightbox);
  lb.addEventListener('click', (e) => {
    if (e.target === lb) closeLightbox();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLightbox();
  });
}

// ---------------------------------------------------------------------
// BibTeX copy
// ---------------------------------------------------------------------
function initBibtexCopy() {
  const btn = document.getElementById('bibtexCopyBtn');
  const code = document.getElementById('bibtexCode');
  if (!btn || !code) return;
  btn.addEventListener('click', () => {
    navigator.clipboard.writeText(code.textContent.trim()).then(() => {
      btn.textContent = 'Copied!';
      btn.classList.add('copied');
      setTimeout(() => {
        btn.textContent = 'Copy';
        btn.classList.remove('copied');
      }, 2000);
    });
  });
}

// ---------------------------------------------------------------------
// Section 1: Showcase — one clip covering all four pipeline stages
// ---------------------------------------------------------------------
function initShowcase(data) {
  const showcase = data.showcase;
  const showcaseContainer = document.getElementById('showcaseVideoWrapper');
  if (showcase && showcaseContainer) {
    mountVideo(showcaseContainer, showcase.video, showcase.label || 'Full pipeline video');
  }
  const teaserContainer = document.getElementById('teaserWrapper');
  if (data.teaser && teaserContainer && !teaserContainer.querySelector('video')) {
    mountVideo(document.getElementById('teaserWrapper'), data.teaser.video, 'Teaser');
  }
}

// ---------------------------------------------------------------------
// Input sequences + annotated instances
// ---------------------------------------------------------------------
function initInputs() {
  fetch('assets/data/inputs.json')
    .then((res) => res.json())
    .then((data) => {
      renderSequences(data);
      renderInstances(data);
    })
    .catch((err) => console.warn('assets/data/inputs.json unavailable', err));
}

function renderSequences(data) {
  const grid = document.getElementById('seqGrid');
  const toggle = document.getElementById('seqToggle');
  const sequences = data.sequences || [];
  if (!grid || !sequences.length) return;

  sequences.forEach((seq) => {
    const card = document.createElement('article');
    card.className = 'seq-card';

    const media = document.createElement('div');
    media.className = 'seq-media';

    const poster = document.createElement('img');
    poster.className = 'seq-poster';
    poster.src = seq.poster;
    poster.alt = `${seq.label} first frame`;
    media.appendChild(poster);

    const rgb = document.createElement('video');
    rgb.className = 'seq-rgb';
    Object.assign(rgb, { muted: true, loop: true, playsInline: true, preload: 'none' });
    rgb.dataset.src = seq.video;
    media.appendChild(rgb);

    let mask = null;
    if (seq.maskVideo) {
      mask = document.createElement('video');
      mask.className = 'seq-mask';
      Object.assign(mask, { muted: true, loop: true, playsInline: true, preload: 'none' });
      mask.dataset.src = seq.maskVideo;
      media.appendChild(mask);
    }

    if (seq.trajectory) {
      const traj = document.createElement('img');
      traj.className = 'seq-traj';
      traj.src = seq.trajectory;
      traj.alt = `${seq.label} camera trajectory`;
      traj.addEventListener('click', (e) => {
        e.stopPropagation();
        openLightbox(seq.trajectory, traj.alt);
      });
      media.appendChild(traj);
    }

    const meta = document.createElement('div');
    meta.className = 'seq-meta';
    meta.innerHTML =
      `<span class="seq-name">${seq.label}</span>` +
      `<span class="seq-stats">${seq.frames.toLocaleString()} frames</span>`;

    card.append(media, meta);
    card.addEventListener('click', () => openLightbox(seq.video, seq.label, 'video'));
    grid.appendChild(card);

    // Decode only while on screen — two loops per card is otherwise wasteful.
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        [rgb, mask].forEach((v) => {
          if (v && !v.src) v.src = v.dataset.src;
        });
        rgb.play().then(() => card.classList.add('playing')).catch(() => {});
        if (mask && card.classList.contains('show-mask')) mask.play().catch(() => {});
      } else {
        rgb.pause();
        if (mask) mask.pause();
      }
    }, { threshold: 0.25 });
    io.observe(card);
  });

  if (!toggle) return;
  toggle.addEventListener('click', (e) => {
    const btn = e.target.closest('.seg-btn');
    if (!btn) return;
    toggle.querySelectorAll('.seg-btn').forEach((b) => b.classList.toggle('active', b === btn));

    const showMask = btn.dataset.mode === 'mask';
    grid.querySelectorAll('.seq-card').forEach((card) => {
      card.classList.toggle('show-mask', showMask);
      const rgb = card.querySelector('.seq-rgb');
      const mask = card.querySelector('.seq-mask');
      if (!mask) return;
      if (showMask) {
        // Match the visible frame before crossfading so the overlay lines up.
        if (!mask.src) mask.src = mask.dataset.src;
        mask.currentTime = rgb.currentTime;
        mask.play().catch(() => {});
      } else {
        mask.pause();
      }
    });
  });
}

function renderInstances(data) {
  const strip = document.getElementById('instanceStrip');
  const instances = data.instances || [];
  if (!strip || !instances.length) return;

  const heading = document.getElementById('instanceHeading');
  if (heading) heading.textContent = `${instances.length} Annotated Instances`;

  instances.forEach((inst) => {
    const frames = [inst.thumb, ...(inst.views || [])];
    const card = document.createElement('article');
    card.className = 'instance-card';

    const figure = document.createElement('div');
    figure.className = 'instance-figure';
    const imgs = frames.map((src, i) => {
      const img = document.createElement('img');
      img.src = src;
      img.alt = inst.label;
      img.loading = 'lazy';
      if (i === 0) img.classList.add('active');
      figure.appendChild(img);
      return img;
    });

    const dots = document.createElement('div');
    dots.innerHTML = (inst.views || [])
      .map(() => '<span class="instance-viewdot"></span>').join('');

    const label = document.createElement('div');
    label.className = 'instance-label';
    label.textContent = inst.name || inst.label;

    const sub = document.createElement('div');
    sub.className = 'instance-sub';
    sub.textContent = `${inst.masks} masks`;

    card.append(figure, label, sub);

    const split = inst.perSequence && Object.values(inst.perSequence);
    if (split && split.length === 2) {
      const bar = document.createElement('div');
      bar.className = 'instance-split';
      bar.title = Object.entries(inst.perSequence)
        .map(([k, v]) => `${k}: ${v}`).join(' · ');
      bar.innerHTML =
        `<span style="flex:${split[0]}"></span><span style="flex:${split[1]}"></span>`;
      card.appendChild(bar);
    }

    card.appendChild(dots);
    strip.appendChild(card);

    // Hovering steps through the kept views, which is what the selection stage produces.
    let timer = null;
    let index = 0;
    const show = (i) => {
      imgs[index].classList.remove('active');
      index = i;
      imgs[index].classList.add('active');
      dots.querySelectorAll('.instance-viewdot')
        .forEach((d, di) => d.classList.toggle('on', di === index - 1));
    };

    card.addEventListener('mouseenter', () => {
      if (imgs.length < 2) return;
      show(1);
      timer = setInterval(() => show(index >= imgs.length - 1 ? 1 : index + 1), 900);
    });
    card.addEventListener('mouseleave', () => {
      clearInterval(timer);
      show(0);
    });
    card.addEventListener('click', () => openLightbox(frames[index], inst.label));
  });
}

// ---------------------------------------------------------------------
// Section 2: Pipeline slideshow
// ---------------------------------------------------------------------
function initPipeline(data) {
  const steps = (data.pipeline && data.pipeline.steps) || [];
  const detail = data.pipeline && data.pipeline.detail;
  const container = document.getElementById('methodSlideshow');
  const detailContainer = document.getElementById('methodDetail');
  const prevBtn = document.getElementById('slidePrev');
  const nextBtn = document.getElementById('slideNext');
  const playBtn = document.getElementById('slidePlayPause');
  const slideNum = document.getElementById('slideNum');
  if (!steps.length) return;

  let current = 0;
  let playing = true;
  let timer = null;

  const imgs = steps.map((step, i) => {
    const img = document.createElement('img');
    img.className = 'method-slide' + (i === 0 ? ' active' : '');
    img.src = step.src;
    img.alt = step.alt || `Pipeline step ${i + 1}`;
    img.addEventListener('click', () => openLightbox(step.src, img.alt));
    img.addEventListener('error', () => {
      img.replaceWith(placeholderNode('Pipeline figure', step.src));
    });
    container.appendChild(img);
    return img;
  });

  function goTo(index) {
    imgs[current].classList.remove('active');
    current = (index + steps.length) % steps.length;
    imgs[current].classList.add('active');
    slideNum.textContent = `${current + 1} / ${steps.length}`;
  }

  function resetTimer() {
    if (timer) clearInterval(timer);
    if (playing && steps.length > 1) {
      timer = setInterval(() => goTo(current + 1), 8000);
    }
  }

  prevBtn.addEventListener('click', () => { goTo(current - 1); resetTimer(); });
  nextBtn.addEventListener('click', () => { goTo(current + 1); resetTimer(); });
  playBtn.addEventListener('click', () => {
    playing = !playing;
    playBtn.textContent = playing ? '⏸' : '▶';
    resetTimer();
  });

  if (steps.length <= 1) {
    document.querySelector('.slideshow-controls').style.display = 'none';
  }

  slideNum.textContent = `1 / ${steps.length}`;
  resetTimer();

  if (detail && detailContainer) {
    mountImage(detailContainer, detail.src, detail.alt, 'Pipeline detail', true);
  }
}

// ---------------------------------------------------------------------
// Instance- and scene-level interactive 3D comparisons
// ---------------------------------------------------------------------
function initComparison(data) {
  const methods = data.comparisonMethods || [];
  if (!methods.length) return;
  const allInstances = data.instanceComparisonItems || [];
  const instanceItems = data.instanceComparisonOrder
    ? data.instanceComparisonOrder.map((id, index) => {
        const item = allInstances.find((candidate) => candidate.id === id);
        return item ? { ...item, label: `instance${index}` } : null;
      }).filter(Boolean)
    : allInstances;

  document.querySelectorAll('.comparison-panel').forEach((panel) => {
    const key = panel.dataset.comparisonKey;
    const items = key === 'scene'
      ? (data.sceneComparisonItems || [])
      : instanceItems;
    if (!items.length) return;

    const availableMethods = methods.filter((method) =>
      items.some((item) => item.models && item.models[method.id])
    );
    if (availableMethods.length < 2) return;

    initComparisonPanel(panel, availableMethods, items);
  });
}

// Rotate the model turntable, not the interactive camera, so automatic motion
// does not fight drag/zoom or generate camera-sync feedback events.
function initComparisonRotation(viewers, syncCameraInput) {
  const radiansPerSecond = 8 * Math.PI / 180; // One steady revolution every 45 seconds.
  const hovered = new Set();
  const pointers = new Map();
  let previousTime = null;

  viewers.forEach((viewer) => {
    viewer.addEventListener('pointerenter', (event) => {
      if (event.pointerType !== 'touch') {
        hovered.add(viewer);
        viewer.classList.add('pointer-hover');
      }
    });
    viewer.addEventListener('pointerleave', () => {
      hovered.delete(viewer);
      viewer.classList.remove('pointer-hover');
    });
    viewer.addEventListener('pointerdown', (event) => {
      pointers.set(event.pointerId, viewer);
    });
  });
  const release = (event) => pointers.delete(event.pointerId);
  document.addEventListener('pointerup', release);
  document.addEventListener('pointercancel', release);
  window.addEventListener('blur', () => pointers.clear());
  document.addEventListener('visibilitychange', () => { previousTime = null; });

  const interacting = (viewer) => hovered.has(viewer)
    || [...pointers.values()].includes(viewer) || viewer.matches(':focus-visible');
  function tick(time) {
    const dt = previousTime === null ? 0 : Math.min((time - previousTime) / 1000, 0.1);
    previousTime = time;
    if (!document.hidden) {
      const visible = viewers.filter((viewer) => viewer.loaded && viewer.modelIsVisible);
      if (syncCameraInput.checked) {
        if (visible.length && !viewers.some(interacting)) {
          const angle = visible[0].turntableRotation + dt * radiansPerSecond;
          viewers.filter((viewer) => viewer.loaded)
            .forEach((viewer) => viewer.resetTurntableRotation(angle));
        }
      } else {
        visible.filter((viewer) => !interacting(viewer)).forEach((viewer) => {
          viewer.resetTurntableRotation(viewer.turntableRotation + dt * radiansPerSecond);
        });
      }
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function initComparisonPanel(panel, methods, items) {
  const itemSelect = panel.querySelector('[data-role="item"]');
  const leftSelect = panel.querySelector('[data-role="left-method"]');
  const rightSelect = panel.querySelector('[data-role="right-method"]');
  const modelLeft = panel.querySelector('[data-role="left-model"]');
  const modelRight = panel.querySelector('[data-role="right-model"]');
  const statusLeft = panel.querySelector('[data-role="left-status"]');
  const statusRight = panel.querySelector('[data-role="right-status"]');
  const tagLeft = panel.querySelector('[data-role="left-tag"]');
  const tagRight = panel.querySelector('[data-role="right-tag"]');
  const inputViews = panel.querySelector('[data-role="input-views"]');
  const sceneReferences = panel.querySelector('[data-role="scene-references"]');
  const missingMethods = panel.querySelector('[data-role="missing-methods"]');
  const syncCameraInput = panel.querySelector('[data-role="sync-camera"]');
  const resetCameraButton = panel.querySelector('[data-role="reset-camera"]');
  const baseRadius = new WeakMap();
  let cameraSyncLock = false;

  items.forEach((item) => {
    const opt = document.createElement('option');
    opt.value = item.id;
    opt.textContent = item.label;
    itemSelect.appendChild(opt);
  });

  function fillMethodSelect(select, defaultId) {
    select.innerHTML = '';
    methods.forEach((m) => {
      const opt = document.createElement('option');
      opt.value = m.id;
      opt.textContent = m.label;
      if (m.id === defaultId) opt.selected = true;
      select.appendChild(opt);
    });
  }

  const methodIds = methods.map((method) => method.id);
  const leftDefault = methodIds.includes('gt')
    ? 'gt'
    : (methodIds.includes('input') ? 'input' : methodIds[0]);
  const rightDefault = methodIds.includes('ours') && leftDefault !== 'ours'
    ? 'ours'
    : methodIds.find((id) => id !== leftDefault);

  fillMethodSelect(leftSelect, leftDefault);
  fillMethodSelect(rightSelect, rightDefault);

  function currentItem() {
    return items.find((i) => i.id === itemSelect.value) || items[0];
  }

  function methodLabel(id) {
    const itemLabel = currentItem().methodLabels?.[id];
    if (itemLabel) return itemLabel;
    const m = methods.find((mm) => mm.id === id);
    return m ? m.label : id;
  }

  function syncDisabledOptions() {
    const models = currentItem().models;
    [leftSelect, rightSelect].forEach((select) => {
      const other = select === leftSelect ? rightSelect : leftSelect;
      Array.from(select.options).forEach((option) => {
        option.disabled = option.value === other.value;
        option.textContent = methodLabel(option.value)
          + (models[option.value] ? '' : ' — Unavailable');
      });
    });
  }

  function render() {
    const item = currentItem();
    if (missingMethods) {
      const missing = methods.filter((method) => !item.models[method.id]);
      missingMethods.hidden = missing.length === 0;
      missingMethods.textContent = missing.length
        ? `Not available for this instance: ${missing.map((method) => method.label).join(', ')}.`
        : '';
    }
    renderInputViews(item);
    renderSceneReferences(item);
    rebuildModel('left');
    rebuildModel('right');

    tagLeft.textContent = methodLabel(leftSelect.value);
    tagRight.textContent = methodLabel(rightSelect.value);
    syncDisabledOptions();
  }

  function renderInputViews(item) {
    if (!inputViews) return;
    const grid = inputViews.querySelector('[data-role="input-grid"]');
    const views = item.inputViews || [];
    grid.replaceChildren();
    inputViews.hidden = views.length === 0;

    views.forEach((view) => {
      const card = document.createElement('figure');
      card.className = `instance-view-card${view.role === 'Anchor' ? ' anchor' : ''}`;

      const image = document.createElement('img');
      image.src = view.src;
      image.alt = `${item.label} — ${view.role} (${view.frame})`;
      image.loading = 'lazy';
      image.addEventListener('click', () => openLightbox(view.src, image.alt));

      const caption = document.createElement('figcaption');
      const role = document.createElement('strong');
      role.textContent = view.role;
      const frame = document.createElement('span');
      frame.textContent = view.frame;
      caption.append(role, frame);
      card.append(image, caption);
      grid.appendChild(card);
    });
  }

  function renderSceneReferences(item) {
    if (!sceneReferences) return;
    const grid = sceneReferences.querySelector('[data-role="scene-reference-grid"]');
    const views = item.referenceViews || [];
    grid.replaceChildren();
    sceneReferences.hidden = views.length === 0;

    views.forEach((view) => {
      const card = document.createElement('figure');
      card.className = 'scene-reference-card';

      const image = document.createElement('img');
      image.src = view.src;
      image.alt = `${item.label} — ${view.label} (${view.frame})`;
      image.loading = 'lazy';
      image.addEventListener('click', () => openLightbox(view.src, image.alt));

      const caption = document.createElement('figcaption');
      const label = document.createElement('strong');
      label.textContent = view.label;
      const frame = document.createElement('span');
      frame.textContent = view.frame;
      caption.append(label, frame);
      card.append(image, caption);
      grid.appendChild(card);
    });
  }

  function rebuildModel(side) {
    const item = currentItem();
    const id = side === 'left' ? leftSelect.value : rightSelect.value;
    const src = item.models[id];
    const poster = item.images && item.images[id];
    const viewer = side === 'left' ? modelLeft : modelRight;
    const status = side === 'left' ? statusLeft : statusRight;
    const label = `${item.label} — ${methodLabel(id)}`;
    const alreadyLoaded = viewer.loaded && viewer.getAttribute('src') === src;

    baseRadius.delete(viewer);
    viewer.hidden = !src;
    status.hidden = false;
    status.classList.remove('error');
    if (!src) {
      viewer.removeAttribute('src');
      viewer.removeAttribute('poster');
      viewer.classList.remove('pointer-hover');
      status.textContent = 'Not available for this instance.';
      viewer.alt = label;
      return;
    }
    status.textContent = 'Loading 3D model…';
    viewer.alt = label;
    if (poster) viewer.setAttribute('poster', poster);
    else viewer.removeAttribute('poster');
    viewer.setAttribute('camera-orbit', '35deg 70deg auto');
    if (typeof viewer.resetTurntableRotation === 'function') viewer.resetTurntableRotation();
    viewer.setAttribute('src', src);
    // An unchanged src does not emit another load event when the other pane changes.
    if (alreadyLoaded) handleModelLoad(viewer, status);
  }

  function handleModelLoad(viewer, status) {
    if (!viewer.getAttribute('src')) return;
    status.hidden = true;
    requestAnimationFrame(() => {
      if (typeof viewer.getCameraOrbit === 'function') {
        baseRadius.set(viewer, viewer.getCameraOrbit().radius);
      }
    });
  }

  function handleModelError(viewer, status) {
    if (!viewer.getAttribute('src')) return;
    status.hidden = false;
    status.classList.add('error');
    status.textContent = '3D model could not be loaded.';
  }

  function syncCamera(source, target) {
    if (!syncCameraInput.checked || cameraSyncLock) return;
    if (source.hidden || target.hidden || !source.loaded || !target.loaded
      || typeof source.getCameraOrbit !== 'function') return;

    const orbit = source.getCameraOrbit();
    const sourceBase = baseRadius.get(source) || orbit.radius;
    const targetBase = baseRadius.get(target) || target.getCameraOrbit().radius;
    const targetRadius = targetBase * (orbit.radius / sourceBase);

    cameraSyncLock = true;
    target.resetTurntableRotation(source.turntableRotation);
    target.cameraOrbit = `${orbit.theta}rad ${orbit.phi}rad ${targetRadius}m`;
    if (typeof target.jumpCameraToGoal === 'function') target.jumpCameraToGoal();
    requestAnimationFrame(() => { cameraSyncLock = false; });
  }

  function resetCameras() {
    [modelLeft, modelRight].forEach((viewer) => {
      baseRadius.delete(viewer);
      viewer.cameraTarget = 'auto auto auto';
      viewer.cameraOrbit = '35deg 70deg auto';
      viewer.fieldOfView = 'auto';
      if (typeof viewer.resetTurntableRotation === 'function') viewer.resetTurntableRotation();
      if (typeof viewer.jumpCameraToGoal === 'function') viewer.jumpCameraToGoal();
    });
  }

  itemSelect.addEventListener('change', render);
  leftSelect.addEventListener('change', render);
  rightSelect.addEventListener('change', render);
  modelLeft.addEventListener('load', () => handleModelLoad(modelLeft, statusLeft));
  modelRight.addEventListener('load', () => handleModelLoad(modelRight, statusRight));
  modelLeft.addEventListener('error', () => handleModelError(modelLeft, statusLeft));
  modelRight.addEventListener('error', () => handleModelError(modelRight, statusRight));
  modelLeft.addEventListener('camera-change', () => syncCamera(modelLeft, modelRight));
  modelRight.addEventListener('camera-change', () => syncCamera(modelRight, modelLeft));
  resetCameraButton.addEventListener('click', resetCameras);

  initComparisonRotation([modelLeft, modelRight], syncCameraInput);
  render();
}
