/* ============================================================
   DOTA GUIDE — логика
   Зависит от js/data.js (DotaGuide.TERMS / DotaGuide.QUESTIONS)
   ============================================================ */
(function(){
  "use strict";

  var TERMS = window.DotaGuide && DotaGuide.TERMS || [];
  var QUESTIONS = window.DotaGuide && DotaGuide.QUESTIONS || [];

  var THEME_KEY = "dota2guide-theme";
  var BEST_KEY = "dota2guide-best";

  /* ---------- Утилиты ---------- */
  function shuffle(arr){
    var a = arr.slice();
    for(var i = a.length - 1; i > 0; i--){
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }

  /* ---------- Тема оформления ---------- */
  function applyTheme(t){
    document.documentElement.dataset.theme = t;
  }
  function setMetaThemeColor(c){
    var m = document.querySelector('meta[name="theme-color"]');
    if(m && m.setAttribute) m.setAttribute("content", c);
  }
  var themeToggle = document.getElementById("themeToggle");
  if(themeToggle){
    themeToggle.addEventListener("click", function(){
      var cur = document.documentElement.dataset.theme;
      var next = cur === "light" ? "dark" : "light";
      applyTheme(next);
      try{ localStorage.setItem(THEME_KEY, next); }catch(e){}
      setMetaThemeColor(next === "light" ? "#f4f6fb" : "#0a0c11");
    });
  }
  setMetaThemeColor(document.documentElement.dataset.theme === "light" ? "#f4f6fb" : "#0a0c11");

  /* ---------- Мобильное меню ---------- */
  var burger = document.getElementById("burger");
  var nav = document.getElementById("nav");
  if(burger && nav){
    burger.addEventListener("click", function(){
      var open = nav.classList.toggle("open");
      burger.setAttribute("aria-expanded", open);
      burger.textContent = open ? "✕" : "☰";
    });
    nav.querySelectorAll("a").forEach(function(a){
      a.addEventListener("click", function(){
        nav.classList.remove("open");
        burger.setAttribute("aria-expanded", "false");
        burger.textContent = "☰";
      });
    });
  }

  /* ---------- Плавный скролл (с учётом шапки) ---------- */
  function smoothTo(id){
    var el = document.querySelector(id);
    if(!el) return;
    var y = el.getBoundingClientRect().top + window.pageYOffset - 64;
    if(id === "#top") y = 0;
    window.scrollTo({top:y, behavior:"smooth"});
  }
  document.querySelectorAll('a[href^="#"]').forEach(function(a){
    a.addEventListener("click", function(e){
      var id = a.getAttribute("href");
      if(id && id.length > 1){
        e.preventDefault();
        smoothTo(id);
      }
    });
  });

  /* ---------- Появление при скролле ---------- */
  var reveals = document.querySelectorAll(".reveal");
  if("IntersectionObserver" in window){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if(en.isIntersecting){
          en.target.classList.add("visible");
          io.unobserve(en.target);
        }
      });
    }, {threshold:0.12});
    reveals.forEach(function(el, i){
      el.style.transitionDelay = (i % 4) * 80 + "ms";
      io.observe(el);
    });
  } else {
    reveals.forEach(function(el){ el.classList.add("visible"); });
  }

  /* ---------- Подсветка пункта меню + aria-current ---------- */
  var links = {};
  nav.querySelectorAll("a").forEach(function(a){
    var id = a.getAttribute("href").slice(1);
    links[id] = a;
  });
  function setActive(id){
    Object.keys(links).forEach(function(k){
      var l = links[k];
      l.classList.remove("active");
      l.removeAttribute("aria-current");
    });
    var l = links[id];
    if(l){
      l.classList.add("active");
      l.setAttribute("aria-current", "true");
    }
  }
  if("IntersectionObserver" in window){
    var spy = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if(en.isIntersecting) setActive(en.target.id);
      });
    }, {rootMargin:"-45% 0px -50% 0px"});
    Object.keys(links).forEach(function(k){
      var s = document.getElementById(k);
      if(s) spy.observe(s);
    });
  }

  /* ---------- Аккордеон ---------- */
  document.querySelectorAll(".acc-item").forEach(function(item){
    var btn = item.querySelector(".acc-btn");
    btn.addEventListener("click", function(){
      var isOpen = item.classList.toggle("open");
      btn.setAttribute("aria-expanded", isOpen);
    });
  });

  /* ---------- Термины: рендер, поиск, модальное окно ---------- */
  var tagsBox = document.getElementById("tags");
  var searchInput = document.getElementById("termSearch");
  var termCount = document.getElementById("termCount");
  var noResults = document.getElementById("noResults");

  var overlay = document.getElementById("overlay");
  var mTitle = document.getElementById("mTitle");
  var mFull = document.getElementById("mFull");
  var mDef = document.getElementById("mDef");
  var mTip = document.getElementById("mTip");
  var mClose = document.getElementById("mClose");
  var lastFocus = null;

  function makeTag(term){
    var b = document.createElement("button");
    b.type = "button";
    b.className = "tag";
    b.textContent = term.n;
    b.addEventListener("click", function(){ openModal(term, b); });
    return b;
  }

  function renderTags(list){
    tagsBox.innerHTML = "";
    list.forEach(function(t){ tagsBox.appendChild(makeTag(t)); });
    if(noResults) noResults.classList.toggle("show", list.length === 0);
    if(termCount){
      termCount.textContent = list.length === TERMS.length
        ? "Всего терминов: " + TERMS.length
        : "Найдено: " + list.length + " из " + TERMS.length;
    }
  }

  if(searchInput){
    searchInput.addEventListener("input", function(){
      var q = searchInput.value.trim().toLowerCase();
      if(!q){ renderTags(TERMS); return; }
      renderTags(TERMS.filter(function(t){
        return (t.n + " " + t.f + " " + t.d).toLowerCase().indexOf(q) !== -1;
      }));
    });
  }

  function openModal(term, trigger){
    mTitle.textContent = term.n;
    mFull.textContent = term.f;
    mDef.textContent = term.d;
    mTip.textContent = "Совет: " + term.t;
    lastFocus = trigger || null;
    overlay.classList.add("show");
    overlay.setAttribute("aria-hidden", "false");
    document.body.classList.add("no-scroll");
    mClose.focus();
  }
  function closeModal(){
    overlay.classList.remove("show");
    overlay.setAttribute("aria-hidden", "true");
    document.body.classList.remove("no-scroll");
    if(lastFocus && lastFocus.focus) lastFocus.focus();
  }
  mClose.addEventListener("click", closeModal);
  overlay.addEventListener("click", function(e){
    if(e.target === overlay) closeModal();
  });
  document.addEventListener("keydown", function(e){
    if(e.key === "Escape" && overlay.classList.contains("show")) closeModal();
  });

  /* Focus trap: Tab не выходит за пределы диалога */
  overlay.addEventListener("keydown", function(e){
    if(e.key !== "Tab") return;
    var focusables = overlay.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if(!focusables.length) return;
    var first = focusables[0];
    var last = focusables[focusables.length - 1];
    if(e.shiftKey && document.activeElement === first){
      e.preventDefault();
      last.focus();
    } else if(!e.shiftKey && document.activeElement === last){
      e.preventDefault();
      first.focus();
    }
  });

  renderTags(TERMS);

  /* ---------- Викторина ---------- */
  var box = document.getElementById("quizBox");
  var questions = shuffle(QUESTIONS);
  var cur = 0, score = 0, answered = false;

  function renderQuestion(){
    answered = false;
    var q = questions[cur];
    box.innerHTML = "";

    var top = document.createElement("div");
    top.className = "quiz-top";
    top.innerHTML = "<span>Вопрос <b>" + (cur + 1) + "</b> из " + questions.length + "</span><span>Счёт: <b id=\"qScore\">" + score + "</b></span>";
    box.appendChild(top);

    var prog = document.createElement("div");
    prog.className = "progress";
    var bar = document.createElement("i");
    prog.appendChild(bar);
    box.appendChild(prog);
    setTimeout(function(){ bar.style.width = (cur / questions.length * 100) + "%"; }, 30);

    if(q.img){
      var media = document.createElement("div");
      media.className = "q-media";
      var im = document.createElement("img");
      im.src = q.img;
      im.alt = q.q;
      im.width = 600;
      im.height = 338;
      im.loading = "lazy";
      im.decoding = "async";
      media.appendChild(im);
      box.appendChild(media);
    }

    var qt = document.createElement("div");
    qt.className = "q-text";
    qt.textContent = q.q;
    box.appendChild(qt);

    var opts = document.createElement("div");
    opts.className = "options";
    var order = shuffle(q.o.map(function(_, i){ return i; }));
    order.forEach(function(realIdx){
      var b = document.createElement("button");
      b.type = "button";
      b.className = "option";
      b.textContent = q.o[realIdx];
      b.addEventListener("click", function(){ choose(realIdx, opts, b); });
      opts.appendChild(b);
    });
    box.appendChild(opts);

    var ex = document.createElement("div");
    ex.className = "explain";
    ex.id = "explain";
    box.appendChild(ex);

    var act = document.createElement("div");
    act.className = "quiz-actions";
    box.appendChild(act);
  }

  function choose(idx, opts, btn){
    if(answered) return;
    answered = true;
    var q = questions[cur];
    var buttons = opts.querySelectorAll(".option");
    buttons.forEach(function(b){ b.disabled = true; });

    /* Прогресс обновляется сразу после ответа */
    var bar = box.querySelector(".progress i");
    if(bar) bar.style.width = ((cur + 1) / questions.length * 100) + "%";

    if(idx === q.a){
      btn.classList.add("correct");
      score++;
    } else {
      btn.classList.add("wrong");
      buttons[q.a].classList.add("correct");
    }
    var sc = document.getElementById("qScore");
    if(sc) sc.textContent = score;

    var ex = document.getElementById("explain");
    ex.textContent = (idx === q.a ? "Верно! " : "Не совсем. ") + q.e;
    ex.classList.add("show");

    var act = box.querySelector(".quiz-actions");
    var next = document.createElement("button");
    next.type = "button";
    next.className = "btn";
    next.textContent = cur === questions.length - 1 ? "Посмотреть результат" : "Дальше →";
    next.addEventListener("click", function(){
      cur++;
      if(cur < questions.length) renderQuestion(); else renderResult();
    });
    act.appendChild(next);
    next.focus();
  }

  function getBest(){
    try{ return parseInt(localStorage.getItem(BEST_KEY) || "0", 10) || 0; }catch(e){ return 0; }
  }
  function saveBest(v){
    try{ localStorage.setItem(BEST_KEY, String(v)); }catch(e){}
  }

  function renderResult(){
    var title, text;
    if(score === questions.length){
      title = "Безупречно!"; text = "Вы ответили на всё. Можно смело заходить в игру и объяснять остальным, что такое last hit.";
    } else if(score >= 3){
      title = "Отличный результат"; text = "Основы вы поняли. Перечитайте пару тем, и в следующий раз будет ещё лучше.";
    } else {
      title = "Хорошее начало"; text = "Ничего страшного: даже профессионалы когда-то не знали, что такое deny. Вернитесь к разделам выше и попробуйте снова.";
    }
    var best = Math.max(getBest(), score);
    saveBest(best);

    box.innerHTML = "";
    var r = document.createElement("div");
    r.className = "result";
    r.innerHTML = "<div class=\"kicker\" style=\"color:var(--muted)\">Ваш результат</div><div class=\"score\"></div><h3></h3><p></p>";
    r.querySelector(".score").textContent = score + " / " + questions.length;
    r.querySelector("h3").textContent = title;
    r.querySelector("p").textContent = text;

    var bestLine = document.createElement("div");
    bestLine.className = "best";
    bestLine.textContent = "Лучший результат: " + best + " / " + questions.length;
    r.appendChild(bestLine);

    var again = document.createElement("button");
    again.type = "button";
    again.className = "btn";
    again.style.animation = "none";
    again.textContent = "Пройти заново";
    again.addEventListener("click", function(){
      questions = shuffle(QUESTIONS);
      cur = 0; score = 0;
      renderQuestion();
    });
    r.appendChild(again);
    box.appendChild(r);
  }

  renderQuestion();

  /* ---------- Кнопка «Наверх» ---------- */
  var toTop = document.getElementById("toTop");
  function onScroll(){
    if(toTop) toTop.classList.toggle("show", window.pageYOffset > 500);
  }
  window.addEventListener("scroll", onScroll, {passive:true});
  onScroll();
  if(toTop){
    toTop.addEventListener("click", function(){
      window.scrollTo({top:0, behavior:"smooth"});
    });
  }
})();