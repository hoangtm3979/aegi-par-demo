const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
let lastResult = null;
let exposureAnswers = {};
let submittedInput = null;
let submittedCaseId = null;
let profiles = [];
let attachmentTokens = [];
let lastAttachment = null;
const LAST_CASE_KEY = 'aegi_par_p3_last_case';

function show(id){ $$('.view').forEach(v=>v.classList.remove('active')); $(id).classList.add('active'); window.scrollTo({top:0,behavior:'smooth'}); }
function toast(msg){ const t=$('#toast'); t.textContent=msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),2600); }
function escapeHtml(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function li(items){return (items||[]).map(x=>`<li>${escapeHtml(x)}</li>`).join('');}
function concernClass(level){return level?.startsWith('HIGH')||level?.startsWith('URGENT')?'high':level==='VERIFY'?'verify':'low';}
function stateClass(state){
  if(['MATCH','REFERENCE_MATCH'].includes(state)) return 'state-good';
  if(['DEVIATION','SIMILAR_REVIEWED'].includes(state)) return 'state-warn';
  if(['UNAVAILABLE','STALE','CONFLICTED'].includes(state)) return 'state-neutral';
  return 'state-neutral';
}

async function loadProfiles(){
  const res = await fetch('/api/v1/demo/profiles');
  const data = await res.json();
  const apiProfiles = data.profiles || [];
  const recoveryProfile = {
    id:'submission_recovery',
    label:'Tình huống 3 · Đã chuyển tiền — cần xử lý ngay',
    thesis:'Khi tiền đã được chuyển, PAR chuyển sang hướng xử lý sau sự cố: liên hệ đơn vị quản lý tài khoản qua kênh tin cậy, bảo vệ tài khoản và giữ bằng chứng.',
    situation:'Tôi đã chuyển 25 triệu đồng theo yêu cầu của người gọi tự xưng cán bộ điều tra và họ yêu cầu tôi giữ bí mật. Sau đó tôi phát hiện tài khoản nhận không đúng thông tin mà họ nói. Tôi cần biết phải làm gì ngay.',
    phone:'0900000404', account:'666600001111222233', action_state:'ALREADY_TRANSFERRED'
  };
  profiles = [
    {...apiProfiles[0], label:'Tình huống 1 · Yêu cầu chuyển tiền đáng ngờ', thesis:'Chưa có cảnh báo bất lợi đã biết vẫn có thể cần dừng khi ngữ cảnh và yêu cầu có dấu hiệu nguy hiểm.'},
    {...apiProfiles[1], label:'Tình huống 2 · Người nhận chưa quen, thông tin tham chiếu phù hợp', thesis:'Không dừng chỉ vì người nhận chưa quen; thông tin tham chiếu và quy trình phù hợp giúp giảm cảnh báo quá mức nhưng không chứng nhận giao dịch “an toàn”.'},
    recoveryProfile
  ].filter(Boolean);
  const labels=['01','02','03'];
  $('#proofGrid').innerHTML = profiles.map((p,i)=>`<article class="proof-card">
    <div class="proof-number">${labels[i]||String(i+1).padStart(2,'0')}</div>
    <div><span class="tag">${escapeHtml(p.label.split(' · ')[0])}</span><h3>${escapeHtml(p.label.split(' · ')[1]||p.label)}</h3><p>${escapeHtml(p.thesis)}</p></div>
    <button class="text-button load-profile" data-profile="${escapeHtml(p.id)}">Thử tình huống này →</button>
  </article>`).join('');
  $$('.load-profile').forEach(b=>b.addEventListener('click',()=>loadProfile(b.dataset.profile)));
}

function clearAttachment(){
  attachmentTokens=[]; lastAttachment=null; $('#evidenceFile').value='';
  $('#uploadStatus').hidden=true; $('#uploadStatus').textContent='';
  updateTray();
}
function resetIntakeForm(){
  exposureAnswers={}; submittedInput=null; submittedCaseId=null;
  $('#checkForm').reset();
  clearAttachment();
  $('#situation').placeholder='Ví dụ: Người gọi tự xưng Công an yêu cầu tôi chuyển tiền để xác minh...';
  updateTray(); updateCount();
}

function loadProfile(id){
  const p=profiles.find(x=>x.id===id); if(!p) return;
  resetIntakeForm(); show('#intake');
  $('#situation').value=p.situation; $('#phone').value=p.phone||''; $('#account').value=p.account||''; $('#actionState').value=p.action_state||'UNKNOWN';
  updateTray(); updateCount(); toast(`Đã nạp ${p.label}`);
}

$$('[data-entry]').forEach(btn=>btn.addEventListener('click',()=>{
  const mode=btn.dataset.entry; resetIntakeForm(); show('#intake');
  if(mode==='quick') $('#situation').placeholder='Ví dụ: Số này gọi tự xưng ngân hàng và yêu cầu tôi chuyển tiền để xác minh...';
  if(mode==='recovery') { $('#actionState').value='ALREADY_TRANSFERRED'; $('#situation').placeholder='Bạn đã chuyển tiền theo một yêu cầu đáng ngờ? Mô tả việc đã xảy ra và thông tin bạn có; không nhập mã hoặc mật khẩu.'; }
}));
$$('[data-back]').forEach(btn=>btn.addEventListener('click',()=>show('#home')));

function updateTray(){
  $('#trayPhone').classList.toggle('active',!!$('#phone').value.trim());
  $('#trayAccount').classList.toggle('active',!!$('#account').value.trim());
  $('#trayQr').classList.toggle('active',lastAttachment?.kind==='QR_IMAGE');
  $('#trayImage').classList.toggle('active',!!lastAttachment);
}
function updateCount(){ $('#charCount').textContent=$('#situation').value.length; }
['phone','account'].forEach(id=>$('#'+id).addEventListener('input',updateTray));
$('#situation').addEventListener('input',()=>{updateCount(); exposureAnswers={}; submittedInput=null;});
['phone','account','actionState'].forEach(id=>$('#'+id).addEventListener('change',()=>{exposureAnswers={};submittedInput=null;}));

$('#evidenceFile').addEventListener('change', async()=>{
  const file=$('#evidenceFile').files?.[0]; if(!file){clearAttachment(); return;}
  const status=$('#uploadStatus'); status.hidden=false; status.className='upload-status'; status.textContent='Đang gửi ảnh tới máy chủ demo để xử lý…';
  const fd=new FormData(); fd.append('file',file);
  try{
    const res=await fetch('/api/v1/uploads/image',{method:'POST',body:fd});
    const data=await res.json().catch(()=>({}));
    if(!res.ok) throw new Error(data.detail||'Không thể tiếp nhận ảnh');
    lastAttachment=data.attachment; attachmentTokens=[data.attachment.attachment_token];
    status.classList.add(lastAttachment.state==='QR_DECODED'?'good':'warn');
    status.innerHTML=lastAttachment.state==='QR_DECODED'
      ? `<strong>Đã đọc được QR.</strong> Loại nội dung: ${escapeHtml(lastAttachment.qr_payload_type||'UNKNOWN')}. Ảnh gốc được loại bỏ sau khi máy chủ demo kiểm tra.`
      : `<strong>Ảnh đã được máy chủ demo tiếp nhận.</strong> Bản hiện tại chưa phân tích nội dung chữ trong ảnh; chỉ ghi nhận metadata kỹ thuật phục vụ ca thử nghiệm. Ảnh gốc được loại bỏ sau khi kiểm tra.`;
    updateTray();
  }catch(err){ attachmentTokens=[]; lastAttachment=null; status.classList.add('bad'); status.textContent=err.message||'Không thể tiếp nhận ảnh'; updateTray(); }
});

$('#checkForm').addEventListener('submit',async(e)=>{
  e.preventDefault();
  const button=e.submitter; button.disabled=true; button.textContent='Đang đối chiếu…';
  try{
    const res=await fetch('/api/v1/check',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
      situation:$('#situation').value,
      phone:$('#phone').value||null,
      account:$('#account').value||null,
      action_state:$('#actionState').value,
      attachment_tokens:attachmentTokens,
      exposure_answers:exposureAnswers
    })});
    const data=await res.json().catch(()=>({}));
    if(!res.ok) throw new Error(data.detail||'Không thể xử lý yêu cầu');
    submittedInput={situation:$('#situation').value,phone:$('#phone').value||null,account:$('#account').value||null,action_state:$('#actionState').value,attachment_tokens:[...attachmentTokens]};
    submittedCaseId=data.case_id; lastResult=data; localStorage.setItem(LAST_CASE_KEY,lastResult.case_id); renderResult(lastResult); show('#result'); updateResumeCard();
  }catch(err){ toast(err.message||'Có lỗi xảy ra'); }
  finally{button.disabled=false; button.textContent='Kiểm tra tình huống';}
});

