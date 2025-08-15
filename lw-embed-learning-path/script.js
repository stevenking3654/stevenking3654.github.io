const CONCEPTS = [
  { id:"variables", title:"Variables & Types", desc:"Name, store, and transform data.", difficulty:"beginner", chips:["int","float","str","bool"] },
  { id:"io", title:"Input & Output", desc:"Read from the console and print results.", difficulty:"beginner", chips:["input()","print()"] },
  { id:"conditionals", title:"Conditionals", desc:"Make decisions using if / elif / else.", difficulty:"beginner", chips:["comparators","truthiness"] },
  { id:"loops", title:"Loops", desc:"Repeat actions with for and while.", difficulty:"beginner", chips:["range()","break/continue"] },
  { id:"functions", title:"Functions", desc:"Write reusable blocks with parameters and returns.", difficulty:"intermediate", chips:["scope","defaults"] },
  { id:"collections", title:"Data Structures", desc:"Work with lists, dicts, sets & tuples.", difficulty:"intermediate", chips:["list comp","dict ops"] },
  { id:"strings", title:"String Magic", desc:"Format and slice text like a pro.", difficulty:"intermediate", chips:["f-strings","slicing"] },
  { id:"modules", title:"Modules & Imports", desc:"Organize code and use libraries.", difficulty:"intermediate", chips:["stdlib","pip basics"] },
  { id:"oop", title:"Object-Oriented Basics", desc:"Model the world with classes.", difficulty:"advanced", chips:["__init__","methods"] },
  { id:"errors", title:"Errors & Debugging", desc:"Find bugs, handle exceptions.", difficulty:"intermediate", chips:["try/except","tracebacks"] },
  { id:"files", title:"Files & Persistence", desc:"Read, write, and save data to files.", difficulty:"advanced", chips:["with","csv/json"] },
  { id:"apis", title:"APIs (Intro)", desc:"Fetch real-world data the safe way.", difficulty:"advanced", chips:["requests","parsing"] }
];

(function(){
  const STORAGE_KEY = "concepts_completed_v1";
  const grid = document.getElementById("concepts-grid");
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

  function createIcon() {
    const wrap = document.createElement("div");
    wrap.className = "icon";
    wrap.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2l3.09 6.26L22 9.27l-5 4.9L18.18 22L12 18.56L5.82 22L7 14.17l-5-4.9l6.91-1.01L12 2z"/></svg>`;
    return wrap;
  }

  function renderCards(data){
    grid.innerHTML = "";
    data.forEach(item => {
      const card = document.createElement("button");
      card.className = "concept-card";
      card.type = "button";
      card.dataset.id = item.id;
      card.dataset.difficulty = item.difficulty;
      card.setAttribute("aria-pressed", saved.includes(item.id) ? "true" : "false");

      card.appendChild(createIcon());

      const text = document.createElement("div");
      text.className = "concept-content";

      const h3 = document.createElement("h3");
      h3.textContent = item.title;
      const p = document.createElement("p");
      p.textContent = item.desc;

      text.appendChild(h3);
      text.appendChild(p);

      const chips = document.createElement("div");
      chips.className = "chip-row";
      item.chips.forEach(c=>{
        const s = document.createElement("span");
        s.className = "chip";
        s.textContent = c;
        chips.appendChild(s);
      });

      text.appendChild(chips);
      card.appendChild(text);

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

  function updateUI(){
    document.querySelectorAll(".concept-card").forEach(card=>{
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
        document.querySelectorAll(".concept-card").forEach(c=>{
          const show = (f==="all") || (c.dataset.difficulty===f);
          c.style.display = show ? "" : "none";
        });
      });
    });
  }

  renderCards(CONCEPTS);
  wireFilters();
  updateUI();
})();
