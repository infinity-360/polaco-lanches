// Links de pedido: troque IFOOD pelo link direto da loja quando tiver.
const WHATSAPP = "554430343834";
const IFOOD = "https://www.ifood.com.br/busca?q=polaco%20lanches%20maringa";
const TOUR = "tour.html?embed=1";
const MAP = "https://www.google.com/maps?q=Polaco%20Lanches%20Sol%20Nascente%20Maring%C3%A1&ll=-23.4571001,-51.9103893&z=17&output=embed";

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const brl = n => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const esc = s => s.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const waLink = text => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`;

/* Entregador cruza a tela sozinho e revela a logo atrás dele */
const hero = $("#inicio"), header = $("#top"), palco = $(".palco"), moto = $("#moto"), surge = $(".surge");
const brilho = $(".brilho"), aura = $(".aura"), ctx = moto.getContext("2d");
const QUADROS = 12, DURACAO = 5000, quadros = [];
const semMovimento = matchMedia("(prefers-reduced-motion: reduce)").matches;
const limita = v => Math.min(1, Math.max(0, v));
const trecho = (p, a, b) => limita((p - a) / (b - a));
let atual = semMovimento ? 1 : 0, ultimo = null, antes = 0, iniciado = false;

function desenharMoto(i) {
  const img = quadros[i] || quadros.find(Boolean);
  if (!img || img === ultimo) return;
  ultimo = img;
  ctx.clearRect(0, 0, 640, 640);
  ctx.drawImage(img, 0, 0, 640, 640);
}
function cena(p) {
  const W = palco.clientWidth, S = moto.offsetWidth, L = surge.offsetWidth;
  const t = trecho(p, 0, .72);
  /* Mais rápido nas pontas e um pouco mais lento ao passar pelo centro */
  const fora = W / 2 + S * .66, x = -fora + 2 * fora * (t + .055 * Math.sin(2 * Math.PI * t));
  const pulo = Math.sin(p * 120) * 3, giro = Math.sin(p * 70) * .8;
  moto.style.transform = `translate(calc(-50% + ${x.toFixed(1)}px), calc(-50% + ${pulo.toFixed(1)}px)) rotate(${giro.toFixed(2)}deg)`;
  brilho.style.transform = `translate(calc(-50% + ${x.toFixed(1)}px), -50%) scale(${(1 + Math.sin(p * 46) * .05).toFixed(3)})`;
  moto.style.visibility = brilho.style.visibility = t >= 1 ? "hidden" : "visible";
  const revela = (x + L / 2) / L * 100, v = trecho(p, .6, .88), onda = Math.sin(Math.PI * v);
  surge.style.setProperty("--m", `${Math.max(-5, Math.min(130, revela)).toFixed(1)}%`);
  surge.style.transform = `translate(-50%, -50%) scale(${(1 + onda * .06).toFixed(3)})`;
  aura.style.opacity = (limita((revela - 20) / 70) * (.55 + onda * .45)).toFixed(3);
  aura.style.transform = `translate(-50%, -50%) scale(${(1 + onda * .14).toFixed(3)})`;
  const n = Math.floor(p * 130) % (QUADROS * 2 - 2);
  desenharMoto(n < QUADROS ? n : QUADROS * 2 - 2 - n);
  hero.style.setProperty("--p", p.toFixed(4));
  hero.classList.toggle("final", p > .76);
}
function animar(agora) {
  /* Passo limitado: se a aba estiver em segundo plano, a cena continua de onde parou */
  const passo = Math.min(50, agora - (antes || agora));
  antes = agora;
  atual = limita(atual + passo / DURACAO);
  cena(atual);
  if (atual < 1) requestAnimationFrame(animar);
}
function iniciar() {
  if (iniciado || semMovimento) return;
  iniciado = true;
  requestAnimationFrame(animar);
}
const onScroll = () => header.classList.toggle("show", scrollY > hero.offsetHeight * .7);
let prontos = 0;
for (let i = 0; i < QUADROS && !semMovimento; i++) {
  const img = new Image();
  img.onload = () => { quadros[i] = img; if (++prontos === QUADROS) iniciar(); };
  img.onerror = () => { if (++prontos === QUADROS) iniciar(); };
  img.src = `assets/moto/m${String(i).padStart(2, "0")}.webp`;
}
setTimeout(iniciar, 2500);
addEventListener("scroll", onScroll, { passive: true });
addEventListener("resize", () => { cena(atual); onScroll(); });
cena(atual);
onScroll();

/* Aberto ou fechado, sempre no horário de Maringá */
function renderStatus() {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo", weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(new Date()).map(x => [x.type, x.value]));
  const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(parts.weekday);
  const now = +parts.hour * 60 + +parts.minute;
  const close = day === 0 ? 0 : day >= 5 ? 1410 : 1380;
  const open = day !== 0 && now >= 1080 && now < close;
  let label;
  if (open) label = `Aberto agora, até ${day >= 5 ? "23:30" : "23:00"}`;
  else if (day !== 0 && now < 1080) label = "Fechado, abre hoje às 18:00";
  else if (day === 6) label = "Fechado, abre segunda às 18:00";
  else label = "Fechado, abre amanhã às 18:00";
  $$("[data-status]").forEach(el => { el.textContent = label; el.classList.toggle("open", open); el.classList.toggle("closed", !open); });
  $$(".hours tr").forEach(tr => tr.classList.toggle("today", tr.dataset.days.split(",").includes(String(day))));
}
renderStatus();
setInterval(renderStatus, 60000);

/* Cardápio */
const tabs = $("#tabs"), items = $("#items");
const cart = new Map();
tabs.innerHTML = MENU.map((c, i) => `<button type="button" role="tab" data-i="${i}" aria-selected="${i === 0}">${esc(c.cat)}</button>`).join("");

function renderCat(i) {
  $$("button", tabs).forEach((b, n) => b.setAttribute("aria-selected", n === i));
  items.innerHTML = MENU[i].items.map(([name, desc, price, old, img], n) => `
    <article class="item">
      ${img ? `<img src="assets/produtos/${img}" alt="${esc(name)}" width="92" height="92" loading="lazy">` : `<div class="noimg" aria-hidden="true">P</div>`}
      <div>
        <h3>${esc(name)}</h3>
        <p>${esc(desc)}</p>
        <div class="buy">
          <span class="price">${old ? `<s>${brl(old)}</s>` : ""}${brl(price)}</span>
          <button class="add" type="button" data-id="${i}-${n}" aria-label="Adicionar ${esc(name)}">Adicionar</button>
        </div>
      </div>
    </article>`).join("");
}
renderCat(0);
tabs.addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b) return;
  renderCat(+b.dataset.i);
  b.scrollIntoView({ inline: "center", block: "nearest" });
  const top = $(".tabs-bar").getBoundingClientRect().top;
  if (top <= 66) scrollTo({ top: scrollY + items.getBoundingClientRect().top - 130 });
});
items.addEventListener("click", e => {
  const b = e.target.closest(".add"); if (!b) return;
  change(b.dataset.id, 1);
  b.textContent = "Adicionado ✓";
  setTimeout(() => { if (b.isConnected) b.textContent = "Adicionar"; }, 900);
});

/* Pedido */
const itemOf = id => { const [c, n] = id.split("-").map(Number); return MENU[c].items[n]; };
const total = () => [...cart].reduce((s, [id, q]) => s + itemOf(id)[2] * q, 0);
function change(id, d) {
  const q = (cart.get(id) || 0) + d;
  if (q > 0) cart.set(id, q); else cart.delete(id);
  renderCart();
}
function renderCart() {
  const count = [...cart.values()].reduce((a, b) => a + b, 0);
  $("#cart-fab").hidden = !count;
  $("#fab-count").textContent = count;
  $("#fab-total").textContent = brl(total());
  $("#cart-total").textContent = brl(total());
  $("#cart-list").innerHTML = [...cart].map(([id, q]) => {
    const it = itemOf(id);
    return `<li><span>${esc(it[0])}<br><b>${brl(it[2] * q)}</b></span>
      <span class="qty"><button type="button" data-d="-1" data-id="${id}" aria-label="Remover um">−</button>${q}<button type="button" data-d="1" data-id="${id}" aria-label="Adicionar um">+</button></span></li>`;
  }).join("");
  if (!count && dialog.open) dialog.close();
}
const dialog = $("#cart");
$("#cart-fab").addEventListener("click", () => dialog.showModal());
dialog.addEventListener("click", e => { if (e.target === dialog) dialog.close(); });
$("#cart-list").addEventListener("click", e => {
  const b = e.target.closest("[data-d]"); if (b) change(b.dataset.id, +b.dataset.d);
});
const mode = () => $("input[name=mode]:checked").value;
$$("input[name=mode]").forEach(r => r.addEventListener("change", () => { $("#addr-wrap").hidden = mode() !== "Entrega"; }));

$("#send").addEventListener("click", () => {
  const name = $("#c-name"), addr = $("#c-addr");
  const missing = [name, ...(mode() === "Entrega" ? [addr] : [])].filter(f => !f.value.trim());
  [name, addr].forEach(f => f.classList.toggle("err", missing.includes(f)));
  if (missing.length) { missing[0].focus(); return; }
  const lines = [...cart].map(([id, q]) => { const it = itemOf(id); return `${q}x ${it[0]} (${brl(it[2] * q)})`; });
  const msg = ["Olá! Quero fazer um pedido:", "", ...lines, "", `Subtotal: ${brl(total())}`, `Nome: ${name.value.trim()}`, `Recebimento: ${mode()}`,
    ...(mode() === "Entrega" ? [`Endereço: ${addr.value.trim()}`] : []), `Pagamento: ${$("#c-pay").value}`,
    ...($("#c-obs").value.trim() ? [`Observações: ${$("#c-obs").value.trim()}`] : [])].join("\n");
  window.open(waLink(msg), "_blank", "noopener");
});

/* Links, tour 360° e mapa */
$("#ifood").href = IFOOD;
$$("[data-wa]").forEach(a => { a.href = waLink("Olá! Vim pelo site e quero fazer um pedido."); a.target = "_blank"; a.rel = "noopener"; });
const viewer = $("#viewer");
viewer.src = TOUR;
$$(".switch button").forEach(b => b.addEventListener("click", () => {
  $$(".switch button").forEach(x => x.classList.toggle("on", x === b));
  const sv = b.dataset.view === "sv";
  viewer.src = sv ? TOUR : MAP;
  viewer.title = sv ? "Tour virtual 360° da Polaco Lanches" : "Mapa da localização da Polaco Lanches";
}));
$("#year").textContent = new Date().getFullYear();