function renderResult(r){
  if(submittedCaseId!==r.case_id) submittedInput=null;
  const understood=[];
  if(r.understood?.domain) understood.push(r.understood.domain);
  if(r.understood?.claimed_identity) understood.push(r.understood.claimed_identity);
  (r.understood?.requested_actions||[]).forEach(a=>understood.push(a.replaceAll('_',' ')));
  if(r.understood?.action_state) understood.push(r.understood.action_state.replaceAll('_',' '));
  const degraded=Object.entries(r.capability||{}).filter(([_,v])=>['UNAVAILABLE','STALE','CONFLICTED'].includes(v));
  $('#resultMount').innerHTML=`
    <div class="result-hero">
      <div class="result-title-row"><span class="concern ${concernClass(r.concern_level)}">${escapeHtml(r.concern_label)}</span></div>
      <h2>${escapeHtml(r.headline)}</h2>
      <div class="result-block primary-action"><h3>Làm gì ngay</h3><ul>${li(r.actions)}</ul></div>
      ${r.redaction?.redacted?`<div class="redaction">PAR đã ẩn bí mật phát hiện trong mô tả: ${escapeHtml(r.redaction.types.join(', '))}.</div>`:''}
      ${degraded.length?`<div class="redaction">Một số nguồn đang thiếu/cũ/mâu thuẫn. PAR không coi trạng thái này là bằng chứng an toàn.</div>`:''}
    </div>
    <div class="result-grid supporting-results">
      <div class="result-block"><h3>Vì sao</h3><ul>${li(r.reasons)}</ul></div>
      <div class="result-block"><h3>Chưa xác minh</h3><ul>${li(r.unknowns)}</ul></div>
      <div class="result-block"><h3>Xác minh thế nào</h3><ul>${li(r.verification_steps)}</ul></div>
    </div>
    ${interpretationHtml(r)}
    <details class="technical-details">
      <summary>Chi tiết kỹ thuật của ca</summary>
      <div class="technical-details-body">
        <div class="understood"><strong>PAR ghi nhận gì từ mô tả?</strong><div class="chips">${understood.map(x=>`<span class="chip">${escapeHtml(x)}</span>`).join('')}</div></div>
        <div class="caseid">Case ${escapeHtml(r.case_id)} · ${escapeHtml(r.release)} · Policy ${escapeHtml(r.trace?.policy_version)} · Action ${escapeHtml(r.action_class)}</div>
      </div>
    </details>
    <div class="result-actions"><button class="secondary" id="showEvidence">Xem bằng chứng, nguồn & dấu vết</button><button class="secondary" id="newCheck">Kiểm tra mới</button><button class="secondary danger" id="deleteCase">Xóa ca này</button></div>
    <p class="disclaimer">${escapeHtml(r.disclaimer)}</p>`;
  bindClarification();
  $('#showEvidence').addEventListener('click',openEvidence);
  $('#newCheck').addEventListener('click',newCheck);
  $('#deleteCase').addEventListener('click',deleteCurrentCase);
}

