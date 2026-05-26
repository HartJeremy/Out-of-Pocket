let deck=null;
let state={line:null,pockets:[null,null],voice:null,change:null,locked:{line:false,pocket1:false,pocket2:false,voice:false,change:false},voiceOn:false,changeOn:false};

function save(){localStorage.setItem("oop-state-static-v1",JSON.stringify(state));}
function load(){const s=localStorage.getItem("oop-state-static-v1");if(s){try{state=JSON.parse(s)}catch(e){}}}
function pick(list,avoid){if(!list||!list.length)return "";let item=list[Math.floor(Math.random()*list.length)],tries=0;while(item===avoid&&list.length>1&&tries<30){item=list[Math.floor(Math.random()*list.length)];tries++;}return item;}
function blanks(){return state.line?Number(state.line.blanks||1):1;}
function normalize(){if(blanks()===1){state.pockets[1]=null;state.locked.pocket2=false;}else if(!state.pockets[1]){state.pockets[1]=pick(deck.pockets,state.pockets[0]);}}
function showToast(){const t=document.getElementById("toast");t.classList.remove("hidden");clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>t.classList.add("hidden"),2200);}
function visibleKeys(){const k=["line","pocket1"];if(blanks()===2)k.push("pocket2");if(state.voiceOn)k.push("voice");if(state.changeOn)k.push("change");return k;}
function allLocked(){return visibleKeys().every(k=>state.locked[k]);}
function card(kind,label,text,lockKey,swapFn){return `<article class="card ${kind} ${state.locked[lockKey]?"locked":""}"><span class="type">${label}</span><div class="cardText">${text||"?"}</div><div class="actions"><button data-lock="${lockKey}">${state.locked[lockKey]?"Unlock":"Lock"}</button><button data-swap="${swapFn}">Swap</button></div></article>`}
function built(){if(!state.line)return "Draw a hand to start.";let text=state.line.text.replace("___",state.pockets[0]||"___");if(blanks()===2)text=text.replace("___",state.pockets[1]||"___");if(state.voice)text+=" | Voice: "+state.voice;if(state.change)text+=" | Pocket Change: "+state.change;return text;}
function render(){normalize();const table=document.getElementById("table");let html="";html+=card("lineCard","LINE",state.line?state.line.text:"Tap New Hand","line","line");html+=card("pocketCard","POCKET",state.pockets[0],"pocket1","pocket1");if(blanks()===2)html+=card("pocketCard","POCKET",state.pockets[1],"pocket2","pocket2");if(state.voiceOn)html+=card("voiceCard","VOICE",state.voice,"voice","voice");if(state.changeOn)html+=card("changeCard","POCKET CHANGE",state.change,"change","change");table.innerHTML=html;document.getElementById("builtLine").textContent=built();document.getElementById("voiceToggle").checked=state.voiceOn;document.getElementById("changeToggle").checked=state.changeOn;save();}
function newHand(){if(state.line&&allLocked()){showToast();return;}if(!state.locked.line||!state.line)state.line=pick(deck.lines,state.line);normalize();if(!state.locked.pocket1||!state.pockets[0])state.pockets[0]=pick(deck.pockets,state.pockets[0]);if(blanks()===2&&(!state.locked.pocket2||!state.pockets[1]))state.pockets[1]=pick(deck.pockets,state.pockets[1]);if(state.voiceOn&&(!state.locked.voice||!state.voice))state.voice=pick(deck.voices,state.voice);if(state.changeOn&&(!state.locked.change||!state.change))state.change=pick(deck.pocketChanges,state.change);render();}
function swapLine(){if(state.locked.line){showToast();return;}state.line=pick(deck.lines,state.line);normalize();render();}
function swapPockets(){const two=blanks()===2;if(state.locked.pocket1&&(!two||state.locked.pocket2)){showToast();return;}if(!state.locked.pocket1)state.pockets[0]=pick(deck.pockets,state.pockets[0]);if(two&&!state.locked.pocket2)state.pockets[1]=pick(deck.pockets,state.pockets[1]);render();}
function swapOne(which){if(which==="line")return swapLine();if(which==="pocket1"){if(state.locked.pocket1)return showToast();state.pockets[0]=pick(deck.pockets,state.pockets[0]);}if(which==="pocket2"){if(state.locked.pocket2)return showToast();state.pockets[1]=pick(deck.pockets,state.pockets[1]);}if(which==="voice"){if(state.locked.voice)return showToast();state.voice=pick(deck.voices,state.voice);}if(which==="change"){if(state.locked.change)return showToast();state.change=pick(deck.pocketChanges,state.change);}render();}
document.addEventListener("click",e=>{const lock=e.target.dataset.lock;const sw=e.target.dataset.swap;if(lock){state.locked[lock]=!state.locked[lock];render();}if(sw)swapOne(sw);});
document.getElementById("newHand").onclick=newHand;
document.getElementById("swapLine").onclick=swapLine;
document.getElementById("swapPockets").onclick=swapPockets;
document.getElementById("voiceToggle").onchange=e=>{state.voiceOn=e.target.checked;if(!state.voiceOn){state.voice=null;state.locked.voice=false;}else if(!state.voice)state.voice=pick(deck.voices);render();};
document.getElementById("changeToggle").onchange=e=>{state.changeOn=e.target.checked;if(!state.changeOn){state.change=null;state.locked.change=false;}else if(!state.change)state.change=pick(deck.pocketChanges);render();};
document.getElementById("copyLine").onclick=()=>navigator.clipboard.writeText(built());
load();
fetch("./cards.json",{cache:"no-store"}).then(r=>r.json()).then(data=>{deck=data;render();}).catch(err=>{document.getElementById("builtLine").textContent="Could not load cards.json. Check that all files were uploaded.";console.error(err);});
if("serviceWorker" in navigator){window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));}
