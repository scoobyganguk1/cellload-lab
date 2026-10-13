(() => {
  const $ = id => document.getElementById(id);
  const config = { cells: 3, capacity: 100, arrivals: 18, length: 4, demand: 16, multi: 10, policy: 'best' };
  const fields = [
    ['cellCount','cells','cellCountValue',v=>v], ['cellCapacity','capacity','cellCapacityValue',v=>v],
    ['arrivalRate','arrivals','arrivalRateValue',v=>v], ['sessionLength','length','sessionLengthValue',v=>`${v} min`],
    ['userDemand','demand','userDemandValue',v=>v], ['multiShare','multi','multiShareValue',v=>`${v}%`]
  ];
  const colors = ['#64a8ff','#47d6bd','#ffb558','#da83ff','#ff737f','#7ee381','#53c4ef','#f3d35e'];
  let state, timer = null, lastArrivals = 0;
  const history = [];

  function formatTime(minute) { return `${String(Math.floor(minute / 60)).padStart(2,'0')}:${String(minute % 60).padStart(2,'0')}`; }
  function resetModel() {
    state = { minute: 0, nextId: 1, users: [], blocked: 0, arrivals: 0, rng: 19790317 };
    lastArrivals = 0; history.length = 0; history.push(Array(config.cells).fill(0));
  }
  function random() { state.rng = state.rng * 16807 % 2147483647; return (state.rng - 1) / 2147483646; }
  function log(message, kind='') {
    const list = $('eventLog');
    if (list.children.length === 1 && list.firstElementChild.textContent.includes('Ready.')) list.innerHTML = '';
    const li = document.createElement('li'); if (kind) li.className = `event-${kind}`;
    const time = document.createElement('span'); time.className = 'event-time'; time.textContent = formatTime(state.minute);
    const text = document.createElement('span'); text.textContent = message; li.append(time,text); list.prepend(li);
    while (list.children.length > 7) list.lastElementChild.remove();
  }
  function allocate() {
    const served = Array(state.users.length).fill(0);
    for (let cell=0; cell<config.cells; cell++) {
      const group = state.users.map((u,index)=>({u,index})).filter(x=>x.u.cell===cell);
      if (config.policy === 'fair') {
        let remaining = group.slice(), budget = config.capacity;
        while (remaining.length && budget > 1e-9) {
          const share = budget / remaining.length;
          const capped = remaining.filter(({u})=>u.demand <= share);
          if (!capped.length) { for (const {index} of remaining) served[index]=share; break; }
          for (const {u,index} of capped) { served[index]=u.demand; budget-=u.demand; }
          const done = new Set(capped.map(x=>x.index)); remaining=remaining.filter(x=>!done.has(x.index));
        }
      } else {
        const total = group.reduce((sum,{u})=>sum+u.demand,0), factor = total > config.capacity ? config.capacity/total : 1;
        for (const {u,index} of group) served[index]=u.demand*factor;
      }
    }
    return { perUser: served, requested: state.users.reduce((sum,u)=>sum+u.demand,0), served: served.reduce((a,b)=>a+b,0) };
  }
  function simulateMinute() {
    state.minute++;
    state.users = state.users.filter(user=>user.endsAt > state.minute);
    const expected = config.arrivals/60; let arrivals = Math.floor(expected); if (random() < expected-arrivals) arrivals++;
    lastArrivals=arrivals; state.arrivals+=arrivals; let blocked=0;
    const admitted = Array(config.cells).fill(0); for (const user of state.users) admitted[user.cell]+=user.demand;
    for (let i=0;i<arrivals;i++) {
      const demand=config.demand*(random()<config.multi/100?2:1), cell=Math.floor(random()*config.cells);
      if (config.policy==='admission' && admitted[cell]+demand>config.capacity) { state.blocked++; blocked++; continue; }
      state.users.push({id:state.nextId++,cell,demand,endsAt:state.minute+Math.max(1,Math.round(-Math.log(Math.max(.00001,random()))*config.length))});
      admitted[cell]+=demand;
    }
    const allocation=allocate(), perCell=Array(config.cells).fill(0);
    state.users.forEach((user,index)=>perCell[user.cell]+=allocation.perUser[index]);
    history.push(perCell.map(value=>Math.min(1,value/config.capacity))); if(history.length>61)history.shift();
    if(blocked)log(`${blocked} session${blocked>1?'s':''} blocked by admission control.`,'warn');
    else if(arrivals>0 && state.minute%3===0)log(`${arrivals} synthetic session${arrivals>1?'s':''} arrived across the cells.`);
    render();
  }
  function render() {
    const allocation=allocate(), loads=Array(config.cells).fill(0);
    for (const user of state.users) loads[user.cell]+=user.demand;
    const totalCapacity=config.cells*config.capacity, used=totalCapacity?Math.min(100,Math.round(allocation.served/totalCapacity*100)):0;
    const ratio=allocation.requested?Math.round(allocation.served/allocation.requested*100):100;
    $('timeMetric').textContent=formatTime(state.minute); $('activeMetric').textContent=state.users.length;
    $('arrivalFoot').textContent=lastArrivals; $('capacityMetric').textContent=used; $('blockedMetric').textContent=state.blocked;
    $('chartStart').textContent=formatTime(Math.max(0,state.minute-Math.min(30,history.length-1))); $('chartEnd').textContent=formatTime(state.minute);
    $('servedMetric').textContent=`${ratio}%`; $('servedBar').style.width=`${ratio}%`;
    const badge=$('servedBadge'); badge.className=`status-badge ${ratio>=90?'good':ratio>=65?'warn':''}`;
    badge.textContent=state.minute?(ratio>=90?'Healthy':ratio>=65?'Strained':'Congested'):'Waiting';
    $('outcomeNote').textContent=!state.minute?'Start the simulation to see how this scenario behaves.':ratio>=90?'Current sessions are receiving nearly all of their requested capacity.':'Active demand exceeds available capacity; some users are receiving less than requested.';
    const readout=$('cellReadout'); readout.innerHTML='';
    loads.forEach((load,i)=>{const chip=document.createElement('div');chip.className='cell-chip';chip.style.setProperty('--chip',colors[i]);const dot=document.createElement('i');const label=document.createElement('span');label.textContent=`CELL ${String(i+1).padStart(2,'0')}`;const amount=document.createElement('strong');amount.textContent=`${Math.round(load)} / ${config.capacity}`;chip.append(dot,label,amount);readout.append(chip);});
    drawChart();
  }
  function drawChart() {
    const canvas=$('utilizationChart'), rect=canvas.getBoundingClientRect(); if(!rect.width||!rect.height)return;
    const dpr=window.devicePixelRatio||1;canvas.width=rect.width*dpr;canvas.height=rect.height*dpr;
    const ctx=canvas.getContext('2d');ctx.scale(dpr,dpr);const w=rect.width,h=rect.height,left=31,right=9,top=12,bottom=22,plotW=w-left-right,plotH=h-top-bottom;
    ctx.clearRect(0,0,w,h);ctx.font='9px DM Mono, monospace';ctx.textAlign='right';ctx.textBaseline='middle';
    for(let pct=0;pct<=100;pct+=25){const y=top+plotH*(1-pct/100);ctx.strokeStyle='#34465e';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(left,y);ctx.lineTo(w-right,y);ctx.stroke();ctx.fillStyle='#8295ad';ctx.fillText(`${pct}%`,left-8,y);}
    const points=history.slice(-31),denominator=Math.max(30,points.length-1);
    points.forEach((values,index)=>values.forEach((value,cell)=>{const x=left+plotW*index/denominator,y=top+plotH*(1-value);if(index===0){ctx.beginPath();ctx.arc(x,y,2.5,0,Math.PI*2);ctx.fillStyle=colors[cell];ctx.fill();}else{const prev=points[index-1][cell]??0;ctx.beginPath();ctx.moveTo(left+plotW*(index-1)/denominator,top+plotH*(1-prev));ctx.lineTo(x,y);ctx.strokeStyle=colors[cell];ctx.lineWidth=2;ctx.stroke();}}));
    ctx.setLineDash([4,5]);ctx.strokeStyle='#647895';ctx.beginPath();ctx.moveTo(left,top);ctx.lineTo(w-right,top);ctx.stroke();ctx.setLineDash([]);
  }
  function setRunState(running) {
    const button=$('runButton');
    if(running){$('runIcon').textContent='Ⅱ';$('runLabel').textContent='Pause simulation';button.classList.add('is-running');button.setAttribute('aria-pressed','true');}
    else{$('runIcon').textContent=state.minute?'▶':'▶';$('runLabel').textContent=state.minute?'Resume simulation':'Start simulation';button.classList.remove('is-running');button.setAttribute('aria-pressed','false');}
  }
  function toggleRun() {
    if(timer){clearInterval(timer);timer=null;setRunState(false);log('Simulation paused.','good');}
    else{timer=setInterval(simulateMinute,500);setRunState(true);log(state.minute?'Simulation resumed.':'Simulation started. Synthetic sessions are now running.','good');}
  }
  function applyConfig(reset=true) {
    for(const [id,key] of fields)config[key]=Number($(id).value);
    config.policy=$('policy').value;for(const [id,key,out,fmt] of fields)$(out).textContent=fmt(config[key]);
    const descriptions={best:'All sessions are admitted; overloaded capacity is shared in proportion to requested demand.',fair:'Every active user gets an equal initial share; unused capacity is redistributed.',admission:'New sessions are blocked when their requested demand would exceed cell capacity.'};
    $('policyDescription').textContent=descriptions[config.policy];
    if(reset){resetModel();$('eventLog').innerHTML='<li><span class="event-time">00:00</span><span>Scenario changed. Simulation reset with synthetic users only.</span></li>';}
    render();
  }
  function exportCsv() {
    const rows=[['minute',...Array.from({length:config.cells},(_,i)=>`cell_${i+1}_utilization_pct`)]];
    history.forEach((row,index)=>rows.push([Math.max(0,state.minute-history.length+1+index),...row.map(value=>Math.round(value*100))]));
    const blob=new Blob([rows.map(row=>row.join(',')).join('\n')],{type:'text/csv'}),url=URL.createObjectURL(blob),link=document.createElement('a');
    link.href=url;link.download='cellload-simulation.csv';link.click();URL.revokeObjectURL(url);log('Current utilization history exported as CSV.','good');
  }
  fields.forEach(([id])=>$(id).addEventListener('input',()=>applyConfig(true)));
  $('policy').addEventListener('change',()=>applyConfig(true));$('runButton').addEventListener('click',toggleRun);
  $('stepButton').addEventListener('click',simulateMinute);
  $('resetButton').addEventListener('click',()=>{if(timer){clearInterval(timer);timer=null;}applyConfig(true);setRunState(false);$('eventLog').innerHTML='<li><span class="event-time">00:00</span><span>Ready. Press Start simulation to generate synthetic sessions.</span></li>';});
  $('exportButton').addEventListener('click',exportCsv);window.addEventListener('resize',drawChart);
  function updateDeviceClock(){ $('deviceClock').textContent=new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',hour12:false}); }
  updateDeviceClock();setInterval(updateDeviceClock,15000);
  resetModel();render();
})();