async function openEvidence(){
  if(!lastResult)return;
  const res=await fetch(`/api/v1/cases/${encodeURIComponent(lastResult.case_id)}/evidence`); const data=await res.json();
  if(!res.ok){toast(data.detail||'Evidence không còn khả dụng'); return;}
  const sourceMap=Object.fromEntries((data.sources||[]).map(s=>[s.source_id,s]));
  $('#evidenceMount').innerHTML=`<div class="evidence-body">
    <div class="capability-grid">${Object.entries(data.capability||{}).map(([k,v])=>`<div><small>${escapeHtml(k)}</small><strong>${escapeHtml(v)}</strong></div>`).join('')}</div>
    ${data.evidence.map(e=>`<div class="evidence-item"><div class="evidence-top"><strong>${escapeHtml(e.kind)}</strong><span class="state ${stateClass(e.state)}">${escapeHtml(e.state)}</span></div><p><b>${escapeHtml(e.label)}</b><br>${escapeHtml(e.detail)}</p>${e.metadata?`<pre class="metadata">${escapeHtml(JSON.stringify(e.metadata,null,2))}</pre>`:''}${e.limitations?`<p><small>Giới hạn: ${escapeHtml(e.limitations)}</small></p>`:''}${e.source_id&&sourceMap[e.source_id]?`<div class="source-card"><small>${escapeHtml(sourceMap[e.source_id].authority_class)} · ${escapeHtml(sourceMap[e.source_id].published_at)}</small><br>${sourceMap[e.source_id].canonical_url?`<a href="${escapeHtml(sourceMap[e.source_id].canonical_url)}" target="_blank" rel="noopener">${escapeHtml(sourceMap[e.source_id].title)} ↗</a>`:`<strong>${escapeHtml(sourceMap[e.source_id].title)}</strong>`}<p>${escapeHtml(sourceMap[e.source_id].limitations||'')}</p></div>`:''}</div>`).join('')}
    <div class="trace"><b>TRACE</b><br>${Object.entries(data.trace||{}).map(([k,v])=>`${escapeHtml(k)}=${escapeHtml(v)}`).join('<br>')}<br><br><b>PERFORMANCE</b><br>${escapeHtml(JSON.stringify(data.performance||{},null,2))}<br><br><b>PERSISTENCE</b><br>${escapeHtml(JSON.stringify(data.persistence||{},null,2))}</div>
  </div>`;
  $('#evidenceDialog').showModal();
}
$('#closeEvidence').addEventListener('click',()=>$('#evidenceDialog').close());

