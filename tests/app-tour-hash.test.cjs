const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');

// Execute the complete shipped script, without rewriting or exporting internals.
const filename = path.join(__dirname, '../src/scripts/app-tour.js');
const source = readFileSync(filename, 'utf8');
const allowed = ['agents', 'workspace', 'needs', 'tasks', 'projects', 'memory', 'library', 'prefs'];
const labels = ['Agents', 'Workspace', 'Needs you', 'Tasks', 'Projects', 'Memory', 'Library', 'Settings'];

function loadTour(hash) {
  const elements = new Map();
  const listeners = new Map();
  function element() {
    const classes = new Set();
    return {
      innerHTML: '', textContent: '', style: {}, clientWidth: 1120,
      attributes: {},
      classList: {
        contains: (name) => classes.has(name),
        toggle(name) {
          if (classes.delete(name)) return false;
          classes.add(name);
          return true;
        },
      },
      setAttribute(name, value) { this.attributes[name] = value; },
      addEventListener() {},
    };
  }
  for (const id of ['tour-nav', 'screen', 'frame', 'caption', 'points', 'screen-detail-toggle', 'screen-detail-hint']) {
    elements.set(id, element());
  }
  // Only parse the navigation buttons; layout is outside this regression's scope.
  const nav = elements.get('tour-nav');
  let buttons;
  nav.querySelectorAll = (selector) => {
    assert.equal(selector, 'button');
    buttons ??= [...nav.innerHTML.matchAll(/data-id="([^"]+)"/g)].map((match) => ({
      ...element(), dataset: { id: match[1] },
    }));
    return buttons;
  };
  const drawing = Object.fromEntries(
    ['clearRect', 'beginPath', 'moveTo', 'lineTo', 'stroke', 'arc', 'fill'].map((name) => [name, () => {}]),
  );
  const canvas = { width: 1100, height: 900, getContext: () => drawing };
  const location = { hash };
  vm.runInNewContext(source, {
    document: {
      getElementById(id) {
        if (id === 'brain') return elements.get('screen').innerHTML.includes('id="brain"') ? canvas : null;
        assert.ok(elements.has(id), `Unexpected DOM lookup: ${id}`);
        return elements.get(id);
      },
    },
    window: { addEventListener: (name, callback) => listeners.set(name, callback) },
    location,
    ResizeObserver: class { constructor(callback) { this.callback = callback; } observe() { this.callback(); } },
    matchMedia: () => ({ matches: true }),
    requestAnimationFrame() { throw new Error('Reduced-motion harness must not schedule animation'); },
    cancelAnimationFrame() {},
  }, { filename, timeout: 1000 });
  return {
    elements, nav,
    navigate(hash) {
      location.hash = hash;
      assert.equal(typeof listeners.get('hashchange'), 'function');
      listeners.get('hashchange')();
    },
  };
}

function assertScreen(tour, id) {
  const index = allowed.indexOf(id);
  assert.ok(tour.elements.get('caption').innerHTML.includes(`${index + 1} of 8 · ${labels[index]}`));
  assert.match(tour.elements.get('caption').innerHTML, /<h2>.+<\/h2>/);
  assert.equal((tour.elements.get('points').innerHTML.match(/<li>/g) || []).length, 3);
  assert.match(tour.elements.get('screen').innerHTML, /<div class="app">/);
  assert.deepEqual(tour.nav.querySelectorAll('button').map((b) => b.dataset.id), allowed);
  assert.deepEqual(
    tour.nav.querySelectorAll('button').filter((b) => b.attributes['aria-current'] === 'true').map((b) => b.dataset.id),
    [id],
  );
  assert.equal(tour.elements.get('screen').style.transform, 'scale(1)');
}

for (const id of [...allowed, 'unknown', 'constructor', 'toString', '__proto__']) {
  const expected = allowed.includes(id) ? id : 'agents';
  test(`initial #${id} renders ${expected}`, () => {
    assertScreen(loadTour(`#${id}`), expected);
  });
  test(`hashchange #${id} renders ${expected}`, () => {
    const tour = loadTour('#prefs');
    assertScreen(tour, 'prefs');
    tour.navigate(`#${id}`);
    assertScreen(tour, expected);
    if (expected === 'agents') {
      const baseline = loadTour('#agents');
      for (const name of ['caption', 'points', 'screen']) {
        assert.equal(tour.elements.get(name).innerHTML, baseline.elements.get(name).innerHTML);
      }
    }
  });
}
