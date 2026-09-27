const KEY="finance_table_v1";
const state={ops:JSON.parse(localStorage.getItem(KEY)||"[]"), edit:null, goals:JSON.parse(localStorage.getItem("finance_month_goals_v1")||"{}")};
const cats=["Продукты","Транспорт","Жильё","Здоровье","Развлечения","Покупки","Зарплата","Фриланс","Другое"];
const accounts=["Наличные","Банковская карта","Сбережения"];
const $=id=>document.getElementById(id);
function save(){localStorage.setItem(KEY,JSON.stringify(state.ops));localStorage.setItem("finance_month_goals_v1",JSON.stringify(state.goals));render()}
function money(n){return Number(n||0).toLocaleString("ru-RU",{maximumFractionDigits:2})+" ֏"}
function today(){return new Date().toISOString().slice(0,10)}
function setup(){
 $("date").value=today();
 cats.forEach(x=>{let o=document.createElement("option");o.textContent=x;$("category").append(o)});
 accounts.forEach(x=>{let o=document.createElement("option");o.textContent=x;$("account").append(o)});
 ["search","month","typeFilter","accountFilter"].forEach(id=>$(id).addEventListener("input",render));
 $("addBtn").onclick=()=>openForm();
 $("goalBtn").onclick=()=>setMonthlyGoal();
 $("goalClear").onclick=()=>clearMonthlyGoal();
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


function selectedGoalMonth(){
 const selected=$("month").value;
 return selected==="all" ? today().slice(0,7) : selected;
}
function monthTotals(key){
 let income=0, expense=0;
 state.ops.forEach(x=>{
   if(x.date && x.date.startsWith(key)){
     if(x.type==="Доход") income+=Number(x.amount)||0;
     else expense+=Number(x.amount)||0;
   }
 });
 return {income,expense,balance:income-expense};
}
function setMonthlyGoal(){
 const key=selectedGoalMonth();
 const current=state.goals[key]||0;
 const answer=prompt(`Цель накопления на ${monthName(key)}.\nВведите сумму в ֏:`, current||"");
 if(answer===null)return;
 const value=Number(String(answer).replace(/\s/g,"").replace(",","."));
 if(!Number.isFinite(value)||value<=0){alert("Введите сумму больше 0.");return;}
 state.goals[key]=value;
 save();
}
function clearMonthlyGoal(){
 const key=selectedGoalMonth();
 if(!state.goals[key])return;
 if(confirm(`Удалить цель на ${monthName(key)}?`)){
   delete state.goals[key];
   save();
 }
}
function renderGoal(){
 const key=selectedGoalMonth();
 const target=Number(state.goals[key]||0);
 const totals=monthTotals(key);
 const card=$("goalCard");
 if(!target){
   $("goalAmount").textContent="Не задана";
   $("goalProgressText").textContent="0%";
   $("goalRemaining").textContent="Нажмите «Цель месяца»";
   $("goalBar").style.width="0%";
   return;
 }
 const progress=Math.max(0,Math.min(100,(totals.balance/target)*100));
 const remaining=Math.max(0,target-totals.balance);
 $("goalAmount").textContent=`${money(target)} · ${monthName(key)}`;
 $("goalProgressText").textContent=`${Math.round(progress)}%`;
 $("goalRemaining").textContent=totals.balance>=target ? "Цель выполнена 🎉" : `Осталось ${money(remaining)}`;
 $("goalBar").style.width=`${progress}%`;
}

function monthName(key){
 const [y,m]=key.split("-");
 const names=["январь","февраль","март","апрель","май","июнь","июль","август","сентябрь","октябрь","ноябрь","декабрь"];
 return `${names[Number(m)-1]} ${y} г.`;
}
function renderMonthlySummary(){
 const groups={};
 state.ops.forEach(x=>{
   if(!x.date) return;
   const key=x.date.slice(0,7);
   if(!groups[key]) groups[key]={income:0,expense:0,count:0};
   groups[key].count++;
   if(x.type==="Доход") groups[key].income+=Number(x.amount)||0;
   else groups[key].expense+=Number(x.amount)||0;
 });
 const keys=Object.keys(groups).sort().reverse();
 const body=$("monthlyBody"), foot=$("monthlyFoot");
 if(!keys.length){
   body.innerHTML='<tr><td colspan="4" class="empty">Пока нет данных для итогов.</td></tr>';
   foot.innerHTML="";
   return;
 }
 body.innerHTML=keys.map(k=>{
   const g=groups[k], bal=g.income-g.expense;
   const cls=bal>=0?"monthlyBalancePositive":"monthlyBalanceNegative";
   return `<tr>
     <td class="monthlyMonth"><button class="monthlyBtn" onclick="selectMonth('${k}')">${monthName(k)}</button></td>
     <td>+${money(g.income)}</td>
     <td>−${money(g.expense)}</td>
     <td class="${cls}">${bal>=0?"+":"−"}${money(Math.abs(bal))}</td>
   </tr>`;
 }).join("");
 const totalIncome=keys.reduce((s,k)=>s+groups[k].income,0);
 const totalExpense=keys.reduce((s,k)=>s+groups[k].expense,0);
 const totalBalance=totalIncome-totalExpense;
 foot.innerHTML=`<tr>
   <td>Итого</td>
   <td>+${money(totalIncome)}</td>
   <td>−${money(totalExpense)}</td>
   <td class="${totalBalance>=0?"monthlyBalancePositive":"monthlyBalanceNegative"}">${totalBalance>=0?"+":"−"}${money(Math.abs(totalBalance))}</td>
 </tr>`;
}
window.selectMonth=function(key){
 $("month").value=key;
 render();
 document.querySelector(".tableWrap")?.scrollIntoView({behavior:"smooth",block:"start"});
};

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
 $("income").textContent=money(income);$("expense").textContent=money(expense);$("balance").textContent=money(income-expense);$("periodBalance").textContent=money(income-expense);$("count").textContent=arr.length;renderMonthlySummary();renderGoal();
}
window.editRow=i=>openForm(i);
window.delRow=i=>{if(confirm("Удалить операцию?")){state.ops.splice(i,1);save()}};
setup();