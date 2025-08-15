/* script.js */
const TASTE_CONCEPTS = [
  { id:"variables", title:"Variables & Types", desc:"Name, store, and transform data.", xp:175, difficulty:"beginner", chips:["int","float","str","bool"] },
  { id:"io", title:"Input & Output", desc:"Read from the console and print results.", xp:160, difficulty:"beginner", chips:["input()","print()"] },
  { id:"conditionals", title:"Conditionals", desc:"Make decisions using if / elif / else.", xp:210, difficulty:"beginner", chips:["comparators","truthiness"] },
  { id:"loops", title:"Loops", desc:"Repeat actions with for and while.", xp:230, difficulty:"beginner", chips:["range()","break/continue"] },
  { id:"functions", title:"Functions", desc:"Write reusable blocks with parameters and returns.", xp:260, difficulty:"intermediate", chips:["scope","defaults"] },
  { id:"collections", title:"Data Structures", desc:"Work with lists, dicts, sets & tuples.", xp:280, difficulty:"intermediate", chips:["list comp","dict ops"] },
  { id:"strings", title:"String Magic", desc:"Format and slice text like a pro.", xp:190, difficulty:"intermediate", chips:["f-strings","slicing"] },
  { id:"modules", title:"Modules & Imports", desc:"Organize code and use libraries.", xp:240, difficulty:"intermediate", chips:["stdlib","pip basics"] },
  { id:"oop", title:"Object-Oriented Basics", desc:"Model the world with classes.", xp:340, difficulty:"advanced", chips:["__init__","methods"] },
  { id:"errors", title:"Errors & Debugging", desc:"Find bugs, handle exceptions.", xp:250, difficulty:"intermediate", chips:["try/except","tracebacks"] },
  { id:"files", title:"Files & Persistence", desc:"Read, write, and save data to files.", xp:270, difficulty:"advanced", chips:["with","csv/json"] },
  { id:"apis", title:"APIs (Intro)", desc:"Fetch real-world data the safe way.", xp:350, difficulty:"advanced", chips:["requests","parsing"] }
];

(function(){
  const STORAGE_KEY = "lw_taste_completed_v1";

  const grid = document.getElementById("taste-grid");
  const totalEl = document.getElementById("taste-total");
  const completeEl = document.getElementById("taste-complete");
  const xpEl = document.getElementById("taste-xp");
  const bar = document.getElementById("taste-progress-fill");
  const progressbar = bar.parentElement;

  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

  const createIcon = () => {
    const wrap = document.createElement("div");
    wrap.className = "icon";
    wrap.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2l3.09 6.26L22 9.27l-5 4.9L18.18 22L12 18.56L5.82 22L7 14.17l-5-4.9l6.91-1.01L12 2z"/></svg>`;
    return wrap;
  };

  const createTooltip = (t) => {
    const tip = document.createElement("div");
    tip.className = "tooltip";
    tip.textContent = t;
    tip.setAttribute("role","tooltip");
    return tip;
  };

  function renderCards(data){
    grid.innerHTML = "";
    data.forEach(item => {
      const card = document.createElement("button");
      card.className = "taste-card";
      card.type = "button";
      card.dataset.id = item.id;
      card.dataset.difficulty = item.difficulty;
      card.setAttribute("aria-pressed", saved.includes(item.id) ? "true" : "false");

      const state = document.createElement("span");
      state.className = "state-dot";
      card.appendChild(state);

      card.appendChild(createIcon());

      const text = document.createElement("div");
      text.className = "text";
      const h3 = document.createElement("h3");
      h3.textContent = item.title;
      const p = document.createElement("p");
      p.textContent = item.desc;
      text.appendChild(h3);
      text.appendChild(p);

      const chips = document.createElement("div");
      chips.className = "chip-row";
      (item.chips || []).forEach(c=>{
        const s = document.createElement("span");
        s.className = "chip";
        s.textContent = c;
        chips.appendChild(s);
      });
      text.appendChild(chips);
      text.appendChild(createTooltip(`Difficulty: ${capitalize(item.difficulty)} • Est. ${item.xp} XP preview`));
      card.appendChild(text);

      const xp = document.createElement("span");
      xp.className = "xp-badge";
      xp.textContent = `+${item.xp} XP`;
      card.appendChild(xp);

      card.addEventListener("click", () => toggleComplete(item));
      grid.appendChild(card);
    });
  }

  function toggleComplete(item){
    const idx = saved.indexOf(item.id);
    if(idx === -1){ saved.push(item.id); }
    else{ saved.splice(idx,1); }
    persistCompleted();
    updateUI();
  }

  function persistCompleted(){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  }

  function calculateXp(){
    const set = new Set(saved);
    return TASTE_CONCEPTS.filter(c=>set.has(c.id)).reduce((a,c)=>a + (c.xp||0), 0);
  }

  function updateUI(){
    const total = TASTE_CONCEPTS.length;
    const done = saved.length;
    const xp = calculateXp();

    totalEl.textContent = total;
    completeEl.textContent = done;
    xpEl.textContent = xp;

    const pct = total ? Math.round((done/total)*100) : 0;
    bar.style.width = pct + "%";
    progressbar.setAttribute("aria-valuenow", pct);

    document.querySelectorAll(".taste-card").forEach(card=>{
      const id = card.dataset.id;
      card.setAttribute("aria-pressed", saved.includes(id) ? "true" : "false");
    });
  }

  function wireFilters(){
    const btns = document.querySelectorAll(".filter-btn");
    btns.forEach(btn=>{
      btn.addEventListener("click", ()=>{
        btns.forEach(b=>{
          b.classList.remove("is-active");
          b.setAttribute("aria-pressed","false");
        });
        btn.classList.add("is-active");
        btn.setAttribute("aria-pressed","true");
        const f = btn.dataset.filter;
        const cards = Array.from(document.querySelectorAll(".taste-card"));
        cards.forEach(c=>{
          const show = (f==="all") || (c.dataset.difficulty===f);
          c.style.display = show ? "" : "none";
        });
      });
    });
  }

  function capitalize(s){ return s ? s[0].toUpperCase() + s.slice(1) : s; }

  renderCards(TASTE_CONCEPTS);
  wireFilters();
  updateUI();
})();