function newCheck(){ resetIntakeForm(); lastResult=null; show('#home'); }
async function deleteCurrentCase(){
  if(!lastResult) return;
  const id=lastResult.case_id;
  const button=$('#deleteCase'); if(button){button.disabled=true; button.textContent='Đang xóa…';}
  try{
    const res=await fetch(`/api/v1/cases/${encodeURIComponent(id)}`,{method:'DELETE'});
    const data=await res.json().catch(()=>({}));
    if(!res.ok) throw new Error(data.detail||`Máy chủ chưa xác nhận xóa ca (HTTP ${res.status}).`);
    if(!['deleted','not_found'].includes(data.status)) throw new Error('Máy chủ chưa xác nhận trạng thái xóa ca.');
    localStorage.removeItem(LAST_CASE_KEY); lastResult=null; resetIntakeForm(); updateResumeCard(); show('#home');
    toast(data.status==='deleted'?'Ca đã được xóa khỏi máy chủ demo':'Ca không còn tồn tại trên máy chủ demo');
  }catch(err){
    toast(err.message||'Không thể xác nhận xóa ca. Vui lòng thử lại.');
    if(button){button.disabled=false; button.textContent='Xóa ca này';}
  }
}

async function updateResumeCard(){
  const id=localStorage.getItem(LAST_CASE_KEY); const card=$('#resumeCard');
  if(!id){card.hidden=true;return;}
  try{ const res=await fetch(`/api/v1/cases/${encodeURIComponent(id)}`); if(!res.ok) throw new Error(); lastResult=await res.json(); card.hidden=false; }
  catch(_){localStorage.removeItem(LAST_CASE_KEY); card.hidden=true;}
}
$('#resumeCase').addEventListener('click',()=>{if(lastResult){renderResult(lastResult);show('#result');}});

