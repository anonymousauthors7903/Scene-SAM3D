// Fine-grained instance inspection and a standard glTF assembly animation.
async function initFineGrained(data) {
  const panel = document.getElementById('fine-grained');
  const items = data.fineGrainedComparisons || [];
  if (!panel || !items.length) return;
  await customElements.whenDefined('model-viewer');

  const cases = panel.querySelector('.fine-grained-cases');
  const parts = panel.querySelector('.fine-grained-parts');
  const host = panel.querySelector('.fine-grained-assembly');
  const status = panel.querySelector('.fine-grained-status');
  const badge = panel.querySelector('.fine-grained-badge');
  const slider = panel.querySelector('input[type="range"]');
  const output = panel.querySelector('output');
  const playButton = panel.querySelector('[data-assembly="play"]');
  const controls = panel.querySelectorAll('[data-assembly], input[type="range"]');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let viewer = null;
  let selected = null;
  let ready = false;
  let playing = false;
  let visible = false;
  let frame = 0;

  function resetCamera() {
    // Keep the exploded row in frame on narrow phone screens as well.
    viewer.cameraOrbit = window.matchMedia('(max-width: 680px)').matches
      ? '18deg 72deg 7.5m' : selected.cameraOrbit;
    viewer.cameraTarget = selected.cameraTarget;
    viewer.jumpCameraToGoal();
  }

  function updateProgress() {
    const progress = ready && viewer.duration ? viewer.currentTime / viewer.duration : 0;
    slider.value = Math.round(progress * 1000);
    output.textContent = `${Math.round(progress * 100)}%`;
    slider.setAttribute('aria-valuetext', `${Math.round(progress * 100)}% assembled`);
    badge.textContent = progress >= .99 ? 'Optimized layout' : progress <= .01 ? 'Separated parts' : 'Assembling';
    if (playing) frame = requestAnimationFrame(updateProgress);
  }

  function pause() {
    if (viewer) viewer.pause();
    playing = false;
    cancelAnimationFrame(frame);
    playButton.textContent = ready && viewer.currentTime >= viewer.duration - .01 ? 'Replay assembly' : 'Play assembly';
  }

  function seek(fraction) {
    if (!ready) return;
    pause();
    viewer.currentTime = fraction * viewer.duration;
    updateProgress();
    playButton.textContent = fraction >= 1 ? 'Replay assembly' : 'Play assembly';
  }

  function play(restart = false) {
    if (!ready) return;
    if (restart || viewer.currentTime >= viewer.duration - .01) viewer.currentTime = 0;
    cancelAnimationFrame(frame);
    viewer.play({ repetitions: 1 });
    playing = true;
    playButton.textContent = 'Pause';
    updateProgress();
  }

  function makeViewer(alt) {
    const element = document.createElement('model-viewer');
    element.setAttribute('alt', alt);
    element.setAttribute('camera-controls', '');
    element.setAttribute('touch-action', 'pan-y');
    element.setAttribute('environment-image', 'neutral');
    element.setAttribute('tone-mapping', 'neutral');
    element.setAttribute('interaction-prompt', 'none');
    element.setAttribute('shadow-intensity', '.45');
    element.setAttribute('camera-orbit', '20deg 70deg auto');
    return element;
  }

  function select(item) {
    pause();
    selected = item;
    ready = false;
    controls.forEach((control) => { control.disabled = true; });
    status.hidden = false;
    status.textContent = 'Loading assembly…';
    status.classList.remove('error');
    cases.querySelectorAll('button').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.case === item.id));
    });
    parts.replaceChildren(...item.parts.map((part, index) => {
      const card = document.createElement('figure');
      card.className = 'fine-grained-part';
      const model = makeViewer(`${part.label}, independently generated mesh`);
      model.setAttribute('loading', 'lazy');
      model.setAttribute('src', part.model);
      const caption = document.createElement('figcaption');
      const number = document.createElement('span');
      number.textContent = String(index + 1).padStart(2, '0');
      caption.append(number, document.createTextNode(part.label));
      const message = document.createElement('span');
      message.className = 'fine-grained-part-status';
      message.textContent = 'Loading…';
      model.addEventListener('load', () => { message.hidden = true; });
      model.addEventListener('error', () => { message.textContent = 'Model unavailable'; });
      card.append(model, message, caption);
      return card;
    }));
    const next = makeViewer(`${item.label}: separated instances assembling into the optimized layout`);
    next.setAttribute('camera-orbit', item.cameraOrbit);
    next.setAttribute('camera-target', item.cameraTarget);
    next.setAttribute('field-of-view', '35deg');
    next.setAttribute('animation-name', 'Assembly');
    next.setAttribute('animation-crossfade-duration', '0');
    next.addEventListener('load', () => {
      if (viewer !== next) return;
      ready = true;
      controls.forEach((control) => { control.disabled = false; });
      status.hidden = true;
      next.pause();
      resetCamera();
      seek(reducedMotion.matches ? 1 : 0);
      if (visible && !reducedMotion.matches) play();
    });
    next.addEventListener('finished', () => {
      if (viewer !== next) return;
      pause();
      updateProgress();
    });
    next.addEventListener('error', () => {
      if (viewer !== next) return;
      pause();
      ready = false;
      controls.forEach((control) => { control.disabled = true; });
      status.hidden = false;
      status.classList.add('error');
      status.textContent = 'Assembly could not load. Select the example again to retry.';
    });
    viewer = next;
    host.replaceChildren(next);
    next.setAttribute('src', item.assembly);
    updateProgress();
  }

  items.forEach((item) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.case = item.id;
    button.textContent = item.label;
    button.setAttribute('aria-pressed', 'false');
    button.addEventListener('click', () => select(item));
    cases.append(button);
  });
  playButton.addEventListener('click', () => playing ? pause() : play());
  panel.querySelector('[data-assembly="replay"]').addEventListener('click', () => play(true));
  panel.querySelector('[data-assembly="separated"]').addEventListener('click', () => seek(0));
  panel.querySelector('[data-assembly="assembled"]').addEventListener('click', () => seek(1));
  panel.querySelector('[data-assembly="reset"]').addEventListener('click', () => {
    resetCamera();
  });
  window.matchMedia('(max-width: 680px)').addEventListener('change', () => {
    if (ready) resetCamera();
  });
  slider.addEventListener('input', () => seek(Number(slider.value) / 1000));
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
  reducedMotion.addEventListener('change', () => { if (reducedMotion.matches && ready) seek(1); });
  new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
    if (visible && !selected) select(items[0]);
    if (!visible) pause();
  }, { rootMargin: '100px', threshold: 0 }).observe(panel);
}
