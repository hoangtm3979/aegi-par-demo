function renderResult(r){
  if(submittedCaseId!==r.case_id) submittedInput=null;
  const understood=[];
  if(r.understood?.domain) understood.push(r.understood.domain);
  if(r.understood?.claimed_identity) understood.push(r.understood.claimed_identity);
  (r.understood?.requested_actions||[]).forEach(a=>understood.push(a.replaceAll('_',' ')));
  if(r.understood?.action_state) understood.push(r.understood.action_state.replaceAll('_',' '));
  const perf=r.performance||{}; const pers=r.persistence||{};
  const degraded=Object.entries(r.capability||{}).filter(([_,v])=>['UNAVAILABLE','STALE','CONFLICTED'].includes(v));
  $('#resultMount').innerHTML=`
    <div class="result-hero">
      <div class="result-title-row"><span class="concern ${concernClass(r.concern_level)}">${escapeHtml(r.concern_label)}</span></div>
      <h2>${escapeHtml(r.headline)}</h2>
      ${r.redaction?.redacted?`<div class="redaction">PAR đã ẩn bí mật phát hiện trong mô tả: ${escapeHtml(r.redaction.types.join(', '))}.</div>`:''}
      ${degraded.length?`<div class="redaction">Một số nguồn chưa sử dụng được hoặc có thông tin mâu thuẫn: ${degraded.map(([k,v])=>`${escapeHtml(k)}=${escapeHtml(v)}`).join(' · ')}. Điều này không có nghĩa giao dịch an toàn.</div>`:''}
    </div>
    <div class="result-grid">
      <div class="result-block"><h3>Làm gì ngay</h3><ul>${li(r.actions)}</ul></div>
      <div class="result-block"><h3>Vì sao</h3><ul>${li(r.reasons)}</ul></div>
      <div class="result-block"><h3>Chưa xác minh</h3><ul>${li(r.unknowns)}</ul></div>
      <div class="result-block"><h3>Xác minh thế nào</h3><ul>${li(r.verification_steps)}</ul></div>
    </div>
    ${interpretationHtml(r)}
    <details class="result-block technical"><summary>Thông tin kỹ thuật của kết quả</summary><p>Mã: ${escapeHtml(r.case_id)} · ${escapeHtml(r.release)} · ${escapeHtml(r.action_class)} · Chính sách ${escapeHtml(r.trace?.policy_version)}</p><p>${understood.map(escapeHtml).join(" · ")}</p></details>
    <div class="result-actions"><button class="secondary" id="showEvidence">Xem nguồn và chi tiết đối chiếu</button><button class="secondary" id="newCheck">Kiểm tra mới</button><button class="secondary danger" id="deleteCase">Xóa ca này</button></div>
    <p class="disclaimer">${escapeHtml(r.disclaimer)} Thời gian xử lý trong chi tiết chỉ phản ánh bản demo, chưa phản ánh tích hợp nguồn thật.</p>`;
  bindClarification();
  $('#showEvidence').addEventListener('click',openEvidence);
  $('#newCheck').addEventListener('click',newCheck);
  $('#deleteCase').addEventListener('click',deleteCurrentCase);
}

async function openEvidence(){
  if(!lastResult)return;
  try{
  const res=await fetch(`/api/v1/cases/${encodeURIComponent(lastResult.case_id)}/evidence`); const data=await res.json();
  if(!res.ok){toast(data.detail||'Evidence không còn khả dụng'); return;}
  const sourceMap=Object.fromEntries((data.sources||[]).map(s=>[s.source_id,s]));
  $('#evidenceMount').innerHTML=`<div class="evidence-body">
    <div class="capability-grid">${Object.entries(data.capability||{}).map(([k,v])=>`<div><small>${escapeHtml(k)}</small><strong>${escapeHtml(v)}</strong></div>`).join('')}</div>
    ${data.evidence.map(e=>`<div class="evidence-item"><div class="evidence-top"><strong>${escapeHtml(e.kind)}</strong><span class="state ${stateClass(e.state)}">${escapeHtml(e.state)}</span></div><p><b>${escapeHtml(e.label)}</b><br>${escapeHtml(e.detail)}</p>${e.metadata?`<pre class="metadata">${escapeHtml(JSON.stringify(e.metadata,null,2))}</pre>`:''}${e.limitations?`<p><small>Giới hạn: ${escapeHtml(e.limitations)}</small></p>`:''}${e.source_id&&sourceMap[e.source_id]?`<div class="source-card"><small>${escapeHtml(sourceMap[e.source_id].authority_class)} · ${escapeHtml(sourceMap[e.source_id].published_at)}</small><br>${sourceMap[e.source_id].canonical_url?`<a href="${escapeHtml(safeUrl(sourceMap[e.source_id].canonical_url))}" target="_blank" rel="noopener">${escapeHtml(sourceMap[e.source_id].title)} ↗</a>`:`<strong>${escapeHtml(sourceMap[e.source_id].title)}</strong>`}<p>${escapeHtml(sourceMap[e.source_id].limitations||'')}</p></div>`:''}</div>`).join('')}
    <div class="trace"><b>TRACE</b><br>${Object.entries(data.trace||{}).map(([k,v])=>`${escapeHtml(k)}=${escapeHtml(v)}`).join('<br>')}<br><br><b>PERFORMANCE</b><br>${escapeHtml(JSON.stringify(data.performance||{},null,2))}<br><br><b>PERSISTENCE</b><br>${escapeHtml(JSON.stringify(data.persistence||{},null,2))}</div>
  </div>`;
  $('#evidenceDialog').showModal();
  }catch{toast('Không tải được nguồn. Vui lòng thử lại.');}
}
$('#closeEvidence').addEventListener('click',()=>$('#evidenceDialog').close());

function newCheck(){resetIntake();show('#home');}
async function deleteCurrentCase(){
  if(!lastResult)return;
  const id=lastResult.case_id, button=$('#deleteCase'); button.disabled=true;
  try{
    const res=await fetch(`/api/v1/cases/${encodeURIComponent(id)}`,{method:'DELETE'});
    if(!res.ok)throw new Error('Chưa xóa được kết quả trên máy chủ. Vui lòng thử lại.');
    if(localStorage.getItem(LAST_CASE_KEY)===id)localStorage.removeItem(LAST_CASE_KEY);
    resumeResult=null; newCheck(); updateResumeCard(); toast('Đã xóa kết quả này khỏi kho lưu tạm của demo.');
  }catch(err){toast(err.message||'Mất kết nối. Chưa xác nhận xóa kết quả.');button.disabled=false;}
}
async function updateResumeCard(){
  const id=localStorage.getItem(LAST_CASE_KEY),card=$('#resumeCard');
  if(!id){card.hidden=true;resumeResult=null;return;}
  try{
    const res=await fetch(`/api/v1/cases/${encodeURIComponent(id)}`);
    if(id!==localStorage.getItem(LAST_CASE_KEY))return;
    if(res.status===404){localStorage.removeItem(LAST_CASE_KEY);card.hidden=true;return;}
    if(!res.ok)throw new Error();
    resumeResult=await res.json();card.hidden=false;
  }catch{card.hidden=true;}
}
$('#resumeCase').addEventListener('click',()=>{if(resumeResult){lastResult=resumeResult;renderResult(lastResult);show('#result');}});

Promise.all([loadProfiles(),updateResumeCard()]).catch(()=>toast('Không tải được một phần dữ liệu demo'));
