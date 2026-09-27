const KEY="finance_table_v1";
const state={ops:JSON.parse(localStorage.getItem(KEY)||"[]"), edit:null};
const cats=["Продукты","Транспорт","Жильё","Здоровье","Развлечения","Покупки","Зарплата","Фриланс","Другое"];
const accounts=["Наличные","Банковская карта","Сбережения"];
const $=id=>document.getElementById(id);
function save(){localStorage.setItem(KEY,JSON.stringify(state.ops));render()}
function money(n){return Number(n||0).toLocaleString("ru-RU",{maximumFractionDigits:2})+" ֏"}
function today(){return new Date().toISOString().slice(0,10)}
function setup(){
 $("date").value=today();
 cats.forEach(x=>{let o=document.createElement("option");o.textContent=x;$("category").append(o)});
 accounts.forEach(x=>{let o=document.createElement("option");o.textContent=x;$("account").append(o)});
 ["search","month","typeFilter","accountFilter"].forEach(id=>$(id).addEventListener("input",render));
 $("addBtn").onclick=()=>openForm();
 $("themeBtn").onclick=()=>{document.body.classList.toggle("dark");localStorage.setItem("dark",document.body.classList.contains("dark"))};
 if(localStorage.getItem("dark")==="true")document.body.classList.add("dark");
 $("form").addEventListener("submit",e=>{e.preventDefault();submitForm()});
 $("exportBtn").onclick=()=>{const blob=new Blob([JSON.stringify(state.ops,null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="moj-finansy-backup.json";a.click()};
 $("importBtn").onclick=()=>$("fileInput").click();
 $("fileInput").onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{state.ops=JSON.parse(r.result);save();alert("Данные восстановлены")}catch{alert("Неверный файл")}};r.readAsText(f)};
 render();
}
function openForm(index=null){
 state.edit=index;
 $("dlgTitle").textContent=index===null?"Новая операция":"Редактировать операцию";
 const x=index===null?{date:today(),type:"Расход",category:cats[0],description:"",amount:"",account:accounts[0],method:"Карта"}:state.ops[index];
 $("date").value=x.date;$("type").value=x.type;$("category").value=x.category;$("description").value=x.description;$("amount").value=x.amount;$("account").value=x.account;$("method").value=x.method;
 $("dlg").showModal();
}
function submitForm(){
 const x={date:$("date").value,type:$("type").value,category:$("category").value,description:$("description").value,amount:Number($("amount").value),account:$("account").value,method:$("method").value};
 if(state.edit===null)state.ops.push(x);else state.ops[state.edit]=x;
 $("dlg").close();save();
}
function render(){
 const q=$("search").value.toLowerCase(), tf=$("typeFilter").value, af=$("accountFilter").value;
 const months=[...new Set(state.ops.map(x=>x.date.slice(0,7)).filter(Boolean))].sort().reverse();
 const old=$("month").value; $("month").innerHTML='<option value="all">Все месяцы</option>'+months.map(m=>`<option value="${m}">${m}</option>`).join(""); $("month").value=months.includes(old)?old:"all";
 const month=$("month").value;
 $("accountFilter").innerHTML='<option value="all">Все счета</option>'+accounts.map(a=>`<option>${a}</option>`).join("");$("accountFilter").value=af;
 const arr=state.ops.map((x,i)=>({...x,i})).filter(x=>(!month||month==="all"||x.date.startsWith(month))&&(tf==="all"||x.type===tf)&&(af==="all"||x.account===af)&&(!q||`${x.description} ${x.category} ${x.account}`.toLowerCase().includes(q))).sort((a,b)=>b.date.localeCompare(a.date));
 $("tbody").innerHTML=arr.map(x=>`<tr class="${x.type==="Доход"?"incomeRow":"expenseRow"}"><td>${x.date}</td><td>${x.type}</td><td>${x.category}</td><td>${x.description||"—"}</td><td>${x.type==="Доход"?"+":"−"}${money(x.amount)}</td><td>${x.account}</td><td>${x.method}</td><td><button class="delete" onclick="editRow(${x.i})">✎</button><button class="delete" onclick="delRow(${x.i})">×</button></td></tr>`).join("");
 $("empty").style.display=arr.length?"none":"block";
 const income=arr.filter(x=>x.type==="Доход").reduce((s,x)=>s+x.amount,0), expense=arr.filter(x=>x.type==="Расход").reduce((s,x)=>s+x.amount,0);
 $("income").textContent=money(income);$("expense").textContent=money(expense);$("balance").textContent=money(income-expense);$("periodBalance").textContent=money(income-expense);$("count").textContent=arr.length;
}
window.editRow=i=>openForm(i);
window.delRow=i=>{if(confirm("Удалить операцию?")){state.ops.splice(i,1);save()}};
setup();