Promise.all([loadProfiles(),updateResumeCard()]).catch(()=>toast('Không tải được một phần dữ liệu demo'));

const exposureLabels={payment:'Đã chuyển tiền',credential:'Đã đọc/gửi mã hoặc mật khẩu cho người khác',control:'Đã cho người khác truy cập tài khoản hoặc điều khiển thiết bị'};
const stateLabels={YES:'Đã làm',NO:'Chưa làm',UNKNOWN:'Chưa rõ',CONFLICT:'Thông tin mâu thuẫn'};
function interpretationHtml(r){
 const sem=r.understood?.semantic;if(!sem)return '';
 const qs=sem.clarifications||[];
 return `<section class="result-block" aria-label="Xác nhận cách hiểu"><h3>Kiểm tra lại PAR đã hiểu đúng chưa</h3><p>Đây là cách hiểu có giới hạn từ lời bạn mô tả, chưa được xác minh độc lập.</p>
 <ul>${Object.entries(sem.exposure||{}).map(([k,v])=>`<li>${escapeHtml(exposureLabels[k])}: <strong>${escapeHtml(stateLabels[v]||v)}</strong></li>`).join('')}</ul>
 ${qs.map(q=>q.id==='exposure'?`<form id="clarifyForm"><p>${escapeHtml(q.prompt)}</p>${q.fields.map(f=>`<p><label>${escapeHtml(f.label)} <select name="${escapeHtml(f.key)}" aria-label="${escapeHtml(f.label)}">${q.options.map(o=>`<option value="${o}" ${o===f.value?'selected':''}>${escapeHtml(stateLabels[o])}</option>`).join('')}</select></label></p>`).join('')}<button class="secondary" type="submit" ${submittedInput?'':'disabled'}>Cập nhật câu trả lời</button></form>`:`<p>${escapeHtml(q.prompt)}</p><button class="secondary" id="editDescription">Bổ sung mô tả</button>`).join('')}
 ${!submittedInput&&qs.length?'<p>Ca được mở lại không lưu mô tả gốc. Hãy nhập lại tình huống để kiểm tra tiếp.</p>':''}
 <p>Nếu câu trả lời trái với mô tả trước đó, PAR giữ cảnh báo và ghi nhận mâu thuẫn.</p></section>`;
}
function bindClarification(){
 $('#editDescription')?.addEventListener('click',()=>{show('#intake');$('#situation').focus();});
 $('#clarifyForm')?.addEventListener('submit',async e=>{
  e.preventDefault();if(!submittedInput)return;const b=e.submitter;b.disabled=true;
  const answers=Object.fromEntries(new FormData(e.target));
  try{
   const res=await fetch('/api/v1/check',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...submittedInput,exposure_answers:answers})});
   const data=await res.json();if(!res.ok)throw new Error('Không cập nhật được. Bạn có thể quay lại mô tả.');
   exposureAnswers=answers;submittedCaseId=data.case_id;lastResult=data;localStorage.setItem(LAST_CASE_KEY,data.case_id);renderResult(data);
  }catch(err){toast(err.message);b.disabled=false;}
 });
}
