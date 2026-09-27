const KEY="my-finance-v1", THEME="my-finance-theme";
const catsIncome=["Зарплата","Бизнес","Фриланс","Инвестиции","Подарок","Другое"];
const catsExpense=["Еда","Транспорт","Жильё","Коммунальные","Покупки","Развлечения","Здоровье","Одежда","Связь/Интернет","Образование","Путешествия","Кредиты","Прочее"];
let items=JSON.parse(localStorage.getItem(KEY)||"[]"), type="Расход";

const $=id=>document.getElementById(id);
function money(n){return new Intl.NumberFormat("ru-RU",{maximumFractionDigits:0}).format(n)+" ֏"}
function save(){localStorage.setItem(KEY,JSON.stringify(items))}
function monthKey(d){return d.slice(0,7)}
function months(){let s=new Set(items.map(x=>monthKey(x.date)));s.add(new Date().toISOString().slice(0,7));return [...s].sort().reverse()}
function renderMonths(){let old=$("monthFilter").value; $("monthFilter").innerHTML=months().map(m=>`<option value="${m}">${new Date(m+"-01").toLocaleDateString("ru-RU",{month:"long",year:"numeric"})}</option>`).join(""); if(months().includes(old))$("monthFilter").value=old}
function update(){
 let inc=items.filter(x=>x.type==="Доход").reduce((a,x)=>a+x.amount,0);
 let exp=items.filter(x=>x.type==="Расход").reduce((a,x)=>a+x.amount,0);
 $("income").textContent=money(inc); $("expense").textContent=money(exp); $("balance").textContent=money(inc-exp);
 renderMonths(); renderChart(); renderHistory();
}
function renderHistory(){
 let arr=[...items].sort((a,b)=>b.date.localeCompare(a.date));
 $("history").innerHTML=arr.length?arr.map(x=>`<div class="operation"><div class="op-left"><div class="op-title">${x.category}</div><div class="op-sub">${x.date}${x.description?" · "+escapeHtml(x.description):""}</div></div><div class="op-right"><div class="${x.type==="Доход"?"plus":"minus"}">${x.type==="Доход"?"+":"−"}${money(x.amount)}</div><button class="delete" onclick="removeItem('${x.id}')">Удалить</button></div></div>`).join(""):"<div class='muted'>Операций пока нет.</div>";
}
function renderChart(){
 let m=$("monthFilter").value, arr=items.filter(x=>monthKey(x.date)===m);
 let inc=arr.filter(x=>x.type==="Доход").reduce((a,x)=>a+x.amount,0), exp=arr.filter(x=>x.type==="Расход").reduce((a,x)=>a+x.amount,0);
 let canvas=$("chart"),ctx=canvas.getContext("2d"),w=canvas.width=canvas.clientWidth*2,h=canvas.height=380;ctx.clearRect(0,0,w,h);ctx.scale(2,2);w/=2;h/=2;
 let max=Math.max(inc,exp,1), base=h-35, barW=Math.min(80,w/4), gap=45;
 ctx.fillStyle=getComputedStyle(document.body).color;ctx.font="14px system-ui";ctx.textAlign="center";
 [[inc,"Доходы",w/2-barW-gap/2],[exp,"Расходы",w/2+gap/2]].forEach(([v,l,x])=>{let bh=(h-70)*v/max;ctx.fillStyle=l==="Доходы"?"#22c55e":"#ef4444";ctx.fillRect(x,base-bh,barW,bh);ctx.fillStyle=getComputedStyle(document.body).color;ctx.fillText(l,x+barW/2,base+20);ctx.fillText(money(v),x+barW/2,base-bh-8)});
 let cats={};arr.filter(x=>x.type==="Расход").forEach(x=>cats[x.category]=(cats[x.category]||0)+x.amount);
 $("categoryStats").innerHTML=Object.entries(cats).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<div class="stat"><span>${k}</span><b>${money(v)}</b></div>`).join("")||"<div class='muted'>Расходов за этот месяц нет.</div>";
}
function escapeHtml(s){return s.replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function openModal(t){type=t;$("modalTitle").textContent=t==="Доход"?"Новый доход":"Новый расход";let cs=t==="Доход"?catsIncome:catsExpense;$("category").innerHTML=cs.map(x=>`<option>${x}</option>`).join("");$("amount").value="";$("description").value="";$("date").value=new Date().toISOString().slice(0,10);$("modal").classList.remove("hidden");$("amount").focus()}
function removeItem(id){if(confirm("Удалить операцию?")){items=items.filter(x=>x.id!==id);save();update()}}
$("addIncome").onclick=()=>openModal("Доход");$("addExpense").onclick=()=>openModal("Расход");$("closeModal").onclick=()=>$("modal").classList.add("hidden");
$("save").onclick=()=>{let amount=Number($("amount").value);if(!amount||amount<0)return alert("Введите сумму");items.push({id:Date.now().toString(),type,category:$("category").value,description:$("description").value.trim(),date:$("date").value,amount});save();$("modal").classList.add("hidden");update()};
$("monthFilter").onchange=renderChart;
$("clearAll").onclick=()=>{if(items.length&&confirm("Удалить все операции?")){items=[];save();update()}};
$("themeBtn").onclick=()=>{document.body.classList.toggle("dark");localStorage.setItem(THEME,document.body.classList.contains("dark")?"dark":"light");renderChart()};
if(localStorage.getItem(THEME)==="dark")document.body.classList.add("dark");
if("serviceWorker"in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js"));
update();
