(() => {
  'use strict';

  const cfg = window.HIR_CONFIG || {};
  const HUES = [215, 265, 340, 165, 25, 195];
  const CAT_ORDER = ['Ficil', 'Riwaayad', 'Majaajillo', 'Sahamin', 'Cabsi', 'Dokumentari'];

  /* ---------------- Demo data (xog tijaabo ah) ---------------- */
  const d = (id, title_so, cat, year, min, views, date, synopsis_so, featured = false) => ({
    id: 'demo-' + id, title_so, cat, release_year: year, duration_minutes: min, views,
    created_at: date, synopsis_so, featured, poster_url: null, bunny_video_id: null
  });
  const DEMO = [
    d(1, 'Ciidanka Dhulka', 'Ficil', 2024, 120, 980, '2025-09-20', 'Koox yar ayaa difaacaysa magaalo ka hortagaysa weerar weyn.', true),
    d(2, 'Gabadha Dhoobada', 'Riwaayad', 2024, 112, 760, '2025-09-12', 'Gabadh yar oo tuulo ka timid ayaa magaalada waaweyn ku dadaalaysa inay raadsato riyadeeda.'),
    d(3, 'Cirka Hoostiisa', 'Sahamin', 2023, 98, 540, '2025-08-30', 'Saddex saaxiibo ah ayaa safar dheer ku maraya lamadegaanka si ay khasnad hore u helaan.'),
    d(4, 'Qosol Dhaqameed', 'Majaajillo', 2025, 91, 870, '2025-09-25', 'Qoys isku mashquulay arooska ayaa la kulma dhacdooyin lama filaan ah.'),
    d(5, 'Habeenka Dheer', 'Cabsi', 2022, 104, 430, '2025-07-18', 'Guri hore oo xeebta ku yaal ayaa sir xanuun badan qarinaya.'),
    d(6, 'Barwaaqo', 'Dokumentari', 2023, 75, 310, '2025-06-02', 'Sheeko dhab ah oo ku saabsan beeraleyda doonaya inay dhulka cagaarsiiyaan.'),
    d(7, 'Dhaxal', 'Riwaayad', 2021, 108, 620, '2025-05-14', 'Wiil dhallinyaro ah ayaa helaya warqad aabihiis ka tagay, taasoo beddeleysa noloshiisa.'),
    d(8, 'Safarka Dambe', 'Sahamin', 2025, 99, 450, '2025-09-28', 'Shaqaale doon ah ayaa badda ku dhex lumay, waxayna isku dayaan inay badbaadaan.'),
    d(9, 'Maalin Cajiib ah', 'Majaajillo', 2024, 88, 690, '2025-04-09', 'Macallin dugsi ah ayaa maalin keliya la kulma dhibaatooyin isdaba joog ah.'),
    d(10, 'Dabka Dhexdiisa', 'Ficil', 2025, 115, 820, '2025-09-30', 'Dabdamiye geesi ah ayaa isku dayaya inuu badbaadiyo magaalo dhan.')
  ];

  /* ---------------- Helpers ---------------- */
  const $ = (id) => document.getElementById(id);

  function el(tag, attrs = {}, ...kids) {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === 'class') n.className = v;
      else if (k === 'text') n.textContent = v;
      else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v === true ? '' : v);
    }
    for (const k of kids.flat()) if (k != null) n.append(k);
    return n;
  }

  const hueOf = (m) => {
    let h = 0;
    for (const c of m.id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    return HUES[h % HUES.length];
  };

  const norm = (r) => ({
    id: String(r.id),
    title: r.title_so || '',
    synopsis: r.synopsis_so || '',
    poster: r.poster_url || '',
    year: r.release_year || null,
    duration: r.duration_minutes || null,
    cat: (r.categories && r.categories.name_so) || r.cat || '',
    video: r.bunny_video_id || '',
    featured: !!r.featured,
    views: r.views || 0,
    created: r.created_at || ''
  });

  /* ---------------- State ---------------- */
  const state = { movies: [], cat: '', q: '', sort: 'cusub', demo: false };

  /* ---------------- Data ---------------- */
  const hasConfig = () =>
    window.supabase && cfg.SUPABASE_URL && cfg.SUPABASE_PUBLISHABLE_KEY;

  async function loadMovies() {
    if (!hasConfig()) return { movies: DEMO.map(norm), demo: true, error: true };
    try {
      const sb = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_PUBLISHABLE_KEY);
      const { data, error } = await sb
        .from('movies')
        .select('*, categories(slug, name_so)')
        .eq('published', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (!data || !data.length) return { movies: DEMO.map(norm), demo: true, error: false };
      return { movies: data.map(norm), demo: false, error: false };
    } catch (e) {
      console.error('Supabase:', e);
      return { movies: DEMO.map(norm), demo: true, error: true };
    }
  }

  /* ---------------- UI pieces ---------------- */
  function poster(m) {
    const wrap = el('div', { class: 'poster', style: `--h:${hueOf(m)}` },
      el('span', { class: 'poster-title', text: m.title }));
    if (m.poster) {
      const img = el('img', { src: m.poster, alt: 'Boosteerka ' + m.title, loading: 'lazy' });
      img.addEventListener('load', () => wrap.classList.add('has-img'));
      img.addEventListener('error', () => img.remove());
      wrap.append(img);
    }
    return wrap;
  }

  function metaSpans(m) {
    return [
      m.year && el('span', { text: String(m.year) }),
      m.duration && el('span', { text: m.duration + ' daqiiqo' }),
      m.cat && el('span', { text: m.cat })
    ];
  }

  function card(m) {
    return el('button', { class: 'card', type: 'button', onclick: () => openDialog(m) },
      poster(m),
      el('span', { class: 'card-name', text: m.title }),
      el('span', { class: 'card-sub' },
        m.year && el('span', { text: String(m.year) }),
        m.cat && el('span', { text: m.cat })));
  }

  function fill(container, list) {
    container.replaceChildren(...list.map(card));
  }

  /* ---------------- Renderers ---------------- */
  function renderHero() {
    const hero = $('hero');
    const pool = state.movies.filter((m) => m.featured);
    const pick = (pool.length ? pool : state.movies).slice().sort((a, b) => b.views - a.views)[0];
    hero.replaceChildren();
    if (!pick) return;
    hero.style.setProperty('--h', hueOf(pick));
    if (pick.poster) {
      const img = el('img', { class: 'hero-img', src: pick.poster, alt: '' });
      img.addEventListener('error', () => img.remove());
      hero.append(img);
    }
    hero.append(el('div', { class: 'hero-body' },
      el('h1', { text: pick.title }),
      el('div', { class: 'meta' }, metaSpans(pick)),
      el('p', { class: 'syn', text: pick.synopsis }),
      el('div', { class: 'actions' },
        el('button', { class: 'btn btn-gold', type: 'button', onclick: () => openDialog(pick), text: 'Daawo Hadda' }),
        el('button', { class: 'btn btn-ghost', type: 'button', onclick: () => openDialog(pick), text: 'Faahfaahin' }))));
  }

  function renderRails() {
    const byNew = state.movies.slice().sort((a, b) => b.created.localeCompare(a.created));
    const byPop = state.movies.slice().sort((a, b) => b.views - a.views);
    fill($('railLatest'), byNew.slice(0, 10));
    fill($('railPopular'), byPop.slice(0, 10));
    fill($('railRecommended'), state.movies.filter((m) => !m.featured).slice(-8).reverse());
  }

  function categoryNames() {
    const names = [...new Set(state.movies.map((m) => m.cat).filter(Boolean))];
    const rank = (n) => { const i = CAT_ORDER.indexOf(n); return i < 0 ? 99 : i; };
    return names.sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
  }

  function pickCategory(name) {
    state.cat = name;
    renderChips();
    renderCatalogue();
  }

  function renderCategories() {
    $('catGrid').replaceChildren(...categoryNames().map((name) => {
      const n = state.movies.filter((m) => m.cat === name).length;
      return el('button', {
        class: 'cat', type: 'button',
        onclick: () => { pickCategory(name); $('katalog').scrollIntoView(); }
      }, el('b', { text: name }), el('span', { text: n + ' filim' }));
    }));
  }

  function renderChips() {
    const all = [''].concat(categoryNames());
    $('chips').replaceChildren(...all.map((name) =>
      el('button', {
        class: 'chip', type: 'button', 'aria-pressed': String(state.cat === name),
        onclick: () => pickCategory(name), text: name || 'Dhammaan'
      })));
  }

  function filtered() {
    const q = state.q.trim().toLowerCase();
    const list = state.movies.filter((m) =>
      (!state.cat || m.cat === state.cat) && (!q || m.title.toLowerCase().includes(q)));
    list.sort(state.sort === 'caan'
      ? (a, b) => b.views - a.views
      : (a, b) => b.created.localeCompare(a.created));
    return list;
  }

  function renderCatalogue() {
    const list = filtered();
    $('count').textContent = list.length + ' filim';
    if (!list.length) {
      $('grid').replaceChildren(el('div', { class: 'empty' },
        el('p', { text: 'Filim lama helin. Isku day erayo kale ama qayb kale.' }),
        el('button', {
          class: 'btn btn-ghost', type: 'button', text: 'Nadiifi raadinta',
          onclick: () => { state.q = ''; $('searchInput').value = ''; pickCategory(''); }
        })));
      return;
    }
    fill($('grid'), list);
  }

  function showNote(kind) {
    const note = $('note');
    note.replaceChildren();
    if (!kind) { note.hidden = true; return; }
    if (kind === 'error') {
      note.append(
        el('span', { text: 'Xogta lama soo qaadi karin. Hubi isku xirka internetka oo isku day mar kale. Hadda waxaa la muujinayaa xog tijaabo ah.' }),
        el('button', { class: 'btn btn-ghost', type: 'button', text: 'Isku day mar kale', onclick: init }));
    } else {
      note.append(el('span', { text: 'Xog tijaabo ah ayaa la muujinayaa, maxaa yeelay wali filim lama daabicin.' }));
    }
    note.hidden = false;
  }

  /* ---------------- Dialog ---------------- */
  function openDialog(m) {
    const dlg = $('dialog');
    dlg.replaceChildren(el('div', { class: 'd-wrap' },
      poster(m),
      el('div', {},
        el('h2', { id: 'dTitle', text: m.title }),
        el('div', { class: 'meta' }, metaSpans(m)),
        el('p', { class: 'syn', text: m.synopsis || 'Faahfaahin lama helin.' }),
        el('div', { class: 'actions' },
          el('button', { class: 'btn btn-gold', type: 'button', disabled: true, text: 'Daawo Hadda' }),
          el('button', { class: 'btn btn-ghost', type: 'button', text: 'Xidh', onclick: () => dlg.close() })),
        el('p', { class: 'd-hint', text: 'Boggan daawashada wali lama dhisin; waxaa lagu dari doonaa talaabada xigta.' }))));
    dlg.showModal();
  }

  $('dialog').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) e.currentTarget.close();
  });

  /* ---------------- Events ---------------- */
  $('searchInput').addEventListener('input', (e) => { state.q = e.target.value; renderCatalogue(); });
  $('searchForm').addEventListener('submit', (e) => { e.preventDefault(); $('katalog').scrollIntoView(); });
  $('sortSelect').addEventListener('change', (e) => { state.sort = e.target.value; renderCatalogue(); });
  $('year').textContent = new Date().getFullYear();

  /* ---------------- Init ---------------- */
  async function init() {
    $('count').textContent = 'Waa la soo rarayaa…';
    const res = await loadMovies();
    state.movies = res.movies;
    state.demo = res.demo;
    showNote(res.error ? 'error' : res.demo ? 'demo' : null);
    renderHero();
    renderRails();
    renderCategories();
    renderChips();
    renderCatalogue();
  }
  init();
})();